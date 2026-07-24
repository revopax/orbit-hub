'use client';
import type { UDN } from '../../lib/types';

interface Props {
  udns: UDN[];
  udnActiva: UDN;
  onSelect: (udn: UDN) => void;
  isDark?: boolean;
}

export function UDNBar({ udns, udnActiva, onSelect }: Props) {
  return (
    <div
      className="udn-bar"
      style={{
        position: 'sticky',
        top: 64,
        zIndex: 40,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="udn-bar-inner"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '8px 18px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {udns.map(udn => {
          const isActive = udn.id === udnActiva.id;
          const colorSecundario = udn.secundario ?? '#000000';

          return (
            <button
              key={udn.id}
              onClick={() => onSelect(udn)}
              style={{
                flexShrink: 0,
                padding: '5px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none',
                ...(isActive ? {
                  background: `linear-gradient(135deg, ${udn.color} 0%, ${colorSecundario} 100%)`,
                  color: udn.texto,
                  border: `1.5px solid ${udn.color}`,
                  boxShadow: `0 0 14px 2px ${udn.color}55, 0 2px 8px ${udn.color}33`,
                } : {
                  background: 'transparent',
                  color: 'var(--txt-3)',
                  border: '1.5px solid var(--border)',
                  boxShadow: 'none',
                }),
              }}
            >
              {udn.nombre}
            </button>
          );
        })}
      </div>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: 32,
        background: 'linear-gradient(to right, transparent, var(--bg-topbar))',
        pointerEvents: 'none',
      }} />
      <style>{`.udn-bar-inner::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
