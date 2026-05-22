'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Menu from '@/components/Menu';
import Navbar from '@/components/Navbar';
import { getUser, getToken, getDashboardPath } from '@/lib/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [homePath, setHomePath] = useState('/admin');
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    // Si plus de token (après logout + bouton précédent), rediriger
    if (!token || !user) {
      router.replace('/sign-in');
      return;
    }
    setHomePath(getDashboardPath(user.role));
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="h-screen flex">
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 flex flex-col">
        <Link href={homePath} className="flex items-center justify-center lg:justify-start flex-col gap-2">
          <Image src="/LogoBK.png" alt="Logo" width={100} height={100} />
          <span className="hidden lg:block font-bold">Brainy Kids</span>
        </Link>
        <Menu />
      </div>
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-y-auto">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
