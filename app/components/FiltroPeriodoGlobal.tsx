'use client';
import { useState, useEffect } from 'react';

interface FiltroPeriodoGlobalProps {
  desde: string;
  hasta: string;
  minMes: string;
  maxMes: string;
  onChange: (desde: string, hasta: string) => void;
}

const MESES_CORTOS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function mesesAtras(mesRef: string, n: number): string {
  const [y, m] = mesRef.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMesCorto(mes: string): string {
  const [y, m] = mes.split('-');
  return `${MESES_CORTOS[parseInt(m) - 1]} ${y}`;
}

function listaAnios(minMes: string, maxMes: string): number[] {
  const yMin = parseInt(minMes.split('-')[0]);
  const yMax = parseInt(maxMes.split('-')[0]);
  const anios: number[] = [];
  for (let y = yMax; y >= yMin; y--) anios.push(y);
  return anios;
}

function mesHabilitado(anio: number, mesIdx: number, minMes: string, maxMes: string): boolean {
  const val = `${anio}-${String(mesIdx + 1).padStart(2, '0')}`;
  return val >= minMes && val <= maxMes;
}

function MesAnioPicker({ valor, minMes, maxMes, anios, onSelect }: {
  valor: string; minMes: string; maxMes: string; anios: number[]; onSelect: (m: string) => void;
}) {
  const [anioActivo, setAnioActivo] = useState(parseInt(valor.split('-')[0]));

  return (
    <div style={{ border: '0.5px solid var(--border)', borderRadius: 8, padding: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {anios.map(a => (
          <button
            key={a}
            onClick={() => setAnioActivo(a)}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
              border: 'none', fontWeight: a === anioActivo ? 700 : 400,
              background: a === anioActivo ? '#EEEDFE' : 'transparent',
              color: a === anioActivo ? '#534AB7' : '#94A3B8',
            }}
          >
            {a}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {MESES_CORTOS.map((m, i) => {
          const val = `${anioActivo}-${String(i + 1).padStart(2, '0')}`;
          const habilitado = mesHabilitado(anioActivo, i, minMes, maxMes);
          const activo = val === valor;
          return (
            <button
              key={m}
              disabled={!habilitado}
              onClick={() => onSelect(val)}
              style={{
                padding: '5px 0', borderRadius: 4, fontSize: 11, cursor: habilitado ? 'pointer' : 'not-allowed',
                border: 'none', fontWeight: activo ? 700 : 400,
                background: activo ? '#534AB7' : 'transparent',
                color: !habilitado ? '#E2E8F0' : activo ? '#fff' : '#1e1b4b',
              }}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FiltroPeriodoGlobal({ desde, hasta, minMes, maxMes, onChange }: FiltroPeriodoGlobalProps) {
  const [open, setOpen] = useState(false);
  const [selDesde, setSelDesde] = useState(desde);
  const [selHasta, setSelHasta] = useState(hasta);

  useEffect(() => { setSelDesde(desde); setSelHasta(hasta); }, [desde, hasta]);

  const presets = [
    { label: 'Últimos 3 meses', desde: mesesAtras(maxMes, 2), hasta: maxMes },
    { label: 'Últimos 6 meses', desde: mesesAtras(maxMes, 5), hasta: maxMes },
    { label: 'Últimos 12 meses', desde: mesesAtras(maxMes, 11), hasta: maxMes },
    { label: 'Todo el historial', desde: minMes, hasta: maxMes },
  ];

  const presetActivo = presets.find(p => p.desde === desde && p.hasta === hasta);
  const label = presetActivo ? presetActivo.label : `${fmtMesCorto(desde)} – ${fmtMesCorto(hasta)}`;

  const aplicarPreset = (p: { desde: string; hasta: string }) => {
    onChange(p.desde, p.hasta);
    setOpen(false);
  };

  const aplicarCustom = () => {
    if (selDesde && selHasta && selDesde <= selHasta) {
      onChange(selDesde, selHasta);
      setOpen(false);
    }
  };

  const anios = listaAnios(minMes, maxMes);
  const customValido = !!selDesde && !!selHasta && selDesde <= selHasta;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
          borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff',
          fontSize: 12, fontWeight: 600, color: '#1e1b4b', cursor: 'pointer',
        }}
      >
        {label}
        <span style={{ fontSize: 9, color: '#94A3B8' }}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 201,
            background: '#fff', borderRadius: 12, border: '0.5px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 16, width: 420,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
              {presets.map(p => (
                <button
                  key={p.label}
                  onClick={() => aplicarPreset(p)}
                  style={{
                    textAlign: 'left', padding: '8px 10px', borderRadius: 6, border: 'none',
                    background: presetActivo?.label === p.label ? '#EEEDFE' : 'transparent',
                    color: presetActivo?.label === p.label ? '#534AB7' : '#1e1b4b',
                    fontWeight: presetActivo?.label === p.label ? 600 : 400,
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
                Rango personalizado
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 6px', fontWeight: 600 }}>Desde</p>
                  <MesAnioPicker valor={selDesde} minMes={minMes} maxMes={maxMes} anios={anios} onSelect={setSelDesde} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 6px', fontWeight: 600 }}>Hasta</p>
                  <MesAnioPicker valor={selHasta} minMes={minMes} maxMes={maxMes} anios={anios} onSelect={setSelHasta} />
                </div>
              </div>
              <button
                onClick={aplicarCustom}
                disabled={!customValido}
                style={{
                  marginTop: 12, width: '100%', padding: '8px 0', borderRadius: 6, border: 'none',
                  background: customValido ? '#534AB7' : '#CBD5E1', color: '#fff',
                  fontSize: 12, fontWeight: 600, cursor: customValido ? 'pointer' : 'not-allowed',
                }}
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
