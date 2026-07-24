'use client';
import { useState, useEffect, useRef } from 'react';
import { getSupabase } from '../../lib/supabase';

const sb = getSupabase();

interface UserMenuProps {
  nombre?: string;
  rol?: string;
  udn?: string | null;
  acento: string;
  onLogout?: () => void;
  isMobile?: boolean;
}

export function UserMenu({ nombre, rol, udn, acento, onLogout, isMobile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user) sb.from('perfiles').select('photo_url').eq('id', user.id).single()
        .then(({ data }) => { if (data?.photo_url) setPhotoUrl(data.photo_url); });
    });
  }, []);

  async function uploadFoto(file: File) {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { console.error('[avatar] sin sesión'); return; }
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = user.id + '/avatar.' + ext;
    const { error: upErr } = await sb.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { console.error('[avatar] upload error:', upErr.message, upErr); return; }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path);
    const { error: dbErr } = await sb.from('perfiles').update({ photo_url: publicUrl }).eq('id', user.id);
    if (dbErr) { console.error('[avatar] db error:', dbErr.message); return; }
    setPhotoUrl(publicUrl);
    console.log('[avatar] ✅ foto guardada:', publicUrl);
  }

  const iniciales = nombre
    ? nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const rolLabel = rol === 'admin' ? 'Administrador' : rol === 'director' ? 'Director' : rol === 'comercial' ? 'Comercial' : rol === 'sdr' ? 'SDR' : 'Operativo';

  const menuItemStyle = {
    width: '100%', padding: '10px 16px',
    background: 'none', border: 'none',
    cursor: 'pointer', textAlign: 'left' as const,
    fontSize: 13, fontWeight: 500,
    color: 'var(--txt-2, #fff)', fontFamily: 'Inter, sans-serif',
    display: 'flex', alignItems: 'center', gap: 8,
    transition: 'background 0.15s',
  };

  const inputStyle = {
    width: '100%', padding: '9px 36px 9px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--txt-1)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'Inter, sans-serif',
  };

  async function cambiarPassword() {
    setPwError('');
    if (!pw1 || !pw2) { setPwError('Completa ambos campos'); return; }
    if (pw1 !== pw2) { setPwError('Las contraseñas no coinciden'); return; }
    if (pw1.length < 8) { setPwError('Mínimo 8 caracteres'); return; }
    setSaving(true);
    const { error } = await sb.auth.updateUser({ password: pw1 });
    if (error) { setPwError(error.message); setSaving(false); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.from('perfiles').update({ password_changed: true }).eq('id', user.id);
    setPwOk(true);
    setSaving(false);
    setTimeout(() => { setShowPwModal(false); setPw1(''); setPw2(''); setPwOk(false); }, 2000);
  }

  const pwModal = showPwModal && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--txt-1)' }}>Cambiar contraseña</div>
        <div style={{ fontSize: 12, color: 'var(--txt-5)', marginBottom: 20 }}>Mínimo 8 caracteres</div>
        {pwError && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: 12, marginBottom: 14 }}>{pwError}</div>}
        {pwOk && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E', fontSize: 12, marginBottom: 14 }}>✅ Contraseña actualizada</div>}
        {[
          { label: 'Nueva contraseña', val: pw1, set: setPw1, show: show1, toggle: () => setShow1(p => !p) },
          { label: 'Confirmar contraseña', val: pw2, set: setPw2, show: show2, toggle: () => setShow2(p => !p) },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-4)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <div style={{ position: 'relative' }}>
              <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} placeholder="Mínimo 8 caracteres" />
              <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-4)', padding: 0, display: 'flex' }}>
                {f.show
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => { setShowPwModal(false); setPwError(''); setPw1(''); setPw2(''); }} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--txt-3)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={cambiarPassword} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #E8008D, #8C59FE)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5, padding: '4px 8px', flexShrink: 0 }}>
          <span style={{ width: 20, height: 2, background: 'var(--txt-1, #fff)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 20, height: 2, background: 'var(--txt-1, #fff)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 20, height: 2, background: 'var(--txt-1, #fff)', borderRadius: 2, display: 'block' }} />
        </button>
        {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.55)' }} />}
        <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '72vw', maxWidth: 260, background: 'var(--header-bg, #030712)', borderRight: '1px solid rgba(255,255,255,0.08)', zIndex: 9999, transform: open ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '52px 20px 20px', background: `linear-gradient(160deg, ${acento}22 0%, transparent 100%)`, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${acento} 0%, #8C59FE 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12, boxShadow: `0 4px 16px ${acento}44`, overflow: 'hidden' }}>
              {photoUrl ? <img src={photoUrl} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciales}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{nombre ?? '—'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{rolLabel}{udn ? ` · ${udn}` : ''}</div>
          </div>
          <div style={{ flex: 1, padding: '8px 0' }}>
            <button onClick={() => { setOpen(false); setShowPwModal(true); }} style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Cambiar contraseña
            </button>
            <button onClick={() => { setOpen(false); onLogout?.(); }} style={{ ...menuItemStyle, color: '#F87171', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Cerrar sesión
            </button>
          </div>
        </div>
        {pwModal}
      </>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: '50%', background: photoUrl ? 'transparent' : `linear-gradient(135deg, ${acento} 0%, #8C59FE 100%)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'Inter, sans-serif', boxShadow: `0 2px 12px ${acento}66`, flexShrink: 0, overflow: 'hidden', padding: 0 }}>
        {photoUrl ? <img src={photoUrl} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : iniciales}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{ position: 'absolute', top: 42, right: 0, background: 'var(--card-bg, #1a1a2e)', border: '1px solid var(--border)', borderRadius: 12, minWidth: 220, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ padding: 16, background: `linear-gradient(135deg, ${acento}18 0%, transparent 100%)`, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${acento} 0%, #8C59FE 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {iniciales}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' }}>{nombre ?? '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt-5)', marginTop: 2 }}>{rolLabel}{udn ? ` · ${udn}` : ''}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '6px 0', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setOpen(false); fileInputRef.current?.click(); }} style={{ ...menuItemStyle, fontSize: 12 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Cargar foto de perfil
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); }} />
            </div>
          </div>
        </>
      )}
      {pwModal}
    </div>
  );
}
