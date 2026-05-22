/**
 * LocationMap — Free OpenStreetMap component using Leaflet + react-leaflet
 *
 * Performance optimizations:
 * - Leaflet is loaded lazily via dynamic import
 * - Map is deferred until GPS is available (avoids heavy render when not needed)
 * - Uses React.memo to prevent re-renders from parent
 * - No backdrop-blur or expensive CSS effects
 *
 * No API key required — uses free OpenStreetMap tiles.
 */

import { lazy, Suspense, memo } from "react"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { MAP_DEFAULT_ZOOM, DEFAULT_LAT, DEFAULT_LON } from "@/lib/appConfig"

// Lazy-load the actual Leaflet map component — this defers the ~200KB
// Leaflet library until it's actually needed
const LocationMapInner = lazy(() => import("./LocationMapInner"))

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
  /** Whether to show map even without GPS (uses default location) */
  showWithoutGps?: boolean
}

// ── Lightweight placeholder while loading ────────────────────────

function MapPlaceholder({ height }: { height: number | string }) {
  return (
    <div
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
      className="flex items-center justify-center bg-gray-100 text-gray-400"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        <span className="text-xs">মানচিত্র লোড হচ্ছে...</span>
      </div>
    </div>
  )
}

// ── Wrapper Component ────────────────────────────────────────────

function LocationMapWrapper({
  height = 200,
  zoom = MAP_DEFAULT_ZOOM,
  showAccuracy = true,
  accuracyMeters,
  extraMarkers,
  showWithoutGps = false,
}: LocationMapProps) {
  const { gps, locationLabel } = useLocationStore()
  const { language } = useSettingsStore()

  // Don't render the heavy Leaflet map until GPS is available
  // (unless showWithoutGps is true)
  if (!gps && !showWithoutGps) {
    return (
      <div
        style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
        className="flex items-center justify-center bg-gray-50 text-gray-400"
      >
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <span className="text-lg">📍</span>
          <span className="text-xs">
            {language === "bn" ? "অবস্থান শেয়ার করুন মানচিত্র দেখতে" : "Share location to see map"}
          </span>
        </div>
      </div>
    )
  }

  const lat = gps?.lat ?? DEFAULT_LAT
  const lon = gps?.lon ?? DEFAULT_LON
  const label = locationLabel || (language === "bn" ? "কুড়িগ্রাম সদর, কুড়িগ্রাম" : "Kurigram Sadar, Kurigram")

  return (
    <Suspense fallback={<MapPlaceholder height={height} />}>
      <LocationMapInner
        lat={lat}
        lon={lon}
        label={label}
        height={height}
        zoom={zoom}
        showAccuracy={showAccuracy}
        accuracyMeters={accuracyMeters}
        extraMarkers={extraMarkers}
        hasGps={!!gps}
      />
    </Suspense>
  )
}

export default memo(LocationMapWrapper)
