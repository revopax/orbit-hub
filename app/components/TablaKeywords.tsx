'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supa = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

interface KeywordRow {
  keyword: string;
  tipo: string;
  es_golden: boolean;
  impresiones: number;
}

const TIPO_META: Record<string, { color: string; bg: string; desc: string }> = {
  'Navigational':  { color: '#6B7280', bg: '#F3F4F6', desc: 'Ya te conoce, busca tu marca directamente' },
  'Informational': { color: '#2563EB', bg: '#EFF6FF', desc: 'Explorando el tema, aún no compra' },
  'Commercial':    { color: '#D97706', bg: '#FFFBEB', desc: 'Comparando opciones, momento de prospectar' },
  'Transactional': { color: '#059669', bg: '#ECFDF5', desc: 'Quiere contratar ya' },
};

function TipoBadge({ tipo }: { tipo: string }) {
  const tipos = tipo.split(',').map(t => t.trim());
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {tipos.map(t => {
        const meta = TIPO_META[t] ?? { color: '#6B7280', bg: '#F3F4F6', desc: t };
        return (
          <span key={t} title={meta.desc} style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px',
            borderRadius: 4, color: meta.color, background: meta.bg,
            cursor: 'help', whiteSpace: 'nowrap', border: `1px solid ${meta.color}22`,
          }}>{t}</span>
        );
      })}
    </div>
  );
}

function MiniTabla({ titulo, subtitulo, rows, emptyMsg }: {
  titulo: string; subtitulo?: string;
  rows: KeywordRow[]; emptyMsg: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{titulo}</p>
      {subtitulo && <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 8px' }}>{subtitulo}</p>}
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Keyword</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Intención</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Impr.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} style={{ padding: '12px 10px', color: '#94A3B8', fontSize: 11, textAlign: 'center' }}>{emptyMsg}</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.keyword} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none', background: r.impresiones > 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '7px 10px', color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8', fontWeight: r.impresiones > 0 ? 500 : 400, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.keyword}
                </td>
                <td style={{ padding: '7px 10px' }}><TipoBadge tipo={r.tipo} /></td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: r.impresiones > 0 ? '#1e1b4b' : '#CBD5E1', fontSize: 12 }}>
                  {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TablaKeywords({ udn }: { udn: string }) {
  const [rows, setRows]       = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes]         = useState('');

  useEffect(() => {
    setLoading(true);
    setRows([]);
    supa.rpc('get_mes_reciente', { p_udn: udn })
      .then(({ data }) => {
        const m = data?.[0]?.mes ?? '';
        if (!m) { setLoading(false); return null; }
        setMes(m);
        return supa.rpc('get_keywords_table', { p_udn: udn, p_mes: m });
      })
      .then((res: any) => { if (res?.data) setRows(res.data); })
      .finally(() => setLoading(false));
  }, [udn]);

  const golden   = rows.filter(r => r.es_golden);
  const emerging = rows.filter(r => !r.es_golden).slice(0, 8);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: '#1e1b4b' }}>Señales de búsqueda · {udn}</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{mes} · Google Ads Search Terms</p>
        </div>
        {/* Leyenda de tipos */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {Object.entries(TIPO_META).map(([tipo, meta]) => (
            <span key={tipo} title={meta.desc} style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
              color: meta.color, background: meta.bg, cursor: 'help',
              border: `1px solid ${meta.color}22`,
            }}>{tipo} · {meta.desc}</span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 12, padding: '12px 0' }}>Cargando señales...</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <MiniTabla
            titulo="Keywords estratégicas SEO"
            subtitulo="Keywords definidas en el plan SEO vs búsquedas reales"
            rows={golden}
            emptyMsg="Sin datos este mes"
          />
          <MiniTabla
            titulo="Oportunidades no mapeadas"
            subtitulo="Términos reales con alto volumen fuera del plan SEO"
            rows={emerging}
            emptyMsg="Sin oportunidades detectadas"
          />
        </div>
      )}
    </div>
  );
}
