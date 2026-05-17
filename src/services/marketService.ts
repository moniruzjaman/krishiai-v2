/**
 * Market Service — client-side wrapper for KrishiAI market price API.
 */

// ── Types ───────────────────────────────────────────────────────

export interface CommodityPrice {
  commodity: string
  bengaliName: string
  unit: string
  minPrice: number
  maxPrice: number
  avgPrice: number
  lastUpdated: string
  change: number // percentage change from previous
  trend: "up" | "down" | "stable"
}

export interface MarketData {
  district: string
  level: string
  date: string
  commodities: CommodityPrice[]
}

// ── API base ────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || ""

// ── Public functions ────────────────────────────────────────────

/**
 * Fetch market prices for a given district.
 *
 * @param district District name in Bengali or English
 * @param level    Market level (e.g. "wholesale", "retail") — defaults to "retail"
 */
export async function getMarketPrices(
  district: string,
  level: string = "retail",
): Promise<MarketData> {
  const params = new URLSearchParams({
    district,
    level,
  })

  const response = await fetch(`${API_BASE}/api/market?${params.toString()}`)

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Market API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<MarketData>
}

/**
 * Fetch price for a single commodity.
 *
 * @param commodity English commodity name (e.g. "rice", "potato")
 * @returns CommodityPrice or null if not found
 */
export async function getCommodityPrice(
  commodity: string,
): Promise<CommodityPrice | null> {
  const response = await fetch(
    `${API_BASE}/api/market/commodity?name=${encodeURIComponent(commodity)}`,
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Market API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<CommodityPrice>
}
