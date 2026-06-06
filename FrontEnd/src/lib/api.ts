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

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bk_refresh_token');
}

function getTokenExpiration(): number | null {
  if (typeof window === 'undefined') return null;
  const exp = localStorage.getItem('bk_token_exp');
  return exp ? parseInt(exp, 10) : null;
}

function setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('bk_token', accessToken);
  localStorage.setItem('bk_refresh_token', refreshToken);
  // Stocker le timestamp d'expiration (maintenant + expiresIn)
  const expirationTime = Date.now() + expiresIn * 1000;
  localStorage.setItem('bk_token_exp', expirationTime.toString());
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('bk_token');
  localStorage.removeItem('bk_refresh_token');
  localStorage.removeItem('bk_token_exp');
}

// ─── Auto-refresh si token proche de l'expiration ─────────────
let refreshPromise: Promise<void> | null = null;

async function refreshTokenIfNeeded(): Promise<void> {
  const expiration = getTokenExpiration();
  if (!expiration) return;

  // Si le token expire dans moins de 2 minutes, refresh
  const timeUntilExpiry = expiration - Date.now();
  if (timeUntilExpiry < 2 * 60 * 1000) {
    // Éviter les appels parallèles de refresh
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearTokens();
          window.location.href = '/sign-in';
          return;
        }

        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) {
          clearTokens();
          window.location.href = '/sign-in';
          return;
        }

        const data = await res.json();
        setTokens(data.access_token, data.refresh_token, data.expires_in);
      } catch (error) {
        clearTokens();
        window.location.href = '/sign-in';
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }
}

// ─── Fetch avec authentification + auto-refresh ──────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Auto-refresh si nécessaire avant la requête
  await refreshTokenIfNeeded();

  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  // Si 401 Unauthorized, le token est invalide → logout
  if (res.status === 401) {
    clearTokens();
    window.location.href = '/sign-in';
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Erreur réseau' }));
    throw new Error(error.message || `Erreur ${res.status}`);
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────
export const auth = {
  login: async (username: string, password: string) => {
    const data = await apiFetch<{ access_token: string; refresh_token: string; expires_in: number; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Stocker les tokens
    setTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
  },
  refresh: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('Pas de refresh token');
    const data = await apiFetch<{ access_token: string; refresh_token: string; expires_in: number }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    setTokens(data.access_token, data.refresh_token, data.expires_in);
    return data;
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {}); // Ignorer les erreurs de logout
    }
    clearTokens();
  },
  logoutAll: () => apiFetch('/auth/logout-all', { method: 'POST' }),
  me: () => apiFetch<any>('/auth/me'),
};

// Exporter les fonctions de gestion des tokens
export { setTokens, clearTokens };

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
  checkOverdue:  () => apiFetch<any>('/packs/check-overdue',  { method: 'POST' }),
  checkDossiers: () => apiFetch<any>('/packs/check-dossiers', { method: 'POST' }),
};

export const notifications = {
  list:        () => apiFetch<any[]>('/notifications'),
  unreadCount: () => apiFetch<number>('/notifications/unread-count'),
  markRead:    (id: string) => apiFetch<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiFetch<any>('/notifications/read-all', { method: 'PUT' }),
};

export const students = {
  list: (page = 1, limit = 10, search = '', archived = false, classId = '', schoolYear = '') =>
    apiFetch<any>(`/students?page=${page}&limit=${limit}&search=${search}&archived=${archived}${classId ? `&classId=${classId}` : ''}${schoolYear ? `&schoolYear=${encodeURIComponent(schoolYear)}` : ''}`),
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

// ─── Personnel (enseignantes + femmes de service + autre) ─────
export const teachers = {
  list: (page = 1, limit = 10, search = '', fonction = '') =>
    apiFetch<any>(`/teachers?page=${page}&limit=${limit}&search=${search}${fonction ? `&fonction=${fonction}` : ''}`),
  get: (id: string) => apiFetch<any>(`/teachers/${id}`),
  myProfile: () => apiFetch<any>('/teachers/me'),
  create: (data: any) => apiFetch<any>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/teachers/${id}`, { method: 'DELETE' }),
  salaryPayments: {
    all: (month?: number, year?: number, teacherId?: string, status?: string) => {
      const params = new URLSearchParams();
      if (month)     params.set('month',     String(month));
      if (year)      params.set('year',      String(year));
      if (teacherId) params.set('teacherId', teacherId);
      if (status)    params.set('status',    status);
      return apiFetch<any[]>(`/teachers/salary-payments/all?${params.toString()}`);
    },
    list:     (teacherId: string) => apiFetch<any[]>(`/teachers/${teacherId}/salary-payments`),
    record:   (teacherId: string, data: any) =>
      apiFetch<any>(`/teachers/${teacherId}/salary-payments`, { method: 'POST', body: JSON.stringify(data) }),
    markPaid: (paymentId: string) =>
      apiFetch<any>(`/teachers/salary-payments/${paymentId}/pay`, { method: 'PUT' }),
    delete:   (paymentId: string) =>
      apiFetch<any>(`/teachers/salary-payments/${paymentId}`, { method: 'DELETE' }),
    createPack: (teacherId: string, data: any) =>
      apiFetch<any>(`/teachers/${teacherId}/salary-pack`, { method: 'POST', body: JSON.stringify(data) }),
  },
};

// ─── Parents ──────────────────────────────────────────────────
export const parents = {
  list: (page = 1, limit = 10, search = '', archived = false) =>
    apiFetch<any>(`/parents?page=${page}&limit=${limit}&search=${search}&archived=${archived}`),
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
  byClassAndDate: (classId: string, date: string) =>
    apiFetch<any[]>(`/absences/class/${classId}/date/${date}`),
  create: (data: any) => apiFetch<any>('/absences', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/absences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/absences/${id}`, { method: 'DELETE' }),
};

// ─── Notes / Recommandations ──────────────────────────────────
export const notes = {
  byStudent: (studentId: string) => apiFetch<any[]>(`/notes/student/${studentId}`),
  create: (data: any) => apiFetch<any>('/notes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<any>(`/notes/${id}`, { method: 'DELETE' }),
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
  updateSummerPack: (id: string, data: any) => apiFetch<any>(`/packs/summer/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markSummerPaid:   (id: string) => apiFetch<any>(`/packs/summer/${id}/pay`, { method: 'PUT' }),
  deletePayment:    (id: string) => apiFetch<any>(`/packs/payment/${id}`, { method: 'DELETE' }),
  createExternal:   (data: any) => apiFetch<any>('/packs/external-students', { method: 'POST', body: JSON.stringify(data) }),
  getExternals:     () => apiFetch<any[]>('/packs/external-students'),
};

// ─── Clubs ────────────────────────────────────────────────────
export const clubs = {
  list: (type?: string, ageGroup?: string, activeOnly?: boolean) => {
    const params = new URLSearchParams();
    if (type)            params.set('type',      type);
    if (ageGroup)        params.set('age_group', ageGroup);
    if (activeOnly)      params.set('active',    'true');
    return apiFetch<any[]>(`/clubs?${params.toString()}`);
  },
  get:    (id: string)              => apiFetch<any>(`/clubs/${id}`),
  create: (data: any)               => apiFetch<any>('/clubs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any)   => apiFetch<any>(`/clubs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string)              => apiFetch<any>(`/clubs/${id}`, { method: 'DELETE' }),
};

// ─── Emplois du temps ─────────────────────────────────────────
export const schedules = {
  list:   ()                          => apiFetch<any[]>('/schedules'),
  get:    (id: string)                => apiFetch<any>(`/schedules/${id}`),
  create: (data: any)                 => apiFetch<any>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any)     => apiFetch<any>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string)                => apiFetch<any>(`/schedules/${id}`, { method: 'DELETE' }),
};

// ─── API publique (sans token) ────────────────────────────────
const API_BASE_PUBLIC = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

export const publicApi = {
  clubsEte: () =>
    fetch(`${API_BASE_PUBLIC}/clubs/public?type=ete`)
      .then(r => r.json()) as Promise<any[]>,
};

// ─── Pré-inscriptions ─────────────────────────────────────────

export const preRegistrations = {
  submit: (data: any) =>
    fetch(`${API_BASE_PUBLIC}/pre-registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async res => {
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Erreur'); }
      return res.json();
    }),
  list:    (status?: string, type?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (type   && type   !== 'all') params.set('type',   type);
    const q = params.toString();
    return apiFetch<any[]>(`/pre-registrations${q ? `?${q}` : ''}`);
  },
  stats:   ()                => apiFetch<any>('/pre-registrations/stats'),
  approve: (id: string)      => apiFetch<any>(`/pre-registrations/${id}/approve`, { method: 'PUT' }),
  approveScolarite: (id: string, dto: any) =>
    apiFetch<any>(`/pre-registrations/${id}/approve-scolarite`, { method: 'PUT', body: JSON.stringify(dto) }),
  reject:  (id: string, reason: string) =>
    apiFetch<any>(`/pre-registrations/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  remove:  (id: string)      => apiFetch<any>(`/pre-registrations/${id}`, { method: 'DELETE' }),
};

// ─── Paramètres / Lookups ─────────────────────────────────────
export const settings = {
  getLookups: (category?: string, activeOnly?: boolean) => {
    const params = new URLSearchParams();
    if (category)   params.set('category', category);
    if (activeOnly) params.set('active',   'true');
    return apiFetch<any[]>(`/settings/lookups?${params.toString()}`);
  },
  createLookup: (data: any)             => apiFetch<any>('/settings/lookups', { method: 'POST', body: JSON.stringify(data) }),
  updateLookup: (id: string, data: any) => apiFetch<any>(`/settings/lookups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLookup: (id: string)            => apiFetch<any>(`/settings/lookups/${id}`, { method: 'DELETE' }),
};

// ─── Années scolaires ─────────────────────────────────────────
export const schoolYears = {
  list:       ()                      => apiFetch<any[]>('/school-years'),
  getCurrent: ()                      => apiFetch<any>('/school-years/current'),
  create:     (data: any)             => apiFetch<any>('/school-years', { method: 'POST', body: JSON.stringify(data) }),
  update:     (id: string, data: any) => apiFetch<any>(`/school-years/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setCurrent: (id: string)            => apiFetch<any>(`/school-years/${id}/set-current`, { method: 'PUT' }),
  delete:     (id: string)            => apiFetch<any>(`/school-years/${id}`, { method: 'DELETE' }),
};
