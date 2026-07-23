import { useState, useEffect, useRef, useMemo } from 'react';

interface RescueItem {
  motivoPerdida?: string;
  [key: string]: unknown;
}

interface RadarMotivosProps {
  rescueData: RescueItem[];
  brandColor: string;
  textColor: string;
  isDark: boolean;
}

// Normaliza y agrupa motivos similares
function normalizarMotivo(m: string): string {
  const s = m.trim();
  if (!s || s === 'nan' || s === 'None' || s === 'Sin registro' || s === 'Desconocido') return '';
  if (s.toLowerCase().includes('presupuesto')) return 'Sin presupuesto';
  return s;
}

function getTop6(items: RescueItem[]): { label: string; count: number }[] {
  const counter: Record<string, number> = {};
  for (const item of items) {
    const raw = item.motivoPerdida ?? '';
    const norm = normalizarMotivo(raw);
    if (!norm) continue;
    counter[norm] = (counter[norm] ?? 0) + 1;
  }
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));
}

// Puntos del polígono radar
function radarPoints(values: number[], cx: number, cy: number, r: number): string {
  const n = values.length;
  return values
    .map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + r * v * Math.cos(angle);
      const y = cy + r * v * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');
}

function axisPoint(i: number, n: number, cx: number, cy: number, r: number) {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function labelPoint(i: number, n: number, cx: number, cy: number, r: number) {
  const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
  const pad = 22;
  return { x: cx + (r + pad) * Math.cos(angle), y: cy + (r + pad) * Math.sin(angle) };
}

export function RadarMotivos({ rescueData, brandColor, textColor, isDark }: RadarMotivosProps) {
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered]   = useState<number | null>(null);
  const rafRef  = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  const motivos = useMemo(() => getTop6(rescueData), [rescueData]);
  const n = motivos.length;

  useEffect(() => {
    startRef.current = null;
    setProgress(0);
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / 1000, 1);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [rescueData]);

  if (n === 0) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
        <span style={{ color: 'var(--txt-5)', fontSize: 13 }}>Sin datos de motivos de pérdida</span>
      </div>
    );
  }

  const maxCount = Math.max(...motivos.map(m => m.count), 1);
  const values   = motivos.map(m => m.count / maxCount); // 0–1

  const cx = 130, cy = 130, r = 95;
  const rings = [0.25, 0.5, 0.75, 1];

  const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const axisColor  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
  const txtColor   = isDark ? '#ffffffe8' : '#475569';
  const fillColor  = brandColor + '33'; // 20% opacity
  const strokeColor = brandColor;

  // Puntos animados
  const animValues = values.map(v => v * progress);
  const polyPoints = radarPoints(animValues, cx, cy, r);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt-1)' }}>Motivos de pérdida</div>
        <div style={{ fontSize: 12, color: 'var(--txt-5)', marginTop: 3 }}>Distribución por razón de descalificación</div>
      </div>

      {/* SVG Radar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 4px 0' }}>
        <svg width={260} height={260} viewBox="0 0 260 260" style={{ overflow: 'visible' }}>

          {/* Anillos de referencia */}
          {rings.map((ring, ri) => (
            <polygon
              key={ri}
              points={radarPoints(Array(n).fill(ring), cx, cy, r)}
              fill="none"
              stroke={gridColor}
              strokeWidth="1"
            />
          ))}

          {/* Ejes */}
          {motivos.map((_, i) => {
            const pt = axisPoint(i, n, cx, cy, r);
            return (
              <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y}
                stroke={axisColor} strokeWidth="1" />
            );
          })}

          {/* Polígono animado */}
          <polygon
            points={polyPoints}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ transition: 'points 0.05s linear' }}
          />

          {/* Puntos en vértices */}
          {motivos.map((m, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            const v = animValues[i];
            const px = cx + r * v * Math.cos(angle);
            const py = cy + r * v * Math.sin(angle);
            const isHov = hovered === i;
            return (
              <circle
                key={i}
                cx={px} cy={py} r={isHov ? 6 : 4}
                fill={brandColor}
                stroke={textColor}
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'r 0.15s ease, filter 0.15s' }}
                filter={isHov ? `drop-shadow(0 0 6px ${brandColor})` : undefined}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Labels de eje */}
          {motivos.map((m, i) => {
            const lp = labelPoint(i, n, cx, cy, r);
            const anchor = lp.x < cx - 5 ? 'end' : lp.x > cx + 5 ? 'start' : 'middle';
            // Truncar label largo
            const short = m.label;
            return (
              <text
                key={i}
                x={lp.x} y={lp.y + 4}
                textAnchor={anchor}
                fontSize="11"
                fontWeight={hovered === i ? '700' : '500'}
                fill={hovered === i ? brandColor : (isDark ? '#E2E8F0' : '#1E293B')}
                fontFamily="Inter, sans-serif"
                style={{ cursor: 'pointer', transition: 'fill 0.15s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {short}
              </text>
            );
          })}

          {/* Tooltip en hover */}
          {hovered !== null && progress > 0.5 && (() => {
            const m = motivos[hovered];
            const angle = (Math.PI * 2 * hovered) / n - Math.PI / 2;
            const v = animValues[hovered];
            const px = cx + r * v * Math.cos(angle);
            const py = cy + r * v * Math.sin(angle);
            const tipW = 110, tipH = 34;
            const tx = Math.min(Math.max(px - tipW / 2, 4), 220 - tipW - 4);
            const ty = py < cy ? py - tipH - 8 : py + 10;
            const tipBg = isDark ? 'rgba(15,23,42,0.99)' : 'rgba(255,255,255,0.99)';
            return (
              <g>
                <rect x={tx} y={ty} width={tipW} height={tipH} rx={5}
                  fill={brandColor} stroke={brandColor} strokeWidth="1" />
                <text x={tx + tipW / 2} y={ty + 11} textAnchor="middle"
                  fontSize="10.5" fontWeight="700" fill={textColor} fontFamily="Inter, sans-serif">
                  {m.count} casos
                </text>
                <text x={tx + tipW / 2} y={ty + 22} textAnchor="middle"
                  fontSize="10" fill={textColor} opacity="0.8" fontFamily="Inter, sans-serif">
                  {Math.round((m.count / rescueData.length) * 100)}% del total
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Leyenda */}
      <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {motivos.map((m, i) => {
          const pct = ((m.count / rescueData.length) * 100).toFixed(1);
          const barW = (m.count / maxCount) * 100;
          return (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                backgroundColor: brandColor,
                opacity: hovered === null || hovered === i ? 1 : 0.35,
                boxShadow: hovered === i ? `0 0 6px ${brandColor}` : 'none',
                transition: 'all 0.15s',
              }} />
              <span style={{
                flex: 1, fontSize: 12, fontWeight: hovered === i ? 600 : 400,
                color: hovered === i ? 'var(--txt-1)' : 'var(--txt-4)',
                transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {m.label}
              </span>
              {/* Mini barra */}
              <div style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', flexShrink: 0 }}>
                <div style={{ width: `${barW}%`, height: '100%', borderRadius: 2, backgroundColor: brandColor, opacity: hovered === null || hovered === i ? 1 : 0.3, transition: 'all 0.15s' }} />
              </div>
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-2)', minWidth: 28, textAlign: 'right' }}>
                {m.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
