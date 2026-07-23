'use client';
import { useState, useRef, useEffect } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface PeriodPickerProps {
  desde: string; // 'YYYY-MM'
  hasta: string; // 'YYYY-MM'
  onChange: (desde: string, hasta: string) => void;
  brandColor: string;
}

const SHORTCUTS = [
  { label: 'Este año', from: `${new Date().getFullYear()}-01`, to: `${new Date().getFullYear()}-12` },
  { label: '2025',     from: '2025-01', to: '2025-12' },
  { label: '2025–2026',from: '2025-01', to: '2026-12' },
  { label: 'Todo',     from: '2024-01', to: '2027-12' },
];

export function PeriodPicker({ desde, hasta, onChange, brandColor }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<DateRange>({
    from: new Date(desde + '-01'),
    to:   new Date(hasta + '-01'),
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const label = `${desde} – ${hasta}`;

  const apply = (r: DateRange) => {
    if (!r.from || !r.to) return;
    const d = format(r.from, 'yyyy-MM');
    const h = format(r.to,   'yyyy-MM');
    onChange(d, h);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          border: `1px solid ${open ? brandColor : 'var(--border)'}`,
          background: open ? `${brandColor}15` : 'var(--card)',
          color: 'var(--txt-3)', fontSize: 12, fontWeight: 400,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:0.5}}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> {label}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 999,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: 560,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Filtrar periodo
          </div>

          {/* Shortcuts */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {SHORTCUTS.map(s => {
              const activo = desde === s.from && hasta === s.to;
              return (
                <button key={s.label}
                  onClick={() => {
                    const r = { from: new Date(s.from + '-01'), to: new Date(s.to + '-01') };
                    setRange(r);
                    apply(r);
                  }}
                  style={{
                    flex: 1, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: activo ? `1px solid ${brandColor}` : '1px solid var(--border)',
                    background: activo ? `${brandColor}20` : 'transparent',
                    color: activo ? brandColor : 'var(--txt-3)',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Calendar */}
          <style>{`
            .rdp { --rdp-accent-color: ${brandColor}; color: var(--txt-2); }
            .rdp-day_selected { background: ${brandColor} !important; }
            .rdp-day_range_middle { background: ${brandColor}30 !important; }
            .rdp-button:hover { background: ${brandColor}20 !important; }
            .rdp-head_cell { color: var(--txt-5); font-size: 11px; }
            .rdp-caption_label { color: var(--txt-1); font-size: 13px; font-weight: 700; }
            .rdp-nav_button { color: var(--txt-3); }
          `}</style>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={r => r && setRange(r)}
            numberOfMonths={2}
            locale={es as any}
            defaultMonth={new Date(desde + '-01')}
          />

          {/* Botones acción */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setOpen(false)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--txt-3)', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => apply(range)}
              style={{ flex: 2, padding: '7px 0', borderRadius: 8, border: 'none',
                background: brandColor, color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
