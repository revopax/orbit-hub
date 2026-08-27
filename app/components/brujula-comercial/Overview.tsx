'use client';
import React, { useEffect, useState } from 'react';
import { CalendarioGrid } from './CalendarioGrid';
import { SenalesMercado } from '../hubspot/InteligenciaMercado';

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(16,24,40,0.04)', padding: '20px 24px' };

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: bg, color, whiteSpace: 'nowrap' }}>{label}</span>;
}

const CONTEXTO_DUMMY = [
  { industria: 'Alimentos y Bebidas', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Competencia Creciente' },
  { industria: 'Retail', tamano: 'Multi (Más de 1000)', prioridad: 'Expansión de Mercado', desafio: 'Competencia Creciente' },
  { industria: 'Software y Tecnología', tamano: 'Grande (201-500)', prioridad: 'Eficiencia Operativa', desafio: 'Transformación Digital' },
  { industria: 'Salud', tamano: 'Corp (501-1000)', prioridad: 'Innovación', desafio: 'Experiencia de Cliente' },
  { industria: 'Automotriz', tamano: 'Multi (Más de 1000)', prioridad: 'Eficiencia Operativa', desafio: 'Experiencia de Cliente' },
];

function BloqueContexto({ udnNombre }: { udnNombre: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>1</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Contexto</h3>
        </div>
        <Badge label="Dummy - pendiente Sheet ICPs" color="#b45309" bg="#fef3c7" />
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
        Tu ICP declarado y a quien le has vendido mas - este es tu punto de partida, {udnNombre}.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #eef0f3' }}>
            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Industria</th>
            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Tamano</th>
            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Prioridad</th>
            <th style={{ textAlign: 'left', padding: '8px', color: '#94a3b8', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Desafio</th>
          </tr>
        </thead>
        <tbody>
          {CONTEXTO_DUMMY.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < CONTEXTO_DUMMY.length - 1 ? '1px solid #eef0f3' : 'none' }}>
              <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a' }}>{row.industria}</td>
              <td style={{ padding: '10px 8px', color: '#475569' }}>{row.tamano}</td>
              <td style={{ padding: '10px 8px', color: '#475569' }}>{row.prioridad}</td>
              <td style={{ padding: '10px 8px', color: '#475569' }}>{row.desafio}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: '12px 0 0' }}>
        Mostrando top 5 por volumen de ventas historico - proximamente conectado en vivo
      </p>
    </div>
  );
}

function BloquePlaceholder({ numero, titulo, subtitulo, fuente }: { numero: number; titulo: string; subtitulo: string; fuente: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{numero}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>{titulo}</h3>
        </div>
        <Badge label={'Pendiente: reusar ' + fuente} color="#b45309" bg="#fef3c7" />
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{subtitulo}</p>
    </div>
  );
}

export default function Overview({ udnNombre, udnId, brandColor }: { udnNombre: string; udnId?: string; brandColor?: string }) {
  const [calendarioData, setCalendarioData] = useState<{ meses: string[]; filas: { industria: string; celdas: ('pico' | 'prep' | 'ok' | 'vacio')[] }[] } | null>(null);
  const [empresasPicoData, setEmpresasPicoData] = useState<any[]>([]);
  const idParaCalendario = udnId ?? udnNombre;

  useEffect(() => {
    let cancelled = false;
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (!cancelled) {
          setCalendarioData(json?.calendario?.[idParaCalendario] ?? null);
          setEmpresasPicoData(json?.empresas_pico?.[idParaCalendario] ?? []);
        }
      })
      .catch(() => { if (!cancelled) { setCalendarioData(null); setEmpresasPicoData([]); } });
    return () => { cancelled = true; };
  }, [idParaCalendario]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BloqueContexto udnNombre={udnNombre} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>2</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Senales en vivo</h3>
        </div>
        <SenalesMercado />
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>3</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Calendario de prospeccion</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
            Temporalidad por industria - mejor momento para contactar segun el ciclo economico.
          </p>
          {calendarioData ? (
            <CalendarioGrid
              meses={calendarioData.meses}
              filas={calendarioData.filas}
              brandColor={brandColor ?? '#8C59FE'}
              udnId={idParaCalendario}
              empresasPico={empresasPicoData}
            />
          ) : (
            <p style={{ fontSize: 12.5, color: '#94a3b8' }}>Cargando calendario...</p>
          )}
        </div>
        <BloquePlaceholder
          numero={4}
          titulo="Descubrir nuevas empresas"
          subtitulo="Universo DENUE - empresas que aun no forman parte de tu cartera."
          fuente="Mapa Universo DENUE (tab Mercado)"
        />
      </div>
    </div>
  );
}
