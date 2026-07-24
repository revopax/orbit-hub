'use client';
import { useEffect, useRef } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { mockSerieTemporal } from '../../lib/mockCruceSenales';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

interface GraficaCruceSenalesProps {
  brandColor: string;
  isDark: boolean;
}

export function GraficaCruceSenales({ brandColor, isDark }: GraficaCruceSenalesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(83,74,183,0.08)';
    const textColor = isDark ? 'rgba(255,255,255,0.65)' : '#3D3A6B';

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: mockSerieTemporal.map(p => p.mes),
        datasets: [
          { label: 'IGAE estructural', data: mockSerieTemporal.map(p => p.igae), borderColor: brandColor, backgroundColor: brandColor, borderWidth: 2, pointRadius: 0, tension: 0.3 },
          { label: 'Señal reactiva', data: mockSerieTemporal.map(p => p.reactiva), borderColor: '#1baf7a', backgroundColor: '#1baf7a', borderWidth: 2, pointRadius: 0, tension: 0.3, borderDash: [5, 3] },
          { label: 'Contactos propios', data: mockSerieTemporal.map(p => p.contactos), borderColor: '#eda100', backgroundColor: '#eda100', borderWidth: 2, pointRadius: 0, tension: 0.3, borderDash: [2, 2] },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top', align: 'start', labels: { color: textColor, font: { size: 11 }, boxWidth: 10, boxHeight: 10 } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          y: { title: { display: true, text: 'Indice (base 100)', color: textColor, font: { size: 11 } }, grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [brandColor, isDark]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
