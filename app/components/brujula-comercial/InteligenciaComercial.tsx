'use client';
import { useEffect, useState } from 'react';
import BloqueDENUE from './BloqueDENUE';
import { CalendarioGrid } from './CalendarioGrid';
import { PicosEmpresasTable } from './PicosEmpresasTable';
import type { PicoRow, RescueRow, EmpresaPico } from '../../lib/types';

type Estado = 'pico' | 'prep' | 'ok' | 'vacio';

interface CalendarioData {
  meses: string[];
  filas: { industria: string; celdas: Estado[] }[];
}

interface BrujulaDataShape {
  calendario: Record<string, CalendarioData>;
  picos: Record<string, PicoRow[]>;
  rescue: Record<string, RescueRow[]>;
  empresas_pico: Record<string, EmpresaPico[]>;
}

interface Props {
  udnId: string;
  brandColor: string;
}

export default function InteligenciaComercial({ udnId, brandColor }: Props) {
  const [data, setData] = useState<BrujulaDataShape | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => { if (!cancelled) { setData(json); setLoading(false) } })
      .catch(err => {
        console.error('Error cargando brujula_data.json:', err)
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, color: 'var(--txt-3)', fontSize: 13 }}>
        Cargando inteligencia comercial…
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 20, color: 'var(--txt-3)', fontSize: 13 }}>
        No se pudo cargar la información.
      </div>
    );
  }

  const calendario = data.calendario?.[udnId];
  const picos = data.picos?.[udnId] ?? [];
  const rescue = data.rescue?.[udnId] ?? [];
  const empresasPico = data.empresas_pico?.[udnId] ?? [];

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <BloqueDENUE />
      </div>

      {calendario && (
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <CalendarioGrid
            meses={calendario.meses}
            filas={calendario.filas}
            brandColor={brandColor}
            udnId={udnId}
          />
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <PicosEmpresasTable
          picos={picos}
          rescue={rescue}
          empresasPico={empresasPico}
          brandColor={brandColor}
        />
      </div>
    </div>
  );
}
