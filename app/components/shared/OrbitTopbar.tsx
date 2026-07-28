'use client';

export function OrbitTopbar({ onLogout }: { onLogout?: () => void }) {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: '#07080f',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #dc2626 0%, #7c3aed 60%, #4f46e5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>O</div>
        <div style={{
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg,#ffffff 0%,#c4b5fd 50%,#fca5a5 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          ORBIT Hub
        </div>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
            padding: '6px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      )}
    </header>
  );
}
