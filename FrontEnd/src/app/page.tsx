'use client';

import Link from 'next/link';
import Image from 'next/image';

const SHAPES = [
  { top: '8%',  left: '6%',  size: 320, color: 'bg-blue-300/30',   delay: '0s',   dur: '18s' },
  { top: '60%', left: '2%',  size: 240, color: 'bg-pink-300/25',   delay: '3s',   dur: '22s' },
  { top: '15%', right: '5%', size: 280, color: 'bg-purple-300/30', delay: '1s',   dur: '20s' },
  { top: '65%', right: '4%', size: 200, color: 'bg-yellow-300/30', delay: '5s',   dur: '16s' },
  { top: '42%', left: '38%', size: 360, color: 'bg-teal-200/20',   delay: '2s',   dur: '25s' },
  { top: '80%', left: '30%', size: 180, color: 'bg-orange-300/20', delay: '4s',   dur: '19s' },
];

const STARS = [
  { top: '12%', left: '18%', dur: '3.2s', delay: '0s',   size: 'text-xl' },
  { top: '22%', left: '75%', dur: '4.1s', delay: '0.8s', size: 'text-sm' },
  { top: '55%', left: '88%', dur: '2.8s', delay: '1.5s', size: 'text-lg' },
  { top: '70%', left: '12%', dur: '3.6s', delay: '0.4s', size: 'text-sm' },
  { top: '88%', left: '60%', dur: '4.4s', delay: '2s',   size: 'text-xl' },
  { top: '35%', left: '5%',  dur: '3.0s', delay: '1.2s', size: 'text-xs' },
  { top: '5%',  left: '50%', dur: '5.0s', delay: '0.6s', size: 'text-sm' },
  { top: '78%', left: '82%', dur: '2.6s', delay: '1.8s', size: 'text-lg' },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes blob-move {
          0%,100% { transform: translate(0,0) scale(1); }
          25%      { transform: translate(20px,-40px) scale(1.08); }
          50%      { transform: translate(-15px,25px) scale(0.95); }
          75%      { transform: translate(25px,10px) scale(1.04); }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-logo {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes sparkle-pulse {
          0%,100% { opacity:0.2; transform:scale(0.6); }
          50%      { opacity:1;   transform:scale(1.2); }
        }
        @keyframes slide-up {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes card-in {
          from { opacity:0; transform:translateY(32px) scale(0.96); }
          to   { opacity:1; transform:translateY(0)   scale(1); }
        }
        .animated-bg {
          background: linear-gradient(-45deg,#dbeafe,#ede9fe,#fce7f3,#d1fae5,#fef3c7,#e0e7ff);
          background-size: 500% 500%;
          animation: gradient-shift 14s ease infinite;
        }
        .blob { animation: blob-move var(--dur,18s) ease-in-out infinite; animation-delay: var(--delay,0s); }
        .logo-float { animation: float-logo 5s ease-in-out infinite; }
        .sparkle { animation: sparkle-pulse var(--dur,3s) ease-in-out infinite; animation-delay: var(--delay,0s); }
        .slide-up-1 { animation: slide-up 0.7s ease both 0.2s; }
        .slide-up-2 { animation: slide-up 0.7s ease both 0.4s; }
        .slide-up-3 { animation: slide-up 0.7s ease both 0.6s; }
        .card-anim-1 { animation: card-in 0.6s ease both 0.7s; }
        .card-anim-2 { animation: card-in 0.6s ease both 0.85s; }
        .card-anim-3 { animation: card-in 0.6s ease both 1.0s; }
        .card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .card-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
      `}</style>

      <div className="animated-bg relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">

        {/* ── Animated blobs ─────────────────────────────────── */}
        {SHAPES.map((s, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl pointer-events-none ${s.color} blob`}
            style={{
              width: s.size, height: s.size,
              top: s.top, left: (s as any).left, right: (s as any).right,
              ['--dur' as any]: s.dur, ['--delay' as any]: s.delay,
            }}
          />
        ))}

        {/* ── Sparkle stars ──────────────────────────────────── */}
        {STARS.map((st, i) => (
          <span
            key={i}
            className={`absolute pointer-events-none ${st.size} sparkle select-none`}
            style={{
              top: st.top, left: st.left,
              ['--dur' as any]: st.dur, ['--delay' as any]: st.delay,
            }}
          >
            ✦
          </span>
        ))}

        {/* ── Subtle dot grid overlay ─────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ── Content ────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full">

          {/* Logo */}
          <div className="logo-float mb-5 drop-shadow-xl slide-up-1">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/60 blur-xl scale-110" />
              <Image src="/LogoBK.png" alt="Brainy Kids" width={110} height={110} priority className="relative drop-shadow-lg" />
            </div>
          </div>

          {/* Titre */}
          <h1
            className="slide-up-1 font-black tracking-tight leading-none mb-2"
            style={{
              fontSize: 'clamp(2.8rem, 7vw, 4.5rem)',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #db2777 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Brainy Kids
          </h1>

          {/* Slogan */}
          <p className="slide-up-2 text-lg sm:text-xl font-semibold text-gray-700 mt-1 mb-1 italic">
            « Là où les grands esprits s'éveillent »
          </p>

          {/* Sous-titre */}
          <p className="slide-up-3 text-sm text-gray-400 font-medium tracking-widest uppercase mb-10">
            Espace numérique · El Mourouj 6
          </p>

          {/* ── Cartes d'action ──────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">

            {/* Pré-inscription */}
            <Link
              href="/pre-inscription"
              className="card-anim-1 card-lift flex-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-6 text-center shadow-xl"
            >
              <div className="text-4xl mb-3 drop-shadow">📝</div>
              <div className="font-bold text-lg">Pré-inscription</div>
              <div className="text-blue-100 text-sm mt-1">Inscrire mon enfant</div>
            </Link>

            {/* Clubs d'été */}
            <Link
              href="/clubs-ete"
              className="card-anim-2 card-lift flex-1 bg-gradient-to-br from-orange-500 to-yellow-400 text-white rounded-2xl p-6 text-center shadow-xl"
            >
              <div className="text-4xl mb-3 drop-shadow">☀️</div>
              <div className="font-bold text-lg">Clubs d'été</div>
              <div className="text-orange-100 text-sm mt-1">Session Juillet – Août</div>
            </Link>

            {/* Connexion */}
            <Link
              href="/sign-in"
              className="card-anim-3 card-lift flex-1 bg-white/80 backdrop-blur-md text-gray-800 rounded-2xl p-6 text-center shadow-xl border border-white"
            >
              <div className="text-4xl mb-3 drop-shadow">🔑</div>
              <div className="font-bold text-lg">Connexion</div>
              <div className="text-gray-400 text-sm mt-1">Espace parent / admin</div>
            </Link>
          </div>

          {/* Footer */}
          <p className="mt-10 text-gray-400/70 text-xs tracking-wide">
            © {new Date().getFullYear()} Brainy Kids — Tous droits réservés
          </p>
        </div>
      </div>
    </>
  );
}
