'use client';

export interface BKUser {
  id: string;
  username: string;
  full_name: string;
  role: 'administrator' | 'teacher' | 'parent' | 'student';
  email: string;
}

export function getUser(): BKUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('bk_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('bk_token');
}

export function logout(): void {
  localStorage.removeItem('bk_token');
  localStorage.removeItem('bk_user');
  // Supprimer les cookies
  document.cookie = 'bk_token=; path=/; max-age=0; SameSite=Strict';
  document.cookie = 'bk_role=; path=/; max-age=0; SameSite=Strict';
  // replace() remplace l'entrée historique → le bouton précédent ne revient pas
  window.location.replace('/');
}

export function getDashboardPath(role: string): string {
  const map: Record<string, string> = {
    administrator: '/admin',
    teacher:       '/teacher',
    parent:        '/parent',
    student:       '/student',
  };
  return map[role] || '/admin';
}
