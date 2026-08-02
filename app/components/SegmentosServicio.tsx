'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

interface Segmento {
  categoria: string;
  impresiones: number;
  keywords_activas: number;
  keywords_total: number;
}

interface Props { udn: string; mes: string; }

export function SegmentosServicio({ udn, mes }: Props) {
  const [rows, setRows] = useState<Segmento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mes) return;
    setLoading(true);
    supa.rpc('get_segmentos_udn', { p_udn: udn, p_mes: mes })
      .then(({ data }) => { if (data) setRows(data); })
      .finally(() => setLoading(false));
  }, [udn, mes]);

  const max = Math.max(...rows.map(r => r.impresiones), 1);

  return (
    <div style={{ background:'var(--surface-1)', borderRadius:12, border:'0.5px solid var(--border)', padding:'16px 20px' }}>
      <p style={{ fontSize:11, fontWeight:500, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 14px' }}>
        Actividad por segmento de servicio
      </p>
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:24, background:'var(--surface-0)', borderRadius:4 }} />)}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize:12, color:'var(--text-muted)' }}>Sin datos este período</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {rows.map(r => (
            <div key={r.categoria}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:12, color: r.impresiones > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: r.impresiones > 0 ? 500 : 400 }}>
                  {r.categoria}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                    {r.keywords_activas}/{r.keywords_total} kws activas
                  </span>
                  <span style={{ fontSize:12, fontWeight:600, color: r.impresiones > 0 ? '#534AB7' : 'var(--text-muted)', minWidth:60, textAlign:'right' }}>
                    {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              <div style={{ height:6, background:'var(--surface-0)', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  width: `${Math.round((r.impresiones / max) * 100)}%`,
                  height:'100%', background:'#534AB7', borderRadius:3,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
