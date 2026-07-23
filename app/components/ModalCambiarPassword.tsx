'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  perfil: { id: string; nombre: string };
  acento: string;
  onDone: () => void;
}

export function ModalCambiarPassword({ perfil, acento, onDone }: Props) {
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const MAGENTA = '#E8008D';

  async function handleGuardar() {
    setError('');
    if (!pw1 || !pw2) { setError('Completa ambos campos'); return; }
    if (pw1 !== pw2) { setError('Las contraseñas no coinciden'); return; }
    if (pw1.length < 8) { setError('Mínimo 8 caracteres'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw1 });
    if (err) { setError(err.message); setSaving(false); return; }
    await supabase.from('perfiles').update({ password_changed: true }).eq('id', perfil.id);
    setOk(true);
    setSaving(false);
    setTimeout(() => onDone(), 2000);
  }

  const inputStyle = {
    width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--txt-1)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', border: `1px solid ${MAGENTA}44`, borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 40px ${MAGENTA}22` }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔐</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 6 }}>
            Bienvenido, {perfil.nombre.split(' ')[0]}
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt-4)', lineHeight: 1.5 }}>
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
          </div>
        </div>

        {ok ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ color: '#22C55E', fontWeight: 600, fontSize: 14 }}>Contraseña actualizada</div>
            <div style={{ color: 'var(--txt-5)', fontSize: 12, marginTop: 6 }}>Cargando tu dashboard...</div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', fontSize: 12, marginBottom: 14 }}>
                {error}
              </div>
            )}
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
            <button onClick={handleGuardar} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${MAGENTA}, #8C59FE)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop: 4 }}>
              {saving ? 'Guardando...' : 'Establecer contraseña'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
