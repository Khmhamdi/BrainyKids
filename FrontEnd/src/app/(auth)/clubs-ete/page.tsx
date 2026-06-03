'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicApi, preRegistrations } from '@/lib/api';

const CLUB_ICONS: Record<string, string> = {
  "Jeux d'eau":   '💧',
  'Robotique':    '🤖',
  'Informatique': '💻',
  'Cinéma':       '🎬',
};

const iCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent';
const lCls = 'block text-sm font-medium text-gray-700 mb-1';

const EMPTY = {
  child_full_name: '', date_of_birth: '', is_internal: true,
  parent_full_name: '', parent_cin: '', parent_phone: '', parent_address: '',
  clubs_message: '',
};

export default function ClubsEtePage() {
  const [clubs,     setClubs]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);
  const [formError, setFormError] = useState('');
  const [form,      setForm]      = useState(EMPTY);

  useEffect(() => {
    publicApi.clubsEte()
      .then(setClubs).catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof EMPTY, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.child_full_name.trim() || !form.date_of_birth || !form.parent_full_name.trim() || !form.parent_phone.trim()) {
      setFormError('Veuillez remplir tous les champs obligatoires.'); return;
    }
    setSending(true);
    try {
      await preRegistrations.submit({
        type:             'club_ete',
        child_full_name:  form.child_full_name.trim(),
        date_of_birth:    form.date_of_birth,
        gender:           'M',
        desired_class:    '',
        school_year:      '',
        is_internal:      form.is_internal,
        parent_full_name: form.parent_full_name.trim(),
        parent_phone:     form.parent_phone.trim(),
        parent_cin:       form.parent_cin.trim() || null,
        parent_address:   form.parent_address.trim() || null,
        parent_email:     '',
        parent_relation:  'parent',
        message:          form.clubs_message.trim() || null,
      });
      setSubmitted(true);
    } catch (e: any) {
      setFormError(e.message || 'Une erreur est survenue. Réessayez.');
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-orange-600 hover:underline mb-4 inline-block">← Accueil</Link>
          <div className="text-5xl mb-3">☀️</div>
          <h1 className="text-3xl font-bold text-gray-800">Clubs d'été</h1>
          <p className="text-gray-500 mt-1">Session Juillet – Août 2026 · Brainy Kids</p>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <p className="text-gray-600">
            Profitez de l'été pour offrir à vos enfants des activités enrichissantes et amusantes.
            Nos clubs d'été sont ouverts aux élèves inscrits et aux enfants extérieurs.
          </p>
        </div>

        {/* Clubs */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement des clubs...</div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>Les clubs d'été seront bientôt disponibles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {clubs.map(club => (
              <div key={club.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 flex items-start gap-4">
                <div className="text-4xl">{CLUB_ICONS[club.name] ?? '🎯'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800">{club.name}</h3>
                  {club.description && <p className="text-sm text-gray-500 mt-0.5">{club.description}</p>}
                  <div className="mt-2">
                    {club.price === 0 ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">Gratuit</span>
                    ) : (
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">{club.price} DT / mois</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA / Formulaire */}
        {submitted ? (
          <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Demande envoyée !</h2>
            <p className="text-gray-600 mb-2">
              Votre demande d'inscription pour <strong>{form.child_full_name}</strong> a bien été reçue.
            </p>
            <p className="text-gray-500 text-sm mb-6">Notre équipe vous contactera au <strong>{form.parent_phone}</strong>.</p>
            <button
              onClick={() => { setSubmitted(false); setForm(EMPTY); setShowForm(false); }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
            >
              Nouvelle demande
            </button>
          </div>
        ) : !showForm ? (
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg p-7 text-center text-white">
            <h2 className="text-xl font-bold mb-2">Inscrivez votre enfant dès maintenant</h2>
            <p className="text-orange-100 text-sm mb-5">
              Remplissez le formulaire d'inscription pour les clubs d'été.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
            >
              S'inscrire aux clubs d'été →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* En-tête formulaire */}
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-5">
              <h2 className="text-white text-xl font-semibold">Inscription aux clubs d'été</h2>
              <p className="text-orange-100 text-sm mt-1">Session Juillet – Août 2026</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">

              {/* ── Informations de l'enfant ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
                  👶 Informations de l'enfant
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lCls}>Nom et prénom de l'enfant <span className="text-red-500">*</span></label>
                    <input value={form.child_full_name} onChange={e => set('child_full_name', e.target.value)}
                      className={iCls} placeholder="Ex : Sami Ben Ali" required />
                  </div>
                  <div>
                    <label className={lCls}>Date de naissance <span className="text-red-500">*</span></label>
                    <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                      className={iCls} required />
                  </div>
                  <div>
                    <label className={lCls}>Statut <span className="text-red-500">*</span></label>
                    <div className="flex gap-3 mt-1">
                      {[{ val: true, label: '🏫 Élève inscrit (interne)' }, { val: false, label: '👤 Enfant extérieur' }].map(opt => (
                        <label key={String(opt.val)}
                          className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition ${
                            form.is_internal === opt.val
                              ? 'border-orange-400 bg-orange-50 text-orange-700 font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          <input type="radio" name="is_internal" className="hidden"
                            checked={form.is_internal === opt.val}
                            onChange={() => set('is_internal', opt.val)} />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lCls}>Clubs souhaités</label>
                    <input value={form.clubs_message} onChange={e => set('clubs_message', e.target.value)}
                      className={iCls} placeholder="Ex : Robotique, Informatique" />
                  </div>
                </div>
              </div>

              {/* ── Informations du parent ── */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 pb-2 border-b">
                  👨‍👩‍👧 Informations du parent / tuteur
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={lCls}>Nom et prénom <span className="text-red-500">*</span></label>
                    <input value={form.parent_full_name} onChange={e => set('parent_full_name', e.target.value)}
                      className={iCls} placeholder="Ex : Khaled Ben Ali" required />
                  </div>
                  <div>
                    <label className={lCls}>N° CIN</label>
                    <input value={form.parent_cin} onChange={e => set('parent_cin', e.target.value)}
                      className={iCls} placeholder="Ex : 12345678" />
                  </div>
                  <div>
                    <label className={lCls}>Numéro de téléphone <span className="text-red-500">*</span></label>
                    <input type="tel" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)}
                      className={iCls} placeholder="Ex : 20 000 000" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={lCls}>Adresse</label>
                    <input value={form.parent_address} onChange={e => set('parent_address', e.target.value)}
                      className={iCls} placeholder="Ex : Rue des Jasmins, El Mourouj 6" />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{formError}</div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                  Annuler
                </button>
                <button type="submit" disabled={sending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition text-sm">
                  {sending ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400">
                Vous serez contacté sous 48h ouvrables.
              </p>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/sign-in" className="text-orange-600 hover:underline">Connexion espace parent / admin</Link>
        </p>
      </div>
    </div>
  );
}
