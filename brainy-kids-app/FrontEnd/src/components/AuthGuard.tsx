'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, getDashboardPath } from '@/lib/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      // Remplace l'historique pour bloquer le bouton précédent
      router.replace('/sign-in');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDashboardPath(user.role));
      return;
    }

    setAuthorized(true);
  }, [router, allowedRoles]);

  // Ne rien afficher tant que la vérification n'est pas faite
  if (!authorized) return null;

  return <>{children}</>;
}
