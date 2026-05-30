"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { students as studentsApi, packs as packsApi, packsExt, absences as absencesApi, notes as notesApi, schedules as schedulesApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import { getUser } from "@/lib/useAuth";
import PackForm from "@/components/forms/PackForm";
import StudentForm from "@/components/forms/StudentForm";

// ── Helpers ───────────────────────────────────────────────────
const calcAge = (dob: string) => {
  if (!dob) return "—";
  const d = new Date(dob), t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return `${a} ans`;
};
const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-TN", { day:"2-digit", month:"2-digit", year:"numeric" }) : "—";
const currentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
};

const Section = ({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="font-semibold text-sm text-gray-700">{title}</h2>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Modal = ({ title, onClose, children, size }: { title: string; onClose: () => void; children: React.ReactNode; size?: string }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${size || "max-w-lg"} max-h-[90vh] overflow-hidden flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="overflow-y-auto p-6">{children}</div>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────
const SingleStudentPage = () => {
  const { id } = useParams<{ id: string }>();
  const user    = getUser();
  const isAdmin = user?.role === "administrator";

  const [student, setStudent]           = useState<any>(null);
  const [pack, setPack]                 = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState<string | null>(null);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [editFollowup, setEditFollowup] = useState(false);
  const [followupDraft, setFollowupDraft] = useState<any>({});
  const [unregReason, setUnregReason]   = useState("");
  const [saving, setSaving]             = useState(false);
  const [photoBig, setPhotoBig]         = useState(false);
  const [notesList, setNotesList]           = useState<any[]>([]);
  const [noteText, setNoteText]             = useState("");
  const [noteDate, setNoteDate]             = useState(new Date().toISOString().split("T")[0]);
  const [savingNote, setSavingNote]         = useState(false);
  const [editNoteId, setEditNoteId]         = useState<string | null>(null);
  const [editNoteText, setEditNoteText]     = useState("");
  const [schedulesList, setSchedulesList]   = useState<any[]>([]);
  const [editSchedule, setEditSchedule]     = useState(false);
  const [scheduleDraft, setScheduleDraft]   = useState<string>("");
  const [savingSchedule, setSavingSchedule] = useState(false);

  const API   = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("bk_token") : null;

  const loadNotes = useCallback(async () => {
    if (!id) return;
    try { setNotesList(await notesApi.byStudent(id)); } catch {}
  }, [id]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, p, schs] = await Promise.all([
        studentsApi.get(id),
        packsApi.get(id).catch(() => null),
        schedulesApi.list().catch(() => []),
      ]);
      setStudent(s);
      setPack(p);
      setSchedulesList(schs);
      setFollowupDraft(s.specialized_followup || {});
      setScheduleDraft(s.schedule_id || s.schedule?.id || "");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await notesApi.create({
        student_id: id,
        content: noteText.trim(),
        author: user?.full_name || user?.username || null,
        date: noteDate,
      });
      setNoteText("");
      setNoteDate(new Date().toISOString().split("T")[0]);
      await loadNotes();
    } finally { setSavingNote(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Supprimer cette note ?")) return;
    await notesApi.delete(noteId);
    await loadNotes();
  };

  const handleSaveEditNote = async (noteId: string) => {
    if (!editNoteText.trim()) return;
    setSavingNote(true);
    try {
      await notesApi.update(noteId, { content: editNoteText.trim() });
      setEditNoteId(null);
      await loadNotes();
    } finally { setSavingNote(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>;
  if (!student) return <div className="p-8 text-center text-gray-400">Enfant introuvable.</div>;

  const parents     = student.student_parents?.map((sp: any) => ({ ...sp.parent, relationship: sp.relationship })) || [];
  const father      = parents.find((p: any) => p.relationship === "father");
  const mother      = parents.find((p: any) => p.relationship === "mother");
  const absences    = student.absences || [];
  const payments    = student.payments || [];
  const checklist   = student.registration_checklist || {};
  const followup    = student.specialized_followup;
  const className   = student.class?.name || "—";
  const teacherName = student.class?.teacher?.user?.full_name || "—";
  const scheduleName = student.schedule?.name || student.class?.schedule?.name || "—";
  const absCount    = absences.length;
  const attendRate  = Math.max(0, Math.round(((180 - absCount) / 180) * 100));
  const paidCount   = payments.filter((p: any) => p.status === "paid").length;
  const overdueCount  = payments.filter((p: any) => p.status === "overdue").length;
  const pendingCount  = payments.filter((p: any) => p.status === "pending").length;
  const totalAmount   = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + p.amount, 0);
  const overdueAmount = payments.filter((p: any) => p.status === "overdue").reduce((s: number, p: any) => s + p.amount, 0);

  const checkItems = [
    { key: "photo_identite",            label: "Photo d'identité",       icon: "📷" },
    { key: "extrait_naissance",          label: "Extrait de naissance",   icon: "📋" },
    { key: "certificat_medical",         label: "Certificat médical",     icon: "🏥" },
    { key: "fiche_renseignement_signee", label: "Fiche de renseignement", icon: "✍️" },
    { key: "vaccinations_a_jour",        label: "Carnet de vaccinations", icon: "💉" },
    { key: "copie_cin_pere",             label: "Copie CIN père",         icon: "🪪" },
    { key: "copie_cin_mere",             label: "Copie CIN mère",         icon: "🪪" },
  ];
  const checkDone = checkItems.filter(i => checklist[i.key]).length;
  const checkTotal = checkItems.length;

  const FOLLOWUP_LABELS: Record<string, string> = {
    pedo_psy:"Pédopsychiatre", psychologue:"Psychologue", orthophoniste:"Orthophoniste",
    ergotherapeute:"Ergothérapeute", psychomotricien:"Psychomotricien", autre:"Autre",
  };

  // Alertes — filtrées selon le rôle
  const alerts = [
    isAdmin && overdueCount > 0 && { color: "bg-red-50 border-red-200 text-red-700",       icon: "💰", msg: `${overdueCount} paiement(s) en retard — ${overdueAmount} DT` },
    isAdmin && checkDone < checkTotal && { color: "bg-orange-50 border-orange-200 text-orange-700", icon: "📁", msg: `Dossier incomplet — ${checkTotal - checkDone} document(s) manquant(s)` },
    followup                    && { color: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: "🧠", msg: `Suivi spécialisé actif — ${FOLLOWUP_LABELS[followup.type] || followup.type}` },
    student.unregistered_at     && { color: "bg-gray-100 border-gray-300 text-gray-600",      icon: "🚪", msg: `Désinscrit le ${fmt(student.unregistered_at)} — ${student.unregistered_reason || ""}` },
  ].filter(Boolean) as any[];

  const saveFollowup = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          followup_type: followupDraft.type,
          followup_specialist_name: followupDraft.specialist_name,
          followup_specialist_phone: followupDraft.specialist_phone,
          followup_specialist_email: followupDraft.specialist_email,
          followup_frequency: followupDraft.frequency,
          followup_class_recommendations: followupDraft.class_recommendations,
          followup_notes: followupDraft.notes,
        }),
      });
      setEditFollowup(false);
      load();
    } finally { setSaving(false); }
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await studentsApi.update(id, { schedule_id: scheduleDraft || null });
      setEditSchedule(false);
      load();
    } finally { setSavingSchedule(false); }
  };

  const markPaymentPaid = async (paymentId: string) => {
    await packsApi.markPaid(paymentId);
    load();
  };

  const handleUnregister = async () => {
    if (!unregReason.trim()) return;
    setSaving(true);
    try {
      await studentsApi.unregister(id, unregReason);
      setModal(null);
      load();
    } finally { setSaving(false); }
  };

  const updateAbsence = async (absenceId: string, data: any) => {
    await absencesApi.update(absenceId, data);
    load();
  };

  const TYPE_COLORS: Record<string, string> = {
    scolarite:  "bg-blue-100 text-blue-700",
    cantine:    "bg-green-100 text-green-700",
    transport:  "bg-purple-100 text-purple-700",
    inscription: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-4 flex flex-col gap-4 max-w-7xl mx-auto">

      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href="/list/students" className="hover:text-blue-500">Enfants</Link>
        <span>/</span>
        <span className="text-gray-600 font-medium">{student.full_name}</span>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((a: any, i: number) => (
            <div key={i} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${a.color}`}>
              <span>{a.icon}</span><span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* HERO */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Photo */}
          <div className="relative shrink-0 cursor-pointer" onClick={() => student.photo_url && setPhotoBig(true)}>
            {student.photo_url ? (
              <img
                src={getMediaUrl(student.photo_url)!}
                alt={student.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-lg hover:opacity-90 transition"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-4xl font-bold shadow-lg">
                {student.full_name?.charAt(0).toUpperCase()}
              </div>
            )}
            {student.archived && <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full">Archivé</span>}
          </div>

          {/* Identité */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold">{student.full_name}</h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  {student.gender === "M" ? "👦 Garçon" : "👧 Fille"} · {calcAge(student.date_of_birth)} · Né(e) le {fmt(student.date_of_birth)}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Boutons admin uniquement */}
                {isAdmin && (
                  <button onClick={() => setModal("edit")}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition font-medium">
                    ✏️ Modifier
                  </button>
                )}
                {isAdmin && !student.unregistered_at && !student.archived && (
                  <button onClick={() => setModal("unregister")}
                    className="text-xs bg-red-500/80 hover:bg-red-600 px-3 py-1.5 rounded-lg transition">
                    🚪 Désinscrire
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setModal("pack")}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
                    ⚙️ Pack financier
                  </button>
                )}
                {/* Impression */}
                <div className="relative">
                  <button
                    onClick={() => setPrintMenuOpen(o => !o)}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    🖨️ Imprimer ▾
                  </button>
                  {printMenuOpen && (
                    <div className="absolute right-0 top-9 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-2 w-52">
                      <a href={`/student/${id}/inscription`} target="_blank" rel="noreferrer"
                        onClick={() => setPrintMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                        📄 Bulletin d'inscription
                      </a>
                      <a href={`/student/${id}/presence`} target="_blank" rel="noreferrer"
                        onClick={() => setPrintMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                        📋 Attestation de scolarité
                      </a>
                      <p className="px-3 py-1.5 text-xs text-gray-400 italic">Les reçus sont disponibles mois par mois ci-dessous</p>
                    </div>
                  )}
                </div>
                <Link href="/list/students" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
                  ← Retour
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <span className="bg-white/20 rounded-lg px-3 py-1">🏫 {className}</span>
              <span className="bg-white/20 rounded-lg px-3 py-1">📚 {student.grade}</span>
              <span className="bg-white/20 rounded-lg px-3 py-1">👩‍🏫 {teacherName}</span>
              <span className="bg-white/20 rounded-lg px-3 py-1">🕐 {scheduleName}</span>
              <span className="bg-white/20 rounded-lg px-3 py-1">📅 Inscrit le {fmt(student.registration_date)}</span>
              {pack && <span className="bg-white/20 rounded-lg px-3 py-1">🎓 {pack.school_year}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rapides — admin : 4 cards / enseignante : 2 cards */}
      <div className={`grid gap-3 ${isAdmin ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"}`}>
        {[
          { icon:"📅", label:"Présence",  value:`${attendRate}%`, color: attendRate>=90?"text-green-600":attendRate>=75?"text-orange-500":"text-red-500", show: true },
          { icon:"❌", label:"Absences",  value:absCount,          color: absCount===0?"text-green-600":"text-orange-500", show: true },
          { icon:"💰", label:"Encaissé",  value:`${totalAmount} DT`, color:"text-green-600", show: isAdmin },
          { icon:"⚠️", label:"En retard", value:`${overdueAmount} DT`, color: overdueCount>0?"text-red-500":"text-green-600", show: isAdmin },
        ].filter(s => s.show).map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <span className="text-xl">{s.icon}</span>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Gauche 2/3 */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Parents */}
          <Section title="Parents & Contacts d'urgence" icon="👨‍👩‍👧">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ parent: father, role:"Père", icon:"👨" }, { parent: mother, role:"Mère", icon:"👩" }].map(({ parent: p, role, icon }) => (
                <div key={role} className={`rounded-xl p-4 border ${p?.marital_status==="deceased"?"bg-gray-50 border-gray-200 opacity-60":"bg-blue-50 border-blue-100"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-semibold text-sm">{role}</span>
                    {p?.marital_status==="deceased" && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full ml-auto">Décédé(e)</span>}
                    {p?.marital_status==="divorced"  && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full ml-auto">Divorcé(e)</span>}
                  </div>
                  {p ? (
                    <div className="flex flex-col gap-1.5 text-sm">
                      <p className="font-medium">{p.full_name}</p>
                      {p.cin        && <p className="text-gray-600 text-xs">🪪 CIN : {p.cin}</p>}
                      {p.profession && <p className="text-gray-600 text-xs">💼 {p.profession}</p>}
                      {p.phone && <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">📞 {p.phone}</a>}
                      {p.email && <p className="text-gray-500 text-xs">✉️ {p.email}</p>}
                      {p.address && <p className="text-gray-400 text-xs">📍 {p.address}</p>}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">Non renseigné</p>}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Absences (placé AVANT suivi paiements) ── */}
          <Section title="Historique des absences" icon="📅">
            {absences.length === 0 ? (
              <div className="text-center py-6"><p className="text-4xl mb-2">🎉</p><p className="text-sm text-green-600 font-medium">Aucune absence</p></div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Taux de présence</span><span className="font-semibold">{attendRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${attendRate>=90?"bg-green-500":attendRate>=75?"bg-orange-400":"bg-red-500"}`}
                      style={{ width:`${attendRate}%` }} />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b">
                        <th className="py-2">Date</th>
                        <th className="py-2">Raison</th>
                        <th className="py-2">Justifiée</th>
                        {isAdmin && <th className="py-2">Certificat / Retour</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {absences.slice(0, 15).map((a: any) => (
                        <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2">{fmt(a.date)}</td>
                          <td className="py-2 text-gray-600">
                            {a.reason || "—"}
                            {a.reason === "Maladie" && !a.medical_certificate && (
                              <span className="ml-1 text-orange-400">⚠️</span>
                            )}
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${a.excused?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>
                              {a.excused ? "Oui" : "Non"}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-2">
                              {a.reason === "Maladie" ? (
                                a.apt_to_return ? (
                                  <span className="text-xs text-green-600 font-medium">✅ Apte au retour</span>
                                ) : a.medical_certificate ? (
                                  <button
                                    onClick={() => updateAbsence(a.id, { apt_to_return: true, excused: true })}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-0.5 rounded transition"
                                  >
                                    ✅ Marquer apte
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => updateAbsence(a.id, { medical_certificate: true })}
                                    className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-0.5 rounded transition"
                                  >
                                    📄 Certificat reçu
                                  </button>
                                )
                              ) : (
                                <span className="text-xs text-gray-300">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>

          {/* ── Notes & Recommandations ── */}
          <Section
            title="Notes & Recommandations"
            icon="📝"
            action={
              <span className="text-xs text-gray-400">{notesList.length} note(s)</span>
            }
          >
            {/* Formulaire d'ajout */}
            <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-2">Ajouter une note</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <input
                  type="date"
                  value={noteDate}
                  onChange={e => setNoteDate(e.target.value)}
                  className="border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                />
                <span className="text-xs text-gray-400 self-center">
                  — {user?.full_name || user?.username || "Utilisateur"}
                </span>
              </div>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Observation, recommandation pédagogique, comportement, suivi..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40 transition"
                >
                  {savingNote ? "Enregistrement..." : "Ajouter la note"}
                </button>
              </div>
            </div>

            {/* Liste des notes */}
            {notesList.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucune note pour cet enfant</p>
            ) : (
              <div className="space-y-3">
                {notesList.map((n: any) => (
                  <div key={n.id} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition">
                    {editNoteId === n.id ? (
                      <div>
                        <textarea
                          value={editNoteText}
                          onChange={e => setEditNoteText(e.target.value)}
                          rows={3}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <button
                            onClick={() => handleSaveEditNote(n.id)}
                            disabled={savingNote}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition disabled:opacity-50"
                          >
                            {savingNote ? "..." : "Enregistrer"}
                          </button>
                          <button
                            onClick={() => setEditNoteId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-blue-600">
                              {new Date(n.date).toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" })}
                            </span>
                            {n.author && (
                              <span className="text-xs text-gray-400">— {n.author}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => { setEditNoteId(n.id); setEditNoteText(n.content); }}
                            className="text-xs text-blue-400 hover:text-blue-600 px-1.5 py-0.5 rounded transition"
                            title="Modifier"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded transition"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Paiements — directrice uniquement */}
          {isAdmin && (
            <Section title="Suivi des paiements" icon="💰"
              action={
                <button onClick={() => setModal("pack")}
                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition">
                  ⚙️ Configurer
                </button>
              }>
              {payments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">💡</p>
                  <p className="text-sm text-gray-400">Aucun paiement — Configurez le pack financier</p>
                  <button onClick={() => setModal("pack")}
                    className="mt-3 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                    ⚙️ Configurer le pack
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-3 mb-4">
                    {[
                      { label:"Réglés",     count:paidCount,   color:"bg-green-100 text-green-700" },
                      { label:"En attente", count:pendingCount, color:"bg-yellow-100 text-yellow-700" },
                      { label:"En retard",  count:overdueCount, color:"bg-red-100 text-red-600" },
                    ].map(s => (
                      <div key={s.label} className={`flex-1 rounded-lg p-2 text-center ${s.color}`}>
                        <p className="text-xl font-bold">{s.count}</p>
                        <p className="text-xs">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const MONTHS_LABELS: Record<number, string> = {
                      9:'Sept', 10:'Oct', 11:'Nov', 12:'Déc',
                      1:'Jan', 2:'Fév', 3:'Mar', 4:'Avr', 5:'Mai', 6:'Juin'
                    };
                    const grouped: Record<string, any> = {};
                    for (const p of payments) {
                      const key = `${p.year ?? new Date(p.due_date).getFullYear()}-${p.month ?? (new Date(p.due_date).getMonth()+1)}`;
                      if (!grouped[key]) {
                        const m = p.month ?? (new Date(p.due_date).getMonth()+1);
                        const y = p.year ?? new Date(p.due_date).getFullYear();
                        grouped[key] = { month: m, year: y, label: `${MONTHS_LABELS[m] || m} ${y}`, payments: [], total: 0, totalPaid: 0 };
                      }
                      grouped[key].payments.push(p);
                      grouped[key].total += p.amount;
                      if (p.status === 'paid') grouped[key].totalPaid += p.amount;
                    }
                    const groups = Object.values(grouped).sort((a: any, b: any) =>
                      a.year !== b.year ? a.year - b.year :
                      (a.month === 1 || a.month <= 6 ? a.month + 12 : a.month) -
                      (b.month === 1 || b.month <= 6 ? b.month + 12 : b.month)
                    );
                    return (
                      <div className="flex flex-col gap-3">
                        {groups.map((g: any) => {
                          const allPaid = g.payments.every((p: any) => p.status === 'paid');
                          const remaining = g.total - g.totalPaid;
                          return (
                            <div key={`${g.year}-${g.month}`} className="border border-gray-200 rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between bg-gray-50 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{g.label}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${allPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {allPaid ? '✓ Tout payé' : `${g.totalPaid.toFixed(0)} / ${g.total.toFixed(0)} DT`}
                                  </span>
                                </div>
                                {/* Reçu du mois */}
                                {allPaid && (
                                  <a
                                    href={`/student/${id}/receipt?month=${g.month}&year=${g.year}`}
                                    target="_blank" rel="noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title="Imprimer le reçu du mois"
                                  >
                                    🧾 Reçu
                                  </a>
                                )}
                                {!allPaid && (
                                  <button
                                    onClick={async () => {
                                      const unpaid = g.payments.filter((p: any) => p.status !== 'paid');
                                      for (const p of unpaid) await packsApi.markPaid(p.id);
                                      const updated = await studentsApi.get(id);
                                      setStudent(updated);
                                    }}
                                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium transition"
                                  >
                                    ✓ Tout payer ({remaining.toFixed(0)} DT)
                                  </button>
                                )}
                              </div>
                              <div className="divide-y divide-gray-100">
                                {g.payments.map((p: any) => {
                                  const isDeletable = p.type !== 'scolarite' && p.type !== 'inscription' && p.status !== 'paid';
                                  return (
                                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded text-xs shrink-0 ${TYPE_COLORS[p.type] || 'bg-orange-100 text-orange-600'}`}>
                                      {p.type?.startsWith('club_')
                                        ? '🎨 ' + p.type.replace('club_', '').replace(/_/g, ' ')
                                        : p.type === 'cantine'   ? '🍽 Cantine'
                                        : p.type === 'transport' ? '🚌 Transport'
                                        : p.type === 'scolarite' ? '📚 Scolarité'
                                        : p.type === 'inscription' ? '📝 Inscription'
                                        : p.type}
                                    </span>
                                    <span className="flex-1 text-gray-500 truncate hidden sm:block">{p.description}</span>
                                    <span className="font-semibold w-16 text-right">{p.amount} DT</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs w-20 text-center shrink-0 ${
                                      p.status==='paid' ? 'bg-green-100 text-green-700' :
                                      p.status==='overdue' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {p.status==='paid' ? '✓ Payé' : p.status==='overdue' ? '⚠ Retard' : '⏳ Attente'}
                                    </span>
                                    {/* Payer / date payée */}
                                    {p.status !== 'paid' ? (
                                      <button
                                        onClick={async () => { await packsApi.markPaid(p.id); const u = await studentsApi.get(id); setStudent(u); }}
                                        className="text-xs text-blue-600 hover:text-blue-800 shrink-0 underline"
                                      >
                                        Payer
                                      </button>
                                    ) : (
                                      <span className="text-xs text-gray-400 shrink-0">{fmt(p.paid_date)}</span>
                                    )}
                                    {/* Supprimer — uniquement cantine, transport, clubs */}
                                    {isDeletable && (
                                      <button
                                        title="Supprimer ce paiement"
                                        onClick={async () => {
                                          if (!confirm(`Supprimer "${p.description}" ?`)) return;
                                          await packsExt.deletePayment(p.id);
                                          const u = await studentsApi.get(id);
                                          setStudent(u);
                                        }}
                                        className="w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition shrink-0"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          <polyline points="3 6 5 6 21 6"/>
                                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                          <path d="M10 11v6M14 11v6"/>
                                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </Section>
          )}
        </div>

        {/* Droite 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Dossier — directrice uniquement */}
          {isAdmin && (
            <Section title="Dossier d'inscription" icon="📁">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${checkDone===checkTotal?"bg-green-500":"bg-orange-400"}`}
                    style={{ width:`${(checkDone/checkTotal)*100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600">{checkDone}/{checkTotal}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {checkItems.map(item => (
                  <div key={item.key} className={`flex items-center justify-between p-2 rounded-lg text-xs ${checklist[item.key]?"bg-green-50":"bg-red-50"}`}>
                    <span>{item.icon} {item.label}</span>
                    <span>{checklist[item.key]?"✅":"❌"}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Suivi spécialisé — directrice uniquement */}
          {isAdmin && (
            <Section title="Suivi spécialisé" icon="🧠"
              action={
                <button onClick={() => setEditFollowup(v => !v)}
                  className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-200 transition">
                  {editFollowup ? "Annuler" : "✏️ Modifier"}
                </button>
              }>
              {editFollowup ? (
                <div className="flex flex-col gap-3">
                  {[
                    { label:"Type", field:"type", type:"select", options:[
                      {v:"pedo_psy",l:"Pédopsychiatre"},{v:"psychologue",l:"Psychologue"},
                      {v:"orthophoniste",l:"Orthophoniste"},{v:"ergotherapeute",l:"Ergothérapeute"},
                      {v:"psychomotricien",l:"Psychomotricien"},{v:"autre",l:"Autre"},
                    ]},
                    { label:"Spécialiste", field:"specialist_name", type:"text" },
                    { label:"Téléphone", field:"specialist_phone", type:"text" },
                    { label:"Email", field:"specialist_email", type:"email" },
                    { label:"Fréquence", field:"frequency", type:"select", options:[
                      {v:"hebdo",l:"Hebdomadaire"},{v:"bimensuel",l:"Bimensuelle"},
                      {v:"mensuel",l:"Mensuelle"},{v:"ponctuel",l:"Ponctuelle"},
                    ]},
                  ].map(f => (
                    <div key={f.field}>
                      <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                      {f.type === "select" ? (
                        <select value={followupDraft[f.field]||""} onChange={e => setFollowupDraft((d: any) => ({...d, [f.field]:e.target.value}))}
                          className="border border-gray-300 rounded-md p-2 text-xs w-full">
                          <option value="">— Sélectionner —</option>
                          {f.options?.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} value={followupDraft[f.field]||""} onChange={e => setFollowupDraft((d: any) => ({...d, [f.field]:e.target.value}))}
                          className="border border-gray-300 rounded-md p-2 text-xs w-full" />
                      )}
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Recommandations classe</label>
                    <textarea value={followupDraft.class_recommendations||""} rows={2}
                      onChange={e => setFollowupDraft((d: any) => ({...d, class_recommendations:e.target.value}))}
                      className="border border-gray-300 rounded-md p-2 text-xs w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Notes confidentielles</label>
                    <textarea value={followupDraft.notes||""} rows={2}
                      onChange={e => setFollowupDraft((d: any) => ({...d, notes:e.target.value}))}
                      className="border border-gray-300 rounded-md p-2 text-xs w-full" />
                  </div>
                  <button onClick={saveFollowup} disabled={saving}
                    className="bg-orange-500 text-white p-2 rounded-lg text-xs font-medium hover:bg-orange-600 transition disabled:opacity-50">
                    {saving ? "Enregistrement..." : "✅ Enregistrer"}
                  </button>
                </div>
              ) : followup ? (
                <div className="flex flex-col gap-3">
                  <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1 rounded-full w-fit">
                    {FOLLOWUP_LABELS[followup.type] || followup.type}
                  </span>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="font-semibold text-sm">{followup.specialist_name}</p>
                    {followup.specialist_phone && <a href={`tel:${followup.specialist_phone}`} className="text-xs text-blue-600">📞 {followup.specialist_phone}</a>}
                    {followup.specialist_email && <p className="text-xs text-gray-500">✉️ {followup.specialist_email}</p>}
                  </div>
                  {followup.class_recommendations && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-700 mb-1">📌 Recommandations</p>
                      <p className="text-xs text-gray-600">{followup.class_recommendations}</p>
                    </div>
                  )}
                  {followup.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">📝 Notes</p>
                      <p className="text-xs text-gray-600">{followup.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-xs text-gray-400">Pas de suivi spécialisé</p>
                  <button onClick={() => setEditFollowup(true)}
                    className="mt-2 text-xs text-orange-500 hover:underline">+ Ajouter un suivi</button>
                </div>
              )}
            </Section>
          )}

          {/* Arrangement particulier — admin uniquement */}
          {isAdmin && (
            <Section title="Arrangement particulier" icon="📅"
              action={
                <button onClick={() => setEditSchedule(v => !v)}
                  className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition">
                  {editSchedule ? "Annuler" : "✏️ Modifier"}
                </button>
              }>
              {editSchedule ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Emploi du temps personnel</label>
                    <select
                      value={scheduleDraft}
                      onChange={e => setScheduleDraft(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="">— Hérité de la classe —</option>
                      {schedulesList.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>
                      ))}
                    </select>
                    {!scheduleDraft && student.class?.schedule && (
                      <p className="text-xs text-gray-400 mt-1">↳ Classe : {student.class.schedule.name} ({student.class.schedule.start_time}–{student.class.schedule.end_time})</p>
                    )}
                  </div>
                  <button onClick={saveSchedule} disabled={savingSchedule}
                    className="bg-blue-500 text-white p-2 rounded-lg text-xs font-medium hover:bg-blue-600 transition disabled:opacity-50">
                    {savingSchedule ? "Enregistrement..." : "✅ Enregistrer"}
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  {student.schedule ? (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-semibold text-blue-700">{student.schedule.name}</p>
                      <p className="text-gray-500 mt-0.5">{student.schedule.start_time} – {student.schedule.end_time}</p>
                      {student.schedule.days_of_week && <p className="text-gray-400 mt-0.5">{student.schedule.days_of_week}</p>}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-gray-400">
                      <p>Aucun arrangement — emploi de la classe</p>
                      {student.class?.schedule && (
                        <p className="mt-1 text-gray-300 text-xs">↳ {student.class.schedule.name}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          {/* Informations */}
          <Section title="Informations" icon="ℹ️">
            <div className="flex flex-col gap-0">
              {[
                { label:"Date d'inscription", value:fmt(student.registration_date) },
                { label:"Année scolaire",     value:pack?.school_year || currentSchoolYear() },
                { label:"Classe",             value:className },
                { label:"Niveau",             value:student.grade||"—" },
                { label:"Genre",              value:student.gender==="M"?"👦 Garçon":"👧 Fille" },
                { label:"Enseignante",        value:teacherName },
                { label:"Emploi du temps",    value:scheduleName },
                ...(student.unregistered_at ? [
                  { label:"Désinscrit le", value:fmt(student.unregistered_at) },
                  { label:"Motif",         value:student.unregistered_reason||"—" },
                ] : []),
              ].map((r, i, arr) => (
                <div key={r.label} className={`flex justify-between py-2 text-xs ${i<arr.length-1?"border-b border-gray-50":""}`}>
                  <span className="text-gray-400">{r.label}</span>
                  <span className="font-medium text-gray-700">{r.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Modal Modifier enfant */}
      {modal === "edit" && (
        <Modal title="✏️ Modifier l'enfant" onClose={() => setModal(null)} size="max-w-3xl">
          <StudentForm type="update" data={student} onSuccess={() => { setModal(null); load(); }} />
        </Modal>
      )}

      {/* Modal Pack */}
      {modal === "pack" && (
        <Modal title="⚙️ Pack financier" onClose={() => setModal(null)}>
          <PackForm studentId={id} existingPack={pack} onSuccess={() => { setModal(null); load(); }} />
        </Modal>
      )}

      {/* Modal Désinscription */}
      {modal === "unregister" && (
        <Modal title="🚪 Désinscription" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              ⚠️ Cette action va archiver l'enfant et enregistrer la date de désinscription.
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Motif de désinscription *</label>
              <textarea value={unregReason} onChange={e => setUnregReason(e.target.value)} rows={3}
                className="border border-gray-300 rounded-lg p-3 text-sm w-full"
                placeholder="Ex: Déménagement, changement d'école, fin de cycle..." />
            </div>
            <button onClick={handleUnregister} disabled={saving || !unregReason.trim()}
              className="bg-red-500 text-white p-2.5 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50">
              {saving ? "En cours..." : "Confirmer la désinscription"}
            </button>
          </div>
        </Modal>
      )}

      {/* Photo en grand */}
      {photoBig && student.photo_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setPhotoBig(false)}>
          <img src={getMediaUrl(student.photo_url)!} alt={student.full_name}
            className="max-w-sm max-h-[80vh] rounded-2xl shadow-2xl object-cover" />
        </div>
      )}
    </div>
  );
};

export default SingleStudentPage;
