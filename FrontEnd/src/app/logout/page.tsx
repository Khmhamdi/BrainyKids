'use client';

import { useEffect } from 'react';
import { auth } from '@/lib/api';

export default function LogoutPage() {
  useEffect(() => {
    // Révoquer le refresh token côté serveur et vider les tokens locaux
    auth.logout().finally(() => {
      // Vider aussi l'utilisateur et les cookies
      localStorage.removeItem('bk_user');
      document.cookie = 'bk_token=; path=/; max-age=0';
      document.cookie = 'bk_role=; path=/; max-age=0';
      // Rediriger vers login
      window.location.href = '/sign-in';
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Déconnexion en cours...</p>
    </div>
  );
}
