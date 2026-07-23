'use client';
import { useState, useEffect } from 'react';
import { SidebarV2 } from '../components/SidebarV2';
import BrujulaComercial from '../components/BrujulaComercial';
import RedesUPAX from '../components/RedesUPAX';
import HubSpotAnalytics from '../components/HubSpotAnalytics';
import { useAuth } from '../hooks/useAuth';

export default function PreviewPage() {
  const { loading } = useAuth();
  const [moduloActivo, setModuloActivo] = useState<'brujula' | 'redes' | 'hubspot'>('brujula');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  if (process.env.NEXT_PUBLIC_PREVIEW_MODE !== 'true') {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--txt-4)' }}>Vista en construcción.</div>;
  }
  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      <div style={{
        height: 56, flexShrink: 0, backgroundColor: 'rgba(11,17,32,0.85)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 60, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logos/orbit-logo.png" alt="ORBIT" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.02em' }}>
            <span style={{ color: '#F1F5F9' }}>ORBIT</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 12 }}>Hub</span>
          </span>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', backgroundColor: '#8C59FE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12.5, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          DL
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
        <SidebarV2 acento="#8C59FE" moduloActivo={moduloActivo} onModuloChange={setModuloActivo} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto', minWidth: 0 }}>
          {moduloActivo === 'brujula' && <BrujulaComercial />}
          {moduloActivo === 'redes' && <RedesUPAX />}
          {moduloActivo === 'hubspot' && <HubSpotAnalytics />}
        </div>
      </div>
    </div>
  );
}
