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
  'Navigational':  { color: '#6B7280', bg: '#F3F4F6', desc: 'Ya te conoce, busca tu marca' },
  'Informational': { color: '#2563EB', bg: '#EFF6FF', desc: 'Explorando, aún no compra' },
  'Commercial':    { color: '#D97706', bg: '#FFFBEB', desc: 'Comparando, momento de prospectar' },
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
            cursor: 'default', whiteSpace: 'nowrap',
          }}>{t}</span>
        );
      })}
    </div>
  );
}

export function TablaKeywords({ udn }: { udn: string }) {
  const [rows, setRows] = useState<KeywordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState('');

  useEffect(() => {
    const now = new Date();
    const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const mesPrev = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
    setMesActual(mes);
    setLoading(true);

    // Intenta mes actual, si vacío usa mes anterior
    supa.rpc('get_keywords_table', { p_udn: udn, p_mes: mes })
      .then(({ data }) => {
        if (data && data.length > 0 && data.some((r: KeywordRow) => r.impresiones > 0)) {
          setRows(data);
        } else {
          setMesActual(mesPrev);
          return supa.rpc('get_keywords_table', { p_udn: udn, p_mes: mesPrev });
        }
      })
      .then((res: any) => { if (res?.data) setRows(res.data); })
      .finally(() => setLoading(false));
  }, [udn]);

  const golden   = rows.filter(r => r.es_golden);
  const emerging = rows.filter(r => !r.es_golden).slice(0, 5);

  if (loading) return (
    <div style={{ padding: '16px 0', color: '#94A3B8', fontSize: 12 }}>Cargando señales de búsqueda...</div>
  );

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#1e1b4b' }}>
            Señales de búsqueda · {udn}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
            {mesActual} · Google Ads Search Terms
          </p>
        </div>
        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {Object.entries(TIPO_META).map(([tipo, meta]) => (
            <span key={tipo} title={meta.desc} style={{
              fontSize: 10, fontWeight: 500, padding: '2px 7px',
              borderRadius: 4, color: meta.color, background: meta.bg,
              cursor: 'default',
            }}>{tipo}</span>
          ))}
        </div>
      </div>

      {/* Keywords estratégicas */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
          Keywords estratégicas SEO
        </p>
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Keyword</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Intención</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Impresiones</th>
              </tr>
            </thead>
            <tbody>
              {golden.map((r, i) => (
                <tr key={r.keyword} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none', background: r.impresiones > 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '8px 12px', color: r.impresiones > 0 ? '#1e1b4b' : '#94A3B8', fontWeight: r.impresiones > 0 ? 500 : 400 }}>
                    {r.keyword}
                  </td>
                  <td style={{ padding: '8px 12px' }}><TipoBadge tipo={r.tipo} /></td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: r.impresiones > 0 ? '#1e1b4b' : '#CBD5E1' }}>
                    {r.impresiones > 0 ? r.impresiones.toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Oportunidades emergentes */}
      {emerging.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
            Oportunidades detectadas · no mapeadas en SEO
          </p>
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Término real buscado</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Intención inferida</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>Impresiones</th>
                </tr>
              </thead>
              <tbody>
                {emerging.map((r, i) => (
                  <tr key={r.keyword} style={{ borderTop: i > 0 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding: '8px 12px', color: '#1e1b4b', fontWeight: 500 }}>{r.keyword}</td>
                    <td style={{ padding: '8px 12px' }}><TipoBadge tipo={r.tipo} /></td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#1e1b4b' }}>
                      {r.impresiones.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
