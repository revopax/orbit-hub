'use client';

import { useState, useEffect } from 'react';

type EstadoSenal = 'nueva' | 'asignada' | 'contactada' | 'perdida';
type TipoSenal = 'Expansión' | 'Inversión' | 'Apertura' | 'Cambio de puesto';
type FuenteSistema = 'Brand24' | 'Apollo';

interface Senal {
  fecha: string;
  empresa: string;
  tipo: TipoSenal;
  fuenteSistema: FuenteSistema;
  medio: string;
  senalPublica: string;
  udn: string;
  estado: EstadoSenal;
  dueno: string;
}

const SENALES_DUMMY: Senal[] = [
  { fecha: '13 ago', empresa: 'Grupo Kalvix', tipo: 'Expansión', fuenteSistema: 'Brand24', medio: 'El Heraldo de León', senalPublica: 'Con la apertura de una nueva sucursal, la marca fortalece su estrategia de expansión nacional, alcanzando 125 tiendas.', udn: 'Zeus', estado: 'nueva', dueno: '—' },
  { fecha: '12 ago', empresa: 'Nortex MX', tipo: 'Inversión', fuenteSistema: 'Brand24', medio: 'cincodias.elpais.com', senalPublica: 'La empresa cuenta con 70 empleados y ha facturado casi 25 millones de euros en 2025, cerrando una ronda serie B.', udn: 'UIX', estado: 'asignada', dueno: 'Elizabeth Gomez' },
  { fecha: '11 ago', empresa: 'Frio Express', tipo: 'Cambio de puesto', fuenteSistema: 'Apollo', medio: 'LinkedIn', senalPublica: 'Cambio de puesto: Gerente de Operaciones → Director de Operaciones.', udn: 'Research Land', estado: 'contactada', dueno: 'Jennifer Silva' },
  { fecha: '08 ago', empresa: 'Difrenosa', tipo: 'Cambio de puesto', fuenteSistema: 'Apollo', medio: 'LinkedIn', senalPublica: 'Cambio de puesto: Coordinador → Gerente de Compras.', udn: 'Zeus', estado: 'perdida', dueno: 'Antonio Vargas' },
];

const TIPO_COLOR: Record<string, string> = { 'Expansión': '#059669', 'Inversión': '#2563eb', 'Apertura': '#7c3aed', 'Cambio de puesto': '#d97706', 'Otro': '#64748b' };
const TIPO_BG: Record<string, string> = { 'Expansión': '#d1fae5', 'Inversión': '#dbeafe', 'Apertura': '#ede9fe', 'Cambio de puesto': '#fef3c7', 'Otro': '#f1f5f9' };
const TIPO_ICONO: Record<string, string> = { 'Expansión': '🏬', 'Inversión': '💰', 'Cambio de puesto': '👤', 'Apertura': '🆕', 'Otro': '📰' };
const ESTADO_COLOR: Record<EstadoSenal, string> = { nueva: '#475569', asignada: '#2563eb', contactada: '#059669', perdida: '#dc2626' };
const ESTADO_BG: Record<EstadoSenal, string> = { nueva: '#f1f5f9', asignada: '#dbeafe', contactada: '#d1fae5', perdida: '#fee2e2' };
const SDR_COLOR: Record<string, string> = {
  'Elizabeth Gomez': '#8C59FE', 'Jennifer Silva': '#2563eb', 'Antonio Vargas': '#059669', 'Neyby Ruiz': '#d97706', 'Edna Gonzalez': '#dc2626', 'Otniel Sedano': '#0891b2',
};

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '20px 24px' };

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{label}</span>;
}

function Avatar({ nombre }: { nombre: string }) {
  if (nombre === '—') return <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#f1f5f9', flexShrink: 0 }} />;
  const iniciales = nombre.split(' ').map(p => p[0]).slice(0, 2).join('');
  const color = SDR_COLOR[nombre] || '#94a3b8';
  return (
    <div title={nombre} style={{ width: 24, height: 24, borderRadius: '50%', background: color, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {iniciales}
    </div>
  );
}

export function ScoreCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub: string; accent: string; icon: string }) {
  return (
    <div style={{ ...cardStyle, position: 'relative', overflow: 'hidden', padding: '18px 22px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: accent }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</p>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: -0.5 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>{sub}</p>
    </div>
  );
}

// ProspeccionDenue movido a Overview seccion 4

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

export function SenalesMercado() {
  const [menciones, setMenciones] = useState<MencionAPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/brand24-menciones')
      .then(res => res.json())
      .then(json => {
        if (json.error) { setError(json.error); return; }
        setMenciones(json.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={cardStyle}>
      <div style={{ position: 'relative' }}>
        {!cargando && !error && (
          <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'right' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11.5, fontWeight: 700, color: '#5b3fd6',
              background: '#f8f7ff', border: '1px solid #ece9ff',
              borderRadius: 999, padding: '4px 12px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.6s infinite' }} />
              Última actualización: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
              Próx. actualización: al recargar la página
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>2</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Señales de mercado</h3>
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>Detecciones externas de expansión, inversión y cambios de puesto que podrían indicar una nueva oportunidad, vía Brand24.</p>

      {cargando && <p style={{ fontSize: 13, color: '#94a3b8' }}>Cargando menciones…</p>}
      {error && <p style={{ fontSize: 13, color: '#dc2626' }}>Error: {error}</p>}

      {!cargando && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
          {menciones.length === 0 && <p style={{ fontSize: 13, color: '#94a3b8' }}>Sin menciones en los últimos 7 días.</p>}
          {menciones.map((m, i) => {
            const color = TIPO_COLOR[m.tipo] || '#64748b';
            const bg = TIPO_BG[m.tipo] || '#f1f5f9';
            const icono = TIPO_ICONO[m.tipo] || '📰';
            return (
              <div key={i} style={{ display: 'flex', position: 'relative', borderRadius: 10, border: '1px solid #eef0f3', overflow: 'hidden', background: '#fafbfc', minHeight: 80, flexShrink: 0, animation: 'fadeInDown 0.5s ease' }}>
                <div style={{ width: 4, background: color, flexShrink: 0 }} />
                <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span>{icono}</span>
                    <Badge label={m.tipo} color={color} bg={bg} />
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{tiempoRelativo(m.fecha, m.hora)}</span>
                  </div>
                  {m.url ? (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.45, textDecoration: 'none', display: 'block' }}
                       onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                       onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                      {m.titulo || m.contenido?.slice(0, 160) || 'Mención sin texto'}
                    </a>
                  ) : (
                    <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.45 }}>
                      {m.titulo || m.contenido?.slice(0, 160) || 'Mención sin texto'}
                    </p>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{m.fuente}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InteligenciaMercado() {
  const [potencialSinCubrir, setPotencialSinCubrir] = useState(0);
  const senalesActivas = SENALES_DUMMY.filter(s => s.estado === 'nueva' || s.estado === 'asignada').length;
  const cambiosPuesto = SENALES_DUMMY.filter(s => s.tipo === 'Cambio de puesto').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <ScoreCard label="Potencial sin cubrir" value={potencialSinCubrir.toLocaleString()} sub="empresas sin cartera activa" accent="#8C59FE" icon="" />
        <ScoreCard label="Señales activas" value={senalesActivas} sub="últimos 7 días" accent="#059669" icon="📡" />
        <ScoreCard label="Cambios de puesto" value={cambiosPuesto} sub="este mes" accent="#d97706" icon="💼" />
      </div>


      <SenalesMercado />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} } @keyframes fadeInDown { from { opacity:0; transform: translateY(-8px); } to { opacity:1; transform: translateY(0); } }`}</style>
    </div>
  );
}
