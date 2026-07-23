'use client';
import { useState, useEffect, useRef } from 'react';

function parseValor(v: string | number): { prefix: string; num: number; suffix: string; formatted: string } | null {
  const s = String(v);
  if (typeof v === 'number') return { prefix: '', num: v, suffix: '', formatted: String(v) };

  let m = s.match(/^(\$)([\d.]+)(M)$/);
  if (m) return { prefix: m[1], num: parseFloat(m[2]), suffix: m[3], formatted: s };

  m = s.match(/^(\$)([\d.]+)(K)$/);
  if (m) return { prefix: m[1], num: parseFloat(m[2]), suffix: m[3], formatted: s };

  m = s.match(/^([\d,]+)$/);
  if (m) return { prefix: '', num: parseInt(s.replace(/,/g, ''), 10), suffix: '', formatted: s };

  m = s.match(/^([\d.]+)(%)/);
  if (m) return { prefix: '', num: parseFloat(m[1]), suffix: '%', formatted: s };

  return null;
}

function formatNum(parsed: ReturnType<typeof parseValor>, current: number): string {
  if (!parsed) return '';
  const { prefix, suffix, formatted } = parsed;
  if (suffix === '%') return `${current.toFixed(1)}%`;
  if (suffix === 'M') return `${prefix}${current.toFixed(2)}M`;
  if (suffix === 'K') return `${prefix}${Math.round(current)}K`;
  if (!prefix && !suffix && formatted.includes(',')) return Math.round(current).toLocaleString();
  return `${prefix}${Math.round(current)}${suffix}`;
}

export function useCountUp(target: string | number, duration = 900): string {
  const parsed = parseValor(target);
  const [display, setDisplay] = useState<string>(parsed ? formatNum(parsed, 0) : String(target));
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!parsed) { setDisplay(String(target)); return; }
    startRef.current = null;
    setDisplay(formatNum(parsed, 0));
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(formatNum(parsed, parsed.num * eased));
      if (progress < 1) { rafRef.current = requestAnimationFrame(animate); }
      else { setDisplay(String(target)); }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
