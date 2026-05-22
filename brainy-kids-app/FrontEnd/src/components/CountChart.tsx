"use client";

import { useEffect, useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import Image from "next/image";
import { dashboard } from "@/lib/api";

const CountChart = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    dashboard.genderStats()
      .then(setStats)
      .catch(() => setStats({ total: 0, boys: 0, girls: 0, boysPercent: 0, girlsPercent: 0 }));
  }, []);

  const data = [
    { name: "Total",   count: stats?.total || 0, fill: "white" },
    { name: "Filles",  count: stats?.girls || 0, fill: "#FAE27C" },
    { name: "Garçons", count: stats?.boys  || 0, fill: "#1DA1F2" },
  ];

  return (
    <div className="bg-white rounded-2xl w-full h-full p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Élèves</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />
      </div>

      <div className="relative w-full h-[75%]">
        {!stats ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-BKprimary" />
          </div>
        ) : (
          <ResponsiveContainer>
            <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={20} data={data}>
              <RadialBar background dataKey="count" />
            </RadialBarChart>
          </ResponsiveContainer>
        )}
        <Image
          src="/maleFemale.png" alt="" width={50} height={50}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="flex justify-center gap-16">
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-BKprimary rounded-full" />
          <h1 className="font-bold">{stats?.boys ?? '—'}</h1>
          <h2 className="text-sm text-gray-300">Garçons ({stats?.boysPercent ?? 0}%)</h2>
        </div>
        <div className="flex flex-col gap-1">
          <div className="w-5 h-5 bg-BKyellow rounded-full" />
          <h1 className="font-bold">{stats?.girls ?? '—'}</h1>
          <h2 className="text-sm text-gray-300">Filles ({stats?.girlsPercent ?? 0}%)</h2>
        </div>
      </div>
    </div>
  );
};

export default CountChart;
