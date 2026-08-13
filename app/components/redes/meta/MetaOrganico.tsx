'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import KPICard, { InfoTip } from '../KPICard'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szxdvdbdyuxtvyvxbder.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface Post {
  fecha: string; fuente: string; udn: string; post_id: string; mensaje: string
  tipo: string; impresiones_views: number; alcance: number; reacciones: number
  comentarios: number; compartidos: number; interacciones: number
  link_imagen: string; link_post: string
}
interface Seguidor { fecha: string; fuente: string; udn: string; seguidores: number }
interface Props { accent: string; secondary: string; bg?: string; perfil?: { rol?: string; udn?: string | null; udn_madre?: string | null } | null }
interface Tooltip { mes: string; v1: number; l1: string; v2: number; l2: string; x: number; y: number }
type SortDir = 'asc'|'desc'
interface SortState { col: string; dir: SortDir }

async function fetchSB(table: string, params: Record<string,string> = {}) {
  if (!SUPABASE_KEY) return []
  const q = new URLSearchParams({ select:'*', ...params })
  const PAGE = 1000
  let all: any[] = []
  let from = 0
  while (true) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${q}`, {
      headers:{
        apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from+PAGE-1}`, Prefer: 'count=exact',
      }
    })
    if (!r.ok) break
    const chunk = await r.json()
    all = all.concat(chunk)
    if (chunk.length < PAGE) break
    from += PAGE
  }
  return all
}

const UDNS  = ['Todas','House Of Films','Mexa Creativa','Marketing United','UiX','Promo Espacio','Neracode','UPAX','ResearchLand','Zeus','Cecilia Fallabrino']
const REDES = ['Todas','Facebook','Instagram']
const TIPOS = ['Todos','Reel','Foto','Carrusel','Video','Historia','Post (Texto)']
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const SORT_COLS = ['fecha','alcance','reacciones','comentarios','compartidos','interacciones','er']

function fmtK(n:number){ if(n>=1_000_000) return (n/1_000_000).toFixed(1)+'M'; if(n>=1_000) return (n/1_000).toFixed(1)+'K'; return String(n) }
function calcER(posts:Post[]){ let si=0,sa=0; for(const p of posts){if(p.alcance>0){si+=p.interacciones;sa+=p.alcance}} return sa>0?(si/sa*100):0 }
function toDateStr(d:Date){ return d.toISOString().slice(0,10) }

const PRESETS = [
  { label:'Últimos 30 días',   fn:()=>{ const d=new Date(),s=new Date(); s.setDate(s.getDate()-30);  return [toDateStr(s),toDateStr(d)] as [string,string] } },
  { label:'Últimos 90 días',   fn:()=>{ const d=new Date(),s=new Date(); s.setDate(s.getDate()-90);  return [toDateStr(s),toDateStr(d)] as [string,string] } },
  { label:'Este año',          fn:()=>[ `${new Date().getFullYear()}-01-01`, toDateStr(new Date())] as [string,string] },
  { label:'Todo el historial', fn:()=>['2025-01-01', toDateStr(new Date())] as [string,string] },
]

export default function MetaOrganico({ accent, secondary, perfil }:Props) {
  const CODIGO_A_NOMBRE_MO: Record<string, string> = {
    UIX: 'UiX', MU: 'Marketing United', PE: 'Promo Espacio', ZU: 'Zeus',
    NC: 'Neracode', HOF: 'House Of Films', RL: 'ResearchLand', MEXA: 'Mexa Creativa',
  }
  const esMktMO = perfil?.rol === 'admin' || perfil?.udn_madre === 'MKT'
  const udnsPropiasMO = (perfil?.udn || '').split(',').map((s: string) => s.trim()).filter(Boolean)
    .map((codigo: string) => CODIGO_A_NOMBRE_MO[codigo] ?? codigo)
  const [posts,   setPosts]   = useState<Post[]>([])
  const [segs,    setSegs]    = useState<Seguidor[]>([])
  const [loading, setLoading] = useState(true)
  const [filtUDN,  setFiltUDN]  = useState<string[]>(esMktMO ? [] : udnsPropiasMO)
  useEffect(() => {
    if (!esMktMO && udnsPropiasMO.length > 0) setFiltUDN(udnsPropiasMO)
  }, [perfil?.udn, perfil?.udn_madre])
  const [filtRed,  setFiltRed]  = useState<string[]>([])
  const [filtTipo, setFiltTipo] = useState<string[]>([])
  const [openFiltro, setOpenFiltro] = useState<string|null>(null)
  const filtroRef = useRef<HTMLDivElement>(null)
  const [imgErr,   setImgErr]   = useState<Record<string,boolean>>({})
  const imgCellRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [hoverImg, setHoverImg] = useState<string|null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [dateTo,   setDateTo]   = useState(toDateStr(new Date()))
  const [activePreset, setActivePreset] = useState('Este año')
  const [tempFrom, setTempFrom] = useState(dateFrom)
  const [tempTo,   setTempTo]   = useState(dateTo)
  const [tooltip1, setTooltip1] = useState<Tooltip|null>(null)
  const [tooltip2, setTooltip2] = useState<Tooltip|null>(null)
  const [sort,     setSort]     = useState<SortState>({ col:'alcance', dir:'desc' })
  const [pagina,   setPagina]   = useState(1)
  const PAGE_SIZE = 10
  useEffect(()=>{ setPagina(1) }, [filtUDN, filtRed, filtTipo, dateFrom, dateTo])
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const handler = (e:MouseEvent)=>{ if(pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false) }
    document.addEventListener('mousedown', handler)
    return ()=>document.removeEventListener('mousedown', handler)
  },[])
  useEffect(()=>{
    const handler = (e:MouseEvent)=>{ if(filtroRef.current && !filtroRef.current.contains(e.target as Node)) setOpenFiltro(null) }
    document.addEventListener('mousedown', handler)
    return ()=>document.removeEventListener('mousedown', handler)
  },[])

  useEffect(()=>{
    Promise.all([
      fetchSB('meta_organico_posts',      { order:'fecha.desc', limit:'5000' }),
      fetchSB('meta_organico_seguidores', { order:'fecha.desc' })
    ]).then(([p,s])=>{ setPosts(p); setSegs(s) }).finally(()=>setLoading(false))
  },[])

  const filtUDNEfectivo = esMktMO
    ? filtUDN
    : (filtUDN.length > 0 ? filtUDN.filter(u => udnsPropiasMO.includes(u)) : udnsPropiasMO)

  const filtered = useMemo(()=>posts.filter(p=>
    p.fecha>=dateFrom && p.fecha<=dateTo &&
    (filtUDNEfectivo.length===0  || filtUDNEfectivo.includes(p.udn)) &&
    (filtRed.length===0  || filtRed.includes(p.fuente)) &&
    (filtTipo.length===0 || filtTipo.includes(p.tipo))
  ),[posts,dateFrom,dateTo,filtUDNEfectivo,filtRed,filtTipo])

  const isFiltered = filtUDN.length>0 || filtRed.length>0 || filtTipo.length>0 || activePreset!=='Este año'
  function resetFilters(){
    setFiltUDN([]); setFiltRed([]); setFiltTipo([])
    const [f,t] = PRESETS[2].fn()
    setDateFrom(f); setDateTo(t); setTempFrom(f); setTempTo(t)
    setActivePreset('Este año')
  }

  const totAlcance = filtered.reduce((s,p)=>s+p.alcance,0)
  const totImp     = filtered.reduce((s,p)=>s+p.impresiones_views,0)
  const totInt     = filtered.reduce((s,p)=>s+p.interacciones,0)
  const totComp    = filtered.reduce((s,p)=>s+p.compartidos,0)
  const er         = calcER(filtered)

  const segFiltered = segs.filter(s=>s.fecha>=dateFrom&&s.fecha<=dateTo&&(filtUDNEfectivo.length===0||filtUDNEfectivo.includes(s.udn))&&(filtRed.length===0||filtRed.includes(s.fuente)))
  const latestSeg:Record<string,number>={}
  for(const s of [...segFiltered].sort((a,b)=>a.fecha<b.fecha?-1:1)) latestSeg[`${s.udn}_${s.fuente}`]=s.seguidores
  const totSeg = Object.values(latestSeg).reduce((a,b)=>a+b,0)

  const mesSet    = [...new Set(filtered.map(p=>p.fecha.slice(0,7)))].sort()
  const erPorUDN  = UDNS.slice(1).map(u=>({u,v:calcER(filtered.filter(p=>p.udn===u))})).filter(x=>x.v>0)
  const erPorMes  = mesSet.map(mes=>({mes:MESES[parseInt(mes.slice(5,7))-1],er:calcER(filtered.filter(p=>p.fecha.startsWith(mes)))}))
  const alcPorMes = mesSet.map(mes=>{const mp=filtered.filter(p=>p.fecha.startsWith(mes));return{mes:MESES[parseInt(mes.slice(5,7))-1],alc:mp.reduce((s,p)=>s+p.alcance,0),imp:mp.reduce((s,p)=>s+p.impresiones_views,0)}})
  const intPorMes = mesSet.map(mes=>{const mp=filtered.filter(p=>p.fecha.startsWith(mes));return{mes:MESES[parseInt(mes.slice(5,7))-1],int:mp.reduce((s,p)=>s+p.interacciones,0),n:mp.length}})

  const rawBitacora = [...filtered].filter(p=>p.alcance>0).map(p=>({...p,er:p.interacciones/p.alcance*100}))
  const bitacoraCompleta = rawBitacora.sort((a,b)=>{
    let av:number, bv:number
    if(sort.col==='er')            { av=a.er;            bv=b.er }
    else if(sort.col==='fecha')    { av=a.fecha<b.fecha?-1:1; bv=0 }
    else                           { av=(a as any)[sort.col]; bv=(b as any)[sort.col] }
    if(sort.col==='fecha') return sort.dir==='asc'? (a.fecha<b.fecha?-1:1) : (a.fecha>b.fecha?-1:1)
    return sort.dir==='desc'? bv-av : av-bv
  })
  const totalPaginas = Math.max(1, Math.ceil(bitacoraCompleta.length / PAGE_SIZE))
  const bitacora = bitacoraCompleta.slice((pagina-1)*PAGE_SIZE, pagina*PAGE_SIZE)

  function toggleSort(col:string){
    setSort(prev=>prev.col===col?{col,dir:prev.dir==='desc'?'asc':'desc'}:{col,dir:'desc'})
    setPagina(1)
  }
  function SortArrow({col}:{col:string}){
    if(sort.col!==col) return <span style={{color:'#cbd5e1',marginLeft:4}}>↕</span>
    return <span style={{color:accent,marginLeft:4}}>{sort.dir==='desc'?'↓':'↑'}</span>
  }

  const maxER  = Math.max(...erPorUDN.map(d=>d.v),0.1)
  const maxAlc = Math.max(...alcPorMes.map(d=>d.alc),1)
  const maxImp = Math.max(...alcPorMes.map(d=>d.imp),1)
  const maxInt = Math.max(...intPorMes.map(d=>d.int),1)
  const maxN   = Math.max(...intPorMes.map(d=>d.n),1)
  const maxErM = Math.max(...erPorMes.map(d=>d.er),0.1)
  const W=460,H=120,PL=52,PB=28
  const card={background:'#ffffff',borderRadius:16,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.04)'}

  function applyPreset(label:string, fn:()=>string[]){
    const [f,t]=fn(); setDateFrom(f); setDateTo(t); setTempFrom(f); setTempTo(t)
    setActivePreset(label); setShowPicker(false)
  }
  function applyCustom(){ setDateFrom(tempFrom); setDateTo(tempTo); setActivePreset('Personalizado'); setShowPicker(false) }
  const periodLabel = activePreset==='Personalizado'?`${dateFrom} → ${dateTo}`:activePreset

  // Y axis ticks helper
  function yTicks(max:number){ const step=max/4; return [0,1,2,3,4].map(i=>Math.round(step*i)) }

  return (
    <div style={{padding:24,maxWidth:1400,margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${accent},${secondary})`,borderRadius:20,padding:'24px 32px',marginBottom:24,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',boxShadow:`0 8px 32px ${accent}40`}}>
        <div style={{width:52,height:52,borderRadius:14,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>📘</div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',letterSpacing:'-0.5px'}}>META Orgánico</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:2}}>
            Facebook + Instagram · Contenido Orgánico{loading?' · Cargando...':`· ${filtered.length} posts`}
          </div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <div ref={filtroRef} style={{display:'flex',gap:10}}>
          {([['UDN',esMktMO ? UDNS.slice(1) : udnsPropiasMO,filtUDNEfectivo,setFiltUDN],['Red',REDES.slice(1),filtRed,setFiltRed],['Tipo',TIPOS.slice(1),filtTipo,setFiltTipo]] as [string,string[],string[],(v:string[])=>void][]).map(([l,opts,val,set])=>(
            <div key={l} style={{position:'relative'}}>
              <button onClick={()=>setOpenFiltro(openFiltro===l?null:l)}
                style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:9,color:'#fff',padding:'7px 12px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
                {l}: {val.length===0 ? (l==='Tipo'?'Todos':'Todas') : val.length===1 ? val[0] : `${val.length} seleccionadas`}
                <span style={{fontSize:9}}>▾</span>
              </button>
              {openFiltro===l&&(
                <div style={{position:'absolute',left:0,top:'calc(100% + 6px)',background:'#fff',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.2)',padding:10,zIndex:100,minWidth:180,maxHeight:280,overflowY:'auto'}}>
                  {opts.map(o=>{
                    const checked = val.includes(o)
                    return (
                      <label key={o} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:7,cursor:'pointer',fontSize:12.5,color:'#334155'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='#f8fafc')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <input type='checkbox' checked={checked}
                          onChange={()=>set(checked ? val.filter(x=>x!==o) : [...val,o])}
                          style={{cursor:'pointer'}}/>
                        {o}
                      </label>
                    )
                  })}
                  {val.length>0 && (
                    <button onClick={()=>set([])} style={{width:'100%',marginTop:6,padding:'6px 8px',borderRadius:7,border:'none',background:'transparent',color:accent,fontSize:11.5,fontWeight:700,cursor:'pointer',textAlign:'left'}}>
                      Limpiar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
          {/* Período */}
          <div style={{position:'relative'}} ref={pickerRef}>
            <button onClick={()=>setShowPicker(!showPicker)}
              style={{background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:9,color:'#fff',padding:'7px 14px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
              📅 {periodLabel}
            </button>
            {showPicker&&(
              <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'#fff',borderRadius:16,boxShadow:'0 8px 40px rgba(0,0,0,0.18)',padding:20,zIndex:100,minWidth:300}}>
                <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:16}}>
                  {PRESETS.map(p=>(
                    <button key={p.label} onClick={()=>applyPreset(p.label,p.fn)}
                      style={{padding:'8px 12px',borderRadius:8,border:'none',textAlign:'left',cursor:'pointer',fontSize:13,fontWeight:600,
                        background:activePreset===p.label?`${accent}18`:'transparent',color:activePreset===p.label?accent:'#374151'}}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div style={{borderTop:'1px solid #f1f5f9',paddingTop:14}}>
                  <div style={{fontSize:11,color:'#94a3b8',fontWeight:600,marginBottom:10}}>RANGO PERSONALIZADO</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
                    <input type='date' value={tempFrom} onChange={e=>setTempFrom(e.target.value)} style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12}}/>
                    <span style={{color:'#94a3b8',fontSize:12}}>→</span>
                    <input type='date' value={tempTo}   onChange={e=>setTempTo(e.target.value)}   style={{flex:1,padding:'6px 10px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12}}/>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setShowPicker(false)} style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:12,cursor:'pointer'}}>Cancelar</button>
                    <button onClick={applyCustom} style={{flex:1,padding:'8px',borderRadius:8,border:'none',background:accent,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Aplicar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Botón borrar filtros */}
          {isFiltered&&(
            <button onClick={resetFilters}
              style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:9,color:'#fff',padding:'7px 14px',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:600}}>
              ✕ Borrar filtros
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:14}}>
        <KPICard
          label={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Alcance':'Cuentas alcanzadas') : 'Alcance / Espectadores'}
          value={fmtK(totAlcance)} accent={accent}
          info={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Personas unicas que vieron el post (post_impressions_unique).':'Cuentas unicas que vieron el contenido (reach).') : 'Personas/cuentas unicas alcanzadas. En Facebook: post_impressions_unique. En Instagram: reach.'}
        />
        <KPICard
          label={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Reproducciones de video':'Visualizaciones') : 'Impresiones / Visualizaciones'}
          value={fmtK(totImp)} accent={accent}
          info={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Reproducciones de video del post (post_video_views). Es 0 en posts sin video.':'Numero de veces que se vio el contenido (views), incluye repeticiones.') : 'Facebook: reproducciones de video. Instagram: numero de veces visto (views), incluye repeticiones.'}
        />
        <KPICard label='Interacciones Totales' value={fmtK(totInt)} accent={secondary}
          info='Suma de reacciones/me gusta + comentarios + compartidos/guardados de todo el contenido filtrado.'/>
        <KPICard label='Seguidores Totales' value={totSeg.toLocaleString('es-MX')} accent={secondary}
          info='Ultimo valor registrado por UDN y red social (no se suma historico, se toma el snapshot mas reciente).'/>
      </div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:24}}>
        <KPICard label='Engagement Rate' value={`${er.toFixed(2)}%`} accent={accent} small
          info='(Suma de interacciones / suma de alcance) x 100, de todo el contenido filtrado. Ponderado por exposicion, no promedio simple por post.'/>
        <KPICard label={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Compartidos':'Guardados') : 'Compartidos'}
          value={fmtK(totComp)} accent={accent} small
          info={filtRed.length===1 ? (filtRed[0]==='Facebook'?'Veces que se compartio el post.':'Veces que se guardo el contenido (Instagram no expone shares por post).') : 'Facebook: compartidos reales. Instagram: guardados (no expone shares por post).'}/>
        <KPICard label='# de Posts'      value={String(filtered.length)} accent={secondary} small/>
      </div>

      {/* Gráficas fila 1 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        {/* ER por UDN */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:4}}>Engagement Rate por UDN</div>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:20}}>Objetivo: Ver qué marca conecta mejor</div>
          <div style={{display:'flex',gap:8}}>
            <div style={{writingMode:'vertical-rl',transform:'rotate(180deg)',fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center'}}>Engagement Rate (%)</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:6,height:140}}>
                {erPorUDN.map(d=>(
                  <div key={d.u} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,position:'relative',cursor:'default'}}
                    title={`${d.u}: ${d.v.toFixed(2)}%`}>
                    <div style={{fontSize:9,color:'#475569',fontWeight:700}}>{d.v.toFixed(1)}%</div>
                    <div style={{width:'100%',borderRadius:'6px 6px 0 0',height:`${(d.v/maxER)*110}px`,
                      background:`linear-gradient(to top,${accent},${accent}99)`,boxShadow:`0 4px 12px ${accent}33`,
                      transition:'filter 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.15)')}
                      onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}/>
                    <div style={{fontSize:8,color:'#94a3b8',fontWeight:600,textAlign:'center',lineHeight:1.2}}>{d.u.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:'center',fontSize:10,color:'#94a3b8',marginTop:6}}>Unidad de Negocio</div>
            </div>
          </div>
        </div>

        {/* ER por mes */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:4}}>Engagement Rate por mes</div>
          <div style={{fontSize:12,color:'#94a3b8',marginBottom:20}}>Tendencia mensual</div>
          <div style={{display:'flex',gap:8}}>
            <div style={{writingMode:'vertical-rl',transform:'rotate(180deg)',fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center'}}>Engagement Rate (%)</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:12,height:140}}>
                {erPorMes.map((d,i)=>(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}} title={`${d.mes}: ${d.er.toFixed(2)}%`}>
                    <div style={{fontSize:10,color:'#475569',fontWeight:700}}>{d.er.toFixed(1)}%</div>
                    <div style={{width:'100%',borderRadius:'6px 6px 0 0',height:`${(d.er/maxErM)*110}px`,
                      background:`linear-gradient(to top,${secondary},${secondary}99)`,transition:'filter 0.2s'}}
                      onMouseEnter={e=>(e.currentTarget.style.filter='brightness(1.15)')}
                      onMouseLeave={e=>(e.currentTarget.style.filter='brightness(1)')}/>
                    <div style={{fontSize:11,color:'#94a3b8',fontWeight:600}}>{d.mes}</div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:'center',fontSize:10,color:'#94a3b8',marginTop:6}}>Mes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas fila 2 */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        {/* Alcance vs Impresiones — con tooltips + ejes */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:4}}>Alcance vs. Impresiones</div>
          <div style={{display:'flex',gap:20,fontSize:11,marginBottom:12}}>
            <span style={{display:'flex',alignItems:'center',gap:5,color:'#64748b'}}><span style={{width:14,height:2,background:accent,display:'inline-block',borderRadius:2}}/>Alcance</span>
            <span style={{display:'flex',alignItems:'center',gap:5,color:'#64748b'}}><span style={{width:14,height:2,background:secondary,display:'inline-block',borderRadius:2,opacity:0.7}}/>Impresiones</span>
          </div>
          {alcPorMes.length>1?(() => {
            const HL = H
            return (
            <div style={{position:'relative'}}>
              <svg viewBox={`0 0 ${W+PL} ${HL+PB+20}`} style={{width:'100%',height:190,overflow:'visible'}}>
                {/* Y axis label */}
                <text x='10' y={(HL+PB)/2} transform={`rotate(-90,10,${(HL+PB)/2})`} textAnchor='middle' fill='#94a3b8' fontSize='10'>Personas</text>
                {/* Y axis ticks */}
                {yTicks(Math.max(maxAlc,maxImp)).map((v,i)=>{
                  const y=PB+HL-(v/Math.max(maxAlc,maxImp))*HL
                  return<g key={i}>
                    <line x1={PL} y1={y} x2={PL+W} y2={y} stroke='#f1f5f9' strokeWidth='1'/>
                    <text x={PL-4} y={y+4} textAnchor='end' fill='#94a3b8' fontSize='10'>{fmtK(v)}</text>
                  </g>
                })}
                {/* X axis label */}
                <text x={PL+W/2} y={HL+PB+32} textAnchor='middle' fill='#94a3b8' fontSize='10'>Mes</text>
                {(() => {
                  const escalaCompartida = Math.max(maxAlc,maxImp,1)
                  const pA=alcPorMes.map((d,i)=>[PL+(i/(alcPorMes.length-1))*W, PB+HL-(d.alc/escalaCompartida)*HL] as [number,number])
                  const pI=alcPorMes.map((d,i)=>[PL+(i/(alcPorMes.length-1))*W, PB+HL-(d.imp/escalaCompartida)*HL] as [number,number])
                  // Relleno de la BRECHA entre Alcance e Impresiones (no del area hasta el piso)
                  const gapPoints = `${pA.map(p=>p.join(',')).join(' ')} ${pI.slice().reverse().map(p=>p.join(',')).join(' ')}`
                  return<>
                    <polygon points={gapPoints} fill={`${secondary}22`}/>
                    <polyline points={pA.map(p=>p.join(',')).join(' ')} fill='none' stroke={accent} strokeWidth='2.5' strokeLinejoin='round'/>
                    <polyline points={pI.map(p=>p.join(',')).join(' ')} fill='none' stroke={secondary} strokeWidth='2' strokeDasharray='6,4' strokeLinejoin='round'/>
                    {alcPorMes.map((d,i)=><text key={i} x={pA[i][0]} y={HL+PB+18} textAnchor='middle' fill='#94a3b8' fontSize='10'>{d.mes}</text>)}
                    {pA.map(([x,y],i)=>(
                      <g key={i}>
                        <circle cx={x} cy={y} r='6' fill={accent} stroke='white' strokeWidth='2' style={{cursor:'pointer'}}
                          onMouseEnter={()=>setTooltip1({mes:alcPorMes[i].mes,v1:alcPorMes[i].alc,l1:'Alcance',v2:alcPorMes[i].imp,l2:'Impresiones',x,y})}
                          onMouseLeave={()=>setTooltip1(null)}/>
                        <circle cx={pI[i][0]} cy={pI[i][1]} r='5' fill={secondary} stroke='white' strokeWidth='2' style={{cursor:'pointer'}}
                          onMouseEnter={()=>setTooltip1({mes:alcPorMes[i].mes,v1:alcPorMes[i].alc,l1:'Alcance',v2:alcPorMes[i].imp,l2:'Impresiones',x:pI[i][0],y:pI[i][1]})}
                          onMouseLeave={()=>setTooltip1(null)}/>
                      </g>
                    ))}
                  </>
                })()}
              </svg>
              {tooltip1&&(
                <div style={{position:'absolute',left:tooltip1.x,top:tooltip1.y-10,transform:'translate(-50%,-100%)',
                  background:'rgba(15,23,42,0.92)',color:'#fff',borderRadius:10,padding:'8px 12px',
                  fontSize:12,pointerEvents:'none',whiteSpace:'nowrap',zIndex:50,
                  boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
                  <div style={{fontWeight:700,marginBottom:4}}>{tooltip1.mes}</div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:secondary,display:'inline-block'}}/> {tooltip1.l2}: <b>{tooltip1.v2.toLocaleString()}</b></div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:accent,display:'inline-block'}}/>  {tooltip1.l1}: <b>{tooltip1.v1.toLocaleString()}</b></div>
                </div>
              )}
            </div>
            )
          })():<div style={{height:190,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8'}}>Sin datos</div>}
        </div>

        {/* Interacciones vs Posts — con tooltips + ejes */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:4}}>Interacciones vs. # de Posts</div>
          <div style={{display:'flex',gap:20,fontSize:11,marginBottom:12}}>
            <span style={{display:'flex',alignItems:'center',gap:5,color:'#64748b'}}><span style={{width:12,height:12,background:accent,display:'inline-block',borderRadius:3}}/>Interacciones</span>
            <span style={{display:'flex',alignItems:'center',gap:5,color:'#64748b'}}><span style={{width:12,height:12,background:secondary,display:'inline-block',borderRadius:3}}/>Posts</span>
          </div>
          <div style={{position:'relative'}}>
            <svg viewBox={`0 0 ${W+PL} ${H+PB+20}`} style={{width:'100%',height:190,overflow:'visible'}}>
              <text x='10' y={(H+PB)/2} transform={`rotate(-90,10,${(H+PB)/2})`} textAnchor='middle' fill='#94a3b8' fontSize='10'>Cantidad</text>
              {yTicks(maxInt).map((v,i)=>{
                const y=PB+H-(v/maxInt)*H
                return<g key={i}>
                  <line x1={PL} y1={y} x2={PL+W} y2={y} stroke='#f1f5f9' strokeWidth='1'/>
                  <text x={PL-4} y={y+4} textAnchor='end' fill='#94a3b8' fontSize='10'>{fmtK(v)}</text>
                </g>
              })}
              <text x={PL+W/2} y={H+PB+32} textAnchor='middle' fill='#94a3b8' fontSize='10'>Mes</text>
              {intPorMes.map((d,i)=>{
                const slot = intPorMes.length>1 ? W/intPorMes.length : W
                const x = PL + slot*i + slot/2
                const bw = Math.min(28, slot*0.32)
                const hInt = d.int/maxInt*H
                const hN   = d.n/maxN*H
                return<g key={i} style={{cursor:'pointer'}}
                  onMouseEnter={()=>setTooltip2({mes:d.mes,v1:d.int,l1:'Interacciones',v2:d.n,l2:'Posts',x,y:PB+H-hInt})}
                  onMouseLeave={()=>setTooltip2(null)}>
                  <rect x={x-bw-1} y={PB+H-hInt} width={bw} height={hInt} rx='4' fill={accent} fillOpacity='0.9'/>
                  <text x={x-bw/2-1} y={PB+H-hInt-6} textAnchor='middle' fill='#334155' fontSize='10' fontWeight='700'>{fmtK(d.int)}</text>
                  <rect x={x+1}  y={PB+H-hN}     width={bw} height={hN}     rx='4' fill={secondary} fillOpacity='0.85'/>
                  <text x={x+bw/2+1} y={PB+H-hN-6} textAnchor='middle' fill='#334155' fontSize='10' fontWeight='700'>{d.n}</text>
                  <text x={x} y={PB+H+18} textAnchor='middle' fill='#94a3b8' fontSize='10'>{d.mes}</text>
                </g>
              })}
            </svg>
            {tooltip2&&(
              <div style={{position:'absolute',left:tooltip2.x,top:tooltip2.y-10,transform:'translate(-50%,-100%)',
                background:'rgba(15,23,42,0.92)',color:'#fff',borderRadius:10,padding:'8px 12px',
                fontSize:12,pointerEvents:'none',whiteSpace:'nowrap',zIndex:50,boxShadow:'0 4px 16px rgba(0,0,0,0.3)'}}>
                <div style={{fontWeight:700,marginBottom:4}}>{tooltip2.mes}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:accent,display:'inline-block'}}/> {tooltip2.l1}: <b>{tooltip2.v1.toLocaleString()}</b></div>
                <div style={{display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:'50%',background:secondary,display:'inline-block'}}/> {tooltip2.l2}: <b>{tooltip2.v2.toLocaleString()}</b></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bitácora */}
      <div style={card}>
        <div style={{fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:4}}>Bitácora de Contenido — Top 10</div>
        <div style={{fontSize:12,color:'#94a3b8',marginBottom:20}}>Haz clic en los encabezados para ordenar · Pasa el cursor sobre la imagen para ampliarla</div>
        {loading?(
          <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Cargando posts...</div>
        ):bitacora.length===0?(
          <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Sin datos para el período seleccionado</div>
        ):(
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                  {[
                    {label:'Fecha',       col:'fecha'},
                    {label:'Imagen',      col:''},
                    {label:'Enlace',      col:''},
                    {label:'Tipo',        col:''},
                    {label:'Fuente',      col:''},
                    {label:'Alcance',     col:'alcance', info:'Personas/cuentas unicas que vieron el contenido.'},
                    {label: filtRed.length===1 ? (filtRed[0]==='Facebook'?'Reacciones':'Me gusta') : 'Reacciones / Me gusta',  col:'reacciones',
                      info: filtRed.length===1 ? (filtRed[0]==='Facebook'?'Suma de todos los tipos de reaccion (me gusta, me encanta, etc.).':'Me gusta (like_count).') : 'Facebook: suma de todos los tipos de reaccion. Instagram: me gusta (like_count).'},
                    {label:'Coment.',     col:'comentarios', info:null},
                    {label: filtRed.length===1 ? (filtRed[0]==='Facebook'?'Compart.':'Guardado') : 'Compart. / Guardado',    col:'compartidos',
                      info: filtRed.length===1 ? (filtRed[0]==='Facebook'?'Veces que se compartio el post.':'Veces que se guardo el contenido (Instagram no expone shares por post).') : 'Facebook: compartidos reales. Instagram: guardados (no expone shares por post).'},
                    {label:'Interacciones',col:'interacciones', info:'Suma de reacciones/me gusta + comentarios + compartidos/guardados de ese post.'},
                    {label:'ER %',        col:'er', info:'(Interacciones / Alcance) x 100, de ese post individual.'},
                  ].map(h=>(
                    <th key={h.label}
                      onClick={h.col?()=>toggleSort(h.col):undefined}
                      style={{padding:'8px 12px',textAlign:h.label==='Imagen'?'center':'left',
                        color:'#64748b',fontWeight:600,whiteSpace:'nowrap',fontSize:12,
                        cursor:h.col?'pointer':'default',userSelect:'none',
                        background:sort.col===h.col?`${accent}08`:'transparent',
                        borderRadius:4}}>
                      {h.label}{(h as any).info&&<InfoTip text={(h as any).info}/>}{h.col&&<SortArrow col={h.col}/>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bitacora.map((p,i)=>(
                  <tr key={p.post_id} style={{borderBottom:'1px solid #f8fafc',background:i%2===0?'#fff':'#fafbfc'}}
                    onMouseEnter={e=>(e.currentTarget.style.background=`${accent}08`)}
                    onMouseLeave={e=>(e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc')}>
                    <td style={{padding:'10px 12px',color:'#64748b',whiteSpace:'nowrap'}}>{p.fecha}</td>
                    <td style={{padding:'6px 12px',textAlign:'center',position:'relative'}}>
                      <div ref={el=>{imgCellRefs.current[p.post_id]=el}} style={{position:'relative',display:'inline-block'}}
                        onMouseEnter={()=>setHoverImg(p.post_id)}
                        onMouseLeave={()=>setHoverImg(null)}>
                        {p.link_imagen&&!imgErr[p.post_id]?(
                          <>
                            <img src={p.link_imagen} alt=''
                              onError={()=>setImgErr(prev=>({...prev,[p.post_id]:true}))}
                              style={{width:56,height:56,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0',display:'block'}}/>
                            {hoverImg===p.post_id && imgCellRefs.current[p.post_id] && (() => {
                              const r = imgCellRefs.current[p.post_id]!.getBoundingClientRect()
                              const cx = r.left + r.width/2, cy = r.top + r.height/2
                              return (
                                <img src={p.link_imagen} alt=''
                                  style={{position:'fixed', left:cx, top:cy, transform:'translate(-50%,-50%)',
                                    width:190, height:190, objectFit:'cover', borderRadius:10,
                                    boxShadow:'0 16px 44px rgba(0,0,0,0.4)', zIndex:1000, pointerEvents:'none'}}/>
                              )
                            })()}
                          </>
                        ):(
                          <div style={{width:56,height:56,borderRadius:8,background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                            {p.fuente==='Instagram'?'📷':'📘'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      {p.link_post?<a href={p.link_post} target='_blank' rel='noopener noreferrer' style={{color:accent,textDecoration:'none',fontSize:12,fontWeight:600}}>🔗 Ver</a>:'—'}
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,
                        background:p.tipo==='Reel'?'#fef3c7':p.tipo==='Foto'?'#dbeafe':p.tipo==='Carrusel'?'#ede9fe':p.tipo==='Historia'?'#fce7f3':'#f1f5f9',
                        color:p.tipo==='Reel'?'#92400e':p.tipo==='Foto'?'#1e40af':p.tipo==='Carrusel'?'#5b21b6':p.tipo==='Historia'?'#9d174d':'#475569'}}>
                        {p.tipo}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px'}}><span style={{display:'flex',alignItems:'center',gap:4,color:'#64748b',fontSize:12}}>{p.fuente==='Instagram'?'📷':'👍'} {p.fuente}</span></td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a',background:sort.col==='alcance'?`${accent}05`:'transparent'}}>{p.alcance.toLocaleString()}</td>
                    <td title={p.fuente==='Facebook' ? 'Reacciones (Me gusta, Me encanta, etc.)' : 'Me gusta'} style={{padding:'10px 12px',color:'#0f172a',background:sort.col==='reacciones'?`${accent}05`:'transparent'}}>{p.reacciones.toLocaleString()}</td>
                    <td style={{padding:'10px 12px',color:'#0f172a',background:sort.col==='comentarios'?`${accent}05`:'transparent'}}>{p.comentarios.toLocaleString()}</td>
                    <td title={p.fuente==='Facebook' ? 'Compartidos' : 'Guardados (Instagram no expone shares por post)'} style={{padding:'10px 12px',color:'#0f172a',background:sort.col==='compartidos'?`${accent}05`:'transparent'}}>{p.compartidos.toLocaleString()}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,color:'#0f172a',background:sort.col==='interacciones'?`${accent}05`:'transparent'}}>{p.interacciones.toLocaleString()}</td>
                    <td style={{padding:'10px 12px',background:sort.col==='er'?`${accent}05`:'transparent'}}>
                      <span style={{fontWeight:700,fontSize:13,color:p.er>=5?'#059669':p.er>=2?'#d97706':'#ef4444'}}>{p.er.toFixed(2)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && bitacoraCompleta.length>0 && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginTop:16}}>
            <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1}
              style={{padding:'6px 14px',borderRadius:8,border:'1px solid #e2e8f0',background:pagina===1?'#f8fafc':'#fff',color:pagina===1?'#cbd5e1':'#334155',fontSize:12.5,fontWeight:600,cursor:pagina===1?'default':'pointer'}}>
              ← Anterior
            </button>
            <span style={{fontSize:12.5,color:'#64748b'}}>Página {pagina} de {totalPaginas}</span>
            <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={pagina===totalPaginas}
              style={{padding:'6px 14px',borderRadius:8,border:'1px solid #e2e8f0',background:pagina===totalPaginas?'#f8fafc':'#fff',color:pagina===totalPaginas?'#cbd5e1':'#334155',fontSize:12.5,fontWeight:600,cursor:pagina===totalPaginas?'default':'pointer'}}>
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
