'use client'
import { useState, useEffect } from 'react'

function useCountUp(raw: string, dur = 1200) {
  const [val, setVal] = useState('0')
  useEffect(() => {
    const m = raw.match(/^(\$?)([\d.]+)(K|M|%)?$/)
    if (!m) { setVal(raw); return }
    const [,pre,num,suf] = m
    const target = parseFloat(num)
    const dec = num.includes('.') ? num.split('.')[1].length : 0
    let fr = 0; const steps = 55
    const id = setInterval(() => {
      fr++
      const ease = 1 - Math.pow(1 - fr/steps, 3)
      const cur = target * ease
      if (fr >= steps) { setVal(raw); clearInterval(id); return }
      setVal(`${pre}${cur.toFixed(dec)}${suf||''}`)
    }, dur/steps)
    return () => clearInterval(id)
  }, [raw])
  return val
}

interface Props {
  label: string; value: string; accent: string;
  delta?: string; deltaUp?: boolean; small?: boolean; bg?: string; gradient?: string
}
export default function KPICard({ label, value, accent, delta, deltaUp, small }: Props) {
  const animated = useCountUp(value)
  return (
    <div style={{
      flex:1, minWidth: small ? 150 : 190,
      background:'#ffffff',
      borderRadius:14,
      padding: small ? '16px 20px' : '20px 24px',
      boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      borderTop:`3px solid ${accent}`,
      transition:'box-shadow 0.2s, border-color 0.3s',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute',top:0,right:0,width:80,height:80,
        background:`radial-gradient(circle at top right,${accent}12,transparent 70%)`,
        pointerEvents:'none' }}/>
      <div style={{ fontSize:10.5,color:'#94a3b8',textTransform:'uppercase',
        letterSpacing:'0.1em',marginBottom:8,fontWeight:600 }}>{label}</div>
      <div style={{ fontSize: small ? 24 : 30,fontWeight:800,
        color:'#0f172a',lineHeight:1,marginBottom:8,
        fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em' }}>{animated}</div>
      {delta && (
        <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:600,
          color: deltaUp===false ? '#ef4444' : '#22c55e' }}>
          <span>{deltaUp===false ? '▼' : '▲'}</span><span>{delta} vs ant.</span>
        </div>
      )}
      <div style={{ height:3,background:`${accent}18`,borderRadius:3,marginTop:12 }}>
        <div style={{ height:'100%',width:'65%',background:accent,borderRadius:3,
          transition:'width 1.2s ease' }}/>
      </div>
    </div>
  )
}
