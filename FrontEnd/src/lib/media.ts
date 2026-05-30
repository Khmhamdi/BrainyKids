/**
 * Construit l'URL absolue d'un asset (photo uploadée).
 * En dev  : http://localhost:4000/uploads/photos/...
 * En prod : https://brainykids.tn/uploads/photos/...
 */
export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path; // déjà absolue
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace(/\/api$/, '');
  return `${base}${path}`;
}
