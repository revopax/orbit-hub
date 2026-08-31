let cachedPromise: Promise<{ ramas: any[]; subsectores: any[]; subramas: any[]; total: number }> | null = null;

export function getProspeccionTree() {
  if (!cachedPromise) {
    cachedPromise = fetch('/api/prospeccion?mode=tree')
      .then(r => r.json())
      .then(d => ({ ramas: d.ramas || [], subsectores: d.subsectores || [], subramas: d.subramas || [], total: d.total || 0 }))
      .catch(() => {
        cachedPromise = null;
        return { ramas: [], subsectores: [], subramas: [], total: 0 };
      });
  }
  return cachedPromise;
}
