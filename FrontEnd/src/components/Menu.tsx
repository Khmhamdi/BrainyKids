'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUser, getDashboardPath, logout } from '@/lib/useAuth';

// const menuItems = [
//   {
//     title: 'MENU',
//     items: [
//       { icon: '/home.png',         label: 'Accueil',      href: 'HOME',             visible: ['administrator', 'teacher', 'parent', 'student'] },
//       { icon: '/teacher.png',      label: 'Enseignantes', href: '/list/teachers',   visible: ['administrator'] },
//       { icon: '/student.png',      label: 'Enfants',      href: '/list/students',   visible: ['administrator', 'teacher'] },
//       { icon: '/parent.png',       label: 'Parents',      href: '/list/parents',    visible: ['administrator'] },
//       { icon: '/class.png',        label: 'Classes',      href: '/list/classes',    visible: ['administrator'] },
//       { icon: '/subject.png',      label: 'Matières',     href: '/list/matieres',   visible: ['administrator', 'teacher'] },
//       { icon: '/lesson.png',       label: 'Leçons',       href: '/list/lessons',    visible: ['administrator', 'teacher'] },
//       { icon: '/exam.png',         label: 'Examens',      href: '/list/examens',    visible: ['administrator', 'teacher'] },
//       { icon: '/assignment.png',   label: 'Tâches',       href: '/list/taches',     visible: ['administrator', 'teacher'] },
//       { icon: '/result.png',       label: 'Résultats',    href: '/list/resultats',  visible: ['administrator', 'teacher', 'parent'] },
//       { icon: '/calendar.png',     label: 'Événements',   href: '/list/evenements', visible: ['administrator', 'teacher', 'parent', 'student'] },
//       { icon: '/announcement.png', label: 'Annonces',     href: '/list/annonces',   visible: ['administrator', 'teacher', 'parent', 'student'] },
//     ],
//   },
//   {
//     title: 'AUTRE',
//     items: [
//       { icon: '/profile.png', label: 'Profil',        href: '/profile', visible: ['administrator', 'teacher', 'parent', 'student'] },
//       { icon: '/logout.png',  label: 'Déconnexion',   href: 'LOGOUT',   visible: ['administrator', 'teacher', 'parent', 'student'] },
//     ],
//   },
// ];

const menuItems = [
  {
    title: 'MENU',
    items: [
      // ── Tableau de bord ──────────────────────────────────────
      { icon: '/home.png',         label: 'Accueil',      href: 'HOME',             visible: ['administrator', 'teacher', 'parent', 'student'] },
      // ── Personnes ────────────────────────────────────────────
      { icon: '/student.png',      label: 'Enfants',      href: '/list/students',   visible: ['administrator'] },
      { icon: '/teacher.png',      label: 'Personnel',    href: '/list/teachers',   visible: ['administrator'] },
      { icon: '/parent.png',       label: 'Parents',      href: '/list/parents',    visible: ['administrator'] },
      { icon: '/class.png',        label: 'Classes',      href: '/list/classes',    visible: ['administrator', 'teacher'] },
      // ── Opérations quotidiennes ──────────────────────────────
      { icon: '/attendance.png',   label: 'Absences',     href: '/list/absences',   visible: ['administrator', 'teacher'] },
      { icon: '/finance.png',      label: 'Paiements',    href: '/list/paiements',  visible: ['administrator'] },
      { icon: '/lesson.png',       label: "Clubs",            href: '/list/clubs',      visible: ['administrator'] },
      { icon: '/lesson.png',       label: "Inscriptions été", href: '/list/clubs-ete',  visible: ['administrator'] },
      // ── Communication ────────────────────────────────────────
      { icon: '/calendar.png',     label: 'Événements',   href: '/list/evenements', visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/announcement.png', label: 'Annonces',     href: '/list/annonces',   visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/message.png',      label: 'Messages',     href: '/list/messages',   visible: ['administrator', 'parent'] },
      // ── Académique ───────────────────────────────────────────
      { icon: '/subject.png',      label: 'Matières',     href: '/list/matieres',   visible: ['administrator'] },
      { icon: '/lesson.png',       label: 'Leçons',       href: '/list/lessons',    visible: ['administrator', 'teacher'] },
      { icon: '/exam.png',         label: 'Examens',      href: '/list/examens',    visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/assignment.png',   label: 'Tâches',       href: '/list/taches',     visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/result.png',       label: 'Résultats',    href: '/list/resultats',  visible: ['administrator', 'teacher', 'parent', 'student'] },
    ],
  },
  {
    title: 'AUTRE',
    items: [
      { icon: '/profile.png', label: 'Profil',       href: '/profile',   visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/setting.png', label: 'Paramètres',   href: '/settings',  visible: ['administrator', 'teacher', 'parent', 'student'] },
      { icon: '/logout.png',  label: 'Déconnexion',  href: 'LOGOUT',     visible: ['administrator', 'teacher', 'parent', 'student'] },
    ],
  },
];
const Menu = () => {
  const [role, setRole] = useState<string>('');
  const [homePath, setHomePath] = useState('/admin');
  const pathname = usePathname();

  useEffect(() => {
    const user = getUser();
    if (user) {
      setRole(user.role);
      setHomePath(getDashboardPath(user.role));
    }
  }, []);

  if (!role) return null;

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((section) => (
        <div className="flex flex-col gap-2" key={section.title}>
          <span className="hidden lg:block text-gray-400 font-light my-4">
            {section.title}
          </span>
          {section.items
            .filter(item => item.visible.includes(role))
            .map((item) => {
              if (item.href === 'LOGOUT') {
                return (
                  <button
                    key={item.label}
                    onClick={logout}
                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-red-50 w-full text-left"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="hidden lg:block">{item.label}</span>
                  </button>
                );
              }

              const href = item.href === 'HOME' ? homePath : item.href;
              const isActive = pathname === href;

              return (
                <Link
                  href={href}
                  key={item.label}
                  className={`flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md transition
                    ${isActive ? 'bg-BKskyLight text-BKprimary font-medium' : 'hover:bg-sky-50'}`}
                >
                  <Image src={item.icon} alt="" width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
