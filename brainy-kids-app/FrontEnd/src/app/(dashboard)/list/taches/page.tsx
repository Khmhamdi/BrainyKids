import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { tachesData, role } from "@/lib/data";
import Image from "next/image";

const columns = [
  { header: "Examen", accessor: "subject" },
  {
    header: "Classe",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Enseignant",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  { header: "Actions", accessor: "actions" },
];

type Tache = {
  id: number;
  subject: string;
  class: string;
  teacher: string;
  dueDate: string;
};

const MissionListPage = () => {
  const renderRow = (item: Tache) => (
    <tr
      key={item.id}
      className="border-b color-gray-200 even:bg-slate-200 text-sm hover:bg-blue-200"
    >
      <td className="flex items-center ml-4 gap-4 py-4">
        <h3 className="font-semibold">{item.subject}</h3>
      </td>
      <td className="hidden md:table-cell">{item.class}</td>
      <td className="hidden md:table-cell">{item.teacher}</td>
      <td className="hidden md:table-cell">{item.dueDate}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
            <FormModal table="tache" type="update" data={item}/>
            <FormModal table="tache" type="delete" id={item.id}/>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden font-semibold text-lg md:block">
          Toutes les tâches
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && (
              <FormModal table="tache" type="create"/>
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRows={renderRow} data={tachesData} />
      <Pagination />
    </div>
  );
};

export default MissionListPage;
