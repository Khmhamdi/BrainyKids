import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      {/* Logo / titre */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🏫</div>
        <h1 className="text-4xl font-bold text-gray-800">Brainy Kids</h1>
        <p className="text-gray-500 mt-2 text-lg">École maternelle — Espace numérique</p>
      </div>

      {/* Cartes d'action */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <Link
          href="/pre-inscription"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-6 text-center shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="text-3xl mb-2">📝</div>
          <div className="font-semibold text-lg">Pré-inscription</div>
          <div className="text-blue-100 text-sm mt-1">Inscrire mon enfant</div>
        </Link>

        <Link
          href="/clubs-ete"
          className="flex-1 bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-2xl p-6 text-center shadow-lg transition-transform hover:-translate-y-1"
        >
          <div className="text-3xl mb-2">☀️</div>
          <div className="font-semibold text-lg">Clubs d'été</div>
          <div className="text-orange-100 text-sm mt-1">Session Juillet – Août</div>
        </Link>

        <Link
          href="/sign-in"
          className="flex-1 bg-white hover:bg-gray-50 text-gray-800 rounded-2xl p-6 text-center shadow-lg border border-gray-200 transition-transform hover:-translate-y-1"
        >
          <div className="text-3xl mb-2">🔑</div>
          <div className="font-semibold text-lg">Connexion</div>
          <div className="text-gray-400 text-sm mt-1">Espace parent / admin</div>
        </Link>
      </div>

      <p className="text-gray-400 text-xs mt-10">© {new Date().getFullYear()} Brainy Kids</p>
    </div>
  );
}
