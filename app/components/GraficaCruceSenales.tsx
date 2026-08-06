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
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);
const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

interface KeywordSignal { mes: string; indice_mercado: number | null; }
interface GraficaCruceSenalesProps {
  brandColor: string;
  isDark: boolean;
  udn: string;
  desde: string;
  hasta: string;
}

export function GraficaCruceSenales({ brandColor, isDark, udn, desde, hasta }: GraficaCruceSenalesProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<Chart | null>(null);
  const pulseRef     = useRef<HTMLDivElement>(null);
  const ringRef      = useRef<HTMLDivElement>(null);
  const labelRef     = useRef<HTMLDivElement>(null);
  const bandRef      = useRef<HTMLDivElement>(null);
  const [reactiva, setReactiva] = useState<KeywordSignal[]>([]);
  const cacheRef = useRef<Record<string, KeywordSignal[]>>({});

  useEffect(() => {
    const cacheKey = `${udn}-${desde}-${hasta}`;
    if (cacheRef.current[cacheKey]) {
      setReactiva(cacheRef.current[cacheKey]);
      return;
    }
    supaAnalytics
      .rpc('get_keywords_signal', { p_udn: udn, p_desde: desde, p_hasta: hasta })
      .then(({ data, error }) => {
        if (error || !data) return;
        const parsed = data.map((r: { mes: string; indice_mercado: number | null }) => ({
          mes: r.mes,
          indice_mercado: r.indice_mercado === null ? null : Number(r.indice_mercado),
        }));
        cacheRef.current[cacheKey] = parsed;
        setReactiva(parsed);
      });
  }, [udn, desde, hasta]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(83,74,183,0.06)';
    const textColor = isDark ? 'rgba(255,255,255,0.55)' : '#6B6A8A';

    const labels       = reactiva.length > 0 ? reactiva.map(p => MESES_CORTOS[parseInt(p.mes.split('-')[1]) - 1]) : mockSerieTemporal.map(p => p.mes);
    const reactivaData = reactiva.length > 0 ? reactiva.map(p => p.indice_mercado) : mockSerieTemporal.map(p => p.reactiva);
    const igaeData     = mockSerieTemporal.map(p => p.igae);
    const contactosData= mockSerieTemporal.map(p => p.contactos);

    const umbralPlugin = {
      id: 'umbral',
      afterDraw(chart: Chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        const yPx = y.getPixelForValue(100);
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(100,100,160,0.3)';
        ctx.lineWidth = 1;
        ctx.moveTo(left, yPx);
        ctx.lineTo(right, yPx);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '9px sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(100,100,160,0.6)';
        ctx.fillText('base 100 · por encima = señal activa', right - 178, yPx - 4);
        ctx.restore();
      },
    };
    Chart.register(umbralPlugin as any);
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pulso del Mercado',
            data: igaeData,
            borderColor: brandColor,
            backgroundColor: brandColor,
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.4,
          },
          {
            label: 'Intención de Búsqueda',
            data: reactivaData,
            borderColor: '#1baf7a',
            backgroundColor: 'rgba(27,175,122,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            borderDash: [6, 3],
            fill: false,
            spanGaps: false,
          },
          {
            label: 'MQLs HubSpot',
            data: contactosData,
            borderColor: '#eda100',
            backgroundColor: '#eda100',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.4,
            borderDash: [2, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: isDark ? '#1e1e2e' : '#fff',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: isDark ? '#fff' : '#1e1b4b',
            bodyColor: isDark ? 'rgba(255,255,255,0.7)' : '#4B5563',
            padding: 10,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}`,
            },
          },
        },
        scales: {
          y: {
            min: 85,
            title: { display: true, text: 'Índice (base 100)', color: textColor, font: { size: 10 } },
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 10 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10 } },
          },
        },
        animation: {
          onComplete: () => { posicionarOverlays(); },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [brandColor, isDark, reactiva, udn]);

  function posicionarOverlays() {
    const chart = chartRef.current;
    if (!chart || !wrapperRef.current) return;

    const data      = reactiva.length > 0 ? reactiva.map(p => p.indice_mercado ?? 0) : mockSerieTemporal.map(p => p.reactiva);
    const maxVal    = Math.max(...data);
    const maxIdx    = data.indexOf(maxVal);
    const labels    = reactiva.length > 0 ? reactiva.map(p => MESES_CORTOS[parseInt(p.mes.split('-')[1]) - 1]) : mockSerieTemporal.map(p => p.mes);
    const mesPico   = labels[maxIdx] ?? '';

    const xPx = chart.scales.x.getPixelForValue(maxIdx);
    const yPx = chart.scales.y.getPixelForValue(maxVal);

    // Banda vertical — meses donde intención > 100
    // Banda: desde donde empieza a subir hasta el pico (no después)
    const activeIdxs = data.reduce<number[]>((acc, v, i) => { if (v > 115 && i <= maxIdx) acc.push(i); return acc; }, []);
    if (bandRef.current && activeIdxs.length > 0) {
      const xStart = chart.scales.x.getPixelForValue(activeIdxs[0]);
      const xEnd   = chart.scales.x.getPixelForValue(activeIdxs[activeIdxs.length - 1]);
      const chartTop    = chart.chartArea.top;
      const chartBottom = chart.chartArea.bottom;
      bandRef.current.style.left   = `${xStart - 8}px`;
      bandRef.current.style.top    = `${chartTop}px`;
      bandRef.current.style.width  = `${xEnd - xStart + 16}px`;
      bandRef.current.style.height = `${chartBottom - chartTop}px`;
      bandRef.current.style.display = 'block';
    }

    // Pulso + label
    if (pulseRef.current && ringRef.current && labelRef.current) {
      pulseRef.current.style.left = `${xPx - 5}px`;
      pulseRef.current.style.top  = `${yPx - 5}px`;
      ringRef.current.style.left  = `${xPx - 5}px`;
      ringRef.current.style.top   = `${yPx - 5}px`;
      labelRef.current.style.left = `${xPx + 10}px`;
      labelRef.current.style.top  = `${yPx - 22}px`;
      // mesPico ya es el label corto del eje X (ej: 'Abr')
      // El año lo tomamos del mes reactivo con mayor índice
      const mesPicoRaw = reactiva.length > 0 ? reactiva[maxIdx]?.mes ?? '' : '';
      const anioPico = mesPicoRaw ? mesPicoRaw.split('-')[0] : '';
      labelRef.current.textContent = anioPico
        ? `Pico de búsqueda · ${mesPico} ${anioPico}`
        : `Pico de búsqueda · ${mesPico}`;
    }
  }

  const pulseColor  = '#1baf7a';
  const umbralColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(100,100,160,0.25)';

  return (
    <div>
      <style>{`
        @keyframes orbit-pulse {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(3); opacity: 0; }
        }
        .orbit-pulse-ring {
          position: absolute;
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid ${pulseColor};
          animation: orbit-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }
        .orbit-pulse-dot {
          position: absolute;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: ${pulseColor};
          pointer-events: none;
          z-index: 3;
        }
        .orbit-pico-label {
          position: absolute;
          font-size: 10px;
          font-weight: 600;
          color: ${pulseColor};
          background: ${isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)'};
          border: 1px solid ${pulseColor}44;
          border-radius: 4px;
          padding: 2px 7px;
          pointer-events: none;
          z-index: 4;
          white-space: nowrap;
        }
        .orbit-banda {
          position: absolute;
          background: rgba(27,175,122,0.07);
          border-left: 1.5px solid rgba(27,175,122,0.3);
          border-right: 1.5px solid rgba(27,175,122,0.3);
          pointer-events: none;
          display: none;
          z-index: 1;
        }
      `}</style>

      {/* Canvas wrapper */}
      <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: 280 }}>
        {/* 1 · Banda vertical */}
        <div ref={bandRef} className="orbit-banda" />

        {/* 2 · Línea umbral base 100 — via plugin inline */}
        <canvas ref={canvasRef} />

        {/* 3 · Label pico */}
        <div ref={labelRef} className="orbit-pico-label" style={{ position: 'absolute' }} />

        {/* 4 · Pulso radar */}
        <div ref={ringRef}  className="orbit-pulse-ring" style={{ position: 'absolute' }} />
        <div ref={pulseRef} className="orbit-pulse-dot"  style={{ position: 'absolute' }} />
      </div>

      {/* Leyenda custom */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: 14, paddingLeft: 4 }}>
        {[
          { color: brandColor,  dash: false, label: 'Pulso del Mercado',      desc: 'Dinamismo económico por industria (IGAE · INEGI)' },
          { color: '#1baf7a',   dash: true,  label: 'Intención de Búsqueda',  desc: 'Demanda activa de marca en Google Ads' },
          { color: '#eda100',   dash: true,  label: 'MQLs HubSpot',           desc: 'Contactos calificados registrados en CRM' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 160 }}>
            <svg width="24" height="14" style={{ marginTop: 2, flexShrink: 0 }}>
              <line x1="0" y1="7" x2="24" y2="7"
                stroke={s.color} strokeWidth="2"
                strokeDasharray={s.dash ? '5,3' : 'none'} />
            </svg>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#fff' : '#1e1b4b' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.45)' : '#6B7280', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
