'use client'
import { useMemo, useState, useEffect } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'

interface RadarPerdidasProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
  perfil?: any
}

export default function RadarPerdidas({ selectedUDNs, data, perfil }: RadarPerdidasProps) {
  const [tooltip, setTooltip] = useState<{ x: number, y: number, label: string, datasets: { udn: string, color: string, label: string, raw: number }[] } | null>(null)
  const [viewportW, setViewportW] = useState(1024)
  useEffect(() => {
    const update = () => setViewportW(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const radarData = useMemo(() => {
    // Top 6 motivos globales normalizados por UDN
    const allMotivos: Record<string, Record<UDNId, number>> = {}

    selectedUDNs.forEach(id => {
      const arr = data.rescue?.[id] || []
      arr.forEach((r: any) => {
        const motivo = r.motivoPerdida || 'Sin especificar'
        if (!allMotivos[motivo]) allMotivos[motivo] = {} as Record<UDNId, number>
        allMotivos[motivo][id] = (allMotivos[motivo][id] || 0) + 1
      })
    })

    // Ordenar por suma total y tomar top 6
    const sorted = Object.entries(allMotivos)
      .sort((a, b) => {
        const sumA = selectedUDNs.reduce((s, u) => s + (a[1][u] || 0), 0)
        const sumB = selectedUDNs.reduce((s, u) => s + (b[1][u] || 0), 0)
        return sumB - sumA
      })
      .slice(0, 6)

    // Normalizar cada UDN a 0-100
    const maxByUDN: Record<UDNId, number> = {} as any
    selectedUDNs.forEach(id => {
      maxByUDN[id] = Math.max(...sorted.map(([_, vals]) => vals[id] || 0), 1)
    })

    return {
      labels: sorted.map(([motivo]) => motivo),
      datasets: selectedUDNs.map(id => {
        const cfg = UDN_CONFIG[id]
        return {
          udn: id,
          color: cfg.color,
          label: cfg.label,
          values: sorted.map(([_, vals]) => ((vals[id] || 0) / maxByUDN[id]) * 100),
          raw: sorted.map(([_, vals]) => vals[id] || 0),
        }
      }),
    }
  }, [selectedUDNs, data])

  if (selectedUDNs.length === 0) return null

  const isMobileView = viewportW < 640
  const size = isMobileView ? Math.max(240, viewportW - 96) : 420
  const center = size / 2
  const radius = size * (isMobileView ? 0.32 : 0.40)
  const angleStep = (Math.PI * 2) / radarData.labels.length

  // Calcular puntos SVG para un dataset
  const getPoints = (values: number[]) =>
    values.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (v / 100) * radius
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
    })


  // Detectar el eje donde 2+ UDNs coinciden con valores altos, priorizando la UDN madre
  const udnMadre = (() => {
    const raw = perfil?.udn?.split(',')?.[0]?.trim() || ''
    const MAP: Record<string, UDNId> = {
      'UIX': 'UIX', 'MU': 'MU', 'PE': 'PE', 'ZU': 'ZU',
      'NC': 'NC', 'HOF': 'HOF', 'RL': 'RL', 'MEXA': 'MEXA',
    }
    return MAP[raw] || null
  })()

  const pulsoPos = useMemo(() => {
    if (radarData.labels.length === 0) return null
    console.log('radarData datasets:', radarData.datasets.map(ds => ({ udn: ds.udn, values: ds.values })))
    console.log('radarData labels:', radarData.labels)
    const UMBRAL = 30
    let mejorIdx = -1
    let mejorScore = -1
    radarData.labels.forEach((_, i) => {
      const valoresEje = radarData.datasets.map(ds => ({ udn: ds.udn, val: ds.values[i] }))
      // Buscar el par con valores más cercanos y ambos altos
      let minDiff = Infinity
      let mejorPar: { udn: string, val: number }[] = []
      for (let a = 0; a < valoresEje.length; a++) {
        for (let b = a + 1; b < valoresEje.length; b++) {
          const diff = Math.abs(valoresEje[a].val - valoresEje[b].val)
          const suma = valoresEje[a].val + valoresEje[b].val
          if (suma < 30) continue
          if (diff < minDiff) {
            minDiff = diff
            mejorPar = [valoresEje[a], valoresEje[b]]
          }
        }
      }
      if (mejorPar.length < 2) return
      const sumaValores = mejorPar.reduce((s, d) => s + d.val, 0)
      const incluyeMadre = udnMadre ? mejorPar.some(d => d.udn === udnMadre) : false
      const score = (incluyeMadre ? 5000 : 0) + sumaValores - minDiff * 2
      if (score > mejorScore) {
        mejorScore = score
        mejorIdx = i
      }
    })
    if (mejorIdx === -1) return null
    const _size = 420
    const _center = _size / 2
    const _radius = _size * 0.40
    const _angleStep = (Math.PI * 2) / radarData.labels.length
    const angle = mejorIdx * _angleStep - Math.PI / 2
    const maxVal = Math.max(...radarData.datasets.map(ds => ds.values[mejorIdx]))
    const r = (maxVal / 100) * _radius
    return { x: _center + r * Math.cos(angle), y: _center + r * Math.sin(angle), labelIdx: mejorIdx }
  }, [radarData, udnMadre])

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt-1)", marginBottom: 6 }}>
        ¿Compartimos los mismos problemas?
      </h3>
      <p style={{ fontSize: 12, color: "var(--txt-4)", marginBottom: 20 }}>
        Top 6 motivos de descalificación por UDN
      </p>

      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`-80 -80 ${size+160} ${size+160}`} style={{ overflow: "visible" }} className="mb-3">
          {/* Grid circular */}
          {[0.25, 0.5, 0.75, 1].map(pct => (
            <circle
              key={pct}
              cx={center} cy={center} r={radius * pct}
              fill="none" stroke="var(--border)" strokeWidth="1"
            />
          ))}
          {/* Líneas de ejes */}
          {radarData.labels.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const x = center + radius * Math.cos(angle)
            const y = center + radius * Math.sin(angle)
            return (
              <line key={i} x1={center} y1={center} x2={x} y2={y}
                stroke="var(--border)" strokeWidth="1"
              />
            )
          })}

          {/* Polígonos por UDN */}
          {radarData.datasets.map((ds, idx) => {
            const pts = getPoints(ds.values)
            const d = `M ${pts.map(p => p.join(',')).join(' L ')} Z`
            return (
              <g key={ds.udn}>
                <path
                  d={d}
                  fill={ds.color}
                  fillOpacity={0.30}
                  stroke={ds.color}
                  strokeWidth="3"
                  strokeOpacity={0.8}
                />
                {pts.map((p, i) => (
                  <circle key={i} cx={p[0]} cy={p[1]} r="3"
                    fill={ds.color} fillOpacity={0.9}
                  />
                ))}
              </g>
            )
          })}

          {/* Labels */}
          {radarData.labels.map((label, i) => {
            const angle = i * angleStep - Math.PI / 2
            const labelRadius = radius + (isMobileView ? 30 : 52)
            const x = center + labelRadius * Math.cos(angle)
            const y = center + labelRadius * Math.sin(angle)
            const anchor = x < center - 5 ? 'end' : x > center + 5 ? 'start' : 'middle'
            return (
              <text
                key={i} x={x} y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[11px] fill-[var(--txt-3)]"
                style={{ fontSize: isMobileView ? 10 : 14, fontWeight: 600 }}
                stroke="var(--card-bg)"
                strokeWidth="5"
                paintOrder="stroke"
                fill="var(--txt-1)"
              >
                {label}
              </text>
            )
          })}
          {pulsoPos && (
            <g
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => {
                const svgEl = (e.target as SVGElement).closest('svg')
                const rect = svgEl?.getBoundingClientRect()
                if (!rect) return
                const labelIdx = pulsoPos.labelIdx
                const label = radarData.labels[labelIdx] || ''
                const datasets = radarData.datasets.map(ds => ({
                  udn: ds.udn,
                  color: ds.color,
                  label: ds.label,
                  raw: ds.raw[labelIdx] ?? 0,
                })).filter(ds => ds.raw > 0).sort((a, b) => b.raw - a.raw)
                setTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  label,
                  datasets,
                })
              }}
              onMouseMove={e => {
                if (tooltip) setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle cx={pulsoPos.x} cy={pulsoPos.y} r="8" fill="none" stroke="#FBBF24" strokeWidth="3" opacity="0.9">
                <animate attributeName="r" values="8;28;8" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
              </circle>
              <circle cx={pulsoPos.x} cy={pulsoPos.y} r="5" fill="#FBBF24" opacity="1">
                <animate attributeName="r" values="5;7;5" dur="1.6s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </svg>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 justify-center">
          {radarData.datasets.map(ds => (
            <div key={ds.udn} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
              <span className="text-[var(--txt-2)]">{ds.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de valores raw */}
      <div className="overflow-x-auto mt-4" style={{ maxWidth: 480, margin: "16px auto 0", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-1.5 px-2 font-bold" style={{ color: "var(--txt-1)" }}>Motivo</th>
              {radarData.datasets.map(ds => (
                <th key={ds.udn} className="text-center py-1.5 px-2" style={{
                  color: ds.color === '#DCFF00' ? '#8a7a00' : ds.color
                }}>
                  {ds.udn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {radarData.labels.map((label, i) => (
              <tr key={label} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                <td className="py-1.5 px-2 text-[var(--txt-2)] font-medium">{label}</td>
                {radarData.datasets.map(ds => (
                  <td key={ds.udn} className="py-1.5 px-2 text-center text-[var(--txt-2)]">
                    {ds.raw[i]?.toLocaleString() || '0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 14, top: tooltip.y - 10,
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', minWidth: 160,
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 8 }}>
            {tooltip.label}
          </p>
          {tooltip.datasets.map(ds => (
            <div key={ds.udn} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ds.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--txt-2)', flex: 1 }}>{ds.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' }}>{ds.raw}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
