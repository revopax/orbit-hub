'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

const sb = getSupabase();

interface ChangelogEntry {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  created_at: string;
}

interface ChangelogBellProps {
  acento: string;
}

export function ChangelogBell({ acento }: ChangelogBellProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [vistoAt, setVistoAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [{ data: changelogData }, { data: perfilData }] = await Promise.all([
        sb.from('changelog').select('*').order('created_at', { ascending: false }).limit(20),
        sb.from('perfiles').select('changelog_visto_at').eq('id', user.id).single(),
      ]);

      if (changelogData) setEntries(changelogData as ChangelogEntry[]);
      setVistoAt(perfilData?.changelog_visto_at ?? null);
      setLoading(false);
    }
    cargar();
  }, []);

  const hayNuevas = !loading && entries.length > 0 && (
    !vistoAt || new Date(entries[0].created_at) > new Date(vistoAt)
  );

  async function abrir() {
    setOpen(o => !o);
    if (!open && hayNuevas && entries.length > 0) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const nuevoVisto = entries[0].created_at;
        await sb.from('perfiles').update({ changelog_visto_at: nuevoVisto }).eq('id', user.id);
        setVistoAt(nuevoVisto);
      }
    }
  }

  function formatFecha(iso: string) {
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <>
      <button
        onClick={abrir}
        aria-label="Novedades"
        style={{
          position: 'relative',
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hayNuevas && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: acento, border: '1.5px solid var(--card-bg)',
          }} />
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(10,8,20,0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '12vh',
            animation: 'clg-fade-in 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 380, maxWidth: '90vw', maxHeight: '70vh',
              display: 'flex', flexDirection: 'column',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              animation: 'clg-scale-in 0.2s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div style={{
              padding: '16px 18px',
              background: `linear-gradient(120deg, ${acento} 0%, #8C59FE 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Novedades</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: 28, fontSize: 12, color: 'var(--txt-5)', textAlign: 'center' }}>Cargando…</div>
              ) : entries.length === 0 ? (
                <div style={{ padding: 28, fontSize: 12, color: 'var(--txt-5)', textAlign: 'center' }}>Sin novedades por ahora.</div>
              ) : (
                entries.map((e, i) => (
                  <div key={e.id} style={{
                    padding: '16px 18px',
                    borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        padding: '2px 7px', borderRadius: 5,
                        background: `${acento}1E`, color: acento,
                      }}>
                        {i === 0 ? 'Nuevo' : 'Actualización'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--txt-5)' }}>{formatFecha(e.fecha)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 4 }}>{e.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--txt-3)', lineHeight: 1.55 }}>{e.descripcion}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <style>{`
            @keyframes clg-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes clg-scale-in { from { opacity: 0; transform: scale(0.95) translateY(-6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
        </div>
      )}
    </>
  );
}
