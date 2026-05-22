'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { dashboard } from '@/lib/api';

const CARD_CONFIG: Record<string, { label: string; icon: string }> = {
  student:  { label: 'Enfants',      icon: '/student.png' },
  teacher:  { label: 'Éducatrices',  icon: '/teacher.png' },
  parent:   { label: 'Parents',      icon: '/parent.png'  },
  staff:    { label: 'Personnel',    icon: '/staff.png'   },
};

const UserCard = ({ type }: { type: 'student' | 'teacher' | 'parent' | 'staff' }) => {
  const [count, setCount] = useState<number | null>(null);
  const config = CARD_CONFIG[type];

  useEffect(() => {
    dashboard.stats()
      .then((stats) => {
        const map: Record<string, number> = {
          student: stats.students,
          teacher: stats.teachers,
          parent:  stats.parents,
          staff:   stats.teachers,
        };
        setCount(map[type] ?? 0);
      })
      .catch(() => setCount(0));
  }, [type]);

  return (
    <div className="rounded-2xl odd:bg-BKprimary even:bg-BKyellow p-4 flex-1 min-w-[130px] flex flex-col gap-2">
      <div className="flex justify-between items-center w-full">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025/2026
        </span>
        <Image src="/more.png" alt="" width={20} height={20} />
      </div>

      {count === null ? (
        <div className="h-8 w-16 bg-white/30 rounded animate-pulse my-1" />
      ) : (
        <h1 className="text-2xl font-semibold my-1">{count.toLocaleString('fr-TN')}</h1>
      )}

      <h2 className="capitalize font-medium text-gray-500 text-sm">
        {config.label}
      </h2>
    </div>
  );
};

export default UserCard;
