'use client';

import { useRef } from 'react';
import { getMediaUrl } from '@/lib/media';

interface Props {
  currentUrl?: string | null;
  previewFile?: File | null;
  onChange: (file: File) => void;
  size?: 'sm' | 'md';
}

export default function PhotoUpload({ currentUrl, previewFile, onChange, size = 'md' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dim = size === 'sm' ? 'w-16 h-16' : 'w-24 h-24';

  const previewSrc = previewFile
    ? URL.createObjectURL(previewFile)
    : getMediaUrl(currentUrl);

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`${dim} rounded-full border-2 border-dashed border-gray-300 hover:border-blue-400 overflow-hidden flex items-center justify-center bg-gray-50 hover:bg-blue-50 transition-colors shrink-0 group relative`}
        title="Cliquer pour choisir une photo"
      >
        {previewSrc ? (
          <img src={previewSrc} alt="Photo" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl text-gray-300 group-hover:text-blue-300 transition-colors">📷</span>
        )}
        {/* Overlay au hover */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          <span className="text-white text-xs font-medium">Modifier</span>
        </div>
      </button>

      {/* Infos + bouton */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors w-fit"
        >
          {previewFile ? '✅ ' + previewFile.name.slice(0, 20) + (previewFile.name.length > 20 ? '…' : '') : 'Choisir une photo'}
        </button>
        <p className="text-xs text-gray-400">JPG, PNG · max 5 Mo</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
    </div>
  );
}
