'use client'
import { useMemo, useState } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'

interface BloqueCrossSellProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
}

interface CrossSellEmpresa {
  empresa: string
  udns: Record<string, { etapa: string; valor: string; fechaCreacion: string; tipoObjeto: string }>
  count: number
}

export default function BloqueCrossSell({ selectedUDNs, data }: BloqueCrossSellProps) {
  const [mostrarContactos, setMostrarContactos] = useState(false)

  const crossSell = useMemo<CrossSellEmpresa[]>(() => {
    // Empresas que aparecen en 2+ UDNs de las seleccionadas
    const empresaMap: Record<string, CrossSellEmpresa> = {}

    selectedUDNs.forEach(id => {
      const empresas = data.empresas_pico?.[id] || []
      empresas.forEach((e: any) => {
        // Solo negocios reales para cross-sell
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

    // Filtrar solo empresas en 2+ UDNs
    return Object.values(empresaMap)
      .filter(e => e.count >= 2)
      .sort((a, b) => b.count - a.count)
  }, [selectedUDNs, data, mostrarContactos])

  const negociosCount = crossSell.filter(e =>
    Object.values(e.udns).some(u => u.tipoObjeto === 'negocio')
  ).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-slate-800">
          Cross-sell: empresas en 2+ UDNs
        </h3>
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
          <input
            type="checkbox"
            checked={mostrarContactos}
            onChange={e => setMostrarContactos(e.target.checked)}
            className="rounded border-slate-300"
          />
          Incluir contactos
        </label>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        {mostrarContactos
          ? `${crossSell.length} empresas/contactos con presencia en 2+ UDNs`
          : `${negociosCount} negocios reales con presencia en 2+ UDNs (vs 5,989 contactos que son campañas paralelas)`
        }
      </p>

      {crossSell.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          No hay empresas compartidas entre las UDNs seleccionadas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-2 text-slate-500 font-medium">Empresa</th>
                <th className="text-center py-2 px-2 text-slate-500 font-medium"># UDNs</th>
                {selectedUDNs.map(id => (
                  <th key={id} className="text-center py-2 px-2" style={{ color: UDN_CONFIG[id].color }}>
                    {id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crossSell.slice(0, 50).map(e => (
                <tr key={e.empresa} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-2 font-medium text-slate-700">{e.empresa}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {e.count}
                    </span>
                  </td>
                  {selectedUDNs.map(id => {
                    const info = e.udns[id]
                    return (
                      <td key={id} className="py-2 px-2 text-center">
                        {info ? (
                          <div className="flex flex-col items-center">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              info.etapa?.toLowerCase().includes('gan') ? 'bg-emerald-50 text-emerald-700' :
                              info.etapa?.toLowerCase().includes('perd') ? 'bg-red-50 text-red-700' :
                              'bg-sky-50 text-sky-700'
                            }`}>
                              {info.etapa}
                            </span>
                            {info.valor !== '-' && (
                              <span className="text-[10px] text-slate-400 mt-0.5">{info.valor}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {crossSell.length > 50 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              +{crossSell.length - 50} empresas más. Activa "Incluir contactos" para ver todo.
            </p>
          )}
        </div>
      )}

      <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <p className="text-xs text-emerald-800">
          <strong>Oportunidad:</strong> {negociosCount} negocios reales ya tienen relación con UPAX en múltiples UDNs.
          ¿Coordinar cuenta conjunta para cross-sell de servicios complementarios?
        </p>
      </div>
    </div>
  )
}
