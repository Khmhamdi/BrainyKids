'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { getDashboardPath } from '@/lib/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { access_token, user } = await auth.login(form.username, form.password);

      // Stocker dans localStorage
      localStorage.setItem('bk_token', access_token);
      localStorage.setItem('bk_user', JSON.stringify(user));

      // Stocker dans des cookies pour le middleware Next.js
      document.cookie = `bk_token=${access_token}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `bk_role=${user.role}; path=/; max-age=86400; SameSite=Strict`;

      router.push(getDashboardPath(user.role));
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-BKprimary to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image src="/LogoBK.png" alt="Brainy Kids" width={80} height={80} />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Brainy Kids</h1>
          <p className="text-sm text-gray-500 mt-1">Jardin d'enfants — Manouba</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-BKprimary focus:ring-1 focus:ring-BKprimary"
              placeholder="admin / enseignante1 / parent1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Mot de passe
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-BKprimary focus:ring-1 focus:ring-BKprimary"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-BKprimary text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        {/* Comptes de démo */}
        <div className="mt-6 p-4 bg-BKskyLight rounded-lg">
          <p className="text-xs font-semibold text-gray-600 mb-2">Comptes de démonstration :</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
            <span>👤 admin / admin123</span>
            <span>👩‍🏫 enseignante1 / enseignante123</span>
            <span>👨‍👩‍👧 parent1 / parent1pass</span>
            <span>👑 directrice / directrice123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
