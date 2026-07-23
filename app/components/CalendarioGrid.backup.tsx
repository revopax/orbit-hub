

type Estado = 'pico' | 'prep' | 'ok' | 'vacio';

interface CalendarioGridProps {
  meses: string[];
  filas: { industria: string; celdas: Estado[] }[];
  brandColor: string;
}

const CELL_CONFIG: Record<Estado, {
  bg: string; color: string; border: string;
  label: string; leyenda: string; tooltip: string;
}> = {
  pico: {
    bg: '#1A7A3C', color: '#FFFFFF', border: '#1A7A3C',
    label: '▲ Vende',
    leyenda: 'Pico de actividad · máxima disposición de compra',
    tooltip: 'Momento ideal para cerrar — el sector está en su punto más alto de actividad económica.',
  },
  prep: {
    bg: '#92540A', color: '#FFFFFF', border: '#92540A',
    label: '◆ Prepara',
    leyenda: 'Actividad subiendo · califica y agenda propuestas',
    tooltip: 'El sector está acelerando. Califica leads y agenda reuniones antes del pico.',
  },
  ok: {
    bg: '#1E5A9C', color: '#FFFFFF', border: '#1E5A9C',
    label: '● Explora',
    leyenda: 'Sector despertando · primeros contactos',
    tooltip: 'El IGAE empieza a recuperarse. Genera awareness y sienta bases para el ciclo.',
  },
  vacio: {
    bg: 'transparent', color: 'var(--txt-4)', border: 'transparent',
    label: '○ Espera',
    leyenda: 'Actividad baja · monitorear, no priorizar',
    tooltip: 'Sector en reposo. Enfoca recursos en sectores activos este mes.',
  },
};

const CICLO_ORDEN: Estado[] = ['ok', 'prep', 'pico', 'vacio'];

export function CalendarioGrid({ meses, filas, brandColor }: CalendarioGridProps) {
  // Filtrar meses anteriores al mes actual
  const MESES_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const mesActualIdx = new Date().getMonth();
  const idxFiltrar = meses.findIndex(m => {
    const nombreMes = m.toLowerCase().split("'")[0].trim();
    const idx = MESES_ES.indexOf(nombreMes);
    return idx >= mesActualIdx;
  });
  // Debug: si no encuentra ningún mes futuro, mostrar todos
  const idxReal = idxFiltrar >= 0 ? idxFiltrar : 0;
  const mesesFiltrados = meses.slice(idxReal);
  const filasFiltradas = filas.map(f => ({
    ...f,
    celdas: f.celdas.slice(idxReal),
  }));


  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--divider)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>
            {(() => {
              const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
              const mesActual = meses[new Date().getMonth()];
              return `Calendario de prospección · ${mesActual}–dic 2026`;
            })()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
            ¿En qué industrias deberías prospectar este mes?
          </div>
        </div>

        {/* Leyenda horizontal espaciada — 1 fila con descripción inline */}
        <div style={{
          display: 'flex', gap: 0,
          flexWrap: 'wrap', marginTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 12,
        }}>
          {CICLO_ORDEN.map((e, idx) => {
            const s = CELL_CONFIG[e];
            const isLast = idx === CICLO_ORDEN.length - 1;
            return (
              <div key={e} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                flex: '1 1 220px',
                paddingRight: isLast ? 0 : 16,
                borderRight: isLast ? 'none' : '1px solid var(--border-subtle)',
                marginRight: isLast ? 0 : 16,
                paddingBottom: 4,
              }}>
                <div style={{
                  width: 11, height: 11, borderRadius: 3, flexShrink: 0, marginTop: 2,
                  backgroundColor: e === 'vacio' ? 'transparent' : s.bg,
                  border: e === 'vacio' ? '1.5px solid var(--txt-5)' : 'none',
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-2)', lineHeight: 1.3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-3)', lineHeight: 1.4, marginTop: 2 }}>
                    {s.leyenda}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Franja ciclo */}
        <div style={{
          marginTop: 10, padding: '5px 10px',
          background: 'var(--bar-track)', borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: '0.05em' }}>CICLO:</span>
          {CICLO_ORDEN.map((e, i) => (
            <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: e === 'vacio' ? 'var(--txt-5)' : CELL_CONFIG[e].bg }}>
                {CELL_CONFIG[e].label}
              </span>
              {i < CICLO_ORDEN.length - 1 && (
                <span style={{ fontSize: 10, color: 'var(--txt-4)' }}>→</span>
              )}
            </div>
          ))}
          <span style={{ fontSize: 10, color: 'var(--txt-4)', marginLeft: 4 }}>
            · El sector repite este ciclo cada temporada según su comportamiento económico
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="cal-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                padding: '8px 16px', textAlign: 'left',
                fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                minWidth: 180, borderBottom: '1px solid var(--divider)',
              }}>
                Industria
              </th>
              {mesesFiltrados.map(mes => (
                <th key={mes} style={{
                  padding: '8px 12px', textAlign: 'center',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  minWidth: 100, borderBottom: '1px solid var(--divider)',
                }}>
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila, i) => (
              <tr
                key={fila.industria}
                className="table-row"
                style={{ borderBottom: i < filasFiltradas.length - 1 ? '1px solid var(--divider)' : 'none' }}
              >
                <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 500, color: 'var(--txt-3)' }}>
                  {fila.industria}
                </td>
                {fila.celdas.map((estado, j) => {
                  const s = CELL_CONFIG[estado];
                  const isEmpty = estado === 'vacio';
                  return (
                    <td key={j} style={{ padding: '5px 6px', textAlign: 'center', position: 'relative' }}>


                      <div
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 88, height: 28, borderRadius: 8,
                          backgroundColor: s.bg,
                          border: isEmpty ? '1px solid var(--border)' : `1px solid ${s.border}`,
                          fontSize: 10, fontWeight: 600,
                          color: isEmpty ? 'var(--txt-4)' : s.color,
                          padding: '4px 10px', margin: '0 auto',
                          letterSpacing: '0.01em',
                          boxShadow: isEmpty ? 'none' : `0 1px 4px ${s.bg}55`,
                          whiteSpace: 'nowrap',
                          opacity: isEmpty ? 0.7 : 1,
                          cursor: 'default',
                        }}
                      >
                        {s.label}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
