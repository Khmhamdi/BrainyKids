'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notifications as notificationsApi } from '@/lib/api';

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  overdue: { icon: '💰', label: 'Retard de paiement', color: 'bg-red-50 text-red-700 border-red-200' },
  dossier: { icon: '📋', label: 'Dossier incomplet',  color: 'bg-orange-50 text-orange-700 border-orange-200' },
  pack:    { icon: '📦', label: 'Pack financier',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
  absence: { icon: '📅', label: 'Absence',             color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const FILTERS = [
  { key: 'all',     label: 'Toutes' },
  { key: 'overdue', label: '💰 Retards' },
  { key: 'dossier', label: '📋 Dossiers' },
  { key: 'pack',    label: '📦 Packs' },
  { key: 'absence', label: '📅 Absences' },
];

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await notificationsApi.list();
      setNotifs(Array.isArray(list) ? list : []);
      // Marquer toutes comme lues à l'ouverture
      await notificationsApi.markAllRead();
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === 'all'
    ? notifs
    : notifs.filter(n => n.type === filter);

  const unreadCount = notifs.filter(n => !n.read).length;

  const handleClick = async (n: any) => {
    if (n.link) router.push(n.link);
  };

  return (
    <div className="bg-white p-6 rounded-xl m-4 mt-0 min-h-[80vh]">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">{unreadCount} non lue(s)</p>
          )}
        </div>
        <span className="text-sm text-gray-400">{notifs.length} au total</span>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
              ${filter === f.key
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1 text-[10px] opacity-70">
                ({notifs.filter(n => n.type === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="text-5xl mb-3">🔔</span>
          <p className="text-sm">Aucune notification</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(n => {
            const meta = TYPE_META[n.type] || { icon: '🔔', label: n.type, color: 'bg-gray-50 text-gray-700 border-gray-200' };
            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition
                  ${n.link ? 'cursor-pointer hover:shadow-sm' : ''}
                  ${!n.read ? 'bg-blue-50/40 border-blue-100' : 'bg-white border-gray-100'}`}>

                {/* Icône type */}
                <span className="text-2xl shrink-0 mt-0.5">{meta.icon}</span>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{n.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                    {!n.read && (
                      <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(n.created_at)}</p>
                </div>

                {/* Flèche si lien */}
                {n.link && (
                  <span className="text-gray-300 text-lg shrink-0 mt-1">›</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
