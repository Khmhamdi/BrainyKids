"use client";
import { useEffect, useState, useCallback } from "react";
import { clubs as clubsApi, packsExt, students as studentsApi } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:outline-none";
const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

const TABS = [
  { k: "list", l: "📋 Inscrits été"        },
  { k: "new",  l: "➕ Nouvelle inscription" },
];

// ── Formulaire d'inscription été ──────────────────────────────
const InscriptionForm = ({ students, clubsEte, onSuccess }: {
  students: any[];
  clubsEte: any[];
  onSuccess: () => void;
}) => {
  const [type,          setType]          = useState<"inscrit" | "externe">("inscrit");
  const [studentId,     setStudentId]     = useState("");
  const [months,        setMonths]        = useState<number[]>([]);
  const [year,          setYear]          = useState(new Date().getFullYear());
  const [packAmount,    setPackAmount]    = useState("");
  const [selectedClubs, setSelectedClubs] = useState<Record<string, { name: string; price: string }>>({});
  const [fullName,      setFullName]      = useState("");
  const [dob,           setDob]           = useState("");
  const [gender,        setGender]        = useState("M");
  const [parentName,    setParentName]    = useState("");
  const [parentPhone,   setParentPhone]   = useState("");
  const [parentEmail,   setParentEmail]   = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const toggleMonth = (m: number) =>
    setMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const toggleClub = (club: any) =>
    setSelectedClubs(prev => {
      if (prev[club.id]) { const next = { ...prev }; delete next[club.id]; return next; }
      return { ...prev, [club.id]: { name: club.name, price: String(club.price ?? 0) } };
    });

  const packAmt      = parseFloat(packAmount) || 0;
  const clubsTotal   = Object.values(selectedClubs).reduce((s, c) => s + (parseFloat(c.price) || 0), 0);
  const totalPerMonth = packAmt + clubsTotal;

  const reset = () => {
    setStudentId(""); setMonths([]); setPackAmount(""); setSelectedClubs({});
    setFullName(""); setDob(""); setGender("M"); setParentName(""); setParentPhone(""); setParentEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (months.length === 0) { setError("Sélectionnez au moins un mois"); return; }
    if (type === "inscrit" && !studentId) { setError("Sélectionnez un élève"); return; }
    if (type === "externe" && (!fullName.trim() || !parentPhone.trim())) {
      setError("Nom de l'enfant et téléphone parent sont obligatoires"); return;
    }
    setLoading(true);
    try {
      const clubsJson = Object.entries(selectedClubs).map(([clubId, c]) => ({
        clubId, name: c.name, price: parseFloat(c.price) || 0,
      }));
      let externalId: string | null = null;
      if (type === "externe") {
        const ext = await packsExt.createExternal({
          full_name: fullName.trim(), date_of_birth: dob, gender,
          parent_name: parentName.trim(), parent_phone: parentPhone.trim(),
          parent_email: parentEmail.trim() || undefined,
        });
        externalId = ext.id;
      }
      for (const month of months) {
        await packsExt.createSummerPack({
          student_id:          type === "inscrit" ? studentId : null,
          external_student_id: externalId,
          month, year, pack_amount: packAmt, clubs_json: clubsJson,
        });
      }
      setSuccess(`Inscription créée pour ${months.length} mois avec succès !`);
      reset();
      onSuccess();
    } catch (e: any) { setError(e.message || "Erreur lors de l'inscription"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
      <h2 className="text-base font-semibold">Nouvelle inscription — Clubs d'été</h2>

      <div className="flex gap-3">
        {([{ v: "inscrit", l: "👦 Élève inscrit" }, { v: "externe", l: "🏠 Enfant externe" }] as {v: string; l: string}[]).map(opt => (
          <label key={opt.v}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${type === opt.v ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
            <input type="radio" name="type" value={opt.v} checked={type === opt.v} onChange={() => setType(opt.v as any)} className="hidden" />
            {opt.l}
          </label>
        ))}
      </div>

      {type === "externe" && (
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-orange-800 mb-3">Informations enfant externe</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className={labelCls}>Nom complet *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col w-[140px]">
              <label className={labelCls}>Date de naissance</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col w-[85px]">
              <label className={labelCls}>Genre</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className={labelCls}>Nom parent *</label>
              <input value={parentName} onChange={e => setParentName(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col w-[140px]">
              <label className={labelCls}>Téléphone *</label>
              <input value={parentPhone} onChange={e => setParentPhone(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col flex-1 min-w-[150px]">
              <label className={labelCls}>Email parent</label>
              <input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      )}

      {type === "inscrit" && (
        <div>
          <label className={labelCls}>Élève *</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}>
            <option value="">— Choisir un élève —</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade})</option>)}
          </select>
        </div>
      )}

      <div>
        <label className={labelCls}>Mois * (sélection multiple possible)</label>
        <div className="flex gap-3 mt-1">
          {([{ v: 7, l: "☀️ Juillet" }, { v: 8, l: "🌊 Août" }] as {v: number; l: string}[]).map(opt => (
            <label key={opt.v}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition ${months.includes(opt.v) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              <input type="checkbox" checked={months.includes(opt.v)} onChange={() => toggleMonth(opt.v)} className="w-4 h-4 accent-blue-500" />
              {opt.l}
            </label>
          ))}
          <div className="flex flex-col w-[100px]">
            <label className={labelCls}>Année</label>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || new Date().getFullYear())}
              className={inputCls} min={2024} max={2030} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col w-[150px]">
          <label className={labelCls}>Tarif pack de base (DT)</label>
          <input type="number" value={packAmount} onChange={e => setPackAmount(e.target.value)} className={inputCls} min={0} placeholder="0" />
        </div>
        <p className="text-xs text-gray-500 pb-2">Ce tarif inclut toutes les activités standard du pack.</p>
      </div>

      {clubsEte.length > 0 ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Options payantes supplémentaires</p>
          <div className="flex flex-col gap-2">
            {clubsEte.map(club => {
              const selected = !!selectedClubs[club.id];
              return (
                <div key={club.id} className={`flex items-center gap-3 p-2 rounded-lg border transition ${selected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-white"}`}>
                  <input type="checkbox" checked={selected} onChange={() => toggleClub(club)} className="w-4 h-4 accent-blue-500 shrink-0" />
                  <span className="text-sm flex-1 font-medium">{club.name}</span>
                  {club.description && <span className="text-xs text-gray-400 hidden sm:block">{club.description}</span>}
                  {selected ? (
                    <div className="flex items-center gap-1">
                      <input type="number"
                        value={selectedClubs[club.id].price}
                        onChange={e => setSelectedClubs(prev => ({ ...prev, [club.id]: { ...prev[club.id], price: e.target.value } }))}
                        className="border rounded p-1 text-sm w-20 text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                        min={0} step={0.5} />
                      <span className="text-xs text-gray-400">DT</span>
                    </div>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">{club.price} DT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-400 text-center">
          Aucun club d'été actif —{" "}
          <Link href="/list/clubs" className="text-blue-500 hover:underline">gérez les clubs ici</Link>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-gray-600">Pack de base</span>
          <span className="font-medium text-right">{packAmt} DT</span>
          {Object.values(selectedClubs).map((c, i) => (
            <><span key={`n${i}`} className="text-gray-600">{c.name}</span>
            <span key={`p${i}`} className="font-medium text-right">{c.price} DT</span></>
          ))}
          <span className="font-bold border-t pt-1 mt-1 text-gray-800">Total / mois</span>
          <span className="font-bold text-right border-t pt-1 mt-1 text-green-700">{totalPerMonth} DT</span>
          {months.length > 1 && (
            <>
              <span className="text-gray-600">× {months.length} mois</span>
              <span className="font-bold text-right text-green-700">{(totalPerMonth * months.length).toFixed(2)} DT</span>
            </>
          )}
        </div>
        {months.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Mois sélectionnés : {months.map(m => m === 7 ? "Juillet" : "Août").join(" et ")} {year}
          </p>
        )}
      </div>

      {error   && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 rounded p-2">{success}</p>}

      <button type="submit" disabled={loading || months.length === 0}
        className="bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
        {loading ? "Inscription en cours…" : `Valider l'inscription${months.length > 1 ? ` (${months.length} mois)` : ""}`}
      </button>
    </form>
  );
};

// ── Page principale ───────────────────────────────────────────
export default function ClubsEtePage() {
  const [tab,          setTab]      = useState<"list" | "new">("list");
  const [clubsEte,     setClubsEte] = useState<any[]>([]);
  const [packs,        setPacks]    = useState<any[]>([]);
  const [students,     setStudents] = useState<any[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);

  const loadPacks = useCallback(() => {
    setLoadingPacks(true);
    packsExt.getSummerPacks().then(setPacks).catch(console.error).finally(() => setLoadingPacks(false));
  }, []);

  useEffect(() => {
    clubsApi.list("ete", undefined, true).then(setClubsEte).catch(console.error);
    studentsApi.list(1, 200).then(r => setStudents(r.data || [])).catch(() => {});
    loadPacks();
  }, [loadPacks]);

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4 mt-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h1 className="text-lg font-semibold">Inscriptions — Clubs d'été</h1>
          <Link href="/list/clubs"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
            ⚙️ Gérer les clubs
          </Link>
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${tab === t.k ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "list" && (
          <div>
            <h2 className="text-base font-semibold mb-4">
              Inscriptions clubs d'été
              <span className="ml-2 text-xs text-gray-400 font-normal">({packs.length} inscription(s))</span>
            </h2>
            {loadingPacks ? (
              <p className="text-center py-8 text-gray-400 text-sm">Chargement…</p>
            ) : packs.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-sm">Aucune inscription pour le moment</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b">
                      <th className="py-2">Nom</th>
                      <th className="py-2">Mois</th>
                      <th className="py-2">Clubs sélectionnés</th>
                      <th className="py-2">Total</th>
                      <th className="py-2">Statut</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packs.map((p: any) => {
                      const clubs: any[] = Array.isArray(p.clubs_json) ? p.clubs_json : [];
                      return (
                        <tr key={p.id} className="border-b even:bg-slate-50">
                          <td className="py-2 font-medium">
                            {p.student?.full_name || p.external_student?.full_name || "—"}
                            {p.external_student && <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-1 rounded">Externe</span>}
                          </td>
                          <td className="py-2 whitespace-nowrap">{p.month === 7 ? "Juillet" : "Août"} {p.year}</td>
                          <td className="py-2">
                            {clubs.length > 0
                              ? clubs.map((c: any) => (
                                <span key={c.clubId || c.name} className="mr-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                  {c.name} ({c.price} DT)
                                </span>
                              ))
                              : <span className="text-xs text-gray-400">Pack standard</span>
                            }
                          </td>
                          <td className="py-2 font-medium whitespace-nowrap">{p.total_amount} DT</td>
                          <td className="py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${p.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {p.paid ? "Payé" : "En attente"}
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2 items-center">
                              {p.student_id && (
                                <a href={`/student/${p.student_id}`}
                                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                                  Voir
                                </a>
                              )}
                              {!p.paid && (
                                <button onClick={async () => { await packsExt.markSummerPaid(p.id); loadPacks(); }}
                                  className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 border border-green-200">
                                  Marquer payé
                                </button>
                              )}
                              <button onClick={async () => { if (confirm('Supprimer cette inscription ?')) { await packsExt.deletePayment(p.id); loadPacks(); } }}
                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "new" && (
          <InscriptionForm students={students} clubsEte={clubsEte} onSuccess={() => { loadPacks(); setTab("list"); }} />
        )}
      </div>
    </AuthGuard>
  );
}
