'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/useAuth';

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrateur',
  teacher:       'Enseignante',
  parent:        'Parent',
  student:       'Élève',
};

const Navbar = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs border border-gray-300 rounded-full py-2 px-4">
        <Image src="/search.png" alt="Search" width={14} height={14} />
        <input
          type="text"
          placeholder="Rechercher..."
          className="outline-none border-none bg-transparent"
        />
      </div>

      {/* ICONS AND USER PROFILE */}
      <div className="flex items-center gap-6 justify-end w-full">
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="Notifications" width={27} height={27} />
        </div>

        {/* User info */}
        <div className="flex flex-col">
          <span className="text-xs leading-3 font-medium">
            {user?.full_name || '...'}
          </span>
          <span className="text-[10px] text-gray-500 text-right">
            {ROLE_LABELS[user?.role] || ''}
          </span>
        </div>

        <Image
          src="/avatar.png"
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />

        {/* Logout */}
        <button
          onClick={logout}
          title="Se déconnecter"
          className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-red-50 transition"
        >
          <Image src="/logout.png" alt="Logout" width={18} height={18} />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
