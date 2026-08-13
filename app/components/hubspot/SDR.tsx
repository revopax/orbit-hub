'use client';
import React, { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const ACCENT = '#7038E5'
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

const UDN_COLORS: Record<string, string> = {
  'Mexa Creativa': '#FD00C7', 'House Of Films': '#000000', 'Marketing United': '#dcff00',
  'UIX': '#ACE738', 'Neracode': '#3E31CC', 'Zeus': '#FF004F', 'Research Land': '#770EB7',
  'Promo Espacio': '#FF7600', 'Upax': '#323644', 'Sin UDN': '#94a3b8',
}

const SDRS_VIGENTES = [
  'Elizabeth Gomez', 'Jennifer Dessire Silva Trejo', 'Antonio Leodegario Vargas Ochoa',
  'Neyby Ruiz', 'Edna González', 'Otniel Sedano Ugalde',
]

interface RowActividad {
  sdr: string; mes: string; total_actividad: number; contactos_conectados: number
  reuniones_agendadas: number; reuniones_completadas: number
}
interface RowMqlUdn { sdr: string; mes: string; udn: string; mqls: number }

function mesLabel(mes: string) {
  const [y, m] = mes.split('-')
  const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${nombres[parseInt(m, 10) - 1]} ${y.slice(2)}`
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

function FunnelEtapa({ label, valor, pct }: { label: string; valor: number; pct: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: ACCENT }}>{valor.toLocaleString()}</div>
      </div>
      {pct && (
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, flexShrink: 0, background: '#f8fafc', borderRadius: 8, padding: '4px 8px' }}>
          {pct}
        </div>
      )}
    </div>
  )
}

export default function SDR() {
  const anioActual = new Date().getFullYear()
  const [desde] = useState(`${anioActual}-01`)
  const [hasta] = useState(`${anioActual}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
  const [sdrSel, setSdrSel] = useState<string>('todos')
  const [actividad, setActividad] = useState<RowActividad[]>([])
  const [mqlsUdn, setMqlsUdn] = useState<RowMqlUdn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      rpc<RowActividad[]>('sdr_actividad_mensual', { p_desde: desde, p_hasta: hasta }),
      rpc<RowMqlUdn[]>('sdr_mqls_por_udn_mensual', { p_desde: desde, p_hasta: hasta }),
    ]).then(([a, m]) => {
      setActividad(a)
      setMqlsUdn(m)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [desde, hasta])

  const actividadFiltrada = useMemo(() =>
    sdrSel === 'todos' ? actividad : actividad.filter(r => r.sdr === sdrSel)
  , [actividad, sdrSel])

  const mqlsFiltrados = useMemo(() =>
    sdrSel === 'todos' ? mqlsUdn : mqlsUdn.filter(r => r.sdr === sdrSel)
  , [mqlsUdn, sdrSel])

  const totales = useMemo(() => {
    const totalActividad = actividadFiltrada.reduce((s, r) => s + r.total_actividad, 0)
    const contactosConectados = actividadFiltrada.reduce((s, r) => s + r.contactos_conectados, 0)
    const reunionesAgendadas = actividadFiltrada.reduce((s, r) => s + r.reuniones_agendadas, 0)
    const reunionesCompletadas = actividadFiltrada.reduce((s, r) => s + r.reuniones_completadas, 0)
    const mqls = mqlsFiltrados.reduce((s, r) => s + r.mqls, 0)
    return { totalActividad, contactosConectados, mqls, reunionesAgendadas, reunionesCompletadas }
  }, [actividadFiltrada, mqlsFiltrados])

  const leaderboard = useMemo(() => {
    return SDRS_VIGENTES.map(sdr => {
      const act = actividad.filter(r => r.sdr === sdr)
      const mqlRows = mqlsUdn.filter(r => r.sdr === sdr)
      const totalActividad = act.reduce((s, r) => s + r.total_actividad, 0)
      const contactosConectados = act.reduce((s, r) => s + r.contactos_conectados, 0)
      const mqls = mqlRows.reduce((s, r) => s + r.mqls, 0)
      const reunionesCompletadas = act.reduce((s, r) => s + r.reuniones_completadas, 0)
      const tasaConversion = totalActividad > 0 ? ((mqls / totalActividad) * 100).toFixed(1) : '0.0'
      return { sdr, totalActividad, contactosConectados, mqls, reunionesCompletadas, tasaConversion }
    }).sort((a, b) => b.mqls - a.mqls)
  }, [actividad, mqlsUdn])

  const chartData = useMemo(() => {
    const meses = Array.from(new Set(mqlsFiltrados.map(r => r.mes))).sort()
    const udns = Array.from(new Set(mqlsFiltrados.map(r => r.udn)))
    return meses.map(mes => {
      const fila: Record<string, string | number> = { mes: mesLabel(mes) }
      udns.forEach(udn => {
        fila[udn] = mqlsFiltrados.filter(r => r.mes === mes && r.udn === udn).reduce((s, r) => s + r.mqls, 0)
      })
      return fila
    })
  }, [mqlsFiltrados])

  const udnsPresentes = useMemo(() => Array.from(new Set(mqlsFiltrados.map(r => r.udn))), [mqlsFiltrados])

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Cargando datos de SDR...</div>
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033', margin: 0 }}>Gestión SDR</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Rendimiento de prospección, {anioActual} · hasta antes de SQL</p>
        </div>
        <select value={sdrSel} onChange={e => setSdrSel(e.target.value)} style={{
          padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, color: '#172033', background: '#fff',
        }}>
          <option value="todos">Todos los SDR</option>
          {SDRS_VIGENTES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Funnel de prospección
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FunnelEtapa label="Actividad" valor={totales.totalActividad} pct={null} />
          <FunnelEtapa
            label="Contacto conectado"
            valor={totales.contactosConectados}
            pct={totales.totalActividad > 0 ? `${((totales.contactosConectados / totales.totalActividad) * 100).toFixed(1)}%` : null}
          />
          <FunnelEtapa
            label="MQL calificado"
            valor={totales.mqls}
            pct={totales.contactosConectados > 0 ? `${((totales.mqls / totales.contactosConectados) * 100).toFixed(1)}%` : null}
          />
          <FunnelEtapa
            label="Reunión completada"
            valor={totales.reunionesCompletadas}
            pct={totales.mqls > 0 ? `${((totales.reunionesCompletadas / totales.mqls) * 100).toFixed(1)}%` : null}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <MetricCard label="Actividad total" value={totales.totalActividad.toLocaleString()} />
        <MetricCard label="Contactos conectados" value={totales.contactosConectados.toLocaleString()} />
        <MetricCard label="MQLs calificados" value={totales.mqls.toLocaleString()} />
        <MetricCard label="Reuniones completadas" value={totales.reunionesCompletadas.toLocaleString()} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          MQLs por UDN a lo largo del tiempo
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {udnsPresentes.map(udn => (
              <Bar key={udn} dataKey={udn} stackId="a" fill={UDN_COLORS[udn] || '#94a3b8'} />
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
              <th style={{ padding: '8px 20px', textAlign: 'right' }}>Actividad → MQL</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map(row => (
              <tr key={row.sdr} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 20px', fontWeight: 600, color: '#172033' }}>{row.sdr}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{row.totalActividad.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{row.contactosConectados.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: ACCENT }}>{row.mqls.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b' }}>{row.reunionesCompletadas.toLocaleString()}</td>
                <td style={{ padding: '10px 20px', textAlign: 'right', color: '#64748b' }}>{row.tasaConversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
