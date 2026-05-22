"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { parents as parentsApi } from "@/lib/api";

// ── Helpers ──────────────────────────────────────────────────
const generateUsername = (familyName: string) =>
  "famille." + familyName.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");

const GENDER_OPTIONS = [
  { value: "father", label: "👨 Père" },
  { value: "mother", label: "👩 Mère" },
];

const MARITAL_OPTIONS = [
  { value: "alive",    label: "✅ En vie" },
  { value: "deceased", label: "💀 Décédé(e)" },
  { value: "divorced", label: "⚖️ Divorcé(e)" },
  { value: "separated",label: "↔️ Séparé(e)" },
  { value: "remarried",label: "💍 Remarié(e)" },
];

// ── Composant ─────────────────────────────────────────────────
const ParentForm = ({ type, data, onSuccess }: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [generatedUser, setGeneratedUser] = useState("");

  // Mode create : compte famille existant ou nouveau ?
  const [familyMode, setFamilyMode]     = useState<"new" | "existing">("new");
  const [searchingFamily, setSearchingFamily] = useState(false);
  const [familyFound, setFamilyFound]   = useState<any>(null);
  const [familySearchDone, setFamilySearchDone] = useState(false);
  const [familyAccounts, setFamilyAccounts]     = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts]   = useState(false);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: {
      full_name:      data?.full_name || "",
      gender:         data?.gender || "father",
      marital_status: data?.marital_status || "alive",
      family_name:    data?.family_name || "",
      email:          data?.email || "",
      phone:          data?.phone || "",
      address:        data?.address || "",
      cin:            data?.cin || "",
      profession:     data?.profession || "",
      // Compte famille (create seulement)
      family_search:  "",
      user_id:        data?.user_id || "",
    },
  });

  const familyName   = watch("family_name");
  const genderVal    = watch("gender");
  const maritalVal   = watch("marital_status");

  // Extraire le nom de famille depuis le nom complet (dernier mot)
  // et générer le username automatiquement
  const fullName = watch("full_name");
  useEffect(() => {
    if (type !== "create") return;
    const lastName = fullName.trim().split(/\s+/).slice(-1)[0] || "";
    if (lastName) {
      setValue("family_name", lastName, { shouldDirty: false });
      if (familyMode === "new") setGeneratedUser(generateUsername(lastName));
    }
  }, [fullName, familyMode, type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mettre à jour le username si le mode change
  // Et charger la liste des comptes famille si on passe en mode "existing"
  useEffect(() => {
    if (type === "create" && familyMode === "new" && familyName) {
      setGeneratedUser(generateUsername(familyName));
    }
    if (type === "create" && familyMode === "existing" && familyAccounts.length === 0) {
      setLoadingAccounts(true);
      parentsApi.listFamilyAccounts()
        .then(list => setFamilyAccounts(list || []))
        .catch(() => setFamilyAccounts([]))
        .finally(() => setLoadingAccounts(false));
    }
  }, [familyMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rechercher un compte famille existant
  const searchFamilyAccount = async () => {
    const username = generateUsername(familyName);
    if (!username || username === "famille.") return;
    setSearchingFamily(true);
    setFamilySearchDone(false);
    try {
      const result = await parentsApi.getFamilyAccount(username);
      setFamilyFound(result);
      if (result) setValue("user_id", result.id);
    } catch {
      setFamilyFound(null);
    } finally {
      setSearchingFamily(false);
      setFamilySearchDone(true);
    }
  };

  const onSubmit = handleSubmit(async (formData: any) => {
    setLoading(true);
    setError("");
    setTempPassword("");
    try {
      const payload: any = {
        full_name:      formData.full_name,
        gender:         formData.gender,
        marital_status: formData.marital_status,
        family_name:    formData.family_name || null,
        email:          formData.email,
        phone:          formData.phone,
        address:        formData.address    || null,
        cin:            formData.cin        || null,
        profession:     formData.profession || null,
      };

      if (type === "create") {
        // Lier au compte existant ou en créer un nouveau
        if (familyMode === "existing") {
          const selectedUserId = getValues("user_id");
          if (!selectedUserId) {
            setError("Veuillez sélectionner un compte famille.");
            setLoading(false);
            return;
          }
          payload.user_id = selectedUserId;
        }
        // Si familyMode === "new", le service crée le compte automatiquement
        const result = await parentsApi.create(payload);
        if (result.tempPassword) {
          setTempPassword(result.tempPassword);
          setGeneratedUser(result.username || generatedUser);
          // Ne pas fermer — montrer le mot de passe d'abord
          return;
        }
      } else {
        await parentsApi.update(data.id, payload);
      }
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  });

  const inputCls  = "border border-gray-300 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400";
  const labelCls  = "text-xs text-gray-500 mb-1 block";
  const isDeceased = maritalVal === "deceased";

  // ── Écran de confirmation mot de passe ────────────────────
  if (tempPassword) {
    return (
      <div className="flex flex-col gap-6 p-2">
        <div className="text-center">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="text-lg font-semibold text-gray-800">Parent créé avec succès</h2>
          <p className="text-sm text-gray-500 mt-1">
            Transmettez ces identifiants à la famille
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-blue-800">🔑 Compte famille</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between bg-white rounded p-2 border border-blue-100">
              <span className="text-xs text-gray-500">Identifiant</span>
              <span className="font-mono font-bold text-blue-700">{generatedUser}</span>
            </div>
            <div className="flex items-center justify-between bg-white rounded p-2 border border-blue-100">
              <span className="text-xs text-gray-500">Mot de passe temporaire</span>
              <span className="font-mono font-bold text-green-700 text-lg">{tempPassword}</span>
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Notez ce mot de passe — il ne sera plus affiché.
            Le parent peut le changer après connexion.
          </p>
        </div>

        <button
          onClick={onSuccess}
          className="bg-blue-500 text-white p-2.5 rounded-md font-medium hover:bg-blue-600 transition"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Ajouter un parent" : "Modifier le parent"}
      </h1>

      {/* Genre + État civil */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <label className={labelCls}>Genre *</label>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setValue("gender", opt.value, { shouldDirty: true })}
                className={`flex-1 py-2 rounded-md border text-sm font-medium transition
                  ${genderVal === opt.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col w-[180px]">
          <label className={labelCls}>État civil *</label>
          <select
            value={maritalVal}
            onChange={e => setValue("marital_status", e.target.value, { shouldDirty: true })}
            className={`${inputCls} ${isDeceased ? "border-gray-400 bg-gray-50 text-gray-400" : ""}`}
          >
            {MARITAL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Avertissement si décédé */}
      {isDeceased && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-500 flex items-start gap-2">
          <span>ℹ️</span>
          <span>Ce parent est marqué comme décédé. Sa fiche est conservée pour l&apos;historique mais il ne sera pas affiché comme contact actif.</span>
        </div>
      )}

      {/* Nom complet — le nom de famille est extrait automatiquement */}
      <div className="flex flex-col">
        <label className={labelCls}>Nom complet *</label>
        <input {...register("full_name", { required: "Nom obligatoire" })}
          className={inputCls} placeholder="Prénom(s) NOM — ex: Asma BEN AHMED" />
        {errors.full_name && <p className="text-xs text-red-500 mt-1">{String(errors.full_name.message)}</p>}
        {familyName && familyMode === "new" && (
          <p className="text-xs text-gray-400 mt-1">
            Nom de famille détecté : <strong className="text-blue-600">{familyName}</strong>
            {" → "}compte : <span className="font-mono text-blue-600">{generateUsername(familyName)}</span>
          </p>
        )}
      </div>

      {/* Téléphone + Email */}
      <div className="flex gap-3">
        <div className="flex flex-col flex-1">
          <label className={labelCls}>Téléphone *</label>
          <input {...register("phone", { required: "Téléphone obligatoire" })}
            className={inputCls} placeholder="7X XXX XXX" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{String(errors.phone.message)}</p>}
        </div>
        <div className="flex flex-col flex-1">
          <label className={labelCls}>Email</label>
          <input {...register("email")} type="email"
            className={inputCls} placeholder="email@exemple.com" />
        </div>
      </div>

      {/* CIN + Profession */}
      <div className="flex gap-3">
        <div className="flex flex-col w-[160px]">
          <label className={labelCls}>N° CIN</label>
          <input {...register("cin")} className={inputCls}
            placeholder="0XXXXXXX" />
        </div>
        <div className="flex flex-col flex-1">
          <label className={labelCls}>Profession</label>
          <input {...register("profession")} className={inputCls}
            placeholder="Ex: Ingénieur, Enseignant…" />
        </div>
      </div>

      {/* Adresse */}
      <div className="flex flex-col">
        <label className={labelCls}>Adresse</label>
        <input {...register("address")} className={inputCls}
          placeholder="Rue, Ville" />
      </div>

      {/* ── Compte famille (create uniquement) ────────────────── */}
      {type === "create" && (
        <div className="border border-blue-100 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">🔑 Compte famille</span>
            <div className="flex gap-2">
              {(["new", "existing"] as const).map(mode => (
                <button key={mode} type="button"
                  onClick={() => {
                    setFamilyMode(mode);
                    setFamilyFound(null);
                    setFamilySearchDone(false);
                    if (mode === "new") setValue("user_id", "", { shouldDirty: false });
                  }}
                  className={`text-xs px-3 py-1 rounded-full border transition
                    ${familyMode === mode
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-500 border-gray-300"}`}
                >
                  {mode === "new" ? "Nouveau" : "Existant"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white flex flex-col gap-3">
            {familyMode === "new" ? (
              <>
                <p className="text-xs text-gray-400">
                  Un compte sera créé automatiquement depuis le nom de famille.
                </p>
                <div className="flex items-center justify-between bg-gray-50 rounded-md p-3 border border-gray-200">
                  <span className="text-xs text-gray-500">Identifiant généré</span>
                  <span className="font-mono text-blue-700 font-semibold">
                    {generatedUser || <span className="text-gray-300">famille.nomdefamille</span>}
                  </span>
                </div>
                <p className="text-xs text-orange-500">
                  Un mot de passe temporaire sera généré et affiché après la création.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400">
                  Choisissez le compte famille auquel rattacher ce parent.
                </p>
                {loadingAccounts ? (
                  <p className="text-xs text-gray-400 text-center py-2">Chargement des comptes...</p>
                ) : familyAccounts.length === 0 ? (
                  <div className="text-xs text-orange-600 bg-orange-50 rounded p-2 border border-orange-200">
                    ⚠️ Aucun compte famille existant. Passez en mode &quot;Nouveau&quot;.
                  </div>
                ) : (
                  <select
                    value={watch("user_id") || ""}
                    onChange={e => {
                      const found = familyAccounts.find((a: any) => a.id === e.target.value);
                      setFamilyFound(found || null);
                      setValue("user_id", e.target.value, { shouldDirty: true });
                    }}
                    className={inputCls}
                  >
                    <option value="">— Sélectionner un compte famille —</option>
                    {familyAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.username} — {acc.full_name}
                      </option>
                    ))}
                  </select>
                )}
                {familyFound && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded p-2 border border-green-200">
                    <span>✅</span>
                    <span>Ce parent sera lié au compte <strong>{familyFound.username}</strong>.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Enfants liés (update uniquement — lecture seule) */}
      {type === "update" && data?.student_parents?.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className={labelCls}>Enfants liés</label>
          <div className="flex flex-wrap gap-2">
            {data.student_parents.map((sp: any) => (
              <span key={sp.id} className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full">
                {sp.student?.full_name} — {sp.student?.class?.name || "Sans classe"}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}

      <button type="submit" disabled={loading}
        className="bg-blue-500 text-white p-2.5 rounded-md font-medium disabled:opacity-50 hover:bg-blue-600 transition">
        {loading ? "En cours..." : type === "create" ? "Créer le parent" : "Mettre à jour"}
      </button>
    </form>
  );
};

export default ParentForm;
