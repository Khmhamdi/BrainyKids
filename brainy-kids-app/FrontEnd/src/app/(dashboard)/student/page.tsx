import Announcements from "@/components/Announcements"
import BigCalendar from "@/components/BigCalendar"
import EventCalendar from "@/components/EventCalendar"

const StudentPage = () => {
  return (
    <div className="p-4 flex gap-4 flex-col xl:flex-row min-h-[calc(100vh-80px)]"> {/* ← Ajoutez min-height */}
      {/* LEFT */}
      <div className="w-full xl:w-2/3 flex flex-col gap-8">
        <div className="flex-1 bg-white p-4 rounded-md flex flex-col"> {/* ← flex-1 au lieu de h-full */}
          <h1 className="text-xl font-semibold mb-4">Emploi du temps Classe 5 ans</h1>
          <div className="flex-1"> {/* ← Nouveau conteneur flexible */}
            <BigCalendar />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-8">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  )
}

export default StudentPage