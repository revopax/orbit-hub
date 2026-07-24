'use client';
import { mockEmpresasConvergencia } from '../../lib/mockCruceSenales';

const ESTADO_CONFIG = {
  convergencia_validada: { color: '#D85A30', label: 'Convergencia validada' },
  reactiva_sin_respaldo: { color: '#EF9F27', label: 'Reactiva sin respaldo' },
  anticipacion_pura: { color: '#1D9E75', label: 'Anticipación pura' },
};

export function ScoreCardsConvergencia() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {mockEmpresasConvergencia.map((e) => {
        const cfg = ESTADO_CONFIG[e.estado];
        return (
          <div
            key={e.empresa}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', border: '0.5px solid var(--border)',
              borderRadius: 8, background: 'var(--card-bg)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--txt-1)' }}>
                {e.empresa} · {e.udn}
              </p>
              <p style={{ fontSize: 12, color: 'var(--txt-5)', margin: '2px 0 0' }}>
                {e.industria} · {cfg.label} · {e.señalesHoy} señales hoy
              </p>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-2)', flexShrink: 0 }}>
              {e.scoreCompuesto}
            </span>
          </div>
        );
      })}
    </div>
  );
}
