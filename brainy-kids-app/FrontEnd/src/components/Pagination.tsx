"use client";

interface Props {
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const Pagination = ({ page = 1, totalPages = 1, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  return (
    <div className="p-4 flex items-center justify-between text-gray-500">
      <button
        disabled={page === 1}
        onClick={() => onPageChange?.(page - 1)}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Précédent
      </button>

      <div className="flex items-center justify-center gap-2 text-sm">
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange?.(p)}
            className={`px-2 rounded-sm text-xs font-semibold ${p === page ? "bg-BKskyLight" : ""}`}
          >
            {p}
          </button>
        ))}
        {totalPages > 5 && <span>...</span>}
      </div>

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange?.(page + 1)}
        className="py-2 px-4 rounded-md bg-slate-200 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Suivant
      </button>
    </div>
  );
};

export default Pagination;
