'use client'
import { useState, useEffect, useMemo } from 'react'

interface Rama { codigo: string; nombre: string; count: number }
interface Subrama { codigo: string; scian2: string; count: number }
interface Establecimiento {
  raz_social: string | null; nom_estab: string | null; codigo_act: string; nombre_act: string
  per_ocu: string; latitud: number | null; longitud: number | null
  telefono: string | null; correoelec: string | null; municipio: string; entidad: string
}

const PER_OCU_OPTS = ['11 a 30 personas', '31 a 50 personas', '51 a 100 personas', '101 a 250 personas', '251 y más personas']

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }

export default function ProspeccionDenue() {
  const [ramas, setRamas] = useState<Rama[]>([])
  const [subramas, setSubramas] = useState<Subrama[]>([])
  const [total, setTotal] = useState(0)
  const [loadingTree, setLoadingTree] = useState(true)
  const [perOcuSel, setPerOcuSel] = useState<string[]>([...PER_OCU_OPTS])
  const [ramaExpandida, setRamaExpandida] = useState<string | null>(null)
  const [subramaSel, setSubramaSel] = useState<{ scian2: string; codigo: string } | null>(null)
  const [detalle, setDetalle] = useState<Establecimiento[]>([])
  const [loadingDetalle, setLoadingDetalle] = useState(false)

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

  function togglePerOcu(opt: string) {
    setSubramaSel(null)
    setPerOcuSel(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>Universo de prospección DENUE</h3>
        <span style={{ fontSize: 12, color: '#64748b' }}>{loadingTree ? 'Cargando...' : `${total.toLocaleString('es-MX')} empresas sin cartera activa`}</span>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>Establecimientos del DENUE que no han sido tocados aún — filtra por sector y tamaño para encontrar prospectos.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, maxHeight: 480, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sectores (SCIAN)</div>
          {ramas.map(r => (
            <div key={r.codigo} style={{ marginBottom: 2 }}>
              <div onClick={() => setRamaExpandida(ramaExpandida === r.codigo ? null : r.codigo)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 2px', fontSize: 12.5, color: '#334155' }}>
                <span style={{ fontSize: 10, color: '#94a3b8', transform: ramaExpandida === r.codigo ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▾</span>
                <span style={{ flex: 1 }}>{r.nombre}</span>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.count.toLocaleString('es-MX')}</span>
              </div>
              {ramaExpandida === r.codigo && (
                <div style={{ marginLeft: 16, borderLeft: '2px solid #e2e8f0', paddingLeft: 8 }}>
                  {(subramasPorRama[r.codigo] || []).map(s => (
                    <div key={s.codigo} onClick={() => setSubramaSel({ scian2: r.codigo, codigo: s.codigo })}
                      style={{
                        display: 'flex', gap: 6, cursor: 'pointer', padding: '3px 4px', fontSize: 12, borderRadius: 6,
                        background: subramaSel?.codigo === s.codigo ? '#ede9fe' : 'transparent',
                        color: subramaSel?.codigo === s.codigo ? '#6d28d9' : '#64748b',
                      }}>
                      <span style={{ flex: 1 }}>{s.codigo}</span>
                      <span style={{ fontSize: 11 }}>{s.count.toLocaleString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tamaño de establecimiento</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PER_OCU_OPTS.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={perOcuSel.includes(opt)} onChange={() => togglePerOcu(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {!subramaSel && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 10 }}>
              Selecciona una subrama del árbol para ver establecimientos
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
                  ) : detalle.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#94a3b8' }}>Sin resultados con estos filtros</td></tr>
                  ) : detalle.map((e, i) => (
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
      </div>
    </div>
  )
}
