'use client'
import { useState } from 'react'
import MetaOrganico     from './redes/meta/MetaOrganico'
import MetaAds          from './redes/meta/MetaAds'
import GoogleAds        from './redes/google/GoogleAds'
import GA4              from './redes/google/GA4'
import LinkedInOrganico from './redes/linkedin/LinkedInOrganico'
import LinkedInAds      from './redes/linkedin/LinkedInAds'

const imgStyle = { height:22, width:'auto', objectFit:'contain' as const, maxWidth:64 }

const TABS = [
  { id:'meta-org',   label:'META Orgánico',    primary:'#0866FF', secondary:'#E1306C', bg:'#eef1f8',
    logo: <img src="/logos/Meta_Business-Suite-Organico-logo.png" alt="META" style={imgStyle}/> },
  { id:'meta-ads',   label:'META Ads',          primary:'#0866FF', secondary:'#23408E', bg:'#eef1f8',
    logo: <img src="/logos/Meta-Ads-Manager-logo.jpg" alt="META Ads" style={imgStyle}/> },
  { id:'google-ads', label:'Google Ads',        primary:'#1a73e8', secondary:'#34A853', bg:'#eef4f8',
    logo: <img src="/logos/Google-Ads-logo.png" alt="Google Ads" style={imgStyle}/> },
  { id:'ga4',        label:'GA4',               primary:'#e37400', secondary:'#F9AB00', bg:'#fdf6ec',
    logo: <img src="/logos/Google-Analytics-logo.png" alt="GA4" style={imgStyle}/> },
  { id:'li-org',     label:'LinkedIn Orgánico', primary:'#0A66C2', secondary:'#00A0DC', bg:'#eef4f8',
    logo: <img src="/logos/Linkedin-Organico-logo.png" alt="LinkedIn" style={imgStyle}/> },
  { id:'li-ads',     label:'LinkedIn Ads',      primary:'#0077B5', secondary:'#005FA3', bg:'#eef1f8',
    logo: <img src="/logos/Linkedin-Ads-logo.png" alt="LinkedIn Ads" style={imgStyle}/> },
]

function NetworkLogo({ color }: { color: string }) {
  const nodes = [
    { cx:8,  cy:10, r:3.4, fill:'#0866FF' },
    { cx:22, cy:6,  r:2.8, fill:'#E1306C' },
    { cx:36, cy:12, r:3.0, fill:'#FBBC04' },
    { cx:40, cy:26, r:2.8, fill:'#e37400' },
    { cx:28, cy:38, r:2.8, fill:'#0A66C2' },
    { cx:10, cy:36, r:2.6, fill:'#FF0000' },
    { cx:22, cy:22, r:4.2, fill:color     },
  ]
  const edges = [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]
  return (
    <svg width='38' height='38' viewBox='0 0 48 48' fill='none'>
      <rect width='48' height='48' rx='11' fill={color} fillOpacity='0.07'/>
      <defs>
        {edges.map(([a,b],i)=>(
          <linearGradient key={i} id={`el${i}`} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy} gradientUnits='userSpaceOnUse'>
            <stop stopColor={nodes[a].fill}/>
            <stop offset='1' stopColor={nodes[b].fill}/>
          </linearGradient>
        ))}
      </defs>
      {edges.map(([a,b],i)=>(
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke={`url(#el${i})`} strokeWidth={i<6?1.4:0.8} strokeOpacity={i<6?0.7:0.3}/>
      ))}
      {nodes.map((n,i)=>(
        <circle key={i} cx={n.cx} cy={n.cy} r={n.r} fill={n.fill} stroke='white' strokeWidth='1.2'/>
      ))}
    </svg>
  )
}

export default function RedesUPAX() {
  const [activeId, setActiveId] = useState('meta-org')
  const tab = TABS.find(t => t.id === activeId)!
  return (
    <div style={{ minHeight:'100vh', background:tab.bg, transition:'background 0.4s ease', fontFamily:'Inter,-apple-system,sans-serif' }}>
      <div style={{
        background:'#fdfdfe', borderBottom:'1px solid #e2e8f0',
        padding:'0 24px', display:'flex', alignItems:'center',
        height:56, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth:1400, margin:'0 auto', width:'100%', display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <NetworkLogo color={tab.primary}/>
          <div style={{ display:'flex', alignItems:'baseline' }}>
            <span style={{ fontWeight:800, fontSize:14, color:'#0f172a' }}>Redes</span>
            <span style={{ fontWeight:900, fontSize:14, color:tab.primary, marginLeft:4, transition:'color 0.3s' }}>UPAX</span>
          </div>
        </div>
        <div style={{ width:1, height:24, background:'#e2e8f0', flexShrink:0 }}/>
        <div style={{ display:'flex', gap:4, overflowX:'auto', flex:1 }}>
          {TABS.map(t => {
            const active = activeId===t.id
            return (
            <button key={t.id} onClick={() => setActiveId(t.id)} style={{
              background: active ? t.primary : 'transparent',
              border: '1px solid '+(active ? t.primary : '#e2e8f0'),
              borderRadius:9, padding:'5px 12px',
              color: active ? '#ffffff' : '#64748b',
              fontSize:12.5, fontWeight: active ? 700 : 500,
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:7,
            }}>
              <span style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center',
                width:24, height:24, flexShrink:0,
                background: active ? 'rgba(255,255,255,0.92)' : 'transparent',
                borderRadius:6, padding: active ? 2 : 0,
                transition:'background 0.2s',
              }}>
                {t.id==='meta-org'   && <img src="/logos/Meta_Business-Suite-Organico-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                {t.id==='meta-ads'   && <img src="/logos/Meta-Ads-Manager-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                {t.id==='google-ads' && <img src="/logos/Google-Ads-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                {t.id==='ga4'        && <img src="/logos/Google-Analytics-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                {t.id==='li-org'     && <img src="/logos/Linkedin-Organico-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
                {t.id==='li-ads'     && <img src="/logos/Linkedin-Ads-logo.png" alt="" style={{width:20,height:20,objectFit:'contain'}}/>}
              </span>
              {t.label}
              {t.id !== 'meta-org' && (
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
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', flexShrink:0, gap:3 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            background:`${tab.primary}14`, borderRadius:20,
            padding:'3px 10px', border:`1px solid ${tab.primary}30`,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:tab.primary, display:'inline-block', animation:'none' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:tab.primary, letterSpacing:'0.03em' }}>
              {new Date().toLocaleDateString('es-MX',{month:'short',year:'numeric'}).toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize:10, color:'#94a3b8', fontWeight:500, letterSpacing:'0.02em' }}>
            Performance y Conversión
          </span>
        </div>
        </div>{/* cierre maxWidth */}
      </div>
      <div>
        {activeId==='meta-org'   && <MetaOrganico     accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
        {activeId==='meta-ads'   && <MetaAds          accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
        {activeId==='google-ads' && <GoogleAds        accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
        {activeId==='ga4'        && <GA4              accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
        {activeId==='li-org'     && <LinkedInOrganico accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
        {activeId==='li-ads'     && <LinkedInAds      accent={tab.primary} secondary={tab.secondary} bg={tab.bg}/>}
      </div>
    </div>
  )
}
