'use client'
import React, { useState, useRef, useEffect } from 'react'
import NegociosPerdidos from './hubspot/NegociosPerdidos'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'


// Shapes SVG personalizados con efecto brilloso (gloss overlay), igual que el funnel.
// RoundedTopBar: segmento superior del stack, con esquina redondeada arriba.
const RoundedTopBar = (props: any) => {
  const { x, y, width, height, fill } = props
  if (!height || height <= 0) return null
  const r = Math.min(6, width / 2, height)
  const d = `M${x},${y + r}
    A${r},${r} 0 0 1 ${x + r},${y}
    L${x + width - r},${y}
    A${r},${r} 0 0 1 ${x + width},${y + r}
    L${x + width},${y + height}
    L${x},${y + height}
    Z`
  return <path d={d} fill={fill} />
}

// GlossyBar: segmentos intermedios del stack (rectangulo recto) con el mismo overlay de brillo.
const GlossyBar = (props: any) => {
  const { x, y, width, height, fill } = props
  if (!height || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} fill={fill} />
}
const SUPABASE_MBR_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR!
const SUPABASE_MBR_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MBR!

// Colores fijos por UDN (definidos por el usuario)
const UDN_COLORS: Record<string, string> = {
  'Mexa Creativa': '#FD00C7',
  'House Of Films': '#000000',
  'Marketing United': '#dcff00',
  'UIX': '#ACE738',
  'Neracode': '#3E31CC',
  'Zeus': '#FF004F',
  'Research Land': '#770EB7',
  'Promo Espacio': '#FF7600',
  'MS': '#06065B',
  'CF': '#C6C6F4',
  'Upax': '#323644',
}
const UDN_COLOR_FALLBACK = '#94a3b8'

type SubTab = 'home' | 'mbr' | 'perdidos' | 'email'

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: 'home',     label: 'Home' },
  { id: 'mbr',      label: 'MBR' },
  { id: 'perdidos', label: 'Negocios perdidos' },
  { id: 'email',    label: 'Email marketing' },
]

const ACCENT = '#FF6B35'

const DUMMY = {
  actualizado: 'Datos de ejemplo — pendiente de conexión a HubSpot',
  total: { contactos: 39187, leads: 9752, mqls: 1456, sqls: 340, opps: 696, clientes: 62 },
  marketing: { contactos: 25311, leads: 8501, mqls: 1351, sqls: 286, opps: 398, clientes: 25, valor: 3170639 },
  comercial:  { contactos: 13876, leads: 1251, mqls: 103,  sqls: 54,  opps: 276, clientes: 34, valor: 10529923 },
  tasas: [
    { label: 'Tasa Contacto - Lead', valor: 24.89, ideal: null as number | null },
    { label: 'Tasa Lead - MQL',      valor: 14.93, ideal: 4 },
    { label: 'Tasa MQL - SQL',       valor: 23.35, ideal: 30 },
    { label: 'Tasa SQL - Opp',       valor: 204.71, ideal: 80 },
    { label: 'Tasa Opp - Cliente',   valor: 8.91,  ideal: 20 },
  ],
  extras: { mqlDescalificados: 875, sqlObjetadas: 18, oppsPerdidas: 385, ganadosPorFacturar: 113, ganadosPorFacturarValor: 63861022, clientesValor: 14055420 },
}

const UDNS_LIST = ['Upax', 'Promo Espacio', 'Marketing United', 'Research Land', 'Mexa Creativa', 'House Of Films', 'UiX', 'Zeus', 'Neracode']
const FUENTES_LIST = ['Chatflow', 'Content Nurturing', 'Evento', 'Inbound', 'Paid Media', 'Prospección', 'RRSS', 'RRSS Paid', 'Referido IA', 'Referidos', 'Sin fuente', 'Website']
type FiltrosHome = {
  udn: string; origen: string; conversion: string; fuente: string; fuenteConversion: string
}
const FILTROS_VACIOS: FiltrosHome = { udn: '', origen: '', conversion: '', fuente: '', fuenteConversion: '' }
function filtrosParams(f: FiltrosHome) {
  return {
    p_udn: f.udn || null,
    p_origen: f.origen || null,
    p_conversion: f.conversion || null,
    p_fuente: f.fuente || null,
    p_fuente_conversion: f.fuenteConversion || null,
  }
}

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

const PRESETS = [
  { label: 'Últimos 30 días',   fn: () => { const d = new Date(), s = new Date(); s.setDate(s.getDate() - 30); return [toDateStr(s), toDateStr(d)] as [string, string] } },
  { label: 'Últimos 90 días',   fn: () => { const d = new Date(), s = new Date(); s.setDate(s.getDate() - 90); return [toDateStr(s), toDateStr(d)] as [string, string] } },
  { label: 'Este año',          fn: () => [`${new Date().getFullYear()}-01-01`, toDateStr(new Date())] as [string, string] },
  { label: 'Todo el historial', fn: () => ['2025-01-01', toDateStr(new Date())] as [string, string] },
]

function fmtMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}
function fmtNum(n: number) {
  return new Intl.NumberFormat('es-MX').format(n)
}

const FUNNEL_STAGES: { label: string; key: keyof typeof DUMMY.total; color: string; tasaLabel?: string; tasaIdeal?: number | null }[] = [
  { label: 'Contactos', key: 'contactos', color: '#E8402C' },
  { label: 'Leads',     key: 'leads',     color: '#D6272F', tasaLabel: 'Tasa Contacto - Lead', tasaIdeal: null },
  { label: 'MQLs',      key: 'mqls',      color: '#C11740', tasaLabel: 'Tasa Lead - MQL',      tasaIdeal: 4 },
  { label: 'SQLs',      key: 'sqls',      color: '#9B1355', tasaLabel: 'Tasa MQL - SQL',       tasaIdeal: 30 },
  { label: 'Opps',      key: 'opps',      color: '#7A2A9E', tasaLabel: 'Tasa SQL - Opp',       tasaIdeal: 80 },
  { label: 'Clientes',  key: 'clientes',  color: '#3B4FCE', tasaLabel: 'Tasa Opp - Cliente',   tasaIdeal: 20 },
]

// Posiciones verticales (top%, height%) de cada anillo, medidas sobre la imagen real (1288x832).
// El cono ocupa aprox. desde 8% hasta 88% de la altura total del lienzo.
function CountUpNumber({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)
  useEffect(() => {
    const from = prevValue.current
    const to = value
    if (from === to) return
    const duration = 900
    const start = performance.now()
    let raf: number
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else prevValue.current = to
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className={className} style={style}>{fmtNum(display)}</span>
}

const RING_POSITIONS = [
  { top: 27, height: 13 },  // Contactos (naranja)
  { top: 42, height: 12 },  // Leads (rojo/cafe)
  { top: 56, height: 11 },  // MQLs (vino)
  { top: 66, height: 10 },  // SQLs (magenta) - subido un poco
  { top: 78, height: 10 },  // Opps (morado)
  { top: 90, height: 8  },  // Clientes (azul, punta)
]

type FunnelTotales = {
  contactos: number
  leads: number
  mqls: number
  sqls: number
  opps: number
  clientes: number
  clientesValor: number
  ganadosPorFacturarValor: number
  mqlDescalificados: number
  sqlObjetadas: number
  oppsPerdidas: number
  ganadosPorFacturarCount: number
  clientesFacturadosRango: number
  clientesValorFacturadoRango: number
}

async function fetchFunnelTotales(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<FunnelTotales> {
  // Funcion RPC funnel_totales: hace todos los counts/sums directamente en Postgres
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/funnel_totales`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!res.ok) throw new Error(`Error RPC funnel_totales: ${res.status}`)
  const rows: {
    contactos: number; leads: number; mqls: number; sqls: number; opps: number; clientes: number
    clientes_valor: number; ganado_por_facturar_valor: number
    mql_descalificados: number; sql_objetadas: number; opps_perdidas: number; ganados_por_facturar_count: number
    clientes_facturados_rango: number; clientes_valor_facturado_rango: number
  }[] = await res.json()
  const row = rows[0] || {
    contactos: 0, leads: 0, mqls: 0, sqls: 0, opps: 0, clientes: 0, clientes_valor: 0, ganado_por_facturar_valor: 0,
    mql_descalificados: 0, sql_objetadas: 0, opps_perdidas: 0, ganados_por_facturar_count: 0,
    clientes_facturados_rango: 0, clientes_valor_facturado_rango: 0,
  }
  return {
    contactos: row.contactos, leads: row.leads, mqls: row.mqls, sqls: row.sqls,
    opps: row.opps, clientes: row.clientes,
    clientesValor: row.clientes_valor, ganadosPorFacturarValor: row.ganado_por_facturar_valor,
    mqlDescalificados: row.mql_descalificados, sqlObjetadas: row.sql_objetadas,
    oppsPerdidas: row.opps_perdidas, ganadosPorFacturarCount: row.ganados_por_facturar_count,
    clientesFacturadosRango: row.clientes_facturados_rango, clientesValorFacturadoRango: row.clientes_valor_facturado_rango,
  }
}

function calcularTasas(t: FunnelTotales) {
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0)
  return [
    { label: 'Tasa Contacto - Lead', valor: pct(t.leads, t.contactos), ideal: null as number | null },
    { label: 'Tasa Lead - MQL',      valor: pct(t.mqls, t.leads),      ideal: 4 },
    { label: 'Tasa MQL - SQL',       valor: pct(t.sqls, t.mqls),       ideal: 30 },
    { label: 'Tasa SQL - Opp',       valor: pct(t.opps, t.sqls),       ideal: 80 },
    { label: 'Tasa Opp - Cliente',   valor: pct(t.clientes, t.opps),   ideal: 20 },
  ]
}

function ScoreCardKPI({ label, value, pct, metaLabel }: { label: string; value: string; pct: number | null; metaLabel: string | null }) {
  const badgeColor = pct == null ? null : pct >= 100 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626'
  const arrow = pct != null && pct >= 100 ? '\u25b2' : '\u25bc'
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 20, color: '#0f172a' }}>{value}</div>
      {pct != null ? (
        <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: badgeColor ?? '#64748b' }}>{arrow} {pct.toFixed(1)}%{metaLabel ? ` \u00b7 meta: ${metaLabel}` : ''}</div>
      ) : (
        <div style={{ marginTop: 4, fontSize: 11, color: '#94a3b8' }}>Sin meta en forecast</div>
      )}
    </div>
  )
}

function FunnelPanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<FunnelTotales | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchFunnelTotales(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { console.error('Error cargando funnel_totales:', err) })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const total: FunnelTotales = data ?? {
    contactos: DUMMY.total.contactos, leads: DUMMY.total.leads, mqls: DUMMY.total.mqls,
    sqls: DUMMY.total.sqls, opps: DUMMY.total.opps, clientes: DUMMY.total.clientes,
    clientesValor: DUMMY.extras.clientesValor, ganadosPorFacturarValor: DUMMY.extras.ganadosPorFacturarValor,
    mqlDescalificados: DUMMY.extras.mqlDescalificados, sqlObjetadas: DUMMY.extras.sqlObjetadas,
    oppsPerdidas: DUMMY.extras.oppsPerdidas, ganadosPorFacturarCount: DUMMY.extras.ganadosPorFacturar,
    clientesFacturadosRango: 0, clientesValorFacturadoRango: DUMMY.extras.clientesValor,
  }
  const tasas = data ? calcularTasas(data) : DUMMY.tasas
  const [metas, setMetas] = useState<Record<string, MetaEtapa> | null>(null)
  useEffect(() => {
    let cancelled = false
    // Para las scorecards ejecutivas (Clientes $, Proyectos ganados) usamos siempre la meta ANUAL
    // completa sin prorratear, independiente del rango de fechas que el usuario este filtrando.
    fetchMetasForecast('2026-01-01', '2026-12-31', filtros.udn ?? null)
      .then(result => { if (!cancelled) setMetas(result) })
      .catch(err => { console.error('Error cargando metas_forecast en FunnelPanel:', err) })
    return () => { cancelled = true }
  }, [filtros.udn])
  const metaClientesMoney = metas?.clientes?.meta_money ?? null
  const metaClientesCount = metas?.clientes?.meta_total ?? null
  const pctIngresos = metaClientesMoney && metaClientesMoney > 0 ? (total.clientesValorFacturadoRango / metaClientesMoney) * 100 : null
  const pctProyectos = metaClientesCount && metaClientesCount > 0 ? (total.clientesFacturadosRango / metaClientesCount) * 100 : null
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16, flex: '2 1 620px', minWidth: 0,
    }}>
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
        Funnel de conversion
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
        Adquisicion y avance comercial
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(150px, 0.5fr) minmax(140px, 0.38fr)', gap: 12, alignItems: 'center', width: '100%' }}>
      <div style={{
        position: 'relative', width: '100%', maxWidth: 600, flexShrink: 1, minWidth: 0,
        backgroundColor: '#ffffff', isolation: 'isolate', marginLeft: 0,
      }}>
        <img
          src={`/images/funnel-hubspot-v5.png?t=${Date.now()}`}
          alt="Funnel HubSpot"
          style={{ width: '100%', maxWidth: 440, display: 'block', backgroundColor: '#ffffff', mixBlendMode: 'normal', filter: 'saturate(1.35) brightness(1.1)' }}
        />
        {FUNNEL_STAGES.map((stage, i) => {
          const value = total[stage.key]
          const pos = RING_POSITIONS[i]
          return (
            <div key={stage.label} style={{
              position: 'absolute', left: 0, width: '100%',
              top: `${pos.top}%`, height: `${pos.height}%`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', pointerEvents: 'none', gap: 1,
            }}>
              <div style={{
                background: '#fff',
                borderRadius: i === 5 ? 8 : 10,
                padding: i === 5 ? '3px 9px' : '6px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)',
                border: `1.5px solid ${stage.color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}>
                <span style={{
                  fontSize: i === 0 ? 11 : i === 5 ? 8 : 9.5, fontWeight: 700, color: stage.color,
                  letterSpacing: '0.02em', lineHeight: 1, textTransform: 'uppercase',
                }}>
                  {stage.label}
                </span>
                <CountUpNumber
                  value={value}
                  style={{
                    fontSize: i === 0 ? 19 : i === 5 ? 12 : 14, fontWeight: 900, color: '#0f172a',
                    fontFamily: 'monospace', lineHeight: 1,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {FUNNEL_STAGES.filter(s => s.tasaLabel).map((stage, idx) => {
          const tasaValor = tasas[idx]?.valor ?? 0
          return (
            <div key={stage.label} style={{ width: '100%' }}>
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 2,
                background: `${stage.color}12`, border: `1px solid ${stage.color}55`, borderLeft: `3px solid ${stage.color}`,
                borderRadius: 8, padding: '6px 10px', boxShadow: '0 1px 3px rgba(15,23,42,0.08)',
              }}>
                <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {stage.tasaLabel}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <strong style={{ fontSize: 14, color: '#0f172a', fontFamily: 'monospace' }}>{tasaValor.toFixed(2)}%</strong>
                  {stage.tasaIdeal !== null && stage.tasaIdeal !== undefined && (
                    <span style={{
                      fontSize: 9.5, color: '#64748b', background: '#f1f5f9',
                      border: '1px solid #e2e8f0', borderRadius: 5, padding: '1px 5px', whiteSpace: 'nowrap',
                    }}>
                      Ideal {stage.tasaIdeal}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
        padding: '14px 16px', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Calidad y perdidas
        </div>
        {[
          ['MQL descalificados', fmtNum(total.mqlDescalificados)],
          ['SQL objetadas', fmtNum(total.sqlObjetadas)],
          ['Opps perdidas', fmtNum(total.oppsPerdidas)],
          ['Ganados por facturar', fmtNum(total.ganadosPorFacturarCount)],
        ].map(([label, value], i) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: 11.5, color: '#334155' }}>{label}</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: '#0f172a' }}>{value}</span>
          </div>
        ))}
      </div>

    </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <ScoreCardKPI label="Clientes ($)" value={fmtMoney(total.clientesValorFacturadoRango)} pct={pctIngresos} metaLabel={metaClientesMoney != null ? fmtMoney(metaClientesMoney) : null} />
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Ganados por facturar ($)</div>
          <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 20, color: '#0f172a' }}>{fmtMoney(total.ganadosPorFacturarValor)}</div>
        </div>
        <ScoreCardKPI label="Proyectos ganados" value={fmtNum(total.clientesFacturadosRango)} pct={pctProyectos} metaLabel={metaClientesCount != null ? fmtNum(Math.round(metaClientesCount)) : null} />
      </div>
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
        padding: '10px 14px', fontSize: 11, color: '#92400e', lineHeight: 1.5,
      }}>
        <div>* El funnel (Contactos a Clientes) cuenta los registros por fecha de creacion, para no romper la logica de conversion entre etapas.</div>
        <div style={{ marginTop: 4 }}>* Clientes ($) y Proyectos ganados cuentan por fecha de facturacion (cuando el dinero ya entro). Ganados por facturar ($) cuenta por su propia fecha de por-facturar (negocios ganados pendientes de facturar).</div>
      </div>
    </div>
  )
}

type TeamTotales = { contactos: number; leads: number; mqls: number; sqls: number; opps: number; clientes: number; valor: number }

async function fetchFunnelTotalesPorEquipo(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ marketing: TeamTotales; comercial: TeamTotales }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/funnel_totales_por_equipo`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!res.ok) throw new Error(`Error RPC funnel_totales_por_equipo: ${res.status}`)
  const rows: {
    origen: string; contactos: number; leads: number; mqls: number; sqls: number; opps: number
    clientes: number; clientes_valor: number
  }[] = await res.json()
  const toTeam = (origen: string): TeamTotales => {
    const row = rows.find(r => r.origen === origen)
    return row
      ? {
          contactos: row.contactos, leads: row.leads, mqls: row.mqls, sqls: row.sqls,
          opps: row.opps, clientes: row.clientes, valor: row.clientes_valor,
        }
      : { contactos: 0, leads: 0, mqls: 0, sqls: 0, opps: 0, clientes: 0, valor: 0 }
  }
  return { marketing: toTeam('Marketing'), comercial: toTeam('Comercial') }
}

type MetaEtapa = { etapa: string; meta_total: number | null; meta_marketing: number | null; meta_comercial: number | null; meta_money: number | null; es_prorrateado?: boolean | null }

async function fetchMetasForecast(fechaDesde: string, fechaHasta: string, udn: string | null): Promise<Record<string, MetaEtapa>> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/metas_forecast_rango`
  const res = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_MBR_KEY, Authorization: `Bearer ${SUPABASE_MBR_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: udn }),
  })
  if (!res.ok) throw new Error(`Error RPC metas_forecast_rango: ${res.status}`)
  const rows: MetaEtapa[] = await res.json()
  const map: Record<string, MetaEtapa> = {}
  rows.forEach(r => { map[r.etapa] = r })
  return map
}

function TeamsPanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ marketing: TeamTotales; comercial: TeamTotales } | null>(null)
  const [metas, setMetas] = useState<Record<string, MetaEtapa> | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchFunnelTotalesPorEquipo(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { console.error('Error cargando funnel_totales_por_equipo:', err) })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  useEffect(() => {
    let cancelled = false
    if (!filtros.udn) { setMetas(null); return }
    fetchMetasForecast(dateFrom, dateTo, filtros.udn)
      .then(result => { if (!cancelled) setMetas(result) })
      .catch(err => { console.error('Error cargando metas_forecast:', err); if (!cancelled) setMetas(null) })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros.udn])
  const marketing = data?.marketing ?? DUMMY.marketing
  const comercial = data?.comercial ?? DUMMY.comercial
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
      display: 'flex', gap: 10, flex: '1 1 340px', minWidth: 0, fontSize: 9.5, alignSelf: 'stretch',
    }}>
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden', display: 'flex' }}><TeamColumn title="MARKETING" color="#2563eb" data={marketing} metas={metas} equipo="marketing" globalData={{ opps: (marketing.opps ?? 0) + (comercial.opps ?? 0), clientes: (marketing.clientes ?? 0) + (comercial.clientes ?? 0) }} /></div>
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden', display: 'flex' }}><TeamColumn title="COMERCIAL" color="#dc2626" data={comercial} metas={metas} equipo="comercial" globalData={{ opps: (marketing.opps ?? 0) + (comercial.opps ?? 0), clientes: (marketing.clientes ?? 0) + (comercial.clientes ?? 0) }} /></div>
    </div>
  )
}

function TeamColumn({ title, color, data, metas, equipo, globalData }: { title: string; color: string; data: typeof DUMMY.marketing; metas: Record<string, MetaEtapa> | null; equipo: 'marketing' | 'comercial'; globalData?: { opps: number; clientes: number } }) {
  // Meta por etapa para este equipo: leads/mqls/sqls usan el split; opps/clientes usan meta total (sin split)
  function metaDe(stageKey: string): number | null {
    if (!metas) return null
    const m = metas[stageKey]
    if (!m) return null
    if (stageKey === 'leads' || stageKey === 'mqls' || stageKey === 'sqls') {
      const v = equipo === 'marketing' ? m.meta_marketing : m.meta_comercial
      return v != null ? Number(v) : null
    }
    return m.meta_total != null ? Number(m.meta_total) : null
  }
  const prorrateado = metas ? Object.values(metas).some((m) => m.es_prorrateado) : false
  const stages: [string, number, string, string | null, string | null][] = [
    ['Contactos', data.contactos, '#E8402C', 'Contacto \u2192 Lead', 'leads'],
    ['Leads', data.leads, '#D6272F', 'Lead \u2192 MQL', null],
    ['MQLs', data.mqls, '#C11740', 'MQL \u2192 SQL', 'mqls'],
    ['SQLs', data.sqls, '#9B1355', 'SQL \u2192 Opp', 'sqls'],
    ['Opps', data.opps, '#7A2A9E', 'Opp \u2192 Cliente', 'opps'],
    ['Clientes', data.clientes, '#3B4FCE', null, 'clientes'],
  ]
  const base = data.contactos || 1
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0)
  const tasaSiguiente = (idx: number) => {
    const valores = [data.contactos, data.leads, data.mqls, data.sqls, data.opps, data.clientes]
    return pct(valores[idx + 1], valores[idx])
  }
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: 0,
      minWidth: 0,
      width: '100%',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '14px 18px', background: `${color}0A`, borderBottom: `1px solid ${color}20`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{
          fontSize: 13, fontWeight: 800, color, letterSpacing: '0.06em',
          fontFamily: 'Inter, -apple-system, sans-serif', textTransform: 'uppercase',
        }}>
          {title}
        </span>
      </div>

      <div style={{ padding: '10px 18px 4px', flex: 1 }}>
        {stages.map(([label, value, stageColor, tasaLabel, metaKey], i) => {
          const meta = metaKey ? metaDe(metaKey) : null
          const esGlobal = metaKey === 'opps' || metaKey === 'clientes'
          const realCumpl = esGlobal && globalData ? (metaKey === 'opps' ? globalData.opps : globalData.clientes) : value
          const cumplimiento = meta && meta > 0 ? (realCumpl / meta) * 100 : null
          return (
          <div key={label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '8px 0 4px',
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>{label}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                {fmtNum(value)}
              </span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden', marginBottom: 4 }}>
              <div style={{
                width: `${Math.min(100, pct(value, base))}%`, height: '100%',
                background: stageColor, borderRadius: 3, transition: 'width 0.4s ease',
              }} />
            </div>
            {metas && meta != null ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 10.5, color: '#94a3b8', padding: '0 0 8px',
              }}>
                <span>{prorrateado ? 'Meta prorrateada' : 'Meta'}{esGlobal ? ' (global)' : ''}: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{fmtNum(Math.round(meta))}</span></span>
                {cumplimiento != null && (
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: cumplimiento >= 100 ? '#16a34a' : cumplimiento >= 60 ? '#d97706' : '#dc2626' }}>
                    Cumpl.{esGlobal ? ' global' : ''} {cumplimiento.toFixed(1)}%
                  </span>
                )}
              </div>
            ) : (metas && label === 'Leads') ? (
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontStyle: 'italic', padding: '0 0 8px' }}>Sin meta en forecast</div>
            ) : (!metas && tasaLabel) ? (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 10.5, color: '#94a3b8', padding: '0 0 8px',
              }}>
                <span>{tasaLabel}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{tasaSiguiente(i).toFixed(1)}%</span>
              </div>
            ) : <div style={{ paddingBottom: 6 }} />}
          </div>
        )})}
      </div>

      <div style={{
        padding: '12px 18px', margin: '4px 0 0',
        background: `${color}0A`, borderTop: `1px solid ${color}20`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>
          Clientes ($)
        </div>
        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 16, color, fontVariantNumeric: 'tabular-nums' }}>
          {fmtMoney(data.valor)}
        </div>
      </div>
    </div>
  )
}

function FiltrosBar({ dateFrom, dateTo, onDateChange, filtros, onFiltroChange }: {
  dateFrom: string; dateTo: string; onDateChange: (from: string, to: string, preset: string) => void
  filtros: FiltrosHome; onFiltroChange: (key: keyof FiltrosHome, value: string) => void
}) {
  const [activePreset, setActivePreset] = useState('Este año')
  const [tempFrom, setTempFrom] = useState(dateFrom)
  const [tempTo, setTempTo] = useState(dateTo)
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function applyPreset(label: string, fn: () => [string, string]) {
    const [f, t] = fn()
    onDateChange(f, t, label); setActivePreset(label); setShowPicker(false)
  }
  function applyCustom() {
    onDateChange(tempFrom, tempTo, 'Personalizado'); setActivePreset('Personalizado'); setShowPicker(false)
  }
  const periodLabel = activePreset === 'Personalizado' ? `${dateFrom} → ${dateTo}` : activePreset

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px',
    }}>
    <div style={{
      maxWidth: 1400, margin: '0 auto', width: '100%',
      display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
    }}>
      {([
        { key: 'udn' as const, label: 'Unidad de negocio', opciones: UDNS_LIST },
        { key: 'origen' as const, label: 'Generado por', opciones: ['Marketing', 'Comercial'] },
        { key: 'conversion' as const, label: 'Contacto convertido', opciones: ['Marketing', 'Comercial'] },
        { key: 'fuente' as const, label: 'Fuente adquisición', opciones: FUENTES_LIST },
        { key: 'fuenteConversion' as const, label: 'Fuente MQL', opciones: FUENTES_LIST },
      ]).map(f => (
        <select key={f.key} value={filtros[f.key]} onChange={e => onFiltroChange(f.key, e.target.value)}
          style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9,
            color: '#334155', padding: '7px 12px', fontSize: 12.5, cursor: 'pointer',
            fontWeight: 500,
          }}>
          <option value="">{f.label}</option>
          {f.opciones.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ))}

      <div style={{ position: 'relative' }} ref={pickerRef}>
        <button onClick={() => setShowPicker(!showPicker)}
          style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9,
            color: '#334155', padding: '7px 14px', fontSize: 12.5, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
          }}>
          📅 {periodLabel}
        </button>
        {showPicker && (
          <div style={{
            position: 'absolute', left: 0, top: 'calc(100% + 8px)', background: '#fff',
            borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: 20, zIndex: 100, minWidth: 300,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p.label, p.fn)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: 'none', textAlign: 'left', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    background: activePreset === p.label ? `${ACCENT}18` : 'transparent',
                    color: activePreset === p.label ? ACCENT : '#374151',
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 10 }}>RANGO PERSONALIZADO</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input type="date" value={tempFrom} onChange={e => setTempFrom(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <span style={{ color: '#94a3b8', fontSize: 12 }}>→</span>
                <input type="date" value={tempTo} onChange={e => setTempTo(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowPicker(false)}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={applyCustom}
                  style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => { (['udn','origen','conversion','fuente','fuenteConversion'] as const).forEach(k => onFiltroChange(k, '')) }}
        style={{
          background: ACCENT, border: 'none', borderRadius: 9, color: '#fff',
          padding: '7px 14px', fontSize: 12.5, cursor: 'pointer', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto',
        }}>
        ✕ Borrar filtros
      </button>
    </div>
    </div>
  )
}

type ContactosPorMes = {
  mes: string
  total: number
  [udn: string]: string | number
}
type FuenteDetalle = { fuente: string; total: number }

async function fetchContactosCreadosEnElTiempo(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porEquipo: { equipo: string; contactos: number; fuentes: FuenteDetalle[] }[] }> {
  // Usamos la funcion RPC contactos_por_mes_udn, que hace el GROUP BY directamente en Postgres
  // (mucho mas rapido que traer las ~90K filas crudas y agregar en el navegador).
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/contactos_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!res.ok) throw new Error(`Error RPC contactos_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; origen: string; total: number }[] = await res.json()

  // Agrupamos por mes (YYYY-MM) para el grafico, y por origen (equipo) para la tabla lateral
  const porMesMap = new Map<string, Record<string, number>>()
  const porEquipoMap = new Map<string, number>()

  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.total

    porEquipoMap.set(row.origen, (porEquipoMap.get(row.origen) || 0) + row.total)
  }

  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  // Segunda llamada RPC: desglose por equipo + fuente de adquisicion (para el acordeon)
  const urlFuente = `${SUPABASE_MBR_URL}/rest/v1/rpc/contactos_por_equipo_fuente`
  const resFuente = await fetch(urlFuente, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!resFuente.ok) throw new Error(`Error RPC contactos_por_equipo_fuente: ${resFuente.status}`)
  const rowsFuente: { origen: string; fuente: string; total: number }[] = await resFuente.json()
  const fuentesPorEquipoMap = new Map<string, FuenteDetalle[]>()
  for (const row of rowsFuente) {
    if (!fuentesPorEquipoMap.has(row.origen)) fuentesPorEquipoMap.set(row.origen, [])
    fuentesPorEquipoMap.get(row.origen)!.push({ fuente: row.fuente, total: row.total })
  }

  const porEquipo = Array.from(porEquipoMap.entries())
    .map(([equipo, contactos]) => ({ equipo, contactos, fuentes: fuentesPorEquipoMap.get(equipo) ?? [] }))
    .sort((a, b) => b.contactos - a.contactos)

  return { porMes, porEquipo }
}

async function fetchMqlCreadosEnElTiempo(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porEquipo: { equipo: string; contactos: number; fuentes: FuenteDetalle[] }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/mql_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!res.ok) throw new Error(`Error RPC mql_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; origen: string; total: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  const porEquipoMap = new Map<string, number>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.total
    porEquipoMap.set(row.origen, (porEquipoMap.get(row.origen) || 0) + row.total)
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlFuente = `${SUPABASE_MBR_URL}/rest/v1/rpc/mql_por_equipo_fuente`
  const resFuente = await fetch(urlFuente, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!resFuente.ok) throw new Error(`Error RPC mql_por_equipo_fuente: ${resFuente.status}`)
  const rowsFuente: { origen: string; fuente: string; total: number }[] = await resFuente.json()
  const fuentesPorEquipoMap = new Map<string, FuenteDetalle[]>()
  for (const row of rowsFuente) {
    if (!fuentesPorEquipoMap.has(row.origen)) fuentesPorEquipoMap.set(row.origen, [])
    fuentesPorEquipoMap.get(row.origen)!.push({ fuente: row.fuente, total: row.total })
  }

  const porEquipo = Array.from(porEquipoMap.entries())
    .map(([equipo, contactos]) => ({ equipo, contactos, fuentes: fuentesPorEquipoMap.get(equipo) ?? [] }))
    .sort((a, b) => b.contactos - a.contactos)

  return { porMes, porEquipo }
}

async function fetchMqlDescalificadosEnElTiempo(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porMotivo: { motivo: string; total: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/mql_descalificados_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!res.ok) throw new Error(`Error RPC mql_descalificados_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; total: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.total
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlMotivo = `${SUPABASE_MBR_URL}/rest/v1/rpc/mql_descalificados_por_motivo`
  const resMotivo = await fetch(urlMotivo, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, ...filtrosParams(filtros) }),
  })
  if (!resMotivo.ok) throw new Error(`Error RPC mql_descalificados_por_motivo: ${resMotivo.status}`)
  const porMotivo: { motivo: string; total: number }[] = await resMotivo.json()

  return { porMes, porMotivo }
}

function MqlDescalificadosPanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porMotivo: { motivo: string; total: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMqlDescalificadosEnElTiempo(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          MQLs descalificados en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha MQL, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          MQLs descalificados por motivo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porMotivo.map(({ motivo, total }) => (
              <div key={motivo} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: 13, padding: '8px 0', color: '#1e293b',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontWeight: 500, color: '#475569' }}>{motivo}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(total)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porMotivo.reduce((a, r) => a + r.total, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MqlTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porEquipo: { equipo: string; contactos: number; fuentes: FuenteDetalle[] }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [equipoExpandido, setEquipoExpandido] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMqlCreadosEnElTiempo(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Contactos con interes en el tiempo (MQL)
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha MQL, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Contactos con interes por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porEquipo.map(({ equipo, contactos, fuentes }) => {
              const abierto = equipoExpandido === equipo
              return (
                <div key={equipo} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div
                    onClick={() => setEquipoExpandido(abierto ? null : equipo)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, padding: '8px 0', color: '#1e293b', cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: '#475569' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3"
                        style={{ transform: abierto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {equipo}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(contactos)}</span>
                  </div>
                  {abierto && (
                    <div style={{ padding: '2px 0 10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {fuentes.length === 0 && (
                        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Sin datos de fuente</div>
                      )}
                      {fuentes.map(f => (
                        <div key={f.fuente} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          fontSize: 11.5, color: '#64748b',
                        }}>
                          <span>{f.fuente}</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{fmtNum(f.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porEquipo.reduce((a, r) => a + r.contactos, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ContactosTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porEquipo: { equipo: string; contactos: number; fuentes: FuenteDetalle[] }[] } | null>(null)
  const [equipoExpandido, setEquipoExpandido] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchContactosCreadosEnElTiempo(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])

  // UDNs presentes en los datos (para las barras apiladas del grafico)
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Contactos creados en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha de creación, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn, i) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    // Determina si esta UDN es la ultima con valor > 0 en ESTE mes especifico,
                    // no por indice fijo, ya que una UDN puede tener 0 en un mes y no dibujarse.
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {i === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Contactos creados por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porEquipo.map(({ equipo, contactos, fuentes }) => {
              const abierto = equipoExpandido === equipo
              return (
                <div key={equipo} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <div
                    onClick={() => setEquipoExpandido(abierto ? null : equipo)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, padding: '8px 0', color: '#1e293b', cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: '#475569' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3"
                        style={{ transform: abierto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {equipo}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(contactos)}</span>
                  </div>
                  {abierto && (
                    <div style={{ padding: '2px 0 10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {fuentes.length === 0 && (
                        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Sin datos de fuente</div>
                      )}
                      {fuentes.map(f => (
                        <div key={f.fuente} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                          fontSize: 11.5, color: '#64748b',
                        }}>
                          <span>{f.fuente}</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{fmtNum(f.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porEquipo.reduce((a, r) => a + r.contactos, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

type TimelineTeamRow = { label: string; value: number; money?: string }

async function fetchSqlCredencialesCalificadas(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/sql_credenciales_completadas_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC sql_credenciales_completadas_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; registros: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.registros
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlOrigen = `${SUPABASE_MBR_URL}/rest/v1/rpc/sql_credenciales_completadas_por_origen`
  const resOrigen = await fetch(urlOrigen, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!resOrigen.ok) throw new Error(`Error RPC sql_credenciales_completadas_por_origen: ${resOrigen.status}`)
  const rowsOrigen: { origen: string; registros: number }[] = await resOrigen.json()
  const porOrigen = rowsOrigen.map(r => ({ origen: r.origen, total: r.registros }))

  return { porMes, porOrigen }
}

function SqlCredencialesTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSqlCredencialesCalificadas(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Reuniones de credenciales calificadas en el tiempo (SQL)
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha de creacion, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Reuniones de credenciales calificadas
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porOrigen.map(({ origen, total }) => (
              <div key={origen} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: 13, padding: '8px 0', color: '#1e293b',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontWeight: 500, color: '#475569' }}>{origen}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(total)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porOrigen.reduce((a, r) => a + r.total, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function fetchPropuestasCreadas(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_creadas_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_creadas_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; registros: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.registros
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlOrigen = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_creadas_por_origen`
  const resOrigen = await fetch(urlOrigen, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!resOrigen.ok) throw new Error(`Error RPC propuestas_creadas_por_origen: ${resOrigen.status}`)
  const rowsOrigen: { origen: string; registros: number }[] = await resOrigen.json()
  const porOrigen = rowsOrigen.map(r => ({ origen: r.origen, total: r.registros }))

  return { porMes, porOrigen }
}

function PropuestasCreadasTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPropuestasCreadas(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Propuestas creadas en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha de creacion, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Propuestas creadas por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porOrigen.map(({ origen, total }) => (
              <div key={origen} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: 13, padding: '8px 0', color: '#1e293b',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontWeight: 500, color: '#475569' }}>{origen}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(total)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porOrigen.reduce((a, r) => a + r.total, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function fetchPropuestasPerdidas(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_perdidas_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_perdidas_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; registros: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.registros
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlOrigen = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_perdidas_por_origen`
  const resOrigen = await fetch(urlOrigen, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!resOrigen.ok) throw new Error(`Error RPC propuestas_perdidas_por_origen: ${resOrigen.status}`)
  const rowsOrigen: { origen: string; registros: number }[] = await resOrigen.json()
  const porOrigen = rowsOrigen.map(r => ({ origen: r.origen, total: r.registros }))

  return { porMes, porOrigen }
}

function PropuestasPerdidasTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; total: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPropuestasPerdidas(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Propuestas perdidas en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha en la que se perdio la propuesta, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Propuestas perdidas por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <div>
            {data.porOrigen.map(({ origen, total }) => (
              <div key={origen} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                fontSize: 13, padding: '8px 0', color: '#1e293b',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                <span style={{ fontWeight: 500, color: '#475569' }}>{origen}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(total)}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '10px 0 0', marginTop: 8,
              borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmtNum(data.porOrigen.reduce((a, r) => a + r.total, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function fmtMoneyMX(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)} M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)} mil`
  return `$${n.toFixed(2)}`
}

async function fetchPropuestasActivasPorUdn(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ udn: string; registros: number; valor: number }[]> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_activas_por_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_activas_por_udn: ${res.status}`)
  const rows: { udn: string; registros: number; valor: number }[] = await res.json()
  return rows
}

async function fetchPropuestasActivasPorUdnEtapa(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ udn: string; etapa: string; registros: number; valor: number }[]> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_activas_por_udn_etapa`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_activas_por_udn_etapa: ${res.status}`)
  const rows: { udn: string; etapa: string; registros: number; valor: number }[] = await res.json()
  return rows
}

const ETAPAS_ACTIVAS = ['1. Reunión calificada', '2. Propuesta', '3. Evaluando', '4. Cierre']

function PropuestasActivasPorUdnPanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [chartData, setChartData] = useState<{ udn: string; registros: number; valor: number }[] | null>(null)
  const [tablaData, setTablaData] = useState<{ udn: string; etapa: string; registros: number; valor: number }[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetchPropuestasActivasPorUdn(dateFrom, dateTo, filtros),
      fetchPropuestasActivasPorUdnEtapa(dateFrom, dateTo, filtros),
    ])
      .then(([chart, tabla]) => { if (!cancelled) { setChartData(chart); setTablaData(tabla); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])

  const udnsPresentes = tablaData ? Array.from(new Set(tablaData.map(r => r.udn))) : []
  const matriz: Record<string, Record<string, { registros: number; valor: number }>> = {}
  if (tablaData) {
    for (const row of tablaData) {
      if (!matriz[row.udn]) matriz[row.udn] = {}
      matriz[row.udn][row.etapa] = { registros: row.registros, valor: row.valor }
    }
  }
  const totalesPorEtapa: Record<string, { registros: number; valor: number }> = {}
  for (const etapa of ETAPAS_ACTIVAS) {
    totalesPorEtapa[etapa] = { registros: 0, valor: 0 }
    for (const udn of udnsPresentes) {
      const cell = matriz[udn]?.[etapa]
      if (cell) { totalesPorEtapa[etapa].registros += cell.registros; totalesPorEtapa[etapa].valor += cell.valor }
    }
  }
  const totalGeneral = { registros: 0, valor: 0 }
  for (const etapa of ETAPAS_ACTIVAS) { totalGeneral.registros += totalesPorEtapa[etapa].registros; totalGeneral.valor += totalesPorEtapa[etapa].valor }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Propuestas activas por unidad de negocio
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Registros y valor, etapas 1 a 4 (activas)
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && chartData && (
          <>
          <Legend
            payload={[
              { value: 'Propuestas (#)', type: 'circle', color: '#2563eb' },
              { value: 'Valor ($)', type: 'circle', color: '#f97316' },
            ]}
            wrapperStyle={{ fontSize: 11, position: 'relative', marginBottom: 8 }}
          />
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 32, right: 32, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="udn" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} padding={{ right: 24 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Propuestas (#)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={90}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => fmtMoneyMX(v)}
                label={{ value: 'Valor ($)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#64748b' } }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  const row: any = payload[0]?.payload
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: '#0f172a' }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
                        <span>Propuestas: {fmtNum(row?.registros ?? 0)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: '#0f172a' }}>
                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />
                        <span>Valor: {fmtMoneyMX(row?.valor ?? 0)}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Line
                yAxisId="left"
                type="linear"
                dataKey="registros"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: '#2563eb' }}
                name="Propuestas"
              >
                <LabelList dataKey="registros" position="top" formatter={(v: number) => fmtNum(v)} style={{ fontSize: 11, fontWeight: 700, fill: '#2563eb' }} />
              </Line>
              <Line
                yAxisId="right"
                type="linear"
                dataKey="valor"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                name="Valor"
              >
                <LabelList dataKey="valor" position="bottom" formatter={(v: number) => fmtMoneyMX(v)} style={{ fontSize: 10, fontWeight: 700, fill: '#f97316' }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, overflowX: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Propuestas activas por unidad de negocio — Etapa / # / Valor
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && tablaData && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: '#64748b' }}>Unidad de negocio</th>
                {ETAPAS_ACTIVAS.map(etapa => (
                  <th key={etapa} colSpan={2} style={{ textAlign: 'center', padding: '6px 8px', color: '#64748b' }}>{etapa}</th>
                ))}
                <th colSpan={2} style={{ textAlign: 'center', padding: '6px 8px', color: '#64748b' }}>Total</th>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th></th>
                {ETAPAS_ACTIVAS.map(etapa => (
                  <React.Fragment key={etapa + '_header'}>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 500 }}>#</th>
                    <th style={{ textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 500 }}>Valor</th>
                  </React.Fragment>
                ))}
                <th style={{ textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 500 }}>#</th>
                <th style={{ textAlign: 'right', padding: '4px 8px', color: '#94a3b8', fontWeight: 500 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {udnsPresentes.map(udn => {
                const totalUdn = { registros: 0, valor: 0 }
                for (const etapa of ETAPAS_ACTIVAS) {
                  const cell = matriz[udn]?.[etapa]
                  if (cell) { totalUdn.registros += cell.registros; totalUdn.valor += cell.valor }
                }
                return (
                  <tr key={udn} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 500, color: '#1e293b' }}>{udn}</td>
                    {ETAPAS_ACTIVAS.map(etapa => {
                      const cell = matriz[udn]?.[etapa]
                      return (
                        <React.Fragment key={udn + '_' + etapa}>
                          <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace' }}>{cell ? fmtNum(cell.registros) : '-'}</td>
                          <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace' }}>{cell ? fmtMoneyMX(cell.valor) : '-'}</td>
                        </React.Fragment>
                      )
                    })}
                    <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{fmtNum(totalUdn.registros)}</td>
                    <td style={{ textAlign: 'right', padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{fmtMoneyMX(totalUdn.valor)}</td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
                <td style={{ padding: '8px' }}>Total</td>
                {ETAPAS_ACTIVAS.map(etapa => (
                  <React.Fragment key={etapa + '_total'}>
                    <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace' }}>{fmtNum(totalesPorEtapa[etapa].registros)}</td>
                    <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace' }}>{fmtMoneyMX(totalesPorEtapa[etapa].valor)}</td>
                  </React.Fragment>
                ))}
                <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace' }}>{fmtNum(totalGeneral.registros)}</td>
                <td style={{ textAlign: 'right', padding: '8px', fontFamily: 'monospace' }}>{fmtMoneyMX(totalGeneral.valor)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

async function fetchPropuestasGanadasFacturar(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; registros: number; valor: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_ganadas_facturar_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_ganadas_facturar_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; registros: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.registros
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlOrigen = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_ganadas_facturar_por_origen`
  const resOrigen = await fetch(urlOrigen, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!resOrigen.ok) throw new Error(`Error RPC propuestas_ganadas_facturar_por_origen: ${resOrigen.status}`)
  const porOrigen: { origen: string; registros: number; valor: number }[] = await resOrigen.json()

  return { porMes, porOrigen }
}

function PropuestasGanadasFacturarTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; registros: number; valor: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPropuestasGanadasFacturar(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Propuestas ganadas por facturar en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha por facturar, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Propuestas ganadas por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Equipo</th>
                <th style={{ textAlign: 'right', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>#</th>
                <th style={{ textAlign: 'right', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.porOrigen.map(({ origen, registros, valor }) => (
                <tr key={origen ?? 'sin_equipo'} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 500, color: '#475569' }}>{origen ?? 'null'}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(registros)}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{fmtMoneyMX(valor)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
                <td style={{ padding: '10px 0 0' }}>Total</td>
                <td style={{ textAlign: 'right', padding: '10px 0 0', fontFamily: 'monospace' }}>{fmtNum(data.porOrigen.reduce((a, r) => a + r.registros, 0))}</td>
                <td style={{ textAlign: 'right', padding: '10px 0 0', fontFamily: 'monospace', fontSize: 12 }}>{fmtMoneyMX(data.porOrigen.reduce((a, r) => a + r.valor, 0))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

async function fetchPropuestasFacturadas(
  fechaDesde: string | null = null,
  fechaHasta: string | null = null,
  filtros: FiltrosHome = FILTROS_VACIOS,
): Promise<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; registros: number; valor: number }[] }> {
  const url = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_facturadas_por_mes_udn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!res.ok) throw new Error(`Error RPC propuestas_facturadas_por_mes_udn: ${res.status}`)
  const rows: { mes: string; udn: string; registros: number }[] = await res.json()

  const porMesMap = new Map<string, Record<string, number>>()
  for (const row of rows) {
    if (!porMesMap.has(row.mes)) porMesMap.set(row.mes, {})
    const bucket = porMesMap.get(row.mes)!
    bucket[row.udn] = (bucket[row.udn] || 0) + row.registros
  }
  const mesesOrdenados = Array.from(porMesMap.keys()).sort()
  const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const porMes: ContactosPorMes[] = mesesOrdenados.map(mesKey => {
    const [anio, mesNum] = mesKey.split('-')
    const label = `${MESES_ES[parseInt(mesNum, 10) - 1]} ${anio}`
    const bucket = porMesMap.get(mesKey)!
    const total = Object.values(bucket).reduce((a, b) => a + b, 0)
    return { mes: label, total, ...bucket }
  })

  const urlOrigen = `${SUPABASE_MBR_URL}/rest/v1/rpc/propuestas_facturadas_por_origen`
  const resOrigen = await fetch(urlOrigen, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_MBR_KEY,
      Authorization: `Bearer ${SUPABASE_MBR_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta, p_udn: filtros.udn || null, p_origen: filtros.origen || null, p_fuente: filtros.fuente || null }),
  })
  if (!resOrigen.ok) throw new Error(`Error RPC propuestas_facturadas_por_origen: ${resOrigen.status}`)
  const porOrigen: { origen: string; registros: number; valor: number }[] = await resOrigen.json()

  return { porMes, porOrigen }
}

function PropuestasFacturadasTimelinePanel({ dateFrom, dateTo, filtros }: { dateFrom: string; dateTo: string; filtros: FiltrosHome }) {
  const [data, setData] = useState<{ porMes: ContactosPorMes[]; porOrigen: { origen: string; registros: number; valor: number }[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPropuestasFacturadas(dateFrom, dateTo, filtros)
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(String(err)); setLoading(false) } })
    return () => { cancelled = true }
  }, [dateFrom, dateTo, filtros])
  const udnsPresentes = data
    ? Array.from(new Set(data.porMes.flatMap(m => Object.keys(m).filter(k => k !== 'mes' && k !== 'total'))))
    : []
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Propuestas facturadas en el tiempo
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>
          Por mes de fecha de facturacion, desglosado por unidad de negocio
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8', padding: '40px 0', textAlign: 'center' }}>Cargando datos de Supabase...</div>}
        {error && <div style={{ fontSize: 12, color: '#dc2626', padding: '20px 0' }}>Error al cargar: {error}</div>}
        {!loading && !error && data && (
          <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
            {udnsPresentes.map(udn => (
              <div key={udn} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: UDN_COLORS[udn] || UDN_COLOR_FALLBACK, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#475569' }}>{udn}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.porMes} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
              <defs>
                <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null
                  return (
                    <div style={{
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                    }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                      {payload.slice().reverse().map((p: any) => (
                        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {udnsPresentes.map((udn) => (
                <Bar
                  key={udn}
                  dataKey={udn}
                  stackId="udn"
                  fill={UDN_COLORS[udn] || UDN_COLOR_FALLBACK}
                  name={udn}
                  shape={(props: any) => {
                    const row = props.payload || {}
                    const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                    return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                  }}
                >
                  {udnsPresentes.indexOf(udn) === udnsPresentes.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      formatter={(v: number) => fmtNum(v)}
                      style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
          </>
        )}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Propuestas facturadas por equipo
        </div>
        {loading && <div style={{ fontSize: 12, color: '#94a3b8' }}>Cargando...</div>}
        {!loading && !error && data && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Equipo</th>
                <th style={{ textAlign: 'right', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>#</th>
                <th style={{ textAlign: 'right', padding: '4px 0 8px', color: '#94a3b8', fontWeight: 600, fontSize: 11 }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.porOrigen.map(({ origen, registros, valor }) => (
                <tr key={origen ?? 'sin_equipo'} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={{ padding: '8px 0', fontWeight: 500, color: '#475569' }}>{origen ?? 'null'}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmtNum(registros)}</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{fmtMoneyMX(valor)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid #e2e8f0', fontWeight: 800, color: '#0f172a' }}>
                <td style={{ padding: '10px 0 0' }}>Total</td>
                <td style={{ textAlign: 'right', padding: '10px 0 0', fontFamily: 'monospace' }}>{fmtNum(data.porOrigen.reduce((a, r) => a + r.registros, 0))}</td>
                <td style={{ textAlign: 'right', padding: '10px 0 0', fontFamily: 'monospace', fontSize: 12 }}>{fmtMoneyMX(data.porOrigen.reduce((a, r) => a + r.valor, 0))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function TimelinePanel({
  title, subtitle, months, values, barColor,
  tableTitle, rows, totalLabel, totalValue, totalMoney,
}: {
  title: string
  subtitle: string
  months: string[]
  values: number[]
  barColor: string
  tableTitle: string
  rows: TimelineTeamRow[]
  totalLabel: string
  totalValue: number
  totalMoney?: string
}) {
  const chartData = months.map((mes, i) => ({ mes, valor: values[i] }))
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '2 1 620px', minWidth: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 16 }}>{subtitle}</div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
            <defs>
              <linearGradient id="glossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                <stop offset="45%" stopColor="#ffffff" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload || !payload.length) return null
                return (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
                    <div style={{ color: '#0f172a' }}>{fmtNum(payload[0].value as number)}</div>
                  </div>
                )
              }}
            />
            <Bar dataKey="valor" fill={barColor} shape={RoundedTopBar}>
              <LabelList
                dataKey="valor"
                position="top"
                formatter={(v: number) => fmtNum(v)}
                style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
        flex: '1 1 260px', minWidth: 220,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{tableTitle}</div>
        <div>
          {rows.map(r => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              fontSize: 13, padding: '8px 0', color: '#1e293b',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{ fontWeight: 500, color: '#475569' }}>{r.label}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                {r.money ? r.money : fmtNum(r.value)}
              </span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontSize: 13, padding: '10px 0 0', marginTop: 8,
            borderTop: '2px solid #e2e8f0', color: '#0f172a', fontWeight: 800,
          }}>
            <span>{totalLabel}</span>
            <span style={{ fontFamily: 'monospace' }}>{totalMoney ? totalMoney : fmtNum(totalValue)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeFunnel() {
  const [dateFrom, setDateFrom] = useState(new Date().getFullYear() + '-01-01')
  const [dateTo, setDateTo] = useState(toDateStr(new Date()))
  const [filtros, setFiltros] = useState<FiltrosHome>(FILTROS_VACIOS)

  function handleDateChange(from, to, _preset) {
    setDateFrom(from)
    setDateTo(to)
  }
  function handleFiltroChange(key: keyof FiltrosHome, value: string) {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <FiltrosBar dateFrom={dateFrom} dateTo={dateTo} onDateChange={handleDateChange} filtros={filtros} onFiltroChange={handleFiltroChange} />
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
          <FunnelPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />
          <TeamsPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />
        </div>

        <ContactosTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <MqlTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <MqlDescalificadosPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <SqlCredencialesTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <PropuestasCreadasTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <PropuestasPerdidasTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <PropuestasActivasPorUdnPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <PropuestasGanadasFacturarTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />

        <PropuestasFacturadasTimelinePanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />
      </div>
    </div>
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
      {label} — próximo paso.
    </div>
  )
}

export default function HubSpotAnalytics() {
  const [sub, setSub] = useState<SubTab>('home')

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{
        background: '#fdfdfe', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        height: 56, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <img src="/logos/hubspot-logo.webp" alt="HubSpot" style={{ height: 22, width: 22, objectFit: 'contain' }} />
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>HubSpot</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: ACCENT, marginLeft: 4 }}>Analytics</span>
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: '#e2e8f0', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1 }}>
            {SUBTABS.map(t => {
              const active = sub === t.id
              return (
                <button key={t.id} onClick={() => setSub(t.id)} style={{
                  background: active ? ACCENT : 'transparent',
                  border: '1px solid ' + (active ? ACCENT : '#e2e8f0'),
                  borderRadius: 9, padding: '5px 12px',
                  color: active ? '#ffffff' : '#64748b',
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}>
                  {t.label}
                  {(t.id === 'mbr' || t.id === 'email') && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                      background: active ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                      color: active ? '#ffffff' : '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}>
                      En proceso
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {sub === 'home'     && <HomeFunnel />}
      {sub === 'mbr'      && <Placeholder label="MBR (Monthly Business Review)" />}
      {sub === 'perdidos' && <NegociosPerdidos />}
      {sub === 'email'    && <Placeholder label="Email marketing" />}
    </div>
  )
}
