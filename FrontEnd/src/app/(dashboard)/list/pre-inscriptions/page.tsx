'use client';
import { useEffect, useState, useCallback } from 'react';
import { preRegistrations as api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approuvée',   color: 'bg-green-100  text-green-800'  },
  rejected: { label: 'Refusée',     color: 'bg-red-100    text-red-800'    },
};

const CLASS_LABELS: Record<string, string> = {
  PS: 'Petite Section (3 ans)',
  MS: 'Moyenne Section (4 ans)',
  GS: 'Grande Section (5 ans)',
};

function RejectModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 mb-3">Motif de refus</h3>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
          rows={3}
          placeholder="Expliquer le motif du refus (optionnel)..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreInscriptionsPage() {
  const [list,    setList]    = useState<any[]>([]);
  const [stats,   setStats]   = useState<any>(null);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        api.list(filter === 'all' ? undefined : filter),
        api.stats(),
      ]);
      setList(data);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approuver cette demande de pré-inscription ?')) return;
    await api.approve(id);
    load();
  };

  const handleReject = async (reason: string) => {
    if (!rejectId) return;
    await api.reject(rejectId, reason);
    setRejectId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    await api.remove(id);
    load();
  };

  const filters = [
    { key: 'all',      label: 'Toutes',     count: stats?.total    ?? 0 },
    { key: 'pending',  label: 'En attente', count: stats?.pending  ?? 0 },
    { key: 'approved', label: 'Approuvées', count: stats?.approved ?? 0 },
    { key: 'rejected', label: 'Refusées',   count: stats?.rejected ?? 0 },
  ];

  return (
    <AuthGuard>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pré-inscriptions</h1>
            <p className="text-gray-500 text-sm mt-1">Demandes reçues en ligne</p>
          </div>
          <a
            href="/pre-inscription"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Formulaire public
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total',       value: stats.total,    color: 'bg-gray-50    border-gray-200',   text: 'text-gray-700'   },
              { label: 'En attente',  value: stats.pending,  color: 'bg-yellow-50  border-yellow-200', text: 'text-yellow-700' },
              { label: 'Approuvées',  value: stats.approved, color: 'bg-green-50   border-green-200',  text: 'text-green-700'  },
              { label: 'Refusées',    value: stats.rejected, color: 'bg-red-50     border-red-200',    text: 'text-red-700'    },
            ].map(s => (
              <div key={s.label} className={`${s.color} border rounded-xl p-4 text-center`}>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label} {f.count > 0 && <span className="ml-1 opacity-75">({f.count})</span>}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aucune demande {filter !== 'all' ? `"${STATUS_LABELS[filter]?.label}"` : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(r => {
              const st = STATUS_LABELS[r.status] ?? STATUS_LABELS['pending'];
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Row header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {r.child_full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{r.child_full_name}</p>
                        <p className="text-xs text-gray-500">
                          {CLASS_LABELS[r.desired_class] ?? r.desired_class} · {r.school_year} · {r.parent_full_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(r.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Détails */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                        <div><span className="text-gray-500">Enfant :</span> <span className="font-medium">{r.child_full_name}</span> ({r.gender === 'M' ? 'Garçon' : 'Fille'})</div>
                        <div><span className="text-gray-500">Naissance :</span> <span className="font-medium">{new Date(r.date_of_birth).toLocaleDateString('fr-TN')}</span></div>
                        <div><span className="text-gray-500">Section :</span> <span className="font-medium">{CLASS_LABELS[r.desired_class] ?? r.desired_class}</span></div>
                        <div><span className="text-gray-500">Année :</span> <span className="font-medium">{r.school_year}</span></div>
                        <div><span className="text-gray-500">Parent :</span> <span className="font-medium">{r.parent_full_name}</span> ({r.parent_relation === 'father' ? 'Père' : r.parent_relation === 'mother' ? 'Mère' : 'Tuteur'})</div>
                        <div><span className="text-gray-500">Téléphone :</span> <a href={`tel:${r.parent_phone}`} className="font-medium text-blue-600 hover:underline">{r.parent_phone}</a></div>
                        <div className="sm:col-span-2"><span className="text-gray-500">Email :</span> <a href={`mailto:${r.parent_email}`} className="font-medium text-blue-600 hover:underline">{r.parent_email}</a></div>
                        {r.message && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Message :</span>
                            <p className="mt-1 text-gray-700 bg-white rounded-lg p-3 border border-gray-200 text-sm">{r.message}</p>
                          </div>
                        )}
                        {r.status === 'rejected' && r.rejection_reason && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Motif de refus :</span>
                            <p className="mt-1 text-red-700 bg-red-50 rounded-lg p-3 border border-red-100 text-sm">{r.rejection_reason}</p>
                          </div>
                        )}
                        {r.processed_at && (
                          <div className="sm:col-span-2 text-xs text-gray-400">
                            Traité le {new Date(r.processed_at).toLocaleDateString('fr-TN')} par {r.processed_by}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => setRejectId(r.id)}
                              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                            >
                              ✕ Refuser
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectId && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectId(null)}
        />
      )}
    </AuthGuard>
  );
}
