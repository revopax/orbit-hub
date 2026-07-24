'use client'
import { useState, useRef, useEffect } from 'react'

interface SimplePeriodPickerProps {
  desde: string
  hasta: string
  onChange: (desde: string, hasta: string) => void
  brandColor: string
}

export function SimplePeriodPicker({ desde, hasta, onChange, brandColor }: SimplePeriodPickerProps) {
  const [open, setOpen] = useState(false)
  const [localDesde, setLocalDesde] = useState(desde)
  const [localHasta, setLocalHasta] = useState(hasta)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const anioActual = new Date().getFullYear()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          border: `1px solid ${open ? brandColor : 'var(--border)'}`,
          background: open ? `${brandColor}15` : 'var(--card)',
          color: 'var(--txt-3)', fontSize: 12, fontWeight: 400,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {desde} – {hasta}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 999,
          background: 'var(--bg, #1a1d2e)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          minWidth: 280,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Filtrar periodo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Desde</div>
              <input type="month" value={localDesde}
                onChange={e => setLocalDesde(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--txt-1)', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Hasta</div>
              <input type="month" value={localHasta}
                onChange={e => setLocalHasta(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--txt-1)', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Este año', from: `${anioActual}-01`, to: `${anioActual}-12` },
              { label: '2025–2026', from: '2025-01', to: '2026-12' },
              { label: 'Todo', from: '2024-01', to: '2027-12' },
            ].map(p => (
              <button key={p.label}
                onClick={() => { setLocalDesde(p.from); setLocalHasta(p.to) }}
                style={{ flex: 1, padding: '4px 0', borderRadius: 6,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--txt-3)', fontSize: 10, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {p.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setLocalDesde('2024-01'); setLocalHasta('2027-12') }}
              style={{ flex: 1, padding: '6px 0', borderRadius: 6,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--txt-4)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Limpiar
            </button>
            <button onClick={() => { onChange(localDesde, localHasta); setOpen(false) }}
              style={{ flex: 2, padding: '6px 0', borderRadius: 6,
                border: 'none', background: brandColor,
                color: '#fff', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
