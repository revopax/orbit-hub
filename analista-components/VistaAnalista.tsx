'use client'
import { useState } from 'react'
import UDNSelector, { type UDNId } from './UDNSelector'
import BloqueCalidadLeads from './BloqueCalidadLeads'
import RadarPerdidas from './RadarPerdidas'
import BloqueSectoresCompetencia from './BloqueSectoresCompetencia'
import BloqueCrossSell from './BloqueCrossSell'
import BloqueCegueraOperativa from './BloqueCegueraOperativa'

interface VistaAnalistaProps {
  data: Record<string, any>
}

export default function VistaAnalista({ data }: VistaAnalistaProps) {
  const [selectedUDNs, setSelectedUDNs] = useState<UDNId[]>(['UIX', 'MU', 'PE'])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Vista del Analista</h2>
        <p className="text-sm text-slate-500">
          Comparativa entre UDNs — hallazgos operativos y oportunidades de coordinación
        </p>
      </div>

      {/* Bloque 1: Selector UDNs */}
      <UDNSelector
        selected={selectedUDNs}
        onChange={setSelectedUDNs}
        max={3}
      />

      {/* Hallazgos EDA destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">78%</div>
          <div className="text-xs text-slate-300">del pipeline sin calificar</div>
          <div className="text-[10px] text-slate-400 mt-1">Problema de proceso, no de timing</div>
        </div>
        <div className="bg-slate-800 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">0.0%</div>
          <div className="text-xs text-slate-300">Tasa conversión Marketing</div>
          <div className="text-[10px] text-slate-400 mt-1">Leads no se califican, no que no vendan</div>
        </div>
        <div className="bg-slate-800 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">83</div>
          <div className="text-xs text-slate-300">Empresas reales en 2+ UDNs</div>
          <div className="text-[10px] text-slate-400 mt-1">Cross-sell real (vs 5,989 contactos campañas)</div>
        </div>
      </div>

      {/* Bloque 2: Calidad de leads */}
      <BloqueCalidadLeads selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 3: ¿Por qué perdemos? */}
      <RadarPerdidas selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 4: Sectores competidos */}
      <BloqueSectoresCompetencia selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 5: Cross-sell */}
      <BloqueCrossSell selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 6: Ceguera operativa */}
      <BloqueCegueraOperativa selectedUDNs={selectedUDNs} data={data} />
    </div>
  )
}
