'use client';
import React, { useEffect, useState } from 'react';
import { CalendarioGrid } from './CalendarioGrid';
import { ScoreCard } from '../hubspot/InteligenciaMercado';
import ProspeccionDenue from '../hubspot/ProspeccionDenue';
import { GraficaCruceSenales } from '../GraficaCruceSenales';
import { getProspeccionTree } from '../../lib/prospeccionTreeCache';
import { ICP_TO_DENUE } from '../../lib/icpToDenue';



const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '20px 24px' };

const TIPO_COLOR: Record<string, string> = { 'Expansión': '#059669', 'Inversión': '#2563eb', 'Apertura': '#7c3aed', 'Cambio de puesto': '#d97706', 'Otro': '#64748b' };
const TIPO_BG: Record<string, string> = { 'Expansión': '#d1fae5', 'Inversión': '#dbeafe', 'Apertura': '#ede9fe', 'Cambio de puesto': '#fef3c7', 'Otro': '#f1f5f9' };
const TIPO_ICONO: Record<string, string> = { 'Expansión': '🏬', 'Inversión': '💰', 'Cambio de puesto': '👤', 'Apertura': '🆕', 'Otro': '📰' };
type MencionAPI = {
  fecha: string;
  hora: string;
  titulo: string;
  contenido: string;
  fuente: string;
  url: string | null;
  sentimiento: number;
  tipo: string;
};

function tiempoRelativo(fecha: string, hora: string): string {
  const fechaHora = new Date(`${fecha}T${hora || '00:00'}:00`);
  const diffMs = Date.now() - fechaHora.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `hace ${Math.max(diffMin, 0)} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} d`;
}

function resaltarKeyword(texto: string): string {
  return texto;
}

export function SenalesMercado({ abierto = true, onToggle = () => {} }: { abierto?: boolean; onToggle?: () => void }) {
  const [menciones, setMenciones] = useState<MencionAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dias, setDias] = useState(7);
  const [tiposActivos, setTiposActivos] = useState<string[]>(['Expansión', 'Inversión', 'Cambio de puesto', 'Otro']);
  const [abiertoPeriodo, setAbiertoPeriodo] = useState(false);
  const [abiertoTipo, setAbiertoTipo] = useState(false);
  useEffect(() => {
    setCargando(true);
    fetch(`/api/brand24-menciones?dias=${dias}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) { setError(json.error); return; }
        setMenciones(json.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [dias]);
  const ordenPrioridad: Record<string, number> = { 'Expansión': 0, 'Inversión': 0, 'Cambio de puesto': 0, 'Otro': 1 };
  const mencionesFiltradas = menciones.filter(m => tiposActivos.includes(m.tipo));
  const mencionesOrdenadas = [...mencionesFiltradas].sort((a, b) => (ordenPrioridad[a.tipo] ?? 1) - (ordenPrioridad[b.tipo] ?? 1));
  const toggleTipo = (tipo: string) => {
    setTiposActivos(prev => prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]);
  };
  return (
    <div style={cardStyle}>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>2</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Señales de mercado</h3>
          </div>
          <Chevron abierto={abierto} onClick={onToggle} />
        </div>
        <div style={{ position: 'absolute', top: -4, right: 32, textAlign: 'right' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11.5, fontWeight: 700, color: '#5b3fd6',
            background: '#f8f7ff', border: '1px solid #ece9ff',
            borderRadius: 999, padding: '4px 12px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.6s infinite' }} />
            Última actualización: {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
            Próx. actualización: al recargar la página
          </div>
        </div>
        {abierto && !cargando && !error && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, marginTop: 10 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setAbiertoPeriodo(v => !v); setAbiertoTipo(false); }} style={{
                  background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 9,
                  padding: '5px 12px', color: '#64748b', fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  Periodo: {dias === 0 ? 'Máx. (31d)' : `${dias} días`}
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                {abiertoPeriodo && (
                  <>
                    <div onClick={() => setAbiertoPeriodo(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', top: 34, left: 0, zIndex: 50,
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, overflow: 'hidden',
                    }}>
                      {[7, 14, 30, 0].map(d => (
                        <div key={d} onClick={() => { setDias(d); setAbiertoPeriodo(false); }} style={{
                          padding: '8px 14px', fontSize: 12.5, cursor: 'pointer',
                          color: dias === d ? '#8C59FE' : '#334155',
                          fontWeight: dias === d ? 700 : 500,
                          background: dias === d ? '#f8f7ff' : 'transparent',
                        }}>
                          {d === 0 ? 'Máx. (31d)' : `${d} días`}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <button onClick={() => { setAbiertoTipo(v => !v); setAbiertoPeriodo(false); }} style={{
                  background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 9,
                  padding: '5px 12px', color: '#64748b', fontSize: 12.5, fontWeight: 500,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  Tipo {tiposActivos.length < 4 ? `(${tiposActivos.length})` : ''}
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                {abiertoTipo && (
                  <>
                    <div onClick={() => setAbiertoTipo(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{
                      position: 'absolute', top: 34, left: 0, zIndex: 50,
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 190, overflow: 'hidden', padding: '4px 0',
                    }}>
                      {['Expansión', 'Inversión', 'Cambio de puesto', 'Otro'].map(tipo => {
                        const activo = tiposActivos.includes(tipo);
                        return (
                          <label key={tipo} onClick={() => toggleTipo(tipo)} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', color: '#334155',
                          }}>
                            <span style={{
                              width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                              border: '1.5px solid ' + (activo ? '#8C59FE' : '#cbd5e1'),
                              background: activo ? '#8C59FE' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: '#fff',
                            }}>
                              {activo ? '✓' : ''}
                            </span>
                            {tipo}
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            
          </>
        )}
      </div>
      {abierto && (
        <>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>Detecciones externas de expansión, inversión y cambios de puesto que podrían indicar una nueva oportunidad, vía Brand24.</p>
          {cargando && <p style={{ fontSize: 13, color: '#94a3b8' }}>Cargando menciones…</p>}
          {error && <p style={{ fontSize: 13, color: '#dc2626' }}>Error: {error}</p>}
          {!cargando && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
          {mencionesOrdenadas.length === 0 && <p style={{ fontSize: 13, color: '#94a3b8' }}>Sin menciones en el periodo seleccionado.</p>}
          {mencionesOrdenadas.map((m, i) => {
            const color = TIPO_COLOR[m.tipo] || '#64748b';
            const bg = TIPO_BG[m.tipo] || '#f1f5f9';
            const icono = TIPO_ICONO[m.tipo] || '📰';
            return (
              <div key={i} style={{ display: 'flex', position: 'relative', borderRadius: 12, border: '1px solid #eef0f3', overflow: 'hidden', background: '#fff', minHeight: 90, flexShrink: 0, animation: 'fadeInDown 0.5s ease', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
                <div style={{ width: 4, background: color, flexShrink: 0 }} />
                <div style={{ padding: '14px 16px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${m.fuente}&sz=64`}
                      alt=""
                      style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0, objectFit: 'contain' }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{m.fuente}</span>
                    <Badge label={m.tipo} color={color} bg={bg} />
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{tiempoRelativo(m.fecha, m.hora)}</span>
                  </div>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4, textDecoration: 'none', display: 'block' }}
                       onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                       onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                      {m.titulo || m.contenido?.slice(0, 160) || 'Mención sin texto'}
                    </a>
                  ) : (
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.4 }}>
                      {m.titulo || m.contenido?.slice(0, 160) || 'Mención sin texto'}
                    </p>
                  )}
                  {m.contenido && (
                    <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {m.contenido}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
            </div>
          )}
        </>
      )}
    </div>
  );
}



function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{label}</span>;
}
function Chevron({ abierto, onClick }: { abierto: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: '#f8f7ff', border: '1px solid #8C59FE55', borderRadius: 8,
      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: '#8C59FE', fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>
      {abierto ? '\u25be' : '\u25b8'}
    </button>
  );
}

const CONTEXTO_DUMMY = [
  { industria: 'Alimentos y Bebidas', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Competencia Creciente' },
  { industria: 'Retail', tamano: 'Multi (Más de 1000)', prioridad: 'Expansión de Mercado', desafio: 'Competencia Creciente' },
  { industria: 'Software y Tecnología', tamano: 'Grande (201-500)', prioridad: 'Eficiencia Operativa', desafio: 'Transformación Digital' },
  { industria: 'Salud', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Experiencia de Cliente' },
  { industria: 'Automotriz', tamano: 'Multi (Más de 1000)', prioridad: 'Eficiencia Operativa', desafio: 'Experiencia de Cliente' },
];

type ScorecardsICPBP = {
  topIndustrias?: string[]; tamanoEmpresa?: string; facturacionAnual?: string; geografia?: string;
  decisores?: string[]; influenciadores?: string[]; areasDecisor?: string[]; servicios?: string[];
};
function ListaCard({ label, items, accent, sub, influencia, scrollable }: { label: string; items: string[]; accent: string; sub?: string; influencia?: string[]; scrollable?: boolean }) {
  return (
    <div style={{ background: `${accent}08`, borderRadius: 14, border: `1px solid ${accent}22`, boxShadow: '0 1px 4px rgba(16,24,40,0.05)', padding: '16px 18px', borderLeft: `4px solid ${accent}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>{label}</div>
      {items.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, ...(scrollable ? { maxHeight: 140, overflowY: 'auto' as const, paddingRight: 4 } : {}) }}>
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
      {influencia && influencia.length > 0 && (
        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 10, paddingTop: 8, borderTop: '1px solid #eef0f3', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: '#334155' }}>Influye:</span> {influencia.join(', ')}
        </div>
      )}
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>{sub}</div>}
    </div>
  );
}
function BuscadorIndustrias() {
  const [q, setQ] = useState('');
  const [ramas, setRamas] = useState<any[]>([]);
  const [subsectores, setSubsectores] = useState<any[]>([]);
  const [subramas, setSubramas] = useState<any[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProspeccionTree().then(d => {
      if (cancelled) return;
      setRamas(d.ramas); setSubsectores(d.subsectores); setSubramas(d.subramas);
    });
    return () => { cancelled = true; };
  }, []);

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const query = norm(q.trim());
  const nombresMatch = Array.from(new Set(
    Object.entries(ICP_TO_DENUE)
      .filter(([key]) => query && (key === query || key.includes(query) || query.includes(key)))
      .map(([, nombre]) => norm(nombre))
  ));
  const ramasMatch = query ? ramas.filter(r => nombresMatch.includes(norm(r.nombre))) : [];

  return (
    <div style={{ marginBottom: 24, borderRadius: 16, padding: 2, background: 'linear-gradient(120deg, #E4007C, #8C59FE, #3274FC)' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, opacity: 0.5 }}>🔍</span>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Busca la industria como tú la conoces... (ej: Retail, Agroindustria, Fintech)"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#0f172a', background: 'transparent' }}
          />
        </div>
        {query && ramasMatch.length === 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#94a3b8' }}>
            No se encontró una industria DENUE que coincida con &quot;{q}&quot;.
          </div>
        )}
        {query && ramasMatch.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
              &quot;{q}&quot; corresponde a {ramasMatch.length > 1 ? `${ramasMatch.length} industrias DENUE` : '1 industria DENUE'}
            </div>
            {ramasMatch.map(r => {
              const abierto = expandido === r.codigo;
              return (
                <div key={r.codigo} style={{ marginBottom: 2 }}>
                  <div
                    onClick={() => setExpandido(abierto ? null : r.codigo)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 2px', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}
                  >
                    <span style={{
                      width: 15, height: 15, borderRadius: 4, border: '1px solid #cbd5e1', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0,
                    }}>{abierto ? '\u2212' : '+'}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>({r.codigo})</span>
                    {r.nombre}
                  </div>
                  {abierto && (
                    <div style={{ marginLeft: 24, borderLeft: '2px solid #e2e8f0', paddingLeft: 10 }}>
                      {subsectores.filter(s => s.scian2 === r.codigo).map(s => (
                        <div key={s.codigo} style={{ marginBottom: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px', fontSize: 12, color: '#475569' }}>
                            <span style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }}>{s.codigo}</span>
                            {s.nombre}
                          </div>
                          <div style={{ marginLeft: 15, borderLeft: '1px solid #f1f5f9', paddingLeft: 10 }}>
                            {subramas.filter(sr => sr.scian3 === s.codigo).map(sr => (
                              <div key={sr.codigo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 4px', fontSize: 11.5, color: '#64748b' }}>
                                <span style={{ fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace', minWidth: 32 }}>{sr.codigo}</span>
                                {sr.nombre}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
function BloqueScorecards({ udnNombre, data, meta, abierto, onToggle }: { udnNombre: string; data: ScorecardsICPBP | null; meta: any; abierto: boolean; onToggle: () => void }) {
  const d = data ?? {};
  return (
    <div>
      <div style={{ ...cardStyle, position: 'relative' }}>
        {meta?.generado_en && (
          <div style={{ position: 'absolute', top: 16, right: 56, textAlign: 'right' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11.5, fontWeight: 700, color: '#5b3fd6',
              background: '#f8f7ff', border: '1px solid #ece9ff',
              borderRadius: 999, padding: '4px 12px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.6s infinite' }} />
              Sincronizado: {new Date(meta.generado_en).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
              Se actualiza al detectar cambios en el Sheet ICP/BP
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>1</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Contexto</h3>
          </div>
          <Chevron abierto={abierto} onClick={onToggle} />
        </div>
      {abierto && (
        <>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 24px' }}>
            Tu ICP declarado y tus buyer personas - este es tu punto de partida, {udnNombre}.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16, marginBottom: 16 }}>
            <ListaCard label="Top industrias (ICP)" items={d.topIndustrias ?? []} accent="#8C59FE" scrollable />
            <ScoreCard label="Tamano de empresa" value={d.tamanoEmpresa || '—'} sub={d.facturacionAnual ? `Piso minimo de interes · Facturación: ${d.facturacionAnual}` : 'Piso minimo de interes'} accent="#059669" icon="" subColor="#475569" />
            <ScoreCard label="Geografia" value={d.geografia || '—'} sub="Donde nos interesan" accent="#d97706" icon="" subColor="#475569" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <ListaCard label="Tomadores de decision" items={d.decisores ?? []} influencia={d.influenciadores ?? []} accent="#8C59FE" />
            <ScoreCard label="Area del tomador" value={(d.areasDecisor ?? []).join(' · ') || '—'} sub="Areas mas frecuentes" accent="#059669" icon="" subColor="#475569" />
            <ListaCard label="Servicios (Need)" items={d.servicios ?? []} accent="#d97706" />
          </div>
        </>
      )}
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
  const [calendarioCompleto, setCalendarioCompleto] = useState<{ meses: string[]; filas: { industria: string; celdas: string[] }[] } | null>(null);
  const [empresasPicoData, setEmpresasPicoData] = useState<any[]>([]);
  const [scorecardsData, setScorecardsData] = useState<ScorecardsICPBP | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [picosBusqueda, setPicosBusqueda] = useState<Record<string, string | null>>({});
  const idParaCalendario = udnId ?? udnNombre;
  const [abierto1, setAbierto1] = useState(true);
  const [abierto2, setAbierto2] = useState(true);
  const [abierto3, setAbierto3] = useState(true);
  const [abierto4, setAbierto4] = useState(true);
  const todoAbierto = abierto1 && abierto2 && abierto3 && abierto4;
  const toggleTodo = () => {
    const nuevo = !todoAbierto;
    setAbierto1(nuevo); setAbierto2(nuevo); setAbierto3(nuevo); setAbierto4(nuevo);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (!cancelled) {
          setCalendarioData(json?.calendario?.[idParaCalendario] ?? null);
          setCalendarioCompleto(json?.calendario_completo ?? null);
          setEmpresasPicoData(json?.empresas_pico?.[idParaCalendario] ?? []);
          setScorecardsData(json?.scorecards_icp_bp?.[idParaCalendario] ?? null);
          setMeta(json?.meta ?? null);
          setPicosBusqueda(json?.picos_busqueda_por_udn ?? {});
        }
      })
      .catch(() => { if (!cancelled) { setCalendarioData(null); setEmpresasPicoData([]); } });
    return () => { cancelled = true; };
  }, [idParaCalendario]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={toggleTodo} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9,
            padding: '6px 14px', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>
            {todoAbierto ? 'Colapsar todo' : 'Expandir todo'}
          </button>
        </div>
        <BuscadorIndustrias />
        <BloqueScorecards udnNombre={udnNombre} data={scorecardsData} meta={meta} abierto={abierto1} onToggle={() => setAbierto1(v => !v)} />
        <SenalesMercado abierto={abierto2} onToggle={() => setAbierto2(v => !v)} />
        {false && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>5</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Cruce de señales</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>Dinamismo económico (IGAE) vs. intención de búsqueda (Google Ads) vs. MQLs generados (HubSpot).</p>
          <GraficaCruceSenales brandColor={brandColor || '#8C59FE'} isDark={false} udn={udnNombre} desde="2026-01" hasta="2026-08" />
        </div>
        )}
        <div style={{ ...cardStyle, position: 'relative' }}>
          {meta?.fecha_actualizacion_inegi && (
            <div style={{ position: 'absolute', top: 16, right: 56, textAlign: 'right' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11.5, fontWeight: 700, color: '#5b3fd6',
                background: '#f8f7ff', border: '1px solid #ece9ff',
                borderRadius: 999, padding: '4px 12px',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.6s infinite' }} />
                Última actualización: {meta.fecha_actualizacion_inegi}
              </span>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                Próx. actualización: {meta.proxima_actualizacion_inegi}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>3</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Calendario de prospeccion</h3>
            </div>
            <Chevron abierto={abierto3} onClick={() => setAbierto3(v => !v)} />
          </div>
          {abierto3 && (
            <>
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
                  calendarioCompleto={calendarioCompleto}
                  picoBusquedaMes={picosBusqueda[udnNombre] ?? null}
                />
              ) : (
                <p style={{ fontSize: 12.5, color: '#94a3b8' }}>Cargando calendario...</p>
              )}
            </>
          )}
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
                fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>4</span>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Descubrir nuevas empresas</h3>
            </div>
            <Chevron abierto={abierto4} onClick={() => setAbierto4(v => !v)} />
          </div>
          {abierto4 && (
            <>
              <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
                Universo INEGI - Empresas por abordar. Filtra por sector, tamaño y ubicación para encontrar prospectos.
              </p>
              <ProspeccionDenue onTotalChange={() => {}} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
