'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function fmtMes(m: string) {
  if (!m) return '';
  const [y, mo] = m.split('-');
  return `${MESES_ES[parseInt(mo)-1]} ${y}`;
}

interface KpiData {
  indice_senal: number;
  impresiones_total: number;
  keywords_activas: number;
  keywords_total: number;
  competidores_det: number;
  mes_pico: string;
  indice_pico: number;
}

interface Props { udn: string; mes: string; }

export function KpiScoreCards({ udn, mes }: Props) {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mes) return;
    setLoading(true);
    supa.rpc('get_kpis_udn', { p_udn: udn, p_mes: mes })
      .then(({ data: d }) => { if (d?.[0]) setData(d[0]); })
      .finally(() => setLoading(false));
  }, [udn, mes]);

  if (loading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height:110, borderRadius:12, background:'#F1F5F9', border:'0.5px solid #E2E8F0' }} />
      ))}
    </div>
  );

  if (!data) return null;

  const esPico = data.mes_pico === mes;
  const señalVal = Math.round(data.indice_senal);
  const señalColor = señalVal >= 130 ? '#059669' : señalVal >= 100 ? '#534AB7' : '#94A3B8';
  const señalBg = señalVal >= 130 ? '#ECFDF5' : señalVal >= 100 ? '#EEEDFE' : '#F8FAFC';
  const señalBorder = señalVal >= 130 ? '#059669' : señalVal >= 100 ? '#534AB7' : '#CBD5E1';
  const pct = Math.min(señalVal, 200) / 200;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>

      {/* Señal */}
      <div style={{ background:'#fff', borderRadius:12, border:`1.5px solid ${señalBorder}33`, padding:'16px 20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, width:`${Math.round(pct*100)}%`, height:3, background:señalColor, borderRadius:'12px 0 0 0' }} />
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Señal de búsqueda</p>
        <p style={{ fontSize:36, fontWeight:700, margin:'0 0 4px', color:señalColor, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{señalVal}</p>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
          <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:señalBg, color:señalColor }}>
            {esPico ? '↑ Pico del período' : señalVal >= 100 ? 'Señal activa' : 'Señal baja'}
          </span>
          {!esPico && <span style={{ fontSize:11, color:'#94A3B8' }}>Pico: {fmtMes(data.mes_pico)} · {Math.round(data.indice_pico)}</span>}
        </div>
      </div>

      {/* Impresiones */}
      <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Impresiones Google Ads</p>
        <p style={{ fontSize:36, fontWeight:700, margin:'0 0 4px', color:'#1e1b4b', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
          {data.impresiones_total >= 1000
            ? `${(data.impresiones_total/1000).toFixed(1)}K`
            : data.impresiones_total.toLocaleString()}
        </p>
        <p style={{ fontSize:11, color:'#94A3B8', margin:'8px 0 0' }}>veces apareció tu anuncio · {fmtMes(mes)}</p>
      </div>

      {/* Keywords */}
      <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Keywords SEO activas</p>
        <div style={{ display:'flex', alignItems:'baseline', gap:6, margin:'0 0 4px' }}>
          <p style={{ fontSize:36, fontWeight:700, margin:0, color:'#1e1b4b', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{data.keywords_activas}</p>
          <p style={{ fontSize:18, fontWeight:400, margin:0, color:'#94A3B8' }}>/ {data.keywords_total}</p>
        </div>
        <div style={{ height:4, background:'#F1F5F9', borderRadius:2, marginTop:10, overflow:'hidden' }}>
          <div style={{ width:`${Math.round((data.keywords_activas/Math.max(data.keywords_total,1))*100)}%`, height:'100%', background:'#534AB7', borderRadius:2 }} />
        </div>
        <p style={{ fontSize:11, color:'#94A3B8', margin:'6px 0 0' }}>del plan SEO con actividad este mes</p>
      </div>

      {/* Competidores */}
      <div style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${data.competidores_det > 0 ? '#FDE68A' : '#E2E8F0'}`, padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Competidores detectados</p>
        <p style={{ fontSize:36, fontWeight:700, margin:'0 0 4px', color: data.competidores_det > 0 ? '#D97706' : '#94A3B8', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
          {data.competidores_det}
        </p>
        <p style={{ fontSize:11, color:'#94A3B8', margin:'8px 0 0' }}>
          {data.competidores_det > 0 ? 'búsquedas de competidores activaron tu anuncio' : 'sin actividad de competidores este mes'}
        </p>
      </div>

    </div>
  );
}
