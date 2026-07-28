'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarV2Props {
  acento: string;
  moduloActivo: 'brujula' | 'redes' | 'hubspot';
  onModuloChange: (m: 'brujula' | 'redes' | 'hubspot') => void;
}

const BRAND = '#7c3aed';

const MODULOS = [
  {
    id: 'brujula' as const,
    label: 'Brújula Comercial',
    iconImg: '/logos/brujula-sidebar-logo.png',
  },
  {
    id: 'redes' as const,
    label: 'Redes UPAX',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="6" r="2.2" />
        <circle cx="6" cy="18" r="2.2" />
        <circle cx="18" cy="18" r="2.2" />
        <line x1="6" y1="6" x2="18" y2="6" />
        <line x1="6" y1="6" x2="6" y2="18" />
        <line x1="18" y1="6" x2="18" y2="18" />
        <line x1="6" y1="18" x2="18" y2="18" />
        <circle cx="12" cy="12" r="1.8" />
      </svg>
    ),
  },
  {
    id: 'hubspot' as const,
    label: 'HubSpot Analytics',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="16" r="2" />
        <circle cx="19" cy="16" r="2" />
        <path d="M12 7v4.5M12 11.5L6.3 14M12 11.5l5.7 2.5" />
      </svg>
    ),
  },
];

export function SidebarV2({ acento, moduloActivo, onModuloChange }: SidebarV2Props) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <div style={{ width: 60, flexShrink: 0, height: '100%', position: 'relative' }}>
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 220 : 60,
        transition: 'width 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface, #262a3d)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderTopRightRadius: 0,
        borderBottomRightRadius: 16,
        height: 'calc(100vh - 56px)',
        overflow: 'visible',
        position: 'fixed',
        top: 56,
        left: 0,
        zIndex: 200,
        boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      <div style={{ height: 10, flexShrink: 0 }} />

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '14px 10px' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px',
          whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Plataforma
        </span>
        <div
          onClick={() => router.push('/iam')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
            color: 'rgba(255,255,255,0.62)', fontSize: 13, fontWeight: 500,
            whiteSpace: 'nowrap', minWidth: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span style={{ flexShrink: 0, display: 'flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}>
            IAM · Gestión de usuarios
          </span>
        </div>

        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 8px',
          whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Módulos
        </span>
        {MODULOS.map((mod) => {
          const isActivo = moduloActivo === mod.id;
          return (
            <div
              key={mod.id}
              onClick={() => onModuloChange(mod.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                color: isActivo ? '#FFFFFF' : 'rgba(255,255,255,0.62)',
                backgroundColor: isActivo ? BRAND : 'transparent',
                fontSize: 13, fontWeight: isActivo ? 600 : 500,
                transition: 'background-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap', minWidth: 0,
              }}
              onMouseEnter={(e) => { if (!isActivo) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (!isActivo) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ flexShrink: 0, display: 'flex', width: 22, height: 22 }}>
                {mod.iconImg
                  ? <img src={mod.iconImg} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4 }} />
                  : mod.icon}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}>
                {mod.label}
              </span>
            </div>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div style={{
        padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: acento, flexShrink: 0 }} />
        <span style={{
          fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500,
          whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Diego Luna
        </span>
      </div>
    </aside>
    </div>
  );
}
