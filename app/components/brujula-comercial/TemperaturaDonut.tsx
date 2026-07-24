import { useState, useEffect, useRef } from 'react';
import type { TemperaturaData, Industria } from '../../lib/types';

interface TemperaturaDonutProps {
  data: TemperaturaData;
  topIndustrias: Industria[];
  brandColor: string;
  isDark: boolean;
}

const TEMP_CONFIG = [
  { key: 'caliente' as const, label: 'Caliente' },
  { key: 'templado' as const, label: 'Templado', color: '#FBBF24' },
  { key: 'tibio'    as const, label: 'Tibio',    color: '#60A5FA' },
  { key: 'frio'     as const, label: 'Frío',     color: '#64748B' },
];

interface SliceInfo {
  d: string;
  color: string;
  midAngle: number;
  pct: number;
  key: string;
}

function buildSlices(
  data: TemperaturaData,
  brandColor: string,
  progress: number,
  cx: number, cy: number, r: number, innerR: number
): SliceInfo[] {
  const total = data.caliente + data.templado + data.tibio + data.frio;
  const values = [data.caliente, data.templado, data.tibio, data.frio];
  const colors = [brandColor, '#FBBF24', '#60A5FA', '#64748B'];
  const keys   = ['caliente', 'templado', 'tibio', 'frio'];

  let cumAngle = -90;
  return values.map((val, i) => {
    const pct   = val / total;
    const angle = pct * 360 * progress;
    const s = (cumAngle * Math.PI) / 180;
    cumAngle += pct * 360 * progress;
    const e = (cumAngle * Math.PI) / 180;
    const midDeg = cumAngle - (pct * 360 * progress) / 2;
    const midAngle = (midDeg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const ix1 = cx + innerR * Math.cos(s), iy1 = cy + innerR * Math.sin(s);
    const ix2 = cx + innerR * Math.cos(e), iy2 = cy + innerR * Math.sin(e);
    const large = angle > 180 ? 1 : 0;
    return {
      d: angle < 0.5 ? '' : `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}Z`,
      color: colors[i],
      midAngle,
      pct,
      key: keys[i],
    };
  });
}

function AnimatedDonut({
  data,
  brandColor,
  isDark,
}: { data: TemperaturaData; brandColor: string; isDark: boolean }) {
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered]   = useState<number | null>(null);
  const [paused,  setPaused]    = useState(false);
  const rafRef   = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    setProgress(0);
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / 900, 1);
      setProgress(1 - Math.pow(1 - p, 2.5));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, brandColor]);

  const cx = 80, cy = 80, r = 74, innerR = 50;
  const slices = buildSlices(data, brandColor, progress, cx, cy, r, innerR);

  const innerFill  = isDark ? 'rgba(15,23,42,0.9)'  : 'rgba(240,237,248,0.9)';
  const innerFill2 = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(240,237,248,0.97)';
  const textFill   = isDark ? '#F1F5F9' : '#12112A';
  const subFill    = isDark ? '#ffffffa6' : '#5A5280';
  const tipBg      = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.97)';
  const stroke     = isDark ? 'rgba(15,23,42,0.7)' : 'rgba(240,237,248,0.7)';

  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: '50%',
        cursor: 'pointer',
        animation: 'donut-aura 3s ease-in-out infinite',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null); }}
    >
      <svg width={160} height={160} viewBox="0 0 160 160">
        <circle cx={cx} cy={cy} r={innerR + 2} fill={innerFill} />

        {slices.map((s, i) => {
          if (!s.d) return null;
          const isHov = hovered === i;
          const dx = isHov ? Math.cos(s.midAngle) * 6 : 0;
          const dy = isHov ? Math.sin(s.midAngle) * 6 : 0;

          return (
            <path
              key={s.key}
              d={s.d}
              fill={s.color}
              stroke={stroke}
              strokeWidth="2.5"
              style={{
                transform: `translate(${dx}px, ${dy}px)`,
                transition: 'transform 0.18s ease, filter 0.18s',
                filter: isHov ? `drop-shadow(0 0 8px ${s.color}AA)` : 'none',
                cursor: 'pointer',
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animationName: 'donut-seg-pulse',
                animationDuration: '3s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationDelay: `${i * 0.4}s`,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={innerR - 2} fill={innerFill2} />

        <text x={cx} y={cy - 7} textAnchor="middle" fontSize="15" fontWeight="700"
              fill={textFill} fontFamily="JetBrains Mono, monospace">
          {Math.round(data.caliente * progress).toLocaleString()}
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="8"
              fill={subFill} fontFamily="Inter, sans-serif" letterSpacing="0.07em">
          calientes
        </text>

        {paused && hovered !== null && slices[hovered] && (
          <g>
            <rect x={cx - 44} y={cy + 22} width={88} height={20} rx={5}
                  fill={tipBg} stroke={slices[hovered].color} strokeWidth="1" />
            <text x={cx} y={cy + 35} textAnchor="middle" fontSize="9.5" fontWeight="700"
                  fill={slices[hovered].color} fontFamily="JetBrains Mono, monospace">
              {TEMP_CONFIG[hovered].label}: {data[TEMP_CONFIG[hovered].key as keyof TemperaturaData].toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function TemperaturaDonut({ data, topIndustrias, brandColor, isDark }: TemperaturaDonutProps) {
  const topColors = { caliente: brandColor, templado: '#FBBF24', tibio: '#60A5FA', frio: '#64748B' };
  const maxLeads  = Math.max(...topIndustrias.slice(0, 4).map(i => i.leads), 1);

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt-1)' }}>Leads por temperatura</div>
        <div style={{ fontSize: 12, color: 'var(--txt-5)', marginTop: 3 }}>Distribución actual en base</div>
      </div>

      {/* Donut centrado grande */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 20px 8px' }}>
        <AnimatedDonut data={data} brandColor={brandColor} isDark={isDark} />
      </div>
      {/* Leyenda debajo */}
      <div style={{ padding: '4px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 52, textAlign: 'right', marginRight: 4 }}>Leads</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 36, textAlign: 'right' }}>%</span>
        </div>
        {TEMP_CONFIG.map((t) => {
          const val   = data[t.key];
          const total = Object.values(data).reduce((a, b) => a + b, 0);
          const pct   = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
          const color = t.key === 'caliente' ? brandColor : (t.color || '#64748B');
          return (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--txt-3)' }}>{t.label}</span>
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', marginRight: 4 }}>
                {val.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt-3)' }}>{pct}%</span>
            </div>
          );
        })}
      </div>


    </div>
  );
}
