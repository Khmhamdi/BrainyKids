'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { teachers as teachersApi, upload as uploadApi } from '@/lib/api';
import { getUser } from '@/lib/useAuth';
import { getMediaUrl } from '@/lib/media';
import PhotoUpload from '@/components/PhotoUpload';

type TeacherProfile = {
  id: string;
  full_name: string;
  qualification: string | null;
  fonction: string;
  phone: string | null;
  hire_date: string;
  photo_url: string | null;
  monthly_salary: number | null;
  classes: { id: string; name: string; age_group: string; room_number: string }[];
  user?: { username: string; email: string | null; phone: string | null };
};

const FONCTION_LABEL: Record<string, string> = {
  enseignante: 'Enseignante',
  femme_de_service: 'Femme de service',
  autre: 'Autre personnel',
};

const AGE_LABEL: Record<string, string> = { PS: 'Petite Section', MS: 'Moyenne Section', GS: 'Grande Section' };

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value || '—'}</span>
    </div>
  );
}

function ProfilePage() {
  const user = getUser();
  const isTeacher = user?.role === 'teacher';

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isTeacher) {
      teachersApi.myProfile()
        .then(p => { setProfile(p); setPhone(p.user?.phone || p.phone || ''); setEmail(p.user?.email || ''); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isTeacher]);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.'); return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('Le mot de passe doit avoir au moins 6 caractères.'); return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      let photoUrl: string | undefined;
      if (photoFile) photoUrl = await uploadApi.photo(photoFile);

      const payload: any = {
        phone: phone.trim() || null,
        email: email.trim() || null,
        ...(photoUrl !== undefined && { photo_url: photoUrl }),
      };
      await teachersApi.update(profile!.id, payload);
      const updated = await teachersApi.myProfile();
      setProfile(updated);
      setPhotoFile(null);
      setNewPassword(''); setConfirmPassword('');
      setEditing(false);
      setSuccess('Profil mis à jour avec succès.');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isTeacher) return (
    <div className="p-6 text-center text-gray-500">
      <p className="text-4xl mb-3">🚧</p>
      <p>Page profil disponible pour les enseignantes.</p>
    </div>
  );

  const photo = getMediaUrl(photoFile ? null : profile?.photo_url);
  const initials = (profile?.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="p-4 max-w-3xl mx-auto flex flex-col gap-5">

      {/* ── Header carte profil ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {photo ? (
              <img src={photo} alt={profile?.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-white/40 shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-3xl font-bold shadow-lg">
                {initials}
              </div>
            )}
          </div>
          {/* Infos */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
            <p className="text-blue-100 mt-1">{FONCTION_LABEL[profile?.fonction || ''] || profile?.fonction}</p>
            {profile?.qualification && <p className="text-blue-200 text-sm mt-0.5">{profile.qualification}</p>}
            {profile?.classes?.[0] && (
              <span className="mt-2 inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                🏫 {AGE_LABEL[profile.classes[0].age_group] || profile.classes[0].name} — Salle {profile.classes[0].room_number}
              </span>
            )}
          </div>
          {/* Bouton modifier */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition"
            >
              ✏️ Modifier
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────── */}
      {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">✅ {success}</div>}

      {/* ── Informations professionnelles ─────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
          Informations professionnelles
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Nom complet" value={profile?.full_name} />
          <Field label="Fonction" value={FONCTION_LABEL[profile?.fonction || ''] || profile?.fonction} />
          <Field label="Qualification" value={profile?.qualification} />
          <Field label="Date de recrutement" value={profile?.hire_date ? new Date(profile.hire_date).toLocaleDateString('fr-FR') : null} />
          <Field label="Classe assignée" value={profile?.classes?.[0] ? `${AGE_LABEL[profile.classes[0].age_group] || profile.classes[0].name} — Salle ${profile.classes[0].room_number}` : null} />
          <Field label="Identifiant" value={profile?.user?.username} />
        </div>
      </div>

      {/* ── Section édition ──────────────────────────────────────── */}
      {editing && (
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
            Modifier mon profil
          </h2>

          {/* Photo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Photo de profil</label>
            <PhotoUpload currentUrl={profile?.photo_url} previewFile={photoFile} onChange={f => setPhotoFile(f)} />
          </div>

          {/* Téléphone + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="+216 XX XXX XXX"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="email@exemple.com"
              />
            </div>
          </div>

          {/* Changement mot de passe */}
          <div className="border-t pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Changer le mot de passe <span className="normal-case text-gray-400">(laisser vide pour ne pas modifier)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Nouveau mot de passe"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
              <input
                type={showPwd ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button" onClick={() => { setEditing(false); setError(''); setPhotoFile(null); setNewPassword(''); setConfirmPassword(''); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="button" onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ── Coordonnées ────────────────────────────────────────────── */}
      {!editing && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full inline-block" />
            Coordonnées
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Téléphone" value={profile?.user?.phone || profile?.phone} />
            <Field label="Email" value={profile?.user?.email} />
          </div>
        </div>
      )}

    </div>
  );
}

export default function Page() {
  return (
    <AuthGuard allowedRoles={['teacher', 'administrator', 'parent', 'student']}>
      <ProfilePage />
    </AuthGuard>
  );
}
