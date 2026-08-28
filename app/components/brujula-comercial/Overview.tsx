'use client';
import React, { useEffect, useState } from 'react';
import { CalendarioGrid } from './CalendarioGrid';
import { SenalesMercado, ScoreCard } from '../hubspot/InteligenciaMercado';
import ProspeccionDenue from '../hubspot/ProspeccionDenue';
import { SECTORES } from './BloqueDENUE';

const ICP_TO_DENUE: Record<string, string> = {
  'aerolineas y aviacion': 'Transportes, correos y almacenamiento',
  'alimentos y bebidas': 'Industrias manufactureras',
  'armadoras': 'Industrias manufactureras',
  'aseguradoras': 'Servicios financieros y de seguros',
  'automotriz': 'Industrias manufactureras',
  'bebidas alcoholicas': 'Industrias manufactureras',
  'bienes raices': 'Servicios inmobiliarios y de alquiler',
  'casinos': 'Servicios de esparcimiento culturales y deportivos',
  'cementeras': 'Industrias manufactureras',
  'centros comerciales': 'Servicios inmobiliarios y de alquiler',
  'cines': 'Información en medios masivos',
  'comercio electronico': 'Comercio al por menor',
  'construccion': 'Construcción',
  'consultoria y servicios profesionales': 'Servicios profesionales, científicos y técnicos',
  'consumo masivo (fmcg)': 'Comercio al por menor',
  'cuidado personal y belleza': 'Comercio al por menor',
  'dooh networks': 'Información en medios masivos',
  'deportes y recreacion': 'Servicios de esparcimiento culturales y deportivos',
  'e-commerce (gran volumen)': 'Comercio al por menor',
  'educacion': 'Servicios educativos',
  'energia y servicios publicos': 'Generación y distribución de energía eléctrica',
  'energias renovables': 'Generación y distribución de energía eléctrica',
  'entretenimiento': 'Servicios de esparcimiento culturales y deportivos',
  'farma y salud': 'Servicios de salud y de asistencia social',
  'farmaceuticas': 'Industrias manufactureras',
  'ferreteria': 'Comercio al por menor',
  'fibras': 'Servicios inmobiliarios y de alquiler',
  'financiera': 'Servicios financieros y de seguros',
  'fintech / banca digital': 'Servicios financieros y de seguros',
  'gobierno': 'Actividades legislativas, gubernamentales y de impartición de justicia',
  'gobierno y sector publico': 'Actividades legislativas, gubernamentales y de impartición de justicia',
  'grupos hospitalarios': 'Servicios de salud y de asistencia social',
  'hotelera y viajes': 'Servicios de alojamiento temporal y preparación de alimentos',
  'hoteles': 'Servicios de alojamiento temporal y preparación de alimentos',
  'infraestructura': 'Construcción',
  'inmobiliarias': 'Servicios inmobiliarios y de alquiler',
  'laboratorios farmaceuticos': 'Industrias manufactureras',
  'logistica / scm (b2b critico)': 'Transportes, correos y almacenamiento',
  'manufactura ligera (turnos fijos)': 'Industrias manufactureras',
  'medios y entretenimiento': 'Información en medios masivos',
  'movilidad y transporte': 'Transportes, correos y almacenamiento',
  'parques de diversiones': 'Servicios de esparcimiento culturales y deportivos',
  'petroleo y gas': 'Minería',
  'plataformas de viajes': 'Información en medios masivos',
  'procesadores de pagos': 'Servicios financieros y de seguros',
  'restaurantes': 'Servicios de alojamiento temporal y preparación de alimentos',
  'restaurantes y qrs': 'Servicios de alojamiento temporal y preparación de alimentos',
  'retail': 'Comercio al por menor',
  'salud': 'Servicios de salud y de asistencia social',
  'salud / farmaceutico (gestion)': 'Servicios de salud y de asistencia social',
  'seguros': 'Servicios financieros y de seguros',
  'servicios financieros': 'Servicios financieros y de seguros',
  'servicios de suscripcion (saas b2b)': 'Información en medios masivos',
  'software y tecnologia': 'Información en medios masivos',
  'startups': 'Información en medios masivos',
  'tecnologia': 'Información en medios masivos',
  'telecomunicaciones': 'Información en medios masivos',
  'textil': 'Industrias manufactureras',
  'trade marketing (btl)*': 'Servicios profesionales, científicos y técnicos',
  'transporte y logistica': 'Transportes, correos y almacenamiento',
  'turismo y hospitalidad': 'Servicios de alojamiento temporal y preparación de alimentos',
  'turistica': 'Servicios de alojamiento temporal y preparación de alimentos',
  'ventas directas (cambaceo)*': 'Comercio al por menor',
};

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '20px 24px' };

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{label}</span>;
}

const CONTEXTO_DUMMY = [
  { industria: 'Alimentos y Bebidas', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Competencia Creciente' },
  { industria: 'Retail', tamano: 'Multi (Más de 1000)', prioridad: 'Expansión de Mercado', desafio: 'Competencia Creciente' },
  { industria: 'Software y Tecnología', tamano: 'Grande (201-500)', prioridad: 'Eficiencia Operativa', desafio: 'Transformación Digital' },
  { industria: 'Salud', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Experiencia de Cliente' },
  { industria: 'Automotriz', tamano: 'Multi (Más de 1000)', prioridad: 'Eficiencia Operativa', desafio: 'Experiencia de Cliente' },
];

type ScorecardsICPBP = {
  topIndustrias?: string[]; tamanoEmpresa?: string; geografia?: string;
  decisores?: string[]; areasDecisor?: string[]; servicios?: string[];
};
function ListaCard({ label, items, accent, sub }: { label: string; items: string[]; accent: string; sub?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '16px 18px', borderLeft: `3px solid ${accent}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{label}</div>
      {items.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((it, i) => (
            <li key={i} style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0 }} />
              {it}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin datos</div>
      )}
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>{sub}</div>}
    </div>
  );
}
function BuscadorIndustrias({ udnId }: { udnId?: string }) {
  const [q, setQ] = useState('');
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const query = norm(q.trim());
  const dictHit = ICP_TO_DENUE[query];
  const match = query
    ? (dictHit ? SECTORES.find(s => s.nombre === dictHit) : null)
      ?? SECTORES.find(s => norm(s.nombre).includes(query) || s.alias?.some(a => norm(a).includes(query)))
    : null;
  const sectoresUDN = SECTORES.filter(s =>
    s.tieneIGAE && s.subsectores.some(sub => sub.ramas?.some(r => !udnId || r.udns?.includes(udnId)))
  );
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        position: 'relative', borderRadius: 16, padding: 2,
        background: 'linear-gradient(120deg, #E4007C, #8C59FE, #3274FC)',
      }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, opacity: 0.5 }}>@</span>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Busca la industria como tú la conoces... (ej: Retail, Agroindustria, Fintech)"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#0f172a', background: 'transparent' }}
            />
          </div>
          {query && (
            match ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{q}</span>
                <span style={{ fontSize: 14, color: '#cbd5e1' }}>→</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#8C59FE' }}>{match.nombre}</span>
                {!match.tieneIGAE && (
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#fef3c7', color: '#b45309', fontWeight: 600 }}>Sin temporalidad IGAE</span>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#94a3b8' }}>
                No se encontró una industria DENUE que coincida con &quot;{q}&quot;.
              </div>
            )
          )}
        </div>
      </div>
      {!query && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {sectoresUDN.map(s => (
            <span key={s.codigo} style={{
              fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 999,
              background: '#f8f7ff', border: '1px solid #ece9ff', color: '#5b3fd6',
            }}>{s.nombre}</span>
          ))}
          {sectoresUDN.length === 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Sin industrias asignadas aún para esta UDN.</span>
          )}
        </div>
      )}
    </div>
  );
}
function BloqueScorecards({ udnNombre, data }: { udnNombre: string; data: ScorecardsICPBP | null }) {
  const d = data ?? {};
  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>1</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Contexto</h3>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Tu ICP declarado y tus buyer personas - este es tu punto de partida, {udnNombre}.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16, marginBottom: 16 }}>
        <ListaCard label="Top 5 industrias (ICP)" items={d.topIndustrias ?? []} accent="#8C59FE" />
        <ScoreCard label="Tamano de empresa" value={d.tamanoEmpresa || '—'} sub="Piso minimo de interes" accent="#059669" icon="" />
        <ScoreCard label="Geografia" value={d.geografia || '—'} sub="Donde nos interesan" accent="#d97706" icon="" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <ListaCard label="Tomadores de decision" items={d.decisores ?? []} accent="#8C59FE" />
        <ScoreCard label="Area del tomador" value={(d.areasDecisor ?? []).join(' · ') || '—'} sub="Areas mas frecuentes" accent="#059669" icon="" />
        <ListaCard label="Servicios (Need)" items={d.servicios ?? []} accent="#d97706" />
      </div>
    </div>
  );
}

function BloquePlaceholder({ numero, titulo, subtitulo, fuente }: { numero: number; titulo: string; subtitulo: string; fuente: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{numero}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>{titulo}</h3>
        </div>
        <Badge label={'Pendiente: reusar ' + fuente} color="#b45309" bg="#fef3c7" />
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{subtitulo}</p>
    </div>
  );
}

export default function Overview({ udnNombre, udnId, brandColor }: { udnNombre: string; udnId?: string; brandColor?: string }) {
  const [calendarioData, setCalendarioData] = useState<{ meses: string[]; filas: { industria: string; celdas: ('pico' | 'prep' | 'ok' | 'vacio')[] }[] } | null>(null);
  const [empresasPicoData, setEmpresasPicoData] = useState<any[]>([]);
  const [scorecardsData, setScorecardsData] = useState<ScorecardsICPBP | null>(null);
  const idParaCalendario = udnId ?? udnNombre;

  useEffect(() => {
    let cancelled = false;
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (!cancelled) {
          setCalendarioData(json?.calendario?.[idParaCalendario] ?? null);
          setEmpresasPicoData(json?.empresas_pico?.[idParaCalendario] ?? []);
          setScorecardsData(json?.scorecards_icp_bp?.[idParaCalendario] ?? null);
        }
      })
      .catch(() => { if (!cancelled) { setCalendarioData(null); setEmpresasPicoData([]); } });
    return () => { cancelled = true; };
  }, [idParaCalendario]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BuscadorIndustrias udnId={idParaCalendario} />\n        <BloqueScorecards udnNombre={udnNombre} data={scorecardsData} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>2</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Senales en vivo</h3>
        </div>
        <SenalesMercado />
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>3</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Calendario de prospeccion</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
            Temporalidad por industria - mejor momento para contactar segun el ciclo economico.
          </p>
          {calendarioData ? (
            <CalendarioGrid
              meses={calendarioData.meses}
              filas={calendarioData.filas}
              brandColor={brandColor ?? '#8C59FE'}
              udnId={idParaCalendario}
              empresasPico={empresasPicoData}
            />
          ) : (
            <p style={{ fontSize: 12.5, color: '#94a3b8' }}>Cargando calendario...</p>
          )}
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>4</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Descubrir nuevas empresas</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
            Universo DENUE - empresas que aun no forman parte de tu cartera.
          </p>
          <ProspeccionDenue onTotalChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
