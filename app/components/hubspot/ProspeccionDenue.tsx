'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { getProspeccionTree } from '../../lib/prospeccionTreeCache'

const MapaProspeccion = dynamic(() => import('./MapaProspeccion'), {
  ssr: false,
  loading: () => <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando mapa...</div>
})

interface Rama { codigo: string; nombre: string; count: number }
interface Subsector { codigo: string; scian2: string; nombre: string; count: number }
interface Subrama { codigo: string; scian3: string; nombre: string; count: number }
interface Establecimiento {
  raz_social: string | null; nom_estab: string | null; codigo_act: string; nombre_act: string
  per_ocu: string; latitud: number | null; longitud: number | null
  telefono: string | null; correoelec: string | null; municipio: string; entidad: string
}

const PER_OCU_OPTS = ['11 a 30 personas', '31 a 50 personas', '51 a 100 personas', '101 a 250 personas', '251 y más personas']
const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Coahuila de Zaragoza','Colima',
  'Chiapas','Chihuahua','Ciudad de México','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','México',
  'Michoacán de Ocampo','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo',
  'San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz de Ignacio de la Llave',
  'Yucatán','Zacatecas'
]
// Paleta fija replicando el portal DENUE por rama SCIAN
const COLOR_POR_RAMA: Record<string, string> = {
  '11': '#eab308', '21': '#92400e', '22': '#0ea5e9', '23': '#7c3aed',
  '31': '#16a34a', '32': '#16a34a', '33': '#16a34a',
  '43': '#2563eb', '46': '#2563eb', '48': '#f97316', '49': '#f97316',
  '51': '#c026d3', '52': '#c026d3', '53': '#c026d3', '54': '#c026d3', '55': '#c026d3',
  '56': '#c026d3', '61': '#c026d3', '62': '#c026d3', '71': '#c026d3', '72': '#c026d3', '81': '#c026d3',
  '93': '#dc2626',
}
export function colorRama(codigo: string) { return COLOR_POR_RAMA[codigo] || '#94a3b8' }

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }
type TabFiltro = 'actividad' | 'tamano' | 'geografia' | null

export default function ProspeccionDenue({ onTotalChange }: { onTotalChange?: (total: number) => void } = {}) {
  const [ramas, setRamas] = useState<Rama[]>([])
  const [subsectores, setSubsectores] = useState<Subsector[]>([])
  const [subramas, setSubramas] = useState<Subrama[]>([])
  const [total, setTotal] = useState(0)
  const [loadingTree, setLoadingTree] = useState(true)

  // Selecciones PENDIENTES (se editan libremente, no disparan queries)
  const [pendPerOcu, setPendPerOcu] = useState<string[]>([])
  const [pendEstados, setPendEstados] = useState<string[]>([])
  const [pendSubrama, setPendSubrama] = useState<{ scian2: string; codigo: string; nombre: string } | null>(null)
  const [ramaExpandida, setRamaExpandida] = useState<string | null>(null)
  const [subsectorExpandido, setSubsectorExpandido] = useState<string | null>(null)

  // Selecciones APLICADAS (solo cambian al presionar Consultar)
  const [appliedPerOcu, setAppliedPerOcu] = useState<string[]>([])
  const [appliedEstados, setAppliedEstados] = useState<string[]>([])
  const [appliedSubrama, setAppliedSubrama] = useState<{ scian2: string; codigo: string; nombre: string } | null>(null)

  const [detalle, setDetalle] = useState<Establecimiento[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [tabActivo, setTabActivo] = useState<TabFiltro>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Cargar árbol una sola vez (conteos generales, sin filtro de tamaño aplicado en vivo)
  useEffect(() => {
    let cancelled = false
    setLoadingTree(true)
    getProspeccionTree().then(d => {
      if (cancelled) return
      setRamas(d.ramas); setSubsectores(d.subsectores); setSubramas(d.subramas); setTotal(d.total); setLoadingTree(false)
      if (onTotalChange) onTotalChange(d.total)
    })
    return () => { cancelled = true }
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setTabActivo(null)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function ejecutarConsulta() {
    setAppliedPerOcu(pendPerOcu)
    setAppliedEstados(pendEstados)
    setAppliedSubrama(pendSubrama)
    setTabActivo(null)
    if (!pendSubrama) { setDetalle([]); return }
    setLoadingDetalle(true)
    const perOcuParam = pendPerOcu.length > 0 ? `&per_ocu=${encodeURIComponent(pendPerOcu.join(','))}` : ''
    fetch(`/api/prospeccion?mode=detalle&subrama4d=${pendSubrama.codigo}${perOcuParam}`)
      .then(r => r.json())
      .then(d => { setDetalle(d.data || []); setLoadingDetalle(false) })
      .catch(() => setLoadingDetalle(false))
  }

  function borrarTodo() {
    setPendPerOcu([]); setPendEstados([]); setPendSubrama(null); setRamaExpandida(null)
    setAppliedPerOcu([]); setAppliedEstados([]); setAppliedSubrama(null)
    setDetalle([]); setTabActivo(null)
  }

  const subsectoresPorRama = useMemo(() => {
    const m: Record<string, Subsector[]> = {}
    for (const s of subsectores) { if (!m[s.scian2]) m[s.scian2] = []; m[s.scian2].push(s) }
    for (const k in m) m[k].sort((a, b) => b.count - a.count)
    return m
  }, [subsectores])
  const subramasPorSubsector = useMemo(() => {
    const m: Record<string, Subrama[]> = {}
    for (const s of subramas) { if (!m[s.scian3]) m[s.scian3] = []; m[s.scian3].push(s) }
    for (const k in m) m[k].sort((a, b) => b.count - a.count)
    return m
  }, [subramas])

  const detalleFiltrado = useMemo(() => {
    if (appliedEstados.length === 0) return detalle
    return detalle.filter(e => appliedEstados.includes(e.entidad))
  }, [detalle, appliedEstados])

  function togglePerOcu(opt: string) {
    setPendPerOcu(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }
  function toggleEstado(estado: string) {
    setPendEstados(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado])
  }

  const labelActividad = pendSubrama ? pendSubrama.nombre : 'Actividad económica'
  const labelTamano = pendPerOcu.length === 0 ? 'Tamaño del establecimiento' : `${pendPerOcu.length} tamaño(s)`
  const labelGeografia = pendEstados.length === 0 ? 'Área geográfica' : `${pendEstados.length} estado(s)`

  const hayFiltrosActivos = appliedSubrama || appliedPerOcu.length > 0 || appliedEstados.length > 0

  return (
    <div style={cardStyle}>

      {/* Barra de tabs tipo DENUE */}
      <div ref={panelRef} style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, flexWrap: 'wrap' }}>
          {([
            { id: 'actividad' as const, label: labelActividad },
            { id: 'tamano' as const, label: labelTamano },
            { id: 'geografia' as const, label: labelGeografia },
          ]).map(t => (
            <button key={t.id} onClick={() => setTabActivo(tabActivo === t.id ? null : t.id)} style={{
              padding: '8px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 8,
              border: tabActivo === t.id ? '1px solid #6d28d9' : '1px solid #e2e8f0',
              background: tabActivo === t.id ? '#ede9fe' : '#fff',
              color: tabActivo === t.id ? '#6d28d9' : '#334155',
              cursor: 'pointer', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{t.label} ▾</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {hayFiltrosActivos && (
              <button onClick={borrarTodo} style={{
                padding: '8px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, border: '1px solid #fca5a5',
                background: '#fff', color: '#dc2626', cursor: 'pointer',
              }}>Borrar todo</button>
            )}
            <button onClick={ejecutarConsulta} style={{
              padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none',
              background: '#6d28d9', color: '#fff', cursor: 'pointer',
            }}>Consultar</button>
          </div>
        </div>

        {/* Dropdown de Actividad económica */}
        {tabActivo === 'actividad' && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 6, width: 420, maxHeight: 380, overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer', padding: '4px 2px', marginBottom: 4, borderBottom: '1px solid #f1f5f9' }}>
              <input type="checkbox" checked={!pendSubrama} onChange={() => setPendSubrama(null)} />
              Todas las unidades
            </label>
            {ramas.map(r => (
              <div key={r.codigo} style={{ marginBottom: 2 }}>
                <div onClick={() => setRamaExpandida(ramaExpandida === r.codigo ? null : r.codigo)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 2px', fontSize: 12.5, color: '#334155' }}>
                  <span style={{
                    width: 15, height: 15, borderRadius: 4, border: '1px solid #cbd5e1', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                  }}>{ramaExpandida === r.codigo ? '\u2212' : '+'}</span>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: colorRama(r.codigo), flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>({r.codigo}) {r.nombre}</span>
                </div>
                {ramaExpandida === r.codigo && (
                  <div style={{ marginLeft: 24, borderLeft: '2px solid #e2e8f0', paddingLeft: 10 }}>
                    {(subsectoresPorRama[r.codigo] || []).map(ss => (
                      <div key={ss.codigo} style={{ marginBottom: 1 }}>
                        <div onClick={() => setSubsectorExpandido(subsectorExpandido === ss.codigo ? null : ss.codigo)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 4px', fontSize: 12, color: '#475569' }}>
                          <span style={{
                            width: 13, height: 13, borderRadius: 3, border: '1px solid #cbd5e1', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                          }}>{subsectorExpandido === ss.codigo ? '\u2212' : '+'}</span>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorRama(r.codigo), opacity: 0.75, flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>({ss.codigo}) {ss.nombre}</span>
                        </div>
                        {subsectorExpandido === ss.codigo && (
                          <div style={{ marginLeft: 20, borderLeft: '2px solid #f1f5f9', paddingLeft: 10 }}>
                            {(subramasPorSubsector[ss.codigo] || []).map(s => (
                              <label key={s.codigo} style={{
                                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 6px', fontSize: 11.5, borderRadius: 6,
                                background: pendSubrama?.codigo === s.codigo ? '#ede9fe' : 'transparent',
                                color: pendSubrama?.codigo === s.codigo ? '#6d28d9' : '#64748b',
                              }}>
                                <input type="radio" name="subrama" checked={pendSubrama?.codigo === s.codigo}
                                  onChange={() => setPendSubrama({ scian2: r.codigo, codigo: s.codigo, nombre: s.nombre })} />
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorRama(r.codigo), opacity: 0.5, flexShrink: 0 }} />
                                <span>({s.codigo}) {s.nombre}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dropdown de Tamaño */}
        {tabActivo === 'tamano' && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 6, width: 260, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer', padding: '4px 2px', marginBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
              <input type="checkbox" checked={pendPerOcu.length === 0} onChange={() => setPendPerOcu([])} />
              Todos los tamaños
            </label>
            {PER_OCU_OPTS.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', cursor: 'pointer', padding: '4px 2px' }}>
                <input type="checkbox" checked={pendPerOcu.includes(opt)} onChange={() => togglePerOcu(opt)} />
                {opt}
              </label>
            ))}
          </div>
        )}

        {/* Dropdown de Área geográfica */}
        {tabActivo === 'geografia' && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, marginTop: 6, width: 460, maxHeight: 340, overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer', padding: '4px 2px', marginBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
              <input type="checkbox" checked={pendEstados.length === 0} onChange={() => setPendEstados([])} />
              Todo el país
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
              {ESTADOS_MX.map(estado => (
                <label key={estado} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer', padding: '3px 2px' }}>
                  <input type="checkbox" checked={pendEstados.includes(estado)} onChange={() => toggleEstado(estado)} />
                  {estado}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mapa: siempre visible */}
      <div style={{ marginBottom: 16 }}>
        <MapaProspeccion establecimientos={appliedSubrama ? detalleFiltrado : []} />
      </div>

      {/* Tabla de resultados */}
      {!appliedSubrama && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 10 }}>
          Selecciona una actividad económica y presiona "Consultar" para ver establecimientos
        </div>
      )}

      {appliedSubrama && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>Empresa</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>Municipio</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>Tamaño</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 600 }}>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {loadingDetalle ? (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Cargando...</td></tr>
              ) : detalleFiltrado.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Sin resultados con estos filtros</td></tr>
              ) : detalleFiltrado.map((e, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 10px' }}>{e.raz_social || e.nom_estab || '—'}</td>
                  <td style={{ padding: '7px 10px', color: '#64748b' }}>{e.municipio}, {e.entidad}</td>
                  <td style={{ padding: '7px 10px', color: '#64748b' }}>{e.per_ocu}</td>
                  <td style={{ padding: '7px 10px', color: '#64748b' }}>{e.telefono || e.correoelec || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
