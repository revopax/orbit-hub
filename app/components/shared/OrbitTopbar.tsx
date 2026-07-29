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
      height: 52, flexShrink: 0,
      background: '#ffffff',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/orbit-mark.svg" alt="ORBIT" style={{ height: 32, width: 32, display: 'block', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#111827' }}>ORBIT</span>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', color: '#64748b', marginTop: 3 }}>MARKETING HUB</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ChangelogBell acento={ACENTO} />
        <UserMenu nombre={perfil?.nombre} rol={perfil?.rol} udn={perfil?.udn} acento={ACENTO} onLogout={onLogout} isMobile={false} />
      </div>
    </header>
  );
}
