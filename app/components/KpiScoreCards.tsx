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

  const cardStyle = {
    background: 'var(--surface-1)', borderRadius: 12,
    border: '0.5px solid var(--border)', padding: '14px 18px',
  };

  if (loading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
      {[1,2,3,4].map(i => <div key={i} style={{ ...cardStyle, height:72, background:'var(--surface-0)' }} />)}
    </div>
  );

  if (!data) return null;

  const esPico = data.mes_pico === mes;
  const señalColor = data.indice_senal >= 130 ? '#059669' : data.indice_senal >= 100 ? '#534AB7' : '#94A3B8';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
      <div style={cardStyle}>
        <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'0 0 4px' }}>Señal de búsqueda</p>
        <p style={{ fontSize:28, fontWeight:500, margin:0, color: señalColor, lineHeight:1 }}>
          {Math.round(data.indice_senal)}
        </p>
        <p style={{ fontSize:11, margin:'4px 0 0', color: esPico ? '#059669' : 'var(--text-muted)' }}>
          {esPico ? '↑ Pico del período' : `Pico: ${fmtMes(data.mes_pico)} · ${Math.round(data.indice_pico)}`}
        </p>
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'0 0 4px' }}>Impresiones</p>
        <p style={{ fontSize:28, fontWeight:500, margin:0, color:'var(--text-primary)', lineHeight:1 }}>
          {data.impresiones_total.toLocaleString()}
        </p>
        <p style={{ fontSize:11, margin:'4px 0 0', color:'var(--text-muted)' }}>{fmtMes(mes)}</p>
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'0 0 4px' }}>Keywords activas</p>
        <p style={{ fontSize:28, fontWeight:500, margin:0, color:'var(--text-primary)', lineHeight:1 }}>
          {data.keywords_activas} <span style={{ fontSize:16, color:'var(--text-muted)' }}>/ {data.keywords_total}</span>
        </p>
        <p style={{ fontSize:11, margin:'4px 0 0', color:'var(--text-muted)' }}>del plan SEO con actividad</p>
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize:11, color:'var(--text-secondary)', margin:'0 0 4px' }}>Competidores detectados</p>
        <p style={{ fontSize:28, fontWeight:500, margin:0, color: data.competidores_det > 0 ? '#D97706' : 'var(--text-muted)', lineHeight:1 }}>
          {data.competidores_det}
        </p>
        <p style={{ fontSize:11, margin:'4px 0 0', color:'var(--text-muted)' }}>en búsquedas de Google Ads</p>
      </div>
    </div>
  );
}
