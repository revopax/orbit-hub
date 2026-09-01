import { Fragment, useState, useEffect } from 'react';
import type { EmpresaPico } from '../../lib/types';


type Estado = 'pico' | 'prep' | 'ok' | 'vacio';

interface CalendarioGridProps {
  meses: string[];
  filas: { industria: string; celdas: Estado[] }[];
  brandColor: string;
  udnId?: string;
  empresasPico?: EmpresaPico[];
  calendarioCompleto?: { meses: string[]; filas: { industria: string; celdas: string[] }[] } | null;
  picoBusquedaMes?: string | null;
}

const CELL_CONFIG: Record<Estado, {
  bg: string; color: string; border: string;
  label: string; leyenda: string; tooltip: string;
}> = {
  pico: {
    bg: '#1A7A3C', color: '#FFFFFF', border: '#1A7A3C',
    label: '▲ Contacta',
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

export function CalendarioGrid({ meses, filas, brandColor, udnId, empresasPico, calendarioCompleto, picoBusquedaMes }: CalendarioGridProps) {
  const [filasExtra, setFilasExtra] = useState<{ industria: string; celdas: string[] }[]>([]);
  const [expandido, setExpandido] = useState(false);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [dragCodigo, setDragCodigo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);

  useEffect(() => {
    if (!udnId) return;
    fetch(`/api/calendario-extra?udn=${udnId}`)
      .then(r => r.json())
      .then(d => {
        const filas = (d.data ?? []).map((row: any) => ({
          industria: row.sector_nombre,
          celdas: [] as string[],
        }));
        // Reconstruir celdas desde calendarioCompleto usando el nombre normalizado
        const normalizar = (s: string) => s.replace(/^[\d-]+\s*/, '').trim().toLowerCase();
        const conCeldas = filas.map((f: any) => {
          const match = (calendarioCompleto?.filas ?? []).find(cc => normalizar(cc.industria) === normalizar(f.industria));
          return { industria: f.industria, celdas: match?.celdas ?? [] };
        });
        setFilasExtra(conCeldas);
      })
      .catch(() => {});
  }, [udnId, calendarioCompleto]);

  function quitarFilaExtra(industria: string) {
    setFilasExtra(prev => prev.filter(f => f.industria !== industria));
    setHayCambiosSinGuardar(true);
  }

  function guardarCambios() {
    if (!udnId) return;
    setGuardando(true);
    fetch('/api/calendario-extra', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        udn: udnId,
        filas: filasExtra.map(f => ({ sector_nombre: f.industria, mes_pico: '' })),
      }),
    })
      .then(() => setHayCambiosSinGuardar(false))
      .finally(() => setGuardando(false));
  }
  const [industriasExpandidas, setIndustriasExpandidas] = useState<string[]>([]);
  const [subramasExpandidas, setSubramasExpandidas] = useState<string[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'objetivo' | 'icp'>('all');
  const [filtroAvanzo, setFiltroAvanzo] = useState<'all' | 'avanzo' | 'descalifico'>('all');

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
  const idxReal = expandido ? 0 : (idxFiltrar >= 0 ? idxFiltrar : 0);
  const mesesFiltrados = meses.slice(idxReal);
  const filasFiltradas = filas.map(f => ({
    ...f,
    celdas: f.celdas.slice(idxReal),
  }));
  const filasExtraFiltradas = filasExtra.map(f => ({ ...f, celdas: f.celdas.slice(idxReal) }));
  const normNombre = (s: string) => s.replace(/^[\d-]+\s*/, '').trim().toLowerCase();
  const nombresActuales = new Set([...filas, ...filasExtra].map(f => normNombre(f.industria)));
  const candidatas = (calendarioCompleto?.filas ?? [])
    .filter(f => !nombresActuales.has(normNombre(f.industria)))
    .filter(f => f.celdas.slice(idxReal).some(c => c === 'pico' || c === 'prep'))
    .slice(0, 5);
  function onDropIndustria() {
    if (!dragCodigo) return;
    const fila = (calendarioCompleto?.filas ?? []).find(f => f.industria === dragCodigo);
    if (fila && !filasExtra.some(f => f.industria === fila.industria)) {
      setFilasExtra(prev => [...prev, fila]);
      setHayCambiosSinGuardar(true);
    }
    setDragCodigo(null);
  }


  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div
      className="card"
      style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}
      onDragOver={e => e.preventDefault()}
      onDrop={onDropIndustria}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>
              {(() => {
                const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                const mesActual = meses[new Date().getMonth()];
                return expandido ? 'Calendario de prospección · ene-dic 2026' : `Calendario de prospección · ${mesActual}–dic 2026`;
              })()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
              ¿En qué industrias deberías prospectar este mes? Llegar antes al pico de dinamismo económico de una industria eleva la probabilidad de un MQL calificado; llegar tarde, el riesgo de descalificación por timing o presupuesto — despliega una industria para ver el avance real.
            </div>
          </div>
          <button
            onClick={() => setExpandido(v => !v)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: expandido ? brandColor + '15' : 'var(--bg)', color: expandido ? brandColor : 'var(--txt-3)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {expandido ? 'Ver solo próximos meses' : 'Ver año completo (ene-dic)'}
          </button>
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
                  padding: expandido ? '8px 6px' : '8px 12px', textAlign: 'center',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  minWidth: expandido ? 68 : 100, borderBottom: '1px solid var(--divider)',
                  borderLeft: '1px solid var(--divider)',
                }}>
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...filasFiltradas, ...filasExtraFiltradas].map((fila, i) => (
              <Fragment key={fila.industria}>
                <tr
                  key={fila.industria}
                  className="table-row"
                  style={{ borderBottom: 'none' }}
                >
                  <td
                    style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 500, color: 'var(--txt-3)', width: 110, maxWidth: 110, lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word', userSelect: 'none' }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, width: '100%' }}>
                      <span onClick={() => toggleIndustria(fila.industria)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                          style={{ transform: industriasExpandidas.includes(fila.industria) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        {fila.industria.replace(/^[\d-]+\s*/, '')}
                      </span>
                      {filasExtra.some(f => f.industria === fila.industria) && (
                        <span
                          onClick={(e) => { e.stopPropagation(); quitarFilaExtra(fila.industria); }}
                          style={{ fontSize: 12, color: 'var(--txt-5)', cursor: 'pointer', flexShrink: 0, padding: '0 2px' }}
                          title="Quitar industria"
                        >
                          {'\u2715'}
                        </span>
                      )}
                    </span>
                  </td>
                  {fila.celdas.map((estado, j) => {
                    const s = CELL_CONFIG[estado];
                    const isEmpty = estado === 'vacio';
                    return (
                      <td key={j} style={{ padding: '5px 6px 4px', textAlign: 'center', borderLeft: '1px solid var(--divider)' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: expandido ? 58 : 88, height: 28, borderRadius: 8,
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
                {picoBusquedaMes && (() => {
                  const MESES_ES2 = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
                  const [anioP, mesP] = picoBusquedaMes.split('-');
                  const idxPico = mesesFiltrados.findIndex(m => MESES_ES2[parseInt(mesP,10)-1] === m.toLowerCase().split("'")[0].trim());
                  const idxContacta = fila.celdas.findIndex((c, idx) => c === 'pico' && idx >= idxPico);
                  if (idxPico < 0 || idxContacta < 0 || idxContacta === idxPico) return null;
                  const meses_diff = idxContacta - idxPico;
                  const numCols = mesesFiltrados.length;
                  const pctInicio = ((idxPico + 0.5) / numCols) * 100;
                  const pctFin = ((idxContacta + 0.5) / numCols) * 100;
                  return (
                    <tr style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td colSpan={numCols + 1} style={{ padding: '2px 12px 10px', position: 'relative' }}>
                        <div style={{ position: 'relative', height: 20 }}>
                          <div style={{
                            position: 'absolute', top: 9, height: 1, background: 'var(--border)',
                            left: `${pctInicio}%`, width: `${pctFin - pctInicio}%`,
                          }} />
                          <div style={{ position: 'absolute', top: 2, left: `${pctInicio}%`, transform: 'translateX(-50%)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2.5">
                              <circle cx="10" cy="10" r="6" />
                              <line x1="15" y1="15" x2="20" y2="20" />
                            </svg>
                          </div>
                          <div style={{ position: 'absolute', top: 2, left: `${pctFin}%`, transform: 'translateX(-50%)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="4" />
                            </svg>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--txt-4)', marginTop: 2, textAlign: 'left' }}>
                          {meses_diff} {meses_diff === 1 ? 'mes' : 'meses'} de anticipación
                        </div>
                      </td>
                    </tr>
                  );
                })()}
                {industriasExpandidas.includes(fila.industria) && (() => {
                  const empresasIndustria = (empresasPico ?? []).filter(e => {
                    if (e.sector !== fila.industria || e.tipoObjeto !== 'contacto') return false;
                    if (filtroTipo === 'objetivo' && !e.es_cuenta_objetivo) return false;
                    if (filtroTipo === 'icp' && !(e.icp_industria_match && !e.es_cuenta_objetivo)) return false;
                    if (filtroAvanzo === 'avanzo' && !e.avanzo) return false;
                    if (filtroAvanzo === 'descalifico' && e.avanzo) return false;
                    return true;
                  });
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
                                      <tr>
                                        <td colSpan={4} style={{ padding: '6px 16px 4px', borderBottom: '1px solid var(--divider)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                            <select
                                              value={filtroTipo}
                                              onChange={(ev) => setFiltroTipo(ev.target.value as typeof filtroTipo)}
                                              style={{
                                                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                border: '1px solid var(--divider)', background: 'var(--bg)', color: 'var(--txt-3)', cursor: 'pointer',
                                              }}
                                            >
                                              <option value="all">Todas</option>
                                              <option value="objetivo">⭐ Objetivo</option>
                                              <option value="icp">ICP ✓</option>
                                            </select>
                                            <select
                                              value={filtroAvanzo}
                                              onChange={(ev) => setFiltroAvanzo(ev.target.value as typeof filtroAvanzo)}
                                              style={{
                                                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                border: '1px solid var(--divider)', background: 'var(--bg)', color: 'var(--txt-3)', cursor: 'pointer',
                                              }}
                                            >
                                              <option value="all">Todos</option>
                                              <option value="avanzo">Avanzaron</option>
                                              <option value="descalifico">Descalificados</option>
                                            </select>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr style={{ borderBottom: '1px solid var(--divider)', textAlign: 'left' }}>
                                        <th style={thSub}>Empresa</th>
                                        <th style={thSub}>SDR</th>
                                        <th style={thSub}>Fecha calificación MQL</th>
                                        <th style={thSub}>Motivo descalificación</th>
                                        <th style={thSub}>Link</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {emps.map((e, ei) => (
                                        <tr key={ei} style={{ borderBottom: ei < emps.length - 1 ? '1px solid var(--divider)' : 'none', background: 'var(--bg)' }}>
                                          <td style={{ padding: '8px 16px', fontSize: 12, fontWeight: 500, color: 'var(--txt-2)' }}>{e.empresa}</td>
                                          <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{e.sdr && e.sdr !== 'nan' ? e.sdr : '—'}</td>
                                          <td style={{ padding: '8px 16px' }}><span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>{e.fechaCalificacionMQL || '—'}</span></td>
                                          <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{!e.avanzo && e.motivoPerdida && e.motivoPerdida !== 'nan' ? e.motivoPerdida : '—'}</td>
                                          <td style={{ padding: '8px 16px' }}>
                                            {e.idRegistro ? (
                                              <a href={'https://app.hubspot.com/contacts/24172997/record/0-1/' + e.idRegistro}
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div style={{ width: panelAbierto ? 260 : 44, flexShrink: 0, transition: 'width 0.2s' }}>
      <div className="card" style={{ overflow: 'visible' }}>
        <div
          onClick={() => setPanelAbierto(o => !o)}
          style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: panelAbierto ? '10px 12px' : '14px 6px', gap: 8,
            cursor: 'pointer', borderBottom: panelAbierto ? '1px solid var(--divider)' : 'none',
          }}
        >
          <span style={{ fontSize: 12 }}>{panelAbierto ? '\u25c0' : '\u25b6'}</span>
          {panelAbierto && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-2)' }}>Nuevas Industrias</span>}
          {!panelAbierto && (
            <span style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
              fontSize: 11, fontWeight: 700, color: brandColor, background: '#fff',
              border: `1px solid ${brandColor}33`, borderRadius: 20, padding: '5px 12px',
              whiteSpace: 'nowrap', boxShadow: `0 2px 8px ${brandColor}22`, zIndex: 5,
            }}>Nuevas Industrias</span>
          )}
        </div>
        {panelAbierto && (
          <div style={{ padding: '8px 12px' }}>
            <p style={{ fontSize: 10.5, color: 'var(--txt-4)', margin: '0 0 10px' }}>
              Industrias con ventana proxima que aun no le has vendido. Arrastralas a la tabla para sumarlas.
            </p>
            {candidatas.length === 0 && (
              <p style={{ fontSize: 11, color: 'var(--txt-5)' }}>Sin candidatas por ahora.</p>
            )}
            {candidatas.map(c => (
              <div
                key={c.industria}
                draggable
                onDragStart={() => setDragCodigo(c.industria)}
                style={{
                  padding: '8px 10px', marginBottom: 6, borderRadius: 8,
                  border: '1px solid var(--divider)', background: 'var(--bg)',
                  fontSize: 11, cursor: 'grab',
                }}
              >
                {c.industria.replace(/^[\d-]+\s*/, '')}
              </div>
            ))}
            {hayCambiosSinGuardar && (
              <button
                onClick={guardarCambios}
                disabled={guardando}
                style={{
                  width: '100%', marginTop: 8, padding: '7px 0', borderRadius: 8, border: 'none',
                  background: brandColor, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
