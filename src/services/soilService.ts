/**
 * Soil Service — client-side wrapper for KrishiAI soil data API.
 */

import type { SoilData } from "../store/useLocationStore"

// ── API base ────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || ""

// ── Public functions ────────────────────────────────────────────

/**
 * Fetch soil data for a given latitude and longitude.
 */
export async function getSoilData(lat: number, lon: number): Promise<SoilData> {
  const response = await fetch(
    `${API_BASE}/api/soil?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Soil API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<SoilData>
}

/**
 * Determine soil texture class from clay, sand, and silt percentages.
 * Uses the USDA soil texture triangle classification.
 *
 * @returns Soil texture key (e.g. "clay", "loam", "sandy_loam")
 */
export function getSoilType(clay: number, sand: number, silt: number): string {
  // Normalize to ensure they sum to 100
  const total = clay + sand + silt
  const c = total > 0 ? (clay / total) * 100 : 0
  const s = total > 0 ? (sand / total) * 100 : 0
  const si = total > 0 ? (silt / total) * 100 : 0

  // ── USDA Soil Texture Triangle ──────────────────────────
  // Clay ≥ 40%
  if (c >= 40) {
    if (s >= 20 && s < 45) return "sandy_clay"
    if (si >= 40) return "silt_clay"
    return "clay"
  }

  // Clay 27–40%
  if (c >= 27 && c < 40) {
    if (s >= 20 && s < 45) return "sandy_clay_loam"
    if (si >= 28 && si < 60) return "clay_loam"
    if (si >= 40) return "silt_clay_loam"
    return "clay_loam"
  }

  // Clay 20–27%
  if (c >= 20 && c < 27) {
    if (s < 20) return "silt_loam"
    if (s >= 20 && s < 45) return "loam"
    return "sandy_clay_loam"
  }

  // Clay 7–20%
  if (c >= 7 && c < 20) {
    if (s >= 43 && s < 52) return "loamy_sand"
    if (s >= 52) return "sand"
    if (si >= 50) return "silt"
    return "sandy_loam"
  }

  // Clay < 7%
  if (c < 7) {
    if (s >= 85) return "sand"
    if (s >= 43 && s < 85) return "loamy_sand"
    if (si >= 80) return "silt"
    return "sandy_loam"
  }

  return "loam"
}

/**
 * Get fertilizer recommendation for a specific soil and crop combination.
 * Calls the AI backend via /api/chat.
 *
 * @param soil  Soil data
 * @param crop  Crop name (English or Bengali)
 * @returns Bengali text with fertilizer recommendations
 */
export async function getFertilizerRecommendation(
  soil: SoilData,
  crop: string,
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `${crop} চাষের জন্য সারের পরামর্শ দিন। মাটির তথ্য: মাটির ধরন ${soil.soilType || soil.texture}, পিএইচ ${soil.ph}, নাইট্রোজেন ${soil.nitrogen}, ফসফরাস ${soil.phosphorus}, পটাশিয়াম ${soil.potassium}, জৈব কার্বন ${soil.organicCarbon}। বারিস অনুসারে সুপারিশ দিন।`,
      history: [],
      location: { lat: 0, lon: 0 }, // location is not needed for this query
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Fertilizer API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as { message: string }
  return data.message
}
