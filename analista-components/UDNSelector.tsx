'use client'
import { useState, useEffect } from 'react'

export const UDN_CONFIG = {
  UIX:  { nombre: 'UIX',           color: '#6366f1', label: 'UIX' },
  MU:   { nombre: 'MU',            color: '#ec4899', label: 'Marketing United' },
  PE:   { nombre: 'PE',            color: '#f59e0b', label: 'Promo Espacio' },
  ZU:   { nombre: 'ZU',            color: '#10b981', label: 'Zeus' },
  NC:   { nombre: 'NC',            color: '#8b5cf6', label: 'Neracode' },
  HOF:  { nombre: 'HOF',           color: '#ef4444', label: 'House of Films' },
  RL:   { nombre: 'RL',            color: '#3b82f6', label: 'Research Land' },
  MEXA: { nombre: 'MEXA',          color: '#14b8a6', label: 'Mexa Creativa' },
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Selecciona UDNs a comparar
        </h3>
        <span className="text-xs text-slate-400">
          {selected.length}/{max} seleccionadas
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(UDN_CONFIG) as UDNId[]).map(id => {
          const cfg = UDN_CONFIG[id]
          const active = selected.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-all
                border-2 cursor-pointer select-none
                ${active
                  ? 'text-white shadow-md scale-105'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }
              `}
              style={active ? {
                backgroundColor: cfg.color,
                borderColor: cfg.color,
              } : {}}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {showHint && (
        <p className="text-xs text-amber-600 mt-2 animate-pulse">
          Máximo {max} UDNs. Deselecciona una para agregar otra.
        </p>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-slate-400 mt-2">
          Selecciona al menos 1 UDN para ver el análisis.
        </p>
      )}
    </div>
  )
}
