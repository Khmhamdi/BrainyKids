'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    // Vider localStorage
    localStorage.removeItem('bk_token');
    localStorage.removeItem('bk_user');
    // Vider le cookie
    document.cookie = 'bk_token=; path=/; max-age=0';
    // Rediriger vers login
    window.location.href = '/sign-in';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Déconnexion en cours...</p>
    </div>
  );
}
