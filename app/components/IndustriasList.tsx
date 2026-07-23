'use client';
import type { Industria } from '../lib/types';

interface Props {
  industrias: Industria[];
  brandColor: string;
  udnNombre: string;
}

const TEMP_COLOR: Record<string, string> = {
  caliente: '#1A7A3C',
  templado: '#92540A',
  tibio:    '#1E5A9C',
  frio:     'var(--txt-5)',
};
const TEMP_BG: Record<string, string> = {
  caliente: 'rgba(26,122,60,0.15)',
  templado: 'rgba(146,84,10,0.15)',
  tibio:    'rgba(30,90,156,0.15)',
  frio:     'rgba(120,120,140,0.10)',
};
const ACCION_LABEL: Record<string, string> = {
  llamar:      'Llamar ahora',
  prepararse:  'Prepararse',
  esperar:     'Esperar',
};
const TEMP_LABEL: Record<string, string> = {
  caliente: 'Llamar ahora',
  templado: 'Prepararse',
  tibio:    'Explorar',
  frio:     'Esperar',
};

const LEYENDA = [
  { key: 'caliente', label: 'Vende',   desc: 'Maxima disposicion de compra',  color: '#22C55E' },
  { key: 'templado', label: 'Prepara',  desc: 'Califica y agenda propuestas',  color: '#F59E0B' },
  { key: 'tibio',    label: 'Explora',  desc: 'Primeros contactos',            color: '#60A5FA' },
  { key: 'frio',     label: 'Espera',   desc: 'Monitorear, no priorizar',      color: '#64748B' },
];

export function IndustriasList({ industrias, brandColor, udnNombre }: Props) {
  if (!industrias || industrias.length === 0) {
    return (
      <div className="card" style={{ padding: '20px 24px' }}>
        <p style={{ color: 'var(--txt-5)', fontSize: 13 }}>Sin datos de industrias</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '20px 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '0 20px 12px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>
          Top 5 Industrias prioritarias
        </h3>
        <p style={{ fontSize: 12, color: 'var(--txt-5)', margin: '2px 0 0' }}>
          Sectores con mayor oportunidad ahora · ordenados por temperatura de mercado · {udnNombre}
        </p>
      </div>
      {/* Leyenda temperatura */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 16px", padding:"8px 20px 12px", borderBottom:"1px solid var(--border)" }}>
        {LEYENDA.map(l => (
          <div key={l.key} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, backgroundColor: l.color ?? brandColor, boxShadow:`0 0 5px ${l.color ?? brandColor}99` }}/>
            <span style={{ fontSize:10, fontWeight:700, color:"var(--txt-3)" }}>{l.label}</span>
            <span style={{ fontSize:10, color:"var(--txt-4)" }}>· {l.desc}</span>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 80px 60px 90px',
        padding: '0 20px 6px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>INDUSTRIA</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>PICO</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>LEADS</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-5)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>ACCIÓN</span>
      </div>

      {/* Rows */}
      {industrias.map((ind, i) => {
        const tColor = TEMP_COLOR[ind.temperatura] ?? 'var(--txt-5)';
        const tBg    = TEMP_BG[ind.temperatura]    ?? 'transparent';

        return (
          <div
            key={i}
            style={{
              padding: '10px 20px',
              borderBottom: i < industrias.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'grid',
              gridTemplateColumns: '1fr 80px 60px 90px',
              alignItems: 'start',
              gap: 8,
            }}
          >
            {/* Col 1 — Industria + Mkt/Comercial/Perdidos */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: tColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt-1)", lineHeight: 1.3 }}>{ind.nombre}</span>
              </div>

            </div>
            {/* Col 2 — Pico */}
            <div style={{ textAlign: "center", paddingTop: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-2)" }}>{ind.mesPico}</span>
            </div>
            {/* Col 3 — Leads */}
            <div style={{ textAlign: "center", paddingTop: 2 }}>
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-2)" }}>{ind.leads.toLocaleString("es-MX")}</span>
            </div>
            {/* Col 4 — Acción */}
            <div style={{ textAlign: "right", paddingTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
                color: ind.accion === "llamar" ? "#4ADE80" : ind.accion === "prepararse" ? "#FCD34D" : "#93C5FD" }}>
                {ACCION_LABEL[ind.accion] ?? ind.accion}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
