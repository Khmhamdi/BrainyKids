'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';
import { dashboard } from '@/lib/api';

const AttendanceChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.attendanceChart()
      .then(setData)
      .catch(() => setData([
        { name: 'Lun', presents: 45, absents: 5 },
        { name: 'Mar', presents: 48, absents: 2 },
        { name: 'Mer', presents: 44, absents: 6 },
        { name: 'Jeu', presents: 46, absents: 4 },
        { name: 'Ven', presents: 43, absents: 7 },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl w-full h-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">Présences / Absences</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-BKprimary" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} barSize={20} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="presents" name="Présents" fill="#1DA1F2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absents"  name="Absents"  fill="#FAE27C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AttendanceChart;
