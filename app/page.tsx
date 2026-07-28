'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarV2 } from './components/shared/SidebarV2';
import BrujulaComercial from './components/BrujulaComercial';
import RedesUPAX from './components/RedesUPAX';
import HubSpotAnalytics from './components/HubSpotAnalytics';
import { useAuth } from './hooks/useAuth';

const ACENTOS = {
  brujula: '#E8008D',
  redes: '#2563EB',
  hubspot: '#FF7A59',
};

export default function Page() {
  const { perfil, loading } = useAuth();
  const router = useRouter();
  const [moduloActivo, setModuloActivo] = useState<'brujula' | 'redes' | 'hubspot'>('brujula');

  if (loading) {
    return <div style={{ padding: 40, fontSize: 14, color: '#94a3b8' }}>Cargando...</div>;
  }

  if (!perfil) {
    router.push('/login');
    return null;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarV2
        acento={ACENTOS[moduloActivo]}
        moduloActivo={moduloActivo}
        onModuloChange={setModuloActivo}
      />
      <div style={{ flex: 1, height: '100%', overflow: 'auto' }}>
        {moduloActivo === 'brujula' && <BrujulaComercial />}
        {moduloActivo === 'redes' && <RedesUPAX />}
        {moduloActivo === 'hubspot' && <HubSpotAnalytics />}
      </div>
    </div>
  )
}
