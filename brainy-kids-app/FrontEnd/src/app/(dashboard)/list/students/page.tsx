"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { students as studentsApi } from "@/lib/api";
import { getUser } from "@/lib/useAuth";

const columns = [
  { header: "Info",        accessor: "info" },
  { header: "Classe",      accessor: "classe",      className: "hidden md:table-cell" },
  { header: "Niveau",      accessor: "niveau",      className: "hidden md:table-cell" },
  { header: "Enseignante", accessor: "enseignante", className: "hidden lg:table-cell" },
  { header: "Parent(s)",   accessor: "parents",     className: "hidden lg:table-cell" },
  { header: "Dossier",     accessor: "dossier",     className: "hidden lg:table-cell" },
  { header: "Actions",     accessor: "actions" },
];

const ChecklistBadge = ({ checklist }: { checklist: any }) => {
  if (!checklist) return <span className="text-xs text-gray-400">—</span>;
  const fields = ['photo_identite','extrait_naissance','certificat_medical','fiche_renseignement_signee','vaccinations_a_jour','autorisation_sortie'];
  const done = fields.filter(f => checklist[f]).length;
  const total = fields.length;
  const color = done === total ? 'bg-green-100 text-green-700' : done >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{done}/{total}</span>;
};

const StudentListPage = () => {
  const [data, setData]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const role    = getUser()?.role || "";
  const isAdmin = role === "administrator";
  const LIMIT   = 10;

  const load = useCallback(() => {
    setLoading(true);
    studentsApi.list(page, LIMIT, search, showArchived)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, showArchived]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Archiver ${name} ? L'enfant n'apparaîtra plus dans les listes actives.`)) {
      await studentsApi.archive(id);
      load();
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`Restaurer ${name} ?`)) {
      await studentsApi.restore(id);
      load();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ SUPPRESSION DÉFINITIVE de ${name} ?\nToutes les données seront perdues. Cette action est irréversible.`)) {
      await studentsApi.delete(id);
      load();
    }
  };

  const renderRows = (item: any) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-BKskyLight">
      <td className="flex items-center gap-4 py-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${item.archived ? 'bg-gray-400' : 'bg-BKprimary'}`}>
          {item.full_name?.charAt(0)}
        </div>
        <div className="flex flex-col">
          <h3 className={`font-semibold ${item.archived ? 'text-gray-400 line-through' : ''}`}>{item.full_name}</h3>
          <p className="text-xs text-gray-400">
            {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString("fr-TN") : ""}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.class?.name || "—"}</td>
      <td className="hidden md:table-cell">{item.grade || "—"}</td>
      <td className="hidden lg:table-cell">{item.class?.teacher?.user?.full_name || "—"}</td>
      <td className="hidden lg:table-cell text-xs">
        {item.student_parents?.map((sp: any) => sp.parent?.full_name).join(", ") || "—"}
      </td>
      <td className="hidden lg:table-cell">
        <ChecklistBadge checklist={item.registration_checklist} />
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/students/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-BKskyLight" title="Voir">
              <Image src="/view.png" alt="Voir" width={16} height={16} />
            </button>
          </Link>
          {isAdmin && !item.archived && (
            <>
              <FormModal table="student" type="update" data={item} onRefresh={load} />
              <button
                onClick={() => handleArchive(item.id, item.full_name)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100"
                title="Archiver"
              >
                <Image src="/more.png" alt="Archiver" width={16} height={16} />
              </button>
            </>
          )}
          {isAdmin && item.archived && (
            <button
              onClick={() => handleRestore(item.id, item.full_name)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100"
              title="Restaurer"
            >
              <Image src="/update.png" alt="Restaurer" width={16} height={16} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => handleDelete(item.id, item.full_name)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100"
              title="Supprimer définitivement"
            >
              <Image src="/delete.png" alt="Supprimer" width={16} height={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator", "teacher"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden text-lg font-semibold md:block">
            {showArchived ? "Enfants archivés" : "Tous les enfants"}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch onSearch={setSearch} />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setShowArchived(!showArchived); setPage(1); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${showArchived ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-500'}`}
                >
                  {showArchived ? "← Actifs" : "Archivés"}
                </button>
              )}
              {isAdmin && !showArchived && <FormModal table="student" type="create" onRefresh={load} />}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : (
          <Table columns={columns} renderRows={renderRows} data={data} />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
      </div>
    </AuthGuard>
  );
};

export default StudentListPage;
