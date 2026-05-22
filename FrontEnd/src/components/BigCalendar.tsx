"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import { calendarEvents } from "@/lib/data";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalendar = () => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  
  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Hauteur fixe quelle que soit la vue
  return (
    <div className="w-full h-[600px] lg:h-[700px]"> {/* ← Hauteur fixe */}
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        views={["month", "work_week", "day"]}
        view={view}
        min={new Date(2025, 9, 22, 7, 0)}
        max={new Date(2025, 9, 22, 18, 0)}
        onView={handleOnChangeView}
      />
    </div>
  );
};

export default BigCalendar;