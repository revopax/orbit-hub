'use client';
import { useState } from 'react';

interface SelectorRangoMesesProps {
  desde: string; // 'YYYY-MM'
  hasta: string; // 'YYYY-MM'
  maxMes: string; // límite superior, ej '2026-08'
  onChange: (desde: string, hasta: string) => void;
}

function mesesAtras(mesRef: string, n: number): string {
  const [y, m] = mesRef.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function SelectorRangoMeses({ desde, hasta, maxMes, onChange }: SelectorRangoMesesProps) {
  const [localDesde, setLocalDesde] = useState(desde);
  const [localHasta, setLocalHasta] = useState(hasta);

  const presets = [
    { label: 'Últimos 12 meses', desde: mesesAtras(maxMes, 11), hasta: maxMes },
    { label: '2025', desde: '2025-01', hasta: '2025-12' },
    { label: '2026', desde: '2026-01', hasta: maxMes },
    { label: 'Todo', desde: '2025-07', hasta: maxMes },
  ];

  const aplicarPreset = (p: { desde: string; hasta: string }) => {
    setLocalDesde(p.desde);
    setLocalHasta(p.hasta);
    onChange(p.desde, p.hasta);
  };

  const aplicarCustom = () => {
    if (localDesde && localHasta && localDesde <= localHasta) {
      onChange(localDesde, localHasta);
    }
  };

  return (
    <div className="orbit-selector-rango" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {presets.map((p) => (
        <button
          key={p.label}
          onClick={() => aplicarPreset(p)}
          className={desde === p.desde && hasta === p.hasta ? 'activo' : ''}
        >
          {p.label}
        </button>
      ))}
      <span style={{ opacity: 0.5 }}>|</span>
      <input
        type="month"
        value={localDesde}
        max={localHasta || maxMes}
        onChange={(e) => setLocalDesde(e.target.value)}
      />
      <span>→</span>
      <input
        type="month"
        value={localHasta}
        max={maxMes}
        onChange={(e) => setLocalHasta(e.target.value)}
      />
      <button onClick={aplicarCustom}>Aplicar</button>
    </div>
  );
}
