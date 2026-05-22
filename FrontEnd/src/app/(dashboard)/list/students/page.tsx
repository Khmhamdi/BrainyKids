"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AuthGuard from "@/components/AuthGuard";
import { students as studentsApi, classes as classesApi, teachers as teachersApi } from "@/lib/api";
import { getUser } from "@/lib/useAuth";

// ── Colonnes ──────────────────────────────────────────────────
const columnsAdmin = [
  { header: "Info",         accessor: "info" },
  { header: "Genre",        accessor: "genre",       className: "hidden md:table-cell" },
  { header: "Classe / Niv", accessor: "classe",      className: "hidden md:table-cell" },
  { header: "Régime",       accessor: "regime",      className: "hidden lg:table-cell" },
  { header: "Dossier",      accessor: "dossier",     className: "hidden lg:table-cell" },
  { header: "Paiements",    accessor: "paiements",   className: "hidden lg:table-cell" },
  { header: "Enseignante",  accessor: "enseignante", className: "hidden xl:table-cell" },
  { header: "Tél. mère",    accessor: "contact",     className: "hidden xl:table-cell" },
  { header: "Actions",      accessor: "actions" },
];

const columnsTeacher = [
  { header: "Info",             accessor: "info" },
  { header: "Genre",            accessor: "genre",     className: "hidden md:table-cell" },
  { header: "Niveau",           accessor: "classe",    className: "hidden md:table-cell" },
  { header: "Régime",           accessor: "regime",    className: "hidden lg:table-cell" },
  { header: "Absences récentes", accessor: "absences", className: "hidden lg:table-cell" },
  { header: "Suivi",            accessor: "suivi",     className: "hidden xl:table-cell" },
  { header: "Actions",          accessor: "actions" },
];

// ── Badges ────────────────────────────────────────────────────
const ChecklistBadge = ({ checklist }: { checklist: any }) => {
  if (!checklist) return <span className="text-xs text-gray-300">—</span>;
  const fields = ['photo_identite','extrait_naissance','certificat_medical',
    'fiche_renseignement_signee','vaccinations_a_jour','copie_cin_pere','copie_cin_mere'];
  const done = fields.filter(f => checklist[f]).length;
  const total = fields.length;
  const full = done === total;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      full ? 'bg-green-100 text-green-700' :
      done >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
      {full ? '✅ Complet' : `⚠️ ${done}/${total}`}
    </span>
  );
};

const PaymentBadge = ({ payments }: { payments: any[] }) => {
  if (!payments || payments.length === 0)
    return <span className="text-xs text-gray-300">—</span>;
  const overdue  = payments.filter(p => p.status === 'overdue').length;
  const pending  = payments.filter(p => p.status === 'pending').length;
  const paid     = payments.filter(p => p.status === 'paid').length;
  if (overdue > 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">🔴 {overdue} retard</span>;
  if (pending > 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">⏳ {pending} attente</span>;
  if (paid > 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">🟢 À jour</span>;
  return <span className="text-xs text-gray-300">—</span>;
};

const ContactMereBadge = ({ studentParents }: { studentParents: any[] }) => {
  if (!studentParents || studentParents.length === 0)
    return <span className="text-xs text-gray-300">—</span>;
  // phone & full_name are on the Parent model directly, not on parent.user
  const mere = studentParents.find((sp: any) =>
    ['mère', 'mere', 'mother', 'maman', 'mother'].includes(sp.relationship?.toLowerCase())
  );
  if (!mere) return <span className="text-xs text-gray-300">—</span>;
  const phone = mere?.parent?.phone;
  const name  = mere?.parent?.full_name;
  if (!phone) return <span className="text-xs text-gray-300">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <a href={`tel:${phone}`} className="text-xs text-blue-600 hover:underline font-mono">{phone}</a>
      {name && <span className="text-xs text-gray-400 truncate max-w-[110px]">{name}</span>}
    </div>
  );
};

const AbsenceBadge = ({ absences }: { absences: any[] }) => {
  if (!absences || absences.length === 0)
    return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Aucune</span>;
  const unexcused = absences.filter((a: any) => !a.excused).length;
  if (unexcused > 0)
    return <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-medium">⚠️ {absences.length} abs.</span>;
  return <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">{absences.length} justif.</span>;
};

const SuiviBadge = ({ followup }: { followup: any }) => {
  if (!followup) return <span className="text-xs text-gray-300">—</span>;
  return <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">⚕️ Suivi actif</span>;
};

const RegimeBadge = ({ regime }: { regime: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    journee_complete: { label: '☀️ Complet',   cls: 'bg-blue-50 text-blue-700' },
    demi_matin:       { label: '🌅 Matin',     cls: 'bg-purple-50 text-purple-700' },
    demi_apres_midi:  { label: '🌇 Après-midi', cls: 'bg-orange-50 text-orange-700' },
  };
  const r = map[regime];
  if (!r) return <span className="text-xs text-gray-300">—</span>;
  return <span className={`text-xs px-2 py-0.5 rounded-full ${r.cls}`}>{r.label}</span>;
};

// ── Icône SVG inline ─────────────────────────────────────────
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

const IconView = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
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

// ── Année scolaire courante ───────────────────────────────────
const getCurrentSchoolYear = () => {
  const now = new Date(), y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

const getSchoolYearOptions = () => {
  const now = new Date();
  const current = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const years: string[] = [];
  for (let y = current + 1; y >= 2020; y--) years.push(`${y}-${y + 1}`);
  return years;
};

// ── Page principale ───────────────────────────────────────────
const StudentListPage = () => {
  const [data, setData]               = useState<any[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // Filtres
  const [filterGender, setFilterGender]         = useState("");
  const [filterGrade, setFilterGrade]           = useState("");
  const [filterRegime, setFilterRegime]         = useState("");
  const [filterClass, setFilterClass]           = useState("");
  const [filterSchoolYear, setFilterSchoolYear] = useState("");
  const [classesList, setClassesList]           = useState<any[]>([]);
  // Tri
  const [sortBy, setSortBy]               = useState("full_name");
  const [sortDir, setSortDir]             = useState<"asc"|"desc">("asc");
  const role    = getUser()?.role || "";
  const isAdmin = role === "administrator";
  const isTeacher = role === "teacher";
  const columns = isTeacher ? columnsTeacher : columnsAdmin;
  const LIMIT   = 10;

  const schoolYearOptions = getSchoolYearOptions();

  // Classe verrouillée pour les enseignantes
  const [teacherClassId,   setTeacherClassId]   = useState("");
  const [teacherClassName, setTeacherClassName] = useState("");

  const effectiveSchoolYear = filterSchoolYear;

  const load = useCallback(() => {
    setLoading(true);
    const classIdToUse = teacherClassId || filterClass;
    const hasClientFilters = filterGender || filterGrade || filterRegime;
    const limit      = hasClientFilters ? 1000 : LIMIT;
    const pageToLoad = hasClientFilters ? 1 : page;
    studentsApi.list(pageToLoad, limit, search, showArchived, classIdToUse, effectiveSchoolYear)
      .then(res => { setData(res.data); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, showArchived, filterGender, filterGrade, filterRegime, filterClass, teacherClassId, effectiveSchoolYear]);

  useEffect(() => { load(); }, [load]);

  // Charger les classes pour le filtre
  useEffect(() => {
    classesApi.list().then(setClassesList).catch(() => {});
    // Si enseignante : récupérer sa classe et la verrouiller
    if (role === "teacher") {
      teachersApi.myProfile()
        .then(t => {
          const cls = t?.classes?.[0];
          if (cls) { setTeacherClassId(cls.id); setTeacherClassName(cls.name); }
        })
        .catch(() => {});
    }
  }, []);

  // Filtrage + tri côté client
  const filteredData = data
    .filter(item => {
      if (filterGender && item.gender !== filterGender) return false;
      if (filterGrade  && item.grade  !== filterGrade)  return false;
      if (filterRegime && (item.regime || 'journee_complete') !== filterRegime) return false;
      if (filterClass  && item.class_id !== filterClass) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortBy] || "";
      let vb = b[sortBy] || "";
      if (sortBy === "full_name") { va = a.full_name || ""; vb = b.full_name || ""; }
      if (sortBy === "grade")     { va = a.grade || ""; vb = b.grade || ""; }
      if (sortBy === "date_of_birth") {
        va = new Date(a.date_of_birth).getTime();
        vb = new Date(b.date_of_birth).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const yearIsFiltered = !!filterSchoolYear;
  const activeFiltersCount = [filterGender, filterGrade, filterRegime, !isTeacher && filterClass, yearIsFiltered].filter(Boolean).length;

  const handleArchive = async (id: string, name: string) => {
    if (confirm(`Archiver ${name} ?\nL'enfant n'apparaîtra plus dans la liste active.`)) {
      await studentsApi.archive(id); load();
    }
  };

  const handleRestore = async (id: string, name: string) => {
    if (confirm(`Restaurer ${name} dans la liste active ?`)) {
      await studentsApi.restore(id); load();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ SUPPRESSION DÉFINITIVE de ${name}\nToutes les données seront perdues. Confirmer ?`)) {
      await studentsApi.delete(id); load();
    }
  };

  const renderRows = (item: any) => (
    <tr key={item.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-BKskyLight">

      {/* Info : Avatar + Nom + Date */}
      <td className="flex items-center gap-3 py-4">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${item.archived ? 'bg-gray-400' : item.gender === 'F' ? 'bg-pink-400' : 'bg-BKprimary'}`}>
          {item.full_name?.charAt(0)}
        </div>
        <div className="flex flex-col">
          <h3 className={`font-semibold leading-tight ${item.archived ? 'text-gray-400 line-through' : ''}`}>
            {item.full_name}
          </h3>
          <p className="text-xs text-gray-400">
            {item.date_of_birth ? new Date(item.date_of_birth).toLocaleDateString("fr-TN") : ""}
          </p>
        </div>
      </td>

      {/* Genre */}
      <td className="hidden md:table-cell">
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          item.gender === 'F'
            ? 'bg-pink-100 text-pink-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {item.gender === 'F' ? '♀ Fille' : '♂ Garçon'}
        </span>
      </td>

      {/* Classe + Niveau */}
      <td className="hidden md:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium">{item.class?.name || "—"}</span>
          <span className="text-xs text-gray-400">{item.grade || ""}</span>
          {item.student_pack?.school_year && (
            <span className="text-xs text-blue-500 font-mono bg-blue-50 px-1.5 py-0.5 rounded w-fit">
              {item.student_pack.school_year}
            </span>
          )}
        </div>
      </td>

      {/* Régime */}
      <td className="hidden lg:table-cell">
        <RegimeBadge regime={item.regime || 'journee_complete'} />
      </td>

      {/* Dossier (directrice) OU Absences récentes (enseignante) */}
      {isTeacher ? (
        <td className="hidden lg:table-cell">
          <AbsenceBadge absences={item.absences} />
        </td>
      ) : (
        <td className="hidden lg:table-cell">
          <ChecklistBadge checklist={item.registration_checklist} />
        </td>
      )}

      {/* Paiements (directrice) OU Suivi spécialisé (enseignante) */}
      {isTeacher ? (
        <td className="hidden lg:table-cell">
          <SuiviBadge followup={item.specialized_followup} />
        </td>
      ) : (
        <td className="hidden lg:table-cell">
          <PaymentBadge payments={item.payments} />
        </td>
      )}

      {/* Enseignante : directrice uniquement */}
      {!isTeacher && (
        <td className="hidden xl:table-cell text-xs text-gray-600">
          {item.class?.teacher?.user?.full_name || "—"}
        </td>
      )}

      {/* Tél. mère : directrice uniquement */}
      {!isTeacher && (
        <td className="hidden xl:table-cell">
          <ContactMereBadge studentParents={item.student_parents} />
        </td>
      )}

      {/* Actions */}
      <td>
        <div className="flex items-center gap-1.5">

          {/* Voir */}
          <Link href={`/list/students/${item.id}`}>
            <button
              title="Voir la fiche"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
            >
              <IconView />
            </button>
          </Link>

          {isAdmin && !item.archived && (
            <>
              {/* Modifier */}
              <FormModal
                table="student"
                type="update"
                data={item}
                onRefresh={load}
                hint="Modifier l'enfant"
              />

              {/* Archiver */}
              <button
                onClick={() => handleArchive(item.id, item.full_name)}
                title="Archiver l'enfant"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
              >
                <IconArchive />
              </button>
            </>
          )}

          {/* Restaurer (archivés seulement) */}
          {isAdmin && item.archived && (
            <button
              onClick={() => handleRestore(item.id, item.full_name)}
              title="Restaurer l'enfant"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition"
            >
              <IconRestore />
            </button>
          )}

          {/* Supprimer */}
          {isAdmin && (
            <button
              onClick={() => handleDelete(item.id, item.full_name)}
              title="Supprimer définitivement"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              <IconDelete />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <AuthGuard allowedRoles={["administrator", "teacher"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold hidden md:block">
            {isTeacher
              ? <span>Mes élèves{teacherClassName && <span className="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">🏫 {teacherClassName}</span>}</span>
              : showArchived ? "Enfants archivés" : "Tous les enfants"
            }
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <TableSearch onSearch={setSearch} />
            <div className="flex items-center gap-2 self-end">

              {/* Bouton Filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                title="Filtrer"
                className={`w-8 h-8 flex items-center justify-center rounded-full transition relative ${
                  showFilters || activeFiltersCount > 0 ? 'bg-blue-500 text-white' : 'bg-BKyellow text-gray-700'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Bouton Tri */}
              <div className="relative group">
                <button
                  title="Trier"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-BKyellow text-gray-700 hover:bg-yellow-300 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
                {/* Dropdown tri */}
                <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 hidden group-hover:block w-44">
                  {[
                    { label: "Nom A→Z",     by: "full_name",    dir: "asc"  },
                    { label: "Nom Z→A",     by: "full_name",    dir: "desc" },
                    { label: "Plus jeune",  by: "date_of_birth", dir: "desc" },
                    { label: "Plus âgé",   by: "date_of_birth", dir: "asc"  },
                    { label: "Niveau A→Z", by: "grade",         dir: "asc"  },
                  ].map(opt => (
                    <button
                      key={`${opt.by}-${opt.dir}`}
                      onClick={() => { setSortBy(opt.by); setSortDir(opt.dir as "asc"|"desc"); }}
                      className={`w-full text-left text-xs px-3 py-2 rounded hover:bg-gray-50 ${
                        sortBy === opt.by && sortDir === opt.dir ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-600'}`}
                    >
                      {sortBy === opt.by && sortDir === opt.dir ? '✓ ' : ''}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Imprimer la liste */}
              {isAdmin && (
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('year', effectiveSchoolYear);
                    if (filterClass || teacherClassId) params.set('classId', filterClass || teacherClassId);
                    if (showArchived) params.set('archived', 'true');
                    window.open(`/students?${params.toString()}`, '_blank');
                  }}
                  title="Imprimer la liste"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setPage(1);
                    setFilterSchoolYear("");
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    showArchived ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                >
                  {showArchived ? "← Actifs" : "📦 Archivés"}
                </button>
              )}
              {isAdmin && !showArchived && (
                <FormModal table="student" type="create" onRefresh={load} />
              )}
            </div>
          </div>
        </div>

        {/* Panneau filtres */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Genre</label>
              <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Tous</option>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Niveau</label>
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Tous</option>
                <option value="PS">PS</option>
                <option value="MS">MS</option>
                <option value="GS">GS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Régime</label>
              <select value={filterRegime} onChange={e => setFilterRegime(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Tous</option>
                <option value="journee_complete">Journée complète</option>
                <option value="demi_matin">Demi-matin</option>
                <option value="demi_apres_midi">Demi-après-midi</option>
              </select>
            </div>
            {!isTeacher && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Classe</label>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="">Toutes</option>
                  {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Année scolaire</label>
              <select value={filterSchoolYear} onChange={e => { setFilterSchoolYear(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                <option value="">Toutes les années</option>
                {schoolYearOptions.map(y => (
                  <option key={y} value={y}>
                    {y}{y === getCurrentSchoolYear() ? " ★" : ""}
                  </option>
                ))}
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setFilterGender(""); setFilterGrade(""); setFilterRegime(""); setFilterClass(""); setFilterSchoolYear(""); }}
                className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition"
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement...</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">
            {showArchived ? "Aucun enfant archivé" : activeFiltersCount > 0 ? "Aucun résultat pour ces filtres" : "Aucun enfant trouvé"}
          </p>
        ) : (
          <Table columns={columns} renderRows={renderRows} data={filteredData} />
        )}
        {!activeFiltersCount && (
          <Pagination page={page} totalPages={Math.ceil(total / LIMIT)} onPageChange={setPage} />
        )}
      </div>
    </AuthGuard>
  );
};

export default StudentListPage;
