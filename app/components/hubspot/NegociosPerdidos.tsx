'use client';
import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const ACCENT = '#FF6B35'

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

// ---- DUMMY DATA (estructura; luego se reemplaza por RPCs de Supabase) ----
const DUMMY_POR_UDN = [
  { udn: 'Promo Espacio', opps: 166 }, { udn: 'Marketing United', opps: 112 },
  { udn: 'Research Land', opps: 95 }, { udn: 'Mexa Creativa', opps: 64 },
  { udn: 'House Of Films', opps: 54 }, { udn: 'UIX', opps: 52 },
  { udn: 'Zeus', opps: 51 }, { udn: 'Neracode', opps: 21 },
]
const DUMMY_POR_MOTIVO = [
  { motivo: 'Sin respuesta', opps: 140 }, { motivo: 'Otro', opps: 69 },
  { motivo: 'Competencia', opps: 66 }, { motivo: 'No tienen presupuesto', opps: 64 },
  { motivo: 'Automatización', opps: 53 }, { motivo: 'Proyecto postergado', opps: 50 },
  { motivo: 'Desconocido', opps: 35 }, { motivo: 'Precio demasiado alto', opps: 34 },
  { motivo: 'No autorizado por decisor', opps: 28 }, { motivo: 'Procesos internos', opps: 25 },
]
const DUMMY_POR_FUENTE = [
  { fuente: 'Outbound', opps: 231 }, { fuente: 'Inbound', opps: 174 },
  { fuente: 'Referido', opps: 98 }, { fuente: 'Evento', opps: 72 }, { fuente: 'Renovación', opps: 40 },
]
function dummySerie(keys: string[]) {
  return MESES.map((mes, i) => {
    const row: Record<string, number | string> = { mes }
    keys.forEach((k, j) => { row[k] = Math.max(0, Math.round(8 + 14 * Math.sin(i + j) + (i * 2 + j * 3) % 11)) })
    return row
  })
}
const DUMMY_TIEMPO_UDN = dummySerie(UDNS)
const DUMMY_TIEMPO_FUENTE = dummySerie(FUENTES)
const FUENTE_COLORS: Record<string, string> = {
  'Referido': '#22c55e', 'Outbound': '#f97316', 'Inbound': '#4f46e5', 'Evento': '#ec4899', 'Renovación': '#64748b',
}
const DUMMY_DETALLE = Array.from({ length: 63 }, (_, i) => ({
  udn: UDNS[i % UDNS.length],
  empresa: ['Ana Monge', 'INSUTRIAS ADIR', 'Todo en la Nube', 'CATMOVERS', 'Toyota', 'Grupo Sayer', 'Colfondos', 'Kia México', 'Epiavontuur', 'SANURA', 'Gopropflow', 'Logrand', 'ADN MEDIA', 'QBitss', 'Ideën Stores', 'INGENES', 'AGROSUPER', 'FREE LIFE'][i % 18],
  fecha: `${28 - (i % 27)} jul 2026`,
  motivo: MOTIVOS[i % MOTIVOS.length],
  detalle: 'Texto de ejemplo del motivo de pérdida registrado en HubSpot para esta propuesta.',
  link: '#',
  valor: [150000, 700000, 0, 67393, 1608663, 831000, 269000, 745426, 6630721, 407000][i % 10],
}))

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

const fmtMoney = (v: number) => v ? '$' + v.toLocaleString('es-MX') : '-'

export default function NegociosPerdidos() {
  const [fUdn, setFUdn] = useState('')
  const [fGen, setFGen] = useState('')
  const [fFuente, setFFuente] = useState('')
  const [fMotivo, setFMotivo] = useState('')
  const [pagina, setPagina] = useState(0)
  const PAGE = 20

  const detalleFiltrado = useMemo(() => DUMMY_DETALLE.filter(r =>
    (!fUdn || r.udn === fUdn) && (!fMotivo || r.motivo === fMotivo)
  ), [fUdn, fMotivo])
  const totalPaginas = Math.max(1, Math.ceil(detalleFiltrado.length / PAGE))
  const pageRows = detalleFiltrado.slice(pagina * PAGE, (pagina + 1) * PAGE)
  const totalValor = detalleFiltrado.reduce((s, r) => s + r.valor, 0)

  return (
    <div>
      {/* Filtros */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select style={selStyle} value={fUdn} onChange={e => { setFUdn(e.target.value); setPagina(0) }}>
            <option value="">Unidad de negocio</option>
            {UDNS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select style={selStyle} value={fGen} onChange={e => setFGen(e.target.value)}>
            <option value="">Generado por</option>
            {GENERADO.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select style={selStyle} value={fFuente} onChange={e => setFFuente(e.target.value)}>
            <option value="">Fuente adquisición</option>
            {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select style={selStyle} value={fMotivo} onChange={e => { setFMotivo(e.target.value); setPagina(0) }}>
            <option value="">Motivo de perdido</option>
            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => { setFUdn(''); setFGen(''); setFFuente(''); setFMotivo(''); setPagina(0) }}
              style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
              ✕ Borrar filtros
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
          Datos de ejemplo — pendiente de conexión a Supabase. Esta hoja muestra todos los datos a partir de la fecha en la que entró a su respectiva etapa.
        </div>

        {/* 3 tarjetas superiores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Propuestas perdidas por UDN</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={thStyle}>Unidad de negocio</th><th style={{ ...thStyle, textAlign: 'right' }}>Opps</th></tr></thead>
              <tbody>
                {DUMMY_POR_UDN.map(r => (
                  <tr key={r.udn}><td style={tdStyle}>{r.udn}</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.opps}</td></tr>
                ))}
                <tr><td style={{ ...tdStyle, fontWeight: 800 }}>Total</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800 }}>{DUMMY_POR_UDN.reduce((s, r) => s + r.opps, 0)}</td></tr>
              </tbody>
            </table>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Propuestas perdidas por Fuente</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={DUMMY_POR_FUENTE} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="fuente" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="opps" fill={ACCENT} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Propuestas perdidas por motivo</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={thStyle}>Motivo de descalificación</th><th style={{ ...thStyle, textAlign: 'right' }}>Opps</th></tr></thead>
              <tbody>
                {DUMMY_POR_MOTIVO.map(r => (
                  <tr key={r.motivo}><td style={tdStyle}>{r.motivo}</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{r.opps}</td></tr>
                ))}
                <tr><td style={{ ...tdStyle, fontWeight: 800 }}>Total</td><td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800 }}>{DUMMY_POR_MOTIVO.reduce((s, r) => s + r.opps, 0)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Series de tiempo */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Propuestas perdidas en el tiempo por fuente</div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>Por mes de fecha de pérdida, desglosado por fuente de adquisición</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DUMMY_TIEMPO_FUENTE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {FUENTES.map(f => <Bar key={f} dataKey={f} stackId="a" fill={FUENTE_COLORS[f]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Propuestas perdidas en el tiempo por Unidad de negocio</div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 12 }}>Por mes de fecha de pérdida, desglosado por UDN</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DUMMY_TIEMPO_UDN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {UDNS.map(u => <Bar key={u} dataKey={u} stackId="a" fill={UDN_COLORS[u]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>

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
                {pageRows.map((r, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{r.udn}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.empresa}</td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{r.fecha}</td>
                    <td style={tdStyle}>{r.motivo}</td>
                    <td style={{ ...tdStyle, maxWidth: 340, color: '#475569' }}>{r.detalle}</td>
                    <td style={tdStyle}><a href={r.link} style={{ color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>Ver en HubSpot</a></td>
                    <td style={{ ...tdStyle, textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtMoney(r.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>Total: {fmtMoney(totalValor)}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#64748b' }}>
              {pagina * PAGE + 1} - {Math.min((pagina + 1) * PAGE, detalleFiltrado.length)} / {detalleFiltrado.length}
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
