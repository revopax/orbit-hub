'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

const sb = createClient(
  'https://szxdvdbdyuxtvyvxbder.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eGR2ZGJkeXV4dHZ5dnhiZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDAwODUsImV4cCI6MjA5MjgxNjA4NX0.uiplnYCA9lJy-o18r2x1-9bRTFjTZiBNJ-01QiCepTg'
);

const ROLES = ['admin','director','comercial','sdr'];
const ROL_LABEL: Record<string,string> = { admin:'Admin', director:'Director', comercial:'Comercial', sdr:'SDR', operativo:'Operativo' };
const UDNS_LIST = ['UIX','MU','PE','ZU','NC','HOF','RL','MEXA'];
const UDN_MADRE_LIST = ['UIX','MU','PE','ZU','NC','HOF','RL','MEXA','MKT'];
const NIVEL_LIST = [
  { val:'principal', label:'Principal' },
  { val:'gerente', label:'Gerente' },
  { val:'comercial', label:'Comercial' },
  { val:'sdr', label:'SDR' },
  { val:'analista', label:'Analista' },
];
const MAGENTA = '#E8008D';

interface Usuario {
  id: string; nombre: string; rol: string; udn: string|null; email?: string|null;
  activo: boolean; created_at: string; updated_at?: string;
  ultima_actividad?: string;
  total_visitas?: number;
  creado_por?: string; editado_por?: string;
  udn_madre?: string|null; reporta_a?: string|null; nivel_jerarquico?: string|null;
  vistas?: string|null;
}

export default function IAMPage() {
  const { perfil, loading } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario|null>(null);
  const [form, setForm] = useState({ email:'', password:'', nombre:'', rol:'director', udns:[] as string[], udn_madre:'', nivel_jerarquico:'', reporta_a:null as string|null });
  const [editForm, setEditForm] = useState({ rol:'director', udns:[] as string[], activo:true, udn_madre:'', nivel_jerarquico:'', reporta_a:null as string|null, vistas:[] as string[] });
  const [guardando, setGuardando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string|null>(null);
  const [sortCol, setSortCol] = useState<'created_at'|'ultima_actividad'>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [colapsados, setColapsados] = useState<Set<string>>(new Set());
  const toggleGrupo = (key: string) => setColapsados(p => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });

  useEffect(() => { if (!loading && perfil?.rol !== 'admin') router.push('/'); }, [perfil, loading]);
  useEffect(() => { if (perfil?.rol === 'admin') cargar(); }, [perfil]);

  async function cargar() {
    setCargando(true);
    try {
      const res = await fetch('/api/iam/listar');
      const json = await res.json();
      setUsuarios(json.data ?? []);
    } catch {
      const { data } = await sb.from('perfiles').select('*').order('created_at', { ascending: true });
      setUsuarios(data ?? []);
    }
    setCargando(false);
  }

  async function crear() {
    setGuardando(true); setError('');
    try {
      const res = await fetch('/api/iam/crear', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, creado_por: perfil?.id ?? null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al crear');
      setShowForm(false);
      setForm({ email:'', password:'', nombre:'', rol:'director', udns:[], udn_madre:'', nivel_jerarquico:'', reporta_a:null });
      await cargar();
    } catch(e:any) { setError(e.message); }
    setGuardando(false);
  }

  async function editar() {
    if (!editTarget) return;
    setGuardando(true); setError('');
    try {
      const res = await fetch('/api/iam/editar', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id: editTarget.id, ...editForm, editado_por: perfil?.id ?? null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al editar');
      setShowEdit(false); setEditTarget(null);
      await cargar();
    } catch(e:any) { setError(e.message); }
    setGuardando(false);
  }

  async function eliminar(id: string) {
    const res = await fetch('/api/iam/eliminar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error al eliminar: ${data.error}`);
      return;
    }
    setConfirmDelete(null);
    await cargar();
  }

  function abrirEditar(u: Usuario) {
    setEditTarget(u);
    setEditForm({
      rol: u.rol,
      udns: u.udn ? u.udn.split(',').map(s=>s.trim()) : [],
      activo: u.activo ?? true,
      udn_madre: u.udn_madre ?? '',
      nivel_jerarquico: u.nivel_jerarquico ?? '',
      reporta_a: u.reporta_a ?? null,
      vistas: u.vistas ? u.vistas.split(',').map(s=>s.trim()) : [],
    });
    setShowEdit(true);
  }

  function formatFecha(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
  }

  function formatActividad(iso?: string) {
    if (!iso) return 'Sin registro';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hrs   = Math.floor(diff / 3600000);
    const dias  = Math.floor(diff / 86400000);
    const sems  = Math.floor(dias / 7);
    const meses = Math.floor(dias / 30);
    if (mins  < 1)   return 'ahora';
    if (mins  < 60)  return `hace ${mins}m`;
    if (hrs   < 24)  return `hace ${hrs}h`;
    if (dias  < 7)   return `hace ${dias}d`;
    if (sems  < 4)   return `hace ${sems} sem`;
    if (meses < 12)  return `hace ${meses} mes${meses > 1 ? 'es' : ''}`;
    return `hace +1 año`;
  }

  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  function construirFilas(lista: Usuario[]) {
    const grupos: Record<string, Usuario[]> = {};
    lista.forEach(u => { (grupos[u.udn_madre || 'Sin asignar'] ??= []).push(u); });
    const filas: { tipo:'header'|'user'; label?:string; user?:Usuario; depth?:number }[] = [];
    Object.keys(grupos).sort().forEach(key => {
      filas.push({ tipo:'header', label:key });
      const items = grupos[key];
      const porId: Record<string, any> = {};
      items.forEach(u => porId[u.id] = { ...u, hijos:[] });
      const raices: any[] = [];
      items.forEach(u => {
        if (u.reporta_a && porId[u.reporta_a]) porId[u.reporta_a].hijos.push(porId[u.id]);
        else raices.push(porId[u.id]);
      });
      const NIVEL_ORD: Record<string,number> = { principal:0, gerente:1, comercial:2, sdr:2, analista:2 };
      const ordenar = (a:any,b:any) => (NIVEL_ORD[a.nivel_jerarquico??'']??9) - (NIVEL_ORD[b.nivel_jerarquico??'']??9);
      const push = (n:any, depth:number) => {
        filas.push({ tipo:'user', user:n, depth });
        [...n.hijos].sort(ordenar).forEach((h:any) => push(h, depth+1));
      };
      [...raices].sort(ordenar).forEach(r => push(r, 0));
    });
    return filas;
  }
  const filasJerarquia = construirFilas(usuariosOrdenados);

  if (loading || !perfil) return null;

  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--txt-1)', fontSize:13, outline:'none', boxSizing:'border-box' as const };
  const labelStyle = { fontSize:12, fontWeight:600 as const, color:'var(--txt-4)', display:'block' as const, marginBottom:6 };

  return (
    <div style={{ minHeight:'100vh', height:'100vh', overflowY:'auto', WebkitOverflowScrolling:'touch', backgroundColor:'var(--bg)', fontFamily:'Inter, sans-serif', color:'var(--txt-1)' }}>
      <div style={{ backgroundColor:'var(--header-bg)', borderBottom:'2px solid var(--border)', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.push('/')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-4)', display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Volver
          </button>
          <span style={{ color:'var(--border)', fontSize:18 }}>|</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={MAGENTA} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span style={{ fontSize:16, fontWeight:700 }}>IAM <span style={{ color:MAGENTA }}>·</span> Gestión de usuarios</span>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }} style={{ padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${MAGENTA}, #8C59FE)`, color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo usuario
        </button>
      </div>

      <div style={{ padding:24, maxWidth:1200, margin:'0 auto' }}>
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ overflowX:'auto', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ minWidth:820, display:'grid', gridTemplateColumns:'2fr 1.6fr 1fr 1.3fr 80px 60px 100px 120px 120px', padding:'10px 20px', borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', position:'sticky' as const, top:0, zIndex:10 }}>
            {['Entidad','Correo','Rol','UDNs asignadas','Estado','Visitas'].map(h => (
              <span key={h} style={{ fontSize:11, fontWeight:600, color:'var(--txt-5)', letterSpacing:'0.08em', textTransform:'uppercase' as const }}>{h}</span>
            ))}
            {(['created_at','ultima_actividad'] as const).map((col, i) => {
              const label = i === 0 ? 'ALTA' : 'ÚLT. ACTIVIDAD';
              const active = sortCol === col;
              return (
                <button key={col} onClick={() => { if (sortCol === col) setSortAsc(p => !p); else { setSortCol(col); setSortAsc(false); } }}
                  style={{ fontSize:11, fontWeight:600, color: active ? '#fff' : 'var(--txt-5)', letterSpacing:'0.08em', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, padding:0 }}>
                  {label}
                  <span style={{ display:'flex', flexDirection:'column', gap:1, lineHeight:1 }}>
                    <svg width="7" height="5" viewBox="0 0 7 5" fill={active && !sortAsc ? '#fff' : 'var(--txt-5)'}><path d="M3.5 0L7 5H0z"/></svg>
                    <svg width="7" height="5" viewBox="0 0 7 5" fill={active && sortAsc ? '#fff' : 'var(--txt-5)'}><path d="M3.5 5L0 0h7z"/></svg>
                  </span>
                </button>
              );
            })}
            <span style={{ fontSize:11, fontWeight:600, color:'var(--txt-5)', letterSpacing:'0.08em', textTransform:'uppercase' as const }}>Acciones</span>
          </div>
          {cargando ? (
            <div style={{ minWidth:820, padding:40, textAlign:'center', color:'var(--txt-5)' }}>Cargando...</div>
          ) : filasJerarquia.map((f, i) => f.tipo === 'header' ? (
            <div key={'h-'+f.label} onClick={() => toggleGrupo(f.label!)} style={{ minWidth:820, padding:'8px 20px', background:'rgba(255,255,255,0.04)', borderBottom:'1px solid var(--border)', fontSize:12, fontWeight:700, color:MAGENTA, letterSpacing:'0.05em', cursor:'pointer', userSelect:'none' }}>
              {colapsados.has(f.label!) ? '▶' : '▼'} {f.label}
            </div>
          ) : colapsados.has(f.user?.udn_madre || 'Sin asignar') ? null : (() => { const u = f.user!; const depth = f.depth!; return (
            <div key={u.id}
              style={{ minWidth:820, display:'grid', gridTemplateColumns:'2fr 1.6fr 1fr 1.3fr 80px 60px 100px 120px 120px', padding:'14px 20px', borderBottom: i < filasJerarquia.length-1 ? '1px solid var(--border-subtle)' : 'none', alignItems:'center', opacity: u.activo === false ? 0.5 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft: depth*24 }}>
                {depth > 0 && <span style={{ color:'var(--txt-5)', fontSize:13 }}>└</span>}
                <div style={{ width:32, height:32, borderRadius:'50%', background: u.activo === false ? 'rgba(100,100,100,0.5)' : `linear-gradient(135deg, ${MAGENTA} 0%, #8C59FE 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {u.nombre?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() ?? '??'}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{u.nombre ?? '—'}</div>
                  <div style={{ fontSize:11, color:'var(--txt-5)' }}>{u.id.slice(0,8)}...</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--txt-3)', wordBreak:'break-all' }}>{u.email ?? '—'}</div>
              <span style={{ fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:6, background:`${MAGENTA}18`, color:MAGENTA, display:'inline-block' }}>
                {ROL_LABEL[u.rol] ?? u.rol}
              </span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {u.udn ? u.udn.split(',').map(d => (
                  <span key={d} style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'rgba(255,255,255,0.07)', color:'var(--txt-3)', border:'1px solid var(--border)' }}>{d.trim()}</span>
                )) : <span style={{ fontSize:11, color:'var(--txt-5)' }}>Todas</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor: u.activo === false ? '#EF4444' : '#22C55E' }}/>
                <span style={{ fontSize:12, color:'var(--txt-4)' }}>{u.activo === false ? 'Inactivo' : 'Activo'}</span>
              </div>
              <div style={{ fontSize:12, color:'var(--txt-4)', fontWeight:600 }}>{u.total_visitas ?? 0}</div>
              <div style={{ fontSize:12, color:'var(--txt-5)' }}>{formatFecha(u.created_at)}</div>
              <div style={{ fontSize:12, color: u.ultima_actividad ? 'var(--txt-3)' : 'var(--txt-5)' }} title={u.ultima_actividad ? new Date(u.ultima_actividad).toLocaleString('es-MX') : 'Sin registro'}>
                {formatActividad(u.ultima_actividad)}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => abrirEditar(u)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'rgba(255,255,255,0.05)', color:'var(--txt-3)', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  Editar
                </button>
                <button onClick={() => setConfirmDelete(u.id)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid rgba(248,113,113,0.3)', background:'rgba(248,113,113,0.08)', color:'#F87171', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                  Eliminar
                </button>
              </div>
            </div>
          ); })())}
          </div>
        </div>
      </div>

      {/* Modal nuevo usuario */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:440, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Nuevo usuario</div>
            {error && <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#F87171', fontSize:12, marginBottom:14 }}>{error}</div>}
            {[
              { label:'Nombre completo', key:'nombre', type:'text', placeholder:'Ej. Pablo Levy' },
              { label:'Correo electrónico', key:'email', type:'email', placeholder:'correo@empresa.com' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Contraseña temporal</label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={{ ...inputStyle, paddingRight:40 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--txt-4)', padding:0, display:'flex' }}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Rol</label>
              <select value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))} style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
              </select>
            </div>
            {form.rol !== 'admin' && (
              <div style={{ marginBottom:20 }}>
                <label style={labelStyle}>UDNs asignadas</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {UDNS_LIST.map(u => {
                    const sel = form.udns.includes(u);
                    return <button key={u} onClick={() => setForm(p => ({ ...p, udns: sel ? p.udns.filter(x=>x!==u) : [...p.udns, u] }))}
                      style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{u}</button>;
                  })}
                </div>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>UDN madre</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {UDN_MADRE_LIST.map(u => {
                  const sel = form.udn_madre === u;
                  return <button key={u} onClick={() => setForm(p => ({ ...p, udn_madre: u }))}
                    style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{u}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Nivel jerárquico</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {NIVEL_LIST.map(n => {
                  const sel = form.nivel_jerarquico === n.val;
                  return <button key={n.val} onClick={() => setForm(p => ({ ...p, nivel_jerarquico: n.val }))}
                    style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n.label}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Reporta a</label>
              <select value={form.reporta_a ?? ''} onChange={e => setForm(p => ({ ...p, reporta_a: e.target.value || null }))} style={inputStyle}>
                <option value="">— Sin supervisor (Principal) —</option>
                {usuarios.filter(u => !form.udn_madre || u.udn_madre === form.udn_madre).map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}{u.nivel_jerarquico ? ` (${u.nivel_jerarquico})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowForm(false); setError(''); }} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--txt-3)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={crear} disabled={guardando} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:`linear-gradient(135deg, ${MAGENTA}, #8C59FE)`, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar usuario */}
      {showEdit && editTarget && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:440, boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Editar usuario</div>
            <div style={{ fontSize:12, color:'var(--txt-5)', marginBottom:20 }}>{editTarget.nombre}</div>
            {error && <div style={{ padding:'8px 12px', borderRadius:8, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#F87171', fontSize:12, marginBottom:14 }}>{error}</div>}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Rol</label>
              <select value={editForm.rol} onChange={e => setEditForm(p => ({ ...p, rol: e.target.value }))} style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
              </select>
            </div>
            {editForm.rol !== 'admin' && (
              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>UDNs asignadas</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {UDNS_LIST.map(u => {
                    const sel = editForm.udns.includes(u);
                    return <button key={u} onClick={() => setEditForm(p => ({ ...p, udns: sel ? p.udns.filter(x=>x!==u) : [...p.udns, u] }))}
                      style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{u}</button>;
                  })}
                </div>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>UDN madre</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {UDN_MADRE_LIST.map(u => {
                  const sel = editForm.udn_madre === u;
                  return <button key={u} onClick={() => setEditForm(p => ({ ...p, udn_madre: u }))}
                    style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{u}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Nivel jerárquico</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {NIVEL_LIST.map(n => {
                  const sel = editForm.nivel_jerarquico === n.val;
                  return <button key={n.val} onClick={() => setEditForm(p => ({ ...p, nivel_jerarquico: n.val }))}
                    style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{n.label}</button>;
                })}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Vistas habilitadas</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {[{val:'director', label:'Director'},{val:'operativa', label:'Operativa'},{val:'analista', label:'Analista'}].map(v => {
                  const sel = editForm.vistas.includes(v.val);
                  return <button key={v.val} onClick={() => setEditForm(p => ({ ...p, vistas: sel ? p.vistas.filter(x=>x!==v.val) : [...p.vistas, v.val] }))}
                    style={{ padding:'5px 11px', borderRadius:7, border:`1px solid ${sel ? MAGENTA : 'var(--border)'}`, background: sel ? `${MAGENTA}22` : 'transparent', color: sel ? MAGENTA : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{v.label}</button>;
                })}
              </div>
              <p style={{ fontSize:10, color:'var(--txt-5)', marginTop:4 }}>Si no seleccionas ninguna, se usará el comportamiento por defecto según el rol.</p>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={labelStyle}>Reporta a</label>
              <select value={editForm.reporta_a ?? ''} onChange={e => setEditForm(p => ({ ...p, reporta_a: e.target.value || null }))} style={inputStyle}>
                <option value="">— Sin supervisor (Principal) —</option>
                {usuarios.filter(u => u.id !== editTarget?.id && (!editForm.udn_madre || u.udn_madre === editForm.udn_madre)).map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}{u.nivel_jerarquico ? ` (${u.nivel_jerarquico})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={labelStyle}>Estado</label>
              <div style={{ display:'flex', gap:8 }}>
                {[{val:true, label:'Activo', color:'#22C55E'},{val:false, label:'Inactivo', color:'#EF4444'}].map(opt => (
                  <button key={String(opt.val)} onClick={() => setEditForm(p => ({ ...p, activo: opt.val }))}
                    style={{ flex:1, padding:'8px', borderRadius:8, border:`1px solid ${editForm.activo === opt.val ? opt.color : 'var(--border)'}`, background: editForm.activo === opt.val ? `${opt.color}18` : 'transparent', color: editForm.activo === opt.val ? opt.color : 'var(--txt-4)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', backgroundColor: opt.color }}/>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => { setShowEdit(false); setError(''); }} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--txt-3)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={editar} disabled={guardando} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:`linear-gradient(135deg, ${MAGENTA}, #8C59FE)`, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:14, padding:28, maxWidth:360, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Eliminar usuario</div>
            <div style={{ fontSize:13, color:'var(--txt-4)', marginBottom:20, lineHeight:1.6 }}>Esta acción revoca el acceso de inmediato. El usuario no podrá ingresar aunque tenga la app instalada.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--txt-3)', fontSize:13, cursor:'pointer' }}>Cancelar</button>
              <button onClick={() => eliminar(confirmDelete)} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#EF4444', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
