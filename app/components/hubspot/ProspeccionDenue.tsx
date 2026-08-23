'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'

const MapaProspeccion = dynamic(() => import('./MapaProspeccion'), {
  ssr: false,
  loading: () => <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando mapa...</div>
})

interface Rama { codigo: string; nombre: string; count: number }
interface Subrama { codigo: string; scian2: string; nombre: string; count: number }
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
const COLORES_RAMA = ['#8b5cf6','#0ea5e9','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6']

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }
type TabFiltro = 'actividad' | 'tamano' | 'geografia'

export default function ProspeccionDenue() {
  const [ramas, setRamas] = useState<Rama[]>([])
  const [subramas, setSubramas] = useState<Subrama[]>([])
  const [total, setTotal] = useState(0)
  const [loadingTree, setLoadingTree] = useState(true)
  const [perOcuSel, setPerOcuSel] = useState<string[]>([...PER_OCU_OPTS])
  const [estadoSel, setEstadoSel] = useState<string[]>([])
  const [ramaExpandida, setRamaExpandida] = useState<string | null>(null)
  const [ramaSel, setRamaSel] = useState<string | null>(null)
  const [subramaSel, setSubramaSel] = useState<{ scian2: string; codigo: string } | null>(null)
  const [detalle, setDetalle] = useState<Establecimiento[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [tabActivo, setTabActivo] = useState<TabFiltro>('actividad')

  useEffect(() => {
    setLoadingTree(true)
    const perOcuParam = perOcuSel.length < PER_OCU_OPTS.length ? `&per_ocu=${encodeURIComponent(perOcuSel.join(','))}` : ''
    fetch(`/api/prospeccion?mode=tree${perOcuParam}`)
      .then(r => r.json())
      .then(d => { setRamas(d.ramas || []); setSubramas(d.subramas || []); setTotal(d.total || 0); setLoadingTree(false) })
      .catch(() => setLoadingTree(false))
  }, [perOcuSel])

  useEffect(() => {
    if (!subramaSel) { setDetalle([]); return }
    setLoadingDetalle(true)
    const perOcuParam = perOcuSel.length < PER_OCU_OPTS.length ? `&per_ocu=${encodeURIComponent(perOcuSel.join(','))}` : ''
    fetch(`/api/prospeccion?mode=detalle&subrama4d=${subramaSel.codigo}${perOcuParam}`)
      .then(r => r.json())
      .then(d => { setDetalle(d.data || []); setLoadingDetalle(false) })
      .catch(() => setLoadingDetalle(false))
  }, [subramaSel, perOcuSel])

  const subramasPorRama = useMemo(() => {
    const m: Record<string, Subrama[]> = {}
    for (const s of subramas) { if (!m[s.scian2]) m[s.scian2] = []; m[s.scian2].push(s) }
    for (const k in m) m[k].sort((a, b) => b.count - a.count)
    return m
  }, [subramas])

  const detalleFiltradoPorEstado = useMemo(() => {
    if (estadoSel.length === 0) return detalle
    return detalle.filter(e => estadoSel.includes(e.entidad))
  }, [detalle, estadoSel])

  function togglePerOcu(opt: string) {
    setPerOcuSel(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }
  function toggleEstado(estado: string) {
    setEstadoSel(prev => prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado])
  }
  function colorRama(codigo: string) {
    const idx = ramas.findIndex(r => r.codigo === codigo)
    return COLORES_RAMA[idx % COLORES_RAMA.length]
  }

  const TABS: { id: TabFiltro; label: string }[] = [
    { id: 'actividad', label: 'Actividad económica' },
    { id: 'tamano', label: 'Tamaño del establecimiento' },
    { id: 'geografia', label: 'Área geográfica' },
  ]

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>Universo de prospección DENUE</h3>
        <span style={{ fontSize: 12, color: '#64748b' }}>{loadingTree ? 'Cargando...' : `${total.toLocaleString('es-MX')} empresas sin cartera activa`}</span>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>Establecimientos del DENUE que no han sido tocados aún — filtra por sector, tamaño y ubicación para encontrar prospectos.</p>

      {/* Tabs tipo DENUE */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTabActivo(t.id)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: 600, border: 'none', background: 'transparent',
            color: tabActivo === t.id ? '#6d28d9' : '#64748b',
            borderBottom: tabActivo === t.id ? '2px solid #6d28d9' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Panel del tab activo */}
      <div style={{ marginBottom: 16, maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
        {tabActivo === 'actividad' && (
          <div>
            {ramas.map(r => (
              <div key={r.codigo} style={{ marginBottom: 2 }}>
                <div onClick={() => setRamaExpandida(ramaExpandida === r.codigo ? null : r.codigo)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 2px', fontSize: 13, color: '#334155' }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, border: '1px solid #cbd5e1', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                  }}>{ramaExpandida === r.codigo ? '−' : '+'}</span>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: colorRama(r.codigo), flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{r.nombre}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.count.toLocaleString('es-MX')}</span>
                </div>
                {ramaExpandida === r.codigo && (
                  <div style={{ marginLeft: 24, borderLeft: '2px solid #e2e8f0', paddingLeft: 10 }}>
                    {(subramasPorRama[r.codigo] || []).map(s => (
                      <div key={s.codigo} onClick={() => setSubramaSel({ scian2: r.codigo, codigo: s.codigo })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 6px', fontSize: 12.5, borderRadius: 6,
                          background: subramaSel?.codigo === s.codigo ? '#ede9fe' : 'transparent',
                          color: subramaSel?.codigo === s.codigo ? '#6d28d9' : '#64748b',
                        }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: colorRama(r.codigo), opacity: 0.6, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{s.nombre}</span>
                        <span style={{ fontSize: 11 }}>{s.count.toLocaleString('es-MX')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tabActivo === 'tamano' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PER_OCU_OPTS.map(opt => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={perOcuSel.includes(opt)} onChange={() => togglePerOcu(opt)} />
                {opt}
              </label>
            ))}
          </div>
        )}

        {tabActivo === 'geografia' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {ESTADOS_MX.map(estado => (
              <label key={estado} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={estadoSel.includes(estado)} onChange={() => toggleEstado(estado)} />
                {estado}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Mapa: siempre visible */}
      <div style={{ marginBottom: 16 }}>
        <MapaProspeccion establecimientos={subramaSel ? detalleFiltradoPorEstado : []} />
      </div>

      {/* Tabla de resultados */}
      {!subramaSel && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 10 }}>
          Selecciona una actividad económica en el árbol para ver establecimientos
        </div>
      )}

      {subramaSel && (
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
              ) : detalleFiltradoPorEstado.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Sin resultados con estos filtros</td></tr>
              ) : detalleFiltradoPorEstado.map((e, i) => (
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
