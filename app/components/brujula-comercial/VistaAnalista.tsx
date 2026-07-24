'use client'
import { useState } from 'react'
import UDNSelector, { type UDNId } from './UDNSelector'
import BloqueCalidadLeads from './BloqueCalidadLeads'
import RadarPerdidas from './RadarPerdidas'
import BloqueCrossSell from './BloqueCrossSell'
import BloqueCegueraOperativa from './BloqueCegueraOperativa'

interface VistaAnalistaProps {
  data: Record<string, any>
  perfil?: any
  brand?: string
  isDark?: boolean
}

export default function VistaAnalista({ data, perfil }: VistaAnalistaProps) {
  const [selectedUDNs, setSelectedUDNs] = useState<UDNId[]>(['UIX', 'MU', 'PE'])

  return (
    <div className="w-full">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 8 }}>
          Comparativa entre UDNs — hallazgos operativos y oportunidades de coordinación
        </p>
        <p style={{ fontSize: 13, color: 'var(--txt-3)', marginBottom: 0 }}>
          Compara calidad de leads, motivos de pérdida, sectores en disputa y empresas que ya confían en más de una unidad. Úsala para coordinar, priorizar y cerrar más.
        </p>
      </div>
      {/* Bloque 1: Selector UDNs */}
      {/* Bloque 1: Selector UDNs */}
      <UDNSelector
        selected={selectedUDNs}
        onChange={setSelectedUDNs}
        max={3}
      />

      {/* Bloque 1: Ceguera operativa */}
      <div style={{ marginTop: 40 }} />
      <BloqueCegueraOperativa selectedUDNs={selectedUDNs} data={data} perfil={perfil} />
      {/* Bloque 2: ¿Por qué perdemos? */}
      <div style={{ marginTop: 56 }} />
      <RadarPerdidas selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 5: Cross-sell */}
      <div style={{ marginTop: 56 }} />
      <BloqueCrossSell selectedUDNs={selectedUDNs} data={data} />

      {/* Bloque 6: Ceguera operativa */}
      <div className="mt-10" />
    </div>
  )
}
