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

const BADGE_COLOR: Record<TipoSenal, string> = {
  'Expansión': 'bg-green-100 text-green-800',
  'Inversión': 'bg-blue-100 text-blue-800',
  'Apertura': 'bg-purple-100 text-purple-800',
  'Contacto': 'bg-amber-100 text-amber-800',
};

const ESTADO_COLOR: Record<EstadoSenal, string> = {
  nueva: 'bg-gray-100 text-gray-700',
  asignada: 'bg-blue-100 text-blue-700',
  contactada: 'bg-green-100 text-green-700',
  perdida: 'bg-red-100 text-red-700',
};

export default function InteligenciaMercado() {
  const [filtroUdn, setFiltroUdn] = useState<string>('Todas');
  const udns = ['Todas', 'UIX', 'Marketing United', 'Promo Espacio', 'Zeus', 'Neracode', 'House Of Films', 'Research Land', 'Mexa Creativa'];

  const senalesFiltradas = filtroUdn === 'Todas'
    ? SENALES_DUMMY
    : SENALES_DUMMY.filter(s => s.udn === filtroUdn);

  const potencialSinCubrir = 3240;
  const senalesActivas = SENALES_DUMMY.filter(s => s.estado === 'nueva' || s.estado === 'asignada').length;
  const cambiosContacto = SENALES_DUMMY.filter(s => s.fuente === 'Apollo').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Potencial sin cubrir</p>
          <p className="text-2xl font-medium">{potencialSinCubrir.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">empresas objetivo (DENUE)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Señales activas</p>
          <p className="text-2xl font-medium">{senalesActivas}</p>
          <p className="text-xs text-gray-400 mt-1">últimos 7 días</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-1">Cambios de contacto</p>
          <p className="text-2xl font-medium">{cambiosContacto}</p>
          <p className="text-xs text-gray-400 mt-1">este mes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-medium mb-3">Potencial de mercado por UDN</h3>
        <p className="text-sm text-gray-500">Cruce DENUE (filtro empleados) vs. cartera actual — pendiente de conectar pipeline real.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">Señales de mercado</h3>
          <select
            value={filtroUdn}
            onChange={(e) => setFiltroUdn(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
          >
            {udns.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs">
              <th className="pb-2 font-normal">Fecha</th>
              <th className="pb-2 font-normal">Empresa</th>
              <th className="pb-2 font-normal">Tipo</th>
              <th className="pb-2 font-normal">Fuente</th>
              <th className="pb-2 font-normal">UDN</th>
              <th className="pb-2 font-normal">Estado</th>
              <th className="pb-2 font-normal">Dueño</th>
            </tr>
          </thead>
          <tbody>
            {senalesFiltradas.map((s, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-2.5 text-gray-600">{s.fecha}</td>
                <td className="py-2.5 font-medium">{s.empresa}</td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${BADGE_COLOR[s.tipo]}`}>{s.tipo}</span>
                </td>
                <td className="py-2.5 text-gray-500">{s.fuente}</td>
                <td className="py-2.5 text-gray-600">{s.udn}</td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[s.estado]}`}>{s.estado}</span>
                </td>
                <td className="py-2.5 text-gray-600">{s.dueno}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
