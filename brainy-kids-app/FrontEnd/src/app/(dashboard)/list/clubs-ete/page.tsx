"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { packsExt, students as studentsApi } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

const SUMMER_CLUBS_PACK = [
  "Coran", "Théâtre", "Dessin & Créatif", "Cinéma",
  "Jeux aquatiques", "Sport", "Cuisine"
];
const OPTIONS_PAYANTES = ["Langue Française", "Langue Anglaise", "Robotique"];

export default function ClubsEtePage() {
  const [tab, setTab]           = useState<"list" | "inscrit" | "externe">("list");
  const [packs, setPacks]       = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      type: "inscrit", student_id: "", month: 7, year: new Date().getFullYear(),
      pack_amount: 0, langue_fr: false, langue_fr_amount: 0,
      langue_en: false, langue_en_amount: 0, robotique: false, robotique_amount: 0,
      // Élève externe
      full_name: "", date_of_birth: "", gender: "M",
      parent_name: "", parent_phone: "", parent_email: "",
    },
  });

  const type       = watch("type");
  const langueFr   = watch("langue_fr");
  const langueEn   = watch("langue_en");
  const robotique  = watch("robotique");
  const packAmt    = +(watch("pack_amount") || 0);
  const frAmt      = +(watch("langue_fr_amount") || 0);
  const enAmt      = +(watch("langue_en_amount") || 0);
  const robAmt     = +(watch("robotique_amount") || 0);
  const total      = packAmt + (langueFr ? frAmt : 0) + (langueEn ? enAmt : 0) + (robotique ? robAmt : 0);

  useEffect(() => {
    studentsApi.list(1, 100).then(r => setStudents(r.data || [])).catch(() => {});
    loadPacks();
  }, []);

  const loadPacks = () => {
    packsExt.getSummerPacks().then(setPacks).catch(() => {});
  };

  const onSubmit = handleSubmit(async (data: any) => {
    setLoading(true); setError(""); setSuccess("");
    try {
      if (data.type === "externe") {
        const ext = await packsExt.createExternal({
          full_name: data.full_name, date_of_birth: data.date_of_birth,
          gender: data.gender, parent_name: data.parent_name,
          parent_phone: data.parent_phone, parent_email: data.parent_email,
        });
        await packsExt.createSummerPack({ ...data, external_student_id: ext.id, student_id: null });
      } else {
        await packsExt.createSummerPack({ ...data, external_student_id: null });
      }
      setSuccess("Inscription créée avec succès !");
      reset();
      loadPacks();
      setTab("list");
    } catch (e: any) {
      setError(e.message || "Erreur");
    } finally { setLoading(false); }
  });

  const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:outline-none";
  const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[{k:"list",l:"Liste des inscrits"},{k:"inscrit",l:"+ Élève inscrit"},{k:"externe",l:"+ Enfant externe"}].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.k ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Liste */}
        {tab === "list" && (
          <div>
            <h1 className="text-lg font-semibold mb-4">Clubs d'été 2026</h1>
            {packs.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucune inscription pour le moment</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b">
                    <th className="py-2">Nom</th>
                    <th className="py-2">Mois</th>
                    <th className="py-2">Options</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Statut</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {packs.map((p: any) => (
                    <tr key={p.id} className="border-b even:bg-slate-50">
                      <td className="py-2 font-medium">
                        {p.student?.full_name || p.external_student?.full_name || "—"}
                        {p.external_student && <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-1 rounded">Externe</span>}
                      </td>
                      <td className="py-2">{p.month === 7 ? "Juillet" : "Août"} {p.year}</td>
                      <td className="py-2 text-xs">
                        {p.langue_fr && <span className="mr-1 bg-blue-50 text-blue-600 px-1 rounded">FR</span>}
                        {p.langue_en && <span className="mr-1 bg-blue-50 text-blue-600 px-1 rounded">EN</span>}
                        {p.robotique && <span className="bg-purple-50 text-purple-600 px-1 rounded">Robot.</span>}
                        {!p.langue_fr && !p.langue_en && !p.robotique && <span className="text-gray-400">Pack standard</span>}
                      </td>
                      <td className="py-2 font-medium">{p.total_amount} DT</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.paid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {p.paid ? "Payé" : "En attente"}
                        </span>
                      </td>
                      <td className="py-2">
                        {!p.paid && (
                          <button onClick={async () => { await packsExt.markSummerPaid(p.id); loadPacks(); }}
                            className="text-xs text-blue-600 hover:underline">Marquer payé</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Formulaire inscription */}
        {(tab === "inscrit" || tab === "externe") && (
          <form onSubmit={onSubmit} className="flex flex-col gap-5 max-w-2xl">
            <h1 className="text-lg font-semibold">
              {tab === "inscrit" ? "Inscrire un élève — Clubs d'été" : "Inscrire un enfant externe — Clubs d'été"}
            </h1>

            <input type="hidden" {...register("type")} value={tab} />

            {/* Infos élève externe */}
            {tab === "externe" && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-orange-800 mb-3">Informations enfant externe (max 10 ans)</h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className={labelCls}>Nom complet *</label>
                    <input {...register("full_name", { required: true })} className={inputCls} />
                  </div>
                  <div className="flex flex-col w-[150px]">
                    <label className={labelCls}>Date de naissance *</label>
                    <input type="date" {...register("date_of_birth", { required: true })} className={inputCls} />
                  </div>
                  <div className="flex flex-col w-[90px]">
                    <label className={labelCls}>Genre</label>
                    <select {...register("gender")} className={inputCls}>
                      <option value="M">Garçon</option>
                      <option value="F">Fille</option>
                    </select>
                  </div>
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className={labelCls}>Nom parent *</label>
                    <input {...register("parent_name", { required: true })} className={inputCls} />
                  </div>
                  <div className="flex flex-col w-[140px]">
                    <label className={labelCls}>Téléphone *</label>
                    <input {...register("parent_phone", { required: true })} className={inputCls} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-[150px]">
                    <label className={labelCls}>Email parent</label>
                    <input type="email" {...register("parent_email")} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* Élève inscrit */}
            {tab === "inscrit" && (
              <div>
                <label className={labelCls}>Sélectionner l'élève *</label>
                <select {...register("student_id", { required: true })} className={inputCls}>
                  <option value="">— Choisir —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.grade})</option>)}
                </select>
              </div>
            )}

            {/* Mois + tarif pack */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col w-[130px]">
                <label className={labelCls}>Mois *</label>
                <select {...register("month")} className={inputCls}>
                  <option value={7}>Juillet</option>
                  <option value={8}>Août</option>
                </select>
              </div>
              <div className="flex flex-col w-[100px]">
                <label className={labelCls}>Année</label>
                <input type="number" {...register("year")} className={inputCls} />
              </div>
              <div className="flex flex-col w-[140px]">
                <label className={labelCls}>Tarif pack (DT)</label>
                <input type="number" {...register("pack_amount")} className={inputCls} min={0} />
              </div>
            </div>

            {/* Clubs inclus (info) */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-700 mb-2">Clubs inclus dans le pack :</p>
              <div className="flex flex-wrap gap-1">
                {SUMMER_CLUBS_PACK.map(c => (
                  <span key={c} className="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>

            {/* Options payantes */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Options payantes :</p>
              <div className="flex flex-col gap-3">
                {[
                  { key: "langue_fr", amtKey: "langue_fr_amount", label: "Langue Française", enabled: langueFr },
                  { key: "langue_en", amtKey: "langue_en_amount", label: "Langue Anglaise",  enabled: langueEn },
                  { key: "robotique", amtKey: "robotique_amount", label: "Robotique",         enabled: robotique },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center gap-3">
                    <input type="checkbox" {...register(opt.key as any)} className="w-4 h-4 accent-blue-500" />
                    <span className="text-sm flex-1">{opt.label}</span>
                    {opt.enabled && (
                      <div className="flex items-center gap-1">
                        <input type="number" {...register(opt.amtKey as any)} className={`${inputCls} w-24`} min={0} />
                        <span className="text-xs text-gray-400">DT</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
              <span className="font-semibold text-green-800">Total à payer</span>
              <span className="text-xl font-bold text-green-700">{total} DT</span>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 rounded p-2">{success}</p>}

            <button type="submit" disabled={loading}
              className="bg-blue-600 text-white p-3 rounded-md font-semibold disabled:opacity-50 hover:bg-blue-700 transition">
              {loading ? "Inscription en cours..." : "Valider l'inscription"}
            </button>
          </form>
        )}
      </div>
    </AuthGuard>
  );
}
