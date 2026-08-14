'use client';

import { useState } from 'react';

type EstadoSenal = 'nueva' | 'asignada' | 'contactada' | 'perdida';
type TipoSenal = 'Expansión' | 'Inversión' | 'Apertura' | 'Contacto';

interface Senal {
  fecha: string;
  empresa: string;
  tipo: TipoSenal;
  fuente: 'Brand24' | 'Apollo';
  udn: string;
  estado: EstadoSenal;
  dueno: string;
  detalle: string;
}

const SENALES_DUMMY: Senal[] = [
  { fecha: '13 ago', empresa: 'Grupo Kalvix', tipo: 'Expansión', fuente: 'Brand24', udn: 'Zeus', estado: 'nueva', dueno: '—', detalle: 'Anuncia nueva planta en Querétaro' },
  { fecha: '12 ago', empresa: 'Nortex MX', tipo: 'Inversión', fuente: 'Brand24', udn: 'UIX', estado: 'asignada', dueno: 'Elizabeth Gomez', detalle: 'Ronda de inversión serie B' },
  { fecha: '11 ago', empresa: 'Frio Express', tipo: 'Contacto', fuente: 'Apollo', udn: 'Research Land', estado: 'contactada', dueno: 'Jennifer Silva', detalle: 'Director de Operaciones cambió de puesto' },
  { fecha: '08 ago', empresa: 'Difrenosa', tipo: 'Contacto', fuente: 'Apollo', udn: 'Zeus', estado: 'perdida', dueno: 'Antonio Vargas', detalle: 'Sin presupuesto — reintento en 90 días' },
];

const TIPO_COLOR: Record<TipoSenal, string> = {
  'Expansión': '#059669',
  'Inversión': '#2563eb',
  'Apertura': '#7c3aed',
  'Contacto': '#d97706',
};
const TIPO_BG: Record<TipoSenal, string> = {
  'Expansión': '#d1fae5',
  'Inversión': '#dbeafe',
  'Apertura': '#ede9fe',
  'Contacto': '#fef3c7',
};
const ESTADO_COLOR: Record<EstadoSenal, string> = {
  nueva: '#475569', asignada: '#2563eb', contactada: '#059669', perdida: '#dc2626',
};
const ESTADO_BG: Record<EstadoSenal, string> = {
  nueva: '#f1f5f9', asignada: '#dbeafe', contactada: '#d1fae5', perdida: '#fee2e2',
};

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, border: '1px solid #eef0f3',
  boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '20px 24px',
};

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color }}>
      {label}
    </span>
  );
}

export default function InteligenciaMercado() {
  const [filtroUdn, setFiltroUdn] = useState<string>('Todas');
  const udns = ['Todas', 'UIX', 'Marketing United', 'Promo Espacio', 'Zeus', 'Neracode', 'House Of Films', 'Research Land', 'Mexa Creativa'];

  const senalesFiltradas = filtroUdn === 'Todas' ? SENALES_DUMMY : SENALES_DUMMY.filter(s => s.udn === filtroUdn);
  const potencialSinCubrir = 3240;
  const senalesActivas = SENALES_DUMMY.filter(s => s.estado === 'nueva' || s.estado === 'asignada').length;
  const cambiosContacto = SENALES_DUMMY.filter(s => s.fuente === 'Apollo').length;

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
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>Cambios de contacto</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0f172a' }}>{cambiosContacto}</p>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>este mes</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>Potencial de mercado por UDN</h3>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Cruce DENUE (filtro empleados) vs. cartera actual — pendiente de conectar pipeline real.</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0f172a' }}>Señales de mercado</h3>
          <select
            value={filtroUdn}
            onChange={(e) => setFiltroUdn(e.target.value)}
            style={{ fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', color: '#475569' }}
          >
            {udns.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              {['Fecha', 'Empresa', 'Tipo', 'Fuente', 'UDN', 'Estado', 'Dueño'].map(h => (
                <th key={h} style={{ fontWeight: 500, color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, paddingBottom: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {senalesFiltradas.map((s, i) => (
              <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#64748b' }}>{s.fecha}</td>
                <td style={{ padding: '12px 0', fontWeight: 600, color: '#0f172a' }}>{s.empresa}</td>
                <td style={{ padding: '12px 0' }}><Badge label={s.tipo} color={TIPO_COLOR[s.tipo]} bg={TIPO_BG[s.tipo]} /></td>
                <td style={{ padding: '12px 0', color: '#64748b' }}>{s.fuente}</td>
                <td style={{ padding: '12px 0', color: '#64748b' }}>{s.udn}</td>
                <td style={{ padding: '12px 0' }}><Badge label={s.estado} color={ESTADO_COLOR[s.estado]} bg={ESTADO_BG[s.estado]} /></td>
                <td style={{ padding: '12px 0', color: '#64748b' }}>{s.dueno}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
