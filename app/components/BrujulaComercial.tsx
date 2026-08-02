'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UDNBar } from './UDNBar';
import { GraficaCruceSenales } from './GraficaCruceSenales';
import { ScoreCardsConvergencia } from './ScoreCardsConvergencia';
import { TablaKeywords } from './TablaKeywords';
import { FiltrosPeriodo } from './FiltrosPeriodo';
import { KpiScoreCards } from './KpiScoreCards';
import { SegmentosServicio } from './SegmentosServicio';
import { UDNS } from '../lib/data';
import { useAuth } from '../hooks/useAuth';
import type { UDN } from '../lib/types';

const supaGads = createClient(
  'https://wuwhcljeigskajjoyghv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d2hjbGplaWdza2Fqam95Z2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Njk4MTksImV4cCI6MjA5MDE0NTgxOX0.dDw2ogt3LXEnpKln6zPRUp7Thj5Bs47CPIsZlaE9F_A'
);

type SubTab = 'comercial' | 'demanda';
const ACCENT = '#8C59FE';

export default function BrujulaComercial() {
  const { perfil } = useAuth();
  const [sub, setSub] = useState<SubTab>('comercial');
  const [udnActiva, setUdnActiva] = useState<UDN>(UDNS[0]);
  const [anio, setAnio] = useState(2025);
  const [mes, setMes] = useState<string | null>(null);
  const [mesResuelto, setMesResuelto] = useState('2025-04');

  const udnsVisibles = perfil?.rol === 'admin'
    ? UDNS
    : UDNS.filter(u => (perfil?.udn || '').split(',').map((s: string) => s.trim()).includes(u.id));

  useEffect(() => {
    if (mes) { setMesResuelto(mes); return; }
    supaGads.rpc('get_mes_reciente', { p_udn: udnActiva.nombre })
      .then(({ data }) => { if (data?.[0]?.mes) setMesResuelto(data[0].mes); });
  }, [udnActiva.nombre, mes]);

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
        onSelect={(u) => { setUdnActiva(u); setMes(null); }}
        isDark={false}
      />
      {sub === 'comercial' && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <FiltrosPeriodo anio={anio} mes={mes} onAnio={setAnio} onMes={setMes} />
            <KpiScoreCards udn={udnActiva.nombre} mes={mesResuelto} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                Cruce de señales · {udnActiva.nombre}
              </p>
              <GraficaCruceSenales brandColor={udnActiva.color} isDark={false} udn={udnActiva.nombre} anio={anio} />
            </div>
            <SegmentosServicio udn={udnActiva.nombre} mes={mesResuelto} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                Inteligencia de búsqueda
              </p>
              <TablaKeywords udn={udnActiva.nombre} mes={mesResuelto} />
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
