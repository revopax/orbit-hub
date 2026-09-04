'use client';
import { useState, useEffect } from 'react';
import BoletinReact from './boletin/BoletinReact';

/**
 * Módulo "Boletín MKT Corp" — el boletín interno mensual de Marketing Corporativo.
 *
 * Las ediciones viven en public/boletin/<id>/ y se listan en public/boletin/ediciones.json;
 * agregar una edición nueva es soltar la carpeta y añadir su entrada al manifiesto.
 */

interface Edicion {
  id: string;
  label: string;
  titulo?: string;
  publicada?: string;
}

const BRAND = '#E34714';
const BARRA = '#15161a';

export default function BoletinMKT() {
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [edicionId, setEdicionId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch('/boletin/ediciones.json')
      .then((r) => (r.ok ? r.json() : { ediciones: [] }))
      .then((json) => {
        const lista: Edicion[] = json.ediciones ?? [];
        // Más reciente primero.
        lista.sort((a, b) => b.id.localeCompare(a.id));
        setEdiciones(lista);
        const saved = window.localStorage.getItem('boletin-edicion');
        setEdicionId(
          saved && lista.some((e) => e.id === saved) ? saved : (lista[0]?.id ?? null),
        );
      })
      .catch((err) => console.error('Error cargando ediciones del boletín:', err))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (edicionId) window.localStorage.setItem('boletin-edicion', edicionId);
  }, [edicionId]);

  const edicion = ediciones.find((e) => e.id === edicionId) ?? null;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1e1e1e',
        fontFamily: 'Inter,-apple-system,sans-serif',
      }}
    >
      {/* Barra del módulo — deliberadamente delgada y en la paleta del boletín,
          para restarle lo mínimo al área de contenido. */}
      <div
        style={{
          flexShrink: 0,
          height: 48,
          background: BARRA,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <img
            src="/logos/orbit-boletin-selected-white.svg"
            alt=""
            style={{ width: 20, height: 20, display: 'block' }}
          />
          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Boletín <span style={{ color: BRAND }}>MKT Corp</span>
          </span>
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* Selector de edición */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, minWidth: 0 }}>
          {ediciones.map((e) => {
            const activa = e.id === edicionId;
            return (
              <button
                key={e.id}
                onClick={() => setEdicionId(e.id)}
                title={e.titulo}
                style={{
                  background: activa ? BRAND : 'transparent',
                  border: `1px solid ${activa ? BRAND : 'rgba(255,255,255,0.16)'}`,
                  borderRadius: 8,
                  padding: '5px 13px',
                  color: activa ? '#ffffff' : 'rgba(255,255,255,0.62)',
                  fontSize: 12,
                  fontWeight: activa ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s',
                }}
              >
                {e.label}
              </button>
            );
          })}
          {!cargando && ediciones.length === 0 && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              No hay ediciones publicadas.
            </span>
          )}
        </div>

      </div>

      {/* Área del boletín */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {cargando ? (
          <div style={{ padding: 40, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Cargando boletín...
          </div>
        ) : !edicion ? (
          <div style={{ padding: 40, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            No hay ninguna edición para mostrar.
          </div>
        ) : (
          <BoletinReact edicionId={edicion.id} />
        )}
      </div>
    </div>
  );
}
