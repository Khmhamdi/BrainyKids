'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/useAuth';
import { notifications as notificationsApi, packs as packsApi } from '@/lib/api';

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrateur',
  teacher:       'Enseignante',
  parent:        'Parent',
  student:       'Élève',
};

// Icône cloche SVG inline
const BellIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const Navbar = () => {
  const [user,             setUser]             = useState<any>(null);
  const [notifOpen,        setNotifOpen]        = useState(false);
  const [notifList,        setNotifList]        = useState<any[]>([]);
  const [unreadCount,      setUnreadCount]      = useState(0);
  const [loadingNotifs,    setLoadingNotifs]    = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router   = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Compteur non-lus — refresh toutes les 60 s
  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationsApi.unreadCount();
      setUnreadCount(typeof count === 'number' ? count : (count as any)?.count ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, 15_000);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Déclencher la vérification des retards + dossiers une seule fois par session
  useEffect(() => {
    const checks: Promise<any>[] = [];
    if (!sessionStorage.getItem('overdue_checked_v2')) {
      checks.push(packsApi.checkOverdue().then(() => sessionStorage.setItem('overdue_checked_v2', '1')));
    }
    if (!sessionStorage.getItem('dossiers_checked_v2')) {
      checks.push(packsApi.checkDossiers().then(() => sessionStorage.setItem('dossiers_checked_v2', '1')));
    }
    if (checks.length > 0) {
      Promise.allSettled(checks).then(() => refreshCount());
    }
  }, [refreshCount]);

  // Charger uniquement les non-lues quand on ouvre le dropdown
  const openNotif = async () => {
    setNotifOpen(o => !o);
    if (!notifOpen) {
      setLoadingNotifs(true);
      try {
        const list = await notificationsApi.list();
        const unread = Array.isArray(list) ? list.filter((n: any) => !n.read).slice(0, 15) : [];
        setNotifList(unread);
      } catch {}
      finally { setLoadingNotifs(false); }
    }
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifList([]);
  };

  const markOne = async (notif: any) => {
    await notificationsApi.markRead(notif.id);
    setNotifList(l => l.filter(n => n.id !== notif.id));
    setUnreadCount(c => Math.max(0, c - 1));
    if (notif.link) {
      setNotifOpen(false);
      router.push(notif.link);
    }
  };

  // Fermer sur clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const canSeeMessages = user?.role === 'administrator' || user?.role === 'parent';

  const fmtDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `il y a ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `il y a ${hrs} h`;
    return new Date(d).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex items-center justify-between p-4">
      {/* Barre de recherche */}
      <div className="hidden md:flex items-center gap-2 text-xs border border-gray-300 rounded-full py-2 px-4">
        <Image src="/search.png" alt="Rechercher" width={14} height={14} />
        <input
          type="text"
          placeholder="Rechercher..."
          className="outline-none border-none bg-transparent"
        />
      </div>

      {/* Icônes + profil */}
      <div className="flex items-center gap-3 justify-end w-full">

        {/* ── Annonces ── */}
        <Link href="/list/annonces" title="Annonces"
          className="bg-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-sky-50 transition">
          <Image src="/announcement.png" alt="Annonces" width={22} height={22} />
        </Link>

        {/* ── Messages (admin + parent) ── */}
        {canSeeMessages && (
          <Link href="/list/messages" title="Messages"
            className="bg-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-sky-50 transition">
            <Image src="/message.png" alt="Messages" width={22} height={22} />
          </Link>
        )}

        {/* ── Notifications ── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={openNotif}
            title="Notifications"
            className="bg-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-sky-50 transition text-gray-500 relative"
          >
            <BellIcon size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown notifications */}
          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                    Tout marquer lu
                  </button>
                )}
              </div>

              {/* Liste */}
              <div className="max-h-80 overflow-y-auto">
                {loadingNotifs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifList.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">
                    <p className="text-2xl mb-2">🔔</p>
                    Aucune notification
                  </div>
                ) : (
                  notifList.map(n => (
                    <button key={n.id} onClick={() => markOne(n)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/60' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-base mt-0.5 shrink-0">
                          {n.type === 'overdue' ? '💰' : n.type === 'pack' ? '📦' : n.type === 'absence' ? '📅' : n.type === 'dossier' ? '📋' : '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-300 mt-1">{fmtDate(n.created_at)}</p>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <Link href="/list/notifications" onClick={() => setNotifOpen(false)}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                  Voir toutes les notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Profil */}
        <div className="flex flex-col text-right">
          <span className="text-xs leading-3 font-medium">{user?.full_name || '...'}</span>
          <span className="text-[10px] text-gray-500">{ROLE_LABELS[user?.role] || ''}</span>
        </div>

        <Image src="/avatar.png" alt="Profil" width={38} height={38} className="rounded-full" />

        {/* Déconnexion */}
        <button onClick={logout} title="Se déconnecter"
          className="bg-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-50 transition">
          <Image src="/logout.png" alt="Déconnexion" width={18} height={18} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
