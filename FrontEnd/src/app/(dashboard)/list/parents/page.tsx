"use client";

import { useEffect, useState, useCallback } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { parents as parentsApi } from "@/lib/api";

const columns = [
  { header: "Info",        accessor: "info" },
  { header: "Enfant(s)",   accessor: "students",  className: "hidden md:table-cell" },
  { header: "Téléphone",   accessor: "phone",     className: "hidden md:table-cell" },
  { header: "Adresse",     accessor: "address",   className: "hidden lg:table-cell" },
  { header: "Compte",      accessor: "compte",    className: "hidden lg:table-cell" },
  { header: "Actions",     accessor: "actions" },
];

// ── Icônes SVG inline ────────────────────────────────────────
const IconArchive = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);
const IconRestore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/>
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconDelete = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const ParentListPage = () => {
  const [data, setData]           = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters]   = useState(false);
  const [sortBy, setSortBy]       = useState("full_name");
  const [sortDir, setSortDir]     = useState<"asc"|"desc">("asc");
  const LIMIT = 10;

  const load = useCallback(() => {
    setLoading(true);
    // Passer showArchived à l'API
    parentsApi.list(page, LIMIT, search, showArchived)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, showArchived]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Archiver ${name} ?\nLe compte parent sera désactivé.`)) {
      await parentsApi.archive(id);
      load();
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`Restaurer ${name} ?\nLe compte parent sera réactivé.`)) {
      await parentsApi.restore(id);
      load();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ SUPPRESSION DÉFINITIVE de ${name}\nCette action est irréversible.`)) {
      await parentsApi.delete(id);
      load();
    }
  };

  // Tri local
  const sortedData = [...data].sort((a, b) => {
    let va = a[sortBy] || "";
    let vb = b[sortBy] || "";
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-BKskyLight">
      <td className="flex items-center gap-3 py-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${item.archived ? 'bg-gray-400' : 'bg-BKyellow'}`}>
          {item.full_name?.charAt(0)}
        </div>
        <div className="flex flex-col">
          <h3 className={`font-semibold ${item.archived ? 'text-gray-400 line-through' : ''}`}>{item.full_name}</h3>
          <p className="text-xs text-gray-400">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell text-xs text-gray-600">
        {item.student_parents?.map((sp: any) => sp.student?.full_name).join(", ") || "—"}
      </td>
      <td className="hidden md:table-cell">{item.phone}</td>
      <td className="hidden lg:table-cell text-xs text-gray-500">{item.address || "—"}</td>
      <td className="hidden lg:table-cell">
        {item.archived ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">🔒 Désactivé</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Actif</span>
        )}
      </td>
      <td>
        <div className="flex items-center gap-1.5">
          {!item.archived && (
            <>
              <FormModal table="parent" type="update" data={item} onRefresh={load} hint="Modifier" />
              <button onClick={() => handleArchive(item.id, item.full_name)}
                title="Archiver (désactive le compte)"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition">
                <IconArchive />
              </button>
            </>
          )}
          {item.archived && (
            <button onClick={() => handleRestore(item.id, item.full_name)}
              title="Restaurer (réactive le compte)"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition">
              <IconRestore />
            </button>
          )}
          <button onClick={() => handleDelete(item.id, item.full_name)}
            title="Supprimer définitivement"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition">
            <IconDelete />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="hidden font-semibold text-lg md:block">
            {showArchived ? "Parents archivés" : "Tous les parents"}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <TableSearch onSearch={setSearch} />
            <div className="flex items-center gap-2 self-end">
              {/* Filtre (placeholder visuel — pas de filtres parents pour l'instant) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                title="Filtrer"
                className={`w-8 h-8 flex items-center justify-center rounded-full transition ${showFilters ? 'bg-blue-500 text-white' : 'bg-BKyellow text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </button>

              {/* Tri */}
              <div className="relative group">
                <button title="Trier"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow text-gray-700 hover:bg-yellow-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
                <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 hidden group-hover:block w-40">
                  {[
                    { label: "Nom A→Z", by: "full_name", dir: "asc" },
                    { label: "Nom Z→A", by: "full_name", dir: "desc" },
                  ].map(opt => (
                    <button key={`${opt.by}-${opt.dir}`}
                      onClick={() => { setSortBy(opt.by); setSortDir(opt.dir as "asc"|"desc"); }}
                      className={`w-full text-left text-xs px-3 py-2 rounded hover:bg-gray-50 ${sortBy === opt.by && sortDir === opt.dir ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-600'}`}>
                      {sortBy === opt.by && sortDir === opt.dir ? '✓ ' : ''}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Archivés / Actifs */}
              <button
                onClick={() => { setShowArchived(!showArchived); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${showArchived ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
              >
                {showArchived ? "← Actifs" : "📦 Archivés"}
              </button>
              {!showArchived && <FormModal table="parent" type="create" onRefresh={load} />}
            </div>
          </div>
        </div>

        {/* Panneau filtre (simple pour parents) */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-xs text-gray-500">
            Recherche par nom disponible via la barre de recherche ci-dessus.
          </div>
        )}

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : sortedData.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">
            {showArchived ? "Aucun parent archivé" : "Aucun parent trouvé"}
          </p>
        ) : (
          <Table columns={columns} renderRows={renderRow} data={sortedData} />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
      </div>
    </AuthGuard>
  );
};

export default ParentListPage;
