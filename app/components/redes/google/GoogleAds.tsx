'use client'
import KPICard from '../KPICard'
interface Props { accent: string; secondary: string; bg?: string; gradient?: string }
const KWS = [
  {kw:'agencia de marketing',imp:45000,clics:3200,ctr:7.1,cpc:8.5},
  {kw:'outsourcing RRHH',imp:38000,clics:2100,ctr:5.5,cpc:14.2},
  {kw:'reclutamiento masivo',imp:29000,clics:1850,ctr:6.4,cpc:11.0},
  {kw:'agencia BTL',imp:22000,clics:980,ctr:4.5,cpc:18.3},
  {kw:'research de mercado',imp:18000,clics:760,ctr:4.2,cpc:22.1},
]
function fmt(n: number) {
  if (n>=1000000) return (n/1000000).toFixed(1)+'M'
  if (n>=1000) return (n/1000).toFixed(0)+'K'
  return n.toLocaleString('es-MX')
}
export default function GoogleAds({ accent, secondary, gradient }: Props) {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ background:`linear-gradient(135deg,${accent}22,${secondary}11)`, border:`1px solid ${accent}33`, borderRadius:16, padding:'20px 24px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:48,height:48,borderRadius:12,background:gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>🔵</div>
        <div>
          <div style={{ fontSize:18,fontWeight:700,color:'#fff' }}>Google Ads</div>
          <div style={{ fontSize:13,color:'#8b92a5' }}>Performance Paid · Busqueda, Display y Video</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:24 }}>
        <KPICard label="Impresiones" value={fmt(1284000)} accent={accent} />
        <KPICard label="Clics" value={fmt(38520)} accent={accent} />
        <KPICard label="CTR" value="3.00%" accent={secondary} />
        <KPICard label="CPC Promedio" value="$12.40" accent={secondary} />
        <KPICard label="Conversiones" value={fmt(892)} accent={accent} />
        <KPICard label="Costo Total" value="$477K" accent={secondary} />
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:20 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:16 }}>Top Keywords</div>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead><tr style={{ borderBottom:'1px solid #2a2d3e' }}>
            {['Keyword','Impresiones','Clics','CTR','CPC'].map(h=><th key={h} style={{ padding:'8px 12px',textAlign:'left',color:'#6b7280',fontWeight:500 }}>{h}</th>)}
          </tr></thead>
          <tbody>{KWS.map((k,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #1e2130' }}>
              <td style={{ padding:'10px 12px',color:accent,fontWeight:500 }}>{k.kw}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(k.imp)}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(k.clics)}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{k.ctr}%</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>${k.cpc}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
