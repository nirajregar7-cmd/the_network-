const BASE = '/api';

async function request(method: string, path: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const get = (path: string) => request('GET', path);
const post = (path: string, body: any) => request('POST', path, body);
const put = (path: string, body: any) => request('PUT', path, body);
const del = (path: string) => request('DELETE', path);

export const api = {
  auth: {
    login: (email: string, password: string) => post('/auth/login', { email, password }),
    register: (data: any) => post('/auth/register', data),
    sendOtp: (email: string, purpose: 'login' | 'register' | 'forgot-password', data?: any) => post('/auth/send-otp', { email, purpose, data }),
    verifyOtp: (email: string, otp: string) => post('/auth/verify-otp', { email, otp }),
    resetPassword: (email: string, otp: string, newPassword: string) => post('/auth/reset-password', { email, otp, newPassword }),
    sendEmailChangeOtp: (currentEmail: string, newEmail: string) => post('/auth/send-email-change-otp', { currentEmail, newEmail }),
    confirmEmailChange: (currentEmail: string, otp: string) => post('/auth/confirm-email-change', { currentEmail, otp }),
  },
  users: {
    getAll: () => get('/users'),
    getById: (id: string) => get(`/users/${id}`),
    update: (id: string, data: any) => put(`/users/${id}`, data),
    toggleSuspend: (id: string) => put(`/users/${id}/suspend`, {}),
    resetPassword: (id: string, newPassword: string) => put(`/users/${id}/reset-password`, { newPassword }),
    bulkImport: (rows: any[]) => post('/admin/import-users', { rows }),
  },
  email: {
    send: (subject: string, body: string, to?: string[], sendToAll?: boolean) =>
      post('/admin/send-email', { subject, body, to, sendToAll }),
  },
  posts: {
    getAll: () => get('/posts'),
    create: (data: any) => post('/posts', data),
    delete: (id: string) => del(`/posts/${id}`),
    like: (id: string, userId: string) => post(`/posts/${id}/like`, { userId }),
    addComment: (id: string, authorId: string, content: string) =>
      post(`/posts/${id}/comments`, { authorId, content }),
  },
  connections: {
    getAll: () => get('/connections'),
    create: (data: any) => post('/connections', data),
    update: (id: string, status: string) => put(`/connections/${id}`, { status }),
  },
  messages: {
    getAll: () => get('/messages'),
    send: (senderId: string, receiverId: string, content: string) =>
      post('/messages', { senderId, receiverId, content }),
    markRead: (receiverId: string, senderId: string) =>
      put('/messages/read', { receiverId, senderId }),
  },
  communities: {
    getAll: () => get('/communities'),
    create: (data: any) => post('/communities', data),
    update: (id: string, data: any) => put(`/communities/${id}`, data),
    delete: (id: string) => del(`/communities/${id}`),
    seed: (chapters: any[]) => post('/seed/communities', { chapters }),
  },
  stories: {
    getAll: () => get('/stories'),
    create: (authorId: string, content: string, image?: string) =>
      post('/stories', { authorId, content, image }),
    react: (id: string, emoji: string) => put(`/stories/${id}/react`, { emoji }),
  },
  reports: {
    getAll: () => get('/reports'),
    create: (data: any) => post('/reports', data),
    update: (id: string, status: string) => put(`/reports/${id}`, { status }),
  },
  notifications: {
    getForUser: (userId: string) => get(`/notifications/${userId}`),
    markRead: (id: string) => put(`/notifications/${id}/read`, {}),
    markAllRead: (userId: string) => put(`/notifications/user/${userId}/read-all`, {}),
  },
  projects: {
    getAll: () => get('/projects'),
    create: (data: any) => post('/projects', data),
    update: (id: string, data: any) => put(`/projects/${id}`, data),
    delete: (id: string) => del(`/projects/${id}`),
    join: (id: string, userId: string) => put(`/projects/${id}/join`, { userId }),
    leave: (id: string, userId: string) => put(`/projects/${id}/leave`, { userId }),
  },
  events: {
    getAll: () => get('/events'),
    create: (data: any) => post('/events', data),
    update: (id: string, data: any) => put(`/events/${id}`, data),
    delete: (id: string) => del(`/events/${id}`),
    register: (id: string, userId: string) => put(`/events/${id}/register`, { userId }),
    unregister: (id: string, userId: string) => put(`/events/${id}/unregister`, { userId }),
  },
  groupChats: {
    getAll: () => get('/group-chats'),
    create: (data: any) => post('/group-chats', data),
    delete: (id: string) => del(`/group-chats/${id}`),
    accept: (id: string, userId: string) => put(`/group-chats/${id}/accept`, { userId }),
    decline: (id: string, userId: string) => put(`/group-chats/${id}/decline`, { userId }),
    invite: (id: string, inviteUserIds: string[], actorId: string) =>
      put(`/group-chats/${id}/invite`, { inviteUserIds, actorId }),
    getMessages: (id: string) => get(`/group-chats/${id}/messages`),
    sendMessage: (id: string, senderId: string, content: string) =>
      post(`/group-chats/${id}/messages`, { senderId, content }),
  },
  collegeAdmin: {
    assign: (userId: string, college: string | null) => put('/admin/college-admin', { userId, college }),
    getAnnouncements: (college: string) => get(`/college-announcements/${encodeURIComponent(college)}`),
    createAnnouncement: (data: { college: string; authorId: string; title: string; body: string; isPinned?: boolean }) =>
      post('/college-announcements', data),
    updateAnnouncement: (id: string, data: { title?: string; body?: string; isPinned?: boolean }) =>
      put(`/college-announcements/${id}`, data),
    deleteAnnouncement: (id: string) => del(`/college-announcements/${id}`),
  },
};
