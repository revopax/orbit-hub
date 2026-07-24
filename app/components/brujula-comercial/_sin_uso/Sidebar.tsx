'use client';
import { useState } from 'react';

interface SidebarProps {
  acento: string;
}

const MODULOS = [
  {
    id: 'brujula',
    label: 'Brújula Comercial',
    href: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'marketing-agent',
    label: 'Marketing Agent',
    href: 'https://marketing-agent-two-pi.vercel.app',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
        <path d="M7 8h.01M12 8h.01M17 8h.01"/>
      </svg>
    ),
  },
  {
    id: 'redes-sociales',
    label: 'Redes Sociales',
    href: 'https://redes-sociales-upax.vercel.app',
    icon: (
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
        <circle cx="10" cy="10" r="3" fill="#0866FF"/>
        <circle cx="22" cy="10" r="3" fill="#E1306C"/>
        <circle cx="10" cy="22" r="3" fill="#4285F4"/>
        <circle cx="22" cy="22" r="3" fill="#0A66C2"/>
        <line x1="10" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="10" y1="10" x2="10" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="22" y1="10" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
        <line x1="10" y1="22" x2="22" y2="22" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
        <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
      </svg>
    ),
  },
];

export function Sidebar({ acento }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [activo, setActivo] = useState('brujula');

  return (
    <aside
      className="sidebar-desktop"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 200 : 52,
        transition: 'width 0.22s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--header-bg)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {/* Módulos */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 8px' }}>
        {MODULOS.map((mod) => {
          const isActivo = activo === mod.id;
          const content = (
            <div
              key={mod.id}
              onClick={() => { setActivo(mod.id); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 6px',
                borderRadius: 8,
                cursor: 'pointer',
                color: isActivo ? acento : 'var(--txt-4)',
                backgroundColor: isActivo ? `${acento}15` : 'transparent',
                border: isActivo ? `1px solid ${acento}30` : '1px solid transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              <span style={{ flexShrink: 0 }}>{mod.icon}</span>
              <span style={{
                fontSize: 12,
                fontWeight: isActivo ? 600 : 400,
                opacity: expanded ? 1 : 0,
                transition: 'opacity 0.15s',
                overflow: 'hidden',
              }}>
                {mod.label}
              </span>
            </div>
          );

          return mod.href ? (
            <a key={mod.id} href={mod.href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              {content}
            </a>
          ) : content;
        })}
      </nav>
    </aside>
  );
}
