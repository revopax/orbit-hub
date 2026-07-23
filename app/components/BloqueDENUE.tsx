'use client'
import { useState } from 'react'

const UDN_COLORS: Record<string, string> = {
  UIX: '#8C59FE', MU: '#DCFF00', PE: '#FF7600', ZU: '#61ACAA',
  NC: '#3E31CC', HOF: '#3274FC', RL: '#770EB7', MEXA: '#FD00C7',
}
const UDN_LABELS: Record<string, string> = {
  UIX: 'UIX', MU: 'MU', PE: 'PE', ZU: 'Zeus',
  NC: 'NC', HOF: 'HOF', RL: 'RL', MEXA: 'MEXA',
}

interface Rama { codigo: string; nombre: string; udns?: string[]; nota?: string }
interface Subsector { codigo: string; nombre: string; ramas?: Rama[] }
interface Sector { codigo: string; nombre: string; alias?: string[]; tieneIGAE: boolean; notaIGAE?: string; subsectores: Subsector[] }

const SECTORES: Sector[] = [
  { codigo: '11', nombre: 'Agricultura, cría y explotación de animales', alias: ['Agroindustria', 'Campo', 'Agro'], tieneIGAE: false, notaIGAE: 'Incluido en Actividades Primarias del índice de actividad económica, sin desglose por subsector disponible', subsectores: [{ codigo: '111', nombre: 'Agricultura' }, { codigo: '112', nombre: 'Cría y explotación de animales' }, { codigo: '113', nombre: 'Aprovechamiento forestal' }, { codigo: '114', nombre: 'Pesca, caza y captura' }, { codigo: '115', nombre: 'Servicios relacionados con actividades agropecuarias' }] },
  { codigo: '21', nombre: 'Minería', alias: ['Minería', 'Extracción'], tieneIGAE: false, notaIGAE: 'Sector con datos agregados en el índice de actividad económica, sin desglose de temporalidad por subsector disponible', subsectores: [{ codigo: '211', nombre: 'Extracción de petróleo y gas' }, { codigo: '212', nombre: 'Minería de minerales metálicos y no metálicos' }] },
  { codigo: '22', nombre: 'Generación y distribución de energía eléctrica', alias: ['Energía', 'Electricidad', 'Utilities'], tieneIGAE: true, subsectores: [{ codigo: '221', nombre: 'Generación, transmisión y distribución de energía eléctrica', ramas: [{ codigo: '2211', nombre: 'Generación y transmisión de energía eléctrica', udns: ['PE'], nota: 'DOOH en instalaciones industriales' }] }] },
  { codigo: '23', nombre: 'Construcción', alias: ['Construcción', 'Inmobiliaria', 'Real Estate'], tieneIGAE: true, subsectores: [{ codigo: '236', nombre: 'Edificación', ramas: [{ codigo: '2361', nombre: 'Edificación residencial', udns: ['MU', 'PE'], nota: 'Stands en expos inmobiliarias, DOOH en desarrollos' }] }] },
  { codigo: '31-33', nombre: 'Industrias manufactureras', alias: ['Manufactura', 'Industria', 'Producción'], tieneIGAE: true, subsectores: [{ codigo: '311-312', nombre: 'Industria alimentaria y de bebidas', ramas: [{ codigo: '3121', nombre: 'Industria de las bebidas', udns: ['MU', 'PE', 'MEXA'], nota: 'Activaciones BTL, DOOH, campañas de marca' }] }, { codigo: '334', nombre: 'Fabricación de equipo de cómputo y electrónico', ramas: [{ codigo: '3341', nombre: 'Fabricación de computadoras y periféricos', udns: ['NC', 'UIX'], nota: 'Software, UX de producto' }] }] },
  { codigo: '43', nombre: 'Comercio al por mayor', alias: ['Distribución', 'Mayoreo', 'B2B comercial'], tieneIGAE: true, subsectores: [{ codigo: '431', nombre: 'Comercio al por mayor de abarrotes y alimentos', ramas: [{ codigo: '4311', nombre: 'Abarrotes y alimentos', udns: ['MU', 'PE'], nota: 'Activaciones en punto de venta, DOOH' }] }] },
  { codigo: '46', nombre: 'Comercio al por menor', alias: ['Retail', 'Consumo masivo', 'Tiendas', 'Comercio'], tieneIGAE: true, subsectores: [{ codigo: '461', nombre: 'Comercio al por menor de abarrotes y alimentos', ramas: [{ codigo: '4611', nombre: 'Abarrotes, alimentos y bebidas', udns: ['MU', 'PE', 'MEXA'], nota: 'BTL, activaciones, DOOH, campañas' }] }, { codigo: '462', nombre: 'Comercio al por menor en tiendas de autoservicio', ramas: [{ codigo: '4621', nombre: 'Tiendas de autoservicio', udns: ['MU', 'PE', 'RL'], nota: 'Mystery Shopper, DOOH, activaciones' }] }] },
  { codigo: '48-49', nombre: 'Transportes, correos y almacenamiento', alias: ['Logística', 'Transporte', 'Supply Chain'], tieneIGAE: true, subsectores: [{ codigo: '484', nombre: 'Autotransporte de carga', ramas: [{ codigo: '4841', nombre: 'Autotransporte de carga general', udns: ['PE', 'RL'], nota: 'DOOH en carreteras, Geomarketing' }] }] },
  { codigo: '51', nombre: 'Información en medios masivos', alias: ['Medios', 'Media', 'Entretenimiento digital', 'Telecomunicaciones'], tieneIGAE: true, subsectores: [{ codigo: '511', nombre: 'Edición de publicaciones y software', ramas: [{ codigo: '5112', nombre: 'Edición de software', udns: ['NC', 'UIX'], nota: 'Desarrollo de software, UX de plataformas' }] }, { codigo: '512', nombre: 'Industria fílmica y del sonido', ramas: [{ codigo: '5121', nombre: 'Industria fílmica y del video', udns: ['HOF'], nota: 'Producción audiovisual, videos corporativos' }, { codigo: '5122', nombre: 'Industria del sonido', udns: ['HOF'], nota: 'Producción de audio, podcasts' }] }, { codigo: '515', nombre: 'Radio y televisión', ramas: [{ codigo: '5151', nombre: 'Radio y televisión', udns: ['HOF', 'MEXA'] }] }, { codigo: '517', nombre: 'Telecomunicaciones', ramas: [{ codigo: '5171', nombre: 'Telecomunicaciones alámbricas e inalámbricas', udns: ['PE', 'NC'], nota: 'Conexión digital, programmatic' }] }] },
  { codigo: '52', nombre: 'Servicios financieros y de seguros', alias: ['Finanzas', 'Banca', 'Seguros', 'Fintech'], tieneIGAE: true, subsectores: [{ codigo: '522', nombre: 'Instituciones de intermediación crediticia', ramas: [{ codigo: '5221', nombre: 'Banca múltiple', udns: ['UIX', 'RL', 'ZU'], nota: 'UX/UI banca digital, NPS, capacitaciones' }] }, { codigo: '524', nombre: 'Compañías de seguros', ramas: [{ codigo: '5241', nombre: 'Seguros de vida', udns: ['UIX', 'RL'] }] }] },
  { codigo: '53', nombre: 'Servicios inmobiliarios y de alquiler', alias: ['Inmobiliario', 'Real Estate', 'Bienes raíces'], tieneIGAE: true, subsectores: [{ codigo: '531', nombre: 'Servicios inmobiliarios', ramas: [{ codigo: '5311', nombre: 'Alquiler de inmuebles', udns: ['RL', 'PE'], nota: 'Geomarketing, DOOH en desarrollos' }] }] },
  { codigo: '54', nombre: 'Servicios profesionales, científicos y técnicos', alias: ['Consultoría', 'Tecnología', 'Profesionales'], tieneIGAE: true, subsectores: [{ codigo: '541', nombre: 'Servicios profesionales, científicos y técnicos', ramas: [{ codigo: '5414', nombre: 'Diseño especializado', udns: ['UIX', 'MEXA'], nota: 'UIX: UX/UI, Service Design · MEXA: Diseño gráfico y de marca' }, { codigo: '54143', nombre: 'Diseño gráfico', udns: ['UIX', 'MEXA'] }, { codigo: '5416', nombre: 'Consultoría en administración', udns: ['UIX', 'ZU'] }, { codigo: '5418', nombre: 'Servicios de publicidad', udns: ['MEXA', 'MU'] }, { codigo: '54181', nombre: 'Agencias de publicidad', udns: ['MEXA'] }, { codigo: '5419', nombre: 'Otros servicios profesionales, científicos y técnicos', udns: ['RL'], nota: 'Investigación de mercados' }, { codigo: '54191', nombre: 'Investigación de mercados', udns: ['RL'] }] }] },
  { codigo: '55', nombre: 'Corporativos', alias: ['Holding', 'Grupo empresarial', 'Casa matriz'], tieneIGAE: true, subsectores: [{ codigo: '551', nombre: 'Corporativos', ramas: [{ codigo: '5511', nombre: 'Corporativos', udns: ['ZU', 'MU', 'UIX'], nota: 'Capacitaciones, eventos corporativos, UX' }] }] },
  { codigo: '56', nombre: 'Servicios de apoyo a los negocios', alias: ['Outsourcing', 'BPO', 'Servicios empresariales'], tieneIGAE: true, subsectores: [{ codigo: '561', nombre: 'Servicios de apoyo a los negocios', ramas: [{ codigo: '5611', nombre: 'Administración de empresas', udns: ['ZU', 'NC'] }, { codigo: '5614', nombre: 'Servicios de investigación', udns: ['RL'], nota: 'Track de producto, NPS' }] }] },
  { codigo: '61', nombre: 'Servicios educativos', alias: ['Educación', 'Capacitación', 'E-learning'], tieneIGAE: true, subsectores: [{ codigo: '611', nombre: 'Servicios educativos', ramas: [{ codigo: '6111', nombre: 'Educación básica y media', udns: ['ZU'] }, { codigo: '6115', nombre: 'Capacitación para el trabajo', udns: ['ZU', 'UIX'], nota: 'Zeus: capacitaciones · UIX: workshops' }] }] },
  { codigo: '62', nombre: 'Servicios de salud y de asistencia social', alias: ['Salud', 'Healthcare', 'Farmacéutica'], tieneIGAE: true, subsectores: [{ codigo: '621', nombre: 'Servicios médicos de consulta externa', ramas: [{ codigo: '6211', nombre: 'Consultorios médicos', udns: ['UIX', 'RL'] }] }, { codigo: '622', nombre: 'Hospitales', ramas: [{ codigo: '6221', nombre: 'Hospitales generales', udns: ['UIX', 'RL', 'ZU'] }] }] },
  { codigo: '71', nombre: 'Servicios de esparcimiento culturales y deportivos', alias: ['Entretenimiento', 'Cultura', 'Deportes', 'Eventos'], tieneIGAE: true, subsectores: [{ codigo: '711', nombre: 'Servicios artísticos y culturales', ramas: [{ codigo: '7111', nombre: 'Compañías y grupos artísticos', udns: ['HOF', 'MEXA', 'MU'] }, { codigo: '7113', nombre: 'Promotores de espectáculos', udns: ['MU', 'HOF'] }] }] },
  { codigo: '72', nombre: 'Servicios de alojamiento temporal y preparación de alimentos', alias: ['Hospitalidad', 'Turismo', 'Hotelería', 'Restaurantes'], tieneIGAE: true, subsectores: [{ codigo: '721', nombre: 'Servicios de alojamiento temporal', ramas: [{ codigo: '7211', nombre: 'Hoteles con servicios integrados', udns: ['MU', 'PE', 'UIX'] }] }, { codigo: '722', nombre: 'Servicios de preparación de alimentos', ramas: [{ codigo: '7224', nombre: 'Restaurantes de comida rápida', udns: ['MU', 'PE'] }] }] },
  { codigo: '81', nombre: 'Otros servicios excepto actividades gubernamentales', alias: ['Servicios personales', 'Asociaciones', 'ONG'], tieneIGAE: true, subsectores: [{ codigo: '813', nombre: 'Asociaciones y organizaciones', ramas: [{ codigo: '8133', nombre: 'Asociaciones empresariales', udns: ['MU', 'MEXA'] }] }] },
  { codigo: '93', nombre: 'Actividades legislativas, gubernamentales y de impartición de justicia', alias: ['Gobierno', 'Sector público', 'Instituciones'], tieneIGAE: true, subsectores: [{ codigo: '931', nombre: 'Actividades del poder ejecutivo', ramas: [{ codigo: '9311', nombre: 'Actividades del poder ejecutivo', udns: ['RL', 'ZU', 'MU'] }] }] },
]

function UDNDot({ id }: { id: string }) {
  const color = UDN_COLORS[id] || '#888'
  const label = UDN_LABELS[id] || id
  const isLight = color === '#DCFF00'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 999, fontSize: 10, fontWeight: 600, backgroundColor: color + '22', border: `1px solid ${color}55`, color: isLight ? '#7a6a00' : color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color }} />{label}
    </span>
  )
}

function RamaItem({ rama }: { rama: Rama }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0 4px 32px', borderLeft: '1px solid var(--border)', marginLeft: 24 }}>
      <span style={{ fontSize: 10, color: 'var(--txt-5)', fontFamily: 'monospace', flexShrink: 0, marginTop: 2, minWidth: 36 }}>{rama.codigo}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--txt-2)' }}>{rama.nombre}</span>
        {rama.nota && <span style={{ fontSize: 11, color: 'var(--txt-5)', marginLeft: 6 }}>— {rama.nota}</span>}
        {rama.udns && rama.udns.length > 0 && (
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3, marginLeft: 8 }}>
            {rama.udns.map(u => <UDNDot key={u} id={u} />)}
          </span>
        )}
      </div>
    </div>
  )
}

function SubsectorItem({ sub }: { sub: Subsector }) {
  const [open, setOpen] = useState(false)
  const hasRamas = sub.ramas && sub.ramas.length > 0
  return (
    <div style={{ borderLeft: '1px solid var(--border)', marginLeft: 16 }}>
      <button onClick={() => hasRamas && setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 8px 4px 16px', background: 'none', border: 'none', cursor: hasRamas ? 'pointer' : 'default', textAlign: 'left' }}>
        <span style={{ fontSize: 11, color: 'var(--txt-5)', flexShrink: 0 }}>{hasRamas ? (open ? '−' : '+') : ' '}</span>
        <span style={{ fontSize: 11, color: 'var(--txt-5)', fontFamily: 'monospace', flexShrink: 0, minWidth: 36 }}>{sub.codigo}</span>
        <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>{sub.nombre}</span>
      </button>
      {open && hasRamas && sub.ramas!.map(r => <RamaItem key={r.codigo} rama={r} />)}
    </div>
  )
}

function SectorRow({ sector }: { sector: Sector }) {
  const [open, setOpen] = useState(false)
  const udns = Array.from(new Set(sector.subsectores.flatMap(s => s.ramas?.flatMap(r => r.udns || []) || [])))
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: 12, color: 'var(--txt-4)', flexShrink: 0 }}>{open ? '−' : '+'}</span>
        <span style={{ fontSize: 11, color: 'var(--txt-4)', fontFamily: 'monospace', flexShrink: 0, minWidth: 36 }}>({sector.codigo})</span>
        <span style={{ fontSize: 13, color: 'var(--txt-1)', fontWeight: 500, flex: 1 }}>{sector.nombre}</span>
        {!sector.tieneIGAE && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.6)', flexShrink: 0 }}>Sin dato de temporalidad</span>}
        <span style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 160 }}>
          {udns.slice(0, 5).map(u => <UDNDot key={u} id={u} />)}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 8 }}>
          {sector.notaIGAE && (
            <div style={{ margin: '4px 12px 8px 36px', padding: '6px 10px', background: 'rgba(251,191,36,0.08)', borderRadius: 6, fontSize: 11, color: 'var(--txt-4)' }}>⚠️ {sector.notaIGAE}</div>
          )}
          {sector.alias && (
            <div style={{ margin: '0 12px 6px 52px', fontSize: 11, color: 'var(--txt-5)' }}>
              También conocido como: {sector.alias.join(' · ')}
            </div>
          )}
          {sector.subsectores.map(s => <SubsectorItem key={s.codigo} sub={s} />)}
        </div>
      )}
    </div>
  )
}

export default function BloqueDENUE() {
  const [collapsed, setCollapsed] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const q = norm(busqueda.trim())
  const filtrados = q === '' ? SECTORES : SECTORES.filter(s =>
    norm(s.nombre).includes(q) || s.alias?.some(a => norm(a).includes(q)) || s.codigo.includes(q) ||
    s.subsectores.some(sub => norm(sub.nombre).includes(q) || sub.ramas?.some(r => norm(r.nombre).includes(q) || r.codigo.includes(q) || norm(r.nota || '').includes(q)))
  )
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px' }}>
        <button onClick={() => setCollapsed(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' }}>DENUE</span>
              <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>Directorio Estadístico Nacional de Unidades Económicas</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--txt-4)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Clasificación oficial de actividades económicas según el DENUE · Úsala como referencia para nombrar correctamente el sector de tu prospecto y alinear el lenguaje comercial con la nomenclatura del mercado mexicano.
            </p>
          </div>
          <span style={{ fontSize: 11, color: 'var(--txt-4)', flexShrink: 0, marginLeft: 16 }}>{collapsed ? '+ Ver sectores' : '− Colapsar'}</span>
        </button>
      </div>
      {!collapsed && (
        <div style={{ borderTop: '1px solid var(--border)', position: 'relative', background: 'rgba(255,255,255,0.03)' }}>
          {/* Mapa de México como fondo estilo DENUE */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'url(/mexico-map.png)',
            backgroundSize: '55%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            opacity: 0.08,
            filter: 'grayscale(1)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Buscar actividad económica... (ej: tecnologia, retail, agro)"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt-1)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {filtrados.map(s => <SectorRow key={s.codigo} sector={s} />)}
            {filtrados.length === 0 && <p style={{ fontSize: 12, color: 'var(--txt-4)', textAlign: 'center', padding: '20px' }}>No se encontraron sectores.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
