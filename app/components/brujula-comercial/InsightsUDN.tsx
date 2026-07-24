interface Insight {
  tipo: 'timing' | 'ejecucion' | 'propuesta' | 'oportunidad';
  titulo: string;
  texto: string;
  accion: string;
}

interface InsightsUDNProps {
  insights: Insight[];
  brandColor: string;
  isDark: boolean;
}

const TIPO_CONFIG = {
  timing:      { emoji: '⏱', label: 'Timing' },
  ejecucion:   { emoji: '📞', label: 'Ejecución' },
  propuesta:   { emoji: '📋', label: 'Propuesta' },
  oportunidad: { emoji: '🎯', label: 'Oportunidad' },
};

// Extrae la frase clave del texto largo
function extractBullet(texto: string): string {
  return texto.length > 140 ? texto.slice(0, 137) + '…' : texto;
}

export function InsightsUDN({ insights, brandColor, isDark }: InsightsUDNProps) {
  if (!insights || insights.length === 0) return null;

  const bg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="card" style={{ marginTop: 20, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: brandColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        📊 Lectura del dashboard
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(insights.length, 3)}, 1fr)`, gap: 12 }}>
        {insights.map((ins, i) => {
          const cfg = TIPO_CONFIG[ins.tipo] ?? TIPO_CONFIG.oportunidad;
          return (
            <div key={i} style={{
              background: bg,
              border: `1px solid ${border}`,
              borderLeft: `3px solid ${brandColor}`,
              borderRadius: 8,
              padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-1)' }}>{ins.titulo}</span>
              </div>
              {ins.texto && <p style={{ fontSize: 11, color: 'var(--txt-4)', margin: '0 0 8px', lineHeight: 1.5 }}>{extractBullet(ins.texto)}</p>}
              <div style={{ fontSize: 10, fontWeight: 600, color: brandColor }}>
                → {ins.accion.length > 80 ? ins.accion.slice(0, 77) + '…' : ins.accion}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
