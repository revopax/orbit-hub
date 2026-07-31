'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarV2 } from './components/shared/SidebarV2';
import { OrbitTopbar } from './components/shared/OrbitTopbar';
import BrujulaComercial from './components/BrujulaComercial';
import RedesUPAX from './components/RedesUPAX';
import HubSpotAnalytics from './components/HubSpotAnalytics';
import { useAuth } from './hooks/useAuth';

const ACENTOS = {
  brujula: '#7c3aed',
  redes: '#7c3aed',
  hubspot: '#7c3aed',
};

const MODULOS_CLAROS: Array<'brujula' | 'redes' | 'hubspot'> = ['redes', 'hubspot'];

export default function Page() {
  const { perfil, loading, logout } = useAuth();
  const router = useRouter();
  const [moduloActivo, setModuloActivo] = useState<'brujula' | 'redes' | 'hubspot'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('orbit-modulo-activo');
      if (saved === 'brujula' || saved === 'redes' || saved === 'hubspot') return saved;
    }
    return 'brujula';
  });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem('orbit-modulo-activo', moduloActivo);
  }, [moduloActivo]);

  if (loading) {
    return <div style={{ padding: 40, fontSize: 14, color: '#94a3b8' }}>Cargando...</div>;
  }

  if (!perfil) {
    router.push('/login');
    return null;
  }

  const esClaro = MODULOS_CLAROS.includes(moduloActivo);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: 'var(--surface, #030712)',
    }}>
      <OrbitTopbar
        perfil={perfil}
        isDark={isDark}
        onToggleTheme={() => setIsDark(d => !d)}
        onLogout={logout}
      />
      <div style={{
        height: 4, flexShrink: 0,
        background: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 60%, #4f46e5 100%)',
      }} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: esClaro ? '#ffffff' : 'var(--bg, #0F172A)' }}>
        <SidebarV2
          acento={ACENTOS[moduloActivo]}
          moduloActivo={moduloActivo}
          onModuloChange={setModuloActivo}
          nombre={perfil?.nombre}
          onLogout={logout}
          permisos={perfil?.permisos}
        />
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'auto',
          background: esClaro ? '#ffffff' : 'var(--bg, #0F172A)',
        }}>
          {moduloActivo === 'brujula' && <BrujulaComercial />}
          {moduloActivo === 'redes' && <RedesUPAX />}
          {moduloActivo === 'hubspot' && <HubSpotAnalytics />}
        </div>
      </div>
    </div>
  )
}
