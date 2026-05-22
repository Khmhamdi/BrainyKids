'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Announcements from '@/components/Announcements';
import EventCalendar from '@/components/EventCalendar';
import { myParent } from '@/lib/api';

const AbsenceBadge = ({ count }: { count: number }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${count === 0 ? 'bg-green-100 text-green-700' : count < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
    {count} absence{count !== 1 ? 's' : ''}
  </span>
);

const ParentPage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    myParent.profile()
      .then(setProfile)
      .catch(() => setError('Impossible de charger vos informations'))
      .finally(() => setLoading(false));
  }, []);

  const children = profile?.student_parents?.map((sp: any) => sp.student) || [];
  const pendingPayments = profile?.payments?.filter((p: any) => p.status === 'pending') || [];

  return (
    <AuthGuard allowedRoles={['parent', 'administrator']}>
      <div className="p-4 flex gap-4 flex-col xl:flex-row">
        {/* LEFT */}
        <div className="w-full xl:w-2/3 flex flex-col gap-6">

          {/* Résumé parent */}
          {loading && (
            <div className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">{error}</div>
          )}

          {profile && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h1 className="text-lg font-semibold text-gray-800 mb-1">
                Bienvenue, {profile.user?.full_name}
              </h1>
              <p className="text-sm text-gray-500">{profile.email} · {profile.phone}</p>
            </div>
          )}

          {/* Mes enfants */}
          <div>
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              Mes enfants ({children.length})
            </h2>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!loading && children.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
                Aucun enfant inscrit pour le moment
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((child: any) => {
                const absenceCount = child.absences?.length || 0;
                const age = child.date_of_birth
                  ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
                  : null;

                return (
                  <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{child.full_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {age ? `${age} ans` : ''} · {child.grade || 'N/A'}
                        </p>
                      </div>
                      <AbsenceBadge count={absenceCount} />
                    </div>

                    {/* Classe */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span className="text-gray-400">📚</span>
                      <span>Classe : <strong>{child.class?.name || 'N/A'}</strong></span>
                    </div>

                    {/* Enseignante */}
                    {child.class?.teacher?.user && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="text-gray-400">👩‍🏫</span>
                        <span>Éducatrice : <strong>{child.class.teacher.user.full_name}</strong></span>
                      </div>
                    )}

                    {/* Clubs */}
                    {child.club_memberships?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {child.club_memberships.map((cm: any) => (
                          <span key={cm.id} className="text-xs bg-BKskyLight text-BKprimary px-2 py-0.5 rounded-full">
                            {cm.club?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dernières absences */}
                    {child.absences?.slice(0, 2).map((a: any) => (
                      <div key={a.id} className="text-xs text-gray-400 mt-1">
                        ⚠️ Absence le {new Date(a.date).toLocaleDateString('fr-TN')}
                        {a.excused ? ' (justifiée)' : ' (non justifiée)'}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Paiements en attente */}
          {pendingPayments.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-700 mb-3">
                Paiements en attente ({pendingPayments.length})
              </h2>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-right px-4 py-3">Montant</th>
                      <th className="text-right px-4 py-3">Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((p: any) => (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{p.description || p.type}</td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">
                          {p.amount?.toLocaleString('fr-TN')} DT
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {new Date(p.due_date).toLocaleDateString('fr-TN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </AuthGuard>
  );
};

export default ParentPage;
