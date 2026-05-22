'use client';

import { useEffect, useState } from 'react';
import { announcements as announcementsApi } from '@/lib/api';

const BG_COLORS = ['bg-BKskyLight', 'bg-BKPurpleLight', 'bg-BKyellowLight', 'bg-pink-50', 'bg-green-50'];

const Announcements = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    announcementsApi.list()
      .then(data => setItems(data.slice(0, 3)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Annonces</h1>
        <span className="text-xs text-gray-400 cursor-pointer hover:text-BKprimary">Voir toutes</span>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {loading && (
          <>
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-100 rounded-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </>
        )}

        {!loading && items.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">Aucune annonce pour le moment</p>
        )}

        {!loading && items.map((item, idx) => (
          <div key={item.id} className={`${BG_COLORS[idx % BG_COLORS.length]} rounded-md p-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold line-clamp-1">{item.name}</h2>
              <span className="text-xs text-gray-400 bg-white rounded px-1 py-0.5 ml-2 shrink-0">
                {formatDate(item.event_date)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
