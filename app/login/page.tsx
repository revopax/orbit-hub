'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const BUBBLES = [
  { src:'/logo-uix.png',  color:'#8C59FE', xD:18, yD:8,  xM:2,  yM:6,  dur:18 },
  { src:'/logo-rl.png',   color:'#770EB7', xD:58, yD:6,  xM:60, yM:5,  dur:22 },
  { src:'/logo-nc.png',   color:'#3E31CC', xD:6,  yD:28, xM:1,  yM:28, dur:21 },
  { src:'/logo-zeus.png', color:'#61ACAA', xD:74, yD:22, xM:68, yM:22, dur:20 },
  { src:'/logo-pe.png',   color:'#FF7600', xD:8,  yD:58, xM:2,  yM:52, dur:18 },
  { src:'/logo-mexa.png', color:'#FD00C7', xD:76, yD:52, xM:66, yM:48, dur:22 },
  { src:'/logo-mu.png',   color:'#DCFF00', xD:18, yD:76, xM:8,  yM:70, dur:19 },
  { src:'/logo-hof.png',  color:'#888888', xD:58, yD:80, xM:54, yM:68, dur:24 },
]

const MODULES = [
  { id:'brujula',     icon:'🧭', label:'La Brújula Comercial',  sub:'Fase Alfa · Activo',  color:'#4f46e5', url:'https://brujula-comercial-upax.vercel.app/' },
  { id:'radar',       icon:'📡', label:'Radar de Intención',      sub:'Fase Beta · Activo',  color:'#06b6d4', url:'#' },
  { id:'inbound',     icon:'🎨', label:'Inbound Studio',           sub:'Fase Beta · Activo',  color:'#10b981', url:'https://marketing-agent-two-pi.vercel.app/app' },
  { id:'performance', icon:'📊', label:'Performance & Conversión', sub:'Fase Beta · Activo',  color:'#1877F2', url:'https://redes-sociales-upax.vercel.app/' },
  { id:'prospeccion', icon:'🎯', label:'Agente de Prospección',    sub:'Fase Beta · Activo',  color:'#ff7a59', url:'https://www.hubspot.es/' },
]

const INTEL_NODES = [
  { id:'radar',       icon:'📡', step:'02A', name:'Radar de Intención',     sub:'Señal externa · Mercado activo',        desc:'Detecta empresas que ya buscan activamente servicios de marketing. Segmentado por UDN e industria identificada por la Brújula. Fuente: Apollo, Semrush, Google Trends.', color:'#06b6d4', fase:'Fase Beta' },
  { id:'prospeccion', icon:'🎯', step:'02B', name:'Agente de Prospección',  sub:'Inteligencia de contacto · HubSpot',   desc:'Detecta contactos en LinkedIn con señales de búsqueda activa. Cruza vs HubSpot, filtra tomadores de decisión y genera listas priorizadas para SDRs y Comerciales.',   color:'#ff7a59', fase:'Fase Beta' },
]
const ACTIVATION_NODES = [
  { id:'inbound',     icon:'🎨', step:'03A', name:'Inbound Studio',          sub:'Agente Multimarca · Arranca desde Paso 1', desc:'Contenido para el ICP de las industrias identificadas. Genera brand awareness orgánico antes del pico. Opera con mayor anticipación por el tiempo de calentamiento orgánico.', color:'#10b981', fase:'Fase Beta', note:'* Inicia desde Paso 1', platforms: null },
  { id:'performance', icon:'📊', step:'03B', name:'Performance & Conversión', sub:'Pauta en el momento exacto',              desc:'Pauta para las industrias identificadas en el momento exacto. Escala rápido cuando la ventana de demanda se abre. META, LinkedIn Ads, Google Ads y GA4.',                      color:'#1877F2', fase:'Fase Beta', note: null,
    platforms:[{label:'f',bg:'#1877F2'},{label:'ig',bg:'#E1306C'},{label:'in',bg:'#0A66C2'},{label:'G',bg:'#4285F4'},{label:'GA',bg:'#E8710A'}] },
]

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;overflow:hidden;}
  @keyframes blob1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(18px,-14px) scale(1.04)}66%{transform:translate(-10px,16px) scale(.97)}}
  @keyframes blob2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-18px,22px) scale(1.05)}66%{transform:translate(-28px,8px) scale(1.1)}}
  @keyframes flow{0%{stroke-dashoffset:200}100%{stroke-dashoffset:0}}
  @keyframes flowrev{0%{stroke-dashoffset:-200}100%{stroke-dashoffset:0}}
  @keyframes pulse{0%,100%{opacity:.55}50%{opacity:1}}
  @keyframes bubble0{0%,100%{transform:translate(0,0)}25%{transform:translate(14px,22px)}50%{transform:translate(26px,8px)}75%{transform:translate(10px,28px)}}
  @keyframes bubble1{0%,100%{transform:translate(0,0)}33%{transform:translate(-18px,22px)}66%{transform:translate(-28px,8px)}}
  @keyframes bubble2{0%,100%{transform:translate(0,0)}30%{transform:translate(-20px,-16px)}60%{transform:translate(-32px,-4px)}90%{transform:translate(-10px,-24px)}}
  @keyframes bubble3{0%,100%{transform:translate(0,0)}25%{transform:translate(18px,-18px)}50%{transform:translate(28px,-6px)}75%{transform:translate(10px,-26px)}}
  @keyframes bubble4{0%,100%{transform:translate(0,0)}33%{transform:translate(-14px,-20px)}66%{transform:translate(-26px,-6px)}}
  @keyframes bubble5{0%,100%{transform:translate(0,0)}20%{transform:translate(20px,12px)}50%{transform:translate(10px,26px)}80%{transform:translate(28px,4px)}}
  @keyframes bubble6{0%,100%{transform:translate(0,0)}35%{transform:translate(-18px,16px)}70%{transform:translate(-30px,4px)}}
  @keyframes bubble7{0%,100%{transform:translate(0,0)}40%{transform:translate(14px,20px)}80%{transform:translate(-8px,16px)}}
  .flow-line{stroke-dasharray:8 5;animation:flow 2.2s linear infinite;}
  .flow-rev{stroke-dasharray:8 5;animation:flowrev 2.2s linear infinite;}
  .pulse{animation:pulse 2.5s ease-in-out infinite;}
  .mod-item{transition:background .15s;}
  .mod-item:hover{background:rgba(255,255,255,0.07) !important;}
`



function LoginPageInner() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const revocado = searchParams.get('revocado') === '1';
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 700)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const getSize = () => ({ W: isMobile ? window.innerWidth : window.innerWidth * 0.58, H: window.innerHeight })
    let { W, H } = getSize()
    canvas.width = W; canvas.height = H
    const onResize = () => { const s = getSize(); W = canvas.width = s.W; H = canvas.height = s.H }
    window.addEventListener('resize', onResize)
    const dots = Array.from({ length: 42 }, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.3+0.3,
      dx: (Math.random()-0.5)*0.18, dy: (Math.random()-0.5)*0.18,
      a: Math.random()*0.22+0.05,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0,0,W,H)
      dots.forEach(d => {
        d.x+=d.dx; d.y+=d.dy
        if(d.x<0||d.x>W) d.dx*=-1; if(d.y<0||d.y>H) d.dy*=-1
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(124,58,237,${d.a})`; ctx.fill()
      })
      dots.forEach((a,i)=>{ for(let j=i+1;j<dots.length;j++){
        const b=dots[j]; const dist=Math.hypot(a.x-b.x,a.y-b.y)
        if(dist<80){ ctx.beginPath(); ctx.strokeStyle=`rgba(79,70,229,${0.08*(1-dist/80)})`; ctx.lineWidth=0.4; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke() }
      }})
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',onResize) }
  }, [isMobile])

  async function handleLogin() {
    if (loading || !pass || !email) return;
    setLoading(true);
    setErrMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setErr(true);
      setErrMsg('Correo o contraseña incorrectos');
      setTimeout(() => setErr(false), 1500);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  const BgLayers = (
    <>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,zIndex:0,pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(220,38,38,0.12) 0%,transparent 68%)',top:-130,left:-110,filter:'blur(72px)',animation:'blob1 10s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:380,height:380,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 68%)',bottom:-80,right:-60,filter:'blur(65px)',animation:'blob2 13s ease-in-out infinite reverse',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:isMobile?'48vh':'100%',overflow:'hidden',pointerEvents:'none'}}>
        {BUBBLES.map((b,i)=>(
          <div key={i} style={{position:'absolute',left:`${isMobile?b.xM:b.xD}%`,top:`${isMobile?b.yM:b.yD}%`,width:isMobile?72:112,height:isMobile?34:54,borderRadius:isMobile?10:14,overflow:'hidden',pointerEvents:'none',zIndex:1,animation:`bubble${i} ${b.dur}s ease-in-out infinite`,border:`1.5px solid ${b.color}66`,boxShadow:`0 0 18px ${b.color}55, 0 0 40px ${b.color}22`,background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center',padding:'6px 10px'}}>
            <img src={b.src} alt="" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',mixBlendMode:'screen',opacity:0.92}}/>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <>
      <style>{CSS}</style>
      <div style={{position:'fixed',inset:0,background:'#07080f',display:'flex',alignItems:isMobile?'center':'stretch',justifyContent:isMobile?'center':undefined,fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>

        {!isMobile && (
          <div style={{position:'relative',flex:'0 0 58%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {BgLayers}
            <div style={{position:'relative',zIndex:2,textAlign:'center',maxWidth:420,padding:'0 40px'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,marginBottom:20,background:'rgba(124,58,237,.1)',border:'1px solid rgba(124,58,237,.25)',borderRadius:20,padding:'4px 14px'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#7c3aed',boxShadow:'0 0 6px #7c3aed'}} className="pulse"/>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:'.2em',color:'rgba(255,255,255,.5)',textTransform:'uppercase'}}>Marketing Corp · RevOps</span>
              </div>
              <div style={{marginBottom:20}}>
                <img src="/mkt-blanco.png" alt="MC" style={{height:52,width:'auto',display:'block',margin:'0 auto',filter:'drop-shadow(0 0 24px rgba(220,38,38,0.4))'}}/>
              </div>
              <h1 style={{fontSize:72,fontWeight:900,letterSpacing:'-3px',lineHeight:1,marginBottom:10,background:'linear-gradient(135deg,#ffffff 0%,#c4b5fd 50%,#fca5a5 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>ORBIT</h1>
              <p style={{color:'rgba(148,163,184,.85)',fontSize:13,letterSpacing:5,textTransform:'uppercase',fontWeight:600,marginBottom:6}}>Marketing Hub</p>
              <p style={{color:'rgba(100,116,139,.7)',fontSize:13,lineHeight:1.6}}>El sistema que impulsa cada decisión de marketing</p>
            </div>
          </div>
        )}

        <div style={{flex:isMobile?'none':'0 0 42%',width:isMobile?'100%':undefined,position:'relative',background:isMobile?'transparent':'rgba(255,255,255,0.02)',borderLeft:isMobile?'none':'1px solid rgba(255,255,255,.06)',display:'flex',alignItems:'center',justifyContent:'center',padding:isMobile?'0 24px':'40px 24px'}}>
          {isMobile && BgLayers}
          <div style={{width:'100%',maxWidth:340,position:'relative',zIndex:2}}>
            {isMobile && (
              <div style={{textAlign:'center',marginBottom:32}}>
                <img src="/mkt-blanco.png" alt="MC" style={{height:40,width:'auto',display:'block',margin:'0 auto 12px',filter:'drop-shadow(0 0 16px rgba(220,38,38,0.4))'}}/>
                <h1 style={{fontSize:48,fontWeight:900,letterSpacing:'-2px',lineHeight:1,background:'linear-gradient(135deg,#fff 0%,#c4b5fd 50%,#fca5a5 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>ORBIT</h1>
              </div>
            )}
            <div style={{background:'rgba(255,255,255,.03)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',border:`1px solid ${err?'rgba(239,68,68,.5)':'rgba(255,255,255,.1)'}`,borderRadius:24,padding:'32px 28px',boxShadow:'0 32px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.07)',transition:'border-color .3s'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
                <img src="/mkt-blanco.png" alt="MC" style={{height:20,width:'auto'}}/>
                <span style={{fontSize:15,fontWeight:700,color:'#f1f5f9'}}>ORBIT <span style={{color:'rgba(255,255,255,.3)',fontWeight:400}}>Hub</span></span>
              </div>
              <h2 style={{fontSize:22,fontWeight:800,color:'#f1f5f9',marginBottom:28}}>Iniciar sesión</h2>

              {revocado && (
                <div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'12px 14px',marginBottom:20}}>
                  <p style={{fontSize:12,fontWeight:700,color:'#F87171',marginBottom:2}}>Acceso revocado</p>
                  <p style={{fontSize:11,color:'rgba(248,113,113,.7)',lineHeight:1.4}}>Contacta a tu administrador.</p>
                </div>
              )}

              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:8}}>Correo</label>
              <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr(false)}} placeholder="tu@correo.com"
                style={{width:'100%',padding:'13px 16px',borderRadius:14,fontSize:14,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#f1f5f9',outline:'none',marginBottom:16,fontFamily:'inherit'}}/>

              <label style={{display:'block',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:8}}>Contraseña</label>
              <input ref={inputRef} type="password" placeholder="••••••••" value={pass}
                onChange={e=>{setPass(e.target.value);setErr(false)}} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                style={{width:'100%',padding:'13px 16px',borderRadius:14,fontSize:14,background:'rgba(255,255,255,.06)',border:`1px solid ${err?'rgba(239,68,68,.5)':'rgba(255,255,255,.12)'}`,color:'#f1f5f9',outline:'none',marginBottom:err?10:16,fontFamily:'inherit',transition:'border-color .2s'}}/>
              {err && <p style={{color:'#f87171',fontSize:12,marginBottom:12,fontWeight:500}}>{errMsg}</p>}

              <button onClick={handleLogin} disabled={loading}
                style={{width:'100%',padding:'14px',borderRadius:14,border:'none',background:loading?'rgba(124,58,237,.3)':'linear-gradient(135deg,#dc2626 0%,#7c3aed 60%,#4f46e5 100%)',color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',boxShadow:loading?'none':'0 8px 32px rgba(124,58,237,.4),inset 0 1px 0 rgba(255,255,255,.15)',fontFamily:'inherit',letterSpacing:.3}}>
                {loading ? 'Verificando…' : 'Ingresar →'}
              </button>
            </div>
            <p style={{textAlign:'center',marginTop:20,fontSize:10,color:'rgba(255,255,255,.35)'}}>© 2026 Grupo UPAX · Marketing Corp</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
