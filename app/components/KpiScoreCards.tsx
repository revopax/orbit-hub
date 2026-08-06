'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { InfoTip } from './redes/KPICard';

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
  busquedas_mercado_total: number;
  indice_senal: number;
  impresiones_total: number;
  keywords_activas: number;
  keywords_total: number;
  keywords_research_activas: number;
  keywords_research_total: number;
  competidores_det: number;
  mes_pico: string;
  indice_pico: number;
}

interface Props { udn: string; desde: string; hasta: string; }

export function KpiScoreCards({ udn, desde, hasta }: Props) {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!desde || !hasta) return;
    setLoading(true);
    supa.rpc('get_kpis_udn', { p_udn: udn, p_desde: desde, p_hasta: hasta })
      .then(({ data: d }) => { if (d?.[0]) setData(d[0]); })
      .finally(() => setLoading(false));
  }, [udn, desde, hasta]);

  if (loading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height:110, borderRadius:12, background:'#F1F5F9', border:'0.5px solid #E2E8F0' }} />
      ))}
    </div>
  );

  if (!data) return null;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>

      {/* Búsquedas de mercado */}
      <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Búsquedas de mercado <InfoTip text="Total de búsquedas reales en Google para las keywords de tu plan SEO, sumadas en el periodo seleccionado. La tendencia e índice base 100 se muestran en la gráfica de abajo." /></p>
        <p style={{ fontSize:36, fontWeight:700, margin:'0 0 4px', color:'#059669', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
          {data.busquedas_mercado_total >= 1000000
            ? `${(data.busquedas_mercado_total/1000000).toFixed(2)}M`
            : data.busquedas_mercado_total >= 1000
            ? `${(data.busquedas_mercado_total/1000).toFixed(1)}K`
            : data.busquedas_mercado_total.toLocaleString()}
        </p>
        <p style={{ fontSize:11, color:'#94A3B8', margin:'8px 0 0' }}>búsquedas en Google · {fmtMes(desde)} – {fmtMes(hasta)}</p>
      </div>

      {/* Impresiones */}
      <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Impresiones Google Ads <InfoTip text="Veces que tu anuncio apareció en Google. No es personas únicas — una persona puede generar múltiples impresiones." /></p>
        <p style={{ fontSize:36, fontWeight:700, margin:'0 0 4px', color:'#1e1b4b', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
          {data.impresiones_total >= 1000
            ? `${(data.impresiones_total/1000).toFixed(1)}K`
            : data.impresiones_total.toLocaleString()}
        </p>
        <p style={{ fontSize:11, color:'#94A3B8', margin:'8px 0 0' }}>veces apareció tu anuncio · {fmtMes(desde)} – {fmtMes(hasta)}</p>
      </div>

      {/* Keywords */}
      <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Keywords SEO activas <InfoTip text="Golden: de tus keywords estrella, cuántas generaron al menos 1 impresión en Google Ads este mes. Research: de todo tu plan SEO, cuántas tuvieron demanda real de búsqueda en el mercado." /></p>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Golden · campaña</span>
            <span style={{ fontSize:16, fontWeight:700, color:'#1e1b4b', fontVariantNumeric:'tabular-nums' }}>{data.keywords_activas}<span style={{ fontSize:12, fontWeight:400, color:'#94A3B8' }}> / {data.keywords_total}</span></span>
          </div>
          <div style={{ height:4, background:'#F1F5F9', borderRadius:2, marginTop:5, overflow:'hidden' }}>
            <div style={{ width:`${Math.round((data.keywords_activas/Math.max(data.keywords_total,1))*100)}%`, height:'100%', background:'#534AB7', borderRadius:2 }} />
          </div>
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.04em' }}>Research · mercado</span>
            <span style={{ fontSize:16, fontWeight:700, color:'#059669', fontVariantNumeric:'tabular-nums' }}>{data.keywords_research_activas}<span style={{ fontSize:12, fontWeight:400, color:'#94A3B8' }}> / {data.keywords_research_total}</span></span>
          </div>
          <div style={{ height:4, background:'#F1F5F9', borderRadius:2, marginTop:5, overflow:'hidden' }}>
            <div style={{ width:`${Math.round((data.keywords_research_activas/Math.max(data.keywords_research_total,1))*100)}%`, height:'100%', background:'#059669', borderRadius:2 }} />
          </div>
        </div>
      </div>

      {/* Competidores */}
      <div style={{ background:'#fff', borderRadius:12, border:`0.5px solid ${data.competidores_det > 0 ? '#FDE68A' : '#E2E8F0'}`, padding:'16px 20px' }}>
        <p style={{ fontSize:11, fontWeight:600, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 8px' }}>Competidores detectados <InfoTip text="Búsquedas de competidores que activaron tus anuncios. Google mostró tu marca a alguien que buscaba a tu competencia." /></p>
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
