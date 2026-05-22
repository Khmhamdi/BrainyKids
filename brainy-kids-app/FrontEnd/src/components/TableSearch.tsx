'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Props {
  onSearch?: (value: string) => void;
  placeholder?: string;
}

const TableSearch = ({ onSearch, placeholder = 'Rechercher...' }: Props) => {
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs border border-gray-300 rounded-full py-2 px-4">
      <Image src="/search.png" alt="Search" width={14} height={14} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="outline-none border-none bg-transparent w-full"
      />
    </div>
  );
};

export default TableSearch;
