import { Fragment, useState } from 'react';
import type { EmpresaPico } from '../../lib/types';


type Estado = 'pico' | 'prep' | 'ok' | 'vacio';

interface CalendarioGridProps {
  meses: string[];
  filas: { industria: string; celdas: Estado[] }[];
  brandColor: string;
  udnId?: string;
  empresasPico?: EmpresaPico[];
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

const thSub: React.CSSProperties = {
  padding: '5px 16px',
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--txt-5)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

// Ciclos de venta por UDN y servicio — basado en 6Sense B2B 2025, HubSpot State of Sales 2024
// y datos empíricos de UIX (William) y MU (Saray). Semanas = ciclo promedio hasta cierre.
const GANTT_SERVICIOS: Record<string, { udn: string; servicio: string; semanas: number; fuente: string }[]> = {
  'Comercio al por menor': [
    { udn: 'MU',   servicio: 'Activaciones BTL',   semanas: 4,  fuente: 'Plan comercial MU' },
    { udn: 'PE',   servicio: 'DOOH / Programmatic', semanas: 3,  fuente: 'Ciclo medios digitales' },
    { udn: 'MEXA', servicio: 'Campañas de marca',   semanas: 6,  fuente: 'Servicios profesionales B2B' },
  ],
  'Industrias manufactureras': [
    { udn: 'MU',   servicio: 'Stands / Expos',      semanas: 8,  fuente: 'Plan comercial MU · 6-10 sem' },
    { udn: 'MU',   servicio: 'Eventos corporativos', semanas: 12, fuente: 'Plan comercial MU · 2-3 meses' },
    { udn: 'HOF',  servicio: 'Producción audiovisual', semanas: 6, fuente: 'Industria producción B2B' },
  ],
  'Comercio al por mayor': [
    { udn: 'MU',   servicio: 'Activaciones BTL',    semanas: 4,  fuente: 'Plan comercial MU' },
    { udn: 'PE',   servicio: 'DOOH',                semanas: 3,  fuente: 'Ciclo medios digitales' },
  ],
  'Servicios profesionales, científicos y técnicos': [
    { udn: 'UIX',  servicio: 'Consultoría UX/UI',   semanas: 8,  fuente: 'William UIX · 6-10 sem' },
    { udn: 'UIX',  servicio: 'Service / Product Design', semanas: 16, fuente: 'William UIX · 3-4 meses' },
    { udn: 'RL',   servicio: 'Investigación de mercados', semanas: 6, fuente: 'Estudios B2B' },
    { udn: 'MEXA', servicio: 'Consultoría de marca', semanas: 8, fuente: 'Servicios profesionales B2B' },
  ],
  'Servicios financieros y de seguros': [
    { udn: 'UIX',  servicio: 'UX banca digital',    semanas: 10, fuente: 'William UIX · enterprise' },
    { udn: 'RL',   servicio: 'NPS / Mystery Shopper', semanas: 5, fuente: 'Estudios mercado B2B' },
    { udn: 'ZU',   servicio: 'Capacitaciones',       semanas: 3,  fuente: 'RH ciclo corto' },
  ],
  'Servicios de salud y de asistencia social': [
    { udn: 'UIX',  servicio: 'UX apps salud',        semanas: 12, fuente: 'Software B2B ~3 meses' },
    { udn: 'RL',   servicio: 'NPS hospitalario',      semanas: 5,  fuente: 'Estudios mercado B2B' },
  ],
  'Corporativos': [
    { udn: 'ZU',   servicio: 'Capacitaciones',        semanas: 3,  fuente: 'RH ciclo corto' },
    { udn: 'MU',   servicio: 'Eventos corporativos',  semanas: 12, fuente: 'Plan comercial MU' },
    { udn: 'UIX',  servicio: 'Workshops',              semanas: 4,  fuente: 'William UIX' },
  ],
  'Información en medios masivos': [
    { udn: 'HOF',  servicio: 'Producción audiovisual', semanas: 6, fuente: 'Industria producción' },
    { udn: 'PE',   servicio: 'Programmatic',           semanas: 2, fuente: 'Ciclo medios digitales' },
    { udn: 'MEXA', servicio: 'Campañas digitales',     semanas: 5, fuente: 'Agencias publicidad B2B' },
  ],
  'Servicios de alojamiento temporal y preparación de alimentos y bebidas': [
    { udn: 'MU',   servicio: 'Eventos corporativos',  semanas: 10, fuente: 'Plan comercial MU' },
    { udn: 'MU',   servicio: 'Activaciones BTL',      semanas: 4,  fuente: 'Plan comercial MU' },
    { udn: 'PE',   servicio: 'DOOH',                  semanas: 3,  fuente: 'Ciclo medios digitales' },
  ],
}
const UDN_COLORS_CAL: Record<string, string> = {
  UIX: '#8C59FE', MU: '#DCFF00', PE: '#FF7600', ZU: '#61ACAA',
  NC: '#3E31CC', HOF: '#3274FC', RL: '#770EB7', MEXA: '#FD00C7',
}

export function CalendarioGrid({ meses, filas, brandColor, udnId, empresasPico }: CalendarioGridProps) {
  const [industriasExpandidas, setIndustriasExpandidas] = useState<string[]>([]);
  const [subramasExpandidas, setSubramasExpandidas] = useState<string[]>([]);

  function toggleIndustria(industria: string) {
    setIndustriasExpandidas(prev =>
      prev.includes(industria) ? prev.filter(i => i !== industria) : [...prev, industria]
    );
  }

  function toggleSubrama(key: string) {
    setSubramasExpandidas(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }
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
                padding: '6px 16px 2px', textAlign: 'left',
                fontSize: 9, fontWeight: 600, color: 'var(--txt-5)',
                borderBottom: 'none',
              }}></th>
              {(() => {
                const anioBase = new Date().getFullYear();
                const grupos: { q: number; anio: number; count: number }[] = [];
                mesesFiltrados.forEach(mes => {
                  const nombreMes = mes.toLowerCase().split("'")[0].trim();
                  const idx = MESES_ES.indexOf(nombreMes);
                  const q = Math.floor(idx / 3) + 1;
                  const anio = idx < mesActualIdx ? anioBase + 1 : anioBase;
                  const last = grupos[grupos.length - 1];
                  if (last && last.q === q && last.anio === anio) last.count++;
                  else grupos.push({ q, anio, count: 1 });
                });
                return grupos.map((g, i) => (
                  <th key={i} colSpan={g.count} style={{
                    padding: '6px 12px 2px', textAlign: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--txt-4)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    borderBottom: 'none',
                  }}>
                    {`Q${g.q} ${g.anio}`}
                  </th>
                ));
              })()}
            </tr>
            <tr>
              <th style={{
                padding: '2px 12px 8px', textAlign: 'left',
                fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                width: 110, maxWidth: 110, borderBottom: '1px solid var(--divider)',
              }}>
                Industria
              </th>
              {mesesFiltrados.map(mes => (
                <th key={mes} style={{
                  padding: '8px 12px', textAlign: 'center',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  minWidth: 100, borderBottom: '1px solid var(--divider)',
                  borderLeft: '1px solid var(--divider)',
                }}>
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila, i) => (
              <Fragment key={fila.industria}>
                <tr
                  key={fila.industria}
                  className="table-row"
                  style={{ borderBottom: 'none' }}
                >
                  <td
                    onClick={() => toggleIndustria(fila.industria)}
                    style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 500, color: 'var(--txt-3)', width: 110, maxWidth: 110, lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word', cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                        style={{ transform: industriasExpandidas.includes(fila.industria) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {fila.industria}
                    </span>
                  </td>
                  {fila.celdas.map((estado, j) => {
                    const s = CELL_CONFIG[estado];
                    const isEmpty = estado === 'vacio';
                    return (
                      <td key={j} style={{ padding: '5px 6px 4px', textAlign: 'center', borderLeft: '1px solid var(--divider)' }}>
                        <div style={{
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
                        }}>
                          {s.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
                {industriasExpandidas.includes(fila.industria) && (() => {
                  const empresasIndustria = (empresasPico ?? []).filter(e => e.sector === fila.industria && e.tipoObjeto === 'negocio');
                  const grupoMap: Record<string, EmpresaPico[]> = {};
                  for (const e of empresasIndustria) {
                    const key = (e.subrama && e.subrama.trim() && e.subrama !== 'None') ? e.subrama.trim() : e.sector || 'Sin clasificar';
                    (grupoMap[key] = grupoMap[key] || []).push(e);
                  }
                  const grupos = Object.entries(grupoMap);

                  if (grupos.length === 0) {
                    return (
                      <tr>
                        <td colSpan={mesesFiltrados.length + 1} style={{ padding: '10px 16px', background: 'var(--bg)', fontSize: 11.5, color: 'var(--txt-4)' }}>
                          Sin negocios registrados para esta industria.
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <Fragment>
                      {grupos.map(([subramaName, emps], gi) => {
                        const subKey = `cal_${fila.industria}_${gi}`;
                        const subExp = subramasExpandidas.includes(subKey);
                        return (
                          <Fragment key={subKey}>
                            <tr
                              onClick={() => toggleSubrama(subKey)}
                              style={{ background: brandColor + '0A', borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}
                            >
                              <td colSpan={mesesFiltrados.length + 1} style={{ padding: '7px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 10, color: 'var(--txt-5)' }}>{subExp ? '▾' : '▸'}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-2)' }}>{subramaName}</span>
                                  <span style={{ fontSize: 10, color: 'var(--txt-5)', fontWeight: 500 }}>
                                    {emps.length} {emps.length === 1 ? 'empresa' : 'empresas'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {subExp && (
                              <tr style={{ background: brandColor + '06', borderBottom: '1px solid var(--divider)' }}>
                                <td colSpan={mesesFiltrados.length + 1} style={{ padding: 0 }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid var(--divider)', textAlign: 'left' }}>
                                        <th style={thSub}>Empresa</th>
                                        <th style={thSub}>Propietario del negocio</th>
                                        <th style={thSub}>Fecha creación</th>
                                        <th style={thSub}>Motivo pérdida</th>
                                        <th style={thSub}>Fecha perdido</th>
                                        <th style={thSub}>Valor</th>
                                        <th style={thSub}>Link</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {emps.map((e, ei) => (
                                        <tr key={ei} style={{ borderBottom: ei < emps.length - 1 ? '1px solid var(--divider)' : 'none', background: 'var(--bg)' }}>
                                          <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 500, color: 'var(--txt-2)' }}>{e.empresa}</td>
                                          <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{e.generadoPor && e.generadoPor !== 'nan' ? e.generadoPor : '—'}</td>
                                          <td style={{ padding: '8px 16px' }}><span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>{e.fechaCreacion || '—'}</span></td>
                                          <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{e.motivoPerdida && e.motivoPerdida !== 'nan' ? e.motivoPerdida : '—'}</td>
                                          <td style={{ padding: '8px 16px' }}><span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>{e.fechaPerdido && e.fechaPerdido !== 'nan' ? e.fechaPerdido : '—'}</span></td>
                                          <td style={{ padding: '8px 16px' }}><span className="font-mono" style={{ fontSize: 12, fontWeight: 800, color: 'var(--txt-1)' }}>{typeof e.valor === 'number' ? '$' + Number(e.valor).toLocaleString() : (e.valor || '—')}</span></td>
                                          <td style={{ padding: '8px 16px' }}>
                                            {e.tipoObjeto === 'negocio' && e.idRegistro ? (
                                              <a href={'https://app.hubspot.com/contacts/24172997/record/0-3/' + e.idRegistro}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: 11, fontWeight: 600, color: brandColor, textDecoration: 'none' }}
                                              >
                                                Ver en HubSpot
                                              </a>
                                            ) : (
                                              <span style={{ fontSize: 11, color: 'var(--txt-6)' }}>—</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </Fragment>
                  );
                })()}
                <tr>
                  <td style={{ padding: '4px 12px 10px 12px', background: 'var(--bg)', width: 110, maxWidth: 110 }}></td>
                  <td colSpan={mesesFiltrados.length} style={{ padding: '4px 16px 10px 16px', background: 'var(--bg)', position: 'relative' }}>
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: 16, right: 16,
                      backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(${100 / mesesFiltrados.length}% - 1px), var(--divider) calc(${100 / mesesFiltrados.length}% - 1px), var(--divider) calc(${100 / mesesFiltrados.length}%))`,
                      pointerEvents: 'none', opacity: 0.6,
                    }} />
                    {(GANTT_SERVICIOS[fila.industria]?.filter(srv => !udnId || srv.udn === udnId).length ?? 0) > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {GANTT_SERVICIOS[fila.industria].filter(srv => !udnId || srv.udn === udnId).map((srv, si) => {
                          const color = UDN_COLORS_CAL[srv.udn] || '#888'
                          const isLight = color === '#DCFF00'
                          const totalCols = mesesFiltrados.length
                          const semanasEnMeses = srv.semanas / 4.3
                          const barCols = Math.max(1, Math.round(semanasEnMeses))
                          const barPct = Math.min(100, (barCols / totalCols) * 100)
                          return (
                            <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                                background: color + '22', color: isLight ? '#7a6a00' : color,
                                border: `1px solid ${color}44`, flexShrink: 0, minWidth: 32, textAlign: 'center',
                              }}>{srv.udn}</span>
                              <span style={{ fontSize: 10, color: 'var(--txt-4)', flexShrink: 0, minWidth: 140 }}>{srv.servicio}</span>
                              <div style={{ flex: 1, height: 14, background: 'var(--bar-track)', borderRadius: 5, overflow: 'hidden', minWidth: 80 }}>
                                <div style={{ width: `${barPct}%`, height: '100%', borderRadius: 5, background: color, opacity: 0.85 }} />
                              </div>
                              <span style={{ fontSize: 9, color: 'var(--txt-5)', flexShrink: 0, whiteSpace: 'nowrap' }}>{srv.semanas} sem</span>
                            </div>
                          )
                        })}
                        <div style={{ fontSize: 9, color: 'var(--txt-5)', marginTop: 2, fontStyle: 'italic' }}>
                          Ciclo estimado de prospección → cierre · Fuente: HubSpot 2024, 6Sense 2025, datos UIX/MU
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: 4 }} />
                    )}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
