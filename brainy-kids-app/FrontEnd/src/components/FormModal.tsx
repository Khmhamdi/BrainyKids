"use client";
import { useState } from "react";
import Image from "next/image";
import TeacherForm from "./forms/TeacherForm";
import StudentForm from "./forms/StudentForm";
import ParentForm from "./forms/ParentForm";
import { students as studentsApi, teachers as teachersApi } from "@/lib/api";

const FormModal = ({
  table,
  type,
  data,
  id,
  onRefresh,
}: {
  table: "teacher" | "student" | "parent" | "matiere" | "classe" | "lesson" | "examen" | "tache" | "resultat" | "evenement" | "annonce";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
  onRefresh?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const size    = type === "create" ? "w-8 h-8" : "w-7 h-7";
  const bgColor = type === "create" ? "bg-BKyellow" : type === "update" ? "bg-green-500" : "bg-red-500";

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
            <span className="font-bold text-red-600">{data?.full_name || data?.user?.full_name || "cet élément"}</span> ?
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
      return <TeacherForm type={type} data={data} />;
    }

    if (table === "parent") {
      return <ParentForm type={type} data={data} onSuccess={handleSuccess} />;
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
        className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
        onClick={() => setOpen(true)}
      >
        <Image src={`/${type}.png`} alt="" width={16} height={16} />
      </button>

      {open && (
        <div className="w-screen h-screen fixed left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto">
            <FormContent />
            <button
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="Fermer" width={14} height={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
