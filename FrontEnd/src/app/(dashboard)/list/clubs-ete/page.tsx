"use client";
import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { packsExt, clubs as clubsApi, students as studentsApi } from "@/lib/api";
import Link from "next/link";

const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:outline-none";
const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// ─── Modal Édition/Création ───────────────────────────────────────
const InscriptionModal = ({ pack, students, clubsEte, onClose, onSuccess }: {
  pack?: any;
  students: any[];
  clubsEte: any[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [type, setType] = useState<"inscrit" | "externe">(pack?.student_id ? "inscrit" : "externe");
  const [studentId, setStudentId] = useState(pack?.student_id || "");
  const [month, setMonth] = useState(pack?.month || 7);
  const [year, setYear] = useState(pack?.year || new Date().getFullYear());
  const [packAmount, setPackAmount] = useState(String(pack?.pack_amount || 0));
  const [selectedClubs, setSelectedClubs] = useState<Record<string, { name: string; price: string }>>(
    (pack?.clubs_json || []).reduce((acc: any, c: any) => ({ ...acc, [c.clubId]: { name: c.name, price: String(c.price) } }), {})
  );
  const [fullName, setFullName] = useState(pack?.external_student?.full_name || "");
  const [dob, setDob] = useState(pack?.external_student?.date_of_birth?.split('T')[0] || "");
  const [gender, setGender] = useState(pack?.external_student?.gender || "M");
  const [parentName, setParentName] = useState(pack?.external_student?.parent_name || "");
  const [parentPhone, setParentPhone] = useState(pack?.external_student?.parent_phone || "");
  const [parentEmail, setParentEmail] = useState(pack?.external_student?.parent_email || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleClub = (club: any) => {
    setSelectedClubs(prev => {
      if (prev[club.id]) { const next = { ...prev }; delete next[club.id]; return next; }
      return { ...prev, [club.id]: { name: club.name, price: String(club.price ?? 0) } };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "inscrit" && !studentId) { setError("Sélectionnez un élève"); return; }
    if (type === "externe" && (!fullName.trim() || !parentPhone.trim())) {
      setError("Nom de l'enfant et téléphone parent sont obligatoires"); return;
    }
    setSaving(true); setError("");
    try {
      const clubsJson = Object.entries(selectedClubs).map(([clubId, c]) => ({
        clubId, name: c.name, price: parseFloat(c.price) || 0,
      }));
      const packAmt = parseFloat(packAmount) || 0;
      const clubsTotal = Object.values(selectedClubs).reduce((s, c) => s + (parseFloat(c.price) || 0), 0);

      if (pack) {
        // Mise à jour (TODO: ajouter endpoint update dans backend)
        alert("Modification non encore implémentée côté backend");
      } else {
        // Création
        let externalId: string | null = null;
        if (type === "externe") {
          const ext = await packsExt.createExternal({
            full_name: fullName.trim(), date_of_birth: dob, gender,
            parent_name: parentName.trim(), parent_phone: parentPhone.trim(),
            parent_email: parentEmail.trim() || undefined,
          });
          externalId = ext.id;
        }
        await packsExt.createSummerPack({
          student_id: type === "inscrit" ? studentId : null,
          external_student_id: externalId,
          month, year, pack_amount: packAmt,
          clubs_json: clubsJson,
          total_amount: packAmt + clubsTotal,
        });
      }
      onSuccess();
      onClose();
    } catch (e: any) { setError(e.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const packAmt = parseFloat(packAmount) || 0;
  const clubsTotal = Object.values(selectedClubs).reduce((s, c) => s + (parseFloat(c.price) || 0), 0);
  const totalAmount = packAmt + clubsTotal;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-t-2xl px-6 py-4">
          <h3 className="text-white font-bold text-lg">
            {pack ? "Modifier l'inscription" : "Nouvelle inscription — Clubs d'été"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          {/* Type */}
          {!pack && (
            <div className="flex gap-3">
              {[{ v: "inscrit", l: "👦 Élève inscrit" }, { v: "externe", l: "🏠 Enfant externe" }].map(opt => (
                <label key={opt.v}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm transition ${type === opt.v ? "border-orange-500 bg-orange-50 text-orange-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <input type="radio" checked={type === opt.v} onChange={() => setType(opt.v as any)} className="hidden" />
                  {opt.l}
                </label>
              ))}
            </div>
          )}

          {/* Enfant externe */}
          {type === "externe" && !pack && (
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-orange-800 mb-3">Informations enfant externe</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={labelCls}>Nom complet *</label><input value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Date de naissance</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Genre</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className={inputCls}>
                    <option value="M">Garçon</option>
                    <option value="F">Fille</option>
                  </select>
                </div>
                <div><label className={labelCls}>Nom parent *</label><input value={parentName} onChange={e => setParentName(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Téléphone *</label><input value={parentPhone} onChange={e => setParentPhone(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Email parent</label><input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} className={inputCls} /></div>
              </div>
            </div>
          )}

          {/* Élève inscrit */}
          {type === "inscrit" && !pack && (
            <div>
              <label className={labelCls}>Élève *</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls}>
                <option value="">— Choisir un élève —</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade})</option>)}
              </select>
            </div>
          )}

          {/* Mois & Année */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Mois *</label>
              <select value={month} onChange={e => setMonth(+e.target.value)} className={inputCls}>
                {[7, 8].map(m => <option key={m} value={m}>{MOIS[m - 1]}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Année *</label><input type="number" value={year} onChange={e => setYear(+e.target.value)} className={inputCls} min={2024} max={2030} /></div>
          </div>

          {/* Tarif pack */}
          <div><label className={labelCls}>Tarif pack de base (DT)</label><input type="number" value={packAmount} onChange={e => setPackAmount(e.target.value)} className={inputCls} min={0} placeholder="0" step="0.5" /></div>

          {/* Clubs */}
          {clubsEte.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Clubs supplémentaires (options payantes)</p>
              <div className="flex flex-col gap-2">
                {clubsEte.map(club => {
                  const selected = !!selectedClubs[club.id];
                  return (
                    <div key={club.id} className={`flex items-center gap-3 p-2 rounded-lg border transition ${selected ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleClub(club)} className="w-4 h-4 accent-orange-500 shrink-0" />
                      <span className="text-sm flex-1 font-medium">{club.name}</span>
                      {selected ? (
                        <div className="flex items-center gap-1">
                          <input type="number"
                            value={selectedClubs[club.id].price}
                            onChange={e => setSelectedClubs(prev => ({ ...prev, [club.id]: { ...prev[club.id], price: e.target.value } }))}
                            className="border rounded p-1 text-sm w-20 text-right focus:outline-none focus:ring-1 focus:ring-orange-400"
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
          )}

          {/* Total */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-gray-600">Pack de base</span>
              <span className="font-medium text-right">{packAmt.toFixed(2)} DT</span>
              {Object.values(selectedClubs).map((c, i) => (
                <><span key={`n${i}`} className="text-gray-600">{c.name}</span>
                <span key={`p${i}`} className="font-medium text-right">{c.price} DT</span></>
              ))}
              <span className="font-bold border-t pt-1 mt-1 text-gray-800">Total</span>
              <span className="font-bold text-right border-t pt-1 mt-1 text-orange-700">{totalAmount.toFixed(2)} DT</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {saving ? "Enregistrement..." : pack ? "Modifier" : "Créer l'inscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────
export default function ClubsEtePage() {
  const [packs, setPacks] = useState<any[]>([]);
  const [filteredPacks, setFilteredPacks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [clubsEte, setClubsEte] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState<"" | "inscrit" | "externe">("");
  const [filterStatus, setFilterStatus] = useState<"" | "paid" | "pending">("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState<any | null>(null);

  const loadPacks = useCallback(() => {
    setLoading(true);
    packsExt.getSummerPacks().then(setPacks).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clubsApi.list("ete", undefined, true).then(setClubsEte).catch(console.error);
    studentsApi.list(1, 500).then(r => setStudents(r.data || [])).catch(() => {});
    loadPacks();
  }, [loadPacks]);

  // Filtrage
  useEffect(() => {
    let result = packs;

    // Recherche
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.student?.full_name || p.external_student?.full_name || "").toLowerCase().includes(s)
      );
    }

    // Mois
    if (filterMonth !== "") result = result.filter(p => p.month === filterMonth);

    // Année
    if (filterYear) result = result.filter(p => p.year === filterYear);

    // Type
    if (filterType === "inscrit") result = result.filter(p => p.student_id);
    if (filterType === "externe") result = result.filter(p => p.external_student_id);

    // Statut paiement
    if (filterStatus === "paid") result = result.filter(p => p.paid);
    if (filterStatus === "pending") result = result.filter(p => !p.paid);

    setFilteredPacks(result);
  }, [packs, search, filterMonth, filterYear, filterType, filterStatus]);

  const handleNew = () => {
    setEditingPack(null);
    setShowModal(true);
  };

  const handleEdit = (pack: any) => {
    setEditingPack(pack);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette inscription ?")) return;
    await packsExt.deletePayment(id);
    loadPacks();
  };

  const handleMarkPaid = async (id: string) => {
    await packsExt.markSummerPaid(id);
    loadPacks();
  };

  // Stats
  const totalInscrits = filteredPacks.length;
  const totalRecettes = filteredPacks.reduce((s, p) => s + Number(p.total_amount), 0);
  const totalPaid = filteredPacks.filter(p => p.paid).reduce((s, p) => s + Number(p.total_amount), 0);
  const totalPending = totalRecettes - totalPaid;
  const fmt = (n: number) => n.toLocaleString("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4 mt-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold">Inscriptions — Clubs d'été</h1>
            <p className="text-xs text-gray-400 mt-0.5">Gestion complète des inscriptions clubs d'été</p>
          </div>
          <div className="flex gap-2">
            <Link href="/list/clubs"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
              ⚙️ Gérer les clubs
            </Link>
            <button onClick={handleNew}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              ➕ Nouvelle inscription
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-xs text-orange-600 mb-1">Total inscrits</p>
            <p className="text-2xl font-bold text-orange-700">{totalInscrits}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-xs text-blue-600 mb-1">Recettes totales</p>
            <p className="text-2xl font-bold text-blue-700">{fmt(totalRecettes)} <span className="text-sm font-normal">DT</span></p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs text-green-600 mb-1">Payé</p>
            <p className="text-2xl font-bold text-green-700">{fmt(totalPaid)} <span className="text-sm font-normal">DT</span></p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-xs text-yellow-600 mb-1">En attente</p>
            <p className="text-2xl font-bold text-yellow-700">{fmt(totalPending)} <span className="text-sm font-normal">DT</span></p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className={labelCls}>Rechercher</label>
              <input value={search} onChange={e => setSearch(e.target.value)}
                className={inputCls} placeholder="Nom de l'enfant..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Mois</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value === "" ? "" : +e.target.value)} className={inputCls}>
                <option value="">Tous</option>
                <option value={7}>Juillet</option>
                <option value={8}>Août</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Année</label>
              <input type="number" value={filterYear} onChange={e => setFilterYear(+e.target.value)}
                className={inputCls + " w-24"} min="2020" max="2099" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className={inputCls}>
                <option value="">Tous</option>
                <option value="inscrit">Inscrits</option>
                <option value="externe">Externes</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Paiement</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={inputCls}>
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            {(search || filterMonth !== "" || filterType || filterStatus) && (
              <button onClick={() => { setSearch(""); setFilterMonth(""); setFilterType(""); setFilterStatus(""); }}
                className="text-xs text-red-500 hover:text-red-700 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition">
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="text-center py-12 text-gray-400 text-sm">Chargement...</p>
          ) : filteredPacks.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune inscription pour ces critères</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Enfant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Période</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clubs</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacks.map((p, idx) => {
                    const name = p.student?.full_name || p.external_student?.full_name || "—";
                    const isExternal = !!p.external_student_id;
                    const clubs: any[] = Array.isArray(p.clubs_json) ? p.clubs_json : [];
                    return (
                      <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {p.student_id ? (
                            <a href={`/student/${p.student_id}`} className="hover:text-blue-600 hover:underline">{name}</a>
                          ) : (
                            <span>{name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${isExternal ? "bg-orange-100 text-orange-600 border border-orange-200" : "bg-blue-100 text-blue-600 border border-blue-200"}`}>
                            {isExternal ? "Externe" : "Inscrit"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{MOIS[p.month - 1]} {p.year}</td>
                        <td className="px-4 py-3">
                          {clubs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {clubs.map((c: any, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Pack standard</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(p.total_amount).toFixed(0)} DT</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {p.paid ? "✓ Payé" : "⏳ En attente"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            {!p.paid && (
                              <button onClick={() => handleMarkPaid(p.id)}
                                className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 hover:bg-green-100 border border-green-200">
                                Marquer payé
                              </button>
                            )}
                            <button onClick={() => handleDelete(p.id)}
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
      </div>

      {/* Modal */}
      {showModal && (
        <InscriptionModal
          pack={editingPack}
          students={students}
          clubsEte={clubsEte}
          onClose={() => { setShowModal(false); setEditingPack(null); }}
          onSuccess={loadPacks}
        />
      )}
    </AuthGuard>
  );
}
