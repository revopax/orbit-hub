'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const router = useRouter();
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const MAGENTA = '#E8008D';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset() {
    setError('');
    if (!pw1 || !pw2) { setError('Completa ambos campos'); return; }
    if (pw1 !== pw2) { setError('Las contraseñas no coinciden'); return; }
    if (pw1.length < 8) { setError('Mínimo 8 caracteres'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw1 });
    if (err) { setError(err.message); setSaving(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('perfiles').update({ password_changed: true }).eq('id', user.id);
    setOk(true);
    setSaving(false);
    setTimeout(() => router.push('/'), 2500);
  }

  const inputStyle = {
    width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
    color: '#fff', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: "'Inter',-apple-system,sans-serif"
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}><img src="/images/compass_1f9ed.png" style={{width:"1em",height:"1em",verticalAlign:"middle",display:"inline-block"}} alt="brujula" /></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Brújula <span style={{ color: MAGENTA }}>Comercial</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
            {ready ? 'Establece tu nueva contraseña' : 'Procesando enlace...'}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
          {ok ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ color: '#22C55E', fontWeight: 600, fontSize: 14 }}>Contraseña actualizada</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>Redirigiendo al dashboard...</div>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Verificando enlace de recuperación...
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
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={f.show ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)} style={inputStyle} placeholder="Mínimo 8 caracteres" />
                    <button type="button" onClick={f.toggle} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex' }}>
                      {f.show
                        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
                        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={handleReset} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${MAGENTA}, #8C59FE)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          © 2026 Grupo UPAX · RevOps Intelligence
        </p>
      </div>
    </div>
  );
}
