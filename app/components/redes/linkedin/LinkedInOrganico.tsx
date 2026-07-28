'use client'
import KPICard from '../KPICard'
interface Props { accent: string; secondary: string; bg?: string; gradient?: string }
const CONT = [
  {fecha:'may 2026',tipo:'Articulo',imp:12400,clics:620,er:5.0},
  {fecha:'abr 2026',tipo:'Imagen',imp:18900,clics:480,er:2.5},
  {fecha:'mar 2026',tipo:'Video',imp:24100,clics:890,er:3.7},
  {fecha:'feb 2026',tipo:'Articulo',imp:9800,clics:310,er:3.2},
  {fecha:'ene 2026',tipo:'Imagen',imp:14200,clics:420,er:3.0},
]
function fmt(n: number) {
  if (n>=1000000) return (n/1000000).toFixed(1)+'M'
  if (n>=1000) return (n/1000).toFixed(0)+'K'
  return n.toLocaleString('es-MX')
}
export default function LinkedInOrganico({ accent, secondary, gradient }: Props) {
  return (
    <div style={{ padding:24,maxWidth:1400,margin:'0 auto' }}>
      <div style={{ background:`linear-gradient(135deg,${accent}22,${secondary}11)`,border:`1px solid ${accent}33`,borderRadius:16,padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:16 }}>
        <div style={{ width:48,height:48,borderRadius:12,background:gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>💼</div>
        <div>
          <div style={{ fontSize:18,fontWeight:700,color:'#fff' }}>LinkedIn Organico</div>
          <div style={{ fontSize:13,color:'#8b92a5' }}>Performance Organico · MASTER_ORGANIC_2025</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:24 }}>
        <KPICard label="Impresiones" value={fmt(428000)} accent={accent} />
        <KPICard label="Clics" value={fmt(12840)} accent={accent} />
        <KPICard label="Engagement Rate" value="2.84%" accent={secondary} />
        <KPICard label="Seguidores" value={fmt(18420)} accent={secondary} />
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:20 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:16 }}>Performance por Tipo de Contenido</div>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead><tr style={{ borderBottom:'1px solid #2a2d3e' }}>
            {['Periodo','Tipo','Impresiones','Clics','ER %'].map(h=><th key={h} style={{ padding:'8px 12px',textAlign:'left',color:'#6b7280',fontWeight:500 }}>{h}</th>)}
          </tr></thead>
          <tbody>{CONT.map((c,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #1e2130' }}>
              <td style={{ padding:'10px 12px',color:'#9ca3af' }}>{c.fecha}</td>
              <td style={{ padding:'10px 12px' }}><span style={{ background:accent+'22',color:accent,padding:'2px 8px',borderRadius:4,fontSize:11 }}>{c.tipo}</span></td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(c.imp)}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(c.clics)}</td>
              <td style={{ padding:'10px 12px',color:accent,fontWeight:700 }}>{c.er.toFixed(2)}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
