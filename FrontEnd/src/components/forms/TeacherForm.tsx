"use client";
import { useState, useEffect } from "react";
import { teachers as teachersApi, settings as settingsApi, upload as uploadApi } from "@/lib/api";
import PhotoUpload from "@/components/PhotoUpload";

const FONCTIONS_FALLBACK = [
  { value: "enseignante",       label: "Enseignante" },
  { value: "femme_de_service",  label: "Femme de service" },
  { value: "autre",             label: "Autre personnel" },
];

// Défini hors du composant pour éviter le démontage à chaque render (bug focus)
const Field = ({
  label, value, onChange, type: t = "text", placeholder = "", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
    <label className="text-xs font-medium text-gray-600">{label}{required && " *"}</label>
    <input
      type={t} value={value} onChange={e => onChange(e.target.value)}
      className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      placeholder={placeholder}
    />
  </div>
);

const TeacherForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const isCreate = type === "create";

  const [fonctionsList, setFonctionsList]  = useState(FONCTIONS_FALLBACK);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  useEffect(() => {
    settingsApi.getLookups("fonction", true)
      .then(list => {
        if (list.length) setFonctionsList(list.map((l: any) => ({ value: l.code, label: l.label })));
      })
      .catch(() => {});
  }, []);
  const [fonction, setFonction]           = useState(data?.fonction || "enseignante");
  const [fullName, setFullName]           = useState(data?.user?.full_name || data?.full_name || "");
  const [username, setUsername]           = useState(data?.user?.username || "");
  const [password, setPassword]           = useState("");
  const [email, setEmail]                 = useState(data?.user?.email || "");
  const [phone, setPhone]                 = useState(data?.user?.phone || "");
  const [qualification, setQualification] = useState(data?.qualification || "");
  const [hireDate, setHireDate]           = useState(
    data?.hire_date ? data.hire_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [departureDate, setDepartureDate] = useState(
    data?.departure_date ? data.departure_date.slice(0, 10) : ""
  );
  const [photoFile, setPhotoFile]         = useState<File | null>(null);
  const [monthlySalary, setMonthlySalary] = useState(
    data?.monthly_salary !== undefined && data?.monthly_salary !== null
      ? String(data.monthly_salary)
      : ""
  );

  const isTeacher = fonction === "enseignante";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Le nom complet est obligatoire"); return; }
    if (isCreate && isTeacher && !username.trim()) { setError("Le nom d'utilisateur est obligatoire pour une enseignante"); return; }
    if (isCreate && isTeacher && password.length < 6) { setError("Le mot de passe doit avoir au moins 6 caractères"); return; }

    setSaving(true);
    try {
      let photoUrl: string | undefined = data?.photo_url ?? undefined;
      if (photoFile) {
        try { photoUrl = await uploadApi.photo(photoFile); }
        catch (e: any) { setError(`Photo non uploadée : ${e.message}`); setSaving(false); return; }
      }

      const payload: any = {
        full_name:     fullName.trim(),
        fonction,
        ...(photoUrl !== undefined && { photo_url: photoUrl }),
        phone:         phone.trim() || null,
        qualification: qualification.trim() || null,
        hire_date:     hireDate || null,
        departure_date: departureDate || null,
        monthly_salary: monthlySalary !== "" ? monthlySalary : null,
      };

      if (isTeacher) {
        payload.email = email.trim() || null;
        if (isCreate) {
          payload.username = username.trim();
          payload.password = password;
        }
      }

      if (isCreate) {
        await teachersApi.create(payload);
      } else {
        await teachersApi.update(data.id, payload);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <h1 className="text-xl font-semibold">
        {isCreate ? "Ajouter du personnel" : "Modifier le membre du personnel"}
      </h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</p>
      )}

      {/* Photo */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Photo</label>
        <PhotoUpload
          currentUrl={data?.photo_url}
          previewFile={photoFile}
          onChange={f => setPhotoFile(f)}
          size="sm"
        />
      </div>

      {/* Fonction */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Fonction *</label>
        <div className="flex gap-3 flex-wrap">
          {fonctionsList.map(f => (
            <label
              key={f.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                fonction === f.value
                  ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="radio" name="fonction" value={f.value}
                checked={fonction === f.value}
                onChange={() => setFonction(f.value)}
                className="hidden"
              />
              {f.value === "enseignante"      && "👩‍🏫 "}
              {f.value === "femme_de_service" && "🧹 "}
              {f.value === "autre"            && "👤 "}
              {f.label}
            </label>
          ))}
        </div>
        {isTeacher && (
          <p className="text-xs text-blue-600 mt-1">
            Un compte de connexion sera créé pour cette enseignante.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Informations communes */}
        <Field label="Nom complet" value={fullName} onChange={setFullName}
          placeholder="Prénom et nom" required />
        <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="+216 XX XXX XXX" />
        <Field label="Qualification" value={qualification} onChange={setQualification}
          placeholder="Ex: Licence en éducation" />
        <Field label="Salaire mensuel (DT)" value={monthlySalary} onChange={setMonthlySalary}
          type="number" placeholder="Ex: 800" />
        <Field label="Date de recrutement" value={hireDate} onChange={setHireDate} type="date" />
        <Field label="Date de départ" value={departureDate} onChange={setDepartureDate} type="date" />

        {/* Compte utilisateur — enseignantes seulement */}
        {isTeacher && (
          <>
            <div className="w-full border-t pt-3 mt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Compte de connexion
              </p>
              <div className="flex flex-wrap gap-4">
                <Field label="Email" value={email} onChange={setEmail}
                  type="email" placeholder="email@exemple.com" />
                {isCreate && (
                  <>
                    <Field label="Nom d'utilisateur" value={username} onChange={setUsername}
                      placeholder="Identifiant de connexion" required />
                    <Field label="Mot de passe" value={password} onChange={setPassword}
                      type="password" placeholder="Min. 6 caractères" required />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <button
        type="submit" disabled={saving}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 transition-colors"
      >
        {saving ? "Enregistrement..." : isCreate ? "Ajouter" : "Mettre à jour"}
      </button>
    </form>
  );
};

export default TeacherForm;
