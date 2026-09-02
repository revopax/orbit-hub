'use client';
import { useEffect, useState } from 'react';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches;
    if (yaInstalada) return;

    // Detectar iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      // En iOS siempre mostramos el botón manual
      setVisible(true);
      setTimeout(() => setAnimating(true), 100);
    } else {
      // En Android/Chrome esperamos el evento
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
        setTimeout(() => setAnimating(true), 100);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(v => !v);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') handleDismiss();
  };

  const handleDismiss = () => {
    setAnimating(false);
    setShowIOSHint(false);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-80px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to { transform: translateY(-80px) scale(0.95); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        animation: animating
          ? 'slideDown 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
          : 'slideUp 0.3s ease forwards',
      }}>
        {/* Botón principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleInstall}
            style={{
              background: 'rgba(15,10,30,0.85)',
              border: 'none',
              borderRadius: 50,
              padding: '6px 20px 6px 6px',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 20px rgba(140,89,254,0.35), 0 2px 8px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
            }}
          >
            <img src="/orbit-mark.svg" alt="ORBIT" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '50%' }} />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: 28, height: 28,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tooltip para iOS */}
        {showIOSHint && (
          <div style={{
            background: 'rgba(15,10,30,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(140,89,254,0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            maxWidth: 220,
            animation: 'fadeIn 0.3s ease forwards',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <p style={{
              color: '#fff', fontSize: 12, fontWeight: 600,
              margin: '0 0 6px', fontFamily: 'Inter, sans-serif'
            }}>
              Instala en iPhone con Safari:
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 11,
              margin: 0, lineHeight: 1.6, fontFamily: 'Inter, sans-serif'
            }}>
              1. Abre esta página en <strong style={{color:'#8C59FE'}}>Safari</strong><br/>
              2. Toca el ícono <strong style={{color:'#8C59FE'}}>compartir ↑</strong><br/>
              3. Toca <strong style={{color:'#8C59FE'}}>"Agregar a pantalla de inicio"</strong><br/>
              4. Toca <strong style={{color:'#8C59FE'}}>"Agregar"</strong> ···<br/>
              3. Selecciona <strong style={{color:'#8C59FE'}}>"Agregar a pantalla de inicio"</strong><br/>
              4. Toca <strong style={{color:'#8C59FE'}}>"Agregar"</strong>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
