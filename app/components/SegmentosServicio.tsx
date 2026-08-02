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
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>
          Actividad por segmento de servicio
        </p>
        <p style={{ fontSize:11, color:'#94A3B8', margin:0 }}>Impresiones Google Ads</p>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ height:12, width:120, background:'#F1F5F9', borderRadius:4 }} />
              <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:4 }} />
              <div style={{ height:12, width:60, background:'#F1F5F9', borderRadius:4 }} />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize:12, color:'#94A3B8', textAlign:'center', padding:'24px 0' }}>Sin datos este período</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {rows.map((r, i) => (
            <div key={r.categoria} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:24, fontSize:11, fontWeight:700, color:'#94A3B8', textAlign:'right', flexShrink:0 }}>
                {i+1}
              </div>
              <div style={{ width:180, flexShrink:0 }}>
                <p style={{ fontSize:12, fontWeight: r.impresiones > 0 ? 600 : 400, color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.categoria}
                </p>
                <p style={{ fontSize:10, color:'#94A3B8', margin:'1px 0 0' }}>{r.keywords_activas}/{r.keywords_total} kws activas</p>
              </div>
              <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
                <div style={{
                  width: r.impresiones > 0 ? `${Math.max(Math.round((r.impresiones/max)*100), 2)}%` : '0%',
                  height:'100%',
                  background: i === 0 ? '#534AB7' : i === 1 ? '#7C3AED' : i === 2 ? '#A78BFA' : '#C4B5FD',
                  borderRadius:4,
                  transition:'width 0.5s ease',
                }} />
              </div>
              <div style={{ width:70, textAlign:'right', flexShrink:0 }}>
                <span style={{ fontSize:13, fontWeight:700, color: r.impresiones > 0 ? '#534AB7' : '#CBD5E1', fontVariantNumeric:'tabular-nums' }}>
                  {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
