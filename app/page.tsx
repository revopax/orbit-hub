'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { Topbar } from './components/shared/Topbar';
import { UDNBar } from './components/brujula-comercial/UDNBar';
import { Dashboard } from './components/brujula-comercial/Dashboard';
import { ModalCambiarPassword } from './components/shared/ModalCambiarPassword';
import { UDNS } from './lib/data';
import { useAuth } from './hooks/useAuth';
import type { UDN } from './lib/types';

export default function App() {
  const { perfil, loading, logout } = useAuth();
  const [udnActiva, setUdnActiva] = useState<UDN>(UDNS[0]);
  const [vista, setVista]         = useState<'director' | 'operativa'>('director');
  const [isDark, setIsDark]       = useState<boolean>(true);
  const [meta, setMeta] = useState<Record<string,string>>({});

  useEffect(() => {
    fetch('/data/brujula_data.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setMeta(d.meta ?? {}))
      .catch(() => {});
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('brujula-theme');
      if (saved) setIsDark(saved === 'dark');
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem('brujula-theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  useEffect(() => {
    if (!perfil) return;
    const udnIds = perfil.udn ? perfil.udn.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    if (perfil.rol !== 'admin' && udnIds.length > 0) {
      const udnPerfil = UDNS.find(u => udnIds.includes(u.id));
      if (udnPerfil) setUdnActiva(udnPerfil);
    }
    const vistasPermitidas = perfil.vistas
      ? perfil.vistas.split(',').map((s: string) => s.trim()).filter(Boolean)
      : null;
    if (vistasPermitidas) {
      if (!vistasPermitidas.includes(vista)) {
        setVista((vistasPermitidas[0] as 'director' | 'operativa') ?? 'operativa');
      }
    } else if (['sdr','comercial'].includes(perfil.rol)) {
      setVista('operativa');
    }
  }, [perfil]);

  if (loading) return null;

  return (
    <>
    <div style={{
      display: 'flex', flexDirection: 'row',
      height: '100vh', overflow: 'hidden',
      backgroundColor: 'var(--bg)',
      backgroundImage: isDark ? `
        radial-gradient(ellipse 60% 40% at 10% 0%, ${udnActiva.color}08 0%, transparent 55%),
        radial-gradient(ellipse 50% 35% at 90% 0%, rgba(232,0,141,0.05) 0%, transparent 50%)
      ` : 'none',
      transition: 'background 0.3s ease',
    }}>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
      <Topbar
        vista={vista} onVista={setVista}
        rol={perfil?.rol}
        udnActiva={udnActiva}
        isDark={isDark} onToggleTheme={() => setIsDark(d => !d)}
        onLogout={logout}
        perfil={perfil}
        meta={meta}
      />
      <UDNBar
        udns={perfil?.rol === 'admin' ? UDNS : UDNS.filter(u => (perfil?.udn || '').split(',').map((s: string) => s.trim()).includes(u.id))}
        udnActiva={udnActiva}
        onSelect={setUdnActiva}
        isDark={isDark}
      />
      <Dashboard udnActiva={udnActiva} vista={vista} isDark={isDark} />
      </div>
    </div>

    {/* Modal cambio de contraseña obligatorio */}
    {perfil && perfil.password_changed === false && (
      <ModalCambiarPassword perfil={perfil} acento={udnActiva.color} onDone={() => window.location.reload()} />
    )}
    </>
  );
}
