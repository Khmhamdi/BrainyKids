'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import FormModal from '@/components/FormModal';
import AuthGuard from '@/components/AuthGuard';
import { classes as classesApi, students as studentsApi, absences as absencesApi, schedules as schedulesApi } from '@/lib/api';
import { getUser } from '@/lib/useAuth';
import { getMediaUrl } from '@/lib/media';

/* ── Types ──────────────────────────────────────────────────── */
type Classe = {
  id: string; name: string; age_group: string; room_number: string;
  teacher?: { user?: { full_name: string } };
  students?: any[];
  schedule?: { id: string; name: string; start_time: string; end_time: string };
};
type Student = { id: string; full_name: string; photo_url: string | null };

const AGE_COLOR: Record<string, { bg: string; ring: string; text: string; badge: string }> = {
  PS: { bg: 'from-pink-500 to-rose-400',     ring: 'ring-pink-300',   text: 'text-pink-700',   badge: 'bg-pink-100 text-pink-700' },
  MS: { bg: 'from-violet-500 to-purple-400', ring: 'ring-violet-300', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  GS: { bg: 'from-emerald-500 to-teal-400',  ring: 'ring-emerald-300',text: 'text-emerald-700',badge: 'bg-emerald-100 text-emerald-700' },
};
const AGE_LABEL: Record<string, string> = { PS: 'Petite Section', MS: 'Moyenne Section', GS: 'Grande Section' };

function todayISO() { return new Date().toISOString().split('T')[0]; }

function Initials({ name }: { name: string }) {
  const init = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-base shrink-0">
      {init}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 1 — Vue Élèves
══════════════════════════════════════════════════════════════ */
function VueEleves({ classes }: { classes: Classe[] }) {
  const [selectedId, setSelectedId] = useState<string>(classes[0]?.id ?? '');
  const [date,       setDate]       = useState(todayISO());
  const [students,   setStudents]   = useState<Student[]>([]);
  const [absentIds,  setAbsentIds]  = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(false);

  const selected = classes.find(c => c.id === selectedId);

  const load = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const [studData, absData] = await Promise.all([
        studentsApi.list(1, 200, '', false, selectedId),
        absencesApi.byClassAndDate(selectedId, date).catch(() => []),
      ]);
      setStudents(studData?.data ?? studData ?? []);
      const absent = new Set<string>(
        (absData ?? []).filter((s: any) => s.absence !== null).map((s: any) => s.id)
      );
      setAbsentIds(absent);
    } finally { setLoading(false); }
  }, [selectedId, date]);

  useEffect(() => { load(); }, [load]);

  const colors = AGE_COLOR[selected?.age_group ?? ''] ?? AGE_COLOR['PS'];
  const nbAbsent  = students.filter(s => absentIds.has(s.id)).length;
  const nbPresent = students.length - nbAbsent;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Sélecteur de classe ─────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {classes.map(c => {
          const col = AGE_COLOR[c.age_group] ?? AGE_COLOR['PS'];
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all font-medium text-sm ${
                active
                  ? `bg-gradient-to-r ${col.bg} text-white border-transparent shadow-lg scale-105`
                  : `bg-white ${col.text} border-gray-200 hover:border-current hover:scale-[1.02]`
              }`}
            >
              <span className="text-xl">
                {c.age_group === 'PS' ? '🌱' : c.age_group === 'MS' ? '🌿' : '🌳'}
              </span>
              <div className="text-left">
                <p className="font-semibold">{c.name}</p>
                <p className={`text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}>
                  {AGE_LABEL[c.age_group]} · Salle {c.room_number}
                </p>
              </div>
              <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                active ? 'bg-white/25 text-white' : col.badge
              }`}>
                {c.students?.length ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bannière classe sélectionnée ────────────────────── */}
      {selected && (
        <div className={`bg-gradient-to-r ${colors.bg} rounded-2xl px-6 py-4 text-white shadow`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{selected.name} — {AGE_LABEL[selected.age_group]}</h2>
              <p className="text-white/75 text-sm mt-0.5">
                Salle {selected.room_number} · {selected.teacher?.user?.full_name ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Date picker */}
              <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                <span className="text-sm font-medium">📅</span>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-transparent text-white text-sm font-medium outline-none [color-scheme:dark] cursor-pointer"
                />
              </div>
              {/* Stats */}
              <div className="flex gap-2">
                <div className="bg-white/20 rounded-xl px-3 py-2 text-center min-w-[60px]">
                  <p className="text-xl font-bold">{students.length}</p>
                  <p className="text-xs text-white/75">Total</p>
                </div>
                <div className="bg-emerald-400/30 rounded-xl px-3 py-2 text-center min-w-[60px]">
                  <p className="text-xl font-bold">{nbPresent}</p>
                  <p className="text-xs text-white/75">Présents</p>
                </div>
                <div className="bg-red-400/30 rounded-xl px-3 py-2 text-center min-w-[60px]">
                  <p className="text-xl font-bold">{nbAbsent}</p>
                  <p className="text-xs text-white/75">Absents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Grille élèves ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🏫</div>
            <p>Aucun élève dans cette classe.</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {students.map(s => {
              const absent = absentIds.has(s.id);
              return (
                <Link
                  key={s.id}
                  href={`/list/students/${s.id}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all bg-gray-50/50 hover:bg-white"
                >
                  <div className="relative">
                    {s.photo_url ? (
                      <img
                        src={getMediaUrl(s.photo_url)!}
                        alt={s.full_name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <Initials name={s.full_name} />
                    )}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${absent ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB 2 — Gestion (admin seulement)
══════════════════════════════════════════════════════════════ */
function Gestion({ classes, schedulesList, onRefresh, loading }: {
  classes: Classe[]; schedulesList: any[]; onRefresh: () => void; loading: boolean;
}) {
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [savedId,     setSavedId]     = useState<string | null>(null);
  const [showScheds,  setShowScheds]  = useState(false);
  const [editSchedId, setEditSchedId] = useState<string | null>(null);
  const [editSchedD,  setEditSchedD]  = useState<any>({});
  const [newSched,    setNewSched]    = useState({ name: '', description: '', start_time: '08:00', end_time: '12:00', days_of_week: 'Lundi-Vendredi' });
  const [addingS,     setAddingS]     = useState(false);
  const [schedError,  setSchedError]  = useState('');

  const assignSchedule = async (classId: string, scheduleId: string) => {
    setSavingId(classId);
    try {
      await classesApi.update(classId, { schedule_id: scheduleId || null });
      setSavedId(classId); setTimeout(() => setSavedId(null), 2000);
      onRefresh();
    } catch (e: any) { alert(e.message); }
    finally { setSavingId(null); }
  };

  const saveSched = async (id: string) => {
    try { await schedulesApi.update(id, editSchedD); setEditSchedId(null); onRefresh(); }
    catch (e: any) { alert(e.message); }
  };

  const deleteSched = async (id: string) => {
    if (!confirm('Supprimer cet emploi du temps ?')) return;
    try { await schedulesApi.delete(id); onRefresh(); } catch (e: any) { alert(e.message); }
  };

  const addSched = async () => {
    if (!newSched.name.trim()) { setSchedError('Le nom est obligatoire'); return; }
    setAddingS(true); setSchedError('');
    try {
      await schedulesApi.create(newSched);
      setNewSched({ name: '', description: '', start_time: '08:00', end_time: '12:00', days_of_week: 'Lundi-Vendredi' });
      onRefresh();
    } catch (e: any) { setSchedError(e.message || 'Erreur'); }
    finally { setAddingS(false); }
  };

  const inCls   = 'border rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400';
  const timeCls = 'border rounded-md px-1 py-1 text-xs w-[72px]';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-6">

      {/* ── Classes ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
            Classes
          </h2>
          <FormModal table="classe" type="create" onRefresh={onRefresh} />
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="py-2 px-3">Classe</th>
                  <th className="py-2 px-3 hidden md:table-cell">Groupe d'âge</th>
                  <th className="py-2 px-3 hidden md:table-cell">Salle</th>
                  <th className="py-2 px-3 hidden md:table-cell">Enseignante</th>
                  <th className="py-2 px-3">Emploi du temps</th>
                  <th className="py-2 px-3 hidden lg:table-cell text-center">Élèves</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Aucune classe</td></tr>
                ) : classes.map(item => (
                  <tr key={item.id} className="border-b even:bg-slate-50 hover:bg-blue-50">
                    <td className="py-3 px-3 font-semibold">{item.name}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.age_group || '—'}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.room_number || '—'}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.teacher?.user?.full_name || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={item.schedule?.id || ''}
                          onChange={e => assignSchedule(item.id, e.target.value)}
                          disabled={savingId === item.id}
                          className="border rounded-md px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-[170px]"
                        >
                          <option value="">— Aucun —</option>
                          {schedulesList.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>
                          ))}
                        </select>
                        {savingId === item.id && <span className="text-xs text-gray-400">…</span>}
                        {savedId  === item.id && <span className="text-xs text-green-600 font-medium">✓</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell text-center text-gray-500 text-xs">{item.students?.length ?? 0}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FormModal table="classe" type="update" data={item} onRefresh={onRefresh} />
                        <FormModal table="classe" type="delete" id={item.id} data={item} onRefresh={onRefresh} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Emplois du temps ─────────────────────────────────── */}
      <div className="border-t pt-5">
        <button
          onClick={() => setShowScheds(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition"
        >
          <span className="w-1 h-5 bg-purple-500 rounded-full inline-block" />
          Emplois du temps
          <span className="ml-1 text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">{schedulesList.length}</span>
          <span className="text-gray-400 text-xs ml-auto">{showScheds ? '▲' : '▼'}</span>
        </button>

        {showScheds && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="py-2 px-3">Nom</th>
                    <th className="py-2 px-3 hidden sm:table-cell">Description</th>
                    <th className="py-2 px-3">Horaires</th>
                    <th className="py-2 px-3 hidden md:table-cell">Jours</th>
                    <th className="py-2 px-3 hidden md:table-cell text-center">Classes</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedulesList.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Aucun emploi du temps</td></tr>
                  ) : schedulesList.map(s => editSchedId === s.id ? (
                    <tr key={s.id} className="border-b bg-yellow-50">
                      <td className="py-2 px-3"><input value={editSchedD.name||''} onChange={e => setEditSchedD((d: any) => ({...d, name: e.target.value}))} className={inCls} /></td>
                      <td className="py-2 px-3 hidden sm:table-cell"><input value={editSchedD.description||''} onChange={e => setEditSchedD((d: any) => ({...d, description: e.target.value}))} className={inCls} /></td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <input type="time" value={editSchedD.start_time||''} onChange={e => setEditSchedD((d: any) => ({...d, start_time: e.target.value}))} className={timeCls} />
                          <span className="text-gray-400 text-xs">→</span>
                          <input type="time" value={editSchedD.end_time||''} onChange={e => setEditSchedD((d: any) => ({...d, end_time: e.target.value}))} className={timeCls} />
                        </div>
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell"><input value={editSchedD.days_of_week||''} onChange={e => setEditSchedD((d: any) => ({...d, days_of_week: e.target.value}))} className={inCls} /></td>
                      <td className="py-2 px-3 hidden md:table-cell" />
                      <td className="py-2 px-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => saveSched(s.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Sauver</button>
                          <button onClick={() => setEditSchedId(null)} className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">Annuler</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={s.id} className="border-b even:bg-slate-50 hover:bg-blue-50">
                      <td className="py-3 px-3 font-medium">{s.name}</td>
                      <td className="py-3 px-3 text-gray-500 text-xs hidden sm:table-cell">{s.description || '—'}</td>
                      <td className="py-3 px-3 font-mono text-xs">{s.start_time} → {s.end_time}</td>
                      <td className="py-3 px-3 text-gray-600 text-xs hidden md:table-cell">{s.days_of_week}</td>
                      <td className="py-3 px-3 text-center text-gray-500 text-xs hidden md:table-cell">{s.classes?.length ?? 0}</td>
                      <td className="py-3 px-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditSchedId(s.id); setEditSchedD({...s}); }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200">✏️</button>
                          <button onClick={() => deleteSched(s.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200">🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-3">Ajouter un emploi du temps</p>
              {schedError && <p className="text-xs text-red-600 mb-2">{schedError}</p>}
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col flex-1 min-w-[130px]">
                  <label className="text-xs font-medium text-gray-600 mb-1">Nom *</label>
                  <input value={newSched.name} onChange={e => setNewSched(d => ({...d, name: e.target.value}))} className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Emploi Matinée" />
                </div>
                <div className="flex flex-col flex-1 min-w-[130px]">
                  <label className="text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input value={newSched.description} onChange={e => setNewSched(d => ({...d, description: e.target.value}))} className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="ex: matin seulement" />
                </div>
                <div className="flex flex-col w-[85px]">
                  <label className="text-xs font-medium text-gray-600 mb-1">Début</label>
                  <input type="time" value={newSched.start_time} onChange={e => setNewSched(d => ({...d, start_time: e.target.value}))} className="border rounded-md p-2 text-sm" />
                </div>
                <div className="flex flex-col w-[85px]">
                  <label className="text-xs font-medium text-gray-600 mb-1">Fin</label>
                  <input type="time" value={newSched.end_time} onChange={e => setNewSched(d => ({...d, end_time: e.target.value}))} className="border rounded-md p-2 text-sm" />
                </div>
                <div className="flex flex-col flex-1 min-w-[150px]">
                  <label className="text-xs font-medium text-gray-600 mb-1">Jours</label>
                  <input value={newSched.days_of_week} onChange={e => setNewSched(d => ({...d, days_of_week: e.target.value}))} className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="Lundi-Vendredi" />
                </div>
                <button onClick={addSched} disabled={addingS} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                  {addingS ? 'Ajout…' : '+ Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Page principale
══════════════════════════════════════════════════════════════ */
function ClassesPage() {
  const role = getUser()?.role ?? 'teacher';
  const isAdmin = role === 'administrator';

  const [tab,           setTab]           = useState<'vue' | 'gestion'>('vue');
  const [classes,       setClasses]       = useState<Classe[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, schs] = await Promise.all([classesApi.list(), schedulesApi.list()]);
      setClasses(cls);
      setSchedulesList(schs);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* ── En-tête + Onglets ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Classes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{classes.length} classe{classes.length > 1 ? 's' : ''}</p>
        </div>

        {isAdmin && (
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab('vue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'vue' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Vue élèves
            </button>
            <button
              onClick={() => setTab('gestion')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === 'gestion' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚙️ Gestion
            </button>
          </div>
        )}
      </div>

      {/* ── Contenu ─────────────────────────────────────────── */}
      {classes.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl p-16 text-center text-gray-400 shadow-sm">
          <div className="text-5xl mb-4">🏫</div>
          <p className="font-medium">Aucune classe configurée</p>
        </div>
      ) : tab === 'vue' || !isAdmin ? (
        <VueEleves classes={classes} />
      ) : (
        <Gestion classes={classes} schedulesList={schedulesList} onRefresh={load} loading={loading} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard allowedRoles={['administrator', 'teacher']}>
      <ClassesPage />
    </AuthGuard>
  );
}
