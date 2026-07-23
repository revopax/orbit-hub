'use client';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KPICard } from '../components/KPICard';
import { IndustriasList } from '../components/IndustriasList';
import { TemperaturaDonut } from '../components/TemperaturaDonut';
import { RadarMotivos } from '../components/RadarMotivos';
import { InsightsUDN } from '../components/InsightsUDN';
import { TemporalidadChart } from '../components/TemporalidadChart';
import { CalendarioGrid } from '../components/CalendarioGrid';
import BloqueDENUE from '../components/BloqueDENUE';
import { PicosEmpresasTable } from '../components/PicosEmpresasTable';
import { Watermark } from '../components/Watermark';
import { useAuth } from '../hooks/useAuth';

import VistaAnalista from './VistaAnalista'
import {
  mockKPIs, mockIndustrias, mockTemperatura,
  mockTemporalidad, mockCalendario, mockPicos, mockRescue,
} from '../lib/data';
import type { UDN, KPI, Industria, TemperaturaData, DataTemporalidad, PicoRow, RescueRow } from '../lib/types';

interface DashboardProps {
  udnActiva: UDN;
  vista: 'director' | 'operativa';
  isDark: boolean;
}

interface MesHistorico {
  leads: number;
  timing_activo: number;
  timing_total: number;
  pct_timing: number;
  anio: number;
  mes: number;
}
interface EmpresaPico {
  empresa: string;
  sector: string;
  scian3: string;
  subrama?: string;
  tipoObjeto?: string;
  etapa?: string;
  generadoPor: string;
  fechaCreacion: string;
  motivoPerdida: string;
  valor: string;
  fechaPerdido: string;
}

interface BrujulaData {
  kpis:            Record<string, KPI[]>;
  kpis_historico:  Record<string, Record<string, MesHistorico>>;
  temperatura:     Record<string, TemperaturaData>;
  industrias:   Record<string, Industria[]>;
  temporalidad: Record<string, DataTemporalidad | null>;
  calendario:   Record<string, { meses: string[]; filas: { industria: string; celdas: ('pico'|'prep'|'ok'|'vacio')[] }[] } | null>;
  picos:        Record<string, PicoRow[]>;
  rescue:       Record<string, RescueRow[]>;
  insights?:    Record<string, any[]>;
  empresas_pico: Record<string, EmpresaPico[]>;
}

// Cache global en memoria para no refetch en cada cambio de UDN
let _dataCache: BrujulaData | null = null;
let _cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

const WRAP: React.CSSProperties = {
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  maxWidth: 1440,
  margin: '0 auto',
  width: '100%',
  boxSizing: 'border-box',
};

export function Dashboard({ udnActiva, vista, isDark }: DashboardProps) {
  const id    = udnActiva.id;
  const brand = (() => { const hex = udnActiva.color.replace("#",""); const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16); const lum = (r*299+g*587+b*114)/1000; return lum < 30 && udnActiva.secundario ? udnActiva.secundario : udnActiva.color; })();

  const [liveData, setLiveData] = useState<BrujulaData | null>(_dataCache);
  const [loading,  setLoading]  = useState(!_dataCache);
  const [periodoInicio, setPeriodoInicio] = useState('2026-01');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [periodoFin,    setPeriodoFin]    = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const now = Date.now();
    if (_dataCache && now - _cacheTime < CACHE_TTL) {
      setLiveData(_dataCache);
      setLoading(false);
      return;
    }
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: BrujulaData) => {
        _dataCache = d;
        _cacheTime = Date.now();
        setLiveData(d);
        setLoading(false);
      })
      .catch(err => {
        console.warn('[Brújula] Usando mock data —', err);
        setLoading(false);
      });
  }, []);

  // Usar datos reales si existen, sino mocks
  // Calcular leads y timing filtrados por periodo
  const histUDN = liveData?.kpis_historico?.[id] ?? {};
  const mesesFiltrados = Object.entries(histUDN).filter(([key]) => key >= periodoInicio && key <= periodoFin);
  const leadsTotal  = mesesFiltrados.reduce((s, [, m]) => s + m.leads, 0);
  const timingActivo = mesesFiltrados.reduce((s, [, m]) => s + m.timing_activo, 0);
  const timingTotalMeses = mesesFiltrados.reduce((s, [, m]) => s + m.timing_total, 0);
  const pctTiming = timingTotalMeses > 0 ? Math.round(timingActivo / timingTotalMeses * 1000) / 10 : 0;

  // Obtener meses disponibles para el selector
  const mesesDisponibles = Object.keys(histUDN).sort();
  const mesMin = mesesDisponibles[0] ?? '2025-04';
  const mesMax = mesesDisponibles[mesesDisponibles.length - 1] ?? periodoFin;

  // KPIs base + override de leads y timing según filtro
  const kpisBase = liveData?.kpis?.[id] ?? mockKPIs[id] ?? [];
  const kpis = kpisBase.map(k => {
    if (k.label === 'Leads acumulados') return { ...k, valor: leadsTotal.toLocaleString('es-MX') };
    if (k.label === 'Timing Comercial') return {
      ...k,
      valor: `${pctTiming}%`,
      badge: `${timingActivo} de ${timingTotalMeses} contactos`,
      timingData: { ...k.timingData, pct_total: pctTiming, total: timingTotalMeses, caliente: timingActivo }
    };
    return k;
  });
  const industrias  = liveData?.industrias?.[id]  ?? mockIndustrias[id]  ?? [];
  const temperatura = liveData?.temperatura?.[id] ?? mockTemperatura[id] ?? { caliente: 0, templado: 0, tibio: 0, frio: 0 };
  const temporalidad = liveData?.temporalidad?.[id] ?? mockTemporalidad[id] ?? null;
  const calendario  = liveData?.calendario?.[id]  ?? mockCalendario[id]  ?? null;
  const picos       = liveData?.picos?.[id]        ?? mockPicos[id]       ?? [];
  const rescue      = liveData?.rescue?.[id]       ?? mockRescue[id]      ?? [];
  const insights    = liveData?.insights?.[id]     ?? [];
  const empresas_pico = liveData?.empresas_pico?.[id] ?? [];

  const { perfil } = useAuth();

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      backgroundColor: 'transparent',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>
      {perfil && <Watermark nombre={perfil.nombre} />}
      {/* Indicador de carga sutil */}
      {loading && (
        <div style={{
          position: 'fixed', top: 68, left: 0, right: 0,
          height: 2, zIndex: 100,
          background: `linear-gradient(90deg, transparent, ${brand}, transparent)`,
          animation: 'fade-up 0.3s ease',
        }} />
      )}

      <AnimatePresence mode="wait">
        {vista === 'director' ? (
          <motion.div
            key={`dir-${id}`}
            style={WRAP}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Filtro de periodo global */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }} ref={pickerRef}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--txt-5)' }}>
                {leadsTotal.toLocaleString('es-MX')} leads
              </span>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setPickerOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 8,
                    border: `1px solid ${pickerOpen ? brand : 'var(--border)'}`,
                    background: pickerOpen ? `${brand}15` : 'var(--card)',
                    color: 'var(--txt-3)', fontSize: 12, fontWeight: 400,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{opacity:0.5}}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> {periodoInicio} – {periodoFin}
                </button>
                {pickerOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 999,
                    background: 'var(--bg, #1a1d2e)', border: '1px solid var(--border)',
                    borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    minWidth: 280,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Filtrar periodo
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Desde</div>
                        <input type="month" value={periodoInicio}
                          onChange={e => setPeriodoInicio(e.target.value)}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'var(--card)',
                            color: 'var(--txt-1)', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Hasta</div>
                        <input type="month" value={periodoFin}
                          onChange={e => setPeriodoFin(e.target.value)}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'var(--card)',
                            color: 'var(--txt-1)', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {[
                        { label: 'Este año', from: `${new Date().getFullYear()}-01`, to: `${new Date().getFullYear()}-12` },
                        { label: '2025–2026', from: '2025-01', to: '2026-12' },
                        { label: '2024–2026', from: '2024-01', to: '2026-12' },
                      ].map(p => (
                        <button key={p.label}
                          onClick={() => { setPeriodoInicio(p.from); setPeriodoFin(p.to); }}
                          style={{ flex: 1, padding: '4px 0', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'transparent',
                            color: 'var(--txt-3)', fontSize: 10, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setPeriodoInicio('2026-01'); setPeriodoFin(`${new Date().getFullYear()}-12`); }}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 6,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--txt-4)', fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Limpiar
                      </button>
                      <button onClick={() => setPickerOpen(false)}
                        style={{ flex: 2, padding: '6px 0', borderRadius: 6,
                          border: 'none', background: brand,
                          color: '#fff', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="kpi-grid">
              {kpis.map((kpi, i) => (
                <KPICard key={kpi.label} kpi={kpi} brandColor={brand} index={i} />
              ))}
            </div>
            {temporalidad && (
              <div style={{ marginTop: 20 }}>
              <TemporalidadChart
                data={temporalidad}
                brandColor={brand}
                udnNombre={udnActiva.nombre}
                isDark={isDark}
                topIndustria={temporalidad?.sectores?.[0] ? { nombre: temporalidad.sectores[0].nombre, temperatura: industrias[0]?.temperatura ?? 'caliente', accion: industrias[0]?.accion ?? 'Actúa ahora' } : (industrias[0] ?? null)}
              />
              </div>
            )}
            <div className="two-col-grid" style={{ marginTop: 20 }}>
              <IndustriasList industrias={industrias} brandColor={brand} udnNombre={udnActiva.nombre} />
              <RadarMotivos rescueData={rescue} brandColor={brand} textColor={udnActiva.texto ?? "#fff"} isDark={isDark} />
            </div>
            <InsightsUDN insights={insights} brandColor={brand} isDark={isDark} />
          </motion.div>
        ) : vista === 'analista' ? (
          <motion.div
            key={`an-${id}`}
            style={WRAP}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <VistaAnalista data={liveData} brand={brand} isDark={isDark} perfil={perfil} />
          </motion.div>
        ) : (
          <motion.div
            key={`op-${id}`}
            style={WRAP}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ marginBottom: 32 }}>
              <BloqueDENUE />
            </div>
            {calendario && (
              <div style={{ marginBottom: 24 }}>
                <CalendarioGrid meses={calendario.meses} filas={calendario.filas} brandColor={brand} udnId={udnActiva.id} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <PicosEmpresasTable picos={picos} rescue={rescue} empresasPico={empresas_pico} brandColor={brand} />
            </div>
            
            <div style={{ height: 80 }} />

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
