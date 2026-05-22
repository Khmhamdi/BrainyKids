"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calendar } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { events as eventsApi } from "@/lib/api";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const EventCalendar = () => {
  const [value, onChange] = useState<Value>(new Date());
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.list()
      .then(setAllEvents)
      .catch(() => setAllEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Filtrer les événements du jour sélectionné
  const selectedDate = Array.isArray(value) ? value[0] : value;
  const todayEvents = allEvents.filter(e => {
    if (!selectedDate) return false;
    const d = new Date(e.event_date);
    return d.getDate() === selectedDate.getDate() &&
           d.getMonth() === selectedDate.getMonth() &&
           d.getFullYear() === selectedDate.getFullYear();
  });

  // Événements à venir (3 prochains)
  const upcomingEvents = allEvents
    .filter(e => new Date(e.event_date) >= new Date())
    .slice(0, 3);

  const displayEvents = todayEvents.length > 0 ? todayEvents : upcomingEvents;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' });

  // Marquer les jours qui ont des événements
  const tileClassName = ({ date }: { date: Date }) => {
    const hasEvent = allEvents.some(e => {
      const d = new Date(e.event_date);
      return d.getDate() === date.getDate() &&
             d.getMonth() === date.getMonth() &&
             d.getFullYear() === date.getFullYear();
    });
    return hasEvent ? 'has-event' : null;
  };

  return (
    <div className="bg-white rounded-md p-4">
      <Calendar
        onChange={onChange}
        value={value}
        locale="fr-FR"
        tileClassName={tileClassName}
      />

      <style>{`
        .has-event abbr { background: #1DA1F2; color: white; border-radius: 50%; padding: 2px 4px; }
      `}</style>

      <div className="flex flex-col gap-4 mt-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold">Événements</h1>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-md p-4 border-2 border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!loading && displayEvents.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            Aucun événement
          </p>
        )}

        {!loading && displayEvents.map((event, i) => (
          <div
            key={event.id}
            className="border-gray-100 p-5 border-t-4 rounded-md border-2 odd:border-t-BKprimary even:border-t-BKyellow"
          >
            <div className="flex items-center justify-between">
              <h1 className="font-semibold text-gray-600 text-sm line-clamp-1">{event.name}</h1>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                {formatTime(event.event_date)}
              </span>
            </div>
            <p className="mt-1 text-gray-400 text-xs line-clamp-2">{event.description}</p>
            {event.location && (
              <p className="mt-1 text-xs text-BKprimary">📍 {event.location}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendar;
