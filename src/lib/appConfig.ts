/**
 * KrishiAI v2 — Centralized Application Configuration
 *
 * All previously hard-coded values are collected here with clear
 * placeholder names so they can be changed in one place for future
 * enhancement, localization, or multi-region deployment.
 *
 * ─────────────────────────────────────────────────────────────────
 * IMPORTANT: Every free API used by this app is listed with its
 *            terms.  No paid API keys are required for core features.
 * ─────────────────────────────────────────────────────────────────
 */

// ── App Identity ────────────────────────────────────────────────
export const APP_NAME_BN = "কৃষি AI"
export const APP_NAME_EN = "KrishiAI"
export const APP_VERSION = "2.0.0"
export const APP_TAGLINE_BN = "বাংলাদেশ কৃষকদের জন্য AI চালিত পরামর্শ"
export const APP_TAGLINE_EN = "AI-powered agricultural advisory for Bangladesh farmers"

// ── Default Location (Kurigram Sadar, Bangladesh) ───────────────
// Used when GPS is unavailable or not yet granted
export const DEFAULT_LAT = 25.8056
export const DEFAULT_LON = 89.6902
export const DEFAULT_DISTRICT_BN = "কুড়িগ্রাম"
export const DEFAULT_DISTRICT_EN = "Kurigram"
export const DEFAULT_UPAZILA_BN = "কুড়িগ্রাম সদর"
export const DEFAULT_UPAZILA_EN = "Kurigram Sadar"

// ── GPS Settings ────────────────────────────────────────────────
export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,           // 15 seconds
  maximumAge: 300_000,      // 5 minutes cached position
}

export const GPS_WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000,           // 30 seconds for continuous watch
  maximumAge: 60_000,       // 1 minute for watch updates
}

// ── Reverse Geocoding (Nominatim — FREE, no API key) ────────────
// https://nominatim.openstreetmap.org/ — Usage policy: 1 req/sec, include User-Agent
export const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse"
export const NOMINATIM_USER_AGENT = "KrishiAI-v2/2.0 (https://krishiai-v2.vercel.app)"
export const NOMINATIM_RATE_LIMIT_MS = 1100  // Nominatim requires max 1 req/sec

// ── Bangladesh Geo Boundaries ───────────────────────────────────
export const BD_LAT_MIN = 20.59
export const BD_LAT_MAX = 26.63
export const BD_LON_MIN = 88.03
export const BD_LON_MAX = 92.67
export const BD_TIMEZONE = "Asia/Dhaka"

// ── Map Defaults (Leaflet / OpenStreetMap — FREE) ───────────────
export const MAP_DEFAULT_ZOOM = 12
export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// ── Weather (Open-Meteo — FREE, no API key) ─────────────────────
// https://open-meteo.com/ — Free for non-commercial use
export const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
export const WEATHER_STALE_MINUTES = 10

// ── Soil (SoilGrids / ISRIC — FREE, no API key) ────────────────
export const SOILGRIDS_BASE_URL = "https://rest.soilgrids.org/soilgrids/v2.0"
export const SOIL_CACHE_DAYS = 7

// ── Market Prices ───────────────────────────────────────────────
// DAM (Department of Agricultural Marketing, BD) — FREE government data
export const MARKET_DEFAULT_DISTRICT = DEFAULT_DISTRICT_BN
export const MARKET_STALE_MINUTES = 30

// ── AI Providers (all have FREE tiers) ──────────────────────────
// Gemini 2.0 Flash — Free tier: 15 RPM, 1M tokens/min
// Groq — Free tier: 30 RPM, 14400 requests/day
// HuggingFace Inference API — Free tier available
export const AI_FALLBACK_CHAIN = ["gemini", "groq", "rule-based"] as const
export const AI_TIMEOUT_MS = 30000

// ── Disease Detection ───────────────────────────────────────────
// HuggingFace Inference API — FREE tier (rate-limited)
// PlantNet — requires API key (optional, fallback if missing)
// Gemini Vision — uses same free Gemini key
export const DISEASE_FALLBACK_CHAIN = ["huggingface", "plantnet", "gemini-vision", "rule-based"] as const

// ── Crop Calendar ───────────────────────────────────────────────
export const CROP_CALENDAR_SEASONS = {
  kharif1: { bengali: "খরিফ-১", english: "Kharif-1", months: "মার্চ - জুন", startMonth: 2, endMonth: 5 },
  kharif2: { bengali: "খরিফ-২", english: "Kharif-2", months: "জুলাই - অক্টোবর", startMonth: 6, endMonth: 9 },
  rabi:    { bengali: "রবি", english: "Rabi", months: "নভেম্বর - ফেব্রুয়ারি", startMonth: 10, endMonth: 1 },
} as const

// ── Supabase Auto-Init ──────────────────────────────────────────
// The app auto-creates its DB schema on first authenticated session.
// No admin intervention needed.
export const DB_AUTO_INIT_KEY = "krishiai-db-initialized"

// ── Pest/Disease Risk Thresholds ────────────────────────────────
export const PEST_RISK_THRESHOLDS = {
  humidityHigh: 85,        // % — fungal risk triggers
  humidityMedium: 70,      // % — moderate fungal risk
  tempHigh: 35,            // °C — heat stress / pest surge
  tempLow: 10,             // °C — cold damage risk
  windHigh: 40,            // km/h — spray not recommended
  rainHeavy: 10,           // mm — spray wash-off risk
  rainProbHigh: 60,        // % — postpone spray
  soilMoistureLow: 0.2,    // fraction — drought stress
  soilMoistureHigh: 0.4,   // fraction — root rot risk
} as const

// ── Spray Advice Rules ──────────────────────────────────────────
export const SPRAY_ADVICE = {
  windTooHigh: {
    bn: "বাতাস বেশি — স্প্রে করবেন না, কীটনাশক উড়ে যাবে।",
    en: "Wind too high — do not spray, pesticide will drift.",
  },
  rainExpected: {
    bn: "বৃষ্টির সম্ভাবনা — স্প্রে স্থগিত করুন, ধুয়ে যাবে।",
    en: "Rain expected — postpone spray, will wash off.",
  },
  bestTime: {
    bn: "সকাল ৬-৯টা বা বিকাল ৪-৬টা স্প্রে করুন।",
    en: "Spray between 6-9 AM or 4-6 PM for best results.",
  },
  fungalRisk: {
    bn: "ছত্রাকের ঝুঁকি — প্রতিরোধক ছত্রাকনাশক বিবেচনা করুন।",
    en: "Fungal risk — consider preventive fungicide spray.",
  },
  heatStress: {
    bn: "তাপ চাপ বেশি — সেচ দিন, স্প্রে সন্ধ্যায় করুন।",
    en: "Heat stress — irrigate now, spray in the evening.",
  },
} as const
