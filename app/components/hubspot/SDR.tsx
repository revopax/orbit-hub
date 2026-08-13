'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'

const ACCENT = '#7038E5'
const SUPABASE_MBR_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR!
const SUPABASE_IAM_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_IAM_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
async function rpcIam<T>(fn: string): Promise<T> {
  const res = await fetch(`${SUPABASE_IAM_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_IAM_KEY, Authorization: `Bearer ${SUPABASE_IAM_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`Error RPC IAM ${fn}: ${res.status}`)
  return res.json()
}
const NOMBRE_CORTO_A_LARGO: Record<string, string> = {
  'Elizabeth Gomez': 'Elizabeth Gomez',
  'Jennifer Silva': 'Jennifer Dessire Silva Trejo',
  'Antonio Vargas': 'Antonio Leodegario Vargas Ochoa',
  'Neyby Ruiz': 'Neyby Ruiz',
  'Edna Gonzalez': 'Edna González',
  'Otniel Sedano': 'Otniel Sedano Ugalde',
}
const CODIGO_UDN_A_NOMBRE: Record<string, string> = {
  UIX: 'UIX', MU: 'Marketing United', PE: 'Promo Espacio', ZU: 'Zeus',
  NC: 'Neracode', HOF: 'House Of Films', RL: 'Research Land', MEXA: 'Mexa Creativa',
}
interface RowSdrUdn { nombre: string; udn: string }

const UDN_COLORS: Record<string, string> = {
  'Mexa Creativa': '#FD00C7', 'House Of Films': '#000000', 'Marketing United': '#dcff00',
  'UIX': '#ACE738', 'Neracode': '#3E31CC', 'Zeus': '#FF004F', 'Research Land': '#770EB7',
  'Promo Espacio': '#FF7600', 'Upax': '#323644', 'Sin UDN': '#94a3b8',
}

const SDR_COLORS: Record<string, string> = {
  'Elizabeth Gomez': '#FF6B6B',
  'Jennifer Dessire Silva Trejo': '#4ECDC4',
  'Antonio Leodegario Vargas Ochoa': '#A78BFA',
  'Neyby Ruiz': '#6EE7B7',
  'Edna González': '#FBBF24',
  'Otniel Sedano Ugalde': '#60A5FA',
}

const SDRS_VIGENTES = Object.keys(SDR_COLORS)

const TIPO_LABELS: Record<string, string> = {
  'llamada': 'Llamadas', 'whatsapp': 'WhatsApp', 'mensaje de texto': 'Mensajes',
  'nota': 'Notas', 'tarea': 'Tareas',
}

interface RowActividad {
  sdr: string; mes: string; total_actividad: number; contactos_conectados: number
  reuniones_agendadas: number; reuniones_completadas: number
}
interface RowMqlUdn { sdr: string; mes: string; udn: string; mqls: number }
interface RowActividadTipo { sdr: string; tipo: string; total: number }

function mesLabel(mes: string | null | undefined) {
  if (!mes) return '—'
  const [y, m] = mes.split('-')
  const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${nombres[parseInt(m, 10) - 1]} ${y.slice(2)}`
}
function fmtNum(v: number) { return v.toLocaleString('es-MX') }
function toDateOnly(d: Date) { return d.toISOString().slice(0, 10) }

const RoundedTopBar = (props: any) => {
  const { x, y, width, height, fill } = props
  if (!height || height <= 0) return null
  const r = Math.min(6, width / 2, height)
  const d = `M${x},${y + r} A${r},${r} 0 0 1 ${x + r},${y} L${x + width - r},${y} A${r},${r} 0 0 1 ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`
  return <path d={d} fill={fill} />
}
const GlossyBar = (props: any) => {
  const { x, y, width, height, fill } = props
  if (!height || height <= 0) return null
  return <rect x={x} y={y} width={width} height={height} fill={fill} />
}

function ChartLegend({ items, colors, historicos }: { items: string[]; colors: Record<string, string>; historicos?: Set<string> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 11, marginBottom: 12 }}>
      {items.map(item => {
        const esHistorico = historicos?.has(item)
        return (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: esHistorico ? 0.55 : 1 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: colors[item] || '#94a3b8', display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: '#475569' }}>{item}{esHistorico && ' (anterior)'}</span>
          </div>
        )
      })}
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{label}</div>
      {payload.slice().reverse().filter((p: any) => p.dataKey !== 'total').map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#0f172a' }}>{p.name}: {fmtNum(p.value as number)}</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#172033', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function FunnelEtapa({ label, valor, pct, tooltip }: { label: string; valor: number; pct: string | null; tooltip: string }) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 10px',
      background: '#fafbff',
    }} title={tooltip}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: ACCENT }}>{valor.toLocaleString()}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: pct ? '#16a34a' : 'transparent', marginTop: 4, minHeight: 15 }}>
        {pct || '—'}
      </div>
    </div>
  )
}

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

const PRESETS_SDR = [
  { label: 'Últimos 30 días',   fn: () => { const d = new Date(), s = new Date(); s.setDate(s.getDate() - 30); return [toDateStr(s), toDateStr(d)] as [string, string] } },
  { label: 'Últimos 90 días',   fn: () => { const d = new Date(), s = new Date(); s.setDate(s.getDate() - 90); return [toDateStr(s), toDateStr(d)] as [string, string] } },
  { label: 'Este año',          fn: () => [`${new Date().getFullYear()}-01-01`, toDateStr(new Date())] as [string, string] },
  { label: 'Todo el historial', fn: () => ['2025-01-01', toDateStr(new Date())] as [string, string] },
]

function PeriodoPicker({ dateFrom, dateTo, activePreset, onChange }: {
  dateFrom: string; dateTo: string; activePreset: string
  onChange: (from: string, to: string, preset: string) => void
}) {
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
    onChange(f, t, label); setShowPicker(false)
  }
  function applyCustom() {
    onChange(tempFrom, tempTo, 'Personalizado'); setShowPicker(false)
  }
  const periodLabel = activePreset === 'Personalizado' ? `${dateFrom} → ${dateTo}` : activePreset

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      <button onClick={() => setShowPicker(!showPicker)} style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 9,
        color: '#334155', padding: '7px 14px', fontSize: 12.5, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
      }}>
        📅 {periodLabel}
      </button>
      {showPicker && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff',
          borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', padding: 20, zIndex: 100, minWidth: 280,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            {PRESETS_SDR.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.label, p.fn)} style={{
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
              <button onClick={() => setShowPicker(false)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={applyCustom} style={{ flex: 1, padding: 8, borderRadius: 8, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SDR() {
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [dateTo, setDateTo] = useState(toDateStr(new Date()))
  const [activePreset, setActivePreset] = useState('Este año')
  const [sdrSel, setSdrSel] = useState<string>('todos')
  const sdrsAMostrar = sdrSel === 'todos' ? SDRS_VIGENTES : [sdrSel]
  const [udnSel, setUdnSel] = useState<string>('todas')
  const [actividad, setActividad] = useState<RowActividad[]>([])
  const [mqlsUdn, setMqlsUdn] = useState<RowMqlUdn[]>([])
  const [actividadTipo, setActividadTipo] = useState<RowActividadTipo[]>([])
  const [loading, setLoading] = useState(true)
  const [filaExpandida, setFilaExpandida] = useState<string | null>(null)
  const [udnActualPorSdr, setUdnActualPorSdr] = useState<Record<string, string[]>>({})

  const desde = dateFrom.slice(0, 7)
  const hasta = dateTo.slice(0, 7)

  useEffect(() => {
    setLoading(true)
    rpc<{ actividad: RowActividad[]; actividad_tipo: RowActividadTipo[]; mqls_udn: RowMqlUdn[] }>(
      'sdr_dashboard_data', { p_desde: desde, p_hasta: hasta }
    ).then(data => {
      setActividad(data.actividad || [])
      setActividadTipo(data.actividad_tipo || [])
      setMqlsUdn(data.mqls_udn || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [desde, hasta])

  useEffect(() => {
    rpcIam<RowSdrUdn[]>('sdr_udn_actual').then(rows => {
      const mapa: Record<string, string[]> = {}
      rows.forEach(r => {
        const nombreLargo = NOMBRE_CORTO_A_LARGO[r.nombre]
        if (!nombreLargo) return
        mapa[nombreLargo] = r.udn.split(',').map(c => CODIGO_UDN_A_NOMBRE[c.trim()] || c.trim())
      })
      setUdnActualPorSdr(mapa)
    }).catch(() => {})
  }, [])

  const actividadFiltrada = useMemo(() =>
    sdrSel === 'todos' ? actividad : actividad.filter(r => r.sdr === sdrSel)
  , [actividad, sdrSel])

  const mqlsFiltrados = useMemo(() => {
    let rows = sdrSel === 'todos' ? mqlsUdn : mqlsUdn.filter(r => r.sdr === sdrSel)
    if (udnSel !== 'todas') rows = rows.filter(r => r.udn === udnSel)
    return rows
  }, [mqlsUdn, sdrSel, udnSel])

  const totales = useMemo(() => {
    const totalActividad = actividadFiltrada.reduce((s, r) => s + r.total_actividad, 0)
    const contactosConectados = actividadFiltrada.reduce((s, r) => s + r.contactos_conectados, 0)
    const reunionesCompletadas = actividadFiltrada.reduce((s, r) => s + r.reuniones_completadas, 0)
    const mqls = mqlsFiltrados.reduce((s, r) => s + r.mqls, 0)
    return { totalActividad, contactosConectados, mqls, reunionesCompletadas }
  }, [actividadFiltrada, mqlsFiltrados])

  const [comparativoDinamico, setComparativoDinamico] = useState<{
    actual: number; anterior: number; delta: string | null; labelActual: string; labelAnterior: string
  } | null>(null)
  useEffect(() => {
    const hoy = new Date()
    const diaHoy = hoy.getDate()
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const finRangoActual = hoy
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finRangoAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, diaHoy)
    const nombresLargos = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const sdrParam = sdrSel === 'todos' ? null : sdrSel
    rpc<{ total: number }[]>('sdr_actividad_rango_diario', {
      p_desde_actual: toDateOnly(inicioMesActual), p_hasta_actual: toDateOnly(finRangoActual),
      p_desde_anterior: toDateOnly(inicioMesAnterior), p_hasta_anterior: toDateOnly(finRangoAnterior),
      p_sdr: sdrParam,
    }).then((rows: any) => {
      const actual = rows?.[0]?.total_actual ?? 0
      const anterior = rows?.[0]?.total_anterior ?? 0
      const delta = anterior > 0 ? (((actual - anterior) / anterior) * 100).toFixed(1) : null
      setComparativoDinamico({
        actual, anterior, delta,
        labelActual: `${diaHoy} ${nombresLargos[hoy.getMonth()]}`,
        labelAnterior: `${diaHoy} ${nombresLargos[inicioMesAnterior.getMonth()]}`,
      })
    }).catch(() => setComparativoDinamico(null))
  }, [sdrSel])

  const leaderboard = useMemo(() => {
    return sdrsAMostrar.map(sdr => {
      const act = actividad.filter(r => r.sdr === sdr)
      const mqlRows = mqlsUdn.filter(r => r.sdr === sdr && (udnSel === 'todas' || r.udn === udnSel))
      const tipos = actividadTipo.filter(r => r.sdr === sdr)
      const totalActividad = act.reduce((s, r) => s + r.total_actividad, 0)
      const contactosConectados = act.reduce((s, r) => s + r.contactos_conectados, 0)
      const mqls = mqlRows.reduce((s, r) => s + r.mqls, 0)
      const reunionesCompletadas = act.reduce((s, r) => s + r.reuniones_completadas, 0)
      const tasaConversion = totalActividad > 0 ? ((mqls / totalActividad) * 100).toFixed(1) : '0.0'
      return { sdr, totalActividad, contactosConectados, mqls, reunionesCompletadas, tasaConversion, tipos }
    }).sort((a, b) => b.mqls - a.mqls)
  }, [actividad, mqlsUdn, actividadTipo, udnSel, sdrsAMostrar])

  const chartDataUdn = useMemo(() => {
    const meses = Array.from(new Set(mqlsFiltrados.map(r => r.mes))).sort()
    const udns = Array.from(new Set(mqlsFiltrados.map(r => r.udn)))
    return meses.map(mes => {
      const fila: Record<string, string | number> = { mes: mesLabel(mes) }
      udns.forEach(udn => {
        fila[udn] = mqlsFiltrados.filter(r => r.mes === mes && r.udn === udn).reduce((s, r) => s + r.mqls, 0)
      })
      fila.total = udns.reduce((s, u) => s + (fila[u] as number || 0), 0)
      return fila
    })
  }, [mqlsFiltrados])

  const udnsPresentes = useMemo(() => Array.from(new Set(mqlsFiltrados.map(r => r.udn))), [mqlsFiltrados])
  const udnsDisponibles = useMemo(() => {
    const base = sdrSel === 'todos' ? mqlsUdn : mqlsUdn.filter(r => r.sdr === sdrSel)
    return Array.from(new Set(base.map(r => r.udn))).sort()
  }, [mqlsUdn, sdrSel])
  useEffect(() => {
    if (udnSel !== 'todas' && !udnsDisponibles.includes(udnSel)) setUdnSel('todas')
  }, [udnsDisponibles, udnSel])

  // UDNs que el SDR tiene registradas en el sistema (mbr) pero NO forman parte de su cartera actual segun IAM
  const udnsHistoricas = useMemo(() => {
    if (sdrSel === 'todos') return new Set<string>()
    const actuales = udnActualPorSdr[sdrSel]
    if (!actuales) return new Set<string>()
    const base = mqlsUdn.filter(r => r.sdr === sdrSel)
    const todasUdns = new Set(base.map(r => r.udn))
    return new Set([...todasUdns].filter(u => !actuales.includes(u)))
  }, [mqlsUdn, sdrSel, udnActualPorSdr])

  const chartDataReuniones = useMemo(() => {
    const base = sdrSel === 'todos' ? actividad : actividad.filter(r => r.sdr === sdrSel)
    const meses = Array.from(new Set(base.map(r => r.mes))).sort()
    return meses.map(mes => {
      const fila: Record<string, string | number> = { mes: mesLabel(mes) }
      sdrsAMostrar.forEach(sdr => {
        const row = base.find(r => r.mes === mes && r.sdr === sdr)
        fila[sdr] = row?.reuniones_completadas || 0
      })
      fila.total = sdrsAMostrar.reduce((s, sd) => s + (fila[sd] as number || 0), 0)
      return fila
    })
  }, [actividad, sdrSel, sdrsAMostrar])

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando datos de SDR...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>Gestión SDR</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Rendimiento de prospección · hasta antes de SQL</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={udnSel} onChange={e => setUdnSel(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, color: '#172033', background: '#fff',
          }}>
            <option value="todas">Todas las UDN</option>
            {udnsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={sdrSel} onChange={e => setSdrSel(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, color: '#172033', background: '#fff',
          }}>
            <option value="todos">Todos los SDR</option>
            {SDRS_VIGENTES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <PeriodoPicker dateFrom={dateFrom} dateTo={dateTo} activePreset={activePreset}
            onChange={(f, t, label) => { setDateFrom(f); setDateTo(t); setActivePreset(label) }} />
          {(udnSel !== 'todas' || sdrSel !== 'todos' || activePreset !== 'Este año') && (
            <button onClick={() => { setUdnSel('todas'); setSdrSel('todos'); setDateFrom(`${anioActual}-01-01`); setDateTo(toDateOnly(new Date())); setActivePreset('Este año') }}
              style={{
                padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
                fontSize: 12.5, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
              }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {comparativoDinamico && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 12, color: '#64748b',
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px', width: 'fit-content',
        }}>
          <span>Actividad al {comparativoDinamico.labelActual}: <strong style={{ color: '#172033' }}>{comparativoDinamico.actual.toLocaleString()}</strong></span>
          <span style={{ color: '#cbd5e1' }}>vs</span>
          <span>al {comparativoDinamico.labelAnterior}: <strong style={{ color: '#172033' }}>{comparativoDinamico.anterior.toLocaleString()}</strong></span>
          {comparativoDinamico.delta !== null && (
            <span style={{ fontWeight: 700, color: parseFloat(comparativoDinamico.delta) >= 0 ? '#22c55e' : '#ef4444' }}>
              {parseFloat(comparativoDinamico.delta) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(comparativoDinamico.delta))}%
            </span>
          )}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Funnel de prospección
          </div>
          <span title="Actividad: llamadas, mensajes y WhatsApp gestionados. Contacto conectado: llamadas donde la persona contestó. MQL calificado: contactos que cumplieron BANT. Reunión completada: reunión de credenciales con el Comercial ya realizada. El % bajo cada número es la conversión respecto a la etapa anterior."
            style={{ fontSize: 11, color: '#94a3b8', cursor: 'help', border: '1px solid #cbd5e1', borderRadius: '50%', width: 14, height: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            ⓘ
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FunnelEtapa label="Actividad" valor={totales.totalActividad} pct={null} tooltip="Llamadas, mensajes y WhatsApp gestionados en el periodo" />
          <span style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }}>→</span>
          <FunnelEtapa
            label="Contacto conectado"
            valor={totales.contactosConectados}
            pct={totales.totalActividad > 0 ? `${((totales.contactosConectados / totales.totalActividad) * 100).toFixed(1)}% de la actividad` : null}
            tooltip="Llamadas donde la persona sí contestó"
          />
          <span style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }}>→</span>
          <FunnelEtapa
            label="MQL calificado"
            valor={totales.mqls}
            pct={totales.contactosConectados > 0 ? `${((totales.mqls / totales.contactosConectados) * 100).toFixed(1)}% de conectados` : null}
            tooltip="Contactos que cumplieron BANT (necesidad, presupuesto, autoridad, tiempo)"
          />
          <span style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }}>→</span>
          <FunnelEtapa
            label="Reunión completada"
            valor={totales.reunionesCompletadas}
            pct={totales.mqls > 0 ? `${((totales.reunionesCompletadas / totales.mqls) * 100).toFixed(1)}% de MQLs` : null}
            tooltip="Reunión de credenciales con el Comercial que ya se llevó a cabo"
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          MQLs por UDN a lo largo del tiempo
        </div>
        <ChartLegend items={udnsPresentes} colors={UDN_COLORS} historicos={udnsHistoricas} />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataUdn} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<CustomTooltip />} />
            {udnsPresentes.map((udn, i) => (
              <Bar
                key={udn} dataKey={udn} stackId="a" fill={UDN_COLORS[udn] || '#94a3b8'} name={udn}
                shape={(props: any) => {
                  const row = props.payload || {}
                  const lastConValor = [...udnsPresentes].reverse().find(u => (row[u] || 0) > 0)
                  return lastConValor === udn ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                }}
              >
                {i === udnsPresentes.length - 1 && (
                  <LabelList dataKey="total" position="top" formatter={(v: number) => fmtNum(v)} style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Reuniones completadas por SDR
        </div>
        <ChartLegend items={sdrsAMostrar} colors={SDR_COLORS} />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataReuniones} margin={{ top: 24, right: 8, left: 0, bottom: 8 }} barCategoryGap="20%" maxBarSize={96}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<CustomTooltip />} />
            {sdrsAMostrar.map((sdr, i) => (
              <Bar
                key={sdr} dataKey={sdr} stackId="b" fill={SDR_COLORS[sdr]} name={sdr}
                shape={(props: any) => {
                  const row = props.payload || {}
                  const lastConValor = [...sdrsAMostrar].reverse().find(s => (row[s] || 0) > 0)
                  return lastConValor === sdr ? <RoundedTopBar {...props} /> : <GlossyBar {...props} />
                }}
              >
                {i === sdrsAMostrar.length - 1 && (
                  <LabelList dataKey="total" position="top" formatter={(v: number) => fmtNum(v)} style={{ fontSize: 11, fontWeight: 700, fill: '#0f172a' }} />
                )}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', padding: '16px 20px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Comparativo por SDR
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '8px 20px' }}>SDR</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actividad</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Conectados</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>MQLs</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Reuniones</th>
              <th style={{ padding: '8px 20px', textAlign: 'right' }} title="De cada 100 actividades registradas, cuantas terminaron en un MQL calificado. Es una referencia de eficiencia, comparala entre SDRs con contexto (cartera, UDN, antiguedad).">Actividad → MQL ⓘ</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(row => {
              const abierto = filaExpandida === row.sdr
              return (
                <React.Fragment key={row.sdr}>
                  <tr style={{ borderBottom: abierto ? 'none' : '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 20px', fontWeight: 600, color: '#172033' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SDR_COLORS[row.sdr], flexShrink: 0 }} />
                        {row.sdr}
                      </span>
                    </td>
                    <td
                      onClick={() => setFilaExpandida(abierto ? null : row.sdr)}
                      style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', cursor: 'pointer', userSelect: 'none' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3"
                          style={{ transform: abierto ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        {row.totalActividad.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{row.contactosConectados.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: ACCENT }}>{row.mqls.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{row.reunionesCompletadas.toLocaleString()}</td>
                    <td style={{ padding: '10px 20px', textAlign: 'right', color: '#64748b' }}>{row.tasaConversion}%</td>
                  </tr>
                  {abierto && (
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td colSpan={6} style={{ padding: '0 20px 12px 44px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8 }}>
                          {row.tipos.length === 0 && (
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Sin desglose disponible</div>
                          )}
                          {row.tipos.map(t => (
                            <div key={t.tipo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b', maxWidth: 260 }}>
                              <span>{TIPO_LABELS[t.tipo] || t.tipo}</span>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{t.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
