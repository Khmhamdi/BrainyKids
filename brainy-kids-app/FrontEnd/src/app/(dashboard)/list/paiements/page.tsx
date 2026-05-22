"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { packsExt, packs } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";

const statusStyle: Record<string, string> = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};
const statusLabel: Record<string, string> = {
  paid: "Payé", pending: "En attente", overdue: "En retard"
};

export default function PaiementsPage() {
  const params     = useSearchParams();
  const studentId  = params.get("student");
  const [groups, setGroups]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState<string | null>(null);

  const load = () => {
    if (!studentId) return;
    setLoading(true);
    packsExt.getPayments(studentId)
      .then(setGroups).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [studentId]);

  const markMonthPaid = async (month: number, year: number) => {
    if (!studentId) return;
    setPaying(`${year}-${month}`);
    try {
      await packsExt.markMonthPaid(studentId, month, year);
      load();
    } finally { setPaying(null); }
  };

  const markOnePaid = async (paymentId: string) => {
    setPaying(paymentId);
    try {
      await packs.markPaid(paymentId);
      load();
    } finally { setPaying(null); }
  };

  if (!studentId) return (
    <div className="p-8 text-center text-gray-400">
      Sélectionnez un élève depuis sa fiche pour voir ses paiements.
    </div>
  );

  return (
    <AuthGuard allowedRoles={["administrator"]}>
      <div className="bg-white p-4 rounded-md m-4">
        <h1 className="text-lg font-semibold mb-4">Suivi des paiements</h1>
        {loading ? (
          <p className="text-center text-gray-400 py-8">Chargement...</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Aucun paiement configuré</p>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((g: any) => (
              <div key={`${g.year}-${g.month}`} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête mois */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-sm">{g.label}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.allPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {g.allPaid ? "✓ Tout payé" : `${g.totalPaid.toFixed(0)} / ${g.total.toFixed(0)} DT`}
                    </span>
                  </div>
                  {/* Bouton paiement mensuel en un clic */}
                  {!g.allPaid && (
                    <button
                      onClick={() => markMonthPaid(g.month, g.year)}
                      disabled={paying === `${g.year}-${g.month}`}
                      className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {paying === `${g.year}-${g.month}` ? "..." : `✓ Tout payer (${(g.total - g.totalPaid).toFixed(0)} DT)`}
                    </button>
                  )}
                </div>
                {/* Détail paiements */}
                <div className="divide-y divide-gray-100">
                  {g.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-600 flex-1">{p.description}</span>
                      <span className="font-medium w-24 text-right">{p.amount} DT</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full mx-3 w-20 text-center ${statusStyle[p.status] || ""}`}>
                        {statusLabel[p.status] || p.status}
                      </span>
                      {p.status !== "paid" && (
                        <button
                          onClick={() => markOnePaid(p.id)}
                          disabled={paying === p.id}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          {paying === p.id ? "..." : "Marquer payé"}
                        </button>
                      )}
                      {p.status === "paid" && p.paid_date && (
                        <span className="text-xs text-gray-400">
                          {new Date(p.paid_date).toLocaleDateString("fr-TN")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
