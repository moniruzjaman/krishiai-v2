/**
 * LocationMap — Free OpenStreetMap component using Leaflet + react-leaflet
 *
 * Shows user's GPS location with a marker and upazila/district label.
 * Used on Home and Weather pages.  No API key required — uses free
 * OpenStreetMap tiles.
 */

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MAP_DEFAULT_ZOOM, MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "@/lib/appConfig"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"

// ── Fix Leaflet default marker icons (broken by bundler) ────────
// Leaflet's icon images don't load with Vite — use inline SVG data URIs
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

interface LocationMapProps {
  /** Override height — default 200px */
  height?: number | string
  /** Override zoom — default from appConfig */
  zoom?: number
  /** Show accuracy circle around marker */
  showAccuracy?: boolean
  /** Accuracy radius in meters */
  accuracyMeters?: number
  /** Optional extra markers */
  extraMarkers?: Array<{ lat: number; lon: number; label: string; color?: string }>
}

// ── Component ───────────────────────────────────────────────────

export default function LocationMap({
  height = 200,
  zoom = MAP_DEFAULT_ZOOM,
  showAccuracy = true,
  accuracyMeters,
  extraMarkers,
}: LocationMapProps) {
  const { gps, upazila, district, locationLabel } = useLocationStore()
  const { language } = useSettingsStore()

  // Fallback center: Kurigram Sadar
  const lat = gps?.lat ?? 25.8056
  const lon = gps?.lon ?? 89.6902

  const label = locationLabel || (language === "bn" ? "কুড়িগ্রাম সদর, কুড়িগ্রাম" : "Kurigram Sadar, Kurigram")

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
        {showAccuracy && gps && (
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
