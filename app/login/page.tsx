'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const UDNS = [
  { id: 'UIX',  label: 'UIX' },
  { id: 'MU',   label: 'Marketing United' },
  { id: 'PE',   label: 'Promo Espacio' },
  { id: 'ZU',   label: 'Zeus' },
  { id: 'NC',   label: 'Neracode' },
  { id: 'HOF',  label: 'House Of Films' },
  { id: 'RL',   label: 'Research Land' },
  { id: 'MEXA', label: 'Mexa Creativa' },
  { id: 'CF',   label: 'Dirección General' },
];

const ROLES = [
  { id: 'admin',     label: 'Administrador' },
  { id: 'director',  label: 'Director de UDN' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'sdr',       label: 'SDR' },
];

const BUBBLES = [
  { src: '/logo-uix.png',  color: '#8C59FE', xD: 18, yD: 8,  xM: 2,  yM: 6,  dur: 18 },
  { src: '/logo-rl.png',   color: '#770EB7', xD: 58, yD: 6,  xM: 60, yM: 5,  dur: 22 },
  { src: '/logo-nc.png',   color: '#3E31CC', xD: 6,  yD: 28, xM: 1,  yM: 28, dur: 21 },
  { src: '/logo-zeus.png', color: '#61ACAA', xD: 74, yD: 22, xM: 68, yM: 22, dur: 20 },
  { src: '/logo-pe.png',   color: '#FF7600', xD: 8,  yD: 58, xM: 2,  yM: 52, dur: 18 },
  { src: '/logo-mexa.png', color: '#FD00C7', xD: 76, yD: 52, xM: 66, yM: 48, dur: 22 },
  { src: '/logo-mu.png',   color: '#DCFF00', xD: 18, yD: 76, xM: 8,  yM: 70, dur: 19 },
  { src: '/logo-hof.png',  color: '#888888', xD: 58, yD: 80, xM: 54, yM: 68, dur: 24 },
];

function LoginPageInner() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const revocado = searchParams.get('revocado') === '1';
  const [email,  setEmail]  = useState('');
  const [pw,     setPw]     = useState('');
  const [rol,    setRol]    = useState('');
  const [udn,    setUdn]    = useState('');
  const [error, setError]     = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [shake, setShake]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getSize = () => ({
      W: isMobile ? window.innerWidth : window.innerWidth * 0.58,
      H: window.innerHeight,
    });

    let { W, H } = getSize();
    canvas.width = W;
    canvas.height = H;

    const onResize = () => {
      const s = getSize();
      W = canvas.width  = s.W;
      H = canvas.height = s.H;
    };
    window.addEventListener('resize', onResize);

    const dots = Array.from({ length: 42 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.3 + 0.3,
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.22 + 0.05,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.dx; d.y += d.dy;
        if (d.x < 0 || d.x > W) d.dx *= -1;
        if (d.y < 0 || d.y > H) d.dy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,0,141,${d.a})`;
        ctx.fill();
      });
      dots.forEach((a, i) => {
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(140,89,254,${0.08 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [isMobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !pw || !email) return;
    setLoading(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (authError) {
        setError('Correo o contraseña incorrectos');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPw('');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    html,body{height:100%;overflow:hidden;}

    @keyframes orbA{
      0%,100%{transform:translate(0,0) scale(1);}
      33%{transform:translate(18px,-14px) scale(1.04);}
      66%{transform:translate(-10px,16px) scale(.97);}
    }
    @keyframes compassPulse{
      0%,100%{filter:drop-shadow(0 0 28px rgba(232,0,141,.75)) drop-shadow(0 0 8px rgba(140,89,254,.5));}
      50%{filter:drop-shadow(0 0 50px rgba(232,0,141,1)) drop-shadow(0 0 20px rgba(140,89,254,.8));}
    }
    @keyframes shakeCard{
      0%,100%{transform:translateX(0);}
      20%{transform:translateX(-6px);}
      40%{transform:translateX(6px);}
      60%{transform:translateX(-4px);}
      80%{transform:translateX(4px);}
    }
    @keyframes spin{to{transform:rotate(360deg);}}

    @keyframes bubble0{0%,100%{transform:translate(0,0);}25%{transform:translate(14px,22px);}50%{transform:translate(26px,8px);}75%{transform:translate(10px,28px);}}
    @keyframes bubble1{0%,100%{transform:translate(0,0);}33%{transform:translate(-18px,22px);}66%{transform:translate(-28px,8px);}}
    @keyframes bubble2{0%,100%{transform:translate(0,0);}30%{transform:translate(-20px,-16px);}60%{transform:translate(-32px,-4px);}90%{transform:translate(-10px,-24px);}}
    @keyframes bubble3{0%,100%{transform:translate(0,0);}25%{transform:translate(18px,-18px);}50%{transform:translate(28px,-6px);}75%{transform:translate(10px,-26px);}}
    @keyframes bubble4{0%,100%{transform:translate(0,0);}33%{transform:translate(-14px,-20px);}66%{transform:translate(-26px,-6px);}}
    @keyframes bubble5{0%,100%{transform:translate(0,0);}20%{transform:translate(20px,12px);}50%{transform:translate(10px,26px);}80%{transform:translate(28px,4px);}}
    @keyframes bubble6{0%,100%{transform:translate(0,0);}35%{transform:translate(-18px,16px);}70%{transform:translate(-30px,4px);}}
    @keyframes bubble7{0%,100%{transform:translate(0,0);}40%{transform:translate(14px,20px);}80%{transform:translate(-8px,16px);}}
    @media (max-width:768px){
      @keyframes bubble0{0%,100%{transform:translate(0,0);}50%{transform:translate(8px,-14px);}}
      @keyframes bubble1{0%,100%{transform:translate(0,0);}50%{transform:translate(-12px,-10px);}}
      @keyframes bubble2{0%,100%{transform:translate(0,0);}50%{transform:translate(-14px,-8px);}}
      @keyframes bubble3{0%,100%{transform:translate(0,0);}50%{transform:translate(10px,-12px);}}
      @keyframes bubble4{0%,100%{transform:translate(0,0);}50%{transform:translate(-10px,-12px);}}
      @keyframes bubble5{0%,100%{transform:translate(0,0);}50%{transform:translate(12px,-10px);}}
      @keyframes bubble6{0%,100%{transform:translate(0,0);}50%{transform:translate(-12px,-8px);}}
      @keyframes bubble7{0%,100%{transform:translate(0,0);}50%{transform:translate(8px,-14px);}}
    }
  `;

  const BrandContent = (
    <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:420 }}>
      <div style={{
        display:'inline-flex', alignItems:'center', gap:6,
        marginBottom: isMobile ? 16 : 20,
        background:'rgba(232,0,141,.07)',
        border:'1px solid rgba(232,0,141,.2)',
        borderRadius:20, padding:'4px 14px',
      }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#E8008D', boxShadow:'0 0 6px #E8008D' }}/>
        <span style={{ fontSize:isMobile ? 9 : 10, fontWeight:700, letterSpacing:'.2em', color:'rgba(255,255,255,.5)', textTransform:'uppercase' }}>
          Grupo UPAX · RevOps
        </span>
      </div>

      <div style={{ marginBottom: isMobile ? 12 : 20, animation:'compassPulse 4s ease-in-out infinite' }}>
        <img src="/mkt-blanco.png" alt="Marketing Corp" style={{ height: isMobile ? 44 : 60, width:'auto', display:'block', margin:'0 auto', filter:'drop-shadow(0 0 24px rgba(232,0,141,0.4))' }}/>
      </div>

      <h1 style={{
        fontSize: isMobile ? 34 : 46,
        fontWeight:800, letterSpacing:'-.03em',
        lineHeight:1.1, color:'#fff',
        marginBottom:6,
        fontFamily:"'Inter',-apple-system,sans-serif",
      }}>
ORBIT{' '}
        <span style={{
          background:'linear-gradient(135deg,#E8008D 0%,#FF4EC1 45%,#8C59FE 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>Hub</span>
      </h1>

      <div style={{
        width: isMobile ? 160 : 200, height:1,
        margin: isMobile ? '14px auto 16px' : '18px auto 22px',
        background:'linear-gradient(90deg,transparent,rgba(232,0,141,.4),rgba(140,89,254,.4),transparent)',
      }}/>

      <p style={{ fontSize: isMobile ? 13 : 16, fontWeight:700, color:'rgba(255,255,255,.82)', lineHeight:1.4, marginBottom:10 }}>
        El sistema que impulsa
      </p>
      <p style={{
        fontSize: isMobile ? 12 : 14, fontWeight:600,
        background:'linear-gradient(135deg,#E8008D,#FF4EC1,#8C59FE)',
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
      }}>
        cada decisión de marketing
      </p>
    </div>
  );

  const BgLayers = (
    <>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none' }}/>
      <div style={{
        position:'absolute', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(232,0,141,.18) 0%,transparent 68%)',
        top:-130, left:-110, filter:'blur(72px)',
        animation:'orbA 10s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', width:380, height:380, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(140,89,254,.15) 0%,transparent 68%)',
        bottom:-80, right:-60, filter:'blur(65px)',
        animation:'orbA 13s ease-in-out infinite reverse',
      }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height: isMobile ? '48vh' : '100%', overflow:'hidden', pointerEvents:'none' }}>
      {BUBBLES.map((b, i) => (
        <div key={i} style={{
          position:'absolute',
          left:`${isMobile ? b.xM : b.xD}%`,
          top:`${isMobile ? b.yM : b.yD}%`,
          width: isMobile ? 72 : 112, height: isMobile ? 34 : 54,
          borderRadius: isMobile ? 10 : 14, overflow:'hidden',
          pointerEvents:'none', zIndex:1,
          animation:`bubble${i} ${b.dur}s ease-in-out infinite`,
          border:`1.5px solid ${b.color}66`,
          boxShadow:`0 0 18px ${b.color}55, 0 0 40px ${b.color}22`,
          background:'rgba(255,255,255,.03)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'6px 10px',
        }}>
          <img src={b.src} alt="" style={{
            maxWidth:'100%', maxHeight:'100%',
            objectFit:'contain',
            mixBlendMode:'screen',
            opacity:0.92,
          }}/>
        </div>
      ))}
      </div>
    </>
  );

  const FormCard = (
    <div style={{ width:'100%', maxWidth:340 }}>
      <div style={{
        background: isMobile ? 'rgba(10,6,20,.82)' : 'rgba(255,255,255,.03)',
        backdropFilter: isMobile ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: isMobile ? 'blur(24px)' : 'none',
        border:'1px solid rgba(255,255,255,.1)',
        borderRadius:16, padding:'32px 28px',
        boxShadow:'0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04)',
        animation: shake ? 'shakeCard .5s ease' : 'none',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <img src="/mkt-blanco.png" alt="MC" style={{ height:20, width:'auto' }}/>
          <span style={{ fontSize:15, fontWeight:700, color:'#F1F5F9', fontFamily:"'Inter',-apple-system,sans-serif" }}>
            ORBIT{' '}
            <span style={{ color:'#E8008D' }}>Hub</span>
          </span>
        </div>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#F1F5F9', marginBottom:4, fontFamily:"'Inter',-apple-system,sans-serif" }}>
          Iniciar sesión
        </h2>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom: revocado ? 16 : 28 }}>
          ORBIT Hub · Marketing Corp
        </p>

        {revocado && (
          <div style={{
            background:'rgba(239,68,68,.12)',
            border:'1px solid rgba(239,68,68,.3)',
            borderRadius:10, padding:'12px 14px',
            marginBottom:20, display:'flex', alignItems:'flex-start', gap:10,
          }}>
            <span style={{ fontSize:16, lineHeight:1 }}>🔒</span>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:'#F87171', marginBottom:2 }}>
                Acceso revocado
              </p>
              <p style={{ fontSize:11, color:'rgba(248,113,113,.7)', lineHeight:1.4 }}>
                Tu acceso a la Brújula Comercial ha sido revocado. Contacta a tu administrador.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          <label style={{
            display:'block', fontSize:10, fontWeight:700,
            letterSpacing:'.1em', textTransform:'uppercase',
            color:'rgba(255,255,255,.4)', marginBottom:8,
            fontFamily:"'Inter',-apple-system,sans-serif",
          }}>Correo</label>
          <div style={{ marginBottom:16 }}>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@correo.com"
              required
              style={{
                width:'100%', padding:'13px 16px',
                background:'rgba(255,255,255,.06)',
                border:'1px solid rgba(255,255,255,.12)',
                borderRadius:10, color:'#F1F5F9',
                fontSize:15, fontFamily:"'Inter',-apple-system,sans-serif",
                outline:'none',
              }}
            />
          </div>
          <label style={{
            display:'block', fontSize:10, fontWeight:700,
            letterSpacing:'.1em', textTransform:'uppercase',
            color:'rgba(255,255,255,.4)', marginBottom:8,
            fontFamily:"'Inter',-apple-system,sans-serif",
          }}>Contraseña</label>

          <div style={{ position:'relative', marginBottom: error ? 8 : 20 }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              style={{
                width:'100%', padding:'13px 44px 13px 16px',
                background:'rgba(255,255,255,.06)',
                border:`1px solid ${error ? 'rgba(239,68,68,.5)' : 'rgba(255,255,255,.12)'}`,
                borderRadius:10, color:'#F1F5F9',
                fontSize:15, fontFamily:"'Inter',-apple-system,sans-serif",
                outline:'none', transition:'border .2s',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              aria-label="Mostrar contraseña"
              style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', padding:4,
                color:'rgba(255,255,255,.35)', display:'flex',
              }}
            >
              {showPw
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
            </button>
          </div>

          {error && (
            <p style={{ fontSize:12, color:'#F87171', marginBottom:16, fontWeight:500, fontFamily:"'Inter',-apple-system,sans-serif" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !pw}
            style={{
              width:'100%', padding:'13px',
              background: loading || !pw
                ? 'rgba(232,0,141,.3)'
                : 'linear-gradient(135deg,#E8008D 0%,#C4007A 40%,#8C59FE 100%)',
              border:'none', borderRadius:10,
              color:'#fff', fontSize:14, fontWeight:700,
              cursor: loading || !pw ? 'not-allowed' : 'pointer',
              fontFamily:"'Inter',-apple-system,sans-serif",
              boxShadow: loading || !pw ? 'none' : '0 4px 24px rgba(232,0,141,.4)',
              transition:'all .2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}
          >
            {loading
              ? <>
                  <span style={{
                    width:14, height:14, borderRadius:'50%',
                    border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff',
                    display:'inline-block', animation:'spin .6s linear infinite',
                  }}/>
                  Verificando…
                </>
              : 'Entrar'
            }
          </button>
        </form>
        {!forgotMode ? (
          <button onClick={() => { setForgotMode(true); setError(''); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:16, width:'100%', textAlign:'center', fontFamily:"'Inter',-apple-system,sans-serif", textDecoration:'underline' }}>
            ¿Olvidaste tu contraseña?
          </button>
        ) : (
          <div style={{ marginTop:20, padding:'20px', background:'rgba(255,255,255,0.04)', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:6, fontFamily:"'Inter',-apple-system,sans-serif" }}>Recuperar contraseña</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:16, fontFamily:"'Inter',-apple-system,sans-serif" }}>Te enviaremos un link a tu correo registrado</div>
            {forgotSent ? (
              <div style={{ padding:'10px 14px', borderRadius:8, background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', color:'#22C55E', fontSize:12, fontFamily:"'Inter',-apple-system,sans-serif" }}>
                ✅ Revisa tu correo para continuar
              </div>
            ) : (
              <>
                <input type="email" placeholder="tu@correo.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.06)', color:'#fff', fontSize:13, outline:'none', marginBottom:12, fontFamily:"'Inter',-apple-system,sans-serif", boxSizing:'border-box' as const }} />
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setForgotMode(false)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:12, cursor:'pointer', fontFamily:"'Inter',-apple-system,sans-serif" }}>
                    Cancelar
                  </button>
                  <button onClick={async () => {
                    if (!forgotEmail) return;
                    setForgotLoading(true);
                    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
                    await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: 'https://brujula-comercial-upax.vercel.app/reset-password' });
                    setForgotSent(true);
                    setForgotLoading(false);
                  }} disabled={forgotLoading || !forgotEmail}
                    style={{ flex:1, padding:'10px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#E8008D,#8C59FE)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',-apple-system,sans-serif", opacity: forgotLoading || !forgotEmail ? 0.6 : 1 }}>
                    {forgotLoading ? 'Enviando...' : 'Enviar link'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <p style={{
        textAlign:'center', marginTop:20, fontSize:10,
        color:'rgba(255,255,255,0.6)', fontFamily:"'Inter',-apple-system,sans-serif",
      }}>
        © 2026 Grupo UPAX · RevOps Intelligence
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <style>{css}</style>
        <div style={{
          position:'fixed', inset:0, zIndex:999,
          background:'linear-gradient(150deg,#090612 0%,#0F0420 50%,#120818 100%)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'space-between',
          fontFamily:"'Inter',-apple-system,sans-serif",
          overflowY:'auto', padding:'0 20px 32px',
        }}>
          {BgLayers}
          <div style={{ position:'relative', zIndex:2, textAlign:'center', paddingTop:56, paddingBottom:16 }}>
            {BrandContent}
          </div>
          <div style={{ position:'relative', zIndex:2, width:'100%', display:'flex', justifyContent:'center' }}>
            {FormCard}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{
        position:'fixed', inset:0, zIndex:999,
        background:'#07070C', display:'flex', alignItems:'stretch',
        fontFamily:"'Inter',-apple-system,sans-serif",
      }}>
        <div style={{
          position:'relative', flex:'0 0 58%', overflow:'hidden',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          background:'linear-gradient(150deg,#090612 0%,#0F0420 50%,#120818 100%)',
          padding:'60px 48px',
        }}>
          {BgLayers}
          <div style={{
            position:'absolute', right:0, top:'5%', bottom:'5%', width:1,
            background:'linear-gradient(180deg,transparent,rgba(232,0,141,.22) 30%,rgba(140,89,254,.22) 70%,transparent)',
          }}/>
          {BrandContent}
        </div>

        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          background:'#0A0A0E', padding:'48px 32px',
        }}>
          {FormCard}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
