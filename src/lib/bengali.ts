/**
 * Bengali number, date, and text formatting utilities for KrishiAI.
 */

// ── Bengali digits ──────────────────────────────────────────────
const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]

/**
 * Convert an Arabic numeral number to its Bengali digit string.
 * Handles negative numbers and decimals.
 *
 * @example toBengaliNumber(17) → "১৭"
 * @example toBengaliNumber(-3.5) → "-৩.৫"
 */
export function toBengaliNumber(num: number): string {
  const sign = num < 0 ? "-" : ""
  const abs = Math.abs(num).toString()
  const converted = abs
    .split("")
    .map((ch) => {
      if (ch >= "0" && ch <= "9") {
        return BENGALI_DIGITS[parseInt(ch, 10)]
      }
      return ch // keep decimal point etc.
    })
    .join("")
  return sign + converted
}

// ── Bengali month & day names ───────────────────────────────────
export const BENGALI_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const

export const BENGALI_DAYS = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
] as const

/**
 * Format a JS Date into a Bengali date string: "১৭ মে ২০২৬"
 */
export function toBengaliDate(date: Date): string {
  const day = toBengaliNumber(date.getDate())
  const month = BENGALI_MONTHS[date.getMonth()]
  const year = toBengaliNumber(date.getFullYear())
  return `${day} ${month} ${year}`
}

/**
 * Format a JS Date into a full Bengali date with day name:
 * "শুক্রবার, ১৭ মে ২০২৬"
 */
export function toBengaliFullDate(date: Date): string {
  const dayName = BENGALI_DAYS[date.getDay()]
  return `${dayName}, ${toBengaliDate(date)}`
}

// ── Relative time ───────────────────────────────────────────────

interface RelativeUnit {
  singular: string
  plural: string
}

const RELATIVE_UNITS: Record<string, RelativeUnit> = {
  seconds: { singular: "সেকেন্ড", plural: "সেকেন্ড" },
  minutes: { singular: "মিনিট", plural: "মিনিট" },
  hours: { singular: "ঘণ্টা", plural: "ঘণ্টা" },
  days: { singular: "দিন", plural: "দিন" },
  weeks: { singular: "সপ্তাহ", plural: "সপ্তাহ" },
  months: { singular: "মাস", plural: "মাস" },
  years: { singular: "বছর", plural: "বছর" },
}

/**
 * Format a relative time string in Bengali.
 *
 * @example formatRelativeTime(3 days ago) → "৩ দিন আগে"
 * @example formatRelativeTime(2 hours from now) → "২ ঘণ্টা পরে"
 */
export function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const target = date.getTime()
  const diffMs = target - now
  const isFuture = diffMs > 0
  const absDiff = Math.abs(diffMs)

  let value: number
  let unitKey: string

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) {
    value = years
    unitKey = "years"
  } else if (months > 0) {
    value = months
    unitKey = "months"
  } else if (weeks > 0) {
    value = weeks
    unitKey = "weeks"
  } else if (days > 0) {
    value = days
    unitKey = "days"
  } else if (hours > 0) {
    value = hours
    unitKey = "hours"
  } else if (minutes > 0) {
    value = minutes
    unitKey = "minutes"
  } else {
    value = seconds
    unitKey = "seconds"
  }

  const unit = RELATIVE_UNITS[unitKey]
  const bengaliValue = toBengaliNumber(value)
  const direction = isFuture ? "পরে" : "আগে"

  return `${bengaliValue} ${unit.plural} ${direction}`
}

// ── Commodity name mapping ──────────────────────────────────────

const COMMODITY_BENGALI: Record<string, string> = {
  rice: "ধান",
  wheat: "গম",
  jute: "পাট",
  potato: "আলু",
  onion: "পেঁয়াজ",
  garlic: "রসুন",
  ginger: "আদা",
  turmeric: "হলুদ",
  chili: "মরিচ",
  tomato: "টমেটো",
  brinjal: "বেগুন",
  cauliflower: "ফুলকপি",
  cabbage: "বাঁধাকপি",
  okra: "ঢেঁড়স",
  radish: "মূলা",
  banana: "কলা",
  mango: "আম",
  papaya: "পেঁপে",
  mustard: "সরিষা",
  lentil: "মসুর ডাল",
  chickpea: "ছোলা",
}

/**
 * Get the Bengali commodity name for a given English name.
 * Returns the English name unchanged if no mapping exists.
 */
export function bengaliCommodityName(english: string): string {
  const key = english.toLowerCase().trim()
  return COMMODITY_BENGALI[key] ?? english
}
