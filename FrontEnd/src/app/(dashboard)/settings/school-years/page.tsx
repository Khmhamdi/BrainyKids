'use client';
import { useEffect, useState, useCallback } from 'react';
import { schoolYears as api } from '@/lib/api';
import AuthGuard from '@/components/AuthGuard';

const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
const lCls = 'text-xs font-medium text-gray-600 mb-1 block';

/* ── Modal Création/Édition ────────────────────────────────────── */
function YearModal({ year, onClose, onSuccess }: { year?: any; onClose: () => void; onSuccess: () => void }) {
  const [label, setLabel] = useState(year?.label || '');
  const [startDate, setStartDate] = useState(year?.start_date ? year.start_date.split('T')[0] : '');
  const [endDate, setEndDate] = useState(year?.end_date ? year.end_date.split('T')[0] : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !startDate || !endDate) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (year) {
        await api.update(year.id, { label, start_date: startDate, end_date: endDate });
      } else {
        await api.create({ label, start_date: startDate, end_date: endDate });
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-t-2xl px-6 py-4">
          <h3 className="text-white font-bold text-lg">
            {year ? 'Modifier l\'année scolaire' : 'Nouvelle année scolaire'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className={lCls}>Libellé (ex: 2026-2027)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              className={iCls} placeholder="2026-2027" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls}>Date de début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={iCls} />
            </div>
            <div>
              <label className={lCls}>Date de fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={iCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {saving ? 'Enregistrement...' : year ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Page principale ────────────────────────────────────────────── */
export default function SchoolYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.list();
      setYears(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetCurrent = async (id: string) => {
    if (!confirm('Définir cette année comme année courante ?')) return;
    await api.setCurrent(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette année scolaire ?')) return;
    try {
      await api.delete(id);
      load();
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la suppression');
    }
  };

  const handleEdit = (year: any) => {
    setEditingYear(year);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingYear(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingYear(null);
  };

  return (
    <AuthGuard>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Années scolaires</h1>
            <p className="text-gray-500 text-sm mt-1">Gestion des années scolaires et année courante</p>
          </div>
          <button onClick={handleNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            ➕ Nouvelle année
          </button>
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : years.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📅</div>
            <p>Aucune année scolaire</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Année</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Début</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Fin</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {years.map(y => (
                  <tr key={y.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800">{y.label}</span>
                      {y.is_current && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
                          ✓ Courante
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(y.start_date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(y.end_date).toLocaleDateString('fr-TN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {y.is_active ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        {!y.is_current && (
                          <button onClick={() => handleSetCurrent(y.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700">
                            Définir courante
                          </button>
                        )}
                        <button onClick={() => handleEdit(y)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                          Modifier
                        </button>
                        <button onClick={() => handleDelete(y.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <YearModal year={editingYear} onClose={handleModalClose} onSuccess={load} />}
    </AuthGuard>
  );
}
