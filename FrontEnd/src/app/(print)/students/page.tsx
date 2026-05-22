"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { students as studentsApi, classes as classesApi } from "@/lib/api";

const SCHOOL_DEFAULTS = { schoolName: "Brainy Kids" };
function loadSchoolName(): string {
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return JSON.parse(s).schoolName || "Brainy Kids";
  } catch {}
  return "Brainy Kids";
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

function PrintStudentsInner() {
  const params      = useSearchParams();
  const year        = params.get("year") || "";
  const classId     = params.get("classId") || "";
  const showArchived = params.get("archived") === "true";

  const [data, setData]           = useState<any[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [schoolName, setSchoolName] = useState("Brainy Kids");

  useEffect(() => { setSchoolName(loadSchoolName()); }, []);

  const load = useCallback(async () => {
    try {
      const res = await studentsApi.list(1, 1000, "", showArchived, classId, year);
      setData(res.data || []);
      if (classId) {
        const classes = await classesApi.list();
        const cls = classes.find((c: any) => c.id === classId);
        if (cls) setClassName(cls.name);
      }
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [year, classId, showArchived]);

  useEffect(() => { load(); }, [load]);


  const today = new Date().toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" });
  const title  = [
    showArchived ? "Enfants archivés" : "Liste des enfants",
    className && `— Classe ${className}`,
    year && `— Année scolaire ${year}`,
  ].filter(Boolean).join(" ");

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-sm">Chargement en cours...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:py-0 print:px-0">
      {/* Barre d'actions — masquée à l'impression */}
      <div className="no-print flex items-center gap-3 mb-4 max-w-5xl mx-auto">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          🖨️ Imprimer
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition"
        >
          ✕ Fermer
        </button>
        <span className="text-sm text-gray-500">{data.length} élève{data.length > 1 ? "s" : ""}</span>
      </div>

      {/* Document imprimable */}
      <div className="bg-white max-w-5xl mx-auto shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none print:max-w-none print:mx-0" id="print-doc">

        {/* En-tête */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{schoolName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">École Maternelle</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Imprimé le {today}</p>
            {year && <p className="text-xs text-gray-600 font-medium mt-0.5">Année scolaire : {year}</p>}
          </div>
        </div>

        {/* Titre */}
        <h2 className="text-lg font-bold text-center text-gray-800 mb-1 uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Total : <strong>{data.length}</strong> enfant{data.length > 1 ? "s" : ""}
          {className && <span> — Classe : <strong>{className}</strong></span>}
        </p>

        {/* Tableau */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-gray-600 px-3 py-2 text-left w-8">N°</th>
              <th className="border border-gray-600 px-3 py-2 text-left">Nom et prénom</th>
              <th className="border border-gray-600 px-3 py-2 text-center">Date de naissance</th>
              <th className="border border-gray-600 px-3 py-2 text-center w-16">Sexe</th>
              <th className="border border-gray-600 px-3 py-2 text-left">Classe</th>
              <th className="border border-gray-600 px-3 py-2 text-left">Régime</th>
              <th className="border border-gray-600 px-3 py-2 text-left">Contact mère</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s: any, i: number) => {
              const mere = (s.student_parents || []).find((sp: any) =>
                ["mère", "mere", "mother", "maman"].includes(sp.relationship?.toLowerCase())
              );
              const regime: Record<string, string> = {
                journee_complete: "Journée complète",
                demi_matin: "Demi matin",
                demi_apres_midi: "Demi après-midi",
              };
              return (
                <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-200 px-3 py-2 text-center text-gray-500">{i + 1}</td>
                  <td className="border border-gray-200 px-3 py-2 font-medium">{s.full_name}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{fmt(s.date_of_birth)}</td>
                  <td className="border border-gray-200 px-3 py-2 text-center">{s.gender === "F" ? "F" : "M"}</td>
                  <td className="border border-gray-200 px-3 py-2">{s.class?.name || "—"}</td>
                  <td className="border border-gray-200 px-3 py-2 text-xs">{regime[s.regime] || s.regime || "—"}</td>
                  <td className="border border-gray-200 px-3 py-2 text-xs">
                    {mere ? (
                      <span>{mere.parent?.full_name}<br /><span className="font-mono">{mere.parent?.phone}</span></span>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pied de page */}
        <div className="mt-10 flex justify-between items-end">
          <div className="text-xs text-gray-400">
            <p>{schoolName} — Document généré le {today}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-8">La Directrice</p>
            <div className="w-40 border-t border-gray-400 mx-auto" />
            <p className="text-xs text-gray-500 mt-1">Signature et cachet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintStudentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 text-sm">Chargement...</p></div>}>
      <PrintStudentsInner />
    </Suspense>
  );
}
