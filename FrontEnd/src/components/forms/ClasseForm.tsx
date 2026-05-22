"use client";
import { useState, useEffect } from "react";
import { classes as classesApi, teachers as teachersApi, settings as settingsApi } from "@/lib/api";

const AGE_GROUPS_FALLBACK = ["3 ans", "4 ans", "5 ans"];

const ClasseForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const isCreate = type === "create";
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [ageGroups, setAgeGroups]     = useState<string[]>(AGE_GROUPS_FALLBACK);

  const [name, setName]           = useState(data?.name || "");
  const [ageGroup, setAgeGroup]   = useState(data?.age_group || "");
  const [roomNumber, setRoomNumber] = useState(data?.room_number || "");
  const [teacherId, setTeacherId] = useState(data?.teacher?.id || data?.teacher_id || "");

  useEffect(() => {
    teachersApi.list(1, 100, "", "enseignante")
      .then(res => setTeachersList(res.data || []))
      .catch(console.error);
    settingsApi.getLookups("age_group", true)
      .then(list => { if (list.length) setAgeGroups(list.map((l: any) => l.code)); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Le nom de la classe est obligatoire"); return; }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        age_group: ageGroup || null,
        room_number: roomNumber || null,
        teacher_id: teacherId || null,
      };
      if (isCreate) {
        await classesApi.create(payload);
      } else {
        await classesApi.update(data.id, payload);
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
        {isCreate ? "Créer une classe" : "Modifier la classe"}
      </h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded">{error}</p>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">Nom de la classe *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Ex: Maternelle A"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">Groupe d'âge</label>
          <select
            value={ageGroup}
            onChange={e => setAgeGroup(e.target.value)}
            className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">-- Sélectionner --</option>
            {ageGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">Numéro / nom de salle</label>
          <input
            value={roomNumber}
            onChange={e => setRoomNumber(e.target.value)}
            className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="Ex: Salle 3"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-600">Enseignante</label>
          <select
            value={teacherId}
            onChange={e => setTeacherId(e.target.value)}
            className="border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">-- Aucune --</option>
            {teachersList.map(t => (
              <option key={t.id} value={t.id}>{t.user?.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm disabled:opacity-50 transition-colors"
      >
        {saving ? "Enregistrement..." : isCreate ? "Créer" : "Mettre à jour"}
      </button>
    </form>
  );
};

export default ClasseForm;
