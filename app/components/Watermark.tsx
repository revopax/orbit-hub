'use client'
import { useEffect } from 'react'

interface WatermarkProps {
  nombre: string
  email?: string
}

export function Watermark({ nombre, email }: WatermarkProps) {
  useEffect(() => {
    // Log de copia
    const onCopy = () => {
      fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evento: 'copy', usuario: nombre, ts: new Date().toISOString() }) })
    }
    // Log de cambio de tab
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evento: 'tab_change', usuario: nombre, ts: new Date().toISOString() }) })
      }
    }
    // Deshabilitar clic derecho
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    // Deshabilitar F12 e inspección
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') e.preventDefault()
      if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) e.preventDefault()
      if (e.ctrlKey && e.key === 'U') e.preventDefault()
    }

    document.addEventListener('copy', onCopy)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [nombre])

  const texto = 'CONFIDENCIAL · UPAX'

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden', userSelect: 'none' }}>
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <div key={`${row}-${col}`} style={{
            position: 'absolute',
            top: `${row * 18 + (col % 2 === 0 ? 0 : 9)}%`,
            left: `${col * 28 - 5}%`,
            transform: 'rotate(-25deg)',
            fontSize: 11, fontWeight: 500,
            color: 'rgba(255,255,255,0.02)',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.05em',
          }}>
            {texto}
          </div>
        ))
      )}
    </div>
  )
}
