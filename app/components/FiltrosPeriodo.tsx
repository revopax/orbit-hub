'use client';
interface Props {
  anio: number;
  mes: string | null;
  onAnio: (a: number) => void;
  onMes: (m: string | null) => void;
}
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export function FiltrosPeriodo({ anio, mes, onAnio, onMes }: Props) {
  const anios = [2025, 2026];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', padding:'12px 0' }}>
      <div style={{ display:'flex', gap:6 }}>
        {anios.map(a => (
          <button key={a} onClick={() => { onAnio(a); onMes(null); }} style={{
            padding:'5px 14px', borderRadius:6, fontSize:12, cursor:'pointer', fontWeight:500,
            border: a === anio ? '1.5px solid #534AB7' : '0.5px solid var(--border)',
            background: a === anio ? '#EEEDFE' : 'transparent',
            color: a === anio ? '#534AB7' : 'var(--text-secondary)',
          }}>{a}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {MESES.map((m, i) => {
          const val = `${anio}-${String(i+1).padStart(2,'0')}`;
          const active = mes === val;
          return (
            <button key={m} onClick={() => onMes(active ? null : val)} style={{
              padding:'4px 10px', borderRadius:20, fontSize:11, cursor:'pointer', fontWeight: active ? 500 : 400,
              border: active ? '1.5px solid #534AB7' : '0.5px solid var(--border)',
              background: active ? '#EEEDFE' : 'transparent',
              color: active ? '#534AB7' : 'var(--text-muted)',
            }}>{m}</button>
          );
        })}
        <button onClick={() => onMes(null)} style={{
          padding:'4px 14px', borderRadius:20, fontSize:11, cursor:'pointer', fontWeight: !mes ? 500 : 400,
          border: !mes ? '1.5px solid #534AB7' : '0.5px solid var(--border)',
          background: !mes ? '#EEEDFE' : 'transparent',
          color: !mes ? '#534AB7' : 'var(--text-secondary)',
        }}>Todo el año</button>
      </div>
    </div>
  );
}
