'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Announcements from '@/components/Announcements';
import {
  teachers as teachersApi,
  students as studentsApi,
  absences as absencesApi,
  events as eventsApi,
} from '@/lib/api';
import { getMediaUrl } from '@/lib/media';
import Link from 'next/link';

/* ── Types ────────────────────────────────────────────────── */
type TeacherProfile = {
  id: string; full_name: string; qualification: string;
  classes: { id: string; name: string; age_group: string; room_number: string }[];
};
type Student = { id: string; full_name: string; photo_url: string | null };
type Absence = { student_id: string; justified: boolean; reason?: string };
type BKEvent = { id: number; title: string; date: string; description?: string };

const AGE_GROUP_LABEL: Record<string, string> = { PS: 'Petite Section', MS: 'Moyenne Section', GS: 'Grande Section' };
const AGE_GROUP_COLOR: Record<string, string> = {
  PS: 'from-pink-500 to-rose-400',
  MS: 'from-violet-500 to-purple-400',
  GS: 'from-emerald-500 to-teal-400',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d: Date) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts = name.trim().split(' ');
  const init = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-BKprimary/20 text-BKprimary font-bold flex items-center justify-center shrink-0`}>
      {init.toUpperCase()}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
function TeacherDashboard() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [events, setEvents] = useState<BKEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date());

  const myClass = teacher?.classes?.[0] ?? null;
  const absentIds = new Set(absences.map(a => a.student_id));
  const nbAbsent = students.filter(s => absentIds.has(s.id)).length;
  const nbPresent = students.length - nbAbsent;

  const load = useCallback(async () => {
    try {
      const [profile, evtList] = await Promise.all([
        teachersApi.myProfile(),
        eventsApi.list().catch(() => []),
      ]);
      setTeacher(profile);

      const upcoming: BKEvent[] = (evtList as BKEvent[])
        .filter(e => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4);
      setEvents(upcoming);

      const cls = profile?.classes?.[0];
      if (cls) {
        const [studData, absData] = await Promise.all([
          studentsApi.list(1, 100, '', false, cls.id),
          absencesApi.byClassAndDate(cls.id, todayISO()).catch(() => []),
        ]);
        setStudents(studData?.data ?? studData ?? []);
        // byClassAndDate retourne [{...student, absence: Absence|null}]
        // On extrait les IDs des élèves absents
        const absentList = (absData ?? [])
          .filter((s: any) => s.absence !== null)
          .map((s: any) => ({ student_id: s.id, justified: s.absence?.excused ?? false }));
        setAbsences(absentList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-BKprimary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    </div>
  );

  const gradient = myClass ? (AGE_GROUP_COLOR[myClass.age_group] ?? 'from-BKprimary to-blue-500') : 'from-BKprimary to-blue-500';

  return (
    <div className="p-4 flex flex-col gap-5">

      {/* ── Bannière bienvenue ───────────────────────────── */}
      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium capitalize">{formatDate(today)}</p>
            <h1 className="text-2xl font-bold mt-1">
              Bonjour, {teacher?.full_name?.split(' ')[0] ?? 'Enseignante'} 👋
            </h1>
            {myClass && (
              <p className="mt-1 text-white/80 text-sm">
                {AGE_GROUP_LABEL[myClass.age_group] ?? myClass.name} — Salle {myClass.room_number}
              </p>
            )}
          </div>

          {myClass && (
            <div className="flex gap-3">
              <StatBadge label="Total" value={students.length} color="white" />
              <StatBadge label="Présents" value={nbPresent} color="green" />
              <StatBadge label="Absents" value={nbAbsent} color="red" />
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu principal ────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* ── Gauche : Ma Classe ───────────────────────── */}
        <div className="flex-1 flex flex-col gap-5">

          {!myClass ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
              <div className="text-4xl mb-3">🏫</div>
              <p className="font-medium">Aucune classe assignée</p>
              <p className="text-sm mt-1">Contactez l'administration.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-semibold text-gray-800 text-lg">Ma Classe</h2>
                  <p className="text-sm text-gray-400">{myClass.name} · {students.length} élève{students.length > 1 ? 's' : ''}</p>
                </div>
                <Link
                  href={`/list/students?classId=${myClass.id}`}
                  className="text-xs text-BKprimary hover:underline font-medium"
                >
                  Voir tous →
                </Link>
              </div>

              {students.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">Aucun élève dans cette classe.</div>
              ) : (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {students.map(s => {
                    const absent = absentIds.has(s.id);
                    return (
                      <Link
                        key={s.id}
                        href={`/list/students/${s.id}`}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-BKprimary/30 hover:shadow-md transition-all cursor-pointer bg-gray-50/50 hover:bg-white"
                      >
                        <div className="relative">
                          {s.photo_url ? (
                            <img
                              src={getMediaUrl(s.photo_url)!}
                              alt={s.full_name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <Initials name={s.full_name} size="lg" />
                          )}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${absent ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-gray-700 leading-tight group-hover:text-BKprimary transition-colors line-clamp-2">
                            {s.full_name}
                          </p>
                          <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            absent ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {absent ? 'Absent' : 'Présent'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Accès rapides ─────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction href="/list/absences" icon="📋" label="Absences" color="bg-blue-50 hover:bg-blue-100" />
            <QuickAction href="/list/evenements" icon="📅" label="Événements" color="bg-purple-50 hover:bg-purple-100" />
            <QuickAction href="/list/annonces" icon="📢" label="Annonces" color="bg-yellow-50 hover:bg-yellow-100" />
            <QuickAction href="/profile" icon="👤" label="Mon profil" color="bg-green-50 hover:bg-green-100" />
          </div>
        </div>

        {/* ── Droite : Annonces + Événements ──────────── */}
        <div className="w-full xl:w-80 flex flex-col gap-5">

          <Announcements />

          {/* Événements à venir */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Événements à venir</h2>
              <Link href="/list/evenements" className="text-xs text-BKprimary hover:underline">Voir tous</Link>
            </div>
            {events.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">Aucun événement à venir.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {events.map(e => (
                  <li key={e.id} className="px-5 py-3 flex gap-3 items-start">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-BKskyLight flex flex-col items-center justify-center text-BKprimary">
                      <span className="text-xs font-bold leading-none">
                        {new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                      </span>
                      <span className="text-[10px] uppercase">
                        {new Date(e.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{e.title}</p>
                      {e.description && <p className="text-xs text-gray-400 truncate">{e.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function StatBadge({ label, value, color }: { label: string; value: number; color: 'white' | 'green' | 'red' }) {
  const bg = color === 'white' ? 'bg-white/20' : color === 'green' ? 'bg-emerald-400/30' : 'bg-red-400/30';
  return (
    <div className={`${bg} rounded-xl px-4 py-2 text-center min-w-[72px]`}>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/80 font-medium">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  return (
    <Link href={href} className={`${color} rounded-xl p-4 flex flex-col items-center gap-2 transition-colors group`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-800">{label}</span>
    </Link>
  );
}

/* ── Export ─────────────────────────────────────────────── */
export default function TeacherPage() {
  return (
    <AuthGuard allowedRoles={['teacher', 'administrator']}>
      <TeacherDashboard />
    </AuthGuard>
  );
}
