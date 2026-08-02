'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip, Legend, Filler,
} from 'chart.js';
import { mockSerieTemporal } from '../lib/mockCruceSenales';
import { createClient } from '@supabase/supabase-js';
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const supaAnalytics = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_MBR!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MBR!
);

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface KeywordSignal { mes: string; indice: number; }

interface GraficaCruceSenalesProps {
  brandColor: string;
  isDark: boolean;
  udn: string;
  anio?: number;
}

export function GraficaCruceSenales({ brandColor, isDark, udn, anio }: GraficaCruceSenalesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [reactiva, setReactiva] = useState<KeywordSignal[]>([]);

  useEffect(() => {
    const anioConsulta = anio ?? new Date().getFullYear() - 1;
    supaAnalytics
      .rpc('get_keywords_signal', { p_udn: udn, p_anio: anioConsulta })
      .then(({ data, error }) => {
        if (error || !data) return;
        console.log('[Señal reactiva]', udn, data);
        setReactiva(data.map((r: { mes: string; indice: number }) => ({ mes: r.mes, indice: Number(r.indice) })));
      });
  }, [udn, anio]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(83,74,183,0.08)';
    const textColor = isDark ? 'rgba(255,255,255,0.65)' : '#3D3A6B';

    const labels = reactiva.length > 0
      ? reactiva.map(p => MESES_CORTOS[parseInt(p.mes.split('-')[1]) - 1])
      : mockSerieTemporal.map(p => p.mes);
    const reactivaData = reactiva.length > 0
      ? reactiva.map(p => p.indice)
      : mockSerieTemporal.map(p => p.reactiva);

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'IGAE estructural', data: mockSerieTemporal.map(p => p.igae), borderColor: brandColor, backgroundColor: brandColor, borderWidth: 2, pointRadius: 0, tension: 0.3 },
          { label: 'Señal reactiva', data: reactivaData, borderColor: '#1baf7a', backgroundColor: '#1baf7a', borderWidth: 2, pointRadius: 0, tension: 0.3, borderDash: [5, 3] },
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
  }, [brandColor, isDark, reactiva, udn]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
