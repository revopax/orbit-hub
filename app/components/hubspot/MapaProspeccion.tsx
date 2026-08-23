'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix de iconos default de Leaflet (rutas rotas con bundlers modernos)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Manzana { cvegeo: string; pobtot: number; geom_geojson: string }
interface Establecimiento {
  raz_social: string | null; nom_estab: string | null; per_ocu: string
  latitud: number | null; longitud: number | null; municipio: string; entidad: string
  telefono: string | null; correoelec: string | null
}

function colorPorPoblacion(pobtot: number): string {
  if (pobtot > 200) return '#4c1d95'
  if (pobtot > 100) return '#6d28d9'
  if (pobtot > 50) return '#8b5cf6'
  if (pobtot > 10) return '#c4b5fd'
  return '#ede9fe'
}

function BoundsWatcher({ onMove }: { onMove: (bbox: string) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds()
      onMove(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
    },
  })
  useEffect(() => {
    const b = map.getBounds()
    onMove(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
  }, [])
  return null
}

export default function MapaProspeccion({ establecimientos }: { establecimientos: Establecimiento[] }) {
  const [manzanas, setManzanas] = useState<Manzana[]>([])
  const [zoom, setZoom] = useState(5)

  const cargarManzanas = useCallback((bbox: string) => {
    fetch(`/api/prospeccion?mode=manzanas&bbox=${bbox}`)
      .then(r => r.json())
      .then(d => setManzanas(d.data || []))
      .catch(() => setManzanas([]))
  }, [])

  const puntos = establecimientos.filter(e => e.latitud != null && e.longitud != null)
  const centro: [number, number] = puntos.length > 0
    ? [puntos[0].latitud as number, puntos[0].longitud as number]
    : [23.6345, -102.5528] // centro de México

  return (
    <div style={{ height: 420, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative', zIndex: 0 }}>
      <MapContainer center={centro} zoom={puntos.length > 0 ? 11 : 5} style={{ height: '100%', width: '100%' }}
        whenReady={() => {}}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <BoundsWatcher onMove={cargarManzanas} />

        {zoom >= 13 && manzanas.map(m => {
          try {
            const geo = JSON.parse(m.geom_geojson)
            const coords = geo.coordinates[0].map((c: number[]) => [c[1], c[0]] as [number, number])
            return (
              <Polygon key={m.cvegeo} positions={coords}
                pathOptions={{ color: colorPorPoblacion(m.pobtot), fillOpacity: 0.35, weight: 1 }}>
                <Popup>Población: {m.pobtot.toLocaleString('es-MX')}</Popup>
              </Polygon>
            )
          } catch { return null }
        })}

        <MarkerClusterGroup chunkedLoading>
          {puntos.map((e, i) => (
            <Marker key={i} position={[e.latitud as number, e.longitud as number]}>
              <Popup>
                <div style={{ fontSize: 13 }}>
                  <strong>{e.raz_social || e.nom_estab}</strong><br />
                  {e.municipio}, {e.entidad}<br />
                  {e.per_ocu}<br />
                  {e.telefono || e.correoelec || 'Sin contacto'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
