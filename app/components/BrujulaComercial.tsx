'use client';
import { useState, useEffect } from 'react';
import { UDNBar } from './UDNBar';
import { GraficaCruceSenales } from './GraficaCruceSenales';
import { ScoreCardsConvergencia } from './ScoreCardsConvergencia';
import { TablaKeywords } from './TablaKeywords';
import { FiltroPeriodoGlobal } from './FiltroPeriodoGlobal';
import { KpiScoreCards } from './KpiScoreCards';
import { SegmentosServicio } from './SegmentosServicio';
import { UDNS } from '../lib/data';
import { useAuth } from '../hooks/useAuth';
import type { UDN } from '../lib/types';

type SubTab = 'comercial' | 'demanda';
const ACCENT = '#8C59FE';

export default function BrujulaComercial() {
  const { perfil } = useAuth();
  const [sub, setSub] = useState<SubTab>('comercial');
  const [udnActiva, setUdnActiva] = useState<UDN>(UDNS[0]);

  const MIN_MES = '2025-01';
  const MAX_MES = '2026-08';
  const [periodo, setPeriodo] = useState({ desde: `${MAX_MES.split('-')[0]}-01`, hasta: MAX_MES });

  const udnsVisibles = perfil?.rol === 'admin'
    ? UDNS
    : UDNS.filter(u => (perfil?.udn || '').split(',').map((s: string) => s.trim()).includes(u.id));

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
            {(['comercial', 'demanda'] as SubTab[]).map(t => (
              <button
                key={t}
                onClick={() => setSub(t)}
                style={{
                  padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: sub === t ? 700 : 500,
                  background: sub === t ? ACCENT : 'transparent',
                  color: sub === t ? '#fff' : 'var(--txt-2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t === 'comercial' ? 'Inteligencia Comercial' : 'Inteligencia de Demanda'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <UDNBar
        udns={udnsVisibles}
        udnActiva={udnActiva}
        onSelect={(u) => setUdnActiva(u)}
        isDark={false}
      />
      {sub === 'comercial' && (
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
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                Cruce de señales · {udnActiva.nombre}
              </p>
              <GraficaCruceSenales brandColor={udnActiva.color} isDark={false} udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            </div>
            <SegmentosServicio udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            <div>
              <TablaKeywords udn={udnActiva.nombre} desde={periodo.desde} hasta={periodo.hasta} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                Empresas en convergencia
              </p>
              <ScoreCardsConvergencia />
            </div>
          </div>
        </div>
      )}
      {sub === 'demanda' && (
        <div style={{ maxWidth: 1400, margin: '0 auto', color: 'var(--txt-3)' }}>Inteligencia de Demanda — próximo paso.</div>
      )}
    </div>
  );
}
