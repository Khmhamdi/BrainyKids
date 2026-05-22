// lib/api.ts — Client API centralisé pour Brainy Kids v2
// Remplace les données fictives de lib/data.ts

// En production : passe par Nginx (port 80) → http://localhost/api
// En dev direct sur :3001 : appelle le backend directement sur :4000
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

// ─── Token JWT (côté client) ──────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bk_token');
}

// ─── Fetch avec authentification ─────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    throw new Error(error.message || `Erreur ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  login: (username: string, password: string) =>
    apiFetch<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => apiFetch<any>('/auth/me'),
};

// ─── Dashboard ────────────────────────────────────────────────
export const dashboard = {
  stats: () => apiFetch<any>('/dashboard/stats'),
  genderStats: () => apiFetch<any>('/dashboard/gender-stats'),
  attendanceChart: () => apiFetch<any[]>('/dashboard/attendance-chart'),
};

// ─── Élèves ───────────────────────────────────────────────────
export const upload = {
  photo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken(); // ← utilise bk_token comme partout ailleurs
    const res = await fetch(`${API_BASE}/upload/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      // NE PAS mettre Content-Type ici — FormData le gère automatiquement
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erreur upload' }));
      throw new Error(err.message || `Upload échoué (${res.status})`);
    }
    const data = await res.json();
    return data.url;
  },
};

export const packs = {
  get:         (studentId: string) => apiFetch<any>(`/packs/student/${studentId}`),
  upsert:      (studentId: string, data: any) => apiFetch<any>(`/packs/student/${studentId}`, { method: 'POST', body: JSON.stringify(data) }),
  markPaid:    (paymentId: string) => apiFetch<any>(`/packs/payment/${paymentId}/pay`, { method: 'PUT' }),
  checkOverdue: () => apiFetch<any>('/packs/check-overdue', { method: 'POST' }),
};

export const notifications = {
  list:        () => apiFetch<any[]>('/notifications'),
  unreadCount: () => apiFetch<number>('/notifications/unread-count'),
  markRead:    (id: string) => apiFetch<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiFetch<any>('/notifications/read-all', { method: 'PUT' }),
};

export const students = {
  list: (page = 1, limit = 10, search = '', archived = false) =>
    apiFetch<any>(`/students?page=${page}&limit=${limit}&search=${search}&archived=${archived}`),
  listArchived: (page=1, limit=10, search='') =>
    apiFetch<any>(`/students?page=${page}&limit=${limit}&search=${search}&archived=true`),
  get: (id: string) => apiFetch<any>(`/students/${id}`),
  create: (data: any) => apiFetch<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/students/${id}`, { method: 'DELETE' }),
  archive:    (id: string) => apiFetch<any>(`/students/${id}/archive`, { method: 'PUT' }),
  unregister: (id: string, reason: string) => apiFetch<any>(`/students/${id}/unregister`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  restore: (id: string) => apiFetch<any>(`/students/${id}/restore`, { method: 'PUT' }),
  linkParent: (id: string, data: any) => apiFetch<any>(`/students/${id}/parents`, { method: 'POST', body: JSON.stringify(data) }),
  unlinkParent: (id: string, parentId: string) => apiFetch<any>(`/students/${id}/parents/${parentId}`, { method: 'DELETE' }),
  attendance: (id: string) => apiFetch<any>(`/students/${id}/attendance`),
};

// ─── Enseignantes ─────────────────────────────────────────────
export const teachers = {
  list: (page = 1, limit = 10, search = '', archived = false) =>
    apiFetch<any>(`/teachers?page=${page}&limit=${limit}&search=${search}`),
  get: (id: string) => apiFetch<any>(`/teachers/${id}`),
  create: (data: any) => apiFetch<any>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/teachers/${id}`, { method: 'DELETE' }),
};

// ─── Parents ──────────────────────────────────────────────────
export const parents = {
  list: (page = 1, limit = 10, search = '', archived = false) =>
    apiFetch<any>(`/parents?page=${page}&limit=${limit}&search=${search}`),
  get: (id: string) => apiFetch<any>(`/parents/${id}`),
  create: (data: any) => apiFetch<any>('/parents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/parents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/parents/${id}`, { method: 'DELETE' }),
  listFamilyAccounts: () => apiFetch<any[]>('/parents/family/list'),
  getFamilyAccount: (username: string) => apiFetch<any>(`/parents/family/${username}`),
  archive: (id: string) => apiFetch<any>(`/parents/${id}/archive`, { method: 'PUT' }),
  restore: (id: string) => apiFetch<any>(`/parents/${id}/restore`, { method: 'PUT' }),
  listArchived: (page=1, limit=10, search='') =>
    apiFetch<any>(`/parents?page=${page}&limit=${limit}&search=${search}&archived=true`),
};

// ─── Classes ──────────────────────────────────────────────────
export const classes = {
  list: () => apiFetch<any[]>('/classes'),
  get: (id: string) => apiFetch<any>(`/classes/${id}`),
  create: (data: any) => apiFetch<any>('/classes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/classes/${id}`, { method: 'DELETE' }),
};

// ─── Paiements ────────────────────────────────────────────────
export const payments = {
  list: (page = 1, status?: string) =>
    apiFetch<any>(`/payments?page=${page}${status ? `&status=${status}` : ''}`),
  byStudent: (studentId: string) => apiFetch<any[]>(`/payments/student/${studentId}`),
  treasury: () => apiFetch<any>('/payments/treasury'),
  create: (data: any) => apiFetch<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<any>(`/payments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// ─── Absences ─────────────────────────────────────────────────
export const absences = {
  list: (page = 1) => apiFetch<any>(`/absences?page=${page}`),
  byStudent: (studentId: string) => apiFetch<any[]>(`/absences/student/${studentId}`),
  create: (data: any) => apiFetch<any>('/absences', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/absences/${id}`, { method: 'DELETE' }),
};

// ─── Annonces ─────────────────────────────────────────────────
export const announcements = {
  list: () => apiFetch<any[]>('/announcements'),
  create: (data: any) => apiFetch<any>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/announcements/${id}`, { method: 'DELETE' }),
};

// ─── Événements ───────────────────────────────────────────────
export const events = {
  list: () => apiFetch<any[]>('/events'),
  create: (data: any) => apiFetch<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/events/${id}`, { method: 'DELETE' }),
};

// ─── Profil parent connecté ───────────────────────────────────
export const myParent = {
  profile: () => apiFetch<any>('/parents/me'),
};

// Extensions packs (régime, juin, paiement mensuel, clubs été)
export const packsExt = {
  getPayments:      (studentId: string) => apiFetch<any[]>(`/packs/student/${studentId}/payments`),
  markMonthPaid:    (studentId: string, month: number, year: number) =>
    apiFetch<any>(`/packs/student/${studentId}/pay-month`, { method: 'PUT', body: JSON.stringify({ month, year }) }),
  createSummerPack: (data: any) => apiFetch<any>('/packs/summer', { method: 'POST', body: JSON.stringify(data) }),
  getSummerPacks:   (month?: number, year?: number) =>
    apiFetch<any[]>(`/packs/summer${month ? `?month=${month}&year=${year}` : ''}`),
  markSummerPaid:   (id: string) => apiFetch<any>(`/packs/summer/${id}/pay`, { method: 'PUT' }),
  createExternal:   (data: any) => apiFetch<any>('/packs/external-students', { method: 'POST', body: JSON.stringify(data) }),
  getExternals:     () => apiFetch<any[]>('/packs/external-students'),
};
