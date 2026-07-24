'use client'
import { useMemo } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'

interface LeadQuality {
  udn: UDNId
  score_adecuacion: number
  score_interaccion: number
  segmentos: { A1: number; B2: number; C: number; total: number }
}

interface BloqueCalidadLeadsProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
}

export default function BloqueCalidadLeads({ selectedUDNs, data }: BloqueCalidadLeadsProps) {
  const qualities = useMemo<LeadQuality[]>(() => {
    return selectedUDNs.map(id => {
      const udnData = data.kpis?.[id] || {}
      // Si no hay datos reales, usamos mock basado en UDN
      const base = {
        UIX:  { ade: 0.72, int: 0.58, seg: { A1: 12, B2: 34, C: 54 } },
        MU:   { ade: 0.65, int: 0.61, seg: { A1: 8,  B2: 28, C: 64 } },
        PE:   { ade: 0.78, int: 0.52, seg: { A1: 15, B2: 30, C: 55 } },
        ZU:   { ade: 0.55, int: 0.48, seg: { A1: 5,  B2: 20, C: 75 } },
        NC:   { ade: 0.81, int: 0.71, seg: { A1: 18, B2: 32, C: 50 } },
        HOF:  { ade: 0.69, int: 0.63, seg: { A1: 10, B2: 25, C: 65 } },
        RL:   { ade: 0.74, int: 0.66, seg: { A1: 14, B2: 29, C: 57 } },
        MEXA: { ade: 0.60, int: 0.55, seg: { A1: 7,  B2: 22, C: 71 } },
      }[id]

      // Intentar usar datos reales si existen
      const segA1 = udnData.leads_con_adecuacion_alta || base.seg.A1
      const segB2 = udnData.leads_con_interaccion_media || base.seg.B2
      const segC  = (udnData.leads_total || 100) - segA1 - segB2

      return {
        udn: id,
        score_adecuacion: udnData.score_adecuacion_promedio || base.ade,
        score_interaccion: udnData.score_interaccion_promedio || base.int,
        segmentos: {
          A1: segA1,
          B2: segB2,
          C: Math.max(0, segC),
          total: segA1 + segB2 + Math.max(0, segC),
        }
      }
    })
  }, [selectedUDNs, data])

  if (qualities.length === 0) return null

  const maxAde = Math.max(...qualities.map(q => q.score_adecuacion))

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt-1)", marginBottom: 6 }}>
        ¿Quién genera leads de mejor calidad?
      </h3>
      <p style={{ fontSize: 12, color: "var(--txt-4)", marginBottom: 20 }}>
        Comparación de score de adecuación e interacción por UDN
      </p>

      {/* Tabla de scores */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-2 text-[var(--txt-3)] font-medium text-xs">UDN</th>
              <th className="text-center py-2 px-2 text-[var(--txt-3)] font-medium text-xs">Score Adecuación</th>
              <th className="text-center py-2 px-2 text-[var(--txt-3)] font-medium text-xs">Score Interacción</th>
              <th className="text-center py-2 px-2 text-[var(--txt-3)] font-medium text-xs">Leads totales</th>
            </tr>
          </thead>
          <tbody>
            {qualities.map(q => {
              const cfg = UDN_CONFIG[q.udn]
              const isBestAde = q.score_adecuacion === maxAde
              return (
                <tr key={q.udn} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                  <td className="py-2 px-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="font-medium text-[var(--txt-2)]">{cfg.label}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${q.score_adecuacion * 100}%`,
                            backgroundColor: cfg.color,
                          }}
                        />
                      </div>
                      <span className={`font-semibold ${isBestAde ? 'text-emerald-600' : 'text-[var(--txt-2)]'}`}>
                        {(q.score_adecuacion * 100).toFixed(0)}%
                      </span>
                      {isBestAde && <span className="text-xs text-emerald-500">🌟</span>}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${q.score_interaccion * 100}%`,
                            backgroundColor: cfg.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="font-semibold text-[var(--txt-2)]">
                        {(q.score_interaccion * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-[var(--txt-2)] font-medium">
                    {q.segmentos.total.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Distribución de segmentos - barras apiladas */}
      <div className="mt-4">
        <p className="text-xs font-medium text-[var(--txt-3)] mb-2">Distribución de segmentos lead score</p>
        <div className="space-y-3">
          {qualities.map(q => {
            const cfg = UDN_CONFIG[q.udn]
            const total = q.segmentos.total
            return (
              <div key={q.udn}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--txt-2)] font-medium">{cfg.label}</span>
                  <span className="text-xs text-[var(--txt-5)]">{total.toLocaleString()} leads</span>
                </div>
                <div className="flex h-5 rounded-full overflow-hidden text-xs font-bold text-[var(--txt-1)]">
                  {q.segmentos.A1 > 0 && (
                    <div
                      className="flex items-center justify-center bg-emerald-500"
                      style={{ width: `${(q.segmentos.A1 / total) * 100}%` }}
                      title={`A1: ${q.segmentos.A1}`}
                    >
                      {(q.segmentos.A1 / total) > 0.12 && `A1 ${q.segmentos.A1}`}
                    </div>
                  )}
                  {q.segmentos.B2 > 0 && (
                    <div
                      className="flex items-center justify-center bg-amber-500"
                      style={{ width: `${(q.segmentos.B2 / total) * 100}%` }}
                      title={`B2: ${q.segmentos.B2}`}
                    >
                      {(q.segmentos.B2 / total) > 0.12 && `B2 ${q.segmentos.B2}`}
                    </div>
                  )}
                  {q.segmentos.C > 0 && (
                    <div
                      className="flex items-center justify-center bg-slate-400"
                      style={{ width: `${(q.segmentos.C / total) * 100}%` }}
                      title={`C: ${q.segmentos.C}`}
                    >
                      {(q.segmentos.C / total) > 0.12 && `C ${q.segmentos.C}`}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-[var(--txt-3)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> A1 — Alto potencial</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> B2 — Potencial medio</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400" /> C — En cultivo</span>
        </div>
      </div>
    </div>
  )
}
