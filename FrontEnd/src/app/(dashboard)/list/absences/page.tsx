"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { absences as absencesApi, classes as classesApi, teachers as teachersApi } from "@/lib/api";
import { getUser } from "@/lib/useAuth";

const MOTIFS = ["Maladie", "Raison familiale", "Voyage", "Rendez-vous médical", "Intempéries", "Autre"];

type AttendanceRow = {
  id: string;
  full_name: string;
  absence: {
    id: string;
    reason: string;
    excused: boolean;
    medical_certificate: boolean;
    apt_to_return: boolean;
    notes?: string;
    recorded_by?: string;
  } | null;
};

type LocalAbsence = { reason: string; notes: string };
type Tab = "appel" | "historique";

// ── Feuille d'appel ──────────────────────────────────────────
function FeuilleAppel({
  classesList,
  teacherClasses,
  defaultClassId,
  userId,
  isAdmin,
  onSaved,
}: {
  classesList: any[];
  teacherClasses: any[];
  defaultClassId: string;
  userId: string;
  isAdmin: boolean;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedClass, setSelectedClass] = useState(defaultClassId);
  const [selectedDate, setSelectedDate] = useState(today);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [absents, setAbsents] = useState<Map<string, LocalAbsence>>(new Map());

  // Sync selectedClass quand defaultClassId arrive en asynchrone
  useEffect(() => {
    if (defaultClassId && !selectedClass) {
      setSelectedClass(defaultClassId);
    }
  }, [defaultClassId]);

  // Si enseignante : uniquement ses classes ; si directrice : toutes les classes
  const availableClasses = teacherClasses.length > 0 ? teacherClasses : classesList;

  const loadAppel = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError("");
    setAbsents(new Map());
    try {
      const data: AttendanceRow[] = await absencesApi.byClassAndDate(selectedClass, selectedDate);
      setRows(data);
    } catch {
      setError("Impossible de charger les élèves");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => { loadAppel(); }, [loadAppel]);

  const toggleAbsent = (studentId: string) => {
    setAbsents(prev => {
      const next = new Map(prev);
      if (next.has(studentId)) next.delete(studentId);
      // Admin choisit le motif, enseignante marque juste l'absence (motif à renseigner par la directrice)
      else next.set(studentId, { reason: isAdmin ? "Maladie" : "Non spécifié", notes: "" });
      return next;
    });
  };

  const setReason = (studentId: string, reason: string) => {
    setAbsents(prev => {
      const next = new Map(prev);
      const cur = next.get(studentId);
      if (cur) next.set(studentId, { ...cur, reason });
      return next;
    });
  };

  const setNotes = (studentId: string, notes: string) => {
    setAbsents(prev => {
      const next = new Map(prev);
      const cur = next.get(studentId);
      if (cur) next.set(studentId, { ...cur, notes });
      return next;
    });
  };

  const handleValider = async () => {
    if (absents.size === 0) return;
    if (!selectedClass) { setError("Aucune classe sélectionnée"); return; }
    setSaving(true);
    setError("");
    const count = absents.size;
    try {
      const promises = Array.from(absents.entries()).map(([studentId, local]) =>
        absencesApi.create({
          student_id: studentId,
          date: selectedDate,
          reason: local.reason || "Non spécifié",
          excused: false,
          medical_certificate: false,
          apt_to_return: false,
          notes: local.notes || null,
          recorded_by: userId || null,
        })
      );
      await Promise.all(promises);
      setSuccess(`${count} absence(s) enregistrée(s)`);
      setTimeout(() => setSuccess(""), 5000);
      onSaved();
      await loadAppel();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const newAbsentsCount = absents.size;
  const alreadyAbsentCount = rows.filter(r => r.absence !== null).length;
  const presentCount = rows.filter(r => r.absence === null && !absents.has(r.id)).length;
  const selectedClassName = availableClasses.find(c => c.id === selectedClass)?.name || "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Classe</p>
          {teacherClasses.length === 1 ? (
            // Enseignante avec une seule classe : affichage fixe
            <div className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-700">
              {teacherClasses[0].name}
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">— Sélectionner —</option>
              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
          />
        </div>
        {selectedClass && (
          <div className="flex gap-2 ml-auto text-xs">
            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              {presentCount} présents
            </span>
            {(alreadyAbsentCount + newAbsentsCount) > 0 && (
              <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                {alreadyAbsentCount + newAbsentsCount} absents
              </span>
            )}
          </div>
        )}
      </div>

      {!selectedClass ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Sélectionnez une classe pour commencer l&apos;appel
        </p>
      ) : loading ? (
        <p className="text-center py-10 text-gray-400 text-sm">Chargement...</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">Aucun élève dans cette classe</p>
      ) : (
        <>
          <div className="text-sm font-semibold text-gray-700 mb-3">
            Appel — {selectedClassName} —{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-TN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </div>

          <div className="divide-y divide-gray-100">
            {rows.map(row => {
              const alreadyAbsent = row.absence !== null;
              const isLocalAbsent = absents.has(row.id);
              const localData = absents.get(row.id);
              const isMaladie = alreadyAbsent
                ? row.absence!.reason === "Maladie"
                : localData?.reason === "Maladie";

              return (
                <div
                  key={row.id}
                  className={`flex flex-wrap items-start gap-3 py-3 ${alreadyAbsent ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2 min-w-[200px] flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {row.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{row.full_name}</span>
                    {alreadyAbsent && (
                      <span className="text-xs text-gray-400 ml-1">(déjà enregistré)</span>
                    )}
                  </div>

                  {alreadyAbsent ? (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        row.absence!.reason === "Maladie"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        Absent — {row.absence!.reason}
                      </span>
                      {row.absence!.reason === "Maladie" && !row.absence!.medical_certificate && (
                        <span className="text-xs text-orange-500 ml-1">⚠️ certificat attendu</span>
                      )}
                      {row.absence!.reason === "Maladie" && row.absence!.apt_to_return && (
                        <span className="text-xs text-green-600 ml-1">✅ apte</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => toggleAbsent(row.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          isLocalAbsent
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {isLocalAbsent ? "✕ Absent" : "Présent"}
                      </button>

                      {/* Motif + notes : directrice uniquement */}
                      {isLocalAbsent && isAdmin && (
                        <>
                          <select
                            value={localData?.reason || "Maladie"}
                            onChange={e => setReason(row.id, e.target.value)}
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none"
                            onClick={e => e.stopPropagation()}
                          >
                            {MOTIFS.map(m => <option key={m}>{m}</option>)}
                          </select>
                          {isMaladie && (
                            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded">
                              ⚠️ Certificat médical requis
                            </span>
                          )}
                          <input
                            type="text"
                            placeholder="Note (optionnel)"
                            value={localData?.notes || ""}
                            onChange={e => setNotes(row.id, e.target.value)}
                            className="border border-gray-200 rounded-md px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            onClick={e => e.stopPropagation()}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleValider}
              disabled={saving || newAbsentsCount === 0}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition"
            >
              {saving
                ? "Enregistrement..."
                : newAbsentsCount === 0
                  ? "Aucune nouvelle absence"
                  : `Valider l'appel — ${newAbsentsCount} absent(s)`}
            </button>
            {success && (
              <span className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                ✅ {success}
              </span>
            )}
            {error && (
              <span className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                {error}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Historique absences ───────────────────────────────────────
function Historique({
  classesList,
  teacherClasses,
  absencesList,
  loading,
  isAdmin,
  onDelete,
  onUpdate,
}: {
  classesList: any[];
  teacherClasses: any[];
  absencesList: any[];
  loading: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}) {
  const [filterClass, setFilterClass] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ reason: string; excused: boolean; notes: string }>({
    reason: "", excused: false, notes: "",
  });

  useEffect(() => {
    if (teacherClasses.length > 0 && filterClass === "") {
      setFilterClass(teacherClasses[0].id);
    }
  }, [teacherClasses]);

  const teacherClassIds = teacherClasses.map(c => c.id);
  const scopedList = teacherClassIds.length > 0
    ? absencesList.filter((a: any) => teacherClassIds.includes(a.student?.class_id))
    : absencesList;

  const filtered = filterClass
    ? scopedList.filter((a: any) => a.student?.class_id === filterClass)
    : scopedList;

  const availableClasses = teacherClasses.length > 0 ? teacherClasses : classesList;

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setEditData({ reason: a.reason || "", excused: a.excused || false, notes: a.notes || "" });
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id: string) => {
    setUpdatingId(id);
    try {
      await onUpdate(id, {
        reason: editData.reason || "Non spécifié",
        excused: editData.excused,
        notes: editData.notes || null,
      });
      setEditingId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCertificat = async (absence: any) => {
    setUpdatingId(absence.id);
    try { await onUpdate(absence.id, { medical_certificate: true }); }
    finally { setUpdatingId(null); }
  };

  const handleApte = async (absence: any) => {
    setUpdatingId(absence.id);
    try { await onUpdate(absence.id, { apt_to_return: true, excused: true }); }
    finally { setUpdatingId(null); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">
          Absences enregistrées
          <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {filtered.length}
          </span>
        </h2>

        {teacherClasses.length === 1 ? (
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
            {teacherClasses[0].name}
          </span>
        ) : (
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none"
          >
            {teacherClassIds.length === 0 && (
              <option value="">Toutes les classes</option>
            )}
            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-400 text-sm">Aucune absence enregistrée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 font-medium pr-3">Enfant</th>
                <th className="py-2 font-medium pr-3">Classe</th>
                <th className="py-2 font-medium pr-3">Date</th>
                <th className="py-2 font-medium pr-3">Motif</th>
                <th className="py-2 font-medium pr-3">Statut</th>
                <th className="py-2 font-medium pr-3">Protocole retour</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => {
                const isEditing = editingId === a.id;
                const isUpdating = updatingId === a.id;
                const isMaladie = isEditing ? editData.reason === "Maladie" : a.reason === "Maladie";

                if (isEditing) {
                  return (
                    <tr key={a.id} className="border-b bg-blue-50">
                      <td className="py-2.5 pr-3 font-medium">{a.student?.full_name || "—"}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">{a.student?.class?.name || "—"}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600">
                        {new Date(a.date).toLocaleDateString("fr-TN")}
                      </td>
                      {/* Motif éditable */}
                      <td className="py-2 pr-3">
                        <select
                          value={editData.reason}
                          onChange={e => setEditData(d => ({ ...d, reason: e.target.value }))}
                          className="border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        >
                          {MOTIFS.map(m => <option key={m}>{m}</option>)}
                          {!MOTIFS.includes(editData.reason) && editData.reason && (
                            <option value={editData.reason}>{editData.reason}</option>
                          )}
                        </select>
                      </td>
                      {/* Justifiée éditable */}
                      <td className="py-2 pr-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editData.excused}
                            onChange={e => setEditData(d => ({ ...d, excused: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-blue-600"
                          />
                          <span className={`text-xs font-medium ${editData.excused ? "text-green-600" : "text-gray-500"}`}>
                            {editData.excused ? "Justifiée" : "Non justifiée"}
                          </span>
                        </label>
                      </td>
                      {/* Protocole retour : inchangé en mode édition */}
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          placeholder="Note (optionnel)"
                          value={editData.notes}
                          onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        />
                        {isMaladie && (
                          <span className="block text-xs text-orange-500 mt-0.5">⚠️ Certificat médical</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(a.id)}
                            disabled={isUpdating}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition disabled:opacity-50"
                          >
                            {isUpdating ? "..." : "✓ Enregistrer"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition"
                          >
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium">{a.student?.full_name || "—"}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500">{a.student?.class?.name || "—"}</td>
                    <td className="py-2.5 pr-3 text-xs text-gray-600">
                      {new Date(a.date).toLocaleDateString("fr-TN")}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.reason === "Maladie" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {a.reason === "Maladie" ? "🏥 " : ""}{a.reason}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        a.excused ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {a.excused ? "✓ Justifiée" : "✗ Non justifiée"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      {a.reason === "Maladie" ? (
                        a.apt_to_return ? (
                          <span className="text-xs text-green-600 font-medium">✅ Apte au retour</span>
                        ) : a.medical_certificate ? (
                          isAdmin ? (
                            <button
                              onClick={() => handleApte(a)}
                              disabled={isUpdating}
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-md transition disabled:opacity-50"
                            >
                              {isUpdating ? "..." : "✅ Marquer apte"}
                            </button>
                          ) : (
                            <span className="text-xs text-green-600">✓ Certif. reçu</span>
                          )
                        ) : (
                          isAdmin ? (
                            <button
                              onClick={() => handleCertificat(a)}
                              disabled={isUpdating}
                              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded-md transition disabled:opacity-50"
                            >
                              {isUpdating ? "..." : "📄 Certificat reçu"}
                            </button>
                          ) : (
                            <span className="text-xs text-orange-500">⏳ Certif. attendu</span>
                          )
                        )
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => startEdit(a)}
                            className="text-xs text-blue-400 hover:text-blue-600"
                            title="Modifier"
                          >
                            ✎
                          </button>
                        )}
                        {(isAdmin || !a.excused) && (
                          <button
                            onClick={() => onDelete(a.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────
export default function AbsencesPage() {
  const user    = getUser();
  const isAdmin = user?.role === "administrator";
  const [tab, setTab] = useState<Tab>("appel");
  const [classesList, setClassesList] = useState<any[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [defaultClassId, setDefaultClassId] = useState("");
  const [absencesList, setAbsencesList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    classesApi.list().then(setClassesList).catch(() => {});
    loadAbsences();

    if (user?.role === "teacher") {
      teachersApi.myProfile()
        .then(t => {
          const classes = t?.classes || [];
          setTeacherClasses(classes);
          if (classes.length > 0) setDefaultClassId(classes[0].id);
        })
        .catch(() => {});
    }
  }, []);

  const loadAbsences = () => {
    setLoadingList(true);
    absencesApi.list(1)
      .then(res => setAbsencesList(res.data || res || []))
      .catch(() => setAbsencesList([]))
      .finally(() => setLoadingList(false));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette absence ?")) return;
    await absencesApi.delete(id);
    loadAbsences();
  };

  const handleUpdate = async (id: string, data: any) => {
    await absencesApi.update(id, data);
    loadAbsences();
  };

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition ${
      tab === t
        ? "bg-blue-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <AuthGuard allowedRoles={["administrator", "teacher"]}>
      <div className="flex flex-col gap-4 m-4">
        <div className="flex gap-2">
          <button className={tabCls("appel")} onClick={() => setTab("appel")}>
            Feuille d&apos;appel
          </button>
          <button className={tabCls("historique")} onClick={() => setTab("historique")}>
            Historique
            {absencesList.length > 0 && (
              <span className="ml-2 bg-white bg-opacity-30 text-xs px-1.5 rounded-full">
                {absencesList.length}
              </span>
            )}
          </button>
        </div>

        {tab === "appel" ? (
          <FeuilleAppel
            classesList={classesList}
            teacherClasses={teacherClasses}
            defaultClassId={defaultClassId}
            userId={user?.id || ""}
            isAdmin={isAdmin}
            onSaved={loadAbsences}
          />
        ) : (
          <Historique
            classesList={classesList}
            teacherClasses={teacherClasses}
            absencesList={absencesList}
            loading={loadingList}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </AuthGuard>
  );
}