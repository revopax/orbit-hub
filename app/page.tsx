'use client';
import { useState } from 'react';
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
  const [moduloActivo, setModuloActivo] = useState<'brujula' | 'redes' | 'hubspot'>('brujula');

  if (loading) {
    return <div style={{ padding: 40, fontSize: 14, color: '#94a3b8' }}>Cargando...</div>;
  }

  if (!perfil) {
    router.push('/login');
    return null;
  }

  const esClaro = MODULOS_CLAROS.includes(moduloActivo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <OrbitTopbar onLogout={logout} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SidebarV2
          acento={ACENTOS[moduloActivo]}
          moduloActivo={moduloActivo}
          onModuloChange={setModuloActivo}
        />
        <div style={{
          flex: 1, height: '100%', overflow: 'auto',
          background: esClaro ? '#f8fafc' : undefined,
        }}>
          {moduloActivo === 'brujula' && <BrujulaComercial />}
          {moduloActivo === 'redes' && <RedesUPAX />}
          {moduloActivo === 'hubspot' && <HubSpotAnalytics />}
        </div>
      </div>
    </div>
  )
}
