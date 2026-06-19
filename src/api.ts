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
  },
  users: {
    getAll: () => get('/users'),
    getById: (id: string) => get(`/users/${id}`),
    update: (id: string, data: any) => put(`/users/${id}`, data),
    toggleSuspend: (id: string) => put(`/users/${id}/suspend`, {}),
    resetPassword: (id: string, newPassword: string) => put(`/users/${id}/reset-password`, { newPassword }),
    bulkImport: (rows: any[]) => post('/admin/import-users', { rows }),
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
};
