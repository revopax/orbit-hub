'use client';
import { useState } from 'react';
import { FunnelPanel, TeamsPanel, type FiltrosHome } from '../../components/HubSpotAnalytics';

const UDN_SLUGS: Record<string, string> = {
  'house-of-films': 'House Of Films',
  'marketing-united': 'Marketing United',
  'promo-espacio': 'Promo Espacio',
  'research-land': 'Research Land',
  'mexa-creativa': 'Mexa Creativa',
  'uix': 'UIX',
  'zeus': 'Zeus',
  'neracode': 'Neracode',
};

export default function EmbedUdnClient({ udn }: { udn: string }) {
  const udnNombre = UDN_SLUGS[udn];

  const [dateFrom] = useState(new Date().getFullYear() + '-01-01');
  const [dateTo] = useState(new Date().toISOString().slice(0, 10));

  if (!udnNombre) {
    return (
      <div style={{ padding: 40, fontFamily: 'Inter,-apple-system,sans-serif', color: '#64748b' }}>
        UDN no reconocida: {udn}
      </div>
    );
  }

  const filtros: FiltrosHome = {
    udn: [udnNombre], origen: [], conversion: [], fuente: [], fuenteConversion: [],
  };

  return (
    <div style={{ padding: 20, background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <FunnelPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />
        <TeamsPanel dateFrom={dateFrom} dateTo={dateTo} filtros={filtros} />
      </div>
    </div>
  );
}
