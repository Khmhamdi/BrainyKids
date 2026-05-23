'use client';
import { useState } from 'react';
import { preRegistrations } from '@/lib/api';

const CURRENT_YEAR = '2025-2026';
const NEXT_YEAR    = '2026-2027';

const input = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const label = "block text-sm font-medium text-gray-700 mb-1";

export default function PreInscriptionPage() {
  const [form, setForm] = useState({
    child_full_name:  '',
    date_of_birth:    '',
    gender:           'M',
    desired_class:    'PS',
    school_year:      NEXT_YEAR,
    parent_full_name: '',
    parent_phone:     '',
    parent_email:     '',
    parent_relation:  'father',
    message:          '',
  });
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.child_full_name || !form.date_of_birth || !form.parent_full_name || !form.parent_phone || !form.parent_email) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await preRegistrations.submit(form);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Demande envoyée !</h2>
          <p className="text-gray-600 mb-2">
            Votre demande de pré-inscription pour <strong>{form.child_full_name}</strong> a bien été reçue.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Notre équipe vous contactera dans les plus brefs délais au <strong>{form.parent_phone}</strong>.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ child_full_name: '', date_of_birth: '', gender: 'M', desired_class: 'PS', school_year: NEXT_YEAR, parent_full_name: '', parent_phone: '', parent_email: '', parent_relation: 'father', message: '' }); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-3xl font-bold text-gray-800">Brainy Kids</h1>
          <p className="text-gray-500 mt-1">Demande de pré-inscription en ligne</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5">
            <h2 className="text-white text-xl font-semibold">Formulaire de pré-inscription</h2>
            <p className="text-blue-100 text-sm mt-1">Année scolaire {form.school_year}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Section enfant */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
                Informations de l'enfant
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={label}>Nom complet de l'enfant <span className="text-red-500">*</span></label>
                  <input className={input} value={form.child_full_name} onChange={e => set('child_full_name', e.target.value)} placeholder="Ex : Sami Ben Ali" required />
                </div>
                <div>
                  <label className={label}>Date de naissance <span className="text-red-500">*</span></label>
                  <input type="date" className={input} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} required />
                </div>
                <div>
                  <label className={label}>Genre</label>
                  <select className={input} value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="M">Garçon</option>
                    <option value="F">Fille</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Section souhaitée <span className="text-red-500">*</span></label>
                  <select className={input} value={form.desired_class} onChange={e => set('desired_class', e.target.value)}>
                    <option value="PS">Petite Section — 3 ans</option>
                    <option value="MS">Moyenne Section — 4 ans</option>
                    <option value="GS">Grande Section — 5 ans</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Année scolaire</label>
                  <select className={input} value={form.school_year} onChange={e => set('school_year', e.target.value)}>
                    <option value={CURRENT_YEAR}>{CURRENT_YEAR} (en cours)</option>
                    <option value={NEXT_YEAR}>{NEXT_YEAR} (prochaine)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section parent */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
                Informations du parent / tuteur
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={label}>Nom complet <span className="text-red-500">*</span></label>
                  <input className={input} value={form.parent_full_name} onChange={e => set('parent_full_name', e.target.value)} placeholder="Ex : Khaled Ben Ali" required />
                </div>
                <div>
                  <label className={label}>Téléphone <span className="text-red-500">*</span></label>
                  <input type="tel" className={input} value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="Ex : 20 000 000" required />
                </div>
                <div>
                  <label className={label}>Email <span className="text-red-500">*</span></label>
                  <input type="email" className={input} value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="email@exemple.com" required />
                </div>
                <div>
                  <label className={label}>Relation avec l'enfant</label>
                  <select className={input} value={form.parent_relation} onChange={e => set('parent_relation', e.target.value)}>
                    <option value="father">Père</option>
                    <option value="mother">Mère</option>
                    <option value="guardian">Tuteur légal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={label}>Message / Informations complémentaires</label>
              <textarea
                className={input + ' resize-none'}
                rows={3}
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Allergies, besoins particuliers, questions..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Vous recevrez une confirmation par téléphone sous 48h ouvrables.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà inscrit ?{' '}
          <a href="/sign-in" className="text-blue-600 hover:underline font-medium">
            Connexion à l'espace parent
          </a>
        </p>
      </div>
    </div>
  );
}
