"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { teachers as teachersApi } from "@/lib/api";
import { calculatePayroll, getPayrollRates } from "@/lib/payroll";

const MONTHS: Record<number, string> = {
  1:"Janvier",2:"Février",3:"Mars",4:"Avril",5:"Mai",6:"Juin",
  7:"Juillet",8:"Août",9:"Septembre",10:"Octobre",11:"Novembre",12:"Décembre",
};

const FONCTION_LABELS: Record<string, string> = {
  enseignante:      "Enseignante",
  femme_de_service: "Femme de service",
  autre:            "Personnel",
};

interface Settings {
  schoolName:    string;
  address:       string;
  phone:         string;
  cnssEmployee:  number;
  cnssEmployer:  number;
  cssRate:       number;
}

const DEFAULT_SETTINGS: Settings = {
  schoolName:   "Brainy Kids",
  address:      "— Votre adresse —",
  phone:        "— Votre téléphone —",
  cnssEmployee: 9.68,
  cnssEmployer: 16.57,
  cssRate:      0.45,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: Settings) {
  localStorage.setItem("payroll_settings", JSON.stringify(s));
}

// ────────────────────────────────────────────────────────────────────────────
// Settings modal
// ────────────────────────────────────────────────────────────────────────────
function SettingsModal({ settings, onSave, onClose }: {
  settings: Settings;
  onSave: (s: Settings) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Settings>({ ...settings });
  const set = (k: keyof Settings, v: string | number) =>
    setDraft(d => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h2 className="text-base font-bold text-gray-800 mb-4">Paramètres du bulletin</h2>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-gray-600 text-xs uppercase tracking-wide">Nom de l'établissement</span>
            <input className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm"
              value={draft.schoolName}
              onChange={e => set("schoolName", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-xs uppercase tracking-wide">Adresse</span>
            <input className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm"
              value={draft.address}
              onChange={e => set("address", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-gray-600 text-xs uppercase tracking-wide">Téléphone</span>
            <input className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm"
              value={draft.phone}
              onChange={e => set("phone", e.target.value)} />
          </label>
          <hr className="my-1" />
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-gray-600 text-xs uppercase tracking-wide">CNSS salarié (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={draft.cnssEmployee}
                onChange={e => set("cnssEmployee", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="text-gray-600 text-xs uppercase tracking-wide">CNSS patronal (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={draft.cnssEmployer}
                onChange={e => set("cnssEmployer", parseFloat(e.target.value) || 0)} />
            </label>
            <label className="block">
              <span className="text-gray-600 text-xs uppercase tracking-wide">CSS (%)</span>
              <input type="number" step="0.01" min="0" max="100"
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={draft.cssRate}
                onChange={e => set("cssRate", parseFloat(e.target.value) || 0)} />
            </label>
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">
            Annuler
          </button>
          <button onClick={() => { saveSettings(draft); onSave(draft); }}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main payslip
// ────────────────────────────────────────────────────────────────────────────
function PayslipInner() {
  const { id }     = useParams<{ id: string }>();
  const params     = useSearchParams();
  const monthParam = params.get("month") ? parseInt(params.get("month")!) : null;
  const yearParam  = params.get("year")  ? parseInt(params.get("year")!)  : null;

  const [teacher,     setTeacher]     = useState<any>(null);
  const [payment,     setPayment]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [settings,    setSettings]    = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings,setShowSettings]= useState(false);

  useEffect(() => { setSettings(loadSettings()); }, []);

  useEffect(() => {
    if (!id) return;
    if (!monthParam || !yearParam) {
      setError("Paramètres manquants — utilisez le bouton 🖨️ Bulletin depuis la page paiements");
      setLoading(false);
      return;
    }
    teachersApi.get(id)
      .then(t => {
        setTeacher(t);
        const pay = (t.salary_payments || []).find(
          (p: any) => p.month === monthParam && p.year === yearParam,
        );
        setPayment(pay || null);
      })
      .catch((e: any) => setError(e.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [id, monthParam, yearParam]);


  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  );
  if (error || !teacher) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500 text-sm">{error || "Introuvable"}</p>
    </div>
  );

  const rates   = {
    CNSS_EMP: settings.cnssEmployee / 100,
    CNSS_PAT: settings.cnssEmployer / 100,
    CSS_RATE: settings.cssRate / 100,
  };
  const gross   = payment ? Number(payment.amount) : (Number(teacher.monthly_salary) || 0);
  const payroll = calculatePayroll(gross, rates);
  const name    = teacher.user?.full_name || teacher.full_name || "—";
  const today   = new Date().toLocaleDateString("fr-TN", { day:"2-digit", month:"long", year:"numeric" });
  const bulletinNo = `BP-${yearParam}-${String(monthParam).padStart(2,"0")}-${teacher.id.slice(-4).toUpperCase()}`;

  return (
    <>
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={s => { setSettings(s); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
        {/* Barre d'actions */}
        <div className="no-print flex items-center gap-3 mb-4 max-w-2xl mx-auto">
          <button onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            🖨️ Imprimer
          </button>
          <button onClick={() => setShowSettings(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition">
            ⚙️ Paramètres
          </button>
          <button onClick={() => window.close()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
            ✕ Fermer
          </button>
        </div>

        {/* Document */}
        <div className="bg-white max-w-2xl mx-auto shadow-lg rounded-lg p-10 print:shadow-none print:rounded-none print:max-w-none print:mx-0">

          {/* En-tête */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-xs text-gray-500 mt-0.5">École Maternelle</p>
              <p className="text-xs text-gray-400 mt-1">{settings.address}</p>
              <p className="text-xs text-gray-400">Tél. : {settings.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bulletin N°</p>
              <p className="text-base font-bold text-gray-800 font-mono">{bulletinNo}</p>
              <p className="text-xs text-gray-400 mt-1">Le {today}</p>
            </div>
          </div>

          {/* Titre + période */}
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4 uppercase tracking-widest">
            Bulletin de Paie
          </h2>
          <div className="text-center mb-6">
            <span className="bg-gray-800 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
              {monthParam && MONTHS[monthParam]} {yearParam}
            </span>
          </div>

          {/* Infos employé */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Employé(e)</p>
              <p className="font-semibold text-gray-800">{name}</p>
              <p className="text-xs text-gray-500">{FONCTION_LABELS[teacher.fonction] || "Personnel"}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date d'embauche</p>
              <p className="font-semibold text-gray-800">
                {teacher.hire_date ? new Date(teacher.hire_date).toLocaleDateString("fr-TN") : "—"}
              </p>
              {teacher.qualification && (
                <p className="text-xs text-gray-500 mt-0.5">{teacher.qualification}</p>
              )}
            </div>
          </div>

          {/* Tableau rémunération */}
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="px-4 py-2 text-left">Désignation</th>
                <th className="px-4 py-2 text-right">Base (DT)</th>
                <th className="px-4 py-2 text-right">Taux</th>
                <th className="px-4 py-2 text-right">Montant (DT)</th>
              </tr>
            </thead>
            <tbody>
              {/* Brut */}
              <tr className="bg-white border-b border-gray-100">
                <td className="px-4 py-2.5 font-medium text-gray-800">Salaire de base (brut)</td>
                <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                <td className="px-4 py-2.5 text-right font-semibold">{payroll.gross.toFixed(3)}</td>
              </tr>
              {/* CNSS salarié */}
              <tr className="bg-red-50 border-b border-gray-100">
                <td className="px-4 py-2.5 text-red-700">Cotisation CNSS — salarié</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{payroll.gross.toFixed(3)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{settings.cnssEmployee.toFixed(2)} %</td>
                <td className="px-4 py-2.5 text-right text-red-700 font-medium">− {payroll.cnssEmployee.toFixed(3)}</td>
              </tr>
              {/* Brut imposable */}
              <tr className="bg-gray-50 border-b border-gray-100">
                <td className="px-4 py-2.5 text-gray-700 font-medium">Salaire brut imposable</td>
                <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{payroll.brutImposable.toFixed(3)}</td>
              </tr>
              {/* Retenue à la source (IRPP) */}
              <tr className="bg-red-50 border-b border-gray-100">
                <td className="px-4 py-2.5 text-red-700">Retenue à la source (IRPP)</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{payroll.brutImposable.toFixed(3)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">progressif</td>
                <td className="px-4 py-2.5 text-right text-red-700 font-medium">− {payroll.irpp.toFixed(3)}</td>
              </tr>
              {/* CSS */}
              <tr className="bg-red-50 border-b border-gray-100">
                <td className="px-4 py-2.5 text-red-700">Contribution Sociale de Solidarité (CSS)</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{payroll.brutImposable.toFixed(3)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{settings.cssRate.toFixed(2)} %</td>
                <td className="px-4 py-2.5 text-right text-red-700 font-medium">− {payroll.css.toFixed(3)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-gray-800 text-white font-bold">
                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wide text-sm">
                  Salaire Net à Payer
                </td>
                <td className="px-4 py-3 text-right text-base">{payroll.net.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Statut paiement */}
          <div className="mb-8">
            {payment?.paid_at ? (
              <span className="inline-flex items-center gap-1.5 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                ✓ Versé le {new Date(payment.paid_at).toLocaleDateString("fr-TN")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full font-medium">
                ⏳ En attente de paiement
              </span>
            )}
            {payment?.notes && (
              <p className="text-xs text-gray-500 italic mt-2">{payment.notes}</p>
            )}
          </div>

          {/* Signature — directrice uniquement */}
          <div className="flex justify-end mt-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-10">La Directrice</p>
              <div className="w-44 border-t border-gray-400" />
              <p className="text-xs text-gray-400 mt-1">Signature et cachet</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-8 border-t border-gray-100 pt-4">
            {settings.schoolName} — Bulletin de paie généré le {today}
          </p>
        </div>
      </div>
    </>
  );
}

export default function PayslipPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    }>
      <PayslipInner />
    </Suspense>
  );
}
