"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { packs, clubs as clubsApi } from "@/lib/api";

const SCHOOL_MONTHS = [
  { value: 9,  label: "Septembre" }, { value: 10, label: "Octobre"  },
  { value: 11, label: "Novembre"  }, { value: 12, label: "Décembre" },
  { value: 1,  label: "Janvier"   }, { value: 2,  label: "Février"  },
  { value: 3,  label: "Mars"      }, { value: 4,  label: "Avril"    },
  { value: 5,  label: "Mai"       }, { value: 6,  label: "Juin"     },
];

const REGIMES = [
  { value: "journee_complete", label: "Journée complète (tarif plein)" },
  { value: "demi_matin",       label: "Demi-journée matin (tarif ÷2 + 10 DT)" },
  { value: "demi_apres_midi",  label: "Demi-journée après-midi (tarif ÷2 + 10 DT)" },
];

const calcTarif = (base: number, regime: string) => {
  if (regime === "journee_complete") return base;
  return Math.round(base / 2 + 10);
};

const PackForm = ({ studentId, existingPack, onSuccess }: {
  studentId: string; existingPack?: any; onSuccess?: () => void;
}) => {
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [confirmed, setConfirmed]     = useState(false);
  const [clubs, setClubs]             = useState<{ name: string; amount: number }[]>(
    existingPack?.clubs || []
  );
  const [clubOptions, setClubOptions] = useState<any[]>([]);
  const [newClub, setNewClub]         = useState("");
  const [newClubAmt, setNewClubAmt]   = useState<string>("");

  useEffect(() => {
    clubsApi.list("regulier", undefined, true)
      .then(list => {
        setClubOptions(list);
        if (list.length > 0 && !newClub) setNewClub(list[0].name);
      })
      .catch(() => {});
  }, []);

  const now = new Date();
  const defaultYear = now.getMonth() >= 8
    ? `${now.getFullYear()}-${now.getFullYear()+1}`
    : `${now.getFullYear()-1}-${now.getFullYear()}`;

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      school_year:        existingPack?.school_year        || defaultYear,
      start_month:        existingPack?.start_month        || 9,
      end_month:          existingPack?.end_month          || 6,
      regime:             existingPack?.regime             || "journee_complete",
      tarif_base:         existingPack?.tarif_base         || existingPack?.scolarite_amount || 0,
      inscription_amount: existingPack?.inscription_amount || 0,
      inscription_paid:   existingPack?.inscription_paid   || false,
      cantine_enabled:    existingPack?.cantine_enabled    || false,
      cantine_amount:     existingPack?.cantine_amount     || 0,
      transport_enabled:  existingPack?.transport_enabled  || false,
      transport_amount:   existingPack?.transport_amount   || 0,
      discount:           existingPack?.discount           || 0,
    },
  });

  const regime        = watch("regime");
  const tarif_base    = +(watch("tarif_base") || 0);
  const scolarite     = calcTarif(tarif_base, regime);
  const canteen       = watch("cantine_enabled");
  const transport     = watch("transport_enabled");
  const cantine_amt   = +(watch("cantine_amount") || 0);
  const transport_amt = +(watch("transport_amount") || 0);
  const discount      = +(watch("discount") || 0);
  const inscription   = +(watch("inscription_amount") || 0);
  const startMonth    = +(watch("start_month") || 9);
  const endMonth      = +(watch("end_month") || 6);

  const activeMonths = SCHOOL_MONTHS.filter(m => {
    const si = SCHOOL_MONTHS.findIndex(x => x.value === startMonth);
    const ei = SCHOOL_MONTHS.findIndex(x => x.value === endMonth);
    const mi = SCHOOL_MONTHS.findIndex(x => x.value === m.value);
    return mi >= si && mi <= ei;
  });

  const monthlyTotal = scolarite
    + (canteen ? cantine_amt : 0)
    + (transport ? transport_amt : 0)
    + clubs.reduce((s, c) => s + c.amount, 0);

  const annualTotal = monthlyTotal * activeMonths.length - discount + inscription;

  const onSubmit = handleSubmit(async (data: any) => {
    // FIX 1 — bloquer si non confirmé
    if (!confirmed) {
      setError("Veuillez cocher la case de confirmation avant de valider.");
      return;
    }
    setLoading(true); setError("");
    try {
      await packs.upsert(studentId, { ...data, clubs, tarif_base, scolarite_amount: scolarite });
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  });

  // FIX 2 — empêcher la touche Entrée de soumettre le formulaire sauf sur le bouton
  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "BUTTON") {
      e.preventDefault();
    }
  };

  const handleAddClub = () => {
    const selected = clubOptions.find(c => c.name === newClub);
    const amt = parseFloat(newClubAmt) || (selected?.price ?? 0);
    if (newClub && amt >= 0) {
      setClubs([...clubs, { name: newClub, amount: amt }]);
      setNewClubAmt("");
      if (clubOptions.length > 0) setNewClub(clubOptions[0].name);
    }
  };

  // Auto-fill amount when club selection changes
  const handleClubSelect = (name: string) => {
    setNewClub(name);
    const selected = clubOptions.find(c => c.name === name);
    if (selected?.price) setNewClubAmt(String(selected.price));
    else setNewClubAmt("");
  };

  const inputCls = "border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-1 focus:ring-blue-400 focus:outline-none";
  const labelCls = "text-xs font-medium text-gray-600 mb-1 block";

  return (
    <form onSubmit={onSubmit} onKeyDown={preventEnterSubmit} className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Pack Financier — Année Scolaire</h1>

      {/* Année scolaire + mois début/fin */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col w-[140px]">
          <label className={labelCls}>Année scolaire</label>
          <input {...register("school_year")} className={inputCls} placeholder="2025-2026" />
        </div>
        <div className="flex flex-col w-[130px]">
          <label className={labelCls}>Mois de début</label>
          <select {...register("start_month")} className={inputCls}>
            {SCHOOL_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col w-[130px]">
          <label className={labelCls}>Mois de fin</label>
          <select {...register("end_month")} className={inputCls}>
            {SCHOOL_MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-2 rounded-md">
            {activeMonths.length} mois ({activeMonths.map(m => m.label.substring(0,3)).join(', ')})
          </span>
        </div>
      </div>

      {/* Régime */}
      <div>
        <label className={labelCls}>Régime de présence</label>
        <select {...register("regime")} className={inputCls}>
          {REGIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Scolarité */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-blue-800 mb-3">Scolarité</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col w-[140px]">
            <label className={labelCls}>Tarif de base (DT)</label>
            <input type="number" {...register("tarif_base")} className={inputCls} min={0} />
          </div>
          <div className="flex flex-col w-[140px]">
            <label className={labelCls}>Tarif appliqué</label>
            <input readOnly value={`${scolarite} DT`}
              className={`${inputCls} bg-white text-blue-700 font-bold`} />
          </div>
          {regime !== "journee_complete" && (
            <p className="text-xs text-orange-600 self-end pb-2">
              {tarif_base} ÷ 2 + 10 DT = <strong>{scolarite} DT</strong>
            </p>
          )}
        </div>
      </div>

      {/* Inscription */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Frais d'inscription</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col w-[140px]">
            <label className={labelCls}>Montant (DT)</label>
            <input type="number" {...register("inscription_amount")} className={inputCls} min={0} />
          </div>
          <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
            <input type="checkbox" {...register("inscription_paid")} className="w-4 h-4 accent-green-500" />
            Déjà payé
          </label>
        </div>
      </div>

      {/* FIX 4 — Cantine + Transport côte à côte et alignés */}
      <div className="grid grid-cols-2 gap-3">
        {/* Cantine */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" {...register("cantine_enabled")} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Cantine</span>
          </label>
          <div>
            <label className={labelCls}>Montant mensuel (DT)</label>
            <input
              type="number"
              {...register("cantine_amount")}
              className={`${inputCls} ${!canteen ? "opacity-40" : ""}`}
              min={0}
              disabled={!canteen}
            />
          </div>
        </div>

        {/* Transport */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" {...register("transport_enabled")} className="w-4 h-4 accent-blue-500" />
            <span className="text-sm font-semibold text-gray-700">Transport (forfait)</span>
          </label>
          <div>
            <label className={labelCls}>Montant mensuel (DT)</label>
            <input
              type="number"
              {...register("transport_amount")}
              className={`${inputCls} ${!transport ? "opacity-40" : ""}`}
              min={0}
              disabled={!transport}
            />
          </div>
        </div>
      </div>

      {/* FIX 5 — Clubs : liste déroulante et champ montant équilibrés */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Clubs optionnels payants</h2>
        {clubs.map((c, i) => (
          <div key={i} className="flex items-center gap-2 mb-2 text-sm">
            <span className="flex-1 bg-white border border-gray-200 rounded px-2 py-1.5">{c.name}</span>
            <span className="w-24 text-right font-medium text-gray-600">{c.amount} DT/mois</span>
            <button type="button" onClick={() => setClubs(clubs.filter((_, j) => j !== i))}
              className="text-red-400 hover:text-red-600 text-base px-1">✕</button>
          </div>
        ))}
        {/* FIX 5 — Sélect et montant à largeur égale */}
        <div className="flex gap-2 mt-3 items-end">
          <div className="flex flex-col flex-1">
            <label className={labelCls}>Club</label>
            <select
              value={newClub}
              onChange={e => handleClubSelect(e.target.value)}
              className={inputCls}
            >
              {clubOptions.length === 0
                ? <option value="">Chargement…</option>
                : clubOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
              }
            </select>
          </div>
          <div className="flex flex-col flex-1">
            <label className={labelCls}>Montant (DT/mois)</label>
            <input
              type="number"
              value={newClubAmt}
              onChange={e => setNewClubAmt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddClub(); } }}
              className={inputCls}
              placeholder="0"
              min={0}
            />
          </div>
          <button
            type="button"
            onClick={handleAddClub}
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 whitespace-nowrap"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Réduction */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col w-[200px]">
          <label className={labelCls}>Réduction 1er mois (DT)</label>
          <input type="number" {...register("discount")} className={inputCls} min={0} />
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-green-800 mb-3">Récapitulatif</h2>
        <div className="grid grid-cols-2 gap-1 text-sm">
          <span className="text-gray-600">Scolarité mensuelle</span>
          <span className="font-medium text-right">{scolarite} DT</span>
          {canteen && <><span className="text-gray-600">Cantine</span><span className="font-medium text-right">{cantine_amt} DT</span></>}
          {transport && <><span className="text-gray-600">Transport</span><span className="font-medium text-right">{transport_amt} DT</span></>}
          {clubs.map((c, i) => (
            <><span key={`n${i}`} className="text-gray-600">Club {c.name}</span><span key={`a${i}`} className="font-medium text-right">{c.amount} DT</span></>
          ))}
          <span className="text-gray-600 font-semibold border-t pt-1 mt-1">Total mensuel</span>
          <span className="font-bold text-right border-t pt-1 mt-1 text-blue-700">{monthlyTotal} DT</span>
          <span className="text-gray-600">× {activeMonths.length} mois</span>
          <span className="font-medium text-right">{monthlyTotal * activeMonths.length} DT</span>
          {discount > 0 && <><span className="text-gray-600">- Réduction</span><span className="font-medium text-right text-red-600">- {discount} DT</span></>}
          {inscription > 0 && <><span className="text-gray-600">+ Inscription</span><span className="font-medium text-right">+ {inscription} DT</span></>}
          <span className="text-gray-800 font-bold border-t pt-1 mt-1 text-base">TOTAL ANNUEL</span>
          <span className="font-bold text-right border-t pt-1 mt-1 text-green-700 text-base">{annualTotal} DT</span>
        </div>
      </div>

      {/* FIX 1 — Case de confirmation obligatoire */}
      <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${confirmed ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => { setConfirmed(e.target.checked); if (e.target.checked) setError(""); }}
          className="w-5 h-5 accent-green-500 mt-0.5"
        />
        <div>
          <p className="text-sm font-semibold text-gray-700">Je confirme que toutes les informations sont correctes</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Cette action va générer {activeMonths.length * (1 + (canteen?1:0) + (transport?1:0) + clubs.length)} échéances de paiement pour {activeMonths.length} mois.
          </p>
        </div>
      </label>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded p-2">{error}</p>}

      <button
        type="submit"
        disabled={loading || !confirmed}
        className="bg-blue-600 text-white p-3 rounded-md font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
      >
        {loading ? "Enregistrement..." : existingPack ? "Mettre à jour le pack" : "Créer le pack"}
      </button>
    </form>
  );
};

export default PackForm;
