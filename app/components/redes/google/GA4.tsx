'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import KPICard, { InfoTip } from '../KPICard'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR || 'https://wuwhcljeigskajjoyghv.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MBR || ''

interface RowTotal {
  udn: string; fecha: string; canal_grupo: string; fuente_medio: string
  sessions: number; total_users: number; new_users: number; screen_page_views: number
  engaged_sessions: number; avg_session_duration: number; event_count: number; key_events: number
}
interface RowPagina extends RowTotal { page_path: string; page_title: string }
interface Props { accent: string; secondary: string; bg?: string; gradient?: string; perfil?: { rol?: string; udn?: string | null } | null }

async function fetchSB(table: string, params: [string,string][] = []) {
  if (!SUPABASE_KEY) return []
  const q = new URLSearchParams()
  q.append('select', '*')
  for (const [k, v] of params) q.append(k, v)
  const PAGE = 1000
  let all: any[] = []
  let from = 0
  while (true) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Range: `${from}-${from+PAGE-1}`, Prefer: 'count=exact' }
    })
    if (!r.ok) break
    const chunk = await r.json()
    all = all.concat(chunk)
    if (chunk.length < PAGE) break
    from += PAGE
  }
  return all
}

function fmt(n: number) {
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000) return (n/1000).toFixed(1).replace('.0','')+'K'
  return Math.round(n).toLocaleString('es-MX')
}
function fmtSeg(seg: number) {
  const m = Math.floor(seg/60), s = Math.round(seg%60)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}
function mesLabel(fecha: string) {
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const [y,m] = fecha.split('-')
  return `${meses[parseInt(m)-1]} ${y.slice(2)}`
}
function toDateStr(d: Date) { return d.toISOString().slice(0,10) }
function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0,10)
}
function daysBetween(from: string, to: string) {
  const a = new Date(from + 'T00:00:00Z'), b = new Date(to + 'T00:00:00Z')
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

const PRESETS = [
  { label:'Últimos 30 días',   fn:()=>{ const d=new Date(),s=new Date(); s.setDate(s.getDate()-30);  return [toDateStr(s),toDateStr(d)] as [string,string] } },
  { label:'Últimos 90 días',   fn:()=>{ const d=new Date(),s=new Date(); s.setDate(s.getDate()-90);  return [toDateStr(s),toDateStr(d)] as [string,string] } },
  { label:'Este año',          fn:()=>[ `${new Date().getFullYear()}-01-01`, toDateStr(new Date())] as [string,string] },
  { label:'Todo el historial', fn:()=>['2025-01-01', toDateStr(new Date())] as [string,string] },
]

const CANAL_COLORS: Record<string,string> = {
  'Organic Search':'#4285F4', 'Paid Search':'#F9AB00', 'Direct':'#34A853',
  'Email':'#EA4335', 'Paid Social':'#673AB7', 'Unassigned':'#9AA0A6',
  'Referral':'#00ACC1', 'Organic Social':'#FB8C00', 'Cross-network':'#8E24AA',
}

function agregarKpis(rows: RowTotal[]) {
  const sessions = rows.reduce((s,r) => s + r.sessions, 0)
  const engagedSessions = rows.reduce((s,r) => s + r.engaged_sessions, 0)
  const eventCount = rows.reduce((s,r) => s + r.event_count, 0)

  // totalUsers/newUsers: GA4 reporta usuarios únicos por combinación de dimensiones
  // (fecha x canal x fuente/medio). Sumar todas las filas sobre-cuenta usuarios que
  // aparecen en múltiples canales el mismo día. Colapsamos primero por fecha para
  // reducir esa sobre-cuenta antes de sumar.
  const porFecha = new Map<string, { totalUsers: number; newUsers: number }>()
  for (const r of rows) {
    const acc = porFecha.get(r.fecha) || { totalUsers: 0, newUsers: 0 }
    acc.totalUsers += r.total_users
    acc.newUsers += r.new_users
    porFecha.set(r.fecha, acc)
  }
  const totalUsers = Array.from(porFecha.values()).reduce((s,d) => s + d.totalUsers, 0)
  const newUsers = Array.from(porFecha.values()).reduce((s,d) => s + d.newUsers, 0)
  const recurrentUsers = Math.max(0, totalUsers - newUsers)

  // avgDuration ponderado por sesiones (no promedio simple de promedios)
  const sumaDuracionPonderada = rows.reduce((s,r) => s + r.avg_session_duration * r.sessions, 0)
  const avgDuration = sessions > 0 ? sumaDuracionPonderada / sessions : 0

  const engagementRate = sessions > 0 ? (engagedSessions/sessions*100) : 0
  const bounceRate = sessions > 0 ? (1 - engagedSessions/sessions)*100 : 0
  return { sessions, totalUsers, newUsers, recurrentUsers, eventCount, avgDuration, engagementRate, bounceRate }
}
function pctDelta(actual: number, anterior: number): number | null {
  if (!anterior) return null
  return ((actual - anterior) / anterior) * 100
}

export default function GA4({ accent, secondary }: Props) {
  const [totales, setTotales] = useState<RowTotal[]>([])
  const [totalesPrev, setTotalesPrev] = useState<RowTotal[]>([])
  const [paginas, setPaginas] = useState<RowPagina[]>([])
  const [loading, setLoading] = useState(true)
  const [udnSel, setUdnSel] = useState<string>('todas')
  const [canalSel, setCanalSel] = useState<string>('todos')
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [dateTo, setDateTo] = useState(toDateStr(new Date()))
  const [tempFrom, setTempFrom] = useState(dateFrom)
  const [tempTo, setTempTo] = useState(dateTo)
  const [activePreset, setActivePreset] = useState('Este año')
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function applyPreset(label: string, fn: () => [string,string]) {
    const [f,t] = fn(); setDateFrom(f); setDateTo(t); setTempFrom(f); setTempTo(t)
    setActivePreset(label); setShowPicker(false)
  }
  function applyCustom() { setDateFrom(tempFrom); setDateTo(tempTo); setActivePreset('Personalizado'); setShowPicker(false) }
  const periodLabel = activePreset === 'Personalizado' ? `${dateFrom} → ${dateTo}` : activePreset

  const rangeDays = daysBetween(dateFrom, dateTo)
  const prevTo = addDays(dateFrom, -1)
  const prevFrom = addDays(prevTo, -(rangeDays - 1))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchSB('ga4_totales', [['fecha', `gte.${dateFrom}`], ['fecha', `lte.${dateTo}`], ['order', 'fecha.asc']]),
      fetchSB('ga4_totales', [['fecha', `gte.${prevFrom}`], ['fecha', `lte.${prevTo}`]]),
      fetchSB('ga4_paginas', [['fecha', `gte.${dateFrom}`], ['fecha', `lte.${dateTo}`], ['order', 'fecha.asc']]),
    ]).then(([t, tp, p]) => {
      setTotales(t); setTotalesPrev(tp); setPaginas(p); setLoading(false)
    }).catch(() => setLoading(false))
  }, [dateFrom, dateTo])

  const udns = useMemo(() => Array.from(new Set(totales.map(r => r.udn))).sort(), [totales])
  const canales = useMemo(() => Array.from(new Set(totales.map(r => r.canal_grupo))).sort(), [totales])

  const filtrados = useMemo(() => totales
    .filter(r => udnSel === 'todas' || r.udn === udnSel)
    .filter(r => canalSel === 'todos' || r.canal_grupo === canalSel)
  , [totales, udnSel, canalSel])
  const filtradosPrev = useMemo(() => totalesPrev
    .filter(r => udnSel === 'todas' || r.udn === udnSel)
    .filter(r => canalSel === 'todos' || r.canal_grupo === canalSel)
  , [totalesPrev, udnSel, canalSel])
  const paginasFiltradas = useMemo(() => paginas
    .filter(r => udnSel === 'todas' || r.udn === udnSel)
    .filter(r => canalSel === 'todos' || r.canal_grupo === canalSel)
  , [paginas, udnSel, canalSel])

  const hoyStr = toDateStr(new Date())
  const registrosHoy = useMemo(() => filtrados.filter(r => r.fecha === hoyStr).length, [filtrados, hoyStr])

  const kpis = useMemo(() => agregarKpis(filtrados), [filtrados])
  const kpisPrev = useMemo(() => agregarKpis(filtradosPrev), [filtradosPrev])

  const tendenciaMensual = useMemo(() => {
    const porMes: Record<string, { nuevos: number; recurrentes: number }> = {}
    filtrados.forEach(r => {
      const mes = r.fecha.slice(0,7)
      if (!porMes[mes]) porMes[mes] = { nuevos: 0, recurrentes: 0 }
      porMes[mes].nuevos += r.new_users
      porMes[mes].recurrentes += Math.max(0, r.total_users - r.new_users)
    })
    return Object.entries(porMes).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes: mesLabel(mes+'-01'), 'Usuarios nuevos': v.nuevos, 'Usuarios recurrentes': v.recurrentes }))
  }, [filtrados])

  const distribucionCanal = useMemo(() => {
    const porCanal: Record<string, number> = {}
    filtrados.forEach(r => { porCanal[r.canal_grupo] = (porCanal[r.canal_grupo]||0) + r.sessions })
    const total = Object.values(porCanal).reduce((s,v) => s+v, 0)
    return Object.entries(porCanal).sort(([,a],[,b]) => b-a)
      .map(([canal, ses]) => ({ canal, sesiones: ses, pct: total>0 ? (ses/total*100) : 0 }))
  }, [filtrados])

  const topPaginas = useMemo(() => {
    const porPag: Record<string, { titulo: string; usuarios: number; vistas: number; conversiones: number }> = {}
    paginasFiltradas.forEach(r => {
      const key = r.page_path
      if (!porPag[key]) porPag[key] = { titulo: r.page_title || r.page_path, usuarios: 0, vistas: 0, conversiones: 0 }
      porPag[key].usuarios += r.total_users
      porPag[key].vistas += r.screen_page_views
      porPag[key].conversiones += r.key_events
    })
    return Object.entries(porPag).map(([path, v]) => ({ path, ...v }))
      .sort((a,b) => b.usuarios - a.usuarios).slice(0, 15)
  }, [paginasFiltradas])

  const rangoTexto = `${prevFrom} a ${prevTo}`
  const isFiltered = udnSel !== 'todas' || canalSel !== 'todos' || activePreset !== 'Este año'
  function resetFilters() {
    setUdnSel('todas'); setCanalSel('todos')
    const [f,t] = PRESETS[2].fn()
    setDateFrom(f); setDateTo(t); setTempFrom(f); setTempTo(t); setActivePreset('Este año')
  }

  const kpiDefs: { label: string; value: string; delta: number | null; invert?: boolean; info: string; sub?: string }[] = [
    { label: 'Usuarios activos', value: fmt(kpis.totalUsers), delta: pctDelta(kpis.totalUsers, kpisPrev.totalUsers),
      info: `Usuarios únicos que interactuaron con el sitio (totalUsers de GA4). Nota: GA4 solo entrega este dato desglosado por canal/fuente; al sumar esas filas, un mismo usuario que llegó por más de un canal el mismo día se cuenta más de una vez, por lo que esta cifra es una aproximación por exceso frente al total exacto de GA4. % compara contra el mismo número de días justo antes del período seleccionado (${rangoTexto}).` },
    { label: 'Sesiones', value: fmt(kpis.sessions), delta: pctDelta(kpis.sessions, kpisPrev.sessions),
      info: 'Número total de sesiones iniciadas en el sitio (sessions de GA4).' },
    { label: 'Usuarios nuevos', value: fmt(kpis.newUsers), delta: pctDelta(kpis.newUsers, kpisPrev.newUsers),
      info: 'Usuarios que visitaron el sitio por primera vez en el período (newUsers de GA4).' },
    { label: 'Usuarios recurrentes', value: fmt(kpis.recurrentUsers), delta: pctDelta(kpis.recurrentUsers, kpisPrev.recurrentUsers),
      info: 'Usuarios totales menos usuarios nuevos: visitantes que ya conocían el sitio y regresaron. Al heredar la aproximación de "Usuarios activos" (ver esa tarjeta), esta cifra también puede estar sobreestimada frente al dato exacto de GA4; Usuarios nuevos, en cambio, sí es exacto.' },
    { label: 'Tiempo prom. Sesión', value: fmtSeg(kpis.avgDuration), delta: pctDelta(kpis.avgDuration, kpisPrev.avgDuration), sub: 'hh:mm:ss',
      info: 'Duración promedio de una sesión (averageSessionDuration). Más alto suele indicar mayor interés en el contenido.' },
    { label: 'Tasa de ER', value: `${kpis.engagementRate.toFixed(1)}%`, delta: pctDelta(kpis.engagementRate, kpisPrev.engagementRate),
      info: 'Engagement Rate: % de sesiones con 10+ segundos, 2+ páginas vistas, o una conversión. Mide calidad de la visita.' },
    { label: 'Tasa de Rebote', value: `${kpis.bounceRate.toFixed(1)}%`, delta: pctDelta(kpis.bounceRate, kpisPrev.bounceRate), invert: true,
      info: 'Bounce Rate: % de sesiones NO comprometidas (1 - Tasa de ER). Más alto es negativo: el visitante entró y se fue sin interactuar. Por eso aquí verde = bajó.' },
    { label: 'Número de eventos', value: fmt(kpis.eventCount), delta: pctDelta(kpis.eventCount, kpisPrev.eventCount),
      info: 'Total de eventos registrados (clics, scrolls, vistas de página, conversiones, etc.).' },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ background:`linear-gradient(135deg,${accent},${secondary})`,borderRadius:20,padding:'24px 32px',marginBottom:24,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',boxShadow:`0 8px 32px ${accent}40` }}>
        <div style={{ width:52,height:52,borderRadius:14,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>📊</div>
        <div>
          <div style={{ fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.5px' }}>GA4 — Tráfico Web</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:2 }}>
            Google Analytics 4{loading ? ' · Cargando...' : ` · ${fmt(topPaginas.reduce((s,p)=>s+p.vistas,0))} vistas en el período · ${registrosHoy > 0 ? `${registrosHoy} registros hoy` : 'sin datos hoy aún'}`}
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select value={udnSel} onChange={e => setUdnSel(e.target.value)} style={{
            background:'#fff', border:'1px solid rgba(255,255,255,0.6)', borderRadius:9, color:'#334155', padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer',
          }}>
            <option value="todas">Todas las UDN</option>
            {udns.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={canalSel} onChange={e => setCanalSel(e.target.value)} style={{
            background:'#fff', border:'1px solid rgba(255,255,255,0.6)', borderRadius:9, color:'#334155', padding:'8px 14px', fontSize:12.5, fontWeight:600, cursor:'pointer',
          }}>
            <option value="todos">Todos los canales</option>
            {canales.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ position:'relative' }} ref={pickerRef}>
            <button onClick={()=>setShowPicker(!showPicker)}
              style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:9,color:'#fff',padding:'7px 14px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              📅 {periodLabel}
            </button>
            {showPicker && (
              <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,0.18)',padding:20,zIndex:100,minWidth:300}}>
                <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:16}}>
                  {PRESETS.map(p=>(
                    <button key={p.label} onClick={()=>applyPreset(p.label,p.fn)}
                      style={{padding:'8px 12px',borderRadius:8,border:'none',textAlign:'left',cursor:'pointer',fontSize:13,fontWeight:600,
                        background:activePreset===p.label?`${accent}18`:'transparent',color:activePreset===p.label?accent:'#374151'}}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{borderTop:'1px solid #f1f5f9',paddingTop:14}}>
                  <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:10}}>RANGO PERSONALIZADO</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
                    <input type='date' value={tempFrom} onChange={e=>setTempFrom(e.target.value)} style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12}}/>
                    <span style={{color:'#94a3b8',fontSize:12}}>→</span>
                    <input type='date' value={tempTo}   onChange={e=>setTempTo(e.target.value)}   style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12}}/>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowPicker(false)} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                    <button onClick={applyCustom} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:accent,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Aplicar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {isFiltered && (
            <button onClick={resetFilters}
              style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:9,color:'#fff',padding:'7px 14px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
              ✕ Borrar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:24 }}>
        {kpiDefs.map((k, i) => {
          const esPositivo = k.delta !== null ? (k.invert ? k.delta < 0 : k.delta > 0) : undefined
          return (
            <KPICard
              key={i}
              label={k.label}
              value={loading ? '…' : k.value}
              accent={i % 2 === 0 ? accent : secondary}
              delta={!loading && k.delta !== null ? Math.abs(k.delta).toFixed(1) + '%' : undefined}
              deltaUp={esPositivo}
              deltaSuffix="vs periodo anterior"
              info={k.info}
            />
          )
        })}
      </div>

      <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,marginBottom:24 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:4 }}>Tendencia Histórica (Usuarios Nuevos vs. Recurrentes)</div>
        <div style={{ fontSize:11,color:'#64748b',marginBottom:16 }}>Nuevos usuarios vs. usuarios que regresan, por mes</div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>Cargando gráfica...</div> : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={tendenciaMensual} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 10.5, fill: '#64748b' }} label={{ value: 'Mes', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={fmt} label={{ value: 'Usuarios', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Usuarios nuevos" stroke={accent} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Usuarios recurrentes" stroke={secondary} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
        )}
      </div>

      <div style={{ display:'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,flex:1,minWidth:320 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16 }}>Adquisición de Sesiones (Distribución del Tráfico)</div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>Cargando...</div> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribucionCanal} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="canal" tick={{ fontSize: 9.5, fill: '#64748b' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={fmt} label={{ value: 'Sesiones', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
              <Bar dataKey="sesiones" radius={[4,4,0,0]}>
                {distribucionCanal.map((d, i) => <Cell key={i} fill={CANAL_COLORS[d.canal] || accent} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
        <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,flex:1,minWidth:280 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16 }}>Distribución por Canal (%)</div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>Cargando...</div> : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={distribucionCanal} dataKey="sesiones" nameKey="canal" cx="50%" cy="50%" outerRadius={90} label={({ pct }: any) => `${pct.toFixed(1)}%`} labelLine={false}>
                {distribucionCanal.map((d, i) => <Cell key={i} fill={CANAL_COLORS[d.canal] || accent} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 10.5 }} />
            </PieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>Ranking de Contenidos (Páginas Principales)</div>
          <InfoTip text="Top 15 páginas por usuarios reales en el período. Conversiones = eventos clave (key events) registrados en esa página." />
        </div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>Cargando tabla...</div> : (
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead><tr style={{ borderBottom:'1px solid #e2e8f0' }}>
            {['Página','Usuarios reales','Volumen de vistas','Conversiones'].map(h=>
              <th key={h} style={{ padding:'8px 12px',textAlign: h==='Página'?'left':'right',color:'#64748b',fontWeight:600 }}>{h}</th>
            )}
          </tr></thead>
          <tbody>{topPaginas.map((p,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
              <td style={{ padding:'10px 12px',color:accent,fontWeight:600,maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.titulo}</td>
              <td style={{ padding:'10px 12px',textAlign:'right',color:'#0f172a' }}>{fmt(p.usuarios)}</td>
              <td style={{ padding:'10px 12px',textAlign:'right',color:'#0f172a' }}>{fmt(p.vistas)}</td>
              <td style={{ padding:'10px 12px',textAlign:'right',color:p.conversiones>0?'#22c55e':'#94a3b8',fontWeight:p.conversiones>0?700:400 }}>{fmt(p.conversiones)}</td>
            </tr>
          ))}</tbody>
        </table>
        )}
      </div>
    </div>
  )
}
