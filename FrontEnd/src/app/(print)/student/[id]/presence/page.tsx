"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { students as studentsApi } from "@/lib/api";

interface SchoolSettings { schoolName: string; address: string; phone: string; ville: string; }
const SCHOOL_DEFAULTS: SchoolSettings = { schoolName: "Brainy Kids", address: "— Votre adresse —", phone: "— Votre téléphone —", ville: "" };
function loadSchoolSettings(): SchoolSettings {
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return { ...SCHOOL_DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return SCHOOL_DEFAULTS;
}

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const currentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const PURPOSE_LABELS: Record<string, string> = {
  general:   "à la demande de l'intéressé(e) et pour faire valoir ce que de droit",
  caf:       "à la demande de l'intéressé(e), pour demande d'allocations familiales",
  assurance: "à la demande de l'intéressé(e), pour dossier d'assurance",
  creche:    "à la demande de l'intéressé(e), pour inscription en crèche",
  medecin:   "à la demande de l'intéressé(e), pour consultation médicale",
  autre:     "à la demande de l'intéressé(e)",
};

function PrintPresenceInner() {
  const { id }  = useParams<{ id: string }>();
  const params  = useSearchParams();
  const purpose = params.get("purpose") || "general";

  const [student,  setStudent]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [settings, setSettings] = useState<SchoolSettings>(SCHOOL_DEFAULTS);

  useEffect(() => { setSettings(loadSchoolSettings()); }, []);

  useEffect(() => {
    if (!id) return;
    studentsApi.get(id)
      .then(setStudent)
      .catch((e: any) => setError(e.message || "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

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
  const schoolYear = currentSchoolYear();
  const gender     = student.gender === "F" ? "féminin" : "masculin";
  const accord     = student.gender === "F" ? "e" : "";
  const age        = student.date_of_birth
    ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const purposeText = PURPOSE_LABELS[purpose] ?? PURPOSE_LABELS.general;

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white print:py-0 print:px-0 print:min-h-0">
      {/* Barre d'actions */}
      <div className="no-print flex items-center gap-3 mb-4 max-w-3xl mx-auto">
        <button onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          🖨️ Imprimer
        </button>
        <button onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 transition">
          ✕ Fermer
        </button>
        <select
          defaultValue={purpose}
          onChange={e => {
            const u = new URL(window.location.href);
            u.searchParams.set("purpose", e.target.value);
            window.location.href = u.toString();
          }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="general">Usage général</option>
          <option value="caf">Allocations familiales</option>
          <option value="assurance">Assurance</option>
          <option value="creche">Inscription crèche</option>
          <option value="medecin">Consultation médicale</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      {/* Document */}
      <div className="bg-white max-w-3xl mx-auto shadow-lg print:shadow-none print:max-w-none print:mx-0">

        {/* En-tête bleue */}
        <div className="bg-[#1a4480] text-white px-8 py-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
            <p className="text-sm text-blue-200 mt-0.5">École Maternelle</p>
          </div>
          <div className="text-right text-sm text-blue-200">
            <p>{settings.address}</p>
            <p>Tél. : {settings.phone}</p>
          </div>
        </div>

        {/* Bande jaune */}
        <div className="h-2 bg-[#f5a623]" />

        {/* Corps */}
        <div className="px-10 py-8">

          {/* Titre */}
          <h2 className="text-xl font-bold text-center text-[#1a4480] mb-1 uppercase tracking-widest">
            Attestation de scolarité
          </h2>
          <p className="text-center text-xs text-gray-400 mb-10">
            Année scolaire : {schoolYear} &nbsp;|&nbsp; Le {today}
          </p>

          {/* Corps du texte */}
          <div className="text-sm text-gray-700 leading-9 space-y-6">

            <p>
              Je soussigné(e), Directeur(trice) de l'école maternelle{" "}
              <strong className="text-[#1a4480]">{settings.schoolName}</strong>,
              certifie par la présente que :
            </p>

            {/* Bloc identité mis en valeur */}
            <div className="border-l-4 border-[#f5a623] bg-[#fdf8ef] px-5 py-4 rounded-r-md text-sm leading-9">
              <strong className="text-[#1a4480] text-base">{student.full_name}</strong>,
              {" "}de sexe <strong>{gender}</strong>,
              {" "}né{accord} le <strong>{fmt(student.date_of_birth)}</strong>,
              {" "}est régulièrement inscrit{accord} au sein de notre établissement
              {" "}pour l'année scolaire <strong>{schoolYear}</strong>,
              {" "}en classe correspondant à la tranche d'âge des{" "}
              <strong>{age !== null ? `${age} ans` : "—"}</strong>.
            </div>

            <p>
              La présente attestation est délivrée <strong>{purposeText}</strong>.
            </p>

            {/* Fait à / date */}
            <p className="mt-8">
              Fait à{" "}
              {settings.ville
                ? <strong>{settings.ville}</strong>
                : <span className="inline-block w-48 border-b border-gray-400 align-bottom mx-1" />
              },
              {" "}le <strong>{today}</strong>
            </p>
          </div>

          {/* Signature */}
          <div className="mt-12 flex justify-end">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-16">La Directrice</p>
              <div className="w-56 border-t border-gray-400" />
              <p className="text-xs text-gray-400 mt-1">Signature et cachet de l'établissement</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-300 mt-8 border-t border-gray-100 pt-4">
            {settings.schoolName} — Document généré le {today}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PrintPresencePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 text-sm">Chargement...</p></div>}>
      <PrintPresenceInner />
    </Suspense>
  );
}
