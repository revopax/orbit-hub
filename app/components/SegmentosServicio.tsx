'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

interface Segmento { categoria: string; impresiones: number; keywords_activas: number; keywords_total: number; }
interface KwDetalle { keyword: string; tipo: string; impresiones: number; }

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

function DetalleKeywords({ udn, mes, categoria }: { udn: string; mes: string; categoria: string }) {
  const [rows, setRows] = useState<KwDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supa.rpc('get_keywords_segmento', { p_udn: udn, p_mes: mes, p_categoria: categoria })
      .then(({ data }) => { if (data) setRows(data); })
      .finally(() => setLoading(false));
  }, [udn, mes, categoria]);

  if (loading) return <div style={{ padding:'8px 12px', fontSize:11, color:'#94A3B8' }}>Cargando...</div>;

  return (
    <div style={{ borderTop:'0.5px solid #E2E8F0', background:'#FAFBFF' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
        <thead>
          <tr style={{ background:'#F1F5F9' }}>
            <th style={{ padding:'5px 12px 5px 40px', textAlign:'left', fontWeight:500, color:'#64748B' }}>Keyword</th>
            <th style={{ padding:'5px 12px', textAlign:'left', fontWeight:500, color:'#64748B' }}>Intención</th>
            <th style={{ padding:'5px 12px', textAlign:'right', fontWeight:500, color:'#64748B' }}>Impr.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.keyword} style={{ borderTop: i > 0 ? '0.5px solid #F1F5F9' : 'none' }}>
              <td style={{ padding:'5px 12px 5px 40px', color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8' }}>{r.keyword}</td>
              <td style={{ padding:'5px 12px' }}><TipoBadge tipo={r.tipo} /></td>
              <td style={{ padding:'5px 12px', textAlign:'right', fontWeight:600, color: r.impresiones > 0 ? '#534AB7' : '#CBD5E1' }}>
                {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SegmentosServicio({ udn, mes }: { udn: string; mes: string }) {
  const [rows, setRows] = useState<Segmento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    if (!mes) return;
    setLoading(true);
    setExpandido(null);
    supa.rpc('get_segmentos_udn', { p_udn: udn, p_mes: mes })
      .then(({ data }) => { if (data) setRows(data); })
      .finally(() => setLoading(false));
  }, [udn, mes]);

  const max = Math.max(...rows.map(r => r.impresiones), 1);
  const COLORES = ['#534AB7','#7C3AED','#A78BFA','#C4B5FD','#DDD6FE','#EDE9FE'];

  return (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #E2E8F0', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 24px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>
            Actividad por segmento de servicio
          </p>
          <span title="Impresiones de Google Ads agrupadas por categoría de servicio del SEO Masterplan. Haz clic en un segmento para ver el detalle de keywords." style={{ fontSize:12, color:'#94A3B8', cursor:'help' }}>ⓘ</span>
        </div>
        <p style={{ fontSize:11, color:'#94A3B8', margin:0 }}>Impresiones · clic para ver detalle</p>
      </div>

      {loading ? (
        <div style={{ padding:'0 24px 16px', display:'flex', flexDirection:'column', gap:14 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height:32, background:'#F1F5F9', borderRadius:4 }} />)}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize:12, color:'#94A3B8', textAlign:'center', padding:'24px' }}>Sin datos este período</p>
      ) : (
        <div>
          {rows.map((r, i) => (
            <div key={r.categoria}>
              <div
                onClick={() => setExpandido(expandido === r.categoria ? null : r.categoria)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 24px', cursor:'pointer', borderTop: i > 0 ? '0.5px solid #F1F5F9' : 'none', background: expandido === r.categoria ? '#F8FAFF' : 'transparent' }}
              >
                <div style={{ width:20, fontSize:11, fontWeight:700, color:'#94A3B8', textAlign:'right', flexShrink:0 }}>{i+1}</div>
                <div style={{ width:200, flexShrink:0 }}>
                  <p style={{ fontSize:12, fontWeight:600, color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.categoria}
                  </p>
                  <p style={{ fontSize:10, color:'#94A3B8', margin:'1px 0 0' }}>
                    {r.keywords_activas}/{r.keywords_total} kws activas
                  </p>
                </div>
                <div style={{ flex:1, height:8, background:'#F1F5F9', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ width: r.impresiones > 0 ? `${Math.max(Math.round((r.impresiones/max)*100), 2)}%` : '0%', height:'100%', background: COLORES[i] || '#E2E8F0', borderRadius:4 }} />
                </div>
                <div style={{ width:80, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:700, color: r.impresiones > 0 ? COLORES[i] : '#CBD5E1' }}>
                    {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
                  </span>
                  <span style={{ fontSize:10, color:'#94A3B8' }}>{expandido === r.categoria ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandido === r.categoria && (
                <DetalleKeywords udn={udn} mes={mes} categoria={r.categoria} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
