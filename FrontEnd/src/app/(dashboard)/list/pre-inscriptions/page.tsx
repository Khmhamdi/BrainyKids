'use client';
import { useEffect, useState, useCallback } from 'react';
import { preRegistrations as api, classes as classesApi, schedules as schedulesApi } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

/* ── Constantes ─────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Approuvée',   color: 'bg-green-100  text-green-800  border-green-200'  },
  rejected: { label: 'Refusée',     color: 'bg-red-100    text-red-800    border-red-200'    },
};
const CLASS_LABELS: Record<string, string> = { PS: 'Petite Section', MS: 'Moyenne Section', GS: 'Grande Section' };
const PACK_TYPES = ['mensuel', 'trimestriel', 'annuel'];
const TRANSPORT  = ['parent', 'bus', 'autre'];

/* ── Modal refus ────────────────────────────────────────────── */
function RejectModal({ onConfirm, onClose }: { onConfirm: (r: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 mb-1">Motif de refus</h3>
        <p className="text-sm text-gray-500 mb-4">Expliquez le motif (optionnel)</p>
        <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
          rows={3} placeholder="Ex : Classe complète, dossier incomplet..." value={reason} onChange={e => setReason(e.target.value)} />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Annuler</button>
          <button onClick={() => onConfirm(reason)} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Confirmer le refus</button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal approbation scolarité ────────────────────────────── */
function ApproveScolariteModal({ reg, onConfirm, onClose }: { reg: any; onConfirm: (dto: any) => void; onClose: () => void }) {
  const [classes,   setClasses]   = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [form, setForm] = useState({
    class_id:       '',
    schedule_id:    '',
    monthly_fee:    '',
    pack_type:      'mensuel',
    transport_mode: 'parent',
    gender:         reg.gender ?? 'M',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    Promise.all([classesApi.list(), schedulesApi.list()])
      .then(([cls, sch]) => { setClasses(cls); setSchedules(sch); });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.class_id) { setError('Sélectionnez une classe.'); return; }
    if (!form.monthly_fee || isNaN(+form.monthly_fee)) { setError('Saisissez un tarif mensuel valide.'); return; }
    setSaving(true); setError('');
    try {
      await onConfirm({ ...form, monthly_fee: parseFloat(form.monthly_fee) });
    } catch (e: any) { setError(e.message || 'Erreur'); setSaving(false); }
  };

  const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-t-2xl px-6 py-4">
          <h3 className="text-white font-bold text-lg">✓ Approuver — Scolarité</h3>
          <p className="text-green-100 text-sm mt-0.5">{reg.child_full_name} · {CLASS_LABELS[reg.desired_class] ?? reg.desired_class}</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            En approuvant, un dossier élève sera créé et ajouté à la liste des enfants inscrits.
          </p>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Genre</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} className={iCls}>
                <option value="M">Garçon</option>
                <option value="F">Fille</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Classe *</label>
              <select value={form.class_id} onChange={e => set('class_id', e.target.value)} className={iCls}>
                <option value="">— Sélectionner —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.age_group})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Emploi du temps</label>
              <select value={form.schedule_id} onChange={e => set('schedule_id', e.target.value)} className={iCls}>
                <option value="">— Aucun —</option>
                {schedules.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transport</label>
              <select value={form.transport_mode} onChange={e => set('transport_mode', e.target.value)} className={iCls}>
                {TRANSPORT.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tarif mensuel (DT) *</label>
              <input type="number" min="0" step="0.5" value={form.monthly_fee}
                onChange={e => set('monthly_fee', e.target.value)} className={iCls} placeholder="Ex: 150" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de pack</label>
              <select value={form.pack_type} onChange={e => set('pack_type', e.target.value)} className={iCls}>
                {PACK_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={submit} disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Création en cours...' : '✓ Créer le dossier élève'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Modal approbation club d'été ───────────────────────────── */
function ApproveClubEteModal({ reg, onConfirm, onClose }: { reg: any; onConfirm: () => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const submit = async () => { setSaving(true); await onConfirm(); };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-t-2xl px-6 py-4">
          <h3 className="text-white font-bold text-lg">✓ Approuver — Club d'été</h3>
          <p className="text-orange-100 text-sm mt-0.5">{reg.child_full_name}</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
            Cette demande sera marquée comme approuvée. La gestion des frais d'inscription clubs d'été se fera ultérieurement.
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            <p><span className="font-medium">Enfant :</span> {reg.child_full_name}</p>
            <p><span className="font-medium">Statut :</span> {reg.is_internal ? '🏫 Élève inscrit (interne)' : '👤 Enfant extérieur'}</p>
            <p><span className="font-medium">Parent :</span> {reg.parent_full_name} · {reg.parent_phone}</p>
            {reg.message && <p><span className="font-medium">Clubs souhaités :</span> {reg.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
            <button onClick={submit} disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {saving ? 'En cours...' : '✓ Confirmer l\'approbation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page principale ────────────────────────────────────────── */
export default function PreInscriptionsPage() {
  const [list,       setList]       = useState<any[]>([]);
  const [stats,      setStats]      = useState<any>(null);
  const [filter,     setFilter]     = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [rejectId,   setRejectId]   = useState<string | null>(null);
  const [approveReg, setApproveReg] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([
        api.list(filter === 'all' ? undefined : filter, typeFilter === 'all' ? undefined : typeFilter),
        api.stats(),
      ]);
      setList(data);
      setStats(s);
    } finally { setLoading(false); }
  }, [filter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = (reg: any) => setApproveReg(reg);

  const confirmApproveScolarite = async (dto: any) => {
    await api.approveScolarite(approveReg.id, dto);
    setApproveReg(null);
    load();
  };

  const confirmApproveClubEte = async () => {
    await api.approve(approveReg.id);
    setApproveReg(null);
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

  const statusFilters = [
    { key: 'all', label: 'Tous statuts', count: stats?.total ?? 0 },
    { key: 'pending',  label: '⏳ En attente', count: stats?.pending  ?? 0 },
    { key: 'approved', label: '✓ Approuvées',  count: stats?.approved ?? 0 },
    { key: 'rejected', label: '✕ Refusées',    count: stats?.rejected ?? 0 },
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
          <div className="flex gap-2">
            <a href="/pre-inscription" target="_blank"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
              🏫 Scolarité
            </a>
            <a href="/clubs-ete" target="_blank"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
              ☀️ Clubs d'été
            </a>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: 'Total',       value: stats.total,     bg: 'bg-gray-50    border-gray-200',   txt: 'text-gray-700'   },
              { label: 'En attente',  value: stats.pending,   bg: 'bg-yellow-50  border-yellow-200', txt: 'text-yellow-700' },
              { label: 'Approuvées',  value: stats.approved,  bg: 'bg-green-50   border-green-200',  txt: 'text-green-700'  },
              { label: 'Refusées',    value: stats.rejected,  bg: 'bg-red-50     border-red-200',    txt: 'text-red-700'    },
              { label: 'Scolarité',   value: stats.scolarite, bg: 'bg-blue-50    border-blue-200',   txt: 'text-blue-700'   },
              { label: 'Clubs d\'été',value: stats.club_ete,  bg: 'bg-orange-50  border-orange-200', txt: 'text-orange-700' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} border rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${s.txt}`}>{s.value ?? 0}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtres type + statut */}
        <div className="flex flex-wrap gap-2 mb-2">
          {[{ key: 'all', label: 'Tous types' }, { key: 'scolarite', label: '🏫 Scolarité' }, { key: 'club_ete', label: '☀️ Clubs d\'été' }].map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                typeFilter === f.key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>{f.label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}>
              {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Aucune demande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(r => {
              const st = STATUS[r.status] ?? STATUS['pending'];
              const isClub = (r.type ?? 'scolarite') === 'club_ete';
              const isOpen = expanded === r.id;
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpanded(isOpen ? null : r.id)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isClub ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.child_full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800 truncate">{r.child_full_name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${isClub ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                            {isClub ? '☀️ Club d\'été' : '🏫 Scolarité'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {isClub ? `${r.is_internal ? 'Interne' : 'Externe'} · ` : `${CLASS_LABELS[r.desired_class] ?? r.desired_class} · `}
                          {r.parent_full_name} · {r.parent_phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${st.color}`}>{st.label}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(r.created_at).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short' })}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
                        <div><span className="text-gray-500">Enfant :</span> <span className="font-medium">{r.child_full_name}</span></div>
                        <div><span className="text-gray-500">Naissance :</span> <span className="font-medium">{new Date(r.date_of_birth).toLocaleDateString('fr-TN')}</span></div>
                        {!isClub && <>
                          <div><span className="text-gray-500">Section :</span> <span className="font-medium">{CLASS_LABELS[r.desired_class] ?? r.desired_class}</span></div>
                          <div><span className="text-gray-500">Année :</span> <span className="font-medium">{r.school_year}</span></div>
                        </>}
                        {isClub && <div><span className="text-gray-500">Statut :</span> <span className="font-medium">{r.is_internal ? 'Élève inscrit (interne)' : 'Enfant extérieur'}</span></div>}
                        <div><span className="text-gray-500">Parent :</span> <span className="font-medium">{r.parent_full_name}</span></div>
                        <div><span className="text-gray-500">Tél :</span> <a href={`tel:${r.parent_phone}`} className="font-medium text-blue-600 hover:underline">{r.parent_phone}</a></div>
                        {r.parent_cin     && <div><span className="text-gray-500">CIN :</span> <span className="font-medium">{r.parent_cin}</span></div>}
                        {r.parent_address && <div className="sm:col-span-2"><span className="text-gray-500">Adresse :</span> <span className="font-medium">{r.parent_address}</span></div>}
                        {r.message && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">{isClub ? 'Clubs souhaités :' : 'Message :'}</span>
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

                      <div className="flex gap-2 flex-wrap">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(r)}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                              ✓ Approuver {isClub ? '& confirmer' : '& créer le dossier'}
                            </button>
                            <button onClick={() => setRejectId(r.id)}
                              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">
                              ✕ Refuser
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(r.id)}
                          className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-sm">
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

      {/* Modals */}
      {rejectId && <RejectModal onConfirm={handleReject} onClose={() => setRejectId(null)} />}
      {approveReg && (approveReg.type ?? 'scolarite') === 'scolarite' && (
        <ApproveScolariteModal reg={approveReg} onConfirm={confirmApproveScolarite} onClose={() => setApproveReg(null)} />
      )}
      {approveReg && (approveReg.type ?? 'scolarite') === 'club_ete' && (
        <ApproveClubEteModal reg={approveReg} onConfirm={confirmApproveClubEte} onClose={() => setApproveReg(null)} />
      )}
    </AuthGuard>
  );
}
