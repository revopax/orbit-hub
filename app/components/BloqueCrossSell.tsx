'use client'
import { useMemo, useState } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'
import { SimplePeriodPicker } from './SimplePeriodPicker'

interface BloqueCrossSellProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
  brandColor?: string
}

interface CrossSellEmpresa {
  empresa: string
  udns: Record<string, { etapa: string; valor: string; fechaCreacion: string; tipoObjeto: string }>
  count: number
}

const MESES_ES: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
}

function parseFecha(str: string): Date | null {
  if (!str || str === '-') return null
  // Formato ISO: "2026-03-05" o slice de 10 chars
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  // Formato "%b %Y" en español lowercase: "ago 2026"
  const esp = str.match(/^([a-záéíóú]{3})\s+(\d{4})$/i)
  if (esp) {
    const mes = MESES_ES[esp[1].toLowerCase()]
    if (mes !== undefined) return new Date(Number(esp[2]), mes, 1)
  }
  return null
}

function formatoCorto(str: string): string {
  const d = parseFecha(str)
  if (!d) return str
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function opacidadPorAntiguedad(str: string): number {
  const d = parseFecha(str)
  if (!d) return 0.7
  const meses = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (meses <= 3) return 1
  if (meses <= 12) return 0.72
  return 0.42
}

export default function BloqueCrossSell({ selectedUDNs, data, brandColor = '#8C59FE' }: BloqueCrossSellProps) {
  const [mostrarContactos, setMostrarContactos] = useState(false)
  const anioActual = new Date().getFullYear()
  const [desde, setDesde] = useState(`${anioActual}-01`)
  const [hasta, setHasta] = useState(`${anioActual}-12`)

  const crossSellSinFiltro = useMemo<CrossSellEmpresa[]>(() => {
    const empresaMap: Record<string, CrossSellEmpresa> = {}

    selectedUDNs.forEach(id => {
      const empresas = data.empresas_pico?.[id] || []
      empresas.forEach((e: any) => {
        if (!mostrarContactos && e.tipoObjeto !== 'negocio') return

        const nombre = e.empresa || e.nombre || ''
        if (!nombre) return

        if (!empresaMap[nombre]) {
          empresaMap[nombre] = { empresa: nombre, udns: {}, count: 0 }
        }
        empresaMap[nombre].udns[id] = {
          etapa: e.etapa || '-',
          valor: e.valor || '-',
          fechaCreacion: e.fechaCreacion || '-',
          tipoObjeto: e.tipoObjeto || '-',
        }
        empresaMap[nombre].count++
      })
    })

    return Object.values(empresaMap)
      .filter(e => e.count >= 2)
      .sort((a, b) => b.count - a.count)
  }, [selectedUDNs, data, mostrarContactos])

  const crossSell = useMemo(() => {
    const desdeD = new Date(desde + '-01')
    const hastaD = new Date(hasta + '-01')
    hastaD.setMonth(hastaD.getMonth() + 1) // incluir todo el mes de "hasta"

    return crossSellSinFiltro.filter(e =>
      Object.values(e.udns).some(u => {
        const d = parseFecha(u.fechaCreacion)
        return d && d >= desdeD && d < hastaD
      })
    )
  }, [crossSellSinFiltro, desde, hasta])

  const negociosCount = crossSell.filter(e =>
    Object.values(e.udns).some(u => u.tipoObjeto === 'negocio')
  ).length

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
      <div className="flex items-center justify-between mb-1" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h3 className="text-base font-bold text-[var(--txt-1)]">
          Cross-sell: empresas en 2+ UDNs
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <label className="flex items-center gap-2 text-xs text-[var(--txt-3)] cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarContactos}
              onChange={e => setMostrarContactos(e.target.checked)}
              className="rounded border-slate-300"
            />
            Incluir contactos
          </label>
          <SimplePeriodPicker desde={desde} hasta={hasta} onChange={(d, h) => { setDesde(d); setHasta(h) }} brandColor={brandColor} />
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--txt-4)", marginBottom: 20 }}>
        {mostrarContactos
          ? `${crossSell.length} empresas/contactos con presencia en 2+ UDNs`
          : `${negociosCount} negocios reales con presencia en 2+ UDNs en el periodo seleccionado`
        }
      </p>

      {crossSell.length === 0 ? (
        <p className="text-sm text-[var(--txt-5)] italic">
          No hay empresas compartidas entre las UDNs seleccionadas en este periodo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-2 text-[var(--txt-3)] font-medium">Empresa</th>
                <th className="text-center py-2 px-2 text-[var(--txt-3)] font-medium"># UDNs</th>
                {selectedUDNs.map(id => (
                  <th key={id} className="text-center py-2 px-2" style={{ color: UDN_CONFIG[id].color }}>
                    {id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crossSell.slice(0, 50).map(e => (
                <tr key={e.empresa} className="border-b border-[var(--border)] hover:bg-[var(--bg)]">
                  <td className="py-2 px-2 font-medium text-[var(--txt-2)]">{e.empresa}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg)] text-[var(--txt-2)] font-bold">
                      {e.count}
                    </span>
                  </td>
                  {selectedUDNs.map(id => {
                    const info = e.udns[id]
                    return (
                      <td key={id} className="py-2 px-2 text-center">
                        {info ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              info.etapa?.toLowerCase().includes('gan') ? 'bg-emerald-500/10 text-emerald-500' :
                              info.etapa?.toLowerCase().includes('perd') ? 'bg-red-500/10 text-red-500' :
                              'bg-sky-500/10 text-sky-500'
                            }`}>
                              {info.etapa}
                            </span>
                            {info.valor !== '-' && (
                              <span className="text-xs text-[var(--txt-5)] mt-0.5">{info.valor}</span>
                            )}
                            {info.fechaCreacion !== '-' && (
                              <span style={{ fontSize: 10, color: 'var(--txt-6)', marginTop: 2, opacity: opacidadPorAntiguedad(info.fechaCreacion) }}>
                                {formatoCorto(info.fechaCreacion)}
                              </span>
                            )}
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

          {crossSell.length > 50 && (
            <p className="text-xs text-[var(--txt-5)] mt-2 text-center">
              +{crossSell.length - 50} empresas más. Activa "Incluir contactos" para ver todo.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-500/20">
        <p className="text-xs text-emerald-800">
          <strong>Oportunidad:</strong> {negociosCount} negocios reales ya tienen relación con UPAX en múltiples UDNs.
          ¿Coordinar cuenta conjunta para cross-sell de servicios complementarios?
        </p>
      </div>
    </div>
  )
}
