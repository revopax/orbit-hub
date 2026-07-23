import type { UDN } from '../lib/types';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserMenu } from './UserMenu';
import { ChangelogBell } from './ChangelogBell';
import { getSupabase } from '../lib/supabase';
const sbTop = getSupabase();

interface TopbarProps {
  vista: 'director' | 'operativa' | 'analista';
  onVista: (v: 'director' | 'operativa' | 'analista') => void;
  rol?: string;
  udnActiva: UDN;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout?: () => void;
  perfil?: { nombre: string; rol: string; udn?: string | null; vistas?: string | null } | null;
  meta?: { ultima_actualizacion_igae?: string; fecha_actualizacion_inegi?: string; proxima_actualizacion_inegi?: string };
}

const UPAX_MAGENTA = '#E8008D';

export function Topbar({ vista, onVista, udnActiva, isDark, onToggleTheme, rol, onLogout, perfil, meta }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMPw, setShowMPw] = useState(false);
  const [mpw1, setMpw1] = useState('');
  const [mpw2, setMpw2] = useState('');
  const [ms1, setMs1] = useState(false);
  const [ms2, setMs2] = useState(false);
  const [mpwErr, setMpwErr] = useState('');
  const [mpwOk, setMpwOk] = useState(false);
  const [msaving, setMsaving] = useState(false);
  const router = useRouter();
  const vistasPermitidas = perfil?.vistas
    ? perfil.vistas.split(',').map(s => s.trim()).filter(Boolean)
    : null;
  const puedeVer = (v: 'director' | 'operativa' | 'analista') => {
    if (vistasPermitidas) return vistasPermitidas.includes(v);
    // Fallback: comportamiento original por rol si no hay 'vistas' configuradas
    if (v === 'analista') return rol === 'admin';
    if (v === 'director') return !['sdr', 'comercial'].includes(rol ?? '');
    return true; // operativa siempre visible por defecto
  };
  const [mobilePhotoUrl, setMobilePhotoUrl] = useState<string | null>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sbTop.auth.getUser().then(({ data: { user } }) => {
      if (user) sbTop.from('perfiles').select('photo_url').eq('id', user.id).single()
        .then(({ data }) => { if (data?.photo_url) setMobilePhotoUrl(data.photo_url); });
    });
  }, []);

  async function uploadFotoMobile(file: File) {
    const { data: { user } } = await sbTop.auth.getUser();
    if (!user) { console.error('[avatar-m] sin sesión'); return; }
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = user.id + '/avatar.' + ext;
    const { error: upErr } = await sbTop.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { console.error('[avatar-m] upload error:', upErr.message, upErr); return; }
    const { data: { publicUrl } } = sbTop.storage.from('avatars').getPublicUrl(path);
    const { error: dbErr } = await sbTop.from('perfiles').update({ photo_url: publicUrl }).eq('id', user.id);
    if (dbErr) { console.error('[avatar-m] db error:', dbErr.message); return; }
    setMobilePhotoUrl(publicUrl);
    console.log('[avatar-m] ✅ foto guardada:', publicUrl);
  }
  async function cambiarPwMobile() {
    setMpwErr('');
    if (!mpw1 || !mpw2) { setMpwErr('Completa ambos campos'); return; }
    if (mpw1 !== mpw2) { setMpwErr('Las contraseñas no coinciden'); return; }
    if (mpw1.length < 8) { setMpwErr('Mínimo 8 caracteres'); return; }
    setMsaving(true);
    const { error } = await sbTop.auth.updateUser({ password: mpw1 });
    if (error) { setMpwErr(error.message); setMsaving(false); return; }
    const { data: { user } } = await sbTop.auth.getUser();
    if (user) await sbTop.from('perfiles').update({ password_changed: true }).eq('id', user.id);
    setMpwOk(true); setMsaving(false);
    setTimeout(() => { setShowMPw(false); setMpw1(''); setMpw2(''); setMpwOk(false); }, 2000);
  }

  const mPwModal = showMPw && (
    <div style={{ position:'fixed', inset:0, zIndex:10001, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 16px' }}>
      <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:380, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4, color:'var(--txt-1)' }}>Cambiar contraseña</div>
        <div style={{ fontSize:12, color:'var(--txt-5)', marginBottom:20 }}>Mínimo 8 caracteres</div>
        {mpwErr && <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#F87171', fontSize:12, marginBottom:14 }}>{mpwErr}</div>}
        {mpwOk && <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', color:'#22C55E', fontSize:12, marginBottom:14 }}>✅ Contraseña actualizada</div>}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--txt-4)', display:'block', marginBottom:6 }}>Nueva contraseña</label>
          <div style={{ position:'relative' }}>
            <input type={ms1?'text':'password'} value={mpw1} onChange={e=>setMpw1(e.target.value)} placeholder="Mínimo 8 caracteres" style={{ width:'100%', padding:'9px 36px 9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--txt-1)', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            <button type="button" onClick={()=>setMs1(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--txt-4)', padding:0, display:'flex' }}>
              {ms1?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--txt-4)', display:'block', marginBottom:6 }}>Confirmar contraseña</label>
          <div style={{ position:'relative' }}>
            <input type={ms2?'text':'password'} value={mpw2} onChange={e=>setMpw2(e.target.value)} placeholder="Mínimo 8 caracteres" style={{ width:'100%', padding:'9px 36px 9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--txt-1)', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            <button type="button" onClick={()=>setMs2(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--txt-4)', padding:0, display:'flex' }}>
              {ms2?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={()=>{ setShowMPw(false); setMpwErr(''); setMpw1(''); setMpw2(''); }} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--txt-3)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
          <button onClick={cambiarPwMobile} disabled={msaving} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#E8008D,#8C59FE)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:msaving?0.7:1 }}>{msaving?'Guardando...':'Guardar'}</button>
        </div>
      </div>
    </div>
  );

  const tabStyle = (v: 'director' | 'operativa' | 'analista'): React.CSSProperties => {
    const isActive = vista === v;
    return {
      padding: '6px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
      backgroundColor: isActive ? (() => { const h=udnActiva.color.replace('#',''); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return (r*299+g*587+b*114)/1000 < 30 && udnActiva.secundario ? udnActiva.secundario : udnActiva.color; })() : 'transparent',
      color: isActive ? (() => { const h=udnActiva.color.replace('#',''); const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return (r*299+g*587+b*114)/1000 > 128 ? '#000000' : '#FFFFFF'; })() : 'var(--txt-4)',
      boxShadow: isActive ? `0 2px 12px ${udnActiva.color}55` : 'none',
    };
  };

  const mobileTabStyle = (v: 'director' | 'operativa' | 'analista'): React.CSSProperties => {
    const isActive = vista === v;
    return {
      backgroundColor: isActive ? udnActiva.color : 'transparent',
      color: isActive ? udnActiva.texto : 'var(--txt-4)',
      boxShadow: isActive
        ? `0 4px 12px rgba(0,0,0,0.18), 0 0 14px ${udnActiva.color}45`
        : 'none',
    };
  };

  const toggleBtn = (
    <button
      onClick={onToggleTheme}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label="Toggle tema"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
    >
      <svg width="52" height="28" viewBox="0 0 52 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="50" height="26" rx="13" fill={isDark ? '#1a1a2e' : '#f0f0f0'} stroke={isDark ? 'rgba(140,89,254,.5)' : 'rgba(0,0,0,.15)'} strokeWidth="1.5" />
        <circle cx={isDark ? 39 : 13} cy="14" r="10" fill={isDark ? 'url(#tg-dark)' : 'url(#tg-light)'} style={{ transition: 'cx 0.25s ease' }} />
        <defs>
          <linearGradient id="tg-dark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8008D"/><stop offset="100%" stopColor="#8C59FE"/>
          </linearGradient>
          <linearGradient id="tg-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB800"/><stop offset="100%" stopColor="#FF7600"/>
          </linearGradient>
        </defs>
        {isDark ? (
          <path d="M43 10 a5 5 0 1 0 0 8 a3.5 3.5 0 1 1 0-8z" fill="white" opacity="0.9" />
        ) : (
          <g transform="translate(13,14)">
            <circle r="3.2" fill="white" opacity="0.9"/>
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <line key={i} x1={Math.cos(deg*Math.PI/180)*4.8} y1={Math.sin(deg*Math.PI/180)*4.8} x2={Math.cos(deg*Math.PI/180)*6.5} y2={Math.sin(deg*Math.PI/180)*6.5} stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
            ))}
          </g>
        )}
      </svg>
    </button>
  );


  const MESES_ES: Record<string, string> = {
    '01':'enero','02':'febrero','03':'marzo','04':'abril','05':'mayo','06':'junio',
    '07':'julio','08':'agosto','09':'septiembre','10':'octubre','11':'noviembre','12':'diciembre'
  };
  const igaePeriodo = (() => {
    const raw = meta?.ultima_actualizacion_igae ?? '';
    const [anio, mes] = raw.split('-');
    return mes && anio ? `${MESES_ES[mes] ?? mes} de ${anio}` : 'ene 2026';
  })();
  const igaeActualizacion = meta?.fecha_actualizacion_inegi ?? '22 de mayo de 2026';
  const igaeProxima = meta?.proxima_actualizacion_inegi ?? '23 de junio de 2026';

  const badgeIGAE = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22C55E', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--txt-4)', padding: '4px 10px', borderRadius: 7, border: `1px solid ${UPAX_MAGENTA}55`, backgroundColor: `${UPAX_MAGENTA}10`, boxShadow: `0 0 12px ${UPAX_MAGENTA}30`, whiteSpace: 'nowrap' }}>
          Última actualización: <span style={{ color: 'var(--txt-1)', fontWeight: 700 }}>{igaeActualizacion}</span>
        </span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--txt-5)', whiteSpace: 'nowrap' }}>
        Próx. actualización: <span style={{ color: 'var(--txt-4)', fontWeight: 600 }}>{igaeProxima}</span>
      </div>
    </div>
  );

  return (
    <header className="topbar">
      <div className="topbar-inner">

        {/* ── Fila 1: hamburguesa + logo (+ desktop: tabs toggle badge avatar) ── */}
        <div className="topbar-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
          <div className="topbar-hamburger" style={{ display: 'none' }}>
            <UserMenu nombre={perfil?.nombre} rol={perfil?.rol} udn={perfil?.udn} acento={udnActiva.color} onLogout={onLogout} isMobile={true} />
          </div>
          {/* Hamburguesa desktop — todos los roles */}
          <>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="topbar-hamburger-desktop"
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap:5, padding:'4px 8px', flexShrink:0, marginRight:4 }}
            >
              <span style={{ width:20, height:2, background:'var(--txt-1)', borderRadius:2, display:'block' }}/>
              <span style={{ width:20, height:2, background:'var(--txt-1)', borderRadius:2, display:'block' }}/>
              <span style={{ width:20, height:2, background:'var(--txt-1)', borderRadius:2, display:'block' }}/>
            </button>
            {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.4)' }}/>}
            <div style={{ position:'fixed', top:0, left:0, bottom:0, width:260, background:'var(--header-bg)', borderRight:'1px solid var(--border)', zIndex:9999, transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display:'flex', flexDirection:'column', boxShadow: menuOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none' }}>
              <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)', background:`linear-gradient(160deg, ${udnActiva.color}15 0%, transparent 100%)` }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--txt-5)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:4 }}>Brújula Comercial</div>
                <div style={{ fontSize:13, color:'var(--txt-4)' }}>{perfil?.nombre}</div>
              </div>
              <nav style={{ flex:1, padding:'12px 8px' }}>
                {rol === 'admin' && (
                  <>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-5)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 12px 8px' }}>Plataforma</div>
                    <button onClick={() => { setMenuOpen(false); router.push('/'); }} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, color:'var(--txt-2)', fontSize:13, fontWeight:500, textAlign:'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                      Dashboard
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/iam'); }} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, color:'var(--txt-2)', fontSize:13, fontWeight:500, textAlign:'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                      IAM · Gestión de usuarios
                    </button>
                    <div style={{ fontSize:10, fontWeight:600, color:'var(--txt-5)', letterSpacing:'0.1em', textTransform:'uppercase', padding:'12px 12px 8px', marginTop:4, borderTop:'1px solid var(--border-subtle)' }}>Módulos</div>
                    <button onClick={() => window.open('https://marketing-agent-two-pi.vercel.app', '_blank')} style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, color:'var(--txt-2)', fontSize:13, fontWeight:500, textAlign:'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      Marketing Agent
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft:'auto', opacity:0.4 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>
                    <button
                      onClick={() => window.open('https://redes-sociales-upax.vercel.app', '_blank')}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8,
                        background:'transparent', border:'none', cursor:'pointer', width:'100%',
                        color:'var(--txt-2)', fontSize:13, transition:'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background='var(--hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                        <circle cx="10" cy="10" r="3" fill="#0866FF"/>
                        <circle cx="22" cy="10" r="3" fill="#E1306C"/>
                        <circle cx="10" cy="22" r="3" fill="#4285F4"/>
                        <circle cx="22" cy="22" r="3" fill="#0A66C2"/>
                        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                        <line x1="10" y1="10" x2="10" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                        <line x1="22" y1="10" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                        <line x1="10" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5"/>
                        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
                      </svg>
                      Redes Sociales
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft:'auto', opacity:0.4 }}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </button>
                  </>
                )}
              </nav>
              <div style={{ borderTop:'1px solid var(--border)', marginTop:'auto' }}>
                <button onClick={() => { setMenuOpen(false); setShowMPw(true); }} style={{ width:'100%', padding:'12px 20px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, color:'var(--txt-2)', fontSize:13, fontWeight:500, textAlign:'left' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.06)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='none')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  Cambiar contraseña
                </button>
                <button onClick={() => { setMenuOpen(false); onLogout?.(); }} style={{ width:'100%', padding:'12px 20px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, color:'#F87171', fontSize:13, fontWeight:600, textAlign:'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  Cerrar sesión
                </button>
                <div style={{ padding:'8px 20px 12px', fontSize:11, color:'var(--txt-5)' }}>
                  {perfil?.nombre} · {rol === 'admin' ? 'Admin' : rol === 'director' ? 'Director' : rol === 'sdr' ? 'SDR' : 'Comercial'}
                </div>
              </div>
            </div>
          </>
          <div className="topbar-logo">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${UPAX_MAGENTA} 0%, ${udnActiva.color} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 0 16px ${UPAX_MAGENTA}50`, transition: 'box-shadow 0.3s' }}>
              <img src="/images/compass_1f9ed.png" style={{width:"1em",height:"1em",verticalAlign:"middle",display:"inline-block"}} alt="brujula" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt-1)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Brújula <span style={{ color: UPAX_MAGENTA }}>Comercial</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span className="topbar-subtitle" style={{ fontSize: 10, color: 'var(--txt-4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  UPAX Mkt Corp · RevOps
                </span>
                <span style={{ fontSize: 9, color: 'var(--txt-1)', letterSpacing: '0.06em', marginLeft: 4 }}>
                  · Diego Luna
                </span>
              </div>
            </div>
          </div>
          <div className="topbar-avatar-mobile" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
            <button
              onClick={() => mobileFileRef.current?.click()}
              style={{ width: 34, height: 34, borderRadius: '50%', background: mobilePhotoUrl ? 'transparent' : `linear-gradient(135deg, ${udnActiva.color} 0%, #8C59FE 100%)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: `0 2px 12px ${udnActiva.color}66`, overflow: 'hidden', padding: 0 }}
            >
              {mobilePhotoUrl
                ? <img src={mobilePhotoUrl} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : (perfil?.nombre ?? '??').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
              }
            </button>
            <input ref={mobileFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFotoMobile(f); }} />
          </div>
          {/* Centro: tabs + toggle */}
          <div className="topbar-desktop-center">
            <div className="topbar-tabs" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
              {(['director', 'operativa'] as const).filter(puedeVer).map((v) => (
                <button key={v} onClick={() => onVista(v)} style={tabStyle(v)}>
                  {v === 'director' ? 'Director' : 'Operativa'}
                </button>
              ))}
              {puedeVer('analista') && (
                <button onClick={() => onVista('analista')} style={tabStyle('analista')}>
                  Analista
                </button>
              )}
            </div>
            <div className="topbar-toggle-wrap" style={{ marginLeft: 8 }}>{toggleBtn}</div>
          </div>
          {/* Derecha: badge + avatar */}
          <div className="topbar-desktop-right">
            <div className="topbar-badge" style={{ marginRight: 12 }}>{badgeIGAE}</div>
            <div style={{ marginRight: 10 }}><ChangelogBell acento={udnActiva.color} /></div>
            <div className="topbar-avatar-desktop">
              <UserMenu nombre={perfil?.nombre} rol={perfil?.rol} udn={perfil?.udn} acento={udnActiva.color} onLogout={onLogout} isMobile={false} />
            </div>
          </div>
        </div>

        {/* ── Fila 2 mobile: toggle + badge ── */}
        <div className="topbar-meta-row">
          <div className="topbar-toggle-wrap">{toggleBtn}</div>
          {badgeIGAE}
          <ChangelogBell acento={udnActiva.color} />
        </div>

        {/* ── Fila 3: tabs Director/Operativa ── */}
        <div className="topbar-tabs-row">
          {puedeVer('director') && (
            <button className="topbar-tab-btn" onClick={() => onVista('director')} style={mobileTabStyle('director')}>Director</button>
          )}
          {puedeVer('operativa') && (
            <button className="topbar-tab-btn" onClick={() => onVista('operativa')} style={mobileTabStyle('operativa')}>Operativa</button>
          )}
          {puedeVer('analista') && (
            <button
              className="topbar-tab-btn" onClick={() => onVista('analista')} style={mobileTabStyle('analista')}>Analista
            </button>
          )}
        </div>

      </div>
      {mPwModal}
    </header>
  );
}
