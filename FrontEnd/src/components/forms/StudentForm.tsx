"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { students as studentsApi, classes as classesApi, parents as parentsApi, upload as uploadApi, schedules as schedulesApi } from "@/lib/api";

const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const gradeFromAge = (age: number): string => {
  if (age <= 3) return "PS";
  if (age === 4) return "MS";
  return "GS";
};

const getCurrentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const getSchoolYearOptions = () => {
  const now = new Date();
  const current = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years: string[] = [];
  for (let y = current + 1; y >= 2020; y--) years.push(`${y}-${y + 1}`);
  return years;
};

const StudentForm = ({ type, data, onSuccess }: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [classesList,   setClassesList]   = useState<any[]>([]);
  const [parentsList,   setParentsList]   = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [confirmed,     setConfirmed]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [autoGrade, setAutoGrade] = useState("");
  const [autoClass, setAutoClass] = useState<any>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showFollowup, setShowFollowup] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      full_name:          data?.full_name || "",
      date_of_birth:      data?.date_of_birth ? new Date(data.date_of_birth).toISOString().split("T")[0] : "",
      class_id:           data?.class_id || data?.class?.id || "",
      grade:              data?.grade || "",
      gender:             data?.gender || "M",
      regime:             data?.regime || "journee_complete",
      lieu_naissance:     data?.lieu_naissance     || "",
      nationalite:        data?.nationalite        || "Tunisienne",
      numero_inscription: data?.numero_inscription || "",  // read-only in update, auto in create
      heure_arrivee:      data?.heure_arrivee      || "",
      heure_depart:       data?.heure_depart       || "",
      transport_mode:     data?.transport_mode     || "parent",
      schedule_id:        data?.schedule_id || data?.schedule?.id || "",
      school_year:        data?.student_pack?.school_year || getCurrentSchoolYear(),
      // Medical
      med_has_allergies:          data?.medical_file?.has_allergies          || false,
      med_allergies_detail:       data?.medical_file?.allergies_detail       || "",
      med_traitement:             data?.medical_file?.traitement             || false,
      med_traitement_detail:      data?.medical_file?.traitement_detail      || "",
      med_condition_particuliere: data?.medical_file?.condition_particuliere || "",
      med_medecin_traitant:       data?.medical_file?.medecin_traitant       || "",
      med_tel_medecin:            data?.medical_file?.tel_medecin            || "",
      med_email_medecin:          data?.medical_file?.email_medecin          || "",
      father_id: data?.student_parents?.find((sp: any) => sp.relationship === "father")?.parent_id || "",
      mother_id: data?.student_parents?.find((sp: any) => sp.relationship === "mother")?.parent_id || "",
      photo_identite: data?.registration_checklist?.photo_identite || false,
      extrait_naissance: data?.registration_checklist?.extrait_naissance || false,
      certificat_medical: data?.registration_checklist?.certificat_medical || false,
      fiche_renseignement_signee: data?.registration_checklist?.fiche_renseignement_signee || false,
      vaccinations_a_jour: data?.registration_checklist?.vaccinations_a_jour || false,
      copie_cin_pere: data?.registration_checklist?.copie_cin_pere || false,
      copie_cin_mere: data?.registration_checklist?.copie_cin_mere || false,
      followup_type: data?.specialized_followup?.type || "",
      followup_specialist_name: data?.specialized_followup?.specialist_name || "",
      followup_specialist_phone: data?.specialized_followup?.specialist_phone || "",
      followup_specialist_email: data?.specialized_followup?.specialist_email || "",
      followup_frequency: data?.specialized_followup?.frequency || "",
      followup_class_recommendations: data?.specialized_followup?.class_recommendations || "",
      followup_notes: data?.specialized_followup?.notes || "",
    },
  });

  const dob = watch("date_of_birth");

  // ── Chargement classes + parents ────────────────────────────
  // IMPORTANT : une fois classesList chargée, on initialise autoClass
  // immédiatement si on est en mode update — sans attendre un changement de dob.
  useEffect(() => {
    classesApi.list()
      .then(list => {
        setClassesList(list);

        // Ouvrir la section suivi si déjà renseignée
        if (data?.specialized_followup?.type) setShowFollowup(true);
        // Mode update : retrouver la classe actuelle dans la liste fraîchement chargée
        if (type === "update") {
          const currentClassId = data?.class_id || data?.class?.id;
          if (currentClassId) {
            const found = list.find((c: any) => c.id === currentClassId);
            if (found) {
              setAutoClass(found);
              // S'assurer que le select est bien positionné
              setValue("class_id", found.id);
            }
          }
          // Initialiser l'âge affiché sans modifier la classe
          if (data?.date_of_birth) {
            const dobStr = new Date(data.date_of_birth).toISOString().split("T")[0];
            const a = calculateAge(dobStr);
            setAge(a);
            const g = data.grade || gradeFromAge(a);
            setAutoGrade(g);
            setValue("grade", g);
          }
        }
      })
      .catch(() => setClassesList([]));

    parentsApi.list(1, 100)
      .then(res => setParentsList(res.data || []))
      .catch(() => setParentsList([]));

    schedulesApi.list()
      .then(setSchedulesList)
      .catch(() => setSchedulesList([]));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Réaction au changement de date de naissance ───────────────
  // Recalcule UNIQUEMENT l'âge affiché.
  // Ne touche PAS à la classe ni au niveau (Scénario 1 : c'est la classe qui pilote).
  useEffect(() => {
    if (!dob) {
      setAge(null);
      return;
    }
    setAge(calculateAge(dob));
  }, [dob]);

  const onSubmit = handleSubmit(async (formData: any) => {
    if (!formData.class_id) {
      setError("La classe est obligatoire");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Uploader la photo si un fichier est sélectionné
      let photoUrl: string | null = data?.photo_url || null;
      if (photoFile) {
        try {
          photoUrl = await uploadApi.photo(photoFile);
        } catch (uploadErr: any) {
          // Afficher l'erreur mais ne pas bloquer la création
          console.error("Upload photo:", uploadErr);
          setError(`Photo non uploadée : ${uploadErr.message}. L'enfant sera créé sans photo.`);
        }
      }

      const payload = {
        full_name:          formData.full_name,
        date_of_birth:      formData.date_of_birth,
        class_id:           formData.class_id,
        grade:              formData.grade,
        gender:             formData.gender,
        regime:             formData.regime,
        lieu_naissance:     formData.lieu_naissance     || null,
        nationalite:        formData.nationalite        || "Tunisienne",
        // numero_inscription is auto-generated by backend on create; sent on update for display only
        ...(type === "update" && { numero_inscription: formData.numero_inscription || null }),
        heure_arrivee:      formData.heure_arrivee      || null,
        heure_depart:       formData.heure_depart       || null,
        transport_mode:     formData.transport_mode     || "parent",
        schedule_id:        formData.schedule_id        || null,
        school_year:        formData.school_year        || getCurrentSchoolYear(),
        photo_url:          photoUrl,
        father_id:          formData.father_id || null,
        mother_id:          formData.mother_id || null,
        photo_identite:             formData.photo_identite,
        extrait_naissance:          formData.extrait_naissance,
        certificat_medical:         formData.certificat_medical,
        fiche_renseignement_signee: formData.fiche_renseignement_signee,
        vaccinations_a_jour:        formData.vaccinations_a_jour,
        copie_cin_pere:             formData.copie_cin_pere,
        copie_cin_mere:             formData.copie_cin_mere,
        followup_type:                  formData.followup_type || null,
        followup_specialist_name:       formData.followup_specialist_name || null,
        followup_specialist_phone:      formData.followup_specialist_phone || null,
        followup_specialist_email:      formData.followup_specialist_email || null,
        followup_frequency:             formData.followup_frequency || null,
        followup_class_recommendations: formData.followup_class_recommendations || null,
        followup_notes:                 formData.followup_notes || null,
        medical_file: {
          has_allergies:          formData.med_has_allergies,
          allergies_detail:       formData.med_allergies_detail       || null,
          traitement:             formData.med_traitement,
          traitement_detail:      formData.med_traitement_detail      || null,
          condition_particuliere: formData.med_condition_particuliere || null,
          medecin_traitant:       formData.med_medecin_traitant       || null,
          tel_medecin:            formData.med_tel_medecin            || null,
          email_medecin:          formData.med_email_medecin          || null,
        },
      };
      if (type === "create") await studentsApi.create(payload);
      else await studentsApi.update(data.id, payload);
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  });

  const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400";
  const labelCls = "text-xs text-gray-500 mb-1 block";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Ajouter un enfant" : "Modifier l'enfant"}
      </h1>

      {/* Nom + Date + Âge + Genre */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={labelCls}>Nom complet *</label>
          <input {...register("full_name", { required: "Nom obligatoire" })} className={inputCls} placeholder="Prénom Nom" />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{String(errors.full_name.message)}</p>}
        </div>
        <div className="flex flex-col w-[160px]">
          <label className={labelCls}>Date de naissance *</label>
          <input type="date" {...register("date_of_birth", { required: "Date obligatoire" })} className={inputCls} />
          {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{String(errors.date_of_birth.message)}</p>}
        </div>
        <div className="flex flex-col w-[80px]">
          <label className={labelCls}>Âge</label>
          <input readOnly value={age !== null ? `${age} ans` : ""} className={`${inputCls} bg-gray-50 text-center text-blue-600 font-semibold`} placeholder="—" />
        </div>
        <div className="flex flex-col w-[90px]">
          <label className={labelCls}>Genre *</label>
          <select {...register("gender")} className={inputCls}>
            <option value="M">Garçon</option>
            <option value="F">Fille</option>
          </select>
        </div>
        {/* Régime */}
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className={labelCls}>Régime de présence *</label>
          <select {...register("regime")} className={inputCls}>
            <option value="journee_complete">Journée complète</option>
            <option value="demi_matin">Demi-journée matin</option>
            <option value="demi_apres_midi">Demi-journée après-midi</option>
          </select>
        </div>
      </div>

      {/* Lieu de naissance + Nationalité + N° inscription (lecture seule en update) */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={labelCls}>Lieu de naissance</label>
          <input {...register("lieu_naissance")} className={inputCls} placeholder="Ville, Gouvernorat" />
        </div>
        <div className="flex flex-col w-[180px]">
          <label className={labelCls}>Nationalité</label>
          <input {...register("nationalite")} className={inputCls} placeholder="Tunisienne" />
        </div>
        {type === "update" && watch("numero_inscription") && (
          <div className="flex flex-col w-[160px]">
            <label className={labelCls}>N° d'inscription</label>
            <input readOnly value={watch("numero_inscription") || ""} className={`${inputCls} bg-gray-50 text-blue-700 font-mono`} />
          </div>
        )}
      </div>

      {/* Horaires + Transport */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col w-[130px]">
          <label className={labelCls}>Heure d'arrivée</label>
          <input type="time" {...register("heure_arrivee")} className={inputCls} />
        </div>
        <div className="flex flex-col w-[130px]">
          <label className={labelCls}>Heure de départ</label>
          <input type="time" {...register("heure_depart")} className={inputCls} />
        </div>
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={labelCls}>Mode de transport</label>
          <select {...register("transport_mode")} className={inputCls}>
            <option value="parent">Accompagné par parent</option>
            <option value="bus">Bus scolaire</option>
            <option value="autre">Autre</option>
          </select>
        </div>
      </div>

      {/* Photo */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Charger photo</label>
        <div className="flex items-center gap-2">
          <input readOnly value={photoFile?.name || ""} className={`${inputCls} flex-1`} placeholder="Aucun fichier sélectionné" />
          <label className="cursor-pointer px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 hover:bg-gray-100">
            ...
            <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>

      {/* Année scolaire */}
      <div className="flex flex-col gap-1">
        <label className={labelCls}>Année scolaire *</label>
        <select
          value={watch("school_year") || ""}
          onChange={e => setValue("school_year", e.target.value, { shouldDirty: true })}
          className={`${inputCls} font-semibold text-blue-700`}
        >
          {getSchoolYearOptions().map(y => (
            <option key={y} value={y}>{y}{y === getCurrentSchoolYear() ? " (en cours)" : ""}</option>
          ))}
        </select>
      </div>

      {/* Classe + Niveau + Emploi du temps */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col flex-1 min-w-[180px]">
          <label className={labelCls}>Classe *</label>
          <select
            value={watch("class_id") || ""}
            onChange={e => {
              const found = classesList.find((c: any) => c.id === e.target.value);
              setAutoClass(found || null);
              setValue("class_id", e.target.value, { shouldDirty: true });

              // Auto-sélectionner l'emploi du temps de la classe (override possible)
              if (found?.schedule?.id) {
                setValue("schedule_id", found.schedule.id, { shouldDirty: true });
              } else {
                setValue("schedule_id", "", { shouldDirty: true });
              }

              // Niveau déduit du nom de la classe SAUF si suivi spécialisé actif
              const hasFollowup = !!watch("followup_type");
              if (found && !hasFollowup) {
                const gradeMatch = found.name?.toUpperCase().match(/\b(PS|MS|GS)\b/);
                if (gradeMatch) setValue("grade", gradeMatch[1], { shouldDirty: true });
              }
            }}
            className={inputCls}
          >
            <option value="">— Sélectionner —</option>
            {classesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {autoClass && (
            <p className="text-xs text-green-600 mt-1">
              ✓ {type === "update" ? "Classe chargée" : "Attribuée automatiquement"}
            </p>
          )}
        </div>
        <div className="flex flex-col w-[130px]">
          <label className={labelCls}>Niveau</label>
          <select
            value={watch("grade") || ""}
            onChange={e => setValue("grade", e.target.value, { shouldDirty: true })}
            className={`${inputCls} font-semibold ${watch("followup_type") ? "text-orange-600 border-orange-300" : "text-blue-600"}`}
          >
            <option value="">— Niveau —</option>
            <option value="PS">PS — Petite Section</option>
            <option value="MS">MS — Moyenne Section</option>
            <option value="GS">GS — Grande Section</option>
          </select>
        </div>
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className={labelCls}>Emploi du temps</label>
          <select
            value={watch("schedule_id") || ""}
            onChange={e => setValue("schedule_id", e.target.value, { shouldDirty: true })}
            className={inputCls}
          >
            <option value="">— Aucun —</option>
            {schedulesList.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>
            ))}
          </select>
          {watch("schedule_id") && autoClass?.schedule?.id && watch("schedule_id") === autoClass.schedule.id && (
            <p className="text-xs text-green-600 mt-1">✓ Hérité de la classe</p>
          )}
          {watch("schedule_id") && autoClass?.schedule?.id && watch("schedule_id") !== autoClass.schedule.id && (
            <p className="text-xs text-orange-500 mt-1">↳ Arrangement personnalisé</p>
          )}
        </div>
      </div>

      {/* Tuteur */}
      <div className="flex flex-col flex-1 min-w-[160px]">
        <label className={labelCls}>Tuteur (enseignante de la classe)</label>
        <input readOnly value={autoClass?.teacher?.user?.full_name || ""} className={`${inputCls} bg-gray-50`} placeholder="Attribué selon la classe" />
      </div>

      {/* Père + Mère */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={labelCls}>Père</label>
          <select
            value={watch("father_id") || ""}
            onChange={e => setValue("father_id", e.target.value, { shouldDirty: true })}
            className={inputCls}
          >
            <option value="">— Sélectionner un parent —</option>
            {parentsList.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>)}
          </select>
        </div>
        <div className="flex flex-col flex-1 min-w-[160px]">
          <label className={labelCls}>Mère</label>
          <select
            value={watch("mother_id") || ""}
            onChange={e => setValue("mother_id", e.target.value, { shouldDirty: true })}
            className={inputCls}
          >
            <option value="">— Sélectionner un parent —</option>
            {parentsList.map(p => <option key={p.id} value={p.id}>{p.full_name} — {p.phone}</option>)}
          </select>
        </div>
      </div>

      {/* Dossier d'inscription */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Dossier d&apos;inscription</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { name: "photo_identite",            label: "📷 Photo d'identité" },
            { name: "extrait_naissance",          label: "📋 Extrait de naissance" },
            { name: "certificat_medical",         label: "🏥 Certificat médical" },
            { name: "fiche_renseignement_signee", label: "✍️ Fiche de renseignement signée" },
            { name: "vaccinations_a_jour",        label: "💉 Carnet de vaccinations" },
            { name: "copie_cin_pere",             label: "🪪 Copie CIN père" },
            { name: "copie_cin_mere",             label: "🪪 Copie CIN mère" },
          ].map(item => (
            <label key={item.name} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 text-xs">
              <input type="checkbox" {...register(item.name as any)} className="w-4 h-4 accent-blue-500" />
              {item.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Informations médicales ────────────────────── */}
      <div className="border border-red-100 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-red-50 text-sm font-medium text-red-800">
          🏥 Informations médicales
        </div>
        <div className="p-4 flex flex-col gap-4 bg-white">
          {/* Allergies */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input type="checkbox" {...register("med_has_allergies")} className="w-4 h-4 accent-red-500" />
              <span className="text-xs font-medium text-gray-700">Allergies connues</span>
            </label>
            {watch("med_has_allergies") && (
              <input {...register("med_allergies_detail")} className={inputCls}
                placeholder="Préciser les allergies…" />
            )}
          </div>
          {/* Traitement */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input type="checkbox" {...register("med_traitement")} className="w-4 h-4 accent-red-500" />
              <span className="text-xs font-medium text-gray-700">Traitement en cours</span>
            </label>
            {watch("med_traitement") && (
              <input {...register("med_traitement_detail")} className={inputCls}
                placeholder="Préciser le traitement…" />
            )}
          </div>
          {/* Condition particulière */}
          <div className="flex flex-col">
            <label className={labelCls}>Condition particulière</label>
            <input {...register("med_condition_particuliere")} className={inputCls}
              placeholder="Asthme, diabète, handicap moteur…" />
          </div>
          {/* Médecin */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col flex-1 min-w-[140px]">
              <label className={labelCls}>Médecin traitant</label>
              <input {...register("med_medecin_traitant")} className={inputCls}
                placeholder="Dr. Ben Ali" />
            </div>
            <div className="flex flex-col w-[150px]">
              <label className={labelCls}>Tél. médecin</label>
              <input {...register("med_tel_medecin")} className={inputCls}
                placeholder="7X XXX XXX" />
            </div>
            <div className="flex flex-col flex-1 min-w-[140px]">
              <label className={labelCls}>Email médecin</label>
              <input {...register("med_email_medecin")} type="email" className={inputCls}
                placeholder="cabinet@email.com" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Suivi spécialisé ──────────────────────────── */}
      <div className="border border-orange-200 rounded-lg overflow-hidden">
        <button type="button"
          onClick={() => setShowFollowup(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition text-sm font-medium text-orange-800">
          <span className="flex items-center gap-2">
            🧠 Suivi spécialisé externe
            {watch("followup_type") && (
              <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full">
                Actif
              </span>
            )}
          </span>
          <span className="text-orange-400 text-lg">{showFollowup ? "▲" : "▼"}</span>
        </button>

        {showFollowup && (
          <div className="p-4 flex flex-col gap-4 bg-white">
            <p className="text-xs text-gray-400 italic">
              Ces informations sont confidentielles — visibles uniquement par l&apos;administration.
            </p>

            {/* Type + Spécialiste */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col flex-1 min-w-[160px]">
                <label className={labelCls}>Type de suivi</label>
                <select {...register("followup_type")} className={inputCls}>
                  <option value="">— Aucun suivi —</option>
                  <option value="pedo_psy">🧒 Pédopsychiatre</option>
                  <option value="psychologue">🧠 Psychologue</option>
                  <option value="orthophoniste">🗣️ Orthophoniste</option>
                  <option value="ergotherapeute">🤲 Ergothérapeute</option>
                  <option value="psychomotricien">🏃 Psychomotricien</option>
                  <option value="autre">➕ Autre</option>
                </select>
              </div>
              <div className="flex flex-col flex-1 min-w-[160px]">
                <label className={labelCls}>Fréquence des séances</label>
                <select {...register("followup_frequency")} className={inputCls}>
                  <option value="">— Non précisée —</option>
                  <option value="hebdo">Hebdomadaire</option>
                  <option value="bimensuel">Bimensuelle</option>
                  <option value="mensuel">Mensuelle</option>
                  <option value="ponctuel">Ponctuelle</option>
                </select>
              </div>
            </div>

            {/* Nom + Téléphone + Email */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col flex-1 min-w-[160px]">
                <label className={labelCls}>Nom du spécialiste *</label>
                <input {...register("followup_specialist_name")} className={inputCls}
                  placeholder="Dr. Ben Ali" />
              </div>
              <div className="flex flex-col w-[160px]">
                <label className={labelCls}>Téléphone</label>
                <input {...register("followup_specialist_phone")} className={inputCls}
                  placeholder="7X XXX XXX" />
              </div>
              <div className="flex flex-col flex-1 min-w-[160px]">
                <label className={labelCls}>Email</label>
                <input {...register("followup_specialist_email")} className={inputCls}
                  placeholder="cabinet@email.com" type="email" />
              </div>
            </div>

            {/* Recommandations classe */}
            <div className="flex flex-col">
              <label className={labelCls}>
                Recommandations pour la classe
                <span className="text-gray-400 ml-1">(place assise, pauses, adaptations…)</span>
              </label>
              <textarea {...register("followup_class_recommendations")} className={inputCls}
                rows={2} placeholder="Ex : place devant, pauses toutes les 20 min, éviter les situations de compétition..." />
            </div>

            {/* Notes libres */}
            <div className="flex flex-col">
              <label className={labelCls}>Notes confidentielles</label>
              <textarea {...register("followup_notes")} className={inputCls}
                rows={2} placeholder="Informations complémentaires à l'usage de la direction…" />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}

      {type === "create" && (
        <label className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-amber-500 shrink-0"
          />
          <span className="text-xs text-amber-800 leading-relaxed">
            <strong>Lu et approuvé</strong> — Je confirme que les informations saisies sont exactes et que le dossier d'inscription a été validé.
          </span>
        </label>
      )}

      <button type="submit" disabled={loading || (type === "create" && !confirmed)}
        className="bg-blue-500 text-white p-2.5 rounded-md font-medium disabled:opacity-50 hover:bg-blue-600 transition">
        {loading ? "En cours..." : type === "create" ? "Ajouter l'enfant" : "Mettre à jour"}
      </button>
    </form>
  );
};

export default StudentForm;
