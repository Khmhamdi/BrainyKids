"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { students as studentsApi } from "@/lib/api";

const MEDIA_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace(/\/api$/, '');

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const fmtShort = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-TN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const currentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const REGIME_LABELS: Record<string, string> = {
  journee_complete: "Journée complète (matin + après-midi)",
  demi_matin:       "Demi-journée matin",
  demi_apres_midi:  "Demi-journée après-midi",
};

const TRANSPORT_LABELS: Record<string, string> = {
  parent: "Accompagné par parent",
  bus:    "Bus scolaire",
  autre:  "Autre",
};

interface SchoolSettings {
  schoolName: string;
  address:    string;
  phone:      string;
}
const SCHOOL_DEFAULTS: SchoolSettings = { schoolName: "Brainy Kids", address: "— Votre adresse —", phone: "— Votre téléphone —" };
function loadSchoolSettings(): SchoolSettings {
  try {
    const s = localStorage.getItem("payroll_settings");
    if (s) return { ...SCHOOL_DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return SCHOOL_DEFAULTS;
}

// ── Section header ──────────────────────────────────────────
const Section = ({ n, title }: { n: number; title: string }) => (
  <div className="flex items-center gap-3 bg-[#1a4480] text-white px-4 py-2 rounded-t-sm mt-4">
    <span className="w-6 h-6 flex items-center justify-center bg-[#f5a623] text-[#1a4480] font-bold text-sm rounded-full flex-shrink-0">
      {n}
    </span>
    <span className="font-bold text-sm uppercase tracking-wide">{title}</span>
  </div>
);

// ── Table row helpers ───────────────────────────────────────
const Row = ({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) => (
  <tr className={highlight ? "bg-[#eaf1fb]" : "bg-white"}>
    <td className="px-4 py-1.5 text-xs font-semibold text-[#1a4480] w-48 border border-gray-200">{label}</td>
    <td className="px-4 py-1.5 text-sm text-gray-800 border border-gray-200">{value || "—"}</td>
  </tr>
);

const Checkbox = ({ checked, label }: { checked: boolean; label: string }) => (
  <div className="flex items-center gap-2 py-1.5">
    <span className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${checked ? "border-[#1a4480] bg-[#1a4480]" : "border-gray-400"}`}>
      {checked && <span className="text-white text-xs font-bold">✓</span>}
    </span>
    <span className="text-sm text-gray-700">{label}</span>
  </div>
);

// ── Page ────────────────────────────────────────────────────
export default function PrintInscriptionPage() {
  const { id } = useParams<{ id: string }>();
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
  const father     = (student.student_parents || []).find((sp: any) => sp.relationship === "father");
  const mother     = (student.student_parents || []).find((sp: any) =>
    ["mère", "mere", "mother", "maman"].includes(sp.relationship?.toLowerCase())
  );
  const checklist  = student.registration_checklist || {};
  const mf         = student.medical_file || {};
  const genderLabel = student.gender === "F" ? "Féminin" : "Masculin";
  const age = student.date_of_birth
    ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const teacher = student.class?.teacher?.user?.full_name || student.class?.teacher?.full_name || "";

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
        <div className="px-8 py-4">

          {/* Titre */}
          <h2 className="text-xl font-bold text-center text-[#1a4480] mb-1 uppercase tracking-widest">
            Bulletin d'Inscription
          </h2>
          <p className="text-center text-xs text-gray-500 mb-3">
            Année scolaire : {schoolYear} &nbsp;|&nbsp; Le {today}
          </p>

          {/* 1 — IDENTITÉ DE L'ENFANT */}
          <Section n={1} title="Identité de l'enfant" />
          <div className="border border-t-0 border-gray-200">
            <div className="flex">
              <table className="flex-1 border-collapse">
                <tbody>
                  <Row label="Nom et prénom"    value={student.full_name} highlight />
                  <Row label="Sexe"             value={genderLabel} />
                  <Row label="Date de naissance" value={fmt(student.date_of_birth)} highlight />
                  <Row label="Âge"             value={age !== null ? `${age} ans` : undefined} />
                  <Row label="Lieu de naissance" value={student.lieu_naissance} highlight />
                  <Row label="Nationalité"     value={student.nationalite || "Tunisienne"} />
                </tbody>
              </table>
              {/* Photo */}
              <div className="w-40 flex-shrink-0 border-l border-gray-200 flex flex-col items-center justify-center p-2">
                {student.photo_url ? (
                  <img src={`${MEDIA_BASE}${student.photo_url}`} alt="Photo" className="w-32 h-40 object-cover border border-gray-300" />
                ) : (
                  <div className="w-32 h-40 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-center">
                    <span className="text-xs leading-tight">Photo<br />de l'enfant</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2 — INFORMATIONS DE SCOLARISATION */}
          <Section n={2} title="Informations de scolarisation" />
          <div className="border border-t-0 border-gray-200">
            <table className="w-full border-collapse">
              <tbody>
                <Row label="Numéro d'inscription" value={student.numero_inscription} highlight />
                <Row label="Classe / Niveau"      value={student.class?.name ? `${student.class.name}${student.grade ? ` — ${student.grade}` : ""}` : (student.grade || "—")} />
                <Row label="Régime"               value={REGIME_LABELS[student.regime] || student.regime} highlight />
                <Row label="Date d'inscription"   value={fmtShort(student.registration_date)} />
                <Row label="Enseignante"          value={teacher} highlight />
                <tr className="bg-white">
                  <td className="px-4 py-1.5 text-xs font-semibold text-[#1a4480] border border-gray-200">Heure d'arrivée</td>
                  <td className="px-4 py-1.5 text-sm text-gray-800 border border-gray-200">
                    <span className="inline-block w-24 border-b border-gray-400 mr-6">{student.heure_arrivee || ""}</span>
                    <span className="text-xs font-semibold text-[#1a4480] mr-2">Heure de départ</span>
                    <span className="inline-block w-24 border-b border-gray-400">{student.heure_depart || ""}</span>
                  </td>
                </tr>
                <tr className="bg-[#eaf1fb]">
                  <td className="px-4 py-1.5 text-xs font-semibold text-[#1a4480] border border-gray-200">Mode de transport</td>
                  <td className="px-4 py-1.5 text-sm text-gray-800 border border-gray-200 flex items-center gap-4">
                    {["parent", "bus", "autre"].map(m => (
                      <span key={m} className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${student.transport_mode === m ? "border-[#1a4480] bg-[#1a4480]" : "border-gray-400"}`}>
                          {student.transport_mode === m && <span className="text-white text-xs font-bold leading-none">✓</span>}
                        </span>
                        <span className="text-xs">{TRANSPORT_LABELS[m]}</span>
                      </span>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3 — INFORMATIONS DES PARENTS */}
          <Section n={3} title="Informations des parents / tuteurs" />
          <div className="border border-t-0 border-gray-200">
            <div className="grid grid-cols-2">
              {/* Père */}
              <div className="border-r border-gray-200">
                <div className="bg-[#1a4480] text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider">Père</div>
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      { label: "Nom et prénom", value: father?.parent?.full_name },
                      { label: "N° CIN",        value: father?.parent?.cin },
                      { label: "Téléphone",     value: father?.parent?.phone },
                      { label: "Email",         value: father?.parent?.email },
                      { label: "Profession",    value: father?.parent?.profession },
                    ].map((r, i) => (
                      <tr key={r.label} className={i % 2 === 0 ? "bg-[#eaf1fb]" : "bg-white"}>
                        <td className="px-3 py-1 text-xs font-semibold text-[#1a4480] border border-gray-200 w-24">{r.label}</td>
                        <td className="px-3 py-1 text-xs text-gray-800 border border-gray-200">{r.value || "—"}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#eaf1fb]">
                      <td className="px-3 py-1 text-xs font-semibold text-[#1a4480] border border-gray-200">Adresse du domicile</td>
                      <td className="px-3 py-1 text-xs text-gray-800 border border-gray-200">{father?.parent?.address || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Mère */}
              <div>
                <div className="bg-[#3a7bd5] text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider">Mère</div>
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      { label: "Nom et prénom", value: mother?.parent?.full_name },
                      { label: "N° CIN",        value: mother?.parent?.cin },
                      { label: "Téléphone",     value: mother?.parent?.phone },
                      { label: "Email",         value: mother?.parent?.email },
                      { label: "Profession",    value: mother?.parent?.profession },
                    ].map((r, i) => (
                      <tr key={r.label} className={i % 2 === 0 ? "bg-[#eaf1fb]" : "bg-white"}>
                        <td className="px-3 py-1 text-xs font-semibold text-[#1a4480] border border-gray-200 w-24">{r.label}</td>
                        <td className="px-3 py-1 text-xs text-gray-800 border border-gray-200">{r.value || "—"}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#eaf1fb]">
                      <td className="px-3 py-1 text-xs font-semibold text-[#1a4480] border border-gray-200">Adresse du domicile</td>
                      <td className="px-3 py-1 text-xs text-gray-800 border border-gray-200">{mother?.parent?.address || "—"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── PAGE 2 (print only) ─────────────────────────────── */}
          <div style={{ breakBefore: 'page' }}>

          {/* 4 — INFORMATIONS MÉDICALES */}
          <Section n={4} title="Informations médicales" />
          <div className="border border-t-0 border-gray-200">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="bg-[#eaf1fb]">
                  <td className="px-4 py-2 text-xs font-semibold text-[#1a4480] border border-gray-200 w-48">Allergies connues</td>
                  <td className="px-4 py-2 text-sm text-gray-800 border border-gray-200">
                    <span className="inline-flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Checkbox checked={!mf.has_allergies} label="Non" />
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Checkbox checked={!!mf.has_allergies} label={`Oui${mf.allergies_detail ? ` — ${mf.allergies_detail}` : " — Préciser :"}`} />
                      </span>
                    </span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-2 text-xs font-semibold text-[#1a4480] border border-gray-200">Traitement en cours</td>
                  <td className="px-4 py-2 text-sm text-gray-800 border border-gray-200">
                    <span className="inline-flex items-center gap-4">
                      <Checkbox checked={!mf.traitement} label="Non" />
                      <Checkbox checked={!!mf.traitement} label={`Oui${mf.traitement_detail ? ` — ${mf.traitement_detail}` : " — Préciser :"}`} />
                    </span>
                  </td>
                </tr>
                <Row label="Condition particulière" value={mf.condition_particuliere} highlight />
                <Row label="Médecin traitant"       value={mf.medecin_traitant} />
                <tr className="bg-[#eaf1fb]">
                  <td className="px-4 py-2 text-xs font-semibold text-[#1a4480] border border-gray-200">Tél. médecin</td>
                  <td className="px-4 py-2 text-sm text-gray-800 border border-gray-200">
                    <span className="mr-8">{mf.tel_medecin || "—"}</span>
                    <span className="text-xs font-semibold text-[#1a4480] mr-2">Email médecin</span>
                    <span>{mf.email_medecin || "—"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5 — DOCUMENTS */}
          <Section n={5} title="Documents du dossier d'inscription" />
          <div className="border border-t-0 border-gray-200 px-6 py-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
              {[
                { key: "photo_identite",             label: "Photo d'identité" },
                { key: "extrait_naissance",           label: "Extrait de naissance" },
                { key: "certificat_medical",          label: "Certificat médical" },
                { key: "fiche_renseignement_signee",  label: "Fiche de renseignement signée" },
                { key: "vaccinations_a_jour",         label: "Carnet de vaccinations à jour" },
                { key: "copie_cin_pere",              label: "Copie CIN père" },
                { key: "copie_cin_mere",              label: "Copie CIN mère" },
              ].map(item => (
                <Checkbox key={item.key} checked={!!checklist[item.key]} label={item.label} />
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="border border-gray-300 rounded p-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-8">Le parent / tuteur</p>
              <p className="text-xs text-gray-400">(Nom, date et signature)</p>
            </div>
            <div className="border border-gray-300 rounded p-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-8">La Directrice</p>
              <p className="text-xs text-gray-400">(Signature et cachet)</p>
            </div>
          </div>

          {/* Note règlement */}
          <div className="mt-4 bg-[#f5a623]/10 border border-[#f5a623]/40 rounded px-4 py-2">
            <p className="text-xs text-gray-600 italic text-center">
              La présente inscription est soumise au règlement intérieur de l'établissement, dont le parent / tuteur déclare avoir pris connaissance.
            </p>
          </div>

          <p className="text-center text-xs text-gray-300 mt-6 pt-3 border-t border-gray-100">
            {settings.schoolName} — Document généré le {today}
          </p>

          </div>{/* end page-2 wrapper */}
        </div>
      </div>
    </div>
  );
}
