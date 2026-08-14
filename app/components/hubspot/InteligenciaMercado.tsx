'use client';

import { useState } from 'react';

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

const TIPO_COLOR: Record<TipoSenal, string> = { 'Expansión': '#059669', 'Inversión': '#2563eb', 'Apertura': '#7c3aed', 'Cambio de puesto': '#d97706' };
const TIPO_BG: Record<TipoSenal, string> = { 'Expansión': '#d1fae5', 'Inversión': '#dbeafe', 'Apertura': '#ede9fe', 'Cambio de puesto': '#fef3c7' };
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
  if (nombre === '—') return <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9' }} />;
  const iniciales = nombre.split(' ').map(p => p[0]).slice(0, 2).join('');
  const color = SDR_COLOR[nombre] || '#94a3b8';
  return (
    <div style={{ width: 26, height: 26, borderRadius: '50%', background: color, color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {iniciales}
    </div>
  );
}

export default function InteligenciaMercado() {
  const [filtroUdn, setFiltroUdn] = useState<string>('Todas');
  const udns = ['Todas', 'UIX', 'Marketing United', 'Promo Espacio', 'Zeus', 'Neracode', 'House Of Films', 'Research Land', 'Mexa Creativa'];
  const senalesFiltradas = filtroUdn === 'Todas' ? SENALES_DUMMY : SENALES_DUMMY.filter(s => s.udn === filtroUdn);

  const potencialSinCubrir = 3240;
  const senalesActivas = SENALES_DUMMY.filter(s => s.estado === 'nueva' || s.estado === 'asignada').length;
  const cambiosPuesto = SENALES_DUMMY.filter(s => s.tipo === 'Cambio de puesto').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>Potencial sin cubrir</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0f172a' }}>{potencialSinCubrir.toLocaleString()}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>empresas objetivo (DENUE)</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>Señales activas</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0f172a' }}>{senalesActivas}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>últimos 7 días</p>
        </div>
        <div style={cardStyle}>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>Cambios de puesto</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0f172a' }}>{cambiosPuesto}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>este mes</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>Potencial de mercado por UDN</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Cruce DENUE (filtro empleados) vs. cartera actual — pendiente de conectar pipeline real.</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>Señales de mercado</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#059669' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', display: 'inline-block', animation: 'pulse 1.6s infinite' }} />
              EN VIVO
            </span>
          </div>
          <select value={filtroUdn} onChange={(e) => setFiltroUdn(e.target.value)} style={{ fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', color: '#475569' }}>
            {udns.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>Detecciones de Brand24 y Apollo — expansión, inversión y cambios de puesto clave.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {senalesFiltradas.map((s, i) => (
            <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{s.empresa}</span>
                  <Badge label={s.tipo} color={TIPO_COLOR[s.tipo]} bg={TIPO_BG[s.tipo]} />
                  <Badge label={s.estado} color={ESTADO_COLOR[s.estado]} bg={ESTADO_BG[s.estado]} />
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{s.fecha}</span>
              </div>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 10px', lineHeight: 1.5 }}>
                &ldquo;{s.senalPublica}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Fuente: <strong style={{ color: '#64748b' }}>{s.fuenteSistema}</strong> · {s.medio} · UDN: <strong style={{ color: '#64748b' }}>{s.udn}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar nombre={s.dueno} />
                  <span style={{ fontSize: 12, color: '#64748b' }}>{s.dueno}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
