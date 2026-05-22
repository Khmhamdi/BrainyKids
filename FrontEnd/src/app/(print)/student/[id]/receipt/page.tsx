"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { students as studentsApi } from "@/lib/api";

interface SchoolSettings { schoolName: string; address: string; phone: string; }
const SCHOOL_DEFAULTS: SchoolSettings = { schoolName: "Brainy Kids", address: "— Votre adresse —", phone: "— Votre téléphone —" };
function loadSchoolSettings(): SchoolSettings {
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return { ...SCHOOL_DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return SCHOOL_DEFAULTS;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const MONTHS: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril", 5: "Mai", 6: "Juin",
  7: "Juillet", 8: "Août", 9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

const TYPE_LABELS: Record<string, string> = {
  scolarite:  "Frais de scolarité",
  inscription:"Frais d'inscription",
  cantine:    "Cantine",
  transport:  "Transport",
  club:       "Club / Activité",
};

function PrintReceiptInner() {
  const { id }     = useParams<{ id: string }>();
  const params     = useSearchParams();
  const monthParam = params.get("month") ? parseInt(params.get("month")!) : null;
  const yearParam  = params.get("year")  ? parseInt(params.get("year")!)  : null;

  const [student,  setStudent]  = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [settings, setSettings] = useState<SchoolSettings>(SCHOOL_DEFAULTS);

  useEffect(() => { setSettings(loadSchoolSettings()); }, []);

  useEffect(() => {
    if (!id) return;
    if (!monthParam || !yearParam) {
      setError("Paramètres manquants — utilisez le bouton 🧾 Reçu du mois depuis la fiche enfant");
      setLoading(false);
      return;
    }
    studentsApi.get(id)
      .then(s => {
        setStudent(s);
        const allPayments: any[] = s.payments || [];
        setPayments(allPayments.filter((p: any) =>
          (p.month === monthParam || new Date(p.due_date).getMonth() + 1 === monthParam) &&
          (p.year  === yearParam  || new Date(p.due_date).getFullYear()              === yearParam)
        ));
      })
      .catch((e: any) => setError(e.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [id, monthParam, yearParam]);


  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Chargement...</p>
    </div>
  );
  if (error || !student) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500 text-sm">{error || "Enfant introuvable"}</p>
    </div>
  );

  const today      = new Date().toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" });
  const receiptNum = `BK-${yearParam || new Date().getFullYear()}-${(monthParam || 1).toString().padStart(2,'0')}-${student.id.slice(-4).toUpperCase()}`;
  const total      = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const father     = (student.student_parents || []).find((sp: any) => sp.relationship === "father");
  const mother     = (student.student_parents || []).find((sp: any) =>
    ["mère", "mere", "mother", "maman"].includes(sp.relationship?.toLowerCase())
  );
  const parentName = father?.parent?.full_name || mother?.parent?.full_name || "—";

  const periodLabel = monthParam && yearParam ? `${MONTHS[monthParam]} ${yearParam}` : "";

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
      {/* Barre d'actions */}
      <div className="no-print flex items-center gap-3 mb-4 max-w-2xl mx-auto">
        <button onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          🖨️ Imprimer
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reçu N°</p>
            <p className="text-base font-bold text-gray-800 font-mono">{receiptNum}</p>
            <p className="text-xs text-gray-400 mt-1">Le {today}</p>
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-xl font-bold text-center text-gray-800 mb-6 uppercase tracking-widest">
          Reçu de paiement
        </h2>

        {/* Informations */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Reçu de</p>
            <p className="font-semibold text-gray-800">{parentName}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Pour l'élève</p>
            <p className="font-semibold text-gray-800">{student.full_name}</p>
            <p className="text-xs text-gray-500">{student.class?.name || student.grade || ""}</p>
          </div>
        </div>

        {/* Tableau des paiements */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-4 py-2 text-left">Désignation</th>
              <th className="px-4 py-2 text-center">Période</th>
              <th className="px-4 py-2 text-center">Date de paiement</th>
              <th className="px-4 py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p: any, i: number) => {
              const pMonth = p.month || new Date(p.due_date).getMonth() + 1;
              const pYear  = p.year  || new Date(p.due_date).getFullYear();
              return (
                <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-4 py-2">
                    <span className="font-medium">{TYPE_LABELS[p.type] || p.type}</span>
                    {p.description && (
                      <span className="text-xs text-gray-400 block">{p.description}</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-xs text-gray-600">
                    {MONTHS[pMonth]} {pYear}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-center text-xs">
                    {fmt(p.paid_date) !== "—" ? fmt(p.paid_date) : fmt(p.due_date)}
                  </td>
                  <td className="border border-gray-200 px-4 py-2 text-right font-semibold">
                    {(p.amount || 0).toFixed(3)} DT
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-800 text-white font-bold">
              <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wide text-sm">
                Total reçu
              </td>
              <td className="px-4 py-3 text-right text-base">
                {total.toFixed(3)} DT
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Montant en lettres (placeholder) */}
        <div className="border border-dashed border-gray-300 rounded p-3 mb-6">
          <p className="text-xs text-gray-400 mb-1">Montant en lettres :</p>
          <div className="border-b border-dashed border-gray-200 h-5" />
        </div>

        {/* Pied */}
        <div className="flex justify-between items-end mt-8">
          <div>
            <p className="text-xs text-gray-400 italic">
              Ce reçu atteste du paiement des sommes ci-dessus mentionnées.
            </p>
            {periodLabel && (
              <p className="text-xs text-gray-500 mt-0.5">Période concernée : <strong>{periodLabel}</strong></p>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-10">La Directrice</p>
            <div className="w-44 border-t border-gray-400" />
            <p className="text-xs text-gray-400 mt-1">Signature et cachet</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-8 border-t border-gray-100 pt-4">
          {settings.schoolName} — Document généré le {today}
        </p>
      </div>
    </div>
  );
}

export default function PrintReceiptPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 text-sm">Chargement...</p></div>}>
      <PrintReceiptInner />
    </Suspense>
  );
}
