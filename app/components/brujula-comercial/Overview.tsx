'use client';
import React, { useEffect, useState } from 'react';
import { CalendarioGrid } from './CalendarioGrid';
import { SenalesMercado, ScoreCard } from '../hubspot/InteligenciaMercado';
import ProspeccionDenue from '../hubspot/ProspeccionDenue';

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

type ScorecardsICPBP = {
  topIndustrias?: string[]; tamanoEmpresa?: string; geografia?: string;
  decisores?: string[]; areasDecisor?: string[]; servicios?: string[];
};
function BloqueScorecards({ udnNombre, data }: { udnNombre: string; data: ScorecardsICPBP | null }) {
  const d = data ?? {};
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>1</span>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Contexto</h3>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
        Tu ICP declarado y tus buyer personas - este es tu punto de partida, {udnNombre}.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <ScoreCard label="Top 5 industrias (ICP)" value={(d.topIndustrias?.length ?? 0)} sub={(d.topIndustrias ?? []).join(' · ') || 'Sin datos'} accent="#8C59FE" icon="" />
        <ScoreCard label="Tamano de empresa" value={d.tamanoEmpresa || '—'} sub="Piso minimo de interes" accent="#059669" icon="" />
        <ScoreCard label="Geografia" value={d.geografia || '—'} sub="Donde nos interesan" accent="#d97706" icon="" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <ScoreCard label="Tomadores de decision" value={(d.decisores?.length ?? 0)} sub={(d.decisores ?? []).slice(0,4).join(' · ') || 'Sin datos'} accent="#8C59FE" icon="" />
        <ScoreCard label="Area del tomador" value={(d.areasDecisor ?? []).join(' · ') || '—'} sub="Areas mas frecuentes" accent="#059669" icon="" />
        <ScoreCard label="Servicios (Need)" value={(d.servicios?.length ?? 0)} sub={(d.servicios ?? []).slice(0,4).join(' · ') || 'Sin datos'} accent="#d97706" icon="" />
      </div>
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
  const [scorecardsData, setScorecardsData] = useState<ScorecardsICPBP | null>(null);
  const idParaCalendario = udnId ?? udnNombre;

  useEffect(() => {
    let cancelled = false;
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (!cancelled) {
          setCalendarioData(json?.calendario?.[idParaCalendario] ?? null);
          setEmpresasPicoData(json?.empresas_pico?.[idParaCalendario] ?? []);
          setScorecardsData(json?.scorecards_icp_bp?.[idParaCalendario] ?? null);
        }
      })
      .catch(() => { if (!cancelled) { setCalendarioData(null); setEmpresasPicoData([]); } });
    return () => { cancelled = true; };
  }, [idParaCalendario]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BloqueScorecards udnNombre={udnNombre} data={scorecardsData} />
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
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#8C59FE', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>4</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>Descubrir nuevas empresas</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
            Universo DENUE - empresas que aun no forman parte de tu cartera.
          </p>
          <ProspeccionDenue onTotalChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
