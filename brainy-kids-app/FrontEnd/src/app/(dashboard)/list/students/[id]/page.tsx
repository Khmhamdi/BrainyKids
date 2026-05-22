"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { students as studentsApi, packs as packsApi } from "@/lib/api";
import PackForm from "@/components/forms/PackForm";

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

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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
  const [student, setStudent]         = useState<any>(null);
  const [pack, setPack]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<string | null>(null);
  const [editFollowup, setEditFollowup] = useState(false);
  const [followupDraft, setFollowupDraft] = useState<any>({});
  const [unregReason, setUnregReason] = useState("");
  const [saving, setSaving]           = useState(false);
  const [photoBig, setPhotoBig]       = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("bk_token") : null;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, p] = await Promise.all([studentsApi.get(id), packsApi.get(id).catch(() => null)]);
      setStudent(s);
      setPack(p);
      setFollowupDraft(s.specialized_followup || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" /></div>;
  if (!student) return <div className="p-8 text-center text-gray-400">Enfant introuvable.</div>;

  const parents    = student.student_parents?.map((sp: any) => ({ ...sp.parent, relationship: sp.relationship })) || [];
  const father     = parents.find((p: any) => p.relationship === "father");
  const mother     = parents.find((p: any) => p.relationship === "mother");
  const absences   = student.absences || [];
  const payments   = student.payments || [];
  const checklist  = student.registration_checklist || {};
  const followup   = student.specialized_followup;
  const className  = student.class?.name || "—";
  const teacherName = student.class?.teacher?.user?.full_name || "—";
  const scheduleName = student.schedule?.name || student.class?.schedule?.name || "—";
  const absCount   = absences.length;
  const attendRate = Math.max(0, Math.round(((180 - absCount) / 180) * 100));
  const paidCount  = payments.filter((p: any) => p.status === "paid").length;
  const overdueCount = payments.filter((p: any) => p.status === "overdue").length;
  const pendingCount = payments.filter((p: any) => p.status === "pending").length;
  const totalAmount = payments.filter((p:any) => p.status === "paid").reduce((s:number, p:any) => s + p.amount, 0);
  const overdueAmount = payments.filter((p:any) => p.status === "overdue").reduce((s:number, p:any) => s + p.amount, 0);

  const checkItems = [
    { key: "photo_identite",            label: "Photo d'identité",       icon: "📷" },
    { key: "extrait_naissance",          label: "Extrait de naissance",   icon: "📋" },
    { key: "certificat_medical",         label: "Certificat médical",     icon: "🏥" },
    { key: "fiche_renseignement_signee", label: "Fiche de renseignement", icon: "✍️" },
    { key: "vaccinations_a_jour",        label: "Carnet de vaccinations", icon: "💉" },
    { key: "autorisation_sortie",        label: "Autorisation de sortie", icon: "🚶" },
  ];
  const checkDone = checkItems.filter(i => checklist[i.key]).length;

  const FOLLOWUP_LABELS: Record<string, string> = {
    pedo_psy:"Pédopsychiatre", psychologue:"Psychologue", orthophoniste:"Orthophoniste",
    ergotherapeute:"Ergothérapeute", psychomotricien:"Psychomotricien", autre:"Autre",
  };

  // Alertes
  const alerts = [
    overdueCount > 0 && { color: "bg-red-50 border-red-200 text-red-700", icon: "💰", msg: `${overdueCount} paiement(s) en retard — ${overdueAmount} DT` },
    checkDone < 6      && { color: "bg-orange-50 border-orange-200 text-orange-700", icon: "📁", msg: `Dossier incomplet — ${6 - checkDone} document(s) manquant(s)` },
    followup           && { color: "bg-yellow-50 border-yellow-200 text-yellow-700", icon: "🧠", msg: `Suivi spécialisé actif — ${FOLLOWUP_LABELS[followup.type] || followup.type}` },
    student.unregistered_at && { color: "bg-gray-100 border-gray-300 text-gray-600", icon: "🚪", msg: `Désinscrit le ${fmt(student.unregistered_at)} — ${student.unregistered_reason || ""}` },
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

  const TYPE_COLORS: Record<string, string> = {
    scolarite: "bg-blue-100 text-blue-700",
    cantine:   "bg-green-100 text-green-700",
    transport: "bg-purple-100 text-purple-700",
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
                src={`http://localhost${student.photo_url}`}
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
                {!student.unregistered_at && !student.archived && (
                  <button onClick={() => setModal("unregister")}
                    className="text-xs bg-red-500/80 hover:bg-red-600 px-3 py-1.5 rounded-lg transition">
                    🚪 Désinscrire
                  </button>
                )}
                <button onClick={() => setModal("pack")}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
                  ⚙️ Pack financier
                </button>
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

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon:"📅", label:"Présence", value:`${attendRate}%`, color: attendRate>=90?"text-green-600":attendRate>=75?"text-orange-500":"text-red-500" },
          { icon:"❌", label:"Absences", value:absCount, color: absCount===0?"text-green-600":"text-orange-500" },
          { icon:"💰", label:"Encaissé", value:`${totalAmount} DT`, color:"text-green-600" },
          { icon:"⚠️", label:"En retard", value:`${overdueAmount} DT`, color: overdueCount>0?"text-red-500":"text-green-600" },
        ].map(s => (
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
                      {p.phone && <a href={`tel:${p.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">📞 {p.phone}</a>}
                      {p.email && <p className="text-gray-500 text-xs">✉️ {p.email}</p>}
                      {p.address && <p className="text-gray-400 text-xs">📍 {p.address}</p>}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">Non renseigné</p>}
                </div>
              ))}
            </div>
          </Section>

          {/* Paiements */}
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
                    { label:"Réglés", count:paidCount, color:"bg-green-100 text-green-700" },
                    { label:"En attente", count:pendingCount, color:"bg-yellow-100 text-yellow-700" },
                    { label:"En retard", count:overdueCount, color:"bg-red-100 text-red-600" },
                  ].map(s => (
                    <div key={s.label} className={`flex-1 rounded-lg p-2 text-center ${s.color}`}>
                      <p className="text-xl font-bold">{s.count}</p>
                      <p className="text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-400 border-b">
                        <th className="py-2 font-medium">Description</th>
                        <th className="py-2 font-medium">Montant</th>
                        <th className="py-2 font-medium">Échéance</th>
                        <th className="py-2 font-medium">Statut</th>
                        <th className="py-2 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p: any) => (
                        <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full mr-1 ${TYPE_COLORS[p.type] || "bg-gray-100 text-gray-600"}`}>
                              {p.type}
                            </span>
                            {p.description}
                          </td>
                          <td className="py-2 font-semibold">{p.amount} DT</td>
                          <td className="py-2">{fmt(p.due_date)}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              p.status==="paid"?"bg-green-100 text-green-700":
                              p.status==="overdue"?"bg-red-100 text-red-600":"bg-yellow-100 text-yellow-700"}`}>
                              {p.status==="paid"?"✓ Payé":p.status==="overdue"?"⚠ Retard":"⏳ Attente"}
                            </span>
                          </td>
                          <td className="py-2">
                            {p.status !== "paid" && (
                              <button onClick={() => markPaymentPaid(p.id)}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                                Marquer payé
                              </button>
                            )}
                            {p.status === "paid" && <span className="text-xs text-gray-400">{fmt(p.paid_date)}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Section>

          {/* Absences */}
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
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b">
                    <th className="py-2">Date</th><th className="py-2">Raison</th><th className="py-2">Justifiée</th>
                  </tr></thead>
                  <tbody>
                    {absences.slice(0,10).map((a: any) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2">{fmt(a.date)}</td>
                        <td className="py-2 text-gray-600">{a.reason||"—"}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${a.excused?"bg-green-100 text-green-700":"bg-red-100 text-red-600"}`}>
                            {a.excused?"Oui":"Non"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </Section>
        </div>

        {/* Droite 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Dossier */}
          <Section title="Dossier d'inscription" icon="📁">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${checkDone===6?"bg-green-500":"bg-orange-400"}`}
                  style={{ width:`${(checkDone/6)*100}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-600">{checkDone}/6</span>
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

          {/* Suivi spécialisé */}
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
                      <select value={followupDraft[f.field]||""} onChange={e => setFollowupDraft((d:any) => ({...d, [f.field]:e.target.value}))}
                        className="border border-gray-300 rounded-md p-2 text-xs w-full">
                        <option value="">— Sélectionner —</option>
                        {f.options?.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} value={followupDraft[f.field]||""} onChange={e => setFollowupDraft((d:any) => ({...d, [f.field]:e.target.value}))}
                        className="border border-gray-300 rounded-md p-2 text-xs w-full" />
                    )}
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Recommandations classe</label>
                  <textarea value={followupDraft.class_recommendations||""} rows={2}
                    onChange={e => setFollowupDraft((d:any) => ({...d, class_recommendations:e.target.value}))}
                    className="border border-gray-300 rounded-md p-2 text-xs w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Notes confidentielles</label>
                  <textarea value={followupDraft.notes||""} rows={2}
                    onChange={e => setFollowupDraft((d:any) => ({...d, notes:e.target.value}))}
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

          {/* Informations */}
          <Section title="Informations" icon="ℹ️">
            <div className="flex flex-col gap-0">
              {[
                { label:"Date d'inscription", value:fmt(student.registration_date) },
                { label:"Année scolaire", value:pack?.school_year || currentSchoolYear() },
                { label:"Classe", value:className },
                { label:"Niveau", value:student.grade||"—" },
                { label:"Genre", value:student.gender==="M"?"👦 Garçon":"👧 Fille" },
                { label:"Enseignante", value:teacherName },
                { label:"Emploi du temps", value:scheduleName },
                ...(student.unregistered_at ? [
                  { label:"Désinscrit le", value:fmt(student.unregistered_at) },
                  { label:"Motif", value:student.unregistered_reason||"—" },
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
          <img src={`http://localhost${student.photo_url}`} alt={student.full_name}
            className="max-w-sm max-h-[80vh] rounded-2xl shadow-2xl object-cover" />
        </div>
      )}
    </div>
  );
};

export default SingleStudentPage;
