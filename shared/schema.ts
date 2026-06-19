import { pgTable, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  actorId: text('actor_id').notNull(),
  type: text('type').notNull(), // 'like' | 'comment' | 'connection_request' | 'connection_accepted' | 'message'
  title: text('title').notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  creatorId: text('creator_id').notNull(),
  stage: text('stage').notNull().default('Idea'),
  tags: jsonb('tags').notNull().default([]),
  lookingFor: jsonb('looking_for').notNull().default([]),
  memberIds: jsonb('member_ids').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  college: text('college').notNull(),
  branch: text('branch').notNull(),
  year: integer('year').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar').notNull(),
  aboutMe: text('about_me').notNull().default(''),
  interests: jsonb('interests').notNull().default([]),
  skills: jsonb('skills').notNull().default([]),
  lookingFor: jsonb('looking_for').notNull().default([]),
  isVerified: boolean('is_verified').notNull().default(false),
  isSuspended: boolean('is_suspended').notNull().default(false),
  role: text('role').notNull().default('student'),
  privacySettings: jsonb('privacy_settings').notNull().default({
    showEmail: true,
    onlyAllowVerifiedConnections: false,
    hideProfileFromSearch: false
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  likes: jsonb('likes').notNull().default([]),
  communityId: text('community_id'),
  academicTag: text('academic_tag'),
  projectTitle: text('project_title'),
  postImage: text('post_image'),
  feeling: text('feeling'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const connections = pgTable('connections', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  message: text('message').notNull().default(''),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const communities = pgTable('communities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull().default('Users'),
  memberIds: jsonb('member_ids').notNull().default([]),
  tags: jsonb('tags').notNull().default([]),
  category: text('category').notNull().default('General'),
  threads: jsonb('threads').notNull().default([]),
  resources: jsonb('resources').notNull().default([]),
  college: text('college'),
  creatorId: text('creator_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  image: text('image'),
  content: text('content').notNull(),
  viewedBy: jsonb('viewed_by').notNull().default([]),
  reactions: jsonb('reactions').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reportedUserId: text('reported_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  stories: many(stories),
  sentConnections: many(connections, { relationName: 'sender' }),
  receivedConnections: many(connections, { relationName: 'receiver' }),
  sentMessages: many(messages, { relationName: 'msgSender' }),
  receivedMessages: many(messages, { relationName: 'msgReceiver' }),
  filedReports: many(reports, { relationName: 'reporter' }),
  receivedReports: many(reports, { relationName: 'reportedUser' }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  sender: one(users, { fields: [connections.senderId], references: [users.id], relationName: 'sender' }),
  receiver: one(users, { fields: [connections.receiverId], references: [users.id], relationName: 'receiver' }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id], relationName: 'msgSender' }),
  receiver: one(users, { fields: [messages.receiverId], references: [users.id], relationName: 'msgReceiver' }),
}));

export const storiesRelations = relations(stories, ({ one }) => ({
  author: one(users, { fields: [stories.authorId], references: [users.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, { fields: [reports.reporterId], references: [users.id], relationName: 'reporter' }),
  reportedUser: one(users, { fields: [reports.reportedUserId], references: [users.id], relationName: 'reportedUser' }),
}));
