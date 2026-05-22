"use client";

import { useEffect, useState, useCallback } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import AuthGuard from "@/components/AuthGuard";
import { classes as classesApi, schedules as schedulesApi } from "@/lib/api";

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const ClasseListPage = () => {
  const [data,          setData]          = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [savingId,      setSavingId]      = useState<string | null>(null);
  const [savedId,       setSavedId]       = useState<string | null>(null);

  // Schedule CRUD state
  const [showScheds,  setShowScheds]  = useState(false);
  const [editSchedId, setEditSchedId] = useState<string | null>(null);
  const [editSchedD,  setEditSchedD]  = useState<any>({});
  const [newSched,    setNewSched]    = useState({ name: "", description: "", start_time: "08:00", end_time: "12:00", days_of_week: "Lundi-Vendredi" });
  const [addingS,     setAddingS]     = useState(false);
  const [schedError,  setSchedError]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, schs] = await Promise.all([classesApi.list(), schedulesApi.list()]);
      setData(cls);
      setSchedulesList(schs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assignSchedule = async (classId: string, scheduleId: string) => {
    setSavingId(classId);
    try {
      await classesApi.update(classId, { schedule_id: scheduleId || null });
      setSavedId(classId);
      setTimeout(() => setSavedId(null), 2000);
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setSavingId(null); }
  };

  const saveSched = async (id: string) => {
    try { await schedulesApi.update(id, editSchedD); setEditSchedId(null); await load(); }
    catch (e: any) { alert(e.message); }
  };

  const deleteSched = async (id: string) => {
    if (!confirm("Supprimer cet emploi du temps ?")) return;
    try { await schedulesApi.delete(id); await load(); } catch (e: any) { alert(e.message); }
  };

  const addSched = async () => {
    if (!newSched.name.trim()) { setSchedError("Le nom est obligatoire"); return; }
    setAddingS(true); setSchedError("");
    try {
      await schedulesApi.create(newSched);
      setNewSched({ name: "", description: "", start_time: "08:00", end_time: "12:00", days_of_week: "Lundi-Vendredi" });
      await load();
    } catch (e: any) { setSchedError(e.message || "Erreur"); }
    finally { setAddingS(false); }
  };

  const inCls  = "border rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400";
  const timeCls = "border rounded-md px-1 py-1 text-xs w-[72px]";

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold text-lg">Toutes les classes</h1>
          <FormModal table="classe" type="create" onRefresh={load} />
        </div>

        {/* Tableau des classes */}
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
                {data.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Aucune classe</td></tr>
                ) : data.map(item => (
                  <tr key={item.id} className="border-b even:bg-slate-50 hover:bg-blue-50 text-sm">
                    <td className="py-3 px-3 font-semibold">{item.name}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.age_group || "—"}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.room_number || "—"}</td>
                    <td className="py-3 px-3 hidden md:table-cell text-gray-500 text-xs">{item.teacher?.user?.full_name || "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={item.schedule?.id || ""}
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
                        <FormModal table="classe" type="update" data={item} onRefresh={load} />
                        <FormModal table="classe" type="delete" id={item.id} data={item} onRefresh={load} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={1} totalPages={1} onPageChange={() => {}} />

        {/* ── Emplois du temps ─────────────────────────────────── */}
        <div className="mt-8 border-t pt-5">
          <button
            onClick={() => setShowScheds(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition"
          >
            <span className="text-lg">📅</span>
            Gérer les emplois du temps
            <span className="ml-1 text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">{schedulesList.length}</span>
            <span className="text-gray-400 text-xs ml-1">{showScheds ? "▲" : "▼"}</span>
          </button>
          <p className="text-xs text-gray-400 mt-1 mb-3">Créez et modifiez les emplois du temps puis assignez-les aux classes ci-dessus.</p>

          {showScheds && (
            <>
              <div className="overflow-x-auto mb-4">
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
                      <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Aucun emploi du temps — ajoutez-en ci-dessous</td></tr>
                    ) : schedulesList.map(s => editSchedId === s.id ? (
                      <tr key={s.id} className="border-b bg-yellow-50">
                        <td className="py-2 px-3"><input value={editSchedD.name||""} onChange={e => setEditSchedD((d: any) => ({...d, name: e.target.value}))} className={inCls} /></td>
                        <td className="py-2 px-3 hidden sm:table-cell"><input value={editSchedD.description||""} onChange={e => setEditSchedD((d: any) => ({...d, description: e.target.value}))} className={inCls} /></td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            <input type="time" value={editSchedD.start_time||""} onChange={e => setEditSchedD((d: any) => ({...d, start_time: e.target.value}))} className={timeCls} />
                            <span className="text-gray-400 text-xs">→</span>
                            <input type="time" value={editSchedD.end_time||""} onChange={e => setEditSchedD((d: any) => ({...d, end_time: e.target.value}))} className={timeCls} />
                          </div>
                        </td>
                        <td className="py-2 px-3 hidden md:table-cell"><input value={editSchedD.days_of_week||""} onChange={e => setEditSchedD((d: any) => ({...d, days_of_week: e.target.value}))} className={inCls} /></td>
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
                        <td className="py-3 px-3 text-gray-500 text-xs hidden sm:table-cell">{s.description || "—"}</td>
                        <td className="py-3 px-3 font-mono text-xs">{s.start_time} → {s.end_time}</td>
                        <td className="py-3 px-3 text-gray-600 text-xs hidden md:table-cell">{s.days_of_week}</td>
                        <td className="py-3 px-3 text-center text-gray-500 text-xs hidden md:table-cell">{s.classes?.length ?? 0}</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditSchedId(s.id); setEditSchedD({...s}); }}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200" title="Modifier">
                              <EditIcon />
                            </button>
                            <button onClick={() => deleteSched(s.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Supprimer">
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ajout emploi */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                    {addingS ? "Ajout…" : "+ Ajouter"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </AuthGuard>
  );
};

export default ClasseListPage;
