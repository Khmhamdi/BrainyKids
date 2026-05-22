"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { teachers as teachersApi } from "@/lib/api";
import { getUser } from "@/lib/useAuth";

const columns = [
  { header: "Info", accessor: "info" },
  { header: "Email", accessor: "email", className: "hidden md:table-cell" },
  { header: "Qualification", accessor: "qualification", className: "hidden md:table-cell" },
  { header: "Classes", accessor: "classes", className: "hidden md:table-cell" },
  { header: "Téléphone", accessor: "telephone", className: "hidden lg:table-cell" },
  { header: "Recrutement", accessor: "hire_date", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const TeacherListPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const role = getUser()?.role || "";
  const isAdmin = role === "administrator";
  const LIMIT = 10;

  const load = useCallback(() => {
    setLoading(true);
    teachersApi.list(page, LIMIT, search)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer ${name} ?`)) {
      await teachersApi.delete(id);
      load();
    }
  };

  const renderRows = (item: any) => (
    <tr key={item.id} className="border-b color-gray-200 even:bg-slate-200 text-sm hover:bg-blue-200">
      <td className="flex items-center gap-4 py-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.user?.full_name}</h3>
          <p className="text-xs text-gray-500">{item.user?.phone || ""}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.user?.email}</td>
      <td className="hidden md:table-cell">{item.qualification}</td>
      <td className="hidden md:table-cell">{item.classes?.map((c: any) => c.name).join(", ") || "—"}</td>
      <td className="hidden lg:table-cell">{item.user?.phone || "—"}</td>
      <td className="hidden lg:table-cell">
        {item.hire_date ? new Date(item.hire_date).toLocaleDateString("fr-TN") : "—"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/teachers/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-BKprimary">
              <Image src="/view.png" alt="Voir" width={16} height={16} />
            </button>
          </Link>
          {isAdmin && (
            <>
              <FormModal table="teacher" type="update" data={item} />
              <button
                onClick={() => handleDelete(item.id, item.user?.full_name)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100"
              >
                <Image src="/delete.png" alt="Supprimer" width={16} height={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden md:block text-lg font-semibold">Toutes les enseignantes</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch onSearch={setSearch} />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              <FormModal table="teacher" type="create" />
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

export default TeacherListPage;
