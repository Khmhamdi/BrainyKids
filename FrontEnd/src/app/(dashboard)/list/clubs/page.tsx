"use client";
import { useEffect, useState, useCallback } from "react";
import { clubs as clubsApi } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:outline-none";
const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

// ── Row inline-edit ───────────────────────────────────────────
const ClubRow = ({ club, onSave, onDelete }: {
  club: any;
  onSave:   (id: string, d: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [editing,     setEditing]     = useState(false);
  const [name,        setName]        = useState(club.name);
  const [description, setDescription] = useState(club.description || "");
  const [price,       setPrice]       = useState(String(club.price ?? 0));
  const [ageGroup,    setAgeGroup]    = useState(club.age_group || "");
  const [type,        setType]        = useState(club.type || "regulier");
  const [isActive,    setIsActive]    = useState(club.is_active);
  const [saving,      setSaving]      = useState(false);
  const [rowError,    setRowError]    = useState("");

  const save = async () => {
    setSaving(true); setRowError("");
    try {
      await onSave(club.id, { name, description: description || null, price: parseFloat(price) || 0, age_group: ageGroup || null, type, is_active: isActive });
      setEditing(false);
    } catch (e: any) { setRowError(e.message || "Erreur"); }
    finally { setSaving(false); }
  };

  if (!editing) return (
    <tr className="border-b even:bg-slate-50 text-sm hover:bg-blue-50">
      <td className="py-3 px-2 font-medium">{club.name}</td>
      <td className="py-3 px-2 text-gray-500 hidden md:table-cell">{club.description || "—"}</td>
      <td className="py-3 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${club.type === "ete" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
          {club.type === "ete" ? "☀️ Été" : "📚 Régulier"}
        </span>
      </td>
      <td className="py-3 px-2 hidden md:table-cell text-xs text-gray-500">{club.age_group || "Tous"}</td>
      <td className="py-3 px-2 font-semibold text-green-700">{Number(club.price).toLocaleString("fr-TN")} DT</td>
      <td className="py-3 px-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${club.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {club.is_active ? "Actif" : "Inactif"}
        </span>
      </td>
      <td className="py-3 px-2 text-xs text-gray-400 hidden lg:table-cell">{club._count?.memberships ?? 0} membres</td>
      <td className="py-3 px-2">
        <div className="flex gap-1.5">
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-green-100 text-green-700 hover:bg-green-200" title="Modifier">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => { if (confirm(`Supprimer "${club.name}" ?`)) onDelete(club.id); }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <tr className="border-b bg-yellow-50 text-sm">
        <td className="py-2 px-2"><input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></td>
        <td className="py-2 px-2 hidden md:table-cell"><input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Description" /></td>
        <td className="py-2 px-2">
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="regulier">Régulier</option>
            <option value="ete">Été</option>
          </select>
        </td>
        <td className="py-2 px-2 hidden md:table-cell">
          <input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={inputCls} placeholder="ex: 3 ans" />
        </td>
        <td className="py-2 px-2">
          <div className="flex items-center gap-1">
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} min={0} step={0.5} />
            <span className="text-xs text-gray-400 whitespace-nowrap">DT</span>
          </div>
        </td>
        <td className="py-2 px-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-500" />
            <span className="text-xs">Actif</span>
          </label>
        </td>
        <td className="py-2 px-2 hidden lg:table-cell" />
        <td className="py-2 px-2">
          <div className="flex gap-1.5">
            <button onClick={save} disabled={saving} className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50">
              {saving ? "…" : "Sauver"}
            </button>
            <button onClick={() => { setEditing(false); setRowError(""); }} className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">
              Annuler
            </button>
          </div>
        </td>
      </tr>
      {rowError && (
        <tr className="bg-red-50"><td colSpan={8} className="px-2 py-1 text-xs text-red-600">{rowError}</td></tr>
      )}
    </>
  );
};

// ── Formulaire ajout ──────────────────────────────────────────
const AddClubForm = ({ onAdded }: { onAdded: () => void }) => {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [price,       setPrice]       = useState("");
  const [ageGroup,    setAgeGroup]    = useState("");
  const [type,        setType]        = useState("regulier");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const add = async () => {
    if (!name.trim()) { setError("Le nom est obligatoire"); return; }
    setSaving(true); setError("");
    try {
      await clubsApi.create({ name: name.trim(), description: description.trim() || null, price: parseFloat(price) || 0, age_group: ageGroup.trim() || null, type, is_active: true });
      setName(""); setDescription(""); setPrice(""); setAgeGroup(""); setType("regulier");
      onAdded();
    } catch (e: any) { setError(e.message || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <p className="text-sm font-semibold text-blue-800 mb-3">Ajouter un club</p>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col flex-1 min-w-[140px]">
          <label className={labelCls}>Nom *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="ex: Robotique" />
        </div>
        <div className="flex flex-col flex-1 min-w-[140px]">
          <label className={labelCls}>Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Courte description" />
        </div>
        <div className="flex flex-col w-[100px]">
          <label className={labelCls}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="regulier">📚 Régulier</option>
            <option value="ete">☀️ Été</option>
          </select>
        </div>
        <div className="flex flex-col w-[100px]">
          <label className={labelCls}>Groupe d'âge</label>
          <input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={inputCls} placeholder="ex: 4 ans" />
        </div>
        <div className="flex flex-col w-[100px]">
          <label className={labelCls}>Prix (DT/mois)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} min={0} step={0.5} placeholder="0" />
        </div>
        <div className="flex items-end">
          <button onClick={add} disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? "Ajout…" : "+ Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────
export default function ClubsPage() {
  const [clubsList,    setClubsList]   = useState<any[]>([]);
  const [filterType,   setFilterType]  = useState<"" | "regulier" | "ete">("");
  const [loading,      setLoading]     = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    clubsApi.list(filterType || undefined)
      .then(setClubsList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  const handleSave   = async (id: string, data: any) => { await clubsApi.update(id, data); load(); };
  const handleDelete = async (id: string) => { await clubsApi.delete(id); load(); };

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4 mt-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">Gestion des clubs</h1>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          {([ ["", "Tous"], ["regulier", "📚 Réguliers"], ["ete", "☀️ Été"] ] as [string, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setFilterType(v as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${filterType === v ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {l}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{clubsList.length} club(s)</span>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-400 text-sm">Chargement…</p>
        ) : clubsList.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">Aucun club enregistré</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b">
                  <th className="py-2 px-2">Nom</th>
                  <th className="py-2 px-2 hidden md:table-cell">Description</th>
                  <th className="py-2 px-2">Type</th>
                  <th className="py-2 px-2 hidden md:table-cell">Âge</th>
                  <th className="py-2 px-2">Prix/mois</th>
                  <th className="py-2 px-2">Statut</th>
                  <th className="py-2 px-2 hidden lg:table-cell">Membres</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clubsList.map(club => (
                  <ClubRow key={club.id} club={club} onSave={handleSave} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AddClubForm onAdded={load} />

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>Note :</strong> Les clubs de type <strong>☀️ Été</strong> actifs sont disponibles lors des inscriptions aux clubs d'été.
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
