"use client";
import { useState } from "react";
import TeacherForm from "./forms/TeacherForm";
import StudentForm from "./forms/StudentForm";
import ParentForm from "./forms/ParentForm";
import ClasseForm from "./forms/ClasseForm";
import { students as studentsApi, teachers as teachersApi, classes as classesApi } from "@/lib/api";

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const FormModal = ({
  table,
  type,
  data,
  id,
  onRefresh,
  hint,
}: {
  table: "teacher" | "student" | "parent" | "matiere" | "classe" | "lesson" | "examen" | "tache" | "resultat" | "evenement" | "annonce";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  onRefresh?: () => void;
  hint?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const btnClass =
    type === "create" ? "bg-BKyellow text-gray-700 hover:bg-yellow-300" :
    type === "update" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                        "bg-red-100 text-red-600 hover:bg-red-200";
  const tooltip = hint || (type === "create" ? "Ajouter" : type === "update" ? "Modifier" : "Supprimer");
  const TriggerIcon = type === "create" ? IconPlus : type === "update" ? IconEdit : IconTrash;

  const handleSuccess = () => {
    setOpen(false);
    onRefresh?.();
  };

  const handleDelete = async () => {
    const targetId = id ?? data?.id;
    if (!targetId) return;
    setDeleting(true);
    try {
      if (table === "student") await studentsApi.delete(targetId);
      else if (table === "teacher") await teachersApi.delete(targetId);
      else if (table === "classe") await classesApi.delete(targetId);
      handleSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const FormContent = () => {
    if (type === "delete") {
      return (
        <div className="p-4 flex flex-col gap-6">
          <p className="text-center font-medium text-gray-700">
            La suppression est irréversible. Voulez-vous vraiment supprimer{" "}
            <span className="font-bold text-red-600">{data?.full_name || data?.user?.full_name || data?.name || "cet élément"}</span> ?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-50"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </div>
      );
    }

    if (table === "student") {
      return <StudentForm type={type} data={data} onSuccess={handleSuccess} />;
    }

    if (table === "teacher") {
      return <TeacherForm type={type} data={data} onSuccess={handleSuccess} />;
    }

    if (table === "parent") {
      return <ParentForm type={type} data={data} onSuccess={handleSuccess} />;
    }

    if (table === "classe") {
      return <ClasseForm type={type} data={data} onSuccess={handleSuccess} />;
    }

    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Formulaire "{table}" à implémenter
      </div>
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full ${btnClass} transition`}
        onClick={() => setOpen(true)}
        title={tooltip}
      >
        <TriggerIcon />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className={`bg-white p-6 rounded-md relative max-h-[90vh] overflow-y-auto ${table === "student" ? "w-[95%] md:w-[85%] lg:w-[75%] xl:w-[65%] 2xl:w-[55%]" : "w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]"}`}>
            <FormContent />
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setOpen(false)}
              title="Fermer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
