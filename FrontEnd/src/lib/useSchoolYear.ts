import { useEffect, useState } from 'react';
import { schoolYears } from './api';

/**
 * Hook pour récupérer l'année scolaire courante
 * Retourne l'année courante et une liste de toutes les années disponibles
 */
export function useSchoolYear() {
  const [currentYear, setCurrentYear] = useState<string>('');
  const [allYears, setAllYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      schoolYears.getCurrent(),
      schoolYears.list()
    ])
      .then(([current, all]) => {
        setCurrentYear(current?.label || getFallbackYear());
        setAllYears(all || []);
      })
      .catch(() => {
        setCurrentYear(getFallbackYear());
        setAllYears([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { currentYear, allYears, loading };
}

/**
 * Calcule l'année scolaire courante en fallback
 * Si mois >= septembre : année-année+1
 * Sinon : année-1 - année
 */
function getFallbackYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}
