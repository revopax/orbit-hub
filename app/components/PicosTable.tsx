'use client';
import type { PicoRow } from '../lib/types';

interface Props { picos: PicoRow[]; brandColor: string; }

const MES_NUM: Record<string, number> = {
  'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,
  'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12,
};
const ESTADO_COLORS: Record<string, string> = {
  pico: '#22C55E', prep: '#F59E0B', ok: '#60A5FA', vacio: '#64748B',
};

function estadoFromMesPico(mesPico: string): string {
  const parts = mesPico.toLowerCase().split(' ');
  if (parts.length < 2) return 'vacio';
  const m = MES_NUM[parts[0]] ?? 0;
  const y = parseInt(parts[1]) || 0;
  const now = new Date();
  const diff = (y - now.getFullYear()) * 12 + m - (now.getMonth() + 1);
  if (diff <= 0) return 'pico';
  if (diff === 1) return 'prep';
  if (diff <= 3) return 'ok';
  return 'vacio';
}

export function PicosTable({ picos, brandColor }: Props) {
  const sorted = [...picos].sort((a, b) => b.leadsEnBase - a.leadsEnBase);
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>Picos de temporalidad</div>
        <div style={{ fontSize: 11, color: 'var(--txt-5)', marginTop: 2 }}>Cuándo actuar por industria</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['Industria', 'Mes del pico', 'Qué hacer ahora', 'Leads en base'].map(h => (
                <th key={h} style={{
                  padding: '7px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const dotColor = ESTADO_COLORS[estadoFromMesPico(row.mesPico)] ?? '#64748B';
              return (
                <tr
                  key={row.industria}
                  className="table-row"
                  style={{ borderBottom: i < sorted.length - 1 ? '1px solid var(--divider)' : 'none' }}
                >
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        backgroundColor: dotColor,
                        boxShadow: `0 0 5px ${dotColor}80`,
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-2)' }}>
                        {row.industria}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: brandColor }}>
                      {row.mesPico}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--txt-4)', maxWidth: 260 }}>
                    {row.accion}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' }}>
                      {row.leadsEnBase.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
