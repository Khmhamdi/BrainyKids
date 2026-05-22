'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import { payments } from '@/lib/api';

const MOIS = ['Jan','Fév','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];

const FinanceChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([payments.treasury(), payments.list(1)])
      .then(([treasury, paymentList]) => {
        setStats(treasury);
        // Regrouper par mois
        const monthly: Record<number, { recettes: number; depenses: number }> = {};
        MOIS.forEach((_, i) => { monthly[i] = { recettes: 0, depenses: 0 }; });

        (paymentList.data || []).forEach((p: any) => {
          const m = new Date(p.paid_date || p.due_date).getMonth();
          if (p.status === 'paid') monthly[m].recettes += p.amount;
          else monthly[m].depenses += p.amount;
        });

        setData(MOIS.map((name, i) => ({ name, ...monthly[i] })));
      })
      .catch(() => {
        setData(MOIS.map(name => ({ name, recettes: 0, depenses: 0 })));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 h-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-lg font-semibold">Trésorerie</h1>
          {stats && (
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">
                Recettes : {stats.totalRevenue.toLocaleString('fr-TN')} DT
              </span>
              <span className="text-orange-500 font-medium">
                En attente : {stats.pendingAmount.toLocaleString('fr-TN')} DT
              </span>
              {stats.overdueCount > 0 && (
                <span className="text-red-500 font-medium">
                  Impayés : {stats.overdueCount}
                </span>
              )}
            </div>
          )}
        </div>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[80%]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-BKprimary" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tick={{ fill: '#d1d5db', fontSize: 11 }} tickLine={false} />
            <YAxis axisLine={false} tick={{ fill: '#d1d5db', fontSize: 11 }} tickLine={false} />
            <Tooltip contentStyle={{ borderColor: '#e5e7eb', borderRadius: '10px' }} />
            <Legend align="center" verticalAlign="top" wrapperStyle={{ paddingTop: '10px', paddingBottom: '30px' }} />
            <Line type="monotone" dataKey="recettes" name="Recettes" stroke="#1DA1F2" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="depenses" name="Dépenses" stroke="#FAE27C" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FinanceChart;
