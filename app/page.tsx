'use client';
import { useState } from 'react';
import { SidebarV2 } from './components/shared/SidebarV2';

const MODULOS = {
  brujula: { url: 'https://brujula-comercial-upax.vercel.app', acento: '#E8008D' },
  redes:   { url: 'https://redes-sociales-upax.vercel.app', acento: '#2563EB' },
  hubspot: { url: 'https://hubspot-analytics-upax-zeta.vercel.app', acento: '#FF7A59' },
};

export default function Page() {
  const [moduloActivo, setModuloActivo] = useState<'brujula' | 'redes' | 'hubspot'>('brujula');
  const modulo = MODULOS[moduloActivo];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarV2
        acento={modulo.acento}
        moduloActivo={moduloActivo}
        onModuloChange={setModuloActivo}
      />
      <div style={{ flex: 1, height: '100%' }}>
        <iframe
          key={moduloActivo}
          src={modulo.url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={moduloActivo}
        />
      </div>
    </div>
  )
}
