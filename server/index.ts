import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { db } from './db.js';
import {
  users, posts, comments, connections, messages, communities, stories, reports, pushSubscriptions,
  notifications, projects, events, groupChats, groupMessages, collegeAnnouncements, attendanceSubjects
} from '../shared/schema.js';
import { eq, or, and, desc } from 'drizzle-orm';

// ── Brevo Transactional Email API (no IP restriction) ─────────────────────────
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@thenetwork.app';
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SMTP_PASS || '';

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'The Network', email: EMAIL_FROM_ADDRESS },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${txt}`);
  }
}

// ── VAPID setup ───────────────────────────────────────────────────────────────
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || 'BMFhS7bR4UacelWJY8tepeccTdJW-FXMCDnFsNwzpWuyRS3n_-ayeRde3XSIvLt83L5WssZXn44RMcL5zPzQxhQ';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'E6qDXPRcyZ9IB2nOOe15bPSWeyLGNyXlOLW54RHAUK0';
const VAPID_EMAIL   = process.env.VAPID_EMAIL       || 'mailto:admin@thenetwork.app';
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

async function sendPushToUser(userId: string, payload: object) {
  try {
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    const msg = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map(s =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, msg)
          .catch(async (err: any) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint));
            }
          })
      )
    );
  } catch {}
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().split('-')[0]}`;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'network_salt_2026').digest('hex');
}

function toUserProfile(u: typeof users.$inferSelect) {
  const { passwordHash: _, ...rest } = u;
  return {
    ...rest,
    collegeAdminOf: rest.collegeAdminOf ?? null,
    createdAt: rest.createdAt.toISOString(),
  };
}

function toPost(p: typeof posts.$inferSelect, postComments: any[]) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    comments: postComments.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

// ─── NOTIFICATION HELPER ─────────────────────────────────────────────────────

async function createNotification(userId: string, actorId: string, type: string, title: string, body: string) {
  if (userId === actorId) return; // Don't notify yourself
  try {
    await db.insert(notifications).values({
      id: generateId('notif'),
      userId, actorId, type, title, body,
      isRead: false,
    });
  } catch (_) {}
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, college, branch, year, email, password, avatar } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser = await db.insert(users).values({
      id: generateId('user'),
      fullName,
      college,
      branch,
      year: Number(year) || 1,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      avatar: avatar || initials,
      aboutMe: '',
      interests: [],
      skills: [],
      lookingFor: [],
      isVerified: false,
      isSuspended: false,
      role: 'student',
      privacySettings: { showEmail: true, onlyAllowVerifiedConnections: false, hideProfileFromSearch: false },
    }).returning();
    return res.json({ user: toUserProfile(newUser[0]) });
  } catch (err: any) {
    console.error('register error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const found = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (found.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = found[0];
    if (user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ error: 'Your account has been suspended.' });
    }
    await db.update(users).set({ isVerified: true }).where(eq(users.id, user.id));
    const updated = { ...user, isVerified: true };
    return res.json({ user: toUserProfile(updated) });
  } catch (err: any) {
    console.error('login error', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── USERS ───────────────────────────────────────────────────────────────────

app.get('/api/users', async (_req, res) => {
  try {
    const all = await db.select().from(users);
    return res.json(all.map(toUserProfile));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const found = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'User not found' });
    return res.json(toUserProfile(found[0]));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { fullName, college, branch, year, aboutMe, interests, skills, lookingFor, privacySettings, avatar } = req.body;
    const updated = await db.update(users).set({
      fullName, college, branch, year, aboutMe, interests, skills, lookingFor, privacySettings, avatar
    }).where(eq(users.id, req.params.id)).returning();
    if (!updated.length) return res.status(404).json({ error: 'User not found' });
    return res.json(toUserProfile(updated[0]));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    const updated = await db.update(users)
      .set({ passwordHash: hashPassword(newPassword) })
      .where(eq(users.id, req.params.id))
      .returning();
    if (!updated.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/suspend', async (req, res) => {
  try {
    const found = await db.select().from(users).where(eq(users.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'User not found' });
    const newState = !found[0].isSuspended;
    const updated = await db.update(users).set({ isSuspended: newState }).where(eq(users.id, req.params.id)).returning();
    return res.json(toUserProfile(updated[0]));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── POSTS ───────────────────────────────────────────────────────────────────

app.get('/api/posts', async (_req, res) => {
  try {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
    const allComments = await db.select().from(comments).orderBy(comments.createdAt);
    const result = allPosts.map(p => toPost(p, allComments.filter(c => c.postId === p.id)));
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { authorId, content, academicTag, communityId, projectTitle, postImage, feeling } = req.body;
    const newPost = await db.insert(posts).values({
      id: generateId('post'),
      authorId,
      content,
      likes: [],
      academicTag: academicTag || null,
      communityId: communityId || null,
      projectTitle: projectTitle || null,
      postImage: postImage || null,
      feeling: feeling || null,
    }).returning();

    // Push notification to all accepted connections of the author
    const author = await db.select().from(users).where(eq(users.id, authorId));
    if (author.length) {
      const authorName = author[0].fullName;
      const bodyPreview = content.length > 80 ? content.substring(0, 80) + '…' : content;
      const authorConns = await db.select().from(connections).where(
        and(
          or(eq(connections.senderId, authorId), eq(connections.receiverId, authorId)),
          eq(connections.status, 'accepted')
        )
      );
      for (const conn of authorConns) {
        const recipientId = conn.senderId === authorId ? conn.receiverId : conn.senderId;
        sendPushToUser(recipientId, {
          title: `📢 ${authorName} posted`,
          body: bodyPreview,
          icon: '/icons/icon-192x192.png',
          tag: `post-${newPost[0].id}`,
          view: 'feed',
          data: { userId: authorId },
        });
      }
    }

    return res.json(toPost(newPost[0], []));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await db.delete(posts).where(eq(posts.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(posts).where(eq(posts.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Post not found' });
    const post = found[0];
    const likesArr = (post.likes as string[]) || [];
    const isLiking = !likesArr.includes(userId);
    const newLikes = isLiking ? [...likesArr, userId] : likesArr.filter(id => id !== userId);
    const updated = await db.update(posts).set({ likes: newLikes }).where(eq(posts.id, req.params.id)).returning();
    const postComments = await db.select().from(comments).where(eq(comments.postId, req.params.id));
    // Push notification + in-app notification to post author
    if (isLiking && post.authorId !== userId) {
      const liker = await db.select().from(users).where(eq(users.id, userId));
      if (liker.length) {
        sendPushToUser(post.authorId, {
          title: '❤️ New Like',
          body: `${liker[0].fullName} liked your post`,
          icon: '/icons/icon-192x192.png',
          tag: `like-${req.params.id}`,
          view: 'feed',
        });
        await createNotification(post.authorId, userId, 'like', '❤️ New Like', `${liker[0].fullName} liked your post`);
      }
    }
    return res.json(toPost(updated[0], postComments));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { authorId, content } = req.body;
    const newComment = await db.insert(comments).values({
      id: generateId('comment'),
      postId: req.params.id,
      authorId,
      content,
    }).returning();
    // Notify post author
    const post = await db.select().from(posts).where(eq(posts.id, req.params.id));
    if (post.length && post[0].authorId !== authorId) {
      const commenter = await db.select().from(users).where(eq(users.id, authorId));
      if (commenter.length) {
        await createNotification(post[0].authorId, authorId, 'comment', '💬 New Comment', `${commenter[0].fullName} commented on your post`);
      }
    }
    return res.json({ ...newComment[0], createdAt: newComment[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── CONNECTIONS ─────────────────────────────────────────────────────────────

app.get('/api/connections', async (_req, res) => {
  try {
    const all = await db.select().from(connections).orderBy(desc(connections.createdAt));
    return res.json(all.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/connections', async (req, res) => {
  try {
    const { senderId, receiverId, type, message } = req.body;
    const newConn = await db.insert(connections).values({
      id: generateId('conn'),
      senderId, receiverId, type, message: message || '',
      status: 'pending',
    }).returning();
    const sender = await db.select().from(users).where(eq(users.id, senderId));
    if (sender.length) {
      sendPushToUser(receiverId, {
        title: '🤝 Connection Request',
        body: `${sender[0].fullName} wants to connect with you`,
        icon: '/icons/icon-192x192.png',
        tag: `conn-${senderId}`,
        view: 'dashboard',
      });
      await createNotification(receiverId, senderId, 'connection_request', '🤝 Connection Request', `${sender[0].fullName} wants to connect with you`);
    }
    return res.json({ ...newConn[0], createdAt: newConn[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/connections/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const found = await db.select().from(connections).where(eq(connections.id, req.params.id));
    const updated = await db.update(connections).set({ status }).where(eq(connections.id, req.params.id)).returning();
    // Notify sender when accepted
    if (status === 'accepted' && found.length) {
      const receiver = await db.select().from(users).where(eq(users.id, found[0].receiverId));
      if (receiver.length) {
        await createNotification(found[0].senderId, found[0].receiverId, 'connection_accepted', '✅ Connection Accepted', `${receiver[0].fullName} accepted your connection request`);
        sendPushToUser(found[0].senderId, {
          title: '✅ Connection Accepted',
          body: `${receiver[0].fullName} accepted your connection request`,
          icon: '/icons/icon-192x192.png',
          tag: `conn-accepted-${found[0].receiverId}`,
          view: 'explore',
          data: { userId: found[0].receiverId },
        });
      }
    }
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── MESSAGES ────────────────────────────────────────────────────────────────

app.get('/api/messages', async (_req, res) => {
  try {
    const all = await db.select().from(messages).orderBy(messages.createdAt);
    return res.json(all.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const newMsg = await db.insert(messages).values({
      id: generateId('msg'),
      senderId, receiverId, content,
      isRead: false,
    }).returning();
    const sender = await db.select().from(users).where(eq(users.id, senderId));
    if (sender.length) {
      await createNotification(receiverId, senderId, 'message', `💬 ${sender[0].fullName}`, content.length > 80 ? content.substring(0, 80) + '…' : content);
      sendPushToUser(receiverId, {
        title: `💬 ${sender[0].fullName}`,
        body: content.length > 80 ? content.substring(0, 80) + '…' : content,
        icon: '/icons/icon-192x192.png',
        tag: `msg-${senderId}`,
        view: 'messages',
        data: { userId: senderId },
      });
    }
    return res.json({ ...newMsg[0], createdAt: newMsg[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/messages/read', async (req, res) => {
  try {
    const { receiverId, senderId } = req.body;
    await db.update(messages).set({ isRead: true })
      .where(and(eq(messages.receiverId, receiverId), eq(messages.senderId, senderId)));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────

app.get('/api/communities', async (_req, res) => {
  try {
    const all = await db.select().from(communities).orderBy(communities.createdAt);
    return res.json(all.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/communities', async (req, res) => {
  try {
    const { name, description, icon, tags, category, creatorId, college } = req.body;
    const newComm = await db.insert(communities).values({
      id: generateId('comm'),
      name, description,
      icon: icon || 'Users',
      memberIds: creatorId ? [creatorId] : [],
      tags: tags || [],
      category: category || 'General',
      threads: [],
      resources: [],
      college: college || null,
      creatorId: creatorId || null,
    }).returning();
    return res.json({ ...newComm[0], createdAt: newComm[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/communities/:id', async (req, res) => {
  try {
    const { memberIds, threads, resources, name, description, tags, category } = req.body;
    const found = await db.select().from(communities).where(eq(communities.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Community not found' });
    const updated = await db.update(communities).set({
      memberIds: memberIds ?? found[0].memberIds,
      threads: threads ?? found[0].threads,
      resources: resources ?? found[0].resources,
      name: name ?? found[0].name,
      description: description ?? found[0].description,
      tags: tags ?? found[0].tags,
      category: category ?? found[0].category,
    }).where(eq(communities.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/communities/:id', async (req, res) => {
  try {
    await db.delete(communities).where(eq(communities.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── EVENTS ──────────────────────────────────────────────────────────────────

app.get('/api/events', async (_req, res) => {
  try {
    const all = await db.select().from(events).orderBy(desc(events.createdAt));
    return res.json(all.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, description, category, date, time, venue, organizer, organizerId, college, maxSeats, isOnline, link } = req.body;
    const created = await db.insert(events).values({
      id: generateId('evt'),
      title, description,
      category: category || 'General',
      date, time: time || '',
      venue: venue || '',
      organizer: organizer || '',
      organizerId,
      college: college || '',
      registeredIds: [],
      maxSeats: maxSeats || null,
      isOnline: isOnline || false,
      link: link || '',
    }).returning();
    return res.json({ ...created[0], createdAt: created[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const found = await db.select().from(events).where(eq(events.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Event not found' });
    const { title, description, category, date, time, venue, organizer, college, maxSeats, isOnline, link } = req.body;
    const updated = await db.update(events).set({
      title: title ?? found[0].title,
      description: description ?? found[0].description,
      category: category ?? found[0].category,
      date: date ?? found[0].date,
      time: time ?? found[0].time,
      venue: venue ?? found[0].venue,
      organizer: organizer ?? found[0].organizer,
      college: college ?? found[0].college,
      maxSeats: maxSeats ?? found[0].maxSeats,
      isOnline: isOnline ?? found[0].isOnline,
      link: link ?? found[0].link,
    }).where(eq(events.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(events).where(eq(events.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Event not found' });
    const ids = found[0].registeredIds as string[];
    if (!ids.includes(userId)) {
      const updated = await db.update(events).set({ registeredIds: [...ids, userId] }).where(eq(events.id, req.params.id)).returning();
      return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
    }
    return res.json({ ...found[0], createdAt: found[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id/unregister', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(events).where(eq(events.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Event not found' });
    const ids = (found[0].registeredIds as string[]).filter((id: string) => id !== userId);
    const updated = await db.update(events).set({ registeredIds: ids }).where(eq(events.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await db.delete(events).where(eq(events.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── STORIES ─────────────────────────────────────────────────────────────────

app.get('/api/stories', async (_req, res) => {
  try {
    const all = await db.select().from(stories).orderBy(desc(stories.createdAt));
    return res.json(all.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/stories', async (req, res) => {
  try {
    const { authorId, content, image } = req.body;
    const newStory = await db.insert(stories).values({
      id: generateId('story'),
      authorId, content,
      image: image || null,
      viewedBy: [],
      reactions: {},
    }).returning();
    return res.json({ ...newStory[0], createdAt: newStory[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/stories/:id/react', async (req, res) => {
  try {
    const { emoji } = req.body;
    const found = await db.select().from(stories).where(eq(stories.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Story not found' });
    const current = (found[0].reactions as Record<string, number>) || {};
    const updated = await db.update(stories).set({
      reactions: { ...current, [emoji]: (current[emoji] || 0) + 1 }
    }).where(eq(stories.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────

app.get('/api/reports', async (_req, res) => {
  try {
    const all = await db.select().from(reports).orderBy(desc(reports.createdAt));
    return res.json(all.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason, description } = req.body;
    const newReport = await db.insert(reports).values({
      id: generateId('rep'),
      reporterId, reportedUserId,
      reason, description: description || '',
      status: 'pending',
    }).returning();
    return res.json({ ...newReport[0], createdAt: newReport[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await db.update(reports).set({ status }).where(eq(reports.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── OTP STORE (in-memory, 10 min TTL) ───────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number; purpose: 'login' | 'register'; data?: any }>();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, purpose, data } = req.body as { email: string; purpose: 'register' | 'forgot-password'; data?: any };
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // OTP is only for registration and password reset — never for login
    if (purpose === 'forgot-password') {
      const found = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
      if (found.length === 0) return res.status(404).json({ error: 'No account found with this email' });
      if (found[0].isSuspended) return res.status(403).json({ error: 'Your account has been suspended.' });
    }
    if (purpose !== 'register' && purpose !== 'forgot-password') {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    const otp = generateOTP();
    otpStore.set(email.toLowerCase().trim(), { otp, expiresAt: Date.now() + 10 * 60 * 1000, purpose, data });

    await sendEmail({
      to: email,
      subject: `Your OTP for The Network — ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">The Network</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Campus Co-founder Hub</p>
          </div>
          <div style="background: #f9f9fb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px 24px; text-align: center;">
            <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">Your one-time verification code is:</p>
            <div style="background: white; border: 2px solid #6366f1; border-radius: 12px; padding: 16px 24px; display: inline-block; margin: 0 0 16px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #6366f1; font-family: monospace;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
        </div>
      `,
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error('send-otp error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/send-email-change-otp', async (req, res) => {
  try {
    const { currentEmail, newEmail } = req.body as { currentEmail: string; newEmail: string };
    if (!currentEmail || !newEmail) return res.status(400).json({ error: 'Both current and new email are required' });
    const current = currentEmail.toLowerCase().trim();
    const next = newEmail.toLowerCase().trim();
    const found = await db.select().from(users).where(eq(users.email, current));
    if (found.length === 0) return res.status(404).json({ error: 'No account found with that institute email' });
    if (found[0].isSuspended) return res.status(403).json({ error: 'Your account has been suspended.' });
    const taken = await db.select().from(users).where(eq(users.email, next));
    if (taken.length > 0) return res.status(409).json({ error: 'That email is already used by another account' });
    const otp = generateOTP();
    otpStore.set(`emailchange:${current}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000, purpose: 'login', data: { currentEmail: current, newEmail: next } });
    await sendEmail({
      to: next,
      subject: `Verify your new email for The Network — ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 20px 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">The Network</h1>
          </div>
          <div style="background: #f9f9fb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px 24px; text-align: center;">
            <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">Your email change verification code is:</p>
            <div style="background: white; border: 2px solid #6366f1; border-radius: 12px; padding: 16px 24px; display: inline-block; margin: 0 0 16px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #6366f1; font-family: monospace;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Expires in <strong>10 minutes</strong>. Do not share it.</p>
          </div>
        </div>`,
    });
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('send-email-change-otp error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/confirm-email-change', async (req, res) => {
  try {
    const { currentEmail, otp } = req.body as { currentEmail: string; otp: string };
    if (!currentEmail || !otp) return res.status(400).json({ error: 'Current email and OTP are required' });
    const key = `emailchange:${currentEmail.toLowerCase().trim()}`;
    const record = otpStore.get(key);
    if (!record) return res.status(400).json({ error: 'No OTP requested. Please request a new one.' });
    if (Date.now() > record.expiresAt) { otpStore.delete(key); return res.status(400).json({ error: 'OTP expired. Please request a new one.' }); }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    otpStore.delete(key);
    const { currentEmail: current, newEmail } = record.data as { currentEmail: string; newEmail: string };
    const updated = await db.update(users).set({ email: newEmail }).where(eq(users.email, current)).returning();
    if (!updated.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true, email: newEmail });
  } catch (err: any) {
    console.error('confirm-email-change error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body as { email: string; otp: string; newPassword: string };
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);
    if (!record) return res.status(400).json({ error: 'No OTP requested. Please request a new one.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    if (record.purpose !== 'forgot-password') return res.status(400).json({ error: 'Invalid OTP purpose.' });
    otpStore.delete(key);
    const found = await db.select().from(users).where(eq(users.email, key));
    if (!found.length) return res.status(404).json({ error: 'User not found' });
    await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, found[0].id));
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };
    const key = email.toLowerCase().trim();
    const record = otpStore.get(key);

    if (!record) return res.status(400).json({ error: 'No OTP requested for this email. Please request a new one.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.trim()) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });

    otpStore.delete(key);

    // OTP verify is only for registration (and forgot-password is handled separately)
    if (record.purpose !== 'register') {
      return res.status(400).json({ error: 'Invalid OTP purpose' });
    }

    const d = record.data;
    const existing = await db.select().from(users).where(eq(users.email, key));
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const initials = d.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    const newUser = await db.insert(users).values({
      id: generateId('user'),
      fullName: d.fullName,
      college: d.college,
      branch: d.branch,
      year: Number(d.year) || 1,
      email: key,
      passwordHash: hashPassword(d.password),
      avatar: d.avatar || initials,
      aboutMe: '',
      interests: [],
      skills: [],
      lookingFor: [],
      isVerified: true,
      isSuspended: false,
      role: 'student',
      privacySettings: { showEmail: true, onlyAllowVerifiedConnections: false, hideProfileFromSearch: false },
    }).returning();
    return res.json({ user: toUserProfile(newUser[0]) });
  } catch (err: any) {
    console.error('verify-otp error', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── EMAIL ───────────────────────────────────────────────────────────────────

app.post('/api/admin/send-email', async (req, res) => {
  try {
    const { to, subject, body, sendToAll } = req.body as {
      to?: string[];
      subject: string;
      body: string;
      sendToAll?: boolean;
    };

    if (!subject || !body) {
      return res.status(400).json({ error: 'subject and body are required' });
    }

    let recipients: string[] = [];
    if (sendToAll) {
      const allUsers = await db.select({ email: users.email }).from(users);
      recipients = allUsers.map(u => u.email).filter(Boolean);
    } else {
      recipients = (to || []).filter(Boolean);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients found' });
    }

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    // Send in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (email) => {
          try {
            await sendEmail({
              to: email,
              subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <div style="background: linear-gradient(135deg, #6366f1, #a855f7); padding: 20px 24px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">The Network</h1>
                    <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 12px;">Campus Co-founder Hub</p>
                  </div>
                  <div style="background: #f9f9fb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
                    <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #374151;">${body.replace(/\n/g, '<br/>')}</div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #9ca3af; margin: 0;">This email was sent from The Network platform. Please do not reply to this email.</p>
                  </div>
                </div>
              `,
            });
            results.sent++;
          } catch (err: any) {
            results.failed++;
            results.errors.push(`${email}: ${err.message}`);
          }
        })
      );
    }

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── BULK USER IMPORT ────────────────────────────────────────────────────────

app.post('/api/admin/import-users', async (req, res) => {
  try {
    const { rows } = req.body as {
      rows: { fullName: string; email: string; password: string; college?: string; branch?: string; year?: number; role?: string }[]
    };
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'rows array is required' });
    }

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      if (!row.email || !row.fullName) {
        results.errors.push(`Skipped row — missing name or email: ${JSON.stringify(row)}`);
        results.skipped++;
        continue;
      }
      try {
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, row.email.toLowerCase().trim()));
        if (existing.length > 0) {
          results.skipped++;
          continue;
        }
        const initials = row.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
        await db.insert(users).values({
          id: generateId('user'),
          fullName: row.fullName.trim(),
          college: row.college?.trim() || '',
          branch: row.branch?.trim() || '',
          year: Number(row.year) || 1,
          email: row.email.toLowerCase().trim(),
          passwordHash: hashPassword(row.password || row.email.split('@')[0]),
          avatar: initials,
          aboutMe: '',
          interests: [],
          skills: [],
          lookingFor: [],
          isVerified: false,
          isSuspended: false,
          role: (row.role === 'admin' ? 'admin' : 'student') as 'student' | 'admin',
          privacySettings: { showEmail: true, onlyAllowVerifiedConnections: false, hideProfileFromSearch: false },
        });
        results.inserted++;
      } catch (rowErr: any) {
        results.errors.push(`${row.email}: ${rowErr.message}`);
        results.skipped++;
      }
    }

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── SEED COMMUNITIES (first run) ────────────────────────────────────────────

app.post('/api/seed/communities', async (req, res) => {
  try {
    const existing = await db.select().from(communities);
    if (existing.length > 0) return res.json({ skipped: true, count: existing.length });
    const { chapters } = req.body;
    if (!chapters || !Array.isArray(chapters)) return res.status(400).json({ error: 'chapters array required' });
    const inserted = await db.insert(communities).values(
      chapters.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        icon: ch.icon || 'Users',
        memberIds: ch.memberIds || [],
        tags: ch.tags || [],
        category: ch.category || 'General',
        threads: ch.threads || [],
        resources: ch.resources || [],
      }))
    ).returning();
    return res.json({ seeded: inserted.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const all = await db.select().from(notifications)
      .where(eq(notifications.userId, req.params.userId))
      .orderBy(desc(notifications.createdAt));
    return res.json(all.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, req.params.userId));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── PROJECTS ────────────────────────────────────────────────────────────────

app.get('/api/projects', async (_req, res) => {
  try {
    const all = await db.select().from(projects).orderBy(desc(projects.createdAt));
    return res.json(all.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { title, description, creatorId, stage, tags, lookingFor } = req.body;
    const newProject = await db.insert(projects).values({
      id: generateId('proj'),
      title, description, creatorId,
      stage: stage || 'Idea',
      tags: tags || [],
      lookingFor: lookingFor || [],
      memberIds: [creatorId],
    }).returning();
    return res.json({ ...newProject[0], createdAt: newProject[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { title, description, stage, tags, lookingFor } = req.body;
    const found = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Project not found' });
    const updated = await db.update(projects).set({
      title: title ?? found[0].title,
      description: description ?? found[0].description,
      stage: stage ?? found[0].stage,
      tags: tags ?? found[0].tags,
      lookingFor: lookingFor ?? found[0].lookingFor,
    }).where(eq(projects.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Project not found' });
    const memberIds = (found[0].memberIds as string[]) || [];
    if (!memberIds.includes(userId)) {
      const updated = await db.update(projects).set({ memberIds: [...memberIds, userId] }).where(eq(projects.id, req.params.id)).returning();
      return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
    }
    return res.json({ ...found[0], createdAt: found[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id/leave', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Project not found' });
    const memberIds = ((found[0].memberIds as string[]) || []).filter(id => id !== userId);
    const updated = await db.update(projects).set({ memberIds }).where(eq(projects.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GROUP CHATS ─────────────────────────────────────────────────────────────

app.get('/api/group-chats', async (_req, res) => {
  try {
    const all = await db.select().from(groupChats).orderBy(desc(groupChats.createdAt));
    return res.json(all.map(g => ({ ...g, createdAt: g.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/group-chats', async (req, res) => {
  try {
    const { name, type, creatorId, college, branch, inviteUserIds } = req.body;
    if (!name || !creatorId || !college) return res.status(400).json({ error: 'Missing fields' });
    const pending = (inviteUserIds || []).filter((id: string) => id !== creatorId);
    const created = await db.insert(groupChats).values({
      id: generateId('grp'),
      name, type: type || 'fun',
      creatorId, college,
      branch: branch || null,
      memberIds: [creatorId],
      pendingIds: pending,
    }).returning();
    // Notify invited users
    for (const uid of pending) {
      await createNotification(uid, creatorId, 'connection_request', '👥 Group Invite', `You've been invited to join "${name}"`);
    }
    return res.json({ ...created[0], createdAt: created[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/group-chats/:id/accept', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const g = found[0];
    const members = (g.memberIds as string[]) || [];
    const pending = ((g.pendingIds as string[]) || []).filter(id => id !== userId);
    if (!members.includes(userId)) {
      const updated = await db.update(groupChats).set({
        memberIds: [...members, userId],
        pendingIds: pending,
      }).where(eq(groupChats.id, req.params.id)).returning();
      return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
    }
    return res.json({ ...g, createdAt: g.createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/group-chats/:id/decline', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const g = found[0];
    const pending = ((g.pendingIds as string[]) || []).filter(id => id !== userId);
    const updated = await db.update(groupChats).set({ pendingIds: pending }).where(eq(groupChats.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/group-chats/:id/invite', async (req, res) => {
  try {
    const { inviteUserIds, actorId } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const g = found[0];
    const members = (g.memberIds as string[]) || [];
    const pending = (g.pendingIds as string[]) || [];
    const newPending = [...new Set([...pending, ...(inviteUserIds || []).filter((id: string) => !members.includes(id))])];
    const updated = await db.update(groupChats).set({ pendingIds: newPending }).where(eq(groupChats.id, req.params.id)).returning();
    for (const uid of inviteUserIds || []) {
      await createNotification(uid, actorId, 'connection_request', '👥 Group Invite', `You've been invited to join "${g.name}"`);
    }
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/group-chats/:id/add-member', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const g = found[0];
    const members = (g.memberIds as string[]) || [];
    if (members.includes(userId)) return res.json({ ...g, createdAt: g.createdAt.toISOString() });
    const updated = await db.update(groupChats).set({
      memberIds: [...members, userId],
      pendingIds: ((g.pendingIds as string[]) || []).filter((id: string) => id !== userId),
    }).where(eq(groupChats.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/group-chats/:id/remove-member', async (req, res) => {
  try {
    const { userId } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const g = found[0];
    const updated = await db.update(groupChats).set({
      memberIds: ((g.memberIds as string[]) || []).filter((id: string) => id !== userId),
      pendingIds: ((g.pendingIds as string[]) || []).filter((id: string) => id !== userId),
    }).where(eq(groupChats.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/group-chats/:id', async (req, res) => {
  try {
    await db.delete(groupMessages).where(eq(groupMessages.groupId, req.params.id));
    await db.delete(groupChats).where(eq(groupChats.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/group-chats/:id/messages', async (req, res) => {
  try {
    const msgs = await db.select().from(groupMessages)
      .where(eq(groupMessages.groupId, req.params.id))
      .orderBy(groupMessages.createdAt);
    return res.json(msgs.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/group-chats/:id/messages', async (req, res) => {
  try {
    const { senderId, content } = req.body;
    const found = await db.select().from(groupChats).where(eq(groupChats.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Group not found' });
    const created = await db.insert(groupMessages).values({
      id: generateId('gmsg'),
      groupId: req.params.id,
      senderId, content,
    }).returning();
    return res.json({ ...created[0], createdAt: created[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { userId, endpoint, p256dh, auth } = req.body;
    if (!userId || !endpoint || !p256dh || !auth) return res.status(400).json({ error: 'Missing fields' });
    await db.insert(pushSubscriptions).values({
      id: generateId('psub'),
      userId, endpoint, p256dh, auth,
    }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh, auth } });
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/push/subscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── COLLEGE ADMIN ────────────────────────────────────────────────────────────

// Assign or revoke college admin (super-admin only)
app.put('/api/admin/college-admin', async (req, res) => {
  try {
    const { userId, college } = req.body; // college = null to revoke
    const updated = await db.update(users)
      .set({
        role: college ? 'college_admin' : 'student',
        collegeAdminOf: college || null,
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updated.length) return res.status(404).json({ error: 'User not found' });
    return res.json(toUserProfile(updated[0]));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get announcements for a college
app.get('/api/college-announcements/:college', async (req, res) => {
  try {
    const college = decodeURIComponent(req.params.college);
    const all = await db.select().from(collegeAnnouncements)
      .where(eq(collegeAnnouncements.college, college))
      .orderBy(desc(collegeAnnouncements.createdAt));
    return res.json(all.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create announcement
app.post('/api/college-announcements', async (req, res) => {
  try {
    const { college, authorId, title, body, isPinned } = req.body;
    if (!college || !authorId || !title || !body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const created = await db.insert(collegeAnnouncements).values({
      id: generateId('ann'),
      college, authorId, title, body,
      isPinned: isPinned || false,
    }).returning();
    return res.json({ ...created[0], createdAt: created[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update announcement (pin/unpin or edit)
app.put('/api/college-announcements/:id', async (req, res) => {
  try {
    const { title, body, isPinned } = req.body;
    const found = await db.select().from(collegeAnnouncements).where(eq(collegeAnnouncements.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Not found' });
    const updated = await db.update(collegeAnnouncements).set({
      title: title ?? found[0].title,
      body: body ?? found[0].body,
      isPinned: isPinned ?? found[0].isPinned,
    }).where(eq(collegeAnnouncements.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete announcement
app.delete('/api/college-announcements/:id', async (req, res) => {
  try {
    await db.delete(collegeAnnouncements).where(eq(collegeAnnouncements.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── ATTENDANCE TRACKER ───────────────────────────────────────────────────────

app.get('/api/attendance/:userId', async (req, res) => {
  try {
    const rows = await db.select().from(attendanceSubjects)
      .where(eq(attendanceSubjects.userId, req.params.userId))
      .orderBy(attendanceSubjects.createdAt);
    return res.json(rows);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance', async (req, res) => {
  try {
    const { userId, name, targetPercent } = req.body;
    const created = await db.insert(attendanceSubjects).values({
      id: generateId('att'),
      userId, name,
      totalClasses: 0,
      presentClasses: 0,
      targetPercent: targetPercent ?? 75,
    }).returning();
    return res.json(created[0]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.put('/api/attendance/:id/mark', async (req, res) => {
  try {
    const { present } = req.body;
    const found = await db.select().from(attendanceSubjects).where(eq(attendanceSubjects.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Not found' });
    const s = found[0];
    const updated = await db.update(attendanceSubjects).set({
      totalClasses: s.totalClasses + 1,
      presentClasses: present ? s.presentClasses + 1 : s.presentClasses,
    }).where(eq(attendanceSubjects.id, req.params.id)).returning();
    return res.json(updated[0]);
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await db.delete(attendanceSubjects).where(eq(attendanceSubjects.id, req.params.id));
    return res.json({ ok: true });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// ─── BATCH GROUP AUTO-ENSURE ──────────────────────────────────────────────────

app.post('/api/batch-group/ensure', async (req, res) => {
  try {
    const { userId } = req.body;
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    const u = userRows[0];

    const batchName = `${u.college} · ${u.branch} · Year ${u.year}`;
    const all = await db.select().from(groupChats);
    let batchGroup = all.find(g => g.type === 'batch' && g.name === batchName);

    if (!batchGroup) {
      const created = await db.insert(groupChats).values({
        id: generateId('batch'),
        name: batchName,
        type: 'batch',
        creatorId: userId,
        college: u.college,
        branch: u.branch ?? null,
        memberIds: [userId],
        pendingIds: [],
      }).returning();
      batchGroup = created[0];
    } else {
      const members = (batchGroup.memberIds as string[]) || [];
      if (!members.includes(userId)) {
        const updated = await db.update(groupChats)
          .set({ memberIds: [...members, userId] })
          .where(eq(groupChats.id, batchGroup.id))
          .returning();
        batchGroup = updated[0];
      }
    }
    return res.json({ ...batchGroup, createdAt: batchGroup.createdAt.toISOString() });
  } catch (err: any) { return res.status(500).json({ error: err.message }); }
});

// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 3001);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
