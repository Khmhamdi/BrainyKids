import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/logout'];

// Routes connues de l'application
const KNOWN_PATHS = [
  '/admin', '/teacher', '/parent', '/student',
  '/list/students', '/list/teachers', '/list/parents',
  '/list/classes', '/list/matieres', '/list/lessons',
  '/list/examens', '/list/taches', '/list/resultats',
  '/list/evenements', '/list/annonces',
  '/list/absences',
  '/list/paiements',
  '/list/clubs',
  '/list/clubs-ete',
  '/list/messages',
  '/list/notifications',
  '/profile', '/settings',
];

function getDashboardFromCookie(request: NextRequest): string {
  // On ne peut pas lire localStorage dans middleware
  // On stocke le role dans un cookie séparé au login
  const role = request.cookies.get('bk_role')?.value || 'administrator';
  const map: Record<string, string> = {
    administrator: '/admin',
    teacher: '/teacher',
    parent: '/parent',
    student: '/student',
  };
  return map[role] || '/admin';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Laisser passer assets, _next, API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 2. Routes publiques : toujours accessibles
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('bk_token')?.value;

  // 3. Pas de token → login
  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // 4. Token valide + route inconnue → dashboard (jamais login !)
  const isKnown = KNOWN_PATHS.some(p => pathname.startsWith(p));
  if (!isKnown) {
    const dashboard = getDashboardFromCookie(request);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  // 5. Token valide + route connue → laisser passer
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'],
};
