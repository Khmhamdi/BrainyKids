import AuthGuard from '@/components/AuthGuard';
import Announcements from '@/components/Announcements';
import AttendanceChart from '@/components/AttendanceChart';
import CountChart from '@/components/CountChart';
import EventCalendar from '@/components/EventCalendar';
import FinanceChart from '@/components/FinanceChart';
import PaymentRateChart from '@/components/PaymentRateChart';
import UserCard from '@/components/UserCard';

const AdminPage = () => {
  return (
    <AuthGuard allowedRoles={['administrator']}>
      <div className="p-4 flex gap-4 flex-col md:flex-row">
        {/* LEFT */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Cards - Stats rapides */}
          <div className="flex gap-4 justify-between flex-wrap">
            <UserCard type="student" />
            <UserCard type="teacher" />
            <UserCard type="parent" />
            <UserCard type="staff" />
          </div>

          {/* Ligne 1 : Répartition élèves + Taux de paiement + Présences */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-[400px]">
              <CountChart />
            </div>
            <div className="h-[400px]">
              <PaymentRateChart />
            </div>
            <div className="h-[400px] lg:col-span-1">
              <AttendanceChart />
            </div>
          </div>

          {/* Graph Finance (trésorerie mensuelle) */}
          <div className="w-full h-[450px]">
            <FinanceChart />
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPage;
