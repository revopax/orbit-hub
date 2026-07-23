'use client'
import { useMemo, useState, useEffect } from 'react'
import { UDN_CONFIG, type UDNId } from './UDNSelector'

interface BloqueCegueraOperativaProps {
  selectedUDNs: UDNId[]
  data: Record<string, any>
  perfil?: any
}

const CAMPOS_CONTACTOS = [
  { key: 'empresa',       label: 'Nombre de empresa' },
  { key: 'industria',     label: 'Industria' },
]
const CAMPOS_NEGOCIOS = [
  { key: 'motivoPerdida', label: 'Motivo de pérdida' },
  { key: 'detallePerdida',label: 'Detalle de pérdida' },
]
const CAMPOS_CLAVE = [...CAMPOS_CONTACTOS, ...CAMPOS_NEGOCIOS]

export default function BloqueCegueraOperativa({ selectedUDNs, data, perfil }: BloqueCegueraOperativaProps) {
  const [isMobileView, setIsMobileView] = useState(false)
  useEffect(() => {
    const update = () => setIsMobileView(window.innerWidth < 768)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const ceguera = useMemo(() => {
    // Simular campos vacíos por UDN basado en datos disponibles
    return selectedUDNs.map(id => {

      const ceg = data.ceguera?.[id] || { total: 0, totalContactos: 0, totalNegocios: 0, scianCobertura: 0, campos: [] }
      const camposMap: Record<string, number> = {}
      ceg.campos.forEach((c: any) => { camposMap[c.key] = c.vacio })
      return {
        udn: id,
        total: ceg.total,
        totalContactos: ceg.totalContactos,
        totalNegocios: ceg.totalNegocios,
        scianCobertura: ceg.scianCobertura ?? 0,
        campos: CAMPOS_CLAVE.map(campo => ({
          ...campo,
          vacio: camposMap[campo.key] ?? 0,
        })),
      }
    })
  }, [selectedUDNs, data])

  const semaforo = (pct: number) => {
    if (pct > 0.85) return { bg: 'bg-red-500', text: 'text-red-700', label: 'Crítico', pct }
    if (pct > 0.60) return { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Alerta', pct }
    if (pct > 0.30) return { bg: 'bg-sky-500', text: 'text-sky-700', label: 'Regular', pct }
    return { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Sano', pct }
  }

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt-1)", marginBottom: 6 }} className="block">
        ¿Qué tan bien documentamos lo que entra y lo que se pierde?
      </h3>
      <p style={{ fontSize: 12, color: "var(--txt-4)", marginBottom: 20 }}>
        % de campos vacíos por UDN
      <div className="flex flex-wrap gap-3 mt-4 mb-6">
        <span className="flex items-center gap-1 text-xs text-[var(--txt-3)]">
          <span className="w-3 h-3 rounded bg-red-500" /> &gt;85% Crítico
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--txt-3)]">
          <span className="w-3 h-3 rounded bg-amber-500" /> 60-85% Alerta
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--txt-3)]">
          <span className="w-3 h-3 rounded bg-sky-500" /> 30-60% Regular
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--txt-3)]">
          <span className="w-3 h-3 rounded bg-emerald-500" /> &lt;30% Sano
        </span>
      </div>
      </p>

      {(() => {
        const udnPerfil = perfil?.udn?.split(',')?.[0]?.trim() || ''
        const UDN_MAP: Record<string, string> = {
          'UIX': 'UIX', 'MU': 'Marketing United', 'PE': 'Promo Espacio',
          'ZU': 'Zeus', 'NC': 'Neracode', 'HOF': 'House Of Films',
          'RL': 'Research Land', 'MEXA': 'Mexa Creativa',
        }
        const udnNombre = UDN_MAP[udnPerfil] || udnPerfil
        const miUDN = ceguera.find(u => u.udn === udnPerfil) || ceguera[0]

        const camposContacto = miUDN?.campos.filter((c: any) => c.key === 'empresa' || c.key === 'industria') || []
        const camposNegocio  = miUDN?.campos.filter((c: any) => c.key === 'motivoPerdida' || c.key === 'detallePerdida') || []
        const critContacto   = [...camposContacto].sort((a: any, b: any) => b.vacio - a.vacio)[0]
        const critNegocio    = [...camposNegocio].sort((a: any, b: any) => b.vacio - a.vacio)[0]

        const insightContacto = (campo: any) => {
          const pct = Math.round(campo.vacio * 100)
          if (campo.key === 'industria') return `Industria está vacía en el ${pct}% de los contactos${udnNombre ? ` de ${udnNombre}` : ''}. Sin ese dato no puedes cruzar el sector del cliente con el ciclo económico INEGI — pierdes precisión en el momento óptimo de prospección.`
          return `Nombre de empresa está vacío en el ${pct}% de los contactos${udnNombre ? ` de ${udnNombre}` : ''}. Sin empresa identificada no puedes segmentar ni priorizar a quién contactar primero.`
        }
        const insightNegocio = (campo: any) => {
          const pct = Math.round(campo.vacio * 100)
          if (campo.key === 'motivoPerdida') return `Motivo de pérdida está vacío en el ${pct}% de los negocios perdidos${udnNombre ? ` de ${udnNombre}` : ''}. Sin ese campo no puedes saber qué objeción se repite más ni ajustar el discurso comercial.`
          return `Detalle de pérdida está vacío en el ${pct}% de los negocios perdidos${udnNombre ? ` de ${udnNombre}` : ''}. Sin contexto no puedes decidir si vale la pena volver, cuándo hacerlo ni con qué argumento.`
        }

        const BLOQUES = [
          { titulo: 'Contactos', subtitulo: '¿Qué sabemos de quién entra?', campos: CAMPOS_CONTACTOS, insight: critContacto ? insightContacto(critContacto) : null, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' },
          { titulo: 'Negocios', subtitulo: '¿Por qué se pierden?', campos: CAMPOS_NEGOCIOS, insight: critNegocio ? insightNegocio(critNegocio) : null, color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
        ]

        return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr', gap: 20 }}>
        {BLOQUES.map(bloque => (
          <div key={bloque.titulo} style={{ background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', padding: '20px 24px' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 2 }}>{bloque.titulo}</p>
            <p style={{ fontSize: 11, color: 'var(--txt-4)', marginBottom: 16 }}>{bloque.subtitulo}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2 text-[var(--txt-3)] font-medium text-xs">UDN</th>
                  {bloque.campos.map(campo => (
                    <th key={campo.key} className="text-center py-2 px-2 text-[var(--txt-3)] font-medium text-xs">{campo.label}</th>
                  ))}
                  {bloque.titulo === 'Contactos' && (
                    <th className="text-center py-2 px-2 text-[var(--txt-3)] font-medium text-xs">Industria INEGI</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ceguera.map(u => {
                  const cfg = UDN_CONFIG[u.udn]
                  const camposMap: Record<string, number> = {}
                  u.campos.forEach(cc => { camposMap[cc.key] = cc.vacio })
                  return (
                    <tr key={u.udn} className="border-b border-[var(--border)]">
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-[var(--txt-1)]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          {cfg.label}
                        </span>
                        <div style={{ fontSize: 12, color: 'var(--txt-4)' }}>
                          {bloque.titulo === 'Contactos' ? u.totalContactos?.toLocaleString() : u.totalNegocios?.toLocaleString()} registros
                        </div>
                      </td>
                      {bloque.campos.map(campo => {
                        const pct = camposMap[campo.key] ?? 0
                        const s = semaforo(pct)
                        return (
                          <td key={campo.key} className="py-2 px-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div style={{ width: 56, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                                <div className={`h-full rounded-full ${s.bg}`} style={{ width: `${pct * 100}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${s.text}`}>{(pct * 100).toFixed(0)}% vacío</span>
                            </div>
                          </td>
                        )
                      })}
                      {bloque.titulo === 'Contactos' && (
                        <td className="py-2 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div style={{ width: 56, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 999, overflow: 'hidden' }}>
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(u.scianCobertura ?? 0) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-emerald-500">{((u.scianCobertura ?? 0) * 100).toFixed(0)}% cubierto</span>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {bloque.insight && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: bloque.bg, borderRadius: 8, border: `1px solid ${bloque.border}` }}>
                <p style={{ fontSize: 12, color: 'var(--txt-2)', margin: 0 }}>
                  <strong style={{ color: bloque.color }}>Hallazgo</strong>{' — '}{bloque.insight}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
        )
      })()}



    </div>
  )
}
