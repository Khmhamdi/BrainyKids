import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { subjectsData, role } from "@/lib/data";
import Image from "next/image";

const columns = [
  { header: "Matière", accessor: "name" },
  {
    header: "Les enseignats",
    accessor: "teachers",
    className: "hidden md:table-cell",
  },
  { header: "Actions", accessor: "actions" },
];

type Subject = {
  id: number;
  name: string;
  teachers: string[];
};

const SubjectListPage = () => {
  const renderRow = (item: Subject) => (
    <tr
      key={item.id}
      className="border-b color-gray-200 even:bg-slate-200 text-sm hover:bg-blue-200"
    >
      <td className="flex items-center ml-4 gap-4 py-4">
        <h3 className="font-semibold">{item.name}</h3>
      </td>
      <td className="hidden md:table-cell">{item.teachers.join(", ")}</td>
      <td>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <>
            <FormModal table="matiere" type="update" data={item}/>
            <FormModal table="matiere" type="delete" id={item.id}/>
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
          Toutes les matières
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
              <FormModal table="matiere" type="create"/>
            )}
          </div>
        </div>
      </div>
      <Table columns={columns} renderRows={renderRow} data={subjectsData} />
      <Pagination />
    </div>
  );
};

export default SubjectListPage;
