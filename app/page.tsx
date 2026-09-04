'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarV2, puedeVerBoletin, type ModuloId } from './components/shared/SidebarV2';
import { OrbitTopbar } from './components/shared/OrbitTopbar';
import BrujulaComercial from './components/BrujulaComercial';
import RedesUPAX from './components/RedesUPAX';
import HubSpotAnalytics from './components/HubSpotAnalytics';
import BoletinMKT from './components/BoletinMKT';
import { useAuth } from './hooks/useAuth';

const ACENTOS: Record<ModuloId, string> = {
  brujula: '#7c3aed',
  redes: '#7c3aed',
  hubspot: '#7c3aed',
  boletin: '#E34714',
};

const MODULOS_CLAROS: ModuloId[] = ['redes', 'hubspot'];
const MODULOS_VALIDOS: ModuloId[] = ['brujula', 'redes', 'hubspot', 'boletin'];

export default function Page() {
  const { perfil, loading, logout } = useAuth();
  const router = useRouter();
  const [moduloActivo, setModuloActivo] = useState<ModuloId>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('orbit-modulo-activo') as ModuloId | null;
      if (saved && MODULOS_VALIDOS.includes(saved)) return saved;
    }
    return 'hubspot';
  });
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem('orbit-modulo-activo', moduloActivo);
  }, [moduloActivo]);

  // El módulo activo queda en localStorage; si el perfil pierde el acceso al boletín
  // (o entra otro usuario en el mismo navegador), no debe quedarse abierto.
  const verBoletin = puedeVerBoletin(perfil?.rol, perfil?.udn_madre);
  useEffect(() => {
    if (!loading && perfil && moduloActivo === 'boletin' && !verBoletin) {
      setModuloActivo('hubspot');
    }
  }, [loading, perfil, moduloActivo, verBoletin]);

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
          rol={perfil?.rol}
          udnMadre={perfil?.udn_madre}
        />
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'auto',
          background: esClaro ? '#ffffff' : 'var(--bg, #0F172A)',
        }}>
          {moduloActivo === 'brujula' && <BrujulaComercial permisos={perfil?.permisos} />}
          {moduloActivo === 'redes' && <RedesUPAX permisos={perfil?.permisos} perfil={perfil} />}
          {moduloActivo === 'hubspot' && <HubSpotAnalytics permisos={perfil?.permisos} perfil={perfil} />}
          {moduloActivo === 'boletin' && verBoletin && <BoletinMKT />}
        </div>
      </div>
    </div>
  )
}
