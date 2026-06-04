"use client";
import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { settings as settingsApi, auth as authApi, schoolYears as schoolYearsApi } from "@/lib/api";
import { getUser, logout } from "@/lib/useAuth";

// ── Paramètres de l'établissement (localStorage) ─────────────
interface SchoolSettings {
  schoolName:        string;
  address:           string;
  phone:             string;
  ville:             string;
  matricule_fiscale: string;
  cnssEmployee:      number;
  cnssEmployer:      number;
  cssRate:           number;
}
const SCHOOL_DEFAULTS: SchoolSettings = {
  schoolName:        "Brainy Kids",
  address:           "",
  phone:             "",
  ville:             "",
  matricule_fiscale: "",
  cnssEmployee:      9.68,
  cnssEmployer:      16.57,
  cssRate:           0.45,
};
function loadSchoolSettings(): SchoolSettings {
  if (typeof window === "undefined") return SCHOOL_DEFAULTS;
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return { ...SCHOOL_DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return SCHOOL_DEFAULTS;
}
function patchSchoolSettings(patch: Partial<SchoolSettings>) {
  const current = loadSchoolSettings();
  localStorage.setItem("payroll_settings", JSON.stringify({ ...current, ...patch }));
}

// ── Infos établissement ───────────────────────────────────────
const SchoolSettingsPanel = () => {
  type InfoDraft = Pick<SchoolSettings, "schoolName" | "address" | "phone" | "ville" | "matricule_fiscale">;
  const [draft, setDraft] = useState<InfoDraft>({ schoolName: "Brainy Kids", address: "", phone: "", ville: "", matricule_fiscale: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = loadSchoolSettings();
    setDraft({ schoolName: s.schoolName, address: s.address, phone: s.phone, ville: s.ville, matricule_fiscale: s.matricule_fiscale });
  }, []);

  const set = (k: keyof InfoDraft, v: string) => setDraft(d => ({ ...d, [k]: v }));

  const save = () => {
    patchSchoolSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-lg space-y-3 text-sm">
      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom de l'établissement</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={draft.schoolName} onChange={e => set("schoolName", e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Adresse</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={draft.address} onChange={e => set("address", e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={draft.phone} onChange={e => set("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ville</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={draft.ville} onChange={e => set("ville", e.target.value)}
            placeholder="ex : El Mourouj" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Matricule fiscale</span>
          <input className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={draft.matricule_fiscale} onChange={e => set("matricule_fiscale", e.target.value)}
            placeholder="ex : 1234567A/P/M/000" />
        </label>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button onClick={save}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          Enregistrer
        </button>
        {saved && <span className="text-green-600 text-xs font-medium">✓ Paramètres sauvegardés</span>}
      </div>
      <p className="text-xs text-gray-400">Ces paramètres sont enregistrés localement dans votre navigateur.</p>
    </div>
  );
};

// ── Taux de cotisations (accès protégé par mot de passe) ──────
const PayrollRatesPanel = () => {
  type RatesDraft = Pick<SchoolSettings, "cnssEmployee" | "cnssEmployer" | "cssRate">;
  const [unlocked,    setUnlocked]    = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("payroll_unlocked") === "1"
  );
  const [showModal,   setShowModal]   = useState(false);
  const [password,    setPassword]    = useState("");
  const [attempts,    setAttempts]    = useState(0);
  const [authError,   setAuthError]   = useState("");
  const [verifying,   setVerifying]   = useState(false);
  const [draft,       setDraft]       = useState<RatesDraft>({ cnssEmployee: 9.68, cnssEmployer: 16.57, cssRate: 0.45 });
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    const s = loadSchoolSettings();
    setDraft({ cnssEmployee: s.cnssEmployee, cnssEmployer: s.cnssEmployer, cssRate: s.cssRate });
  }, []);

  const verify = async () => {
    const user = getUser();
    if (!user) { logout(); return; }
    setVerifying(true);
    setAuthError("");
    try {
      await authApi.login(user.username, password);
      sessionStorage.setItem("payroll_unlocked", "1");
      setUnlocked(true);
      setShowModal(false);
      setPassword("");
      setAttempts(0);
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        logout();
      } else {
        setAuthError(`Mot de passe incorrect — ${3 - next} tentative(s) restante(s).`);
      }
    } finally {
      setVerifying(false);
    }
  };

  const save = () => {
    patchSchoolSettings(draft);
    sessionStorage.removeItem("payroll_unlocked");
    setUnlocked(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (k: keyof RatesDraft, v: number) => setDraft(d => ({ ...d, [k]: v }));

  return (
    <div className="mt-6 max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">Bulletin de paie — Taux de cotisations</p>
          <p className="text-xs text-gray-400 mt-0.5">CNSS salarié, CNSS patronal, CSS</p>
        </div>
        {!unlocked && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 transition">
            🔒 Déverrouiller
          </button>
        )}
        {unlocked && (
          <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
            🔓 Déverrouillé
          </span>
        )}
      </div>

      {!unlocked ? (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 grid grid-cols-3 gap-3">
          {[
            { label: "CNSS salarié (%)",  value: draft.cnssEmployee },
            { label: "CNSS patronal (%)", value: draft.cnssEmployer },
            { label: "CSS (%)",           value: draft.cssRate },
          ].map(r => (
            <div key={r.label}>
              <p className="text-xs text-gray-400">{r.label}</p>
              <p className="text-sm font-semibold text-gray-500 mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-gray-500">CNSS salarié (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={draft.cnssEmployee}
                onChange={e => set("cnssEmployee", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">CNSS patronal (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={draft.cnssEmployer}
                onChange={e => set("cnssEmployer", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">CSS (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={draft.cssRate}
                onChange={e => set("cssRate", parseFloat(e.target.value) || 0)} />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
              Enregistrer
            </button>
            {saved && <span className="text-green-600 text-xs font-medium">✓ Taux sauvegardés</span>}
          </div>
        </div>
      )}

      {/* Modal mot de passe */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-80 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Accès protégé</h3>
            <p className="text-xs text-gray-500 mb-4">Saisissez votre mot de passe pour modifier les taux de cotisations.</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !verifying && verify()}
              placeholder="Mot de passe"
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
            />
            {authError && <p className="text-xs text-red-600 mb-2">{authError}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={verify} disabled={verifying || !password}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {verifying ? "Vérification…" : "Confirmer"}
              </button>
              <button onClick={() => { setShowModal(false); setPassword(""); setAuthError(""); }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Constantes ────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: string; description: string; codeHint: string }> = {
  regime:     { label: "Régimes de présence", icon: "🕐", description: "Régimes appliqués aux élèves pour le calcul des tarifs de scolarité.", codeHint: "ex: demi_journee_soir" },
  age_group:  { label: "Groupes d'âge",       icon: "👶", description: "Groupes d'âge utilisés pour les classes et les clubs.",              codeHint: "ex: 2 ans" },
  fonction:   { label: "Fonctions du personnel", icon: "👔", description: "Fonctions disponibles pour les membres du personnel.",            codeHint: "ex: educatrice" },
};

const TABS = [
  { key: "regime",        label: "🕐 Régimes"        },
  { key: "age_group",     label: "👶 Groupes d'âge"  },
  { key: "fonction",      label: "👔 Fonctions"       },
  { key: "etablissement", label: "⚙️ Établissement"  },
  { key: "annees",        label: "📅 Années scolaires" },
];

// ── Composant hors du parent (éviter bug focus) ───────────────
const LookupRow = ({ item, onSave, onDelete }: {
  item: any;
  onSave: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [editing,  setEditing]  = useState(false);
  const [label,    setLabel]    = useState(item.label);
  const [order,    setOrder]    = useState(String(item.sort_order ?? 0));
  const [isActive, setIsActive] = useState(item.is_active);
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(item.id, { label, sort_order: parseInt(order) || 0, is_active: isActive });
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <tr className="border-b even:bg-slate-50 text-sm hover:bg-blue-50">
        <td className="py-3 px-3">
          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{item.code}</span>
        </td>
        <td className="py-3 px-3 font-medium">{item.label}</td>
        <td className="py-3 px-3 text-center text-gray-400 text-xs">{item.sort_order}</td>
        <td className="py-3 px-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {item.is_active ? "Actif" : "Inactif"}
          </span>
        </td>
        <td className="py-3 px-3">
          <div className="flex gap-1.5">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition" title="Modifier">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={() => { if (confirm(`Supprimer "${item.label}" ?`)) onDelete(item.id); }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition" title="Supprimer">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b bg-yellow-50 text-sm">
      <td className="py-2 px-3">
        <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{item.code}</span>
      </td>
      <td className="py-2 px-3">
        <input value={label} onChange={e => setLabel(e.target.value)}
          className="border rounded-md p-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </td>
      <td className="py-2 px-3">
        <input type="number" value={order} onChange={e => setOrder(e.target.value)}
          className="border rounded-md p-1.5 text-sm w-16 text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
      </td>
      <td className="py-2 px-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-500" />
          <span className="text-xs">Actif</span>
        </label>
      </td>
      <td className="py-2 px-3">
        <div className="flex gap-1.5">
          <button onClick={save} disabled={saving}
            className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50">
            {saving ? "…" : "Sauver"}
          </button>
          <button onClick={() => setEditing(false)}
            className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">
            Annuler
          </button>
        </div>
      </td>
    </tr>
  );
};

// ── Panel Années scolaires ────────────────────────────────────
const SchoolYearsPanel = () => {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<any | null>(null);

  const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const lCls = 'text-xs font-medium text-gray-600 mb-1 block';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await schoolYearsApi.list();
      setYears(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetCurrent = async (id: string) => {
    if (!confirm('Définir cette année comme année courante ?')) return;
    await schoolYearsApi.setCurrent(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette année scolaire ?')) return;
    try {
      await schoolYearsApi.delete(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (year: any) => {
    setEditingYear(year);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingYear(null);
    setShowModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingYear) {
        await schoolYearsApi.update(editingYear.id, data);
      } else {
        await schoolYearsApi.create(data);
      }
      setShowModal(false);
      setEditingYear(null);
      load();
    } catch (e: any) {
      throw e;
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Années scolaires</p>
          <p className="text-xs text-gray-400 mt-0.5">Gérer les années scolaires et définir l'année courante</p>
        </div>
        <button onClick={handleNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Nouvelle année
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-400 text-sm">Chargement…</p>
      ) : years.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          <p className="text-3xl mb-2">📅</p>
          <p>Aucune année scolaire</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Année</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Début</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Fin</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Statut</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {years.map(y => (
                <tr key={y.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-800">{y.label}</span>
                    {y.is_current && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                        ✓ Courante
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(y.start_date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(y.end_date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {y.is_active ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {!y.is_current && (
                        <button onClick={() => handleSetCurrent(y.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">
                          Définir courante
                        </button>
                      )}
                      <button onClick={() => handleEdit(y)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(y.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <YearModal year={editingYear} onClose={() => { setShowModal(false); setEditingYear(null); }} onSave={handleSave} />
        </div>
      )}
    </div>
  );
};

const YearModal = ({ year, onClose, onSave }: { year?: any; onClose: () => void; onSave: (data: any) => Promise<void> }) => {
  const [label, setLabel] = useState(year?.label || '');
  const [startDate, setStartDate] = useState(year?.start_date ? year.start_date.split('T')[0] : '');
  const [endDate, setEndDate] = useState(year?.end_date ? year.end_date.split('T')[0] : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const lCls = 'text-xs font-medium text-gray-600 mb-1 block';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !startDate || !endDate) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ label, start_date: startDate, end_date: endDate });
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'enregistrement');
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-2xl px-6 py-4">
        <h3 className="text-white font-bold text-lg">
          {year ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire'}
        </h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className={lCls}>Libellé (ex: 2026-2027)</label>
          <input type="text" value={label} onChange={e => setLabel(e.target.value)}
            className={iCls} placeholder="2026-2027" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lCls}>Date de début</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={iCls} />
          </div>
          <div>
            <label className={lCls}>Date de fin</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={iCls} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Enregistrement...' : year ? 'Modifier' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Formulaire ajout ──────────────────────────────────────────
const AddLookupForm = ({ category, codeHint, onAdded }: {
  category: string; codeHint: string; onAdded: () => void;
}) => {
  const [code,    setCode]    = useState("");
  const [label,   setLabel]   = useState("");
  const [order,   setOrder]   = useState("0");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const add = async () => {
    if (!code.trim() || !label.trim()) { setError("Code et libellé sont obligatoires"); return; }
    setSaving(true); setError("");
    try {
      await settingsApi.createLookup({ category, code: code.trim(), label: label.trim(), sort_order: parseInt(order) || 0 });
      setCode(""); setLabel(""); setOrder("0");
      onAdded();
    } catch (e: any) { setError(e.message || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <p className="text-sm font-semibold text-blue-800 mb-3">Ajouter une valeur</p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">Code * <span className="font-normal text-gray-400">({codeHint})</span></label>
          <input value={code} onChange={e => setCode(e.target.value)}
            className="border rounded-md p-2 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="code_unique" />
        </div>
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600 mb-1">Libellé *</label>
          <input value={label} onChange={e => setLabel(e.target.value)}
            className="border rounded-md p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Libellé affiché" />
        </div>
        <div className="flex flex-col w-20">
          <label className="text-xs font-medium text-gray-600 mb-1">Ordre</label>
          <input type="number" value={order} onChange={e => setOrder(e.target.value)}
            className="border rounded-md p-2 text-sm w-full text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
        <button onClick={add} disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {saving ? "Ajout…" : "+ Ajouter"}
        </button>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("regime");
  const [items, setItems]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);

  const meta = CATEGORY_META[activeTab] ?? { label: "", icon: "", description: "", codeHint: "" };

  const load = useCallback(() => {
    setLoading(true);
    settingsApi.getLookups(activeTab)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id: string, data: any) => {
    await settingsApi.updateLookup(id, data);
    load();
  };

  const handleDelete = async (id: string) => {
    await settingsApi.deleteLookup(id);
    load();
  };

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4 mt-0">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Paramètres</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gérez les listes de valeurs utilisées dans l'application</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${activeTab === t.key ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "annees" ? (
          <SchoolYearsPanel />
        ) : activeTab === "etablissement" ? (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">⚙️</span>
                <h2 className="text-base font-semibold">Informations de l'établissement</h2>
              </div>
              <p className="text-xs text-gray-500">Nom, adresse, téléphone et matricule fiscale affichés sur les documents imprimables.</p>
            </div>
            <SchoolSettingsPanel />
            <hr className="my-6 max-w-lg" />
            <PayrollRatesPanel />
          </>
        ) : (
          <>
            {/* En-tête de la catégorie */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{meta.icon}</span>
                <h2 className="text-base font-semibold">{meta.label}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-1">{items.length} valeur(s)</span>
              </div>
              <p className="text-xs text-gray-500">{meta.description}</p>
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-center py-8 text-gray-400 text-sm">Chargement…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b">
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Libellé</th>
                      <th className="py-2 px-3 text-center">Ordre</th>
                      <th className="py-2 px-3">Statut</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                          Aucune valeur enregistrée
                        </td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <LookupRow key={item.id} item={item} onSave={handleSave} onDelete={handleDelete} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <AddLookupForm category={activeTab} codeHint={meta.codeHint} onAdded={load} />

            {/* Note d'information */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Note :</strong> Modifier ou désactiver une valeur n'affecte pas les données existantes. Les valeurs inactives n'apparaissent plus dans les formulaires.
              </p>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  );
};

export default SettingsPage;
