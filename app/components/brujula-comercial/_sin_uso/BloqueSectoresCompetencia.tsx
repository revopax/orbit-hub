'use client'
import { useMemo } from 'react'
import { UDN_CONFIG, type UDNId } from '../UDNSelector'

interface BloqueSectoresCompetenciaProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
}

export default function BloqueSectoresCompetencia({ selectedUDNs, data }: BloqueSectoresCompetenciaProps) {
  const sectoresMatrix = useMemo(() => {
    // Recolectar todos los sectores de las UDNs seleccionadas
    const sectorMap: Record<string, {
      nombre: string
      udns: Record<UDNId, { temperatura: string; mesPico: string; leads: number }>
    }> = {}

    selectedUDNs.forEach(id => {
      const sectores = data.industrias?.[id] || []
      sectores.forEach((s: any) => {
        const nombre = s.nombre || s.SCIAN_nombre || 'Sin clasificar'
        if (!sectorMap[nombre]) {
          sectorMap[nombre] = { nombre, udns: {} as Record<UDNId, any> }
        }
        sectorMap[nombre].udns[id] = {
          temperatura: s.temperatura || 'tibio',
          mesPico: s.mesPico || s.mes_pico || '-',
          leads: s.leads || 0,
        }
      })
    })

    // Filtrar solo sectores presentes en 2+ UDNs (solapamiento)
    const overlap = Object.values(sectorMap).filter(s =>
      Object.keys(s.udns).length >= 2
    )

    // Ordenar por temperatura (caliente primero) y luego por leads
    const tempOrder = { caliente: 0, templado: 1, tibio: 2, frio: 3 }
    return overlap.sort((a, b) => {
      const aTemp = Math.min(...Object.values(a.udns).map(u => tempOrder[u.temperatura as keyof typeof tempOrder] ?? 9))
      const bTemp = Math.min(...Object.values(b.udns).map(u => tempOrder[u.temperatura as keyof typeof tempOrder] ?? 9))
      return aTemp - bTemp
    })
  }, [selectedUDNs, data])

  if (sectoresMatrix.length === 0) {
    return (
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt-1)", marginBottom: 6 }}>
          ¿En qué sectores competimos?
        </h3>
        <p className="text-xs text-[var(--txt-3)]">
          Selecciona 2+ UDNs para ver solapamiento de sectores.
        </p>
      </div>
    )
  }

  const tempBadge = (temp: string) => {
    const colors: Record<string, string> = {
      caliente: 'bg-red-500/10 text-red-500 border-red-500/20',
      templado: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      tibio: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
      frio: 'bg-[var(--bg)] text-[var(--txt-2)] border-[var(--border)]',
    }
    const labels: Record<string, string> = {
      caliente: '● Caliente',
      templado: '● Templado',
      tibio: '● Tibio',
      frio: '● Frío',
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${colors[temp] || colors.tibio}`}>
        {labels[temp] || temp}
      </span>
    )
  }

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt-1)", marginBottom: 6 }}>
        ¿En qué sectores competimos las {selectedUDNs.length} UDNs?
      </h3>
      <p style={{ fontSize: 12, color: "var(--txt-4)", marginBottom: 20 }}>
        {sectoresMatrix.length} sectores con solapamiento — nivel de actividad + mes pico
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left py-2 px-2 text-[var(--txt-3)] font-medium">Sector</th>
              {selectedUDNs.map(id => (
                <th key={id} className="text-center py-2 px-2" style={{ color: UDN_CONFIG[id].color }}>
                  {id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectoresMatrix.map(sector => (
              <tr key={sector.nombre} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                <td className="py-2 px-2">
                  <div className="font-medium text-[var(--txt-2)]">{sector.nombre}</div>
                </td>
                {selectedUDNs.map(id => {
                  const info = sector.udns[id]
                  return (
                    <td key={id} className="py-2 px-2 text-center">
                      {info ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {tempBadge(info.temperatura)}
                          <span className="text-xs text-[var(--txt-5)]">{info.mesPico}</span>
                          <span className="text-xs text-[var(--txt-3)] font-medium">{info.leads.toLocaleString()} leads</span>
                        </div>
                      ) : (
                        <span className="text-[var(--txt-5)]">-</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-500/20">
        <p className="text-xs text-amber-800">
          <strong>Insight:</strong> {sectoresMatrix.filter(s =>
            Object.values(s.udns).some(u => u.temperatura === 'caliente')
          ).length} sectores calientes compartidos — ¿oportunidad de coordinar esfuerzos o de asignar exclusividad?
        </p>
      </div>
    </div>
  )
}
