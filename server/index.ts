import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';
import { db } from './db.js';
import {
  users, posts, comments, connections, messages, communities, stories, reports, pushSubscriptions
} from '../shared/schema.js';
import { eq, or, and, desc } from 'drizzle-orm';

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
    // Push notification to post author
    if (isLiking && post.authorId !== userId) {
      const liker = await db.select().from(users).where(eq(users.id, userId));
      if (liker.length) {
        sendPushToUser(post.authorId, {
          title: '❤️ New Like',
          body: `${liker[0].fullName} liked your post`,
          icon: '/icons/icon-192x192.png',
          tag: `like-${req.params.id}`,
          url: '/',
        });
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
    // Push notification to receiver
    const sender = await db.select().from(users).where(eq(users.id, senderId));
    if (sender.length) {
      sendPushToUser(receiverId, {
        title: '🤝 Connection Request',
        body: `${sender[0].fullName} wants to connect with you`,
        icon: '/icons/icon-192x192.png',
        tag: `conn-${senderId}`,
        url: '/',
      });
    }
    return res.json({ ...newConn[0], createdAt: newConn[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/connections/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await db.update(connections).set({ status }).where(eq(connections.id, req.params.id)).returning();
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
    // Push notification to receiver
    const sender = await db.select().from(users).where(eq(users.id, senderId));
    if (sender.length) {
      sendPushToUser(receiverId, {
        title: `💬 ${sender[0].fullName}`,
        body: content.length > 80 ? content.substring(0, 80) + '…' : content,
        icon: '/icons/icon-192x192.png',
        tag: `msg-${senderId}`,
        url: '/',
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
    const { name, description, icon, tags, category, creatorId } = req.body;
    const newComm = await db.insert(communities).values({
      id: generateId('comm'),
      name, description,
      icon: icon || 'Users',
      memberIds: creatorId ? [creatorId] : [],
      tags: tags || [],
      category: category || 'General',
      threads: [],
      resources: [],
    }).returning();
    return res.json({ ...newComm[0], createdAt: newComm[0].createdAt.toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/communities/:id', async (req, res) => {
  try {
    const { memberIds, threads, resources } = req.body;
    const found = await db.select().from(communities).where(eq(communities.id, req.params.id));
    if (!found.length) return res.status(404).json({ error: 'Community not found' });
    const updated = await db.update(communities).set({
      memberIds: memberIds ?? found[0].memberIds,
      threads: threads ?? found[0].threads,
      resources: resources ?? found[0].resources,
    }).where(eq(communities.id, req.params.id)).returning();
    return res.json({ ...updated[0], createdAt: updated[0].createdAt.toISOString() });
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
