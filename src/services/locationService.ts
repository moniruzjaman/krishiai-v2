/**
 * Location Service — Smart GPS + Reverse Geocoding for KrishiAI v2
 *
 * Uses:
 *  - Browser Geolocation API (free, built-in)
 *  - Nominatim / OpenStreetMap reverse geocoding (free, no API key)
 *
 * Auto-decodes district, upazila, and full address from GPS coordinates.
 */

import {
  NOMINATIM_BASE_URL,
  NOMINATIM_USER_AGENT,
  BD_LAT_MIN,
  BD_LAT_MAX,
  BD_LON_MIN,
  BD_LON_MAX,
  DEFAULT_DISTRICT_BN,
  DEFAULT_UPAZILA_BN,
} from "../lib/appConfig"

// ── Types ───────────────────────────────────────────────────────

export interface ReverseGeocodeResult {
  /** Full display address, e.g. "Kurigram Sadar, Kurigram, Rangpur, Bangladesh" */
  displayName: string
  /** District name in Bengali (best-effort from Nominatim) */
  district: string
  /** Upazila name in Bengali (best-effort from Nominatim) */
  upazila: string
  /** Village/area name */
  village: string
  /** Division name */
  division: string
  /** Raw Nominatim address object */
  address: Record<string, string>
}

// ── Public Functions ────────────────────────────────────────────

/**
 * Check if coordinates fall within Bangladesh boundaries.
 */
export function isInBangladesh(lat: number, lon: number): boolean {
  return lat >= BD_LAT_MIN && lat <= BD_LAT_MAX && lon >= BD_LON_MIN && lon <= BD_LON_MAX
}

/**
 * Reverse-geocode latitude/longitude using Nominatim (free, no API key).
 * Returns district, upazila, and full address in Bengali-friendly format.
 *
 * Nominatim usage policy: max 1 request/second, must include User-Agent.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    format: "json",
    "accept-language": "bn",
    addressdetails: "1",
    zoom: "12", // Upazila-level detail
  })

  const url = `${NOMINATIM_BASE_URL}?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`Nominatim error: ${response.status}`)
  }

  const data = await response.json()

  // Extract address components — Nominatim returns various keys depending on location
  const addr: Record<string, string> = data.address || {}

  // District: try multiple Nominatim keys (varies by region in BD)
  const district =
    addr.city ||
    addr.district ||
    addr.county ||
    addr.state_district ||
    DEFAULT_DISTRICT_BN

  // Upazila
  const upazila =
    addr.subdistrict ||
    addr.upazila ||
    addr.town ||
    addr.village ||
    addr.city_district ||
    DEFAULT_UPAZILA_BN

  // Village / area
  const village =
    addr.village ||
    addr.hamlet ||
    addr.suburb ||
    addr.neighbourhood ||
    ""

  // Division
  const division =
    addr.state ||
    addr.region ||
    ""

  return {
    displayName: data.display_name || "",
    district,
    upazila,
    village,
    division,
    address: addr,
  }
}

/**
 * Get a short location label for display, e.g. "উলিপুর, কুড়িগ্রাম"
 */
export function getLocationLabel(upazila: string, district: string): string {
  if (upazila && district) return `${upazila}, ${district}`
  if (district) return district
  if (upazila) return upazila
  return ""
}
