'use client'
import { useState, useEffect, useMemo } from 'react'
import { InfoTip } from '../KPICard'
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

async function fetchSB(table: string, params: Record<string,string> = {}) {
  if (!SUPABASE_KEY) return []
  const q = new URLSearchParams({ select: '*', ...params })
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

const CANAL_COLORS: Record<string,string> = {
  'Organic Search':'#4285F4', 'Paid Search':'#F9AB00', 'Direct':'#34A853',
  'Email':'#EA4335', 'Paid Social':'#673AB7', 'Unassigned':'#9AA0A6',
  'Referral':'#00ACC1', 'Organic Social':'#FB8C00', 'Cross-network':'#8E24AA',
}

export default function GA4({ accent, secondary }: Props) {
  const [totales, setTotales] = useState<RowTotal[]>([])
  const [paginas, setPaginas] = useState<RowPagina[]>([])
  const [loading, setLoading] = useState(true)
  const [udnSel, setUdnSel] = useState<string>('todas')
  const [dateFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [dateTo] = useState(new Date().toISOString().slice(0,10))

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchSB('ga4_totales', { fecha: `gte.${dateFrom}`, order: 'fecha.asc' }),
      fetchSB('ga4_paginas', { fecha: `gte.${dateFrom}`, order: 'fecha.asc' }),
    ]).then(([t, p]) => {
      setTotales(t); setPaginas(p); setLoading(false)
    }).catch(() => setLoading(false))
  }, [dateFrom])

  const udns = useMemo(() => Array.from(new Set(totales.map(r => r.udn))).sort(), [totales])
  const filtrados = useMemo(() => udnSel === 'todas' ? totales : totales.filter(r => r.udn === udnSel), [totales, udnSel])
  const paginasFiltradas = useMemo(() => udnSel === 'todas' ? paginas : paginas.filter(r => r.udn === udnSel), [paginas, udnSel])

  const hoyStr = new Date().toISOString().slice(0,10)
  const registrosHoy = useMemo(() => filtrados.filter(r => r.fecha === hoyStr).length, [filtrados, hoyStr])

  const kpis = useMemo(() => {
    const sessions = filtrados.reduce((s,r) => s + r.sessions, 0)
    const totalUsers = filtrados.reduce((s,r) => s + r.total_users, 0)
    const newUsers = filtrados.reduce((s,r) => s + r.new_users, 0)
    const engagedSessions = filtrados.reduce((s,r) => s + r.engaged_sessions, 0)
    const eventCount = filtrados.reduce((s,r) => s + r.event_count, 0)
    const avgDuration = filtrados.length ? filtrados.reduce((s,r) => s + r.avg_session_duration, 0) / filtrados.length : 0
    const engagementRate = sessions > 0 ? (engagedSessions/sessions*100) : 0
    const bounceRate = sessions > 0 ? (1 - engagedSessions/sessions)*100 : 0
    return { sessions, totalUsers, newUsers, eventCount, avgDuration, engagementRate, bounceRate }
  }, [filtrados])

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

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando datos de GA4...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ background:`linear-gradient(135deg,${accent},${secondary})`,borderRadius:20,padding:'24px 32px',marginBottom:24,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',boxShadow:`0 8px 32px ${accent}40` }}>
        <div style={{ width:52,height:52,borderRadius:14,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26 }}>📊</div>
        <div>
          <div style={{ fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.5px' }}>GA4 — Tráfico Web</div>
          <div style={{ fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:2 }}>
            Google Analytics 4 · {fmt(topPaginas.reduce((s,p)=>s+p.vistas,0))} vistas en {dateFrom.slice(0,4)} · {registrosHoy > 0 ? `${registrosHoy} registros hoy` : 'sin datos hoy aún'}
          </div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <select value={udnSel} onChange={e => setUdnSel(e.target.value)} style={{
            background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:9, color:'#fff', padding:'7px 12px', fontSize:12, cursor:'pointer',
          }}>
            <option value="todas" style={{ color: '#334155' }}>Todas las UDN</option>
            {udns.map(u => <option key={u} value={u} style={{ color: '#334155' }}>{u}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:24 }}>
        <KpiBox label="Sesiones" value={fmt(kpis.sessions)} accent={accent} />
        <KpiBox label="Usuarios nuevos" value={fmt(kpis.newUsers)} accent={accent} />
        <KpiBox label="Tiempo prom. Sesión" value={fmtSeg(kpis.avgDuration)} accent={secondary} sub="hh:mm:ss" />
        <KpiBox label="Tasa de ER" value={`${kpis.engagementRate.toFixed(1)}%`} accent={secondary} />
        <KpiBox label="Tasa de Rebote" value={`${kpis.bounceRate.toFixed(1)}%`} accent={accent} />
        <KpiBox label="Número de eventos" value={fmt(kpis.eventCount)} accent={secondary} />
      </div>

      <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,marginBottom:24 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:4 }}>Tendencia Histórica (Usuarios Nuevos vs. Recurrentes)</div>
        <div style={{ fontSize:11,color:'#64748b',marginBottom:16 }}>Nuevos usuarios vs. usuarios que regresan, por mes</div>
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
      </div>

      <div style={{ display:'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,flex:1,minWidth:320 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16 }}>Adquisición de Sesiones (Distribución del Tráfico)</div>
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
        </div>
        <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20,flex:1,minWidth:280 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16 }}>Distribución por Canal (%)</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={distribucionCanal} dataKey="sesiones" nameKey="canal" cx="50%" cy="50%" outerRadius={90} label={({ pct }: any) => `${pct.toFixed(1)}%`} labelLine={false}>
                {distribucionCanal.map((d, i) => <Cell key={i} fill={CANAL_COLORS[d.canal] || accent} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 10.5 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20 }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:16 }}>
          <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>Ranking de Contenidos (Páginas Principales)</div>
          <InfoTip text="Top 15 páginas por usuarios reales en el período. Conversiones = eventos clave (key events) registrados en esa página." />
        </div>
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
      </div>
    </div>
  )
}

function KpiBox({ label, value, accent, sub }: { label: string; value: string; accent: string; sub?: string }) {
  return (
    <div style={{ flex:1, minWidth:150, background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px 18px', borderTop:`3px solid ${accent}` }}>
      <div style={{ fontSize:10.5,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6,fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:24,fontWeight:800,color:'#0f172a' }}>{value}</div>
      {sub && <div style={{ fontSize:9.5,color:'#94a3b8',marginTop:2 }}>{sub}</div>}
    </div>
  )
}
