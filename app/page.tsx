'use client';
import { useRouter } from 'next/navigation';
import { SidebarV2 } from './components/shared/SidebarV2';

const ACENTOS = {
  brujula: '#E8008D',
  redes: '#2563EB',
  hubspot: '#FF7A59',
};

export default function Page() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarV2
        acento={ACENTOS.brujula}
        moduloActivo="brujula"
        onModuloChange={(m) => router.push(`/${m}`)}
      />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Selecciona un módulo del sidebar
      </div>
    </div>
  )
}
