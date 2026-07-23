'use client'
import { useEffect, useState } from 'react'
import KPICard from '../KPICardRedes'

interface Props { accent: string; secondary: string; bg?: string; gradient?: string }

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toLocaleString('es-MX')
}
function fmtPesos(n: number) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'K'
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0 })
}

export default function MetaAds({ accent, secondary }: Props) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/meta_organico.json')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 56px)' }}>
      <div style={{ fontSize:14, color:'#94a3b8' }}>Cargando datos...</div>
    </div>
  )

  const kpis = data?.kpis ?? {}
  const udns: {udn:string, gasto:number}[] = data?.gasto_por_udn ?? []

  return (
    <div style={{ padding:24, maxWidth:1400, margin:'0 auto' }}>
      <div style={{ background:`linear-gradient(135deg,${accent}22,${secondary}11)`, border:`1px solid ${accent}33`, borderRadius:16, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <img src="/logos/Meta-Ads-Manager-logo.png" alt="META Ads" style={{ width:48, height:48, objectFit:'contain', borderRadius:12, background:'white', padding:4 }}/>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'#1e293b' }}>META Ads</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Facebook + Instagram · Campañas Pagadas</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <KPICard label="Gasto Total"    value={fmtPesos(kpis.gasto ?? 0)}       accent={accent} />
        <KPICard label="Impresiones"    value={fmt(kpis.impresiones ?? 0)}       accent={accent} />
        <KPICard label="Clics"          value={fmt(kpis.clics ?? 0)}             accent={accent} />
        <KPICard label="CTR"            value={(kpis.ctr ?? 0).toFixed(2) + '%'} accent={secondary} />
        <KPICard label="CPC Promedio"   value={'$' + (kpis.cpc ?? 0).toFixed(2)} accent={secondary} />
        <KPICard label="Resultados"     value={fmt(kpis.resultados ?? 0)}         accent={secondary} />
      </div>

      {udns.length > 0 && (
        <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#1e293b', marginBottom:16 }}>Gasto por UDN</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #e2e8f0' }}>
                <th style={{ padding:'8px 12px', textAlign:'left', color:'#64748b', fontWeight:500 }}>UDN</th>
                <th style={{ padding:'8px 12px', textAlign:'right', color:'#64748b', fontWeight:500 }}>Gasto</th>
                <th style={{ padding:'8px 12px', textAlign:'right', color:'#64748b', fontWeight:500 }}>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {udns.sort((a,b) => b.gasto - a.gasto).map((row, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding:'10px 12px', color:accent, fontWeight:500 }}>{row.udn}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#1e293b' }}>{fmtPesos(row.gasto)}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', color:'#64748b' }}>
                    {kpis.gasto > 0 ? ((row.gasto / kpis.gasto) * 100).toFixed(1) + '%' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
