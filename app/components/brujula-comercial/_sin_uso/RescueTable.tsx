import type { RescueRow } from '../../../lib/types';

interface RescueTableProps {
  rows: RescueRow[];
  brandColor: string;
}

const accionConfig = {
  llamar:    { label: 'Llamar ahora', color: '#4ADE80' },
  prepararse:{ label: 'Preparar',     color: '#FCD34D' },
  esperar:   { label: 'Esperar',      color: '#93C5FD' },
};

function formatValor(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

export function RescueTable({ rows, brandColor }: RescueTableProps) {
  const sorted = [...rows].sort((a, b) => b.valor - a.valor);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>
          Empresas para retomar contacto
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-6)', marginTop: 2 }}>
          Perdidas por timing o presupuesto · sector ahora en pico · ordenadas por valor
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {/* Empresa — siempre visible */}
              <th style={thStyle}>Empresa</th>
              {/* Industria — oculta en mobile ≤640px */}
              <th className="col-hide-mobile" style={thStyle}>Industria</th>
              {/* Motivo — oculto en mobile ≤640px */}
              <th className="col-hide-mobile" style={thStyle}>Motivo</th>
              {/* Fecha — oculta en mobile */}
              <th className="col-hide-mobile" style={thStyle}>Fecha perdido</th>
              {/* Valor — siempre visible */}
              <th style={thStyle}>Valor perdido</th>
              {/* Pico — visible */}
              <th style={thStyle}>Pico del sector</th>
              {/* Acción — siempre visible */}
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const accion = accionConfig[row.accion];
              const isTop  = i === 0;
              return (
                <tr
                  key={row.empresa}
                  className="table-row"
                  style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--divider)' : 'none',
                    backgroundColor: isTop ? `${brandColor}08` : 'transparent',
                  }}
                >
                  {/* Empresa */}
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isTop ? brandColor : 'var(--txt-1)' }}>
                      {row.empresa}
                    </span>
                  </td>

                  {/* Industria — oculta en mobile */}
                  <td className="col-hide-mobile" style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                      backgroundColor: `${brandColor}18`, color: brandColor,
                      border: `1px solid ${brandColor}40`,
                    }}>
                      {row.industria.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </td>

                  {/* Motivo — oculto en mobile */}
                  <td className="col-hide-mobile" style={{ padding: '10px 16px', fontSize: 12, color: 'var(--txt-4)' }}>
                    {row.motivoPerdida}
                  </td>

                  {/* Fecha perdido — oculta en mobile */}
                  <td className="col-hide-mobile" style={{ padding: '10px 16px' }}>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>
                      {row.fechaPerdido || '—'}
                    </span>
                  </td>

                  {/* Valor perdido */}
                  <td style={{ padding: '10px 16px' }}>
                    <span className="font-mono" style={{ fontSize: 13, fontWeight: 800, color: isTop ? brandColor : 'var(--txt-1)' }}>
                      {formatValor(row.valor)}
                    </span>
                  </td>

                  {/* Pico */}
                  <td style={{ padding: '10px 16px' }}>
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: brandColor }}>
                      {row.mesPico}
                    </span>
                  </td>

                  {/* Acción */}
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: accion.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {accion.label}
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

const thStyle: React.CSSProperties = {
  padding: '6px 16px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--txt-6)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
