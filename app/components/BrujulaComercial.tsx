'use client';
import { useState, useEffect } from 'react';
import { UDNBar } from './UDNBar';
import { GraficaCruceSenales } from './GraficaCruceSenales';
import { TablaKeywords } from './TablaKeywords';
import { FiltroPeriodoGlobal } from './FiltroPeriodoGlobal';
import { KpiScoreCards } from './KpiScoreCards';
import { SegmentosServicio } from './SegmentosServicio';
import { UDNS } from '../lib/data';
import { useAuth } from '../hooks/useAuth';
import type { UDN } from '../lib/types';
import InteligenciaComercial from './brujula-comercial/InteligenciaComercial';
import InteligenciaMercado from './hubspot/InteligenciaMercado';

type SubTab = 'comercial' | 'demanda' | 'mercado';
const ACCENT = '#8C59FE';

type Permisos = Record<string, 'all' | string[]>;
function tienePermiso(permisos: Permisos | null | undefined, modulo: string, tabId: string): boolean {
  if (!permisos || Object.keys(permisos).length === 0) return true;
  const val = permisos[modulo];
  if (val === 'all') return true;
  if (Array.isArray(val)) return val.includes(tabId);
  return false;
}

export default function BrujulaComercial({ permisos }: { permisos?: Permisos | null }) {
  const { perfil } = useAuth();
  const [sub, setSub] = useState<SubTab>('comercial');
  const [udnActiva, setUdnActiva] = useState<UDN>(UDNS[0]);

  const MIN_MES = '2025-01';
  const MAX_MES = '2026-08';
  const [periodo, setPeriodo] = useState({ desde: `${MAX_MES.split('-')[0]}-01`, hasta: MAX_MES });

  const esMkt = perfil?.udn_madre === 'MKT';
  const udnsPropias = UDNS.filter(u => (perfil?.udn || '').split(',').map((s: string) => s.trim()).includes(u.id));
  const udnsVisiblesComercial = perfil?.rol === 'admin' || esMkt
    ? UDNS
    : udnsPropias;
  const udnsVisiblesDemanda = perfil?.rol === 'admin' || esMkt
    ? UDNS
    : udnsPropias;
  const udnsVisibles = sub === 'comercial' ? udnsVisiblesComercial : udnsVisiblesDemanda;

  useEffect(() => {
    if (!udnsVisibles.find(u => u.id === udnActiva.id) && udnsVisibles.length > 0) {
      setUdnActiva(udnsVisibles[0]);
    }
  }, [sub, perfil?.udn, perfil?.udn_madre, perfil?.rol]);

  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{
        background: 'var(--header-bg)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        height: 56, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/images/icon-192.png" alt="Brújula Comercial" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--txt-1)' }}>
            Brújula <span style={{ color: ACCENT }}>Comercial</span>
          </span>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1 }}>
            {(['comercial', 'demanda', 'mercado'] as SubTab[]).map(t => {
              const permitido = tienePermiso(permisos, 'brujula', t);
              return (
              <button
                key={t}
                onClick={() => { if (permitido) setSub(t); }}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none',
                  cursor: permitido ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: sub === t ? 700 : 500,
                  background: sub === t ? ACCENT : 'transparent',
                  color: !permitido ? 'var(--txt-5)' : (sub === t ? '#fff' : 'var(--txt-2)'),
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: permitido ? 1 : 0.6,
                }}
              >
                {t === 'comercial' ? 'Inteligencia Comercial' : t === 'demanda' ? 'Inteligencia de Demanda' : 'Inteligencia de Mercado'}
                {!permitido && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                    background: '#f1f5f9', color: '#94a3b8', whiteSpace: 'nowrap',
                  }}>
                    Sin acceso
                  </span>
                )}
              </button>
              );
            })}
          </div>
        </div>
      </div>
      <UDNBar
        udns={udnsVisibles}
        udnActiva={udnActiva}
        onSelect={(u) => setUdnActiva(u)}
        isDark={false}
      />
      {sub === 'demanda' && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FiltroPeriodoGlobal
                desde={periodo.desde}
                hasta={periodo.hasta}
                minMes={MIN_MES}
                maxMes={MAX_MES}
                onChange={(d, h) => setPeriodo({ desde: d, hasta: h })}
              />
            </div>
            <KpiScoreCards udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            <div>
              {tienePermiso(permisos, 'brujula', 'demanda') && (
                <GraficaCruceSenales brandColor={udnActiva.color} isDark={false} udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
              )}
            </div>
            <SegmentosServicio udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            <div>
              <TablaKeywords udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            </div>
          </div>
        </div>
      )}
      {sub === 'comercial' && tienePermiso(permisos, 'brujula', 'comercial') && (
        <InteligenciaComercial udnId={udnActiva.id} brandColor={udnActiva.color} />
      )}
      {sub === 'mercado' && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <InteligenciaMercado />
          </div>
        </div>
      )}
    </div>
  );
}
