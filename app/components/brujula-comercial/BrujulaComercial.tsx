'use client';
import { useState } from 'react';
import { UDNBar } from './UDNBar';
import { GraficaCruceSenales } from './GraficaCruceSenales';
import { ScoreCardsConvergencia } from './ScoreCardsConvergencia';
import { UDNS } from '../../lib/data';
import { useAuth } from '../../hooks/useAuth';
import type { UDN } from '../../lib/types';

type SubTab = 'comercial' | 'demanda';

const ACCENT = '#8C59FE';

export default function BrujulaComercial() {
  const { perfil } = useAuth();
  const [sub, setSub] = useState<SubTab>('comercial');
  const [udnActiva, setUdnActiva] = useState<UDN>(UDNS[0]);

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
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src="/images/icon-192.png" alt="Brújula Comercial" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', flexShrink: 0 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt-1)' }}>Brújula</span>
            <span style={{ fontWeight: 900, fontSize: 14, color: '#E8008D', marginLeft: 4 }}>Comercial</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flex: 1 }}>
            {([
              { id: 'comercial' as const, label: 'Inteligencia Comercial' },
              { id: 'demanda' as const, label: 'Inteligencia de Demanda' },
            ]).map(t => {
              const active = sub === t.id;
              return (
                <button key={t.id} onClick={() => setSub(t.id)} style={{
                  background: active ? ACCENT : 'transparent',
                  border: '1px solid ' + (active ? ACCENT : 'var(--border)'),
                  borderRadius: 9, padding: '5px 12px',
                  color: active ? '#ffffff' : 'var(--txt-5)',
                  fontSize: 12.5, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UDNBar
        udns={udnsVisibles}
        udnActiva={udnActiva}
        onSelect={setUdnActiva}
        isDark={false}
      />

      {sub === 'comercial' && (
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                Cruce de señales · {udnActiva.nombre}
              </p>
              <GraficaCruceSenales brandColor={udnActiva.color} isDark={false} />
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
        <div style={{ padding: 20 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', color: 'var(--txt-3)' }}>Inteligencia de Demanda — próximo paso.</div>
        </div>
      )}
    </div>
  );
}
