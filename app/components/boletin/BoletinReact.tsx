'use client';
import { useRef, useLayoutEffect, MouseEvent } from 'react';
import { useBoletinAnimaciones } from './useBoletinAnimaciones';
import Ed202609 from './ediciones/Ed202609';
import './boletin.css';

/**
 * El boletín como componentes de React dentro de Orbit.
 *
 * Este contenedor es el que scrollea (no la página), y es contra él que
 * useBoletinAnimaciones mide todo. Cada edición necesita su propio componente portado.
 */
const EDICIONES: Record<string, () => React.JSX.Element> = {
  '2026-09': Ed202609,
};

export default function BoletinReact({ edicionId }: { edicionId: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useBoletinAnimaciones(scrollerRef);

  // La portada es un flex column con space-between que necesita medir el alto visible
  // para repartir el espacio. `min-height: 100%` no sirve: el padre tiene altura
  // automática (la del contenido), así que el porcentaje no resuelve y la portada se
  // colapsa al alto de su contenido. Se publica el alto real como --boletin-vh.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const medir = () =>
      scroller.style.setProperty('--boletin-vh', `${scroller.clientHeight}px`);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [edicionId]);

  const Edicion = EDICIONES[edicionId];

  // Los enlaces internos (#cumpleanos, #concurso...) no pueden navegar por hash:
  // cambiarían la URL de Next y el scroll ocurre en este div, no en la página.
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest?.('a');
    const href = a?.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    e.preventDefault();
    scrollerRef.current
      ?.querySelector(href)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!Edicion) {
    return (
      <div style={{ padding: 40, color: '#94a3b8', fontSize: 14 }}>
        La edición <strong>{edicionId}</strong> todavía no está publicada.
      </div>
    );
  }

  return (
    <div
      ref={scrollerRef}
      className="boletin-root"
      onClick={onClick}
      style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
    >
      <Edicion />
    </div>
  );
}
