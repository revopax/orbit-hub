'use client'
import { useMemo } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'

interface RadarPerdidasProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
}

export default function RadarPerdidas({ selectedUDNs, data }: RadarPerdidasProps) {
  const radarData = useMemo(() => {
    // Top 6 motivos globales normalizados por UDN
    const allMotivos: Record<string, Record<UDNId, number>> = {}

    selectedUDNs.forEach(id => {
      const rescue = data.rescue?.[id] || []
      rescue.forEach((r: any) => {
        const motivo = r.motivo || 'Sin especificar'
        if (!allMotivos[motivo]) allMotivos[motivo] = {} as Record<UDNId, number>
        allMotivos[motivo][id] = r.count || r.cantidad || 0
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

  const size = 280
  const center = size / 2
  const radius = size * 0.38
  const angleStep = (Math.PI * 2) / radarData.labels.length

  // Calcular puntos SVG para un dataset
  const getPoints = (values: number[]) =>
    values.map((v, i) => {
      const angle = i * angleStep - Math.PI / 2
      const r = (v / 100) * radius
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
    })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <h3 className="text-base font-bold text-slate-800 mb-1">
        ¿Por qué perdemos?
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Top 6 motivos de descalificación normalizados por UDN
      </p>

      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="mb-3">
          {/* Grid circular */}
          {[0.25, 0.5, 0.75, 1].map(pct => (
            <circle
              key={pct}
              cx={center} cy={center} r={radius * pct}
              fill="none" stroke="#e2e8f0" strokeWidth="1"
            />
          ))}
          {/* Líneas de ejes */}
          {radarData.labels.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2
            const x = center + radius * Math.cos(angle)
            const y = center + radius * Math.sin(angle)
            return (
              <line key={i} x1={center} y1={center} x2={x} y2={y}
                stroke="#e2e8f0" strokeWidth="1"
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
                  fillOpacity={0.12}
                  stroke={ds.color}
                  strokeWidth="2"
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
            const labelRadius = radius + 22
            const x = center + labelRadius * Math.cos(angle)
            const y = center + labelRadius * Math.sin(angle)
            const anchor = x < center - 5 ? 'end' : x > center + 5 ? 'start' : 'middle'
            return (
              <text
                key={i} x={x} y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="text-[9px] fill-slate-500"
                style={{ fontSize: 9 }}
              >
                {label.length > 18 ? label.slice(0, 16) + '...' : label}
              </text>
            )
          })}
        </svg>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 justify-center">
          {radarData.datasets.map(ds => (
            <div key={ds.udn} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
              <span className="text-slate-600">{ds.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de valores raw */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-1.5 px-2 text-slate-500 font-medium">Motivo</th>
              {radarData.datasets.map(ds => (
                <th key={ds.udn} className="text-center py-1.5 px-2" style={{ color: ds.color }}>
                  {ds.udn}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {radarData.labels.map((label, i) => (
              <tr key={label} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-1.5 px-2 text-slate-700 font-medium">{label}</td>
                {radarData.datasets.map(ds => (
                  <td key={ds.udn} className="py-1.5 px-2 text-center text-slate-600">
                    {ds.raw[i]?.toLocaleString() || '0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
