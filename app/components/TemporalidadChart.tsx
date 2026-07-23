import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Filler,
} from 'chart.js';
import type { DataTemporalidad } from '../lib/types';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

interface TemporalidadChartProps {
  data: DataTemporalidad;
  brandColor: string;
  udnNombre: string;
  isDark: boolean;
  dateFrom?: string;
  dateTo?: string;
}

const FALLBACK = ['#FBBF24', '#60A5FA'];

const MES_MAP: Record<string, number> = {
  'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12,
};

function parseLabel(label: string): Date | null {
  const parts = label.replace("'", ' 20').split(' ');
  if (parts.length < 2) return null;
  const mes = MES_MAP[parts[0]];
  const anio = parseInt(parts[1].length === 2 ? `20${parts[1]}` : parts[1]);
  if (!mes || isNaN(anio)) return null;
  return new Date(anio, mes - 1, 1);
}

export function TemporalidadChart({ data, brandColor, udnNombre, isDark, dateFrom: dateFromProp, dateTo: dateToProp, topIndustria }: TemporalidadChartProps & { topIndustria?: { nombre: string; temperatura: string; accion: string } | null }) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const chartRef   = useRef<Chart | null>(null);
  const pickerRef  = useRef<HTMLDivElement>(null);

  const [dateFromLocal, setDateFrom] = useState('2025-04');
  const [dateToLocal,   setDateTo]   = useState('2026-12');
  const dateFrom = dateFromProp ?? dateFromLocal;
  const dateTo   = dateToProp   ?? dateToLocal;
  const [pickerOpen,  setPickerOpen]  = useState(false);

  /* Cerrar picker al click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Filtrar labels y datasets por rango */
  const filteredIndices = data.labels.reduce<number[]>((acc, label, i) => {
    const d = parseLabel(label);
    if (!d) return acc;
    if (dateFrom) {
      const from = new Date(dateFrom + '-01');
      if (d < from) return acc;
    }
    if (dateTo) {
      const to = new Date(dateTo + '-01');
      if (d > to) return acc;
    }
    acc.push(i);
    return acc;
  }, []);

  const filteredLabels = filteredIndices.length > 0
    ? filteredIndices.map(i => data.labels[i])
    : data.labels;

  const getFiltered = (arr: (number | null)[]) =>
    filteredIndices.length > 0 ? filteredIndices.map(i => arr[i] ?? null) : arr;

  const rangeLabel = dateFrom && dateTo
    ? `${dateFrom} – ${dateTo}`
    : dateFrom
    ? `Desde ${dateFrom}`
    : dateTo
    ? `Hasta ${dateTo}`
    : 'Todo el periodo';

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const colors    = data.sectores.map((_, i) => i === 0 ? brandColor : FALLBACK[(i - 1) % FALLBACK.length]);
    const tickColor = isDark ? '#ffffffa6' : '#3D3A6B';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(83,74,183,0.06)';
    const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
    const tooltipBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';

    // En móvil: fijar ancho del canvas para habilitar scroll horizontal
    const isMobileView = window.innerWidth < 768;
    if (isMobileView) {
      canvasRef.current.style.width = '700px';
      canvasRef.current.style.height = '220px';
      canvasRef.current.width = 700;
      canvasRef.current.height = 220;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: filteredLabels,
        datasets: data.sectores.flatMap((s, i) => {
          const col = colors[i];
          return [
            {
              label: s.nombre,
              data: getFiltered(s.historico),
              borderColor: col,
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 6,
              pointBackgroundColor: col,
              pointBorderColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(240,237,248,0.9)',
              pointBorderWidth: 1,
              tension: 0.4,
            },
            {
              label: `${s.nombre} · Proyección`,
              data: getFiltered(s.forecast),
              borderColor: col,
              backgroundColor: `${col}15`,
              fill: false,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4,
              borderDash: [6, 4],
            } as any,
          ];
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: isDark ? '#ffffffe0' : '#3D3A6B',
            bodyColor:  isDark ? '#E2E8F0' : '#1A1714',
            borderColor: tooltipBorder,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (ctx) => ctx.parsed.y !== null
                ? `  ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`
                : '',
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: tickColor, font: { family: 'Inter', size: 11 }, maxRotation: 0, maxTicksLimit: 10 },
          },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: { color: tickColor, font: { family: 'Inter', size: 11 } },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [data, brandColor, isDark, dateFrom, dateTo]);

  const colors = data.sectores.map((_, i) => i === 0 ? brandColor : FALLBACK[(i - 1) % FALLBACK.length]);

  return (
    <div className="card chart-temporal" style={{ overflowY: 'hidden', overflowX: 'visible' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--divider)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt-1)' }}>
            Actividad económica por industria
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-5)', marginTop: 3 }}>
            Histórico y proyección de actividad económica · top industrias {udnNombre}
          </div>
          {/* Badges última/próxima actualización */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
              background: 'rgba(34,197,94,0.12)', color: '#16A34A',
            }}>
              ● Cifras durante abril de 2026
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
              background: 'rgba(251,191,36,0.12)', color: '#D97706',
            }}>
              ◷ Próxima actualización: 23 de julio de 2026
            </span>
          </div>
        </div>

        {/* Derecha: leyenda + filtro periodo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Leyenda */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'flex-end' }}>
            {data.sectores.map((s, i) => (
              <div key={s.nombre} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 18, height: 2.5,
                  backgroundColor: colors[i],
                  borderRadius: 99,
                }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-3)' }}>{s.nombre}</span>
                <span style={{ color: 'var(--txt-6)', fontSize: 11 }}>·</span>
                <div style={{
                  width: 18, height: 2.5,
                  background: `repeating-linear-gradient(90deg, ${colors[i]} 0, ${colors[i]} 4px, transparent 4px, transparent 8px)`,
                  borderRadius: 99,
                }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-4)', fontStyle: 'italic' }}>Proyección</span>
              </div>
            ))}
          </div>

          {/* Filtro de periodo */}
          <div ref={pickerRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setPickerOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                color: 'var(--txt-4)', fontSize: 12,
                cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif',
                transition: 'border-color 0.15s',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 1v2M10 1v2M1 5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {rangeLabel}
            </button>

            {/* Panel picker */}
            {pickerOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 200,
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 12, padding: 16, minWidth: 270,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Filtrar periodo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Desde</div>
                    <input
                      type="month"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      style={{
                        width: '100%', padding: '5px 8px', borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)', color: 'var(--txt-1)',
                        fontSize: 12, fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Hasta</div>
                    <input
                      type="month"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      style={{
                        width: '100%', padding: '5px 8px', borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--card-bg)', color: 'var(--txt-1)',
                        fontSize: 12, fontFamily: 'Inter, sans-serif',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {[
                    { label: 'Este año', from: `${new Date().getFullYear()}-01`, to: `${new Date().getFullYear()}-12` },
                    { label: '2025–2026', from: '2025-01', to: '2026-12' },
                    { label: '2024–2026', from: '2024-01', to: '2026-12' },
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}
                      style={{
                        flex: 1, padding: '4px 0', borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--txt-3)',
                        fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    style={{
                      flex: 1, padding: '6px 0', borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'transparent', color: 'var(--txt-4)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setPickerOpen(false)}
                    style={{
                      flex: 2, padding: '6px 0', borderRadius: 6,
                      border: 'none', background: brandColor,
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leyenda base 100 */}
      <div style={{
        margin: '0 18px 4px',
        padding: '6px 10px',
        background: 'rgba(255,255,255,.03)',
        border: '1px solid var(--border)',
        borderRadius: 7,
        fontSize: 10, color: 'var(--txt-5)', lineHeight: 1.5,
      }}>
        <span style={{ fontWeight: 700, color: 'var(--txt-3)' }}>Índice (base 100)</span>
        {' · '}Valor relativo de actividad económica — 100 representa el nivel de referencia histórico. Por encima = mayor actividad que el promedio histórico.
      </div>
      {/* Canvas */}
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '8px 18px 0px', gap: 4 }}>
        {/* Etiqueta eje Y — fuera del gráfico */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 16, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 600, color: 'var(--txt-6)',
            textTransform: 'uppercase', letterSpacing: '.06em',
            whiteSpace: 'nowrap',
            transform: 'rotate(-90deg)',
            display: 'block',
          }}>
            Índice (base 100)
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chart-scroll-mobile">
            <div className="chart-wrap" style={{ height: 220, minWidth: 'min(100%, 700px)' }}>
              <canvas ref={canvasRef} style={{ minWidth: 700 }} />
            </div>
          </div>
          {/* Etiqueta eje X */}
          <div style={{
            textAlign: 'center', marginTop: 4,
            fontSize: 9, fontWeight: 600, color: 'var(--txt-6)',
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            Periodo
          </div>
          {/* Insight dinámico */}
          {(() => {
            if (!data.sectores || filteredIndices.length < 6) return null;
            // Top 2 meses con mayor actividad proyectada (todos los sectores combinados)
            const forecastSuma: Record<string, number> = {};
            const hoy = new Date();
            filteredIndices.forEach(i => {
              const label = data.labels[i];
              const d = parseLabel(label);
              if (!d || d <= hoy) return; // solo meses futuros
              let suma = 0;
              data.sectores.forEach(sec => { suma += (sec.forecast[i] ?? 0); });
              forecastSuma[label] = suma;
            });
            const topMeses = Object.entries(forecastSuma)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .map(([m]) => m);
            // Sector caliente actual (mayor valor histórico reciente)
            const nombreCorto = (topIndustria?.nombre ?? data.sectores[0]?.nombre ?? '')
              .replace(/^\d+[-\d]*\s+/, '')
              .replace('Servicios profesionales, científicos y técnicos', 'Servicios profesionales')
              .replace('Industrias manufactureras', 'Manufactura')
              .replace('Servicios de alojamiento temporal y de preparación de alimentos y bebidas', 'Alimentos y bebidas');
            const tempLabel = topIndustria?.temperatura ?? 'caliente';
            const accion = topIndustria?.accion ?? 'Actúa ahora';
            const bgColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
            return (
              <div style={{ margin: '12px 0 0', padding: '12px 16px', borderRadius: 10, background: bgColor, border: `1px solid ${brandColor}30`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {topMeses.length > 0 && (
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: brandColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      Próximos meses de mayor actividad
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' }}>
                      {topMeses.join(' · ')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--txt-4)', marginTop: 2 }}>
                      Basado en proyección de los {data.sectores.length} sectores top
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: brandColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    Sector donde más perdiste por timing
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' }}>
                    {nombreCorto}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-4)', marginTop: 2 }}>
                    Fase <span style={{ fontWeight: 700, color: brandColor, textTransform: 'capitalize' }}>{tempLabel}</span> · {accion}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-5)', marginTop: 4 }}>
                    La curva muestra cuándo este sector históricamente tiene mayor actividad — llega antes del pico
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
