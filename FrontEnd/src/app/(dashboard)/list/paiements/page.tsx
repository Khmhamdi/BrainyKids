"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { packsExt, packs, students as studentsApi, teachers as teachersApi } from "@/lib/api";
import { calculatePayroll, reversePayroll } from "@/lib/payroll";
import AuthGuard from "@/components/AuthGuard";

// ── Constantes partagées ──────────────────────────────────────
const MOIS_LABELS = ["Janvier","Février","Mars","Avril","Mai","Juin",
                     "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOIS_COURT  = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const FONCTION_META: Record<string, { label: string; icon: string }> = {
  enseignante:      { label: "Enseignante",      icon: "👩‍🏫" },
  femme_de_service: { label: "Femme de service", icon: "🧹"  },
  autre:            { label: "Autre",             icon: "👤"  },
};

// ════════════════════════════════════════════════════════════════
//  ONGLET RECETTES — Vue globale
// ════════════════════════════════════════════════════════════════
const RecettesGlobaleView = () => {
  const now = new Date();
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | "">(now.getMonth() + 1);
  const [filterStatus, setFilterStatus] = useState<"" | "paid" | "pending" | "overdue">("");

  const loadAll = useCallback(() => {
    setLoading(true);
    // Charger tous les paiements élèves (via l'endpoint existant)
    payments.list(1, filterStatus || undefined)
      .then(res => setAllPayments(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Filtrer par mois/année localement
  const filtered = allPayments.filter(p => {
    const date = new Date(p.paid_date || p.due_date);
    if (filterYear && date.getFullYear() !== filterYear) return false;
    if (filterMonth !== "" && date.getMonth() + 1 !== filterMonth) return false;
    return true;
  });

  const totalPaid = filtered.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = filtered.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const totalOverdue = filtered.filter(p => p.status === 'overdue').reduce((s, p) => s + Number(p.amount), 0);
  const fmt = (n: number) => n.toLocaleString("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const statusStyle: Record<string, string> = {
    paid:    "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = {
    paid: "Payé", pending: "En attente", overdue: "En retard",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Année</label>
          <input type="number" value={filterYear} onChange={e => setFilterYear(+e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
            min="2020" max="2099" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Mois</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value === "" ? "" : +e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Tous</option>
            {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Statut</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Tous</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
          </select>
        </div>
        {(filterStatus || filterMonth !== "") && (
          <button onClick={() => { setFilterStatus(""); setFilterMonth(""); }}
            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition">
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1">Total recettes</p>
          <p className="text-xl font-bold text-gray-800">{fmt(totalPaid + totalPending + totalOverdue)} <span className="text-sm font-normal text-gray-400">DT</span></p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-green-600 mb-1">Payé</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalPaid)} <span className="text-sm font-normal text-green-400">DT</span></p>
          <p className="text-xs text-green-500 mt-1">{filtered.filter(p => p.status === 'paid').length} paiement{filtered.filter(p => p.status === 'paid').length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-yellow-600 mb-1">En attente</p>
          <p className="text-xl font-bold text-yellow-600">{fmt(totalPending)} <span className="text-sm font-normal text-yellow-300">DT</span></p>
          <p className="text-xs text-yellow-400 mt-1">{filtered.filter(p => p.status === 'pending').length} paiement{filtered.filter(p => p.status === 'pending').length > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-red-600 mb-1">En retard</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalOverdue)} <span className="text-sm font-normal text-red-300">DT</span></p>
          <p className="text-xs text-red-400 mt-1">{filtered.filter(p => p.status === 'overdue').length} paiement{filtered.filter(p => p.status === 'overdue').length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">Chargement...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">Aucun paiement pour ces critères</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <a href={`/student/${p.student_id}`} className="hover:text-blue-600 hover:underline">
                        {p.student?.full_name || "—"}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.description || p.type}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.paid_date
                        ? new Date(p.paid_date).toLocaleDateString("fr-TN")
                        : new Date(p.due_date).toLocaleDateString("fr-TN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{Number(p.amount).toFixed(0)} DT</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[p.status] || ""}`}>
                        {statusLabel[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  ONGLET RECETTES — Frais élèves (par élève)
// ════════════════════════════════════════════════════════════════
const RecettesTab = ({ initStudentId }: { initStudentId?: string }) => {
  const router = useRouter();
  const [view, setView] = useState<"global" | "student">("global");
  const [search, setSearch]           = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedStudent, setSelected] = useState<any | null>(null);
  const [groups, setGroups]           = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPay, setLoadingPay]   = useState(true);
  const [paying, setPaying]           = useState<string | null>(null);

  // Charger l'élève depuis l'URL param au montage
  useEffect(() => {
    if (initStudentId) {
      studentsApi.get(initStudentId)
        .then(s => { setSelected(s); setSearch(s.full_name); })
        .catch(console.error);
    }
  }, [initStudentId]);

  // Recherche élèves
  useEffect(() => {
    if (search.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      setLoadingStudents(true);
      studentsApi.list(1, 8, search)
        .then(res => setSuggestions(res.data || []))
        .catch(console.error)
        .finally(() => setLoadingStudents(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Charger paiements quand un élève est sélectionné
  const loadPay = useCallback(() => {
    if (!selectedStudent) return;
    setLoadingPay(true);
    packsExt.getPayments(selectedStudent.id)
      .then(setGroups).catch(console.error)
      .finally(() => setLoadingPay(false));
  }, [selectedStudent]);

  useEffect(() => { loadPay(); }, [loadPay]);

  const selectStudent = (s: any) => {
    setSelected(s);
    setSearch(s.full_name);
    setSuggestions([]);
    router.replace(`/list/paiements?student=${s.id}`);
  };

  const markMonthPaid = async (month: number, year: number) => {
    if (!selectedStudent) return;
    const key = `${year}-${month}`;
    setPaying(key);
    try { await packsExt.markMonthPaid(selectedStudent.id, month, year); loadPay(); }
    finally { setPaying(null); }
  };

  const markOnePaid = async (paymentId: string) => {
    setPaying(paymentId);
    try { await packs.markPaid(paymentId); loadPay(); }
    finally { setPaying(null); }
  };

  const statusStyle: Record<string, string> = {
    paid:    "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    overdue: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = {
    paid: "Payé", pending: "En attente", overdue: "En retard",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toggle Vue */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setView("global")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === "global" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          📊 Vue globale
        </button>
        <button onClick={() => setView("student")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            view === "student" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}>
          👤 Par élève
        </button>
      </div>

      {view === "global" ? (
        <RecettesGlobaleView />
      ) : (
        <>
      {/* Sélecteur élève */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Sélectionner un élève</h2>
        <div className="relative max-w-sm">
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelected(null); }}
            className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Rechercher par nom..."
          />
          {loadingStudents && (
            <p className="absolute top-10 left-0 right-0 bg-white border rounded-lg p-2 text-xs text-gray-400 shadow z-10">
              Recherche...
            </p>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute top-10 left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {suggestions.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${s.gender === "F" ? "bg-pink-400" : "bg-blue-400"}`}>
                      {s.full_name?.charAt(0)}
                    </span>
                    <span>{s.full_name}</span>
                    <span className="text-gray-400 text-xs ml-auto">{s.class?.name || ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedStudent && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${selectedStudent.gender === "F" ? "bg-pink-400" : "bg-BKprimary"}`}>
              {selectedStudent.full_name?.charAt(0)}
            </span>
            <div>
              <p className="font-semibold text-sm">{selectedStudent.full_name}</p>
              <p className="text-xs text-gray-400">{selectedStudent.class?.name || "—"} · {selectedStudent.grade || ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Paiements de l'élève */}
      {!selectedStudent ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Recherchez un élève pour voir ses paiements
        </div>
      ) : loadingPay ? (
        <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
      ) : groups.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Aucun paiement configuré pour cet élève</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g: any) => (
            <div key={`${g.year}-${g.month}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm">{g.label}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    g.allPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {g.allPaid ? "✓ Tout payé" : `${g.totalPaid?.toFixed(0)} / ${g.total?.toFixed(0)} DT`}
                  </span>
                </div>
                {!g.allPaid && (
                  <button
                    onClick={() => markMonthPaid(g.month, g.year)}
                    disabled={paying === `${g.year}-${g.month}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded-lg disabled:opacity-50 font-medium transition"
                  >
                    {paying === `${g.year}-${g.month}` ? "..." : `✓ Tout payer (${((g.total || 0) - (g.totalPaid || 0)).toFixed(0)} DT)`}
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {g.payments?.map((p: any) => (
                  <div key={p.id} className="flex items-center px-4 py-2.5 text-sm gap-3">
                    <span className="text-gray-600 flex-1">{p.description}</span>
                    <span className="font-medium text-right whitespace-nowrap">{p.amount} DT</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-20 text-center ${statusStyle[p.status] || ""}`}>
                      {statusLabel[p.status] || p.status}
                    </span>
                    {p.status !== "paid" ? (
                      <button onClick={() => markOnePaid(p.id)} disabled={paying === p.id}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 whitespace-nowrap">
                        {paying === p.id ? "..." : "Marquer payé"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {p.paid_date ? new Date(p.paid_date).toLocaleDateString("fr-TN") : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  ONGLET DÉPENSES — Salaires personnel
// ════════════════════════════════════════════════════════════════
// ── Années scolaires disponibles ──────────────────────────────
const getSchoolYearOptions = () => {
  const now = new Date();
  const current = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let y = current + 1; y >= 2020; y--) years.push(`${y}-${y + 1}`);
  return years;
};
const currentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const DepensesTab = () => {
  const now = new Date();
  const [payments, setPayments]   = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  // Filtres
  const [filterYear, setFilterYear]     = useState(now.getFullYear());
  const [filterMonth, setFilterMonth]   = useState<number | "">(now.getMonth() + 1);
  const [filterStaff, setFilterStaff]   = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | "paid" | "pending">("");

  // Formulaire paiement individuel (masqué par défaut)
  const [showIndividualForm, setShowIndividualForm] = useState(false);
  const [fTeacherId, setFTeacherId] = useState("");
  const [fMonth, setFMonth]         = useState(now.getMonth() + 1);
  const [fYear, setFYear]           = useState(now.getFullYear());
  const [fAmount, setFAmount]       = useState("");
  const [fNotes, setFNotes]         = useState("");
  const [fMarkPaid, setFMarkPaid]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  // Pack annuel
  const [packInputMode, setPackInputMode]   = useState<"brut" | "net">("net");
  const [packTeacherId, setPackTeacherId]   = useState("");
  const [packSchoolYear, setPackSchoolYear] = useState(currentSchoolYear());
  const [packAmount, setPackAmount]         = useState("");
  const [packStartMonth, setPackStartMonth] = useState(9);
  const [packEndMonth, setPackEndMonth]     = useState(6);
  const [packNotes, setPackNotes]           = useState("");
  const [packSaving, setPackSaving]         = useState(false);
  const [packError, setPackError]           = useState("");
  const [packSuccess, setPackSuccess]       = useState("");
  const schoolYearOptions = getSchoolYearOptions();

  const loadPayments = useCallback(() => {
    setLoading(true);
    teachersApi.salaryPayments.all(
      filterMonth !== "" ? filterMonth : undefined,
      filterYear || undefined,
      filterStaff || undefined,
      filterStatus || undefined,
    )
      .then(setPayments).catch(console.error)
      .finally(() => setLoading(false));
  }, [filterYear, filterMonth, filterStaff, filterStatus]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  useEffect(() => {
    teachersApi.list(1, 200, "", "")
      .then(res => setStaffList(res.data || [])).catch(console.error);
  }, []);

  const handleStaffChange = (id: string) => {
    setFTeacherId(id);
    const s = staffList.find(x => x.id === id);
    if (s?.monthly_salary) setFAmount(String(s.monthly_salary));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!fTeacherId) { setFormError("Sélectionnez un membre du personnel"); return; }
    if (!fAmount || parseFloat(fAmount) <= 0) { setFormError("Montant invalide"); return; }
    setSaving(true);
    try {
      await teachersApi.salaryPayments.record(fTeacherId, {
        month: fMonth, year: fYear, amount: fAmount,
        notes: fNotes || null,
        paid_at: fMarkPaid ? new Date().toISOString() : null,
      });
      setFTeacherId(""); setFAmount(""); setFNotes(""); setFMarkPaid(true);
      loadPayments();
    } catch (err: any) {
      setFormError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handlePackStaffChange = (id: string) => {
    setPackTeacherId(id);
    const s = staffList.find(x => x.id === id);
    if (s?.monthly_salary) {
      const gross = Number(s.monthly_salary);
      if (packInputMode === "net") {
        // montrer le net correspondant au salaire configuré
        setPackAmount(String(calculatePayroll(gross).net.toFixed(3)));
      } else {
        setPackAmount(String(gross));
      }
    }
  };

  const handlePackCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPackError(""); setPackSuccess("");
    if (!packTeacherId) { setPackError("Sélectionnez un membre du personnel"); return; }
    if (!packAmount || parseFloat(packAmount) <= 0) { setPackError("Montant invalide"); return; }
    setPackSaving(true);
    try {
      const inputVal = parseFloat(packAmount);
      const grossAmount = packInputMode === "net"
        ? reversePayroll(inputVal).gross
        : inputVal;
      const res = await teachersApi.salaryPayments.createPack(packTeacherId, {
        school_year:    packSchoolYear,
        monthly_amount: grossAmount,
        start_month:    packStartMonth,
        end_month:      packEndMonth,
        notes:          packNotes || null,
      });
      const staffName = staffList.find(x => x.id === packTeacherId);
      const name = staffName?.user?.full_name || staffName?.full_name || "Personnel";
      setPackSuccess(`✓ ${res.created} paiements créés pour ${name} (${packSchoolYear})`);
      setPackTeacherId(""); setPackAmount(""); setPackNotes("");
      loadPayments();
    } catch (err: any) {
      setPackError(err?.message || "Erreur lors de la création du pack");
    } finally {
      setPackSaving(false);
    }
  };

  // Expanded rows for payroll detail
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleMarkPaid = async (paymentId: string) => {
    await teachersApi.salaryPayments.markPaid(paymentId);
    loadPayments();
  };

  const handleDelete = async (paymentId: string, label: string) => {
    if (!confirm(`Supprimer le paiement "${label}" ?`)) return;
    await teachersApi.salaryPayments.delete(paymentId);
    loadPayments();
  };

  const totalPaid    = payments.filter(p => p.paid_at).reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => !p.paid_at).reduce((s, p) => s + Number(p.amount), 0);
  const totalCNSSPat = payments.reduce((s, p) => s + calculatePayroll(Number(p.amount)).cnssEmployer, 0);
  const fmt = (n: number) => n.toLocaleString("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-5">

      {/* ── Pack annuel de salaire ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-200">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Configurer le pack annuel de salaire</p>
            <p className="text-xs text-blue-500">Génère tous les paiements mensuels pour toute l'année scolaire en un clic</p>
          </div>
        </div>
        <form onSubmit={handlePackCreate} className="px-5 pb-5">
          {packError   && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded mt-3 mb-2">{packError}</p>}
          {packSuccess && <p className="text-xs text-green-700 bg-green-50 border border-green-200 p-2 rounded mt-3 mb-2">{packSuccess}</p>}
          <div className="flex flex-wrap gap-3 items-end mt-4">
            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
              <label className="text-xs text-gray-500 font-medium">Personnel *</label>
              <select value={packTeacherId} onChange={e => handlePackStaffChange(e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">-- Sélectionner --</option>
                {staffList.map(s => {
                  const name = s.user?.full_name || s.full_name || "—";
                  const meta = FONCTION_META[s.fonction] || FONCTION_META.autre;
                  return <option key={s.id} value={s.id}>{meta.icon} {name}</option>;
                })}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Année scolaire *</label>
              <select value={packSchoolYear} onChange={e => setPackSchoolYear(e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                {schoolYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {/* Mode saisie brut / net */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Mode de saisie</label>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                <button type="button"
                  onClick={() => { setPackInputMode("net"); setPackAmount(""); }}
                  className={`px-3 py-2 font-medium transition ${packInputMode === "net" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  Saisir le net
                </button>
                <button type="button"
                  onClick={() => { setPackInputMode("brut"); setPackAmount(""); }}
                  className={`px-3 py-2 font-medium transition ${packInputMode === "brut" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                  Saisir le brut
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium">
                {packInputMode === "net" ? "Net à payer / mois (DT) *" : "Salaire brut / mois (DT) *"}
              </label>
              <input type="number" value={packAmount} onChange={e => setPackAmount(e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder={packInputMode === "net" ? "Ex: 500" : "Ex: 561"}
                step="0.001" min="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Mois début</label>
              <select value={packStartMonth} onChange={e => setPackStartMonth(+e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium">Mois fin</label>
              <select value={packEndMonth} onChange={e => setPackEndMonth(+e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs text-gray-500 font-medium">Notes</label>
              <input value={packNotes} onChange={e => setPackNotes(e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="Optionnel" />
            </div>
          </div>
          {/* Aperçu avec calcul CNSS/IRPP */}
          {packAmount && parseFloat(packAmount) > 0 && (() => {
            const count = packStartMonth > packEndMonth
              ? (12 - packStartMonth + 1) + packEndMonth
              : packEndMonth - packStartMonth + 1;
            const inputVal = parseFloat(packAmount);
            const pr = packInputMode === "net"
              ? reversePayroll(inputVal)
              : calculatePayroll(inputVal);
            return (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800 space-y-3">
                {/* Ligne détail retenues */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pb-2 border-b border-blue-200">
                  <div>
                    <p className="text-blue-400 mb-0.5">Salaire brut</p>
                    <p className="font-semibold">{pr.gross.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-red-400 mb-0.5">− CNSS salarié (9,68 %)</p>
                    <p className="font-semibold text-red-600">{pr.cnssEmployee.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-red-400 mb-0.5">− Retenue à la source</p>
                    <p className="font-semibold text-red-600">{pr.irpp.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-red-400 mb-0.5">− CSS (0,45 %)</p>
                    <p className="font-semibold text-red-600">{pr.css.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-green-500 mb-0.5 font-semibold">= Net à payer</p>
                    <p className="font-bold text-green-700 text-sm">{pr.net.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-blue-400 mb-0.5">+ CNSS patronal (16,57 %)</p>
                    <p className="font-semibold text-blue-700">{pr.cnssEmployer.toFixed(3)} DT</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5">Coût total employeur</p>
                    <p className="font-semibold text-gray-700">{pr.totalEmployerCost.toFixed(3)} DT</p>
                  </div>
                </div>
                {/* Totaux */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div><p className="text-blue-400 mb-0.5">Mensualités</p><p className="font-semibold">{count} mois</p></div>
                  <div><p className="text-blue-400 mb-0.5">Coût employeur / mois</p><p className="font-semibold">{pr.totalEmployerCost.toFixed(3)} DT</p></div>
                  <div><p className="text-blue-400 mb-0.5">Coût total annuel (charges incluses)</p><p className="font-bold text-blue-800">{(count * pr.totalEmployerCost).toFixed(0)} DT</p></div>
                </div>
              </div>
            );
          })()}
          <div className="mt-3">
            <button type="submit" disabled={packSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition">
              {packSaving ? "Génération..." : "🗓 Générer les paiements annuels"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Paiement ponctuel (masqué par défaut) ────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => { setShowIndividualForm(!showIndividualForm); setFormError(""); }}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
        >
          <span className="text-sm font-medium text-gray-600">➕ Enregistrer un paiement ponctuel</span>
          <span className="text-gray-400 text-sm">{showIndividualForm ? "▲" : "▼"}</span>
        </button>
        {showIndividualForm && (
          <form onSubmit={handleAdd} className="px-5 pb-5 border-t border-gray-100">
            {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded mt-3 mb-2">{formError}</p>}
            <div className="flex flex-wrap gap-3 items-end mt-4">
              <div className="flex flex-col gap-1 min-w-[180px] flex-1">
                <label className="text-xs text-gray-500 font-medium">Personnel *</label>
                <select value={fTeacherId} onChange={e => handleStaffChange(e.target.value)}
                  className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">-- Sélectionner --</option>
                  {staffList.map(s => {
                    const name = s.user?.full_name || s.full_name || "—";
                    const meta = FONCTION_META[s.fonction] || FONCTION_META.autre;
                    return <option key={s.id} value={s.id}>{meta.icon} {name}</option>;
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Mois</label>
                <select value={fMonth} onChange={e => setFMonth(+e.target.value)}
                  className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                  {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Année</label>
                <input type="number" value={fYear} onChange={e => setFYear(+e.target.value)}
                  className="border rounded-lg px-2 py-2 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  min="2020" max="2099" />
              </div>
              <div className="flex flex-col gap-1 min-w-[110px]">
                <label className="text-xs text-gray-500 font-medium">Montant (DT) *</label>
                <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)}
                  className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Ex: 800" step="0.01" min="0" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                <label className="text-xs text-gray-500 font-medium">Notes</label>
                <input value={fNotes} onChange={e => setFNotes(e.target.value)}
                  className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="Optionnel" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer pb-2">
                <input type="checkbox" checked={fMarkPaid} onChange={e => setFMarkPaid(e.target.checked)}
                  className="w-4 h-4 accent-green-500" />
                Payé maintenant
              </label>
              <button type="submit" disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition whitespace-nowrap">
                {saving ? "Enregistrement..." : "+ Ajouter"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Année</label>
          <input type="number" value={filterYear} onChange={e => setFilterYear(+e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-20 focus:outline-none focus:ring-1 focus:ring-blue-400"
            min="2020" max="2099" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Mois</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value === "" ? "" : +e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Tous</option>
            {MOIS_LABELS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-gray-500 font-medium">Personnel</label>
          <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Tout le personnel</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.user?.full_name || s.full_name || "—"}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">Statut</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
            <option value="">Tous</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
          </select>
        </div>
        {(filterStaff || filterStatus) && (
          <button onClick={() => { setFilterStaff(""); setFilterStatus(""); }}
            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition">
            ✕ Réinitialiser
          </button>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1">Salaires bruts</p>
          <p className="text-xl font-bold text-gray-800">{fmt(totalPaid + totalPending)} <span className="text-sm font-normal text-gray-400">DT</span></p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-green-600 mb-1">Versé</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalPaid)} <span className="text-sm font-normal text-green-400">DT</span></p>
          <p className="text-xs text-green-500 mt-1">{payments.filter(p => p.paid_at).length} versement{payments.filter(p => p.paid_at).length > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-orange-600 mb-1">En attente</p>
          <p className="text-xl font-bold text-orange-600">{fmt(totalPending)} <span className="text-sm font-normal text-orange-300">DT</span></p>
          <p className="text-xs text-orange-400 mt-1">{payments.filter(p => !p.paid_at).length} versement{payments.filter(p => !p.paid_at).length > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm text-center">
          <p className="text-xs text-blue-600 mb-1">CNSS patronal (charges)</p>
          <p className="text-xl font-bold text-blue-700">{fmt(totalCNSSPat)} <span className="text-sm font-normal text-blue-400">DT</span></p>
          <p className="text-xs text-blue-400 mt-1">Coût réel : {fmt(totalPaid + totalPending + totalCNSSPat)} DT</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-sm">Chargement...</p>
        ) : payments.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">Aucune dépense pour ces critères</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Personnel</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Fonction</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Période</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Brut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Net</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => {
                const name    = p.teacher?.user?.full_name || p.teacher?.full_name || "—";
                const meta    = FONCTION_META[p.teacher?.fonction] || FONCTION_META.autre;
                const isPaid  = !!p.paid_at;
                const label   = `${name} — ${MOIS_COURT[p.month - 1]} ${p.year}`;
                const pr      = calculatePayroll(Number(p.amount));
                const isOpen  = expandedRows.has(p.id);
                const teachId = p.teacher?.id || p.teacher_id;
                return (
                  <>
                    <tr key={p.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${idx % 2 === 0 ? "" : "bg-slate-50/50"}`}
                      onClick={() => toggleRow(p.id)}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-gray-300 text-xs">{isOpen ? "▼" : "▶"}</span>
                          {name}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500">{meta.icon} {meta.label}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{MOIS_LABELS[p.month - 1]}</span>
                        <span className="text-gray-400 ml-1">{p.year}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(pr.gross)} DT</td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="text-green-700 font-semibold">{fmt(pr.net)}</span>
                        <span className="text-gray-400 ml-0.5 text-xs">DT</span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            ✓ Payé <span className="text-green-400 font-normal">{new Date(p.paid_at).toLocaleDateString("fr-TN")}</span>
                          </span>
                        ) : (
                          <button onClick={() => handleMarkPaid(p.id)}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition font-medium">
                            ⏳ Marquer payé
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {/* Bulletin de paie */}
                          {teachId && (
                            <button
                              title="Bulletin de paie"
                              onClick={() => window.open(`/teacher/${teachId}/payslip?month=${p.month}&year=${p.year}`, '_blank')}
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition text-xs font-bold">
                              🖨
                            </button>
                          )}
                          {/* Supprimer */}
                          <button onClick={() => handleDelete(p.id, label)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Détail retenues */}
                    {isOpen && (
                      <tr key={`${p.id}-detail`} className="bg-blue-50/50 border-b border-blue-100">
                        <td colSpan={7} className="px-8 py-3">
                          <div className="flex flex-wrap gap-6 text-xs">
                            <div>
                              <span className="text-gray-500">Salaire brut</span>
                              <span className="ml-2 font-semibold text-gray-800">{pr.gross.toFixed(3)} DT</span>
                            </div>
                            <div>
                              <span className="text-red-500">− CNSS salarié (9,68 %)</span>
                              <span className="ml-2 font-semibold text-red-700">{pr.cnssEmployee.toFixed(3)} DT</span>
                            </div>
                            <div>
                              <span className="text-red-500">− Retenue à la source</span>
                              <span className="ml-2 font-semibold text-red-700">{pr.irpp.toFixed(3)} DT</span>
                            </div>
                            <div>
                              <span className="text-red-500">− CSS (0,45 %)</span>
                              <span className="ml-2 font-semibold text-red-700">{pr.css.toFixed(3)} DT</span>
                            </div>
                            <div>
                              <span className="text-green-600 font-semibold">= Net à payer</span>
                              <span className="ml-2 font-bold text-green-700">{pr.net.toFixed(3)} DT</span>
                            </div>
                            <div className="border-l border-blue-200 pl-6">
                              <span className="text-blue-600">+ CNSS patronal (16,57 %)</span>
                              <span className="ml-2 font-semibold text-blue-700">{pr.cnssEmployer.toFixed(3)} DT</span>
                            </div>
                            <div>
                              <span className="text-blue-700 font-semibold">Coût total employeur</span>
                              <span className="ml-2 font-bold text-blue-800">{pr.totalEmployerCost.toFixed(3)} DT</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════
function PaiementsPageInner() {
  const params        = useSearchParams();
  const initStudentId = params.get("student") || undefined;
  const initTab       = params.get("tab") === "depenses" ? "depenses" : "recettes";

  const [activeTab, setActiveTab] = useState<"recettes" | "depenses">(
    initStudentId ? "recettes" : initTab
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="m-4 mt-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Paiements</h1>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("recettes")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "recettes"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            💰 Recettes élèves
          </button>
          <button
            onClick={() => setActiveTab("depenses")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "depenses"
                ? "bg-white text-orange-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            💸 Dépenses personnel
          </button>
        </div>

        {activeTab === "recettes" ? (
          <RecettesTab initStudentId={initStudentId} />
        ) : (
          <DepensesTab />
        )}
      </div>
    </AuthGuard>
  );
}

export default function PaiementsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400 text-sm">Chargement...</p></div>}>
      <PaiementsPageInner />
    </Suspense>
  );
}
