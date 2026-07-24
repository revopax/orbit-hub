'use client';
import { useState } from 'react';
import type { KPI } from '../../lib/types';
import { useCountUp } from '../../lib/useCountUp';

interface KPICardProps {
  kpi: KPI;
  brandColor: string;
  index: number;
}

const badgeStyle = {
  green: { bg: 'rgba(34,197,94,0.14)',  color: '#16A34A' },
  red:   { bg: 'rgba(239,68,68,0.14)',  color: '#DC2626' },
  amber: { bg: 'rgba(251,191,36,0.14)', color: '#D97706' },
};

export function KPICard({ kpi, brandColor, index }: KPICardProps) {
  const badge   = badgeStyle[kpi.badgeColor || 'amber'];
  const [hovered, setHovered] = useState(false);
  const displayValor = useCountUp(kpi.valor);

  return (
    <div
      className="card kpi-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 11px',
        animation: `fade-up 0.28s ease ${index * 0.055}s both`,
        display: 'flex', flexDirection: 'column', gap: 5,
        position: 'relative', overflow: 'hidden',
        borderColor: hovered ? `${brandColor}50` : 'var(--border)',
        boxShadow: hovered ? `0 4px 18px ${brandColor}1A, 0 0 0 1px ${brandColor}25` : 'var(--card-shadow)',
        borderBottom: `2px solid ${hovered ? brandColor : `${brandColor}35`}`,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 10% 110%, ${brandColor}0C 0%, transparent 55%)`,
        opacity: hovered ? 1 : 0.5, transition: 'opacity 0.22s',
      }} />

      {/* Label */}
      <span style={{
        fontSize: 9, fontWeight: 700, color: 'var(--txt-5)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        lineHeight: 1.3, display: 'block', position: 'relative',
      }}>
        {kpi.label}
      </span>

      {/* Número principal */}
      <div className="font-mono kpi-num" style={{
        fontWeight: 700, lineHeight: 1, position: 'relative',
        color: 'var(--txt-1)', transition: 'color 0.18s',
      }}>
        {displayValor}
      </div>

      {/* Barra de progreso */}
      {kpi.tipo === 'progreso' && typeof kpi.pct === 'number' && (
        <div style={{ height: 2, backgroundColor: 'var(--bar-track)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${kpi.pct}%`,
            background: `linear-gradient(90deg, ${brandColor}55, ${brandColor})`,
            borderRadius: 99, boxShadow: `0 0 5px ${brandColor}55`,
            transition: 'width 1.1s ease',
          }} />
        </div>
      )}

      {/* Timing Comercial — zona activa */}
      {kpi.tipo === 'timing' && kpi.timingData && (
        <div style={{ margin: '2px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 600 }}>En zona activa · 2026</span>
        </div>
      )}

      {/* Badge + meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, position: 'relative' }}>
        {kpi.badge ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            backgroundColor: badge.bg, color: badge.color,
            whiteSpace: 'nowrap', letterSpacing: '0.02em',
          }}>
            {kpi.badge}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--txt-4)' }}>meta: {kpi.meta}</span>
        )}
        {kpi.tipo === 'progreso' ? (
          <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, color: brandColor }}>
            {kpi.pct}%
          </span>
        ) : kpi.tipo !== 'timing' ? (
          <span style={{ fontSize: 10, color: 'var(--txt-4)' }}>meta: {kpi.meta}</span>
        ) : null}
      </div>
    </div>
  );
}
