/**
 * LocationMapInner — The actual Leaflet map component.
 *
 * This file is dynamically imported (lazy-loaded) so that the
 * heavy Leaflet library (~200KB) is only loaded when the map
 * is actually rendered on screen.
 */

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "@/lib/appConfig"

// ── Fix Leaflet default marker icons (broken by bundler) ────────
const GREEN_ICON = L.icon({
  iconUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">' +
        '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#16a34a"/>' +
        '<circle cx="12" cy="12" r="5" fill="white"/>' +
        "</svg>"
    ),
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
})

// ── Helper: recenter map when GPS changes ───────────────────────

function RecenterOnGps({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  const prevRef = useRef(`${lat},${lon}`)

  useEffect(() => {
    const key = `${lat},${lon}`
    if (key !== prevRef.current) {
      map.setView([lat, lon], map.getZoom(), { animate: true })
      prevRef.current = key
    }
  }, [lat, lon, map])

  return null
}

// ── Props ───────────────────────────────────────────────────────

interface LocationMapInnerProps {
  lat: number
  lon: number
  label: string
  height: number | string
  zoom: number
  showAccuracy: boolean
  accuracyMeters?: number
  extraMarkers?: Array<{ lat: number; lon: number; label: string; color?: string }>
  hasGps: boolean
}

// ── Component ───────────────────────────────────────────────────

export default function LocationMapInner({
  lat,
  lon,
  label,
  height,
  zoom,
  showAccuracy,
  accuracyMeters,
  extraMarkers,
  hasGps,
}: LocationMapInnerProps) {
  return (
    <div style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}>
      <MapContainer
        center={[lat, lon]}
        zoom={zoom}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={MAP_TILE_URL} attribution={MAP_TILE_ATTRIBUTION} />
        <RecenterOnGps lat={lat} lon={lon} />

        {/* User location marker */}
        <Marker position={[lat, lon]} icon={GREEN_ICON}>
          <Popup>
            <div style={{ textAlign: "center", fontFamily: "system-ui" }}>
              <strong>{label}</strong>
              <br />
              <span style={{ fontSize: "0.75rem", color: "#666" }}>
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </span>
            </div>
          </Popup>
        </Marker>

        {/* Accuracy circle */}
        {showAccuracy && hasGps && (
          <Circle
            center={[lat, lon]}
            radius={accuracyMeters ?? 500}
            pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.1, weight: 1 }}
          />
        )}

        {/* Extra markers (e.g. weather stations, market points) */}
        {extraMarkers?.map((m, idx) => (
          <Marker
            key={idx}
            position={[m.lat, m.lon]}
            icon={L.icon({
              iconUrl:
                "data:image/svg+xml," +
                encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">' +
                    `<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${m.color || "#3b82f6"}"/>` +
                    '<circle cx="12" cy="12" r="5" fill="white"/>' +
                    "</svg>"
                ),
              iconSize: [24, 36],
              iconAnchor: [12, 36],
              popupAnchor: [0, -36],
            })}
          >
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
