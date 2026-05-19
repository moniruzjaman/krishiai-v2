/**
 * Weather Service — client-side wrapper for KrishiAI weather API.
 */

import { toBengaliNumber } from "../lib/bengali"

// ── Types ───────────────────────────────────────────────────────

export interface WeatherData {
  latitude: number
  longitude: number
  timezone: string
  current: {
    temperature2m: number
    relativeHumidity2m: number
    apparentTemperature: number
    weatherCode: number
    windSpeed10m: number
    windDirection10m: number
    precipitation: number
    surfacePressure: number
  }
  daily: {
    date: string[]
    weatherCode: number[]
    temperature2mMax: number[]
    temperature2mMin: number[]
    precipitationSum: number[]
    precipitationProbabilityMax: number[]
    windSpeed10mMax: number[]
    et0Evapotranspiration: number[]
  }
  hourly?: {
    time: string[]
    temperature2m: number[]
    relativeHumidity2m: number[]
    precipitation: number[]
    soilMoisture0To1cm?: number[]
    soilMoisture1To3cm?: number[]
    soilMoisture3To9cm?: number[]
  }
}

// ── API base ────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || ""

// ── Public functions ────────────────────────────────────────────

/**
 * Fetch weather data for a given latitude and longitude.
 */
export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(
    `${API_BASE}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Weather API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<WeatherData>
}

/**
 * Generate an agricultural advisory in Bengali based on weather data.
 * Covers: ET₀, soil moisture, precipitation, temperature, wind.
 */
export function getAgAdvisory(weather: WeatherData): string {
  const advisories: string[] = []
  const current = weather.current
  const today = weather.daily

  // Take first day from daily forecast for today's values
  const todayET0 = today.et0Evapotranspiration[0] ?? 0
  const todayPrecip = today.precipitationSum[0] ?? 0
  const todayTempMax = today.temperature2mMax[0] ?? 0
  const todayTempMin = today.temperature2mMin[0] ?? 0
  const todayWindMax = today.windSpeed10mMax[0] ?? 0
  const precipProb = today.precipitationProbabilityMax[0] ?? 0

  // ── ET₀ based advisory ─────────────────────────────────
  if (todayET0 > 6) {
    advisories.push(
      `বাষ্পীভবন হার অত্যন্ত বেশি (${toBengaliNumber(parseFloat(todayET0.toFixed(1)))} মিমি/দিন)। সেচের পরিমাণ বাড়ান এবং শস্যে পানির চাপ এড়াতে সকালে সেচ দিন।`,
    )
  } else if (todayET0 > 4) {
    advisories.push(
      `বাষ্পীভবন হার মাঝারি (${toBengaliNumber(parseFloat(todayET0.toFixed(1)))} মিমি/দিন)। নিয়মিত সেচ দিন এবং মালচিং করুন।`,
    )
  }

  // ── Precipitation advisory ──────────────────────────────
  if (todayPrecip > 50) {
    advisories.push(
      "ভারী বৃষ্টির সম্ভাবনা রয়েছে। ফসলের ক্ষতি এড়াতে নিষ্কাশন ব্যবস্থা নিশ্চিত করুন এবং কীটনাশক স্প্রে স্থগিত করুন।",
    )
  } else if (todayPrecip > 20) {
    advisories.push(
      "মাঝারি বৃষ্টির সম্ভাবনা। সার প্রয়োগ বৃষ্টির পরে করুন এবং খোলা শস্যের আশ্রয় ব্যবস্থা করুন।",
    )
  } else if (precipProb > 70 && todayPrecip < 5) {
    advisories.push(
      `বৃষ্টির সম্ভাবনা ${toBengaliNumber(precipProb)}%। সেচের পরিকল্পনা সামঞ্জস্য করুন।`,
    )
  } else if (todayPrecip < 2 && todayET0 > 3) {
    advisories.push(
      "শুষ্ক আবহাওয়া। সেচ দিন এবং মাটিতে আর্দ্রতা ধরে রাখতে জৈব মালচ ব্যবহার করুন।",
    )
  }

  // ── Temperature advisory ────────────────────────────────
  if (todayTempMax > 38) {
    advisories.push(
      `সর্বোচ্চ তাপমাত্রা ${toBengaliNumber(todayTempMax)}°C হতে পারে। তাপ চাপ কমাতে ছায়াযুক্ত আশ্রয় ব্যবস্থা করুন এবং পশুদের প্রচুর পানি দিন।`,
    )
  }
  if (todayTempMin < 10) {
    advisories.push(
      `ন্যূনতম তাপমাত্রা ${toBengaliNumber(todayTempMin)}°C নেমে যেতে পারে। শীতকালীন শস্য ও চারাগাছ রক্ষায় আবরণ ব্যবহার করুন।`,
    )
  }

  // ── Humidity advisory ───────────────────────────────────
  if (current.relativeHumidity2m > 85) {
    advisories.push(
      "আর্দ্রতা অত্যন্ত বেশি। ছত্রাকজনিত রোগের ঝুঁকি বেড়েছে — প্রতিরোধক স্প্রে বিবেচনা করুন এবং গাছের ফাঁকা রাখুন।",
    )
  }

  // ── Wind advisory ───────────────────────────────────────
  if (todayWindMax > 40) {
    advisories.push(
      `বাতাসের গতি বেশি (${toBengaliNumber(todayWindMax)} কিমি/ঘণ্টা)। লতানে ফসল ও গাছপালা সুরক্ষিত রাখুন, স্প্রে প্রয়োগ স্থগিত করুন।`,
    )
  }

  // ── Soil moisture from hourly data ─────────────────────
  if (weather.hourly?.soilMoisture0To1cm) {
    const avgSoilMoisture =
      weather.hourly.soilMoisture0To1cm.reduce((a, b) => a + b, 0) /
      weather.hourly.soilMoisture0To1cm.length

    if (avgSoilMoisture < 0.15) {
      advisories.push(
        "মাটির উপরিভাগে আর্দ্রতা কম। অবিলম্বে হালকা সেচ দিন এবং মালচিং করুন।",
      )
    } else if (avgSoilMoisture > 0.4) {
      advisories.push(
        "মাটির আর্দ্রতা বেশি। অতিরিক্ত পানি নিষ্কাশন নিশ্চিত করুন এবং শিকড় পচা রোগের প্রতি সতর্ক থাকুন।",
      )
    }
  }

  // Fallback if no advisory generated
  if (advisories.length === 0) {
    advisories.push(
      "আজকের আবহাওয়া স্বাভাবিক। নিয়মিত কৃষি কাজ চালিয়ে যান এবং আবহাওয়া পূর্বাভাস নজরে রাখুন।",
    )
  }

  return advisories.join("\n\n")
}
