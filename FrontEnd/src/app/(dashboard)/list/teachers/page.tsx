"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { teachers as teachersApi } from "@/lib/api";
import { getUser } from "@/lib/useAuth";
// Les rémunérations sont gérées dans la page /list/depenses

// ── Fonctions ─────────────────────────────────────────────────
const FONCTION_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  enseignante:      { label: "Enseignante",       icon: "👩‍🏫", bg: "bg-blue-50",   text: "text-blue-700"  },
  femme_de_service: { label: "Femme de service",  icon: "🧹", bg: "bg-purple-50", text: "text-purple-700" },
  autre:            { label: "Autre",              icon: "👤", bg: "bg-gray-50",   text: "text-gray-600"   },
};

// ── SVG icons ─────────────────────────────────────────────────
const IconView = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
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

// ── Colonnes ──────────────────────────────────────────────────
const columns = [
  { header: "Nom",           accessor: "info" },
  { header: "Fonction",      accessor: "fonction",       className: "hidden md:table-cell" },
  { header: "Qualification", accessor: "qualification",  className: "hidden lg:table-cell" },
  { header: "Classe(s)",     accessor: "classes",        className: "hidden lg:table-cell" },
  { header: "Salaire/mois",  accessor: "salary",         className: "hidden md:table-cell" },
  { header: "Recrutement",   accessor: "hire_date",      className: "hidden xl:table-cell" },
  { header: "Actions",       accessor: "actions" },
];

// ── Page ─────────────────────────────────────────────────────
const PersonnelListPage = () => {
  const [data, setData]         = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<"" | "enseignante" | "femme_de_service" | "autre">("");
  const isAdmin = getUser()?.role === "administrator";
  const LIMIT = 10;

  const load = useCallback(() => {
    setLoading(true);
    teachersApi.list(page, LIMIT, search, activeTab)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer ${name} ?`)) {
      await teachersApi.delete(id);
      load();
    }
  };

  const renderRows = (item: any) => {
    const displayName = item.user?.full_name || item.full_name || "—";
    const meta = FONCTION_META[item.fonction] || FONCTION_META.autre;
    const isTeacher = item.fonction === "enseignante";

    return (
      <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-blue-50">
        {/* Nom */}
        <td className="flex items-center gap-3 py-4">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            isTeacher ? "bg-BKprimary" : "bg-purple-400"
          }`}>
            {displayName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold leading-tight">{displayName}</h3>
            <p className="text-xs text-gray-400">{item.user?.email || item.user?.phone || ""}</p>
          </div>
        </td>

        {/* Fonction */}
        <td className="hidden md:table-cell">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.bg} ${meta.text}`}>
            {meta.icon} {meta.label}
          </span>
        </td>

        {/* Qualification */}
        <td className="hidden lg:table-cell text-xs text-gray-500">{item.qualification || "—"}</td>

        {/* Classes (enseignantes uniquement) */}
        <td className="hidden lg:table-cell text-xs text-gray-600">
          {isTeacher ? (item.classes?.map((c: any) => c.name).join(", ") || "—") : "—"}
        </td>

        {/* Salaire mensuel */}
        <td className="hidden md:table-cell">
          {item.monthly_salary ? (
            <span className="text-sm font-medium text-green-700">
              {Number(item.monthly_salary).toLocaleString("fr-TN")} DT
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>

        {/* Date recrutement */}
        <td className="hidden xl:table-cell text-xs text-gray-500">
          {item.hire_date ? new Date(item.hire_date).toLocaleDateString("fr-TN") : "—"}
        </td>

        {/* Actions */}
        <td>
          <div className="flex items-center gap-1.5">
            {isTeacher && (
              <Link href={`/list/teachers/${item.id}`}>
                <button title="Voir le profil"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition">
                  <IconView />
                </button>
              </Link>
            )}
            {isAdmin && (
              <>
                <FormModal table="teacher" type="update" data={item} onRefresh={load} />
                <button
                  onClick={() => handleDelete(item.id, displayName)}
                  title="Supprimer définitivement"
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                >
                  <IconDelete />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const TAB_ITEMS: { key: "" | "enseignante" | "femme_de_service" | "autre"; label: string; icon: string }[] = [
    { key: "",               label: "Tout le personnel",  icon: "👥" },
    { key: "enseignante",    label: "Enseignantes",        icon: "👩‍🏫" },
    { key: "femme_de_service", label: "Service",          icon: "🧹" },
    { key: "autre",          label: "Autre",               icon: "👤" },
  ];

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="hidden md:block text-lg font-semibold">Personnel</h1>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <TableSearch onSearch={v => { setSearch(v); setPage(1); }} />
            <div className="flex items-center gap-2 self-end">
              <button title="Filtrer"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow text-gray-700 hover:bg-yellow-300 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
              </button>
              {isAdmin && <FormModal table="teacher" type="create" onRefresh={load} />}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
          {TAB_ITEMS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : data.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">Aucun membre du personnel trouvé</p>
        ) : (
          <Table columns={columns} renderRows={renderRows} data={data} />
        )}
        <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
      </div>

    </AuthGuard>
  );
};

export default PersonnelListPage;
