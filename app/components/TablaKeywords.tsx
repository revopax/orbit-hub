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
  categoria: string;
  impresiones: number;
}

const TIPO_META: Record<string, { color: string; bg: string; desc: string }> = {
  'Navigational':  { color: '#6B7280', bg: '#F3F4F6', desc: 'Ya conoce la marca, búsqueda directa' },
  'Informational': { color: '#2563EB', bg: '#EFF6FF', desc: 'Explorando, aún no compra' },
  'Commercial':    { color: '#D97706', bg: '#FFFBEB', desc: 'Comparando opciones · prospectar ahora' },
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
            fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            color: meta.color, background: meta.bg, cursor: 'help',
            border: `1px solid ${meta.color}33`, whiteSpace: 'nowrap',
          }}>{t}</span>
        );
      })}
    </div>
  );
}

function SectionTable({ titulo, subtitulo, infoBox, rows, emptyMsg, accentColor }: {
  titulo: string;
  subtitulo: string;
  infoBox?: { icon: string; text: string };
  rows: KeywordRow[];
  emptyMsg: string;
  accentColor: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>{titulo}</p>
        </div>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 0 11px' }}>{subtitulo}</p>
      </div>

      {infoBox && (
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
          padding: '10px 12px', marginBottom: 10, fontSize: 11, color: '#475569', lineHeight: 1.5,
        }}>
          {infoBox.text}
        </div>
      )}

      <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Término</th>
              <th style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Intención</th>
              <th style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 10 }}>Impr.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '16px 10px', color: '#CBD5E1', fontSize: 11, textAlign: 'center' }}>
                  {emptyMsg}
                </td>
              </tr>
            ) : rows.map((r, i) => (
              <tr key={r.keyword} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                <td style={{
                  padding: '7px 10px', fontWeight: 500,
                  color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8',
                  maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={r.keyword}>{r.keyword}</td>
                <td style={{ padding: '7px 10px' }}><TipoBadge tipo={r.tipo} /></td>
                <td style={{
                  padding: '7px 10px', textAlign: 'right', fontWeight: 700,
                  color: r.impresiones > 0 ? accentColor : '#CBD5E1', fontSize: 12,
                }}>
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

  const golden      = rows.filter(r => r.categoria === 'golden');
  const competitors = rows.filter(r => r.categoria === 'competitor');
  const emerging    = rows.filter(r => r.categoria === 'emerging').slice(0, 6);

  const mesLabel = mes ? new Date(mes + '-01').toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }) : '';

  return (
    <div style={{ marginBottom: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1e1b4b' }}>
            Inteligencia de búsqueda · {udn}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
            {mesLabel} · Google Ads Search Terms
          </p>
        </div>
        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(TIPO_META).map(([tipo, meta]) => (
            <span key={tipo} title={meta.desc} style={{
              fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
              color: meta.color, background: meta.bg, border: `1px solid ${meta.color}33`,
              cursor: 'help',
            }}>
              {tipo} <span style={{ fontWeight: 400, opacity: 0.8 }}>· {meta.desc}</span>
            </span>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94A3B8', fontSize: 12, padding: '16px 0' }}>Cargando inteligencia de búsqueda...</div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          <SectionTable
            titulo="Keywords estratégicas SEO"
            subtitulo="Tu plan SEO vs búsquedas reales en Google Ads"
            rows={golden}
            emptyMsg="Sin actividad este mes"
            accentColor="#7038E5"
          />

          <SectionTable
            titulo="Competidores detectados"
            subtitulo="Búsquedas de tu competencia que activaron tus anuncios"
            infoBox={{
              icon: '💡',
              text: 'Google mostró tus anuncios cuando prospectos buscaron a tus competidores. Si hicieron clic, interceptaste demanda que iba a ellos. Si no, tu marca ganó visibilidad sin costo adicional.',
            }}
            rows={competitors}
            emptyMsg="No se detectaron competidores este mes"
            accentColor="#DC2626"
          />

          <SectionTable
            titulo="Oportunidades no mapeadas"
            subtitulo="Términos con alto volumen fuera de tu plan SEO"
            rows={emerging}
            emptyMsg="Sin oportunidades detectadas"
            accentColor="#059669"
          />

        </div>
      )}
    </div>
  );
}
