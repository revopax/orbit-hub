'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/app/lib/supabase';

interface SidebarV2Props {
  acento: string;
  moduloActivo: 'brujula' | 'redes' | 'hubspot';
  onModuloChange: (m: 'brujula' | 'redes' | 'hubspot') => void;
  nombre?: string;
  onLogout?: () => void;
  permisos?: Record<string, 'all' | string[]> | null;
  rol?: string;
}

const BRAND = '#7038D8';

const MODULOS = [
  {
    id: 'brujula' as const,
    label: 'Brújula Comercial 2.0',
    iconImg: '/logos/orbit-brujula-outline.svg',
    iconImgActivo: '/logos/orbit-brujula-selected-white.svg',
  },
  {
    id: 'redes' as const,
    label: 'Redes UPAX',
    iconImg: '/logos/orbit-redes-outline.svg',
    iconImgActivo: '/logos/orbit-redes-selected-white.svg',
  },
  {
    id: 'hubspot' as const,
    label: 'Data & Analytics',
    iconImg: '/logos/orbit-analytics-outline.svg',
    iconImgActivo: '/logos/orbit-analytics-selected-white.svg',
  },
];

export function SidebarV2({ acento, moduloActivo, onModuloChange, nombre, onLogout, permisos, rol }: SidebarV2Props) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ width: isMobile ? (expanded ? 220 : 0) : 60, flexShrink: 0, height: '100%', position: 'relative', transition: 'width 0.18s ease' }}>
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: expanded ? 220 : 60,
        transition: 'width 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface, #030712)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
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
        {rol?.toLowerCase() === 'admin' && (
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
        )}

        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 8px 8px',
          whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Módulos
        </span>
        {MODULOS.filter((mod) => {
          if (!permisos || Object.keys(permisos).length === 0) return true
          return permisos[mod.id] !== undefined
        }).map((mod) => {
          const isActivo = moduloActivo === mod.id;
          return (
            <div
              key={mod.id}
              onClick={() => {
                onModuloChange(mod.id)
                const sb = getSupabase()
                sb.auth.getSession().then(({ data: { session } }) => {
                  if (!session) return
                  sb.from('module_access_log').insert({ perfil_id: session.user.id, modulo: mod.id })
                    .then(({ error }) => { if (error) console.error('Error registrando module_access_log:', error) })
                })
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                color: '#FFFFFF',
                backgroundColor: isActivo ? BRAND : 'transparent',
                fontSize: 13, fontWeight: isActivo ? 600 : 500,
                transition: 'background-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap', minWidth: 0,
              }}
              onMouseEnter={(e) => { if (!isActivo) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={(e) => { if (!isActivo) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ flexShrink: 0, display: 'flex', width: 22, height: 22 }}>
                <img src={isActivo && mod.iconImgActivo ? mod.iconImgActivo : mod.iconImg} alt="" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: 4, filter: isActivo ? 'none' : 'brightness(0) invert(1)' }} />
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
          overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0,
        }}>
          {nombre ?? 'Usuario'}
        </span>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: '#F87171', fontSize: 12, fontWeight: 600, textAlign: 'left', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span style={{ whiteSpace: 'nowrap', opacity: expanded ? 1 : 0, transition: 'opacity 0.15s' }}>Cerrar sesión</span>
        </button>
      )}
    </aside>
    </div>
  );
}
