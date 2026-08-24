'use client';
import React from 'react';
import { useState } from 'react';
import type { PicoRow, RescueRow, EmpresaPico } from '../../lib/types';
import { IcpChips } from './IcpChips';


interface Props {
  picos:      PicoRow[];
  rescue:     RescueRow[];
  empresasPico?: EmpresaPico[];
  brandColor: string;
}

const MES_NUM: Record<string, number> = {
  'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,
  'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12,
};

const ESTADO_COLORS: Record<string, string> = {
  pico: '#22C55E', prep: '#F59E0B', ok: '#60A5FA', vacio: '#64748B',
};

const FASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  caliente: { label: 'Vende',    color: '#22C55E', bg: '#22C55E18' },
  templado: { label: 'Prepara',  color: '#F59E0B', bg: '#F59E0B18' },
  tibio:    { label: 'Explora',  color: '#60A5FA', bg: '#60A5FA18' },
  frio:     { label: 'Espera',   color: '#64748B', bg: '#64748B18' },
};

function estadoFromMesPico(mesPico: string): string {
  const parts = mesPico.toLowerCase().split(' ');
  if (parts.length < 2) return 'vacio';
  const m = MES_NUM[parts[0]] ?? 0;
  const y = parseInt(parts[1]) || 0;
  const now = new Date();
  const diff = (y - now.getFullYear()) * 12 + m - (now.getMonth() + 1);
  if (diff <= 0) return 'pico';
  if (diff === 1) return 'prep';
  if (diff <= 3) return 'ok';
  return 'vacio';
}

function formatValor(val: number): string {
  if (val >= 1_000_000) return '$' + (val / 1_000_000).toFixed(1) + 'M';
  if (val >= 1_000)     return '$' + (val / 1_000).toFixed(0) + 'K';
  return '$' + val;
}

const _year = new Date().getFullYear();
const SHORTCUTS = [
  { label: 'Este año',  from: String(_year) + '-01', to: String(_year) + '-12' },
  { label: '2025–2026', from: '2025-01', to: '2026-12' },
  { label: '2024–2026', from: '2024-01', to: '2026-12' },
];

function mesYearToDate(my: string): Date | null {
  if (!my) return null;
  const parts = my.trim().toLowerCase().split(' ');
  if (parts.length < 2) return null;
  const m = MES_NUM[parts[0].slice(0, 3).toLowerCase()] ?? 0;
  const y = parseInt(parts[1]) || 0;
  if (!m || !y) return null;
  return new Date(y, m - 1, 1);
}

function yyyymmToDate(ym: string): Date {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

function fechaToYYYYMM(fecha: string): string {
  if (!fecha) return '';
  // Formato YYYY-MM-DD → YYYY-MM
  if (/^\d{4}-\d{2}/.test(fecha)) return fecha.slice(0, 7);
  // Formato DD/MM/YYYY o D/M/YYYY → YYYY-MM
  if (fecha.includes('/')) {
    const parts = fecha.split('/');
    if (parts.length === 3) {
      const y = parts[2].padStart(4, '0');
      const m = parts[1].padStart(2, '0');
      return `${y}-${m}`;
    }
  }
  return '';
}

const thSub: React.CSSProperties = {
  padding: '5px 16px',
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--txt-5)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

export function PicosEmpresasTable({ picos, rescue, empresasPico, brandColor }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());
  const [filterICPNegocios, setFilterICPNegocios] = useState<'all' | 'objetivo' | 'icp'>('all');
  const [filterICPContactos, setFilterICPContactos] = useState<'all' | 'objetivo' | 'icp'>('all');
  const toggleSub = (key: string) => setExpandedSubs(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const [pickerOpen,   setPickerOpen]   = useState(false);
  const [desde,        setDesde]        = useState('2024-01');
  const [hasta,        setHasta]        = useState('2026-12');

  const desdeDate = yyyymmToDate(desde);
  const hastaDate = yyyymmToDate(hasta);
  hastaDate.setMonth(hastaDate.getMonth() + 1);

  const toggleRow = (industria: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(industria) ? next.delete(industria) : next.add(industria);
      return next;
    });
  };

  const sorted = [...(picos ?? [])].sort((a, b) => b.leadsEnBase - a.leadsEnBase);

  const rescueFiltrado = (rescue ?? []).filter(r => {
    if (!r.fechaCreacion) return true;
    const d = mesYearToDate(r.fechaCreacion);
    if (!d) return true;
    return d >= desdeDate && d < hastaDate;
  });

  return (
    <>
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--divider)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>
            Picos de temporalidad · Oportunidades perdidas a reactivar
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 600, marginTop: 4 }}>
            Negocios — ¿Con qué empresas ya intentamos vender en este sector?
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-5)', marginTop: 2 }}>
            Expande cada sector · fase al contactar indica el momento del ciclo cuando se originó el lead
          </div>
        </div>

        {/* Filtro de periodo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setPickerOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8,
              border: "1px solid " + (pickerOpen ? brandColor : 'var(--border)'),
              background: pickerOpen ? brandColor + "15" : 'var(--card)',
              color: 'var(--txt-3)', fontSize: 12, fontWeight: 400,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {desde} – {hasta}
          </button>

          {pickerOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 999,
              background: 'var(--bg, #1a1d2e)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              minWidth: 280,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Filtrar por fecha de creación
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Desde</div>
                  <input type="month" value={desde} onChange={e => setDesde(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 12,
                      border: '1px solid var(--border)', background: 'var(--card)',
                      color: 'var(--txt-2)', fontFamily: 'Inter, sans-serif' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt-5)', marginBottom: 4 }}>Hasta</div>
                  <input type="month" value={hasta} onChange={e => setHasta(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: 12,
                      border: '1px solid var(--border)', background: 'var(--card)',
                      color: 'var(--txt-2)', fontFamily: 'Inter, sans-serif' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {SHORTCUTS.map(s => {
                  const activo = desde === s.from && hasta === s.to;
                  return (
                    <button key={s.label}
                      onClick={() => { setDesde(s.from); setHasta(s.to); }}
                      style={{
                        flex: 1, padding: '4px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        border: activo ? "1px solid " + brandColor : '1px solid var(--border)',
                        background: activo ? brandColor + "20" : 'transparent',
                        color: activo ? brandColor : 'var(--txt-3)',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >{s.label}</button>
                  );
                })}
              </div>
              <button onClick={() => setPickerOpen(false)}
                style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: 8,
                  border: 'none', background: brandColor, color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['', 'Sector / Subrama', 'Mes del pico', 'Qué hacer ahora', 'Oportunidades en base'].map((h, i) => (
                <th key={i} style={{
                  padding: '7px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Filtro ICP */}
              <tr>
                <td colSpan={5} style={{ padding: '8px 16px 4px', borderBottom: '1px solid var(--divider)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['all','objetivo','icp'] as const).map(f => {
                      const labels = { all: 'Todas', objetivo: '⭐ Objetivo', icp: 'ICP ✓' };
                      const active = filterICPNegocios === f;
                      return (
                        <button key={f} onClick={() => setFilterICPNegocios(f)} style={{
                          padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', border: active ? "1px solid " + brandColor : '1px solid var(--divider)',
                          background: active ? brandColor + "25" : 'transparent',
                          color: active ? 'var(--txt-1)' : 'var(--txt-3)', transition: 'all 0.15s',
                        }}>
                          {labels[f]}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>

              {sorted.map((row, i) => {
              const dotColor = ESTADO_COLORS[estadoFromMesPico(row.mesPico)] ?? '#64748B';
              const expanded = expandedRows.has(row.industria);
              const isLast   = i === sorted.length - 1;

              // Empresas del sector desde empresas_pico — solo negocios
              const todasNegocios = (empresasPico ?? []).filter(r => {
                if (r.sector !== row.industria || r.tipoObjeto !== 'negocio') return false;
                // Filtro de fecha usando YYYY-MM-DD
                if (r.fechaCreacion) {
                  const ym = fechaToYYYYMM(r.fechaCreacion);
                  if (ym < desde || ym > hasta) return false;
                }
                if (filterICPNegocios === 'objetivo') return !!r.es_cuenta_objetivo;
                if (filterICPNegocios === 'icp') return !!r.icp_industria_match && !r.es_cuenta_objetivo;
                return true;
              });
              const totalNegociosBase = todasNegocios.length;
              const empresas = todasNegocios
                .sort((a, b) => {
                  const va = parseFloat(String(a.valor).replace(/[^0-9.-]/g,'')) || 0;
                  const vb = parseFloat(String(b.valor).replace(/[^0-9.-]/g,'')) || 0;
                  return vb - va;
                })
                .slice(0, 20);

              // Agrupar por subrama → { nombre: RescueRow[] }
              const grupoMap: Record<string, EmpresaPico[]> = {};
              for (const emp of empresas) {
                const key = (emp.subrama && emp.subrama.trim() && emp.subrama !== 'None') ? emp.subrama.trim() : emp.sector || 'Sin clasificar';
                if (!grupoMap[key]) grupoMap[key] = [];
                grupoMap[key].push(emp);
              }
              const grupos = Object.entries(grupoMap);
              const totalEmpresas = empresas.length;

              return (
                <>
                  {/* ── Fila sector ── */}
                  <tr
                    key={`sector-\${row.industria}`}
                    onClick={() => toggleRow(row.industria)}
                    className="table-row"
                    style={{
                      borderBottom: !expanded && !isLast ? '1px solid var(--divider)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '10px 8px 10px 16px', width: 24 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        style={{ color: 'var(--txt-5)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </td>
                    <td style={{ padding: '10px 16px 10px 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dotColor, boxShadow: "0 0 5px " + dotColor + "80", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>{row.industria}</span>
                        {totalEmpresas > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                            background: brandColor + "25", color: 'var(--txt-1)', border: "1px solid " + brandColor + "50" }}>
                            {totalEmpresas} {totalEmpresas === 1 ? 'empresa' : 'empresas'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' }}>{row.mesPico}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--txt-4)', maxWidth: 260 }}>{row.accion}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' }}>{row.leadsEnBase.toLocaleString()}</span>
                    </td>
                  </tr>

                  {/* ── Grupos por subrama ── */}
                  {expanded && grupos.length > 0 && grupos.map(([subramaName, emps], gi) => {
                    const isLastGrupo = gi === grupos.length - 1;
                    const subKey = "n_" + row.industria + "_" + gi;
                    const subExp = expandedSubs.has(subKey);
                    return (
                      <>
                        {/* Header de subrama */}
                        <tr key={`sub-header-\${row.industria}-\${gi}`}
                          onClick={() => toggleSub(subKey)}
                          style={{ background: brandColor + "0A", borderBottom: '1px solid var(--divider)', cursor: 'pointer' }}>
                          <td style={{ padding: '7px 8px 7px 16px', width: 24 }} />
                          <td colSpan={3} style={{ padding: '7px 16px 7px 4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 10, color: 'var(--txt-5)', marginRight: 4 }}>{subExp ? '▾' : '▸'}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-2)' }}>
                                {subramaName}
                              </span>
                              <span style={{ fontSize: 10, color: 'var(--txt-5)', fontWeight: 500 }}>
                                {emps.length} {emps.length === 1 ? 'empresa' : 'empresas'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '7px 16px' }} />
                        </tr>

                        {subExp && <>
                        <tr key={`sub-cols-\${row.industria}-\${gi}`}
                          style={{ background: brandColor + "06", borderBottom: '1px solid var(--divider)' }}>
                          <td />
                          <td style={{ ...thSub, paddingLeft: 32 }}>Empresa</td>
                          <td style={thSub}>Generado por</td>
                          <td style={thSub}>Fecha creación</td>
                          <td style={thSub}>Fase al contactar</td>
                          <td style={thSub}>Motivo pérdida</td>
                          <td style={thSub}>Fecha perdido</td>
                          <td style={thSub}>Valor</td>
                          <td style={thSub}>Link</td>
                        </tr>

                        {/* Empresas de esta subrama */}
                        {emps.slice(0, 10).map((emp, ei) => {
                          const isLastEmp = ei === emps.slice(0, 10).length - 1;
                          const fase = FASE_CONFIG[''];
                          return (
                            <tr
                              key={`emp-\${row.industria}-\${gi}-\${ei}`}
                              style={{
                                borderBottom: (!isLastEmp || !isLastGrupo || !isLast)
                                  ? '1px solid var(--divider)' : 'none',
                                background: 'var(--bg, #1a1d2e)',
                              }}
                            >
                              <td style={{ padding: '8px 8px 8px 16px', width: 24 }} />
                              <td style={{ padding: '8px 16px 8px 32px' }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-2)', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                  {emp.empresa}
                                  <IcpChips
                                    esCuentaObjetivo={emp.es_cuenta_objetivo}
                                    tier={emp.tier}
                                    icpIndustriaMatch={emp.icp_industria_match}
                                    decisor={emp.decisor}
                                  />
                                </span>
                              </td>
                              <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>
                                {emp.generadoPor || '—'}
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                <span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>
                                  {emp.fechaCreacion || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                {fase ? (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                                    background: fase.bg, color: fase.color,
                                    border: "1px solid " + fase.color + "40",
                                  }}>
                                    {fase.label}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--txt-6)' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>
                                {emp.motivoPerdida}
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                <span className="font-mono" style={{ fontSize: 11, color: 'var(--txt-5)' }}>
                                  {emp.fechaPerdido || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                <span className="font-mono" style={{ fontSize: 12, fontWeight: 800, color: 'var(--txt-1)' }}>
                                  {typeof emp.valor === 'number' ? formatValor(emp.valor) : emp.valor}
                                </span>
                              </td>
                              <td style={{ padding: '8px 16px' }}>
                                {emp.tipoObjeto === 'negocio' && emp.idRegistro ? (
                                  <a
                                    href={'https://app.hubspot.com/contacts/24172997/record/0-3/' + emp.idRegistro}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: 11, fontWeight: 600, color: brandColor, textDecoration: 'none' }}
                                  >
                                    Ver en HubSpot
                                  </a>
                                ) : (
                                  <span style={{ fontSize: 11, color: 'var(--txt-6)' }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}</>}
                      </>
                    );
                  })}

                  {/* Sin empresas */}
                  {expanded && grupos.length === 0 && (
                    <tr key={`empty-\${row.industria}`}
                      style={{ borderBottom: !isLast ? '1px solid var(--divider)' : 'none' }}>
                      <td />
                      <td colSpan={7} style={{ padding: '10px 24px', fontSize: 12, color: 'var(--txt-5)', fontStyle: 'italic' }}>
                        Sin empresas en este periodo
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* ── Tabla Contactos ── */}
    <div className="card" style={{ overflow: 'hidden', marginTop: 16 }}>
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--divider)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt-1)' }}>
          Picos de temporalidad · Base de contactos identificados
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt-3)', fontWeight: 600, marginTop: 4 }}>
          Contactos — ¿Qué personas de este sector ya están en tu CRM?
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-5)', marginTop: 2 }}>
          Expande cada sector · personas identificadas en base de datos
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--divider)' }}>
              {['', 'Sector / Subrama', 'Mes del pico', 'Qué hacer ahora', 'Leads en base'].map((h, i) => (
                <th key={i} style={{
                  padding: '7px 16px', textAlign: 'left',
                  fontSize: 10, fontWeight: 600, color: 'var(--txt-5)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{h}</th>
              ))}
            </tr>
            <tr>
              <td colSpan={5} style={{ padding: '8px 16px 4px', borderBottom: '1px solid var(--divider)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all','objetivo','icp'] as const).map(f => {
                    const labels = { all: 'Todas', objetivo: '⭐ Objetivo', icp: 'ICP ✓' };
                    const active = filterICPContactos === f;
                    return (
                      <button key={f} onClick={() => setFilterICPContactos(f)} style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', border: active ? `1px solid ${brandColor}` : '1px solid var(--divider)',
                        background: active ? brandColor + '18' : 'transparent',
                        color: active ? brandColor : 'var(--txt-4)', transition: 'all 0.15s',
                      }}>
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const dotColor = ESTADO_COLORS[estadoFromMesPico(row.mesPico)] ?? '#64748B';
              const expanded = expandedRows.has("c_" + row.industria);
              const isLast   = i === sorted.length - 1;
              
              const todosContactos = (empresasPico ?? []).filter(r => {
                if (r.sector !== row.industria || r.tipoObjeto !== 'contacto') return false;
                // Filtro de fecha usando YYYY-MM-DD
                if (r.fechaCreacion) {
                  const ym = fechaToYYYYMM(r.fechaCreacion);
                  if (ym < desde || ym > hasta) return false;
                }
                if (filterICPContactos === 'objetivo') return !!r.es_cuenta_objetivo;
                if (filterICPContactos === 'icp') return !!r.icp_industria_match && !r.es_cuenta_objetivo;
                return true;
              });

              const totalContactosBase = todosContactos.length;
              const contactos = todosContactos
                .sort((a, b) => {
                  const va = parseFloat(String(a.valor).replace(/[^0-9.-]/g,'')) || 0;
                  const vb = parseFloat(String(b.valor).replace(/[^0-9.-]/g,'')) || 0;
                  return vb - va;
                })
                .slice(0, 20);
              const grupoMapC: Record<string, EmpresaPico[]> = {};
              for (const emp of contactos) {
                const key = (emp.subrama && emp.subrama.trim() && emp.subrama !== 'None') ? emp.subrama.trim() : emp.sector || 'Sin clasificar';
                if (!grupoMapC[key]) grupoMapC[key] = [];
                grupoMapC[key].push(emp);
              }
              const gruposC = Object.entries(grupoMapC);
              const totalContactos = contactos.length;
              return (
                <React.Fragment key={`c_\${row.industria}`}>
                  <tr onClick={() => setExpandedRows(prev => { const next = new Set(prev); next.has("c_" + row.industria) ? next.delete("c_" + row.industria) : next.add("c_" + row.industria); return next; })}
                    style={{ cursor: 'pointer', borderBottom: expanded || isLast ? 'none' : '1px solid var(--divider)', background: 'var(--card)' }}>
                    <td style={{ padding: '10px 8px 10px 16px', width: 24 }}>
                      <span style={{ color: 'var(--txt-5)', fontSize: 10 }}>{expanded ? '▾' : '▸'}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt-1)' }}>{row.industria}</span>
                        {totalContactos > 0 && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: brandColor + "18", color: brandColor, fontWeight: 700 }}>
                            {totalContactos} {totalContactos === 1 ? 'contacto' : 'contactos'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: dotColor }}>{row.mesPico}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--txt-3)' }}>{row.accion}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' }}>{totalContactosBase.toLocaleString()}</td>
                  </tr>
                  {expanded && gruposC.map(([subramaName, emps], gi) => {
                    const subKeyC = "c_" + row.industria + "_" + gi;
                    const subExpC = expandedSubs.has(subKeyC);
                    return <React.Fragment key={gi}>
                      <tr style={{ background: brandColor + "08", cursor: 'pointer' }} onClick={() => toggleSub(subKeyC)}>
                        <td colSpan={2} style={{ padding: '6px 16px 6px 32px' }}>
                          <span style={{ fontSize: 10, color: 'var(--txt-5)', marginRight: 6 }}>{subExpC ? '▾' : '▸'}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-2)' }}>{subramaName}</span>
                          <span style={{ fontSize: 10, color: 'var(--txt-4)', marginLeft: 8 }}>{emps.length} {emps.length === 1 ? 'contacto' : 'contactos'}</span>
                        </td>
                        <td colSpan={3} />
                      </tr>
                      {subExpC && <tr style={{ background: 'var(--bg, #1a1d2e)' }}>
                        <td style={{ width: 24 }} />
                        <td colSpan={4}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                {['Contacto', 'Generado por', 'Fecha creación', 'Etapa', 'Motivo pérdida'].map((h, i) => (
                                  <th key={i} style={{ padding: '5px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--txt-5)', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {emps.map((emp, ei) => (
                                <tr key={ei} style={{ borderTop: '1px solid var(--divider)' }}>
                                  <td style={{ padding: '8px 16px 8px 32px' }}>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt-2)', display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                      {emp.empresa}
                                      <IcpChips
                                        esCuentaObjetivo={emp.es_cuenta_objetivo}
                                        tier={emp.tier}
                                        icpIndustriaMatch={emp.icp_industria_match}
                                        decisor={emp.decisor}
                                      />
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{emp.generadoPor && emp.generadoPor !== 'nan' ? emp.generadoPor : '—'}</td>
                                  <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-5)', fontFamily: 'monospace' }}>{emp.fechaCreacion || '—'}</td>
                                  <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-3)' }}>{emp.etapa && emp.etapa !== 'nan' ? emp.etapa : '—'}</td>
                                  <td style={{ padding: '8px 16px', fontSize: 11, color: 'var(--txt-4)' }}>{emp.motivoPerdida && emp.motivoPerdida !== 'nan' ? emp.motivoPerdida : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>}
                    </React.Fragment>
                  })}
                  {expanded && gruposC.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '12px 32px', fontSize: 12, color: 'var(--txt-5)', fontStyle: 'italic' }}>Sin contactos en este periodo</td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </>
  );
}