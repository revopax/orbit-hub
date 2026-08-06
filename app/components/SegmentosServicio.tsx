'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { InfoTip } from './redes/KPICard';

const supa = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

interface Segmento { categoria: string; impresiones: number; vol_mercado: number; keywords_activas: number; keywords_total: number; }
interface KwDetalle { keyword: string; tipo: string; impresiones: number; vol_mercado: number; }

const TIPO_COLOR: Record<string, { bg: string; color: string }> = {
  'Commercial':    { bg: '#FFFBEB', color: '#D97706' },
  'Informational': { bg: '#EFF6FF', color: '#2563EB' },
  'Transactional': { bg: '#ECFDF5', color: '#059669' },
  'Navigational':  { bg: '#F3F4F6', color: '#6B7280' },
};

function TipoBadge({ tipo }: { tipo: string }) {
  const t = tipo.split(',')[0].trim();
  const meta = TIPO_COLOR[t] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return <span style={{ fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:20, background:meta.bg, color:meta.color }}>{t}</span>;
}

function DetalleKeywords({ udn, desde, hasta, categoria }: { udn: string; desde: string; hasta: string; categoria: string }) {
  const [rows, setRows] = useState<KwDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supa.rpc('get_keywords_segmento', { p_udn: udn, p_desde: desde, p_hasta: hasta, p_categoria: categoria })
      .then(({ data }) => { if (data) setRows(data); })
      .finally(() => setLoading(false));
  }, [udn, desde, hasta, categoria]);

  if (loading) return <div style={{ padding:'8px 12px', fontSize:11, color:'#94A3B8' }}>Cargando...</div>;

  const rowsOrdenadas = [...rows].sort((a, b) => b.vol_mercado - a.vol_mercado);

  return (
    <div style={{ borderTop:'0.5px solid #E2E8F0', background:'#FAFBFF' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ background:'#F1F5F9' }}>
            <th style={{ padding:'5px 12px 5px 40px', textAlign:'left', fontWeight:500, color:'#64748B' }}>Keyword</th>
            <th style={{ padding:'5px 12px', textAlign:'left', fontWeight:500, color:'#64748B' }}>Intención</th>
            <th style={{ padding:'5px 12px', textAlign:'right', fontWeight:500, color:'#64748B' }}>Impr.</th>
              <th style={{ padding:'5px 12px', textAlign:'right', fontWeight:500, color:'#64748B' }}>Vol. mercado</th>
          </tr>
        </thead>
        <tbody>
          {rowsOrdenadas.map((r, i) => (
            <tr key={r.keyword} style={{ borderTop: i > 0 ? '0.5px solid #F1F5F9' : 'none' }}>
              <td style={{ padding:'5px 12px 5px 40px', color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8' }}>{r.keyword}</td>
              <td style={{ padding:'5px 12px' }}><TipoBadge tipo={r.tipo} /></td>
              <td style={{ padding:'5px 12px', textAlign:'right', fontWeight:600, color: r.impresiones > 0 ? '#534AB7' : '#CBD5E1' }}>
                {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
              </td>
              <td style={{ padding:'5px 12px', textAlign:'right', fontWeight:600, color: r.impresiones > 0 ? '#059669' : (r.vol_mercado ? '#1e1b4b' : '#CBD5E1') }}>
                {r.vol_mercado ? r.vol_mercado.toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SegmentosServicio({ udn, desde, hasta }: { udn: string; desde: string; hasta: string }) {
  const [rows, setRows] = useState<Segmento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (!desde || !hasta) return;
    setLoading(true);
    setExpandido(null);
    supa.rpc('get_segmentos_udn', { p_udn: udn, p_desde: desde, p_hasta: hasta })
      .then(({ data }) => { if (data) setRows(data); })
      .finally(() => setLoading(false));
  }, [udn, desde, hasta]);

  const rowsOrdenadas = [...rows].sort((a, b) => b.vol_mercado - a.vol_mercado);
  const max = Math.max(...rowsOrdenadas.map(r => r.vol_mercado), 1);
  const COLORES = ['#534AB7','#7C3AED','#A78BFA','#C4B5FD','#DDD6FE','#EDE9FE'];

  return (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>
            Actividad por segmento de servicio
          </p>
          <InfoTip text="Volumen de búsqueda en Google agrupado por categoría de servicio del SEO Masterplan. Haz clic en un segmento para ver el detalle de keywords." />
        </div>
        <p style={{ fontSize:12, color:'#64748B', fontWeight:600, margin:0 }}>Vol. mercado · clic para ver detalle</p>
      </div>

      {loading ? (
        <div style={{ padding:'0 24px 16px', display:'flex', flexDirection:'column', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:32, background:'#F1F5F9', borderRadius:4 }} />)}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize:12, color:'#94A3B8', textAlign:'center', padding:'24px' }}>Sin datos este período</p>
      ) : (
        <div>
          {rowsOrdenadas.map((r, i) => (
            <div key={r.categoria}>
              <div
                onClick={() => setExpandido(expandido === r.categoria ? null : r.categoria)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 24px', cursor:'pointer', borderTop: i > 0 ? '0.5px solid #F1F5F9' : 'none', background: expandido === r.categoria ? '#F8FAFF' : 'transparent' }}
              >
                <div style={{ width:20, fontSize:11, fontWeight:700, color:'#94A3B8', textAlign:'right', flexShrink:0 }}>{i+1}</div>
                <div style={{ width:200, flexShrink:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color: r.vol_mercado > 0 ? '#1e1b4b' : '#94A3B8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.categoria}
                  </p>
                  <p style={{ fontSize:12, color:'#64748B', fontWeight:500, margin:'2px 0 0' }}>
                    <span style={{ fontWeight:700, color:'#1e1b4b' }}>{r.keywords_activas}/{r.keywords_total}</span> keywords activadas en campaña · {r.impresiones.toLocaleString()} impr.
                  </p>
                </div>
                <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width: r.vol_mercado > 0 ? `${Math.max(Math.round((r.vol_mercado/max)*100), 2)}%` : '0%', height:'100%', background: COLORES[i] || '#E2E8F0', borderRadius:4 }} />
                </div>
                <div style={{ width:130, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2, flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16, fontWeight:700, color: r.vol_mercado > 0 ? COLORES[i] : '#CBD5E1' }}>
                      {r.vol_mercado > 0 ? r.vol_mercado.toLocaleString() : '—'}
                    </span>
                    <span style={{ fontSize:10, color:'#94A3B8' }}>{expandido === r.categoria ? '▲' : '▼'}</span>
                  </div>
                  <span style={{ fontSize:9, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em' }}>búsquedas de mercado</span>
                </div>
              </div>
              {expandido === r.categoria && (
                <DetalleKeywords udn={udn} desde={desde} hasta={hasta} categoria={r.categoria} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
