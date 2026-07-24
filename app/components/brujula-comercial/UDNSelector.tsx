'use client'
import { useState, useEffect } from 'react'

export const UDN_CONFIG = {
  UIX:  { nombre: 'UIX',  color: '#8C59FE', label: 'UIX' },
  MU:   { nombre: 'MU',   color: '#DCFF00', label: 'Marketing United' },
  PE:   { nombre: 'PE',   color: '#FF7600', label: 'Promo Espacio' },
  ZU:   { nombre: 'ZU',   color: '#61ACAA', label: 'Zeus' },
  NC:   { nombre: 'NC',   color: '#3E31CC', label: 'Neracode' },
  HOF:  { nombre: 'HOF',  color: '#3274FC', label: 'House of Films' },
  RL:   { nombre: 'RL',   color: '#770EB7', label: 'Research Land' },
  MEXA: { nombre: 'MEXA', color: '#FD00C7', label: 'Mexa Creativa' },
} as const

export type UDNId = keyof typeof UDN_CONFIG

interface UDNSelectorProps {
  selected: UDNId[]
  onChange: (udns: UDNId[]) => void
  max?: number
}

const STORAGE_KEY = 'analista-udns'

export default function UDNSelector({ selected, onChange, max = 3 }: UDNSelectorProps) {
  const [showHint, setShowHint] = useState(false)

  // Cargar de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as UDNId[]
        const valid = parsed.filter((u): u is UDNId => u in UDN_CONFIG)
        if (valid.length > 0) onChange(valid.slice(0, max))
      }
    } catch { /* ignore */ }
  }, [])

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
  }, [selected])

  const toggle = (id: UDNId) => {
    if (selected.includes(id)) {
      onChange(selected.filter(u => u !== id))
      setShowHint(false)
    } else if (selected.length < max) {
      onChange([...selected, id])
      setShowHint(false)
    } else {
      setShowHint(true)
      setTimeout(() => setShowHint(false), 2000)
    }
  }

  return (
    <div style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="text-xs font-semibold text-[var(--txt-3)] uppercase tracking-wider">
          Selecciona UDNs a comparar
        </span>
        <span className="text-xs text-[var(--txt-5)]">
          {selected.length}/{max} seleccionadas
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        {(Object.keys(UDN_CONFIG) as UDNId[]).map(id => {
          const cfg = UDN_CONFIG[id]
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 18px', borderRadius: 7, border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                backgroundColor: active ? cfg.color : 'transparent',
                color: active ? (cfg.color === '#DCFF00' ? '#000000' : '#FFFFFF') : 'var(--txt-4)',
                boxShadow: active ? `0 2px 12px ${cfg.color}55` : 'none',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                backgroundColor: active ? '#ffffff99' : cfg.color,
              }} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {showHint && (
        <p className="text-xs text-amber-500 mt-2 animate-pulse">
          Máximo {max} UDNs. Deselecciona una para agregar otra.
        </p>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-[var(--txt-5)] mt-2">
          Selecciona al menos 1 UDN para ver el análisis.
        </p>
      )}
    </div>
  )
}
