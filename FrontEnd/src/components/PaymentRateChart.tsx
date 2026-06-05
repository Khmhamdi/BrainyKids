'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Image from 'next/image';
import { payments } from '@/lib/api';

const COLORS = {
  paid:    '#10b981', // green-500
  pending: '#f59e0b', // amber-500
  overdue: '#ef4444', // red-500
};

const PaymentRateChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payments.treasury()
      .then((treasury) => {
        setStats(treasury);
        setData([
          { name: 'Payé',      value: treasury.totalRevenue || 0,   color: COLORS.paid },
          { name: 'En attente', value: treasury.pendingAmount || 0,  color: COLORS.pending },
          { name: 'En retard',  value: treasury.overdueAmount || 0,  color: COLORS.overdue },
        ].filter(d => d.value > 0)); // Ne montrer que les catégories non-nulles
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-2xl w-full h-full p-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-lg font-semibold">Taux de paiement</h1>
          {stats && (
            <p className="text-xs text-gray-500 mt-1">
              Total à recevoir : {fmt(total)} DT
            </p>
          )}
        </div>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-BKprimary" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
          Aucune donnée de paiement
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `${fmt(Number(value))} DT`}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Légende détaillée */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {data.map((d) => {
              const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={d.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-medium text-gray-600">{d.name}</span>
                  </div>
                  <p className="text-sm font-bold" style={{ color: d.color }}>{fmt(d.value)} DT</p>
                  <p className="text-xs text-gray-400">{percent}%</p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentRateChart;
