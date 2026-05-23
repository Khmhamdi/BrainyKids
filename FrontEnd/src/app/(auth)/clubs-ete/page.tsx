'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { publicApi } from '@/lib/api';

const CLUB_ICONS: Record<string, string> = {
  "Jeux d'eau":   '💧',
  'Robotique':    '🤖',
  'Informatique': '💻',
  'Cinéma':       '🎬',
};

export default function ClubsEtePage() {
  const [clubs,   setClubs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.clubsEte()
      .then(setClubs)
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-sm text-orange-600 hover:underline mb-4 inline-block">← Retour</Link>
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
                  {club.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{club.description}</p>
                  )}
                  <div className="mt-2">
                    {club.price === 0 ? (
                      <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Gratuit
                      </span>
                    ) : (
                      <span className="inline-block bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        {club.price} DT / mois
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg p-7 text-center text-white mb-6">
          <h2 className="text-xl font-bold mb-2">Inscrivez votre enfant dès maintenant</h2>
          <p className="text-orange-100 text-sm mb-5">
            Remplissez le formulaire de pré-inscription et mentionnez les clubs souhaités dans le message.
          </p>
          <Link
            href="/pre-inscription"
            className="inline-block bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Faire une demande d'inscription →
          </Link>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 text-center text-sm text-gray-500">
          Pour plus d'informations, contactez-nous directement à l'école ou via le formulaire de pré-inscription.
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/sign-in" className="text-orange-600 hover:underline">Connexion espace parent / admin</Link>
        </p>
      </div>
    </div>
  );
}
