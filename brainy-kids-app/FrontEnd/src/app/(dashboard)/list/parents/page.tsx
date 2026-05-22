"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { parents as parentsApi } from "@/lib/api";

const columns = [
  { header: "Info",        accessor: "info" },
  { header: "Les enfants", accessor: "students",  className: "hidden md:table-cell" },
  { header: "Téléphone",   accessor: "phone",     className: "hidden md:table-cell" },
  { header: "Adresse",     accessor: "address",   className: "hidden md:table-cell" },
  { header: "Actions",     accessor: "actions" },
];

const ParentListPage = () => {
  const [data, setData]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const LIMIT = 10;

  const load = useCallback(() => {
    setLoading(true);
    parentsApi.list(page, LIMIT, search)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, showArchived]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Archiver ${name} ?`)) {
      await parentsApi.archive(id);
      load();
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`Restaurer ${name} ?`)) {
      await parentsApi.restore(id);
      load();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ SUPPRESSION DÉFINITIVE de ${name} ?\nCette action est irréversible.`)) {
      await parentsApi.delete(id);
      load();
    }
  };

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-BKskyLight">
      <td className="flex items-center gap-4 py-4 ml-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${item.archived ? 'bg-gray-400' : 'bg-BKyellow'}`}>
          {item.full_name?.charAt(0)}
        </div>
        <div className="flex flex-col">
          <h3 className={`font-semibold ${item.archived ? 'text-gray-400 line-through' : ''}`}>{item.full_name}</h3>
          <p className="text-xs text-gray-400">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-xs">
        {item.student_parents?.map((sp: any) => sp.student?.full_name).join(", ") || "—"}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden md:table-cell text-xs">{item.address}</td>
      <td>
        <div className="flex items-center gap-2">
          {!item.archived && (
            <>
              <FormModal table="parent" type="update" data={item} onRefresh={load} />
              <button
                onClick={() => handleArchive(item.id, item.full_name)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100"
                title="Archiver"
              >
                <Image src="/more.png" alt="Archiver" width={16} height={16} />
              </button>
            </>
          )}
          {item.archived && (
            <button
              onClick={() => handleRestore(item.id, item.full_name)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100"
              title="Restaurer"
            >
              <Image src="/update.png" alt="Restaurer" width={16} height={16} />
            </button>
          )}
          <button
            onClick={() => handleDelete(item.id, item.full_name)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100"
            title="Supprimer définitivement"
          >
            <Image src="/delete.png" alt="Supprimer" width={16} height={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden font-semibold text-lg md:block">
            {showArchived ? "Parents archivés" : "Tous les parents"}
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
              <button
                onClick={() => { setShowArchived(!showArchived); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${showArchived ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-500'}`}
              >
                {showArchived ? "← Actifs" : "Archivés"}
              </button>
              {!showArchived && <FormModal table="parent" type="create" onRefresh={load} />}
            </div>
          </div>
        </div>
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : (
          <Table columns={columns} renderRows={renderRow} data={data} />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
      </div>
    </AuthGuard>
  );
};

export default ParentListPage;
