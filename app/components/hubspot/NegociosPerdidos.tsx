'use client';
import React, { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'

const ACCENT = '#FF6B35'
const HUBSPOT_PORTAL_ID = '24172997'
const SUPABASE_MBR_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR!
const SUPABASE_MBR_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MBR!

async function rpc<T>(fn: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_MBR_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_MBR_KEY, Authorization: `Bearer ${SUPABASE_MBR_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(`Error RPC ${fn}: ${res.status}`)
  return res.json()
}

const UDNS = ['Promo Espacio', 'Marketing United', 'Research Land', 'Mexa Creativa', 'House Of Films', 'UIX', 'Zeus', 'Neracode']
const UDN_COLORS: Record<string, string> = {
  'Promo Espacio': '#f97316', 'Marketing United': '#d4e157', 'Research Land': '#7c3aed',
  'Mexa Creativa': '#ec4899', 'House Of Films': '#111827', 'UIX': '#a3e635',
  'Zeus': '#ef4444', 'Neracode': '#4f46e5',
}
const MOTIVOS = ['Sin respuesta', 'Otro', 'Competencia', 'No tienen presupuesto', 'Automatización', 'Proyecto postergado', 'Desconocido', 'Precio demasiado alto', 'No autorizado por decisor', 'Procesos internos']
const FUENTES = ['Referido', 'Outbound', 'Inbound', 'Evento', 'Renovación']
const GENERADO = ['Marketing', 'Comercial']
const MESES = ['ene 2026', 'feb 2026', 'mar 2026', 'abr 2026', 'may 2026', 'jun 2026', 'jul 2026']

// ---- Tipos de respuesta de las RPCs ----
type RowUdn = { udn: string; registros: number }
type RowFuente = { fuente: string; registros: number }
type RowMotivo = { motivo: string; registros: number }
type RowMesFuente = { mes: string; fuente: string; registros: number }
type RowMesUdn = { mes: string; udn: string; registros: number }
type RowDetalle = { udn: string; empresa: string; fecha_perdido: string; motivo: string; detalle: string | null; hubspot_id: string; valor: number; total_registros: number; total_valor: number }

const cardStyle: React.CSSProperties = {
  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}
const thStyle: React.CSSProperties = {
  textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.04em', padding: '8px 10px', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
}
const tdStyle: React.CSSProperties = {
  fontSize: 12.5, color: '#1e293b', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top',
}
const selStyle: React.CSSProperties = {
  background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9,
  color: '#334155', padding: '7px 12px', fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
}

const fmtMoney = (v: number) => v ? '$' + Math.round(v).toLocaleString('es-MX') : '-'
const fmtMes = (m: string) => {
  const d = new Date(m + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
}

function pivot<T extends { mes: string; registros: number }>(rows: T[], dimKey: keyof T) {
  const meses = new Map<string, Record<string, number | string>>()
  const dims = new Set<string>()
  rows.forEach(r => {
    const dim = String(r[dimKey])
    dims.add(dim)
    if (!meses.has(r.mes)) meses.set(r.mes, { mes: fmtMes(r.mes) })
    const row = meses.get(r.mes)!
    row[dim] = (Number(row[dim]) || 0) + r.registros
  })
  const data = Array.from(meses.values()).map(row => {
    const total = Object.entries(row).reduce((s, [k, v]) => k === 'mes' ? s : s + Number(v), 0)
    return { ...row, __total: total }
  })
  return { data, dims: Array.from(dims) }
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div style={cardStyle}><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{titulo}</div>{children}</div>
}

function TablaSimple({ rows, dimLabel, dimKey }: { rows: { registros: number }[]; dimLabel: string; dimKey: string }) {
  const total = rows.reduce((s, r) => s + r.registros, 0)
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead><tr><th style={thStyle}>{dimLabel}</th><th style={{ ...thStyle, textAlign: 'right' }}>Opps</th></tr></thead>
      <tbody>
        {rows.map((r: any, i) => (
          <tr key={i}><td style={tdStyle}>{r[dimKey]}</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.registros}</td></tr>
        ))}
        <tr><td style={{ ...tdStyle, fontWeight: 800 }}>Total</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800 }}>{total}</td></tr>
      </tbody>
    </table>
  )
}

const DIM_COLORS = ['#f97316', '#d4e157', '#7c3aed', '#ec4899', '#111827', '#a3e635', '#ef4444', '#4f46e5', '#22c55e', '#64748b', '#0ea5e9', '#f59e0b']

function SerieApilada({ titulo, subtitulo, data, dims }: { titulo: string; subtitulo: string; data: any[]; dims: string[] }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{titulo}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>{subtitulo}</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {dims.map((d, i) => (
            <Bar key={d} dataKey={d} stackId="a" fill={DIM_COLORS[i % DIM_COLORS.length]}
              radius={i === dims.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}>
              {i === dims.length - 1 && <LabelList dataKey="__total" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} />}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function NegociosPerdidos() {
  const hoy = new Date()
  const [dateFrom] = useState(`${hoy.getFullYear()}-01-01`)
  const [dateTo] = useState(`${hoy.getFullYear()}-12-31`)
  const [fUdn, setFUdn] = useState('')
  const [fMotivo, setFMotivo] = useState('')
  const [pagina, setPagina] = useState(0)
  const PAGE = 20

  const [porUdn, setPorUdn] = useState<RowUdn[]>([])
  const [porFuente, setPorFuente] = useState<RowFuente[]>([])
  const [porMotivo, setPorMotivo] = useState<RowMotivo[]>([])
  const [serieFuente, setSerieFuente] = useState<{ data: any[]; dims: string[] }>({ data: [], dims: [] })
  const [serieUdn, setSerieUdn] = useState<{ data: any[]; dims: string[] }>({ data: [], dims: [] })
  const [detalle, setDetalle] = useState<RowDetalle[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    async function cargar() {
      setCargando(true); setError('')
      try {
        const params = { fecha_desde: dateFrom, fecha_hasta: dateTo }
        const [udn, fuente, motivo, mesFuente, mesUdn] = await Promise.all([
          rpc<RowUdn[]>('propuestas_perdidas_por_udn', params),
          rpc<RowFuente[]>('propuestas_perdidas_por_fuente', params),
          rpc<RowMotivo[]>('propuestas_perdidas_por_motivo', params),
          rpc<RowMesFuente[]>('propuestas_perdidas_por_mes_fuente', params),
          rpc<RowMesUdn[]>('propuestas_perdidas_por_mes_udn', params),
        ])
        if (!vivo) return
        setPorUdn(udn); setPorFuente(fuente); setPorMotivo(motivo)
        setSerieFuente(pivot(mesFuente, 'fuente'))
        setSerieUdn(pivot(mesUdn, 'udn'))
      } catch (e: any) { if (vivo) setError(e.message) }
      finally { if (vivo) setCargando(false) }
    }
    cargar()
    return () => { vivo = false }
  }, [dateFrom, dateTo])

  useEffect(() => {
    let vivo = true
    rpc<RowDetalle[]>('propuestas_perdidas_detalle', { fecha_desde: dateFrom, fecha_hasta: dateTo, lim: PAGE, off: pagina * PAGE })
      .then(rows => { if (vivo) setDetalle(rows) })
      .catch(e => { if (vivo) setError(e.message) })
    return () => { vivo = false }
  }, [dateFrom, dateTo, pagina])

  const totalRegistros = detalle[0]?.total_registros ?? 0
  const totalValor = detalle[0]?.total_valor ?? 0
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / PAGE))
  const detalleFiltrado = detalle.filter(r =>
    (!fUdn || r.udn === fUdn) && (!fMotivo || r.motivo === fMotivo)
  )

  return (
    <div>
      {/* Filtros */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={selStyle} value={fUdn} onChange={e => setFUdn(e.target.value)}>
            <option value="">Unidad de negocio</option>
            {porUdn.map(u => <option key={u.udn} value={u.udn}>{u.udn}</option>)}
          </select>
          <select style={selStyle} value={fMotivo} onChange={e => setFMotivo(e.target.value)}>
            <option value="">Motivo de perdido</option>
            {porMotivo.map(m => <option key={m.motivo} value={m.motivo}>{m.motivo}</option>)}
          </select>
          <div style={{ fontSize: 12, color: '#64748b' }}>Periodo: {dateFrom} → {dateTo}</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => { setFUdn(''); setFMotivo('') }}
              style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              ✕ Borrar filtros
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 11.5, color: '#64748b' }}>*Esta hoja muestra todos los datos a partir de la fecha en la que entró a su respectiva etapa.</div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>Error al cargar: {error}</div>}
        {cargando && <div style={{ fontSize: 13, color: '#64748b' }}>Cargando...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <Tarjeta titulo="Propuestas perdidas por UDN"><TablaSimple rows={porUdn} dimLabel="Unidad de negocio" dimKey="udn" /></Tarjeta>
          <Tarjeta titulo="Propuestas perdidas por Fuente"><TablaSimple rows={porFuente} dimLabel="Fuente de adquisición" dimKey="fuente" /></Tarjeta>
          <Tarjeta titulo="Propuestas perdidas por motivo"><TablaSimple rows={porMotivo} dimLabel="Motivo de descalificación" dimKey="motivo" /></Tarjeta>
        </div>

        <SerieApilada titulo="Propuestas perdidas en el tiempo por fuente"
          subtitulo="Por mes de fecha de pérdida, desglosado por fuente de adquisición"
          data={serieFuente.data} dims={serieFuente.dims} />
        <SerieApilada titulo="Propuestas perdidas en el tiempo por Unidad de negocio"
          subtitulo="Por mes de fecha de pérdida, desglosado por UDN"
          data={serieUdn.data} dims={serieUdn.dims} />

        {/* Tabla detalle */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Detalle de propuestas perdidas</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Unidad de negocio</th><th style={thStyle}>Empresa</th><th style={thStyle}>Fecha de pérdida</th>
                  <th style={thStyle}>Motivo</th><th style={thStyle}>Detalle de perdido</th><th style={thStyle}>Link</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {detalleFiltrado.map((r, i) => (
                  <tr key={r.hubspot_id + i}>
                    <td style={tdStyle}>{r.udn}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.empresa ?? '-'}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{r.fecha_perdido}</td>
                    <td style={tdStyle}>{r.motivo}</td>
                    <td style={{ ...tdStyle, maxWidth: 340, color: '#475569' }}>{r.detalle ?? '-'}</td>
                    <td style={tdStyle}>
                      <a href={`https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/record/0-3/${r.hubspot_id}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Ver en HubSpot</a>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtMoney(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Total: {fmtMoney(totalValor)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#64748b' }}>
              {totalRegistros === 0 ? '0' : pagina * PAGE + 1} - {Math.min((pagina + 1) * PAGE, totalRegistros)} / {totalRegistros}
              <button disabled={pagina === 0} onClick={() => setPagina(p => p - 1)}
                style={{ ...selStyle, padding: '4px 10px', opacity: pagina === 0 ? 0.4 : 1 }}>‹</button>
              <button disabled={pagina >= totalPaginas - 1} onClick={() => setPagina(p => p + 1)}
                style={{ ...selStyle, padding: '4px 10px', opacity: pagina >= totalPaginas - 1 ? 0.4 : 1 }}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
