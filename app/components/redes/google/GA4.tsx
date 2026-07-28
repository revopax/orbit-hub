'use client'
import KPICard from '../KPICard'
interface Props { accent: string; secondary: string; bg?: string; gradient?: string }
const PAGS = [
  {pag:'/inicio',ses:84000,usr:72000,rebote:32.1},
  {pag:'/servicios',ses:41000,usr:38000,rebote:41.5},
  {pag:'/contacto',ses:28000,usr:25000,rebote:28.8},
  {pag:'/nosotros',ses:19000,usr:17500,rebote:45.2},
  {pag:'/blog',ses:14000,usr:13200,rebote:55.0},
]
function fmt(n: number) {
  if (n>=1000000) return (n/1000000).toFixed(1)+'M'
  if (n>=1000) return (n/1000).toFixed(0)+'K'
  return n.toLocaleString('es-MX')
}
export default function GA4({ accent, secondary, gradient }: Props) {
  return (
    <div style={{ padding:24,maxWidth:1400,margin:'0 auto' }}>
      <div style={{ background:`linear-gradient(135deg,${accent}22,${secondary}11)`,border:`1px solid ${accent}33`,borderRadius:16,padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:16 }}>
        <div style={{ width:48,height:48,borderRadius:12,background:gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24 }}>📊</div>
        <div>
          <div style={{ fontSize:18,fontWeight:700,color:'#fff' }}>GA4 — Trafico Web</div>
          <div style={{ fontSize:13,color:'#8b92a5' }}>Google Analytics 4 · Sesiones, Usuarios y Comportamiento</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:24 }}>
        <KPICard label="Sesiones" value={fmt(284560)} accent={accent} />
        <KPICard label="Usuarios" value={fmt(198320)} accent={accent} />
        <KPICard label="Tasa de Rebote" value="38.2%" accent={secondary} />
        <KPICard label="Duracion Promedio" value="3m 2s" accent={secondary} />
      </div>
      <div style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:20 }}>
        <div style={{ fontSize:13,fontWeight:600,color:'#e2e8f0',marginBottom:16 }}>Rendimiento por Pagina</div>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
          <thead><tr style={{ borderBottom:'1px solid #2a2d3e' }}>
            {['Pagina','Sesiones','Usuarios','Tasa Rebote'].map(h=><th key={h} style={{ padding:'8px 12px',textAlign:'left',color:'#6b7280',fontWeight:500 }}>{h}</th>)}
          </tr></thead>
          <tbody>{PAGS.map((p,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #1e2130' }}>
              <td style={{ padding:'10px 12px',color:accent,fontWeight:500 }}>{p.pag}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(p.ses)}</td>
              <td style={{ padding:'10px 12px',color:'#e2e8f0' }}>{fmt(p.usr)}</td>
              <td style={{ padding:'10px 12px',color:p.rebote>50?'#ef4444':'#22c55e' }}>{p.rebote}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
