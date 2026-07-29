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
        <img src="/orbit-icon-64.png" alt="ORBIT" style={{ width: 26, height: 26, flexShrink: 0 }} />
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: '#1e1b2e' }}>
          ORBIT <span style={{ color: '#7c3aed' }}>Hub</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ChangelogBell acento={ACENTO} />
        <UserMenu nombre={perfil?.nombre} rol={perfil?.rol} udn={perfil?.udn} acento={ACENTO} onLogout={onLogout} isMobile={false} />
      </div>
    </header>
  );
}
