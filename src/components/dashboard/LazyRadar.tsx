import { useEffect, useState, type ReactNode } from 'react';

// Lazy-loads recharts (≈350 kB) only when a radar is actually rendered,
// keeping it out of the main entry chunk. Mirrors the pattern used in
// CoachCharts.tsx. Falls back to a lightweight placeholder while loading and
// if the dynamic import fails (e.g. offline PWA).
export default function LazyRadar({ children }: { children: (charts: typeof import('recharts')) => ReactNode }) {
  const [mod, setMod] = useState<typeof import('recharts') | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    import('recharts')
      .then(m => { if (alive) setMod(m); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  if (failed) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
        Grafiek kon niet geladen worden.
      </div>
    );
  }
  if (!mod) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
        Grafiek laden…
      </div>
    );
  }
  return <>{children(mod)}</>;
}
