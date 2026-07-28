'use client';
import { ChangelogBell } from './ChangelogBell';
import { UserMenu } from './UserMenu';

interface Perfil {
  nombre: string;
  rol: string;
  udn?: string | null;
}

interface OrbitTopbarProps {
  perfil?: Perfil | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

const ACENTO = '#7c3aed';

export function OrbitTopbar({ perfil, isDark, onToggleTheme, onLogout }: OrbitTopbarProps) {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: 'var(--header-bg, #030712)',
      borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/orbit-icon-64.png" alt="ORBIT" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
        <div style={{
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg,#ffffff 0%,#c4b5fd 50%,#fca5a5 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          ORBIT Hub
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <svg width="44" height="24" viewBox="0 0 52 28" fill="none">
            <rect x="1" y="1" width="50" height="26" rx="13" fill={isDark ? '#1a1a2e' : '#f0f0f0'} stroke={isDark ? 'rgba(140,89,254,.5)' : 'rgba(0,0,0,.15)'} strokeWidth="1.5" />
            <circle cx={isDark ? 39 : 13} cy="14" r="10" fill={isDark ? 'url(#tg-dark)' : 'url(#tg-light)'} style={{ transition: 'cx 0.25s ease' }} />
            <defs>
              <linearGradient id="tg-dark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#dc2626"/><stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
              <linearGradient id="tg-light" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFB800"/><stop offset="100%" stopColor="#FF7600"/>
              </linearGradient>
            </defs>
          </svg>
        </button>
        <ChangelogBell acento={ACENTO} />
        <UserMenu nombre={perfil?.nombre} rol={perfil?.rol} udn={perfil?.udn} acento={ACENTO} onLogout={onLogout} isMobile={false} />
      </div>
    </header>
  );
}
