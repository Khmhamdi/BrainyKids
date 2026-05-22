"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { classes as classesApi } from "@/lib/api";

const columns = [
  { header: "Nom de la classe", accessor: "name" },
  { header: "Groupe d'âge", accessor: "age_group", className: "hidden md:table-cell" },
  { header: "Salle", accessor: "room", className: "hidden md:table-cell" },
  { header: "Enseignante", accessor: "teacher", className: "hidden md:table-cell" },
  { header: "Nb élèves", accessor: "students", className: "hidden lg:table-cell" },
  { header: "Actions", accessor: "actions" },
];

const ClasseListPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    classesApi.list()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b color-gray-200 even:bg-slate-200 text-sm hover:bg-blue-200">
      <td className="flex items-center ml-4 gap-4 py-4">
        <h3 className="font-semibold">{item.name}</h3>
      </td>
      <td className="hidden md:table-cell">{item.age_group}</td>
      <td className="hidden md:table-cell">{item.room_number}</td>
      <td className="hidden md:table-cell">{item.teacher?.user?.full_name || "—"}</td>
      <td className="hidden lg:table-cell">{item.students?.length || 0}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormModal table="classe" type="update" data={item} />
          <FormModal table="classe" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between">
          <h1 className="hidden font-semibold text-lg md:block">Toutes les classes</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch />
            <div className="flex items-center gap-4 self-end">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/filter.png" alt="" width={14} height={14} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
                <Image src="/sort.png" alt="" width={14} height={14} />
              </button>
              <FormModal table="classe" type="create" />
            </div>
          </div>
        </div>
        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : (
          <Table columns={columns} renderRows={renderRow} data={data} />
        )}
        <Pagination page={1} totalPages={1} onPageChange={() => {}} />
      </div>
    </AuthGuard>
  );
};

export default ClasseListPage;
