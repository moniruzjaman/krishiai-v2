/**
 * Application-wide constants for KrishiAI v2.
 */

// ── Kurigram Upazilas ───────────────────────────────────────────
export const KURIGRAM_UPAZILAS: string[] = [
  "কুড়িগ্রাম সদর",
  "নাগেশ্বরী",
  "ভুরুঙ্গামারী",
  "ফুলবাড়ী",
  "রাজারহাট",
  "উলিপুর",
  "চিলমারী",
  "রৌমারী",
]

// ── Commodity Map (English → { bengali, unit }) ─────────────────
export interface CommodityInfo {
  bengali: string
  unit: string
}

export const COMMODITY_MAP: Record<string, CommodityInfo> = {
  rice: { bengali: "ধান", unit: "কেজি" },
  wheat: { bengali: "গম", unit: "কেজি" },
  jute: { bengali: "পাট", unit: "কেজি" },
  potato: { bengali: "আলু", unit: "কেজি" },
  onion: { bengali: "পেঁয়াজ", unit: "কেজি" },
  garlic: { bengali: "রসুন", unit: "কেজি" },
  ginger: { bengali: "আদা", unit: "কেজি" },
  turmeric: { bengali: "হলুদ", unit: "কেজি" },
  chili: { bengali: "মরিচ", unit: "কেজি" },
  tomato: { bengali: "টমেটো", unit: "কেজি" },
  brinjal: { bengali: "বেগুন", unit: "কেজি" },
  cauliflower: { bengali: "ফুলকপি", unit: "কেজি" },
  cabbage: { bengali: "বাঁধাকপি", unit: "কেজি" },
  okra: { bengali: "ঢেঁড়স", unit: "কেজি" },
  radish: { bengali: "মূলা", unit: "কেজি" },
  banana: { bengali: "কলা", unit: "ডজন" },
  mango: { bengali: "আম", unit: "কেজি" },
  papaya: { bengali: "পেঁপে", unit: "কেজি" },
  mustard: { bengali: "সরিষা", unit: "কেজি" },
  lentil: { bengali: "মসুর ডাল", unit: "কেজি" },
  chickpea: { bengali: "ছোলা", unit: "কেজি" },
}

// ── Crop List ───────────────────────────────────────────────────
export interface CropInfo {
  id: string
  name: string
  bengaliName: string
  icon: string
  seasons: string[]
}

export const CROP_LIST: CropInfo[] = [
  { id: "rice_aman", name: "Aman Rice", bengaliName: "আমন ধান", icon: "🌾", seasons: ["খরিফ-১", "খরিফ-২"] },
  { id: "rice_aus", name: "Aus Rice", bengaliName: "অাউস ধান", icon: "🌾", seasons: ["খরিফ-১"] },
  { id: "rice_boro", name: "Boro Rice", bengaliName: "বোরো ধান", icon: "🌾", seasons: ["রবি"] },
  { id: "wheat", name: "Wheat", bengaliName: "গম", icon: "🌿", seasons: ["রবি"] },
  { id: "jute", name: "Jute", bengaliName: "পাট", icon: "🪢", seasons: ["খরিফ-১"] },
  { id: "potato", name: "Potato", bengaliName: "আলু", icon: "🥔", seasons: ["রবি"] },
  { id: "onion", name: "Onion", bengaliName: "পেঁয়াজ", icon: "🧅", seasons: ["রবি"] },
  { id: "garlic", name: "Garlic", bengaliName: "রসুন", icon: "🧄", seasons: ["রবি"] },
  { id: "ginger", name: "Ginger", bengaliName: "আদা", icon: "🫚", seasons: ["রবি"] },
  { id: "turmeric", name: "Turmeric", bengaliName: "হলুদ", icon: "🟡", seasons: ["রবি"] },
  { id: "chili", name: "Chili", bengaliName: "মরিচ", icon: "🌶️", seasons: ["খরিফ-১", "রবি"] },
  { id: "tomato", name: "Tomato", bengaliName: "টমেটো", icon: "🍅", seasons: ["রবি"] },
  { id: "brinjal", name: "Brinjal", bengaliName: "বেগুন", icon: "🍆", seasons: ["খরিফ-১", "রবি"] },
  { id: "cauliflower", name: "Cauliflower", bengaliName: "ফুলকপি", icon: "🥦", seasons: ["রবি"] },
  { id: "cabbage", name: "Cabbage", bengaliName: "বাঁধাকপি", icon: "🥬", seasons: ["রবি"] },
  { id: "okra", name: "Okra", bengaliName: "ঢেঁড়স", icon: "🟢", seasons: ["খরিফ-১"] },
  { id: "radish", name: "Radish", bengaliName: "মূলা", icon: "🔴", seasons: ["রবি"] },
  { id: "banana", name: "Banana", bengaliName: "কলা", icon: "🍌", seasons: ["খরিফ-১", "খরিফ-২"] },
  { id: "mango", name: "Mango", bengaliName: "আম", icon: "🥭", seasons: ["খরিফ-১"] },
  { id: "papaya", name: "Papaya", bengaliName: "পেঁপে", icon: "🍈", seasons: ["খরিফ-১", "খরিফ-২"] },
  { id: "mustard", name: "Mustard", bengaliName: "সরিষা", icon: "🌼", seasons: ["রবি"] },
  { id: "lentil", name: "Lentil", bengaliName: "মসুর ডাল", icon: "🫘", seasons: ["রবি"] },
  { id: "chickpea", name: "Chickpea", bengaliName: "ছোলা", icon: "🟤", seasons: ["রবি"] },
  { id: "maize", name: "Maize", bengaliName: "ভুট্টা", icon: "🌽", seasons: ["খরিফ-১", "রবি"] },
  { id: "sesame", name: "Sesame", bengaliName: "তিল", icon: "🟡", seasons: ["খরিফ-১"] },
]

// ── WMO Weather Code → Bengali Description ─────────────────────
export const WEATHER_CODES: Record<number, { bengali: string; icon: string }> = {
  0: { bengali: "পরিষ্কার আকাশ", icon: "☀️" },
  1: { bengali: "মূলত পরিষ্কার", icon: "🌤️" },
  2: { bengali: "আংশিক মেঘলা", icon: "⛅" },
  3: { bengali: "মেঘলা", icon: "☁️" },
  45: { bengali: "কুয়াশা", icon: "🌫️" },
  48: { bengali: "তুষার কুয়াশা", icon: "🌫️" },
  51: { bengali: "হালকা শিশিরবিন্দু", icon: "💧" },
  53: { bengali: "মাঝারি শিশিরবিন্দু", icon: "💧" },
  55: { bengali: "ঘন শিশিরবিন্দু", icon: "💧" },
  56: { bengali: "হালকা হিমায়িত শিশিরবিন্দু", icon: "🧊" },
  57: { bengali: "ঘন হিমায়িত শিশিরবিন্দু", icon: "🧊" },
  61: { bengali: "হালকা বৃষ্টি", icon: "🌦️" },
  63: { bengali: "মাঝারি বৃষ্টি", icon: "🌧️" },
  65: { bengali: "ভারী বৃষ্টি", icon: "🌧️" },
  66: { bengali: "হালকা হিমবৃষ্টি", icon: "🌨️" },
  67: { bengali: "ভারী হিমবৃষ্টি", icon: "🌨️" },
  71: { bengali: "হালকা তুষারপাত", icon: "❄️" },
  73: { bengali: "মাঝারি তুষারপাত", icon: "❄️" },
  75: { bengali: "ভারী তুষারপাত", icon: "❄️" },
  77: { bengali: "তুষারকণা", icon: "❄️" },
  80: { bengali: "হালকা ঝরে বৃষ্টি", icon: "🌦️" },
  81: { bengali: "মাঝারি ঝরে বৃষ্টি", icon: "🌧️" },
  82: { bengali: "প্রবল বৃষ্টিপাত", icon: "⛈️" },
  85: { bengali: "হালকা তুষার ঝরে পড়া", icon: "🌨️" },
  86: { bengali: "ভারী তুষার ঝরে পড়া", icon: "🌨️" },
  95: { bengali: "বজ্রপাতসহ ঝড়", icon: "⛈️" },
  96: { bengali: "হালকা শিলাসহ বজ্রঝড়", icon: "⛈️" },
  99: { bengali: "ভারী শিলাসহ বজ্রঝড়", icon: "⛈️" },
}

// ── Soil Types ──────────────────────────────────────────────────
export interface SoilTypeInfo {
  bengali: string
  description: string
}

export const SOIL_TYPES: Record<string, SoilTypeInfo> = {
  clay: {
    bengali: "এঁটেল মাটি",
    description: "ভারী মাটি, পানি ধারণ ক্ষমতা বেশি, নিষ্কাশন দুর্বল",
  },
  sandy_clay: {
    bengali: "বেলে এঁটেল মাটি",
    description: "মাঝারি ভারী মাটি, পানি নিষ্কাশন মাঝারি",
  },
  sandy_clay_loam: {
    bengali: "বেলে এঁটেল দোআঁশ মাটি",
    description: "মাঝারি মাটি, চাষাবাদের জন্য উপযুক্ত",
  },
  clay_loam: {
    bengali: "এঁটেল দোআঁশ মাটি",
    description: "মাঝারি ভারী মাটি, ধান চাষের জন্য উত্তম",
  },
  loam: {
    bengali: "দোআঁশ মাটি",
    description: "সর্বাপেক্ষা উর্বর, সব ধরনের ফসলের জন্য আদর্শ",
  },
  sandy_loam: {
    bengali: "বেলে দোআঁশ মাটি",
    description: "হালকা মাটি, সেচের প্রয়োজন বেশি, শিকড় বিকাশে ভালো",
  },
  loamy_sand: {
    bengali: "দোআঁশ বেলে মাটি",
    description: "অত্যন্ত হালকা মাটি, দ্রুত পানি নিষ্কাশন",
  },
  sand: {
    bengali: "বেলে মাটি",
    description: "অত্যন্ত হালকা মাটি, পানি ধারণ ক্ষমতা কম",
  },
  silt: {
    bengali: "পলি মাটি",
    description: "মাঝারি মাটি, নদীর পলিমাটি, উর্বরতা মাঝারি",
  },
  silt_loam: {
    bengali: "পলি দোআঁশ মাটি",
    description: "উর্বর মাটি, চাষাবাদের জন্য উপযুক্ত",
  },
  silt_clay: {
    bengali: "পলি এঁটেল মাটি",
    description: "ভারী মাটি, পানি ধারণ ক্ষমতা বেশি",
  },
  silt_clay_loam: {
    bengali: "পলি এঁটেল দোআঁশ মাটি",
    description: "মাঝারি ভারী মাটি, ধান চাষের জন্য উপযুক্ত",
  },
}

// ── Bangladesh Districts (Rangpur Division + others) ────────────
export const BD_DISTRICTS: string[] = [
  // Rangpur Division
  "রংপুর",
  "দিনাজপুর",
  "কুড়িগ্রাম",
  "গাইবান্ধা",
  "লালমনিরহাট",
  "নীলফামারী",
  "পঞ্চগড়",
  "ঠাকুরগাঁও",
  // Dhaka Division
  "ঢাকা",
  "ফরিদপুর",
  "গাজীপুর",
  "গোপালগঞ্জ",
  "কিশোরগঞ্জ",
  "মাদারীপুর",
  "মানিকগঞ্জ",
  "মুন্সিগঞ্জ",
  "নারায়ণগঞ্জ",
  "নরসিংদী",
  "রাজবাড়ী",
  "শরীয়তপুর",
  "টাঙ্গাইল",
  // Chittagong Division
  "চট্টগ্রাম",
  "কক্সবাজার",
  "কুমিল্লা",
  "ফেনী",
  "খাগড়াছড়ি",
  "লক্ষ্মীপুর",
  "নোয়াখালী",
  "রাঙ্গামাটি",
  "ব্রাহ্মণবাড়িয়া",
  "চাঁদপুর",
  "বান্দরবান",
  // Rajshahi Division
  "রাজশাহী",
  "নাটোর",
  "নওগাঁ",
  "চাঁপাইনবাবগঞ্জ",
  "পাবনা",
  "সিরাজগঞ্জ",
  "বগুড়া",
  "জয়পুরহাট",
  // Khulna Division
  "খুলনা",
  "যশোর",
  "সাতক্ষীরা",
  "মেহেরপুর",
  "নড়াইল",
  "চুয়াডাঙ্গা",
  "কুষ্টিয়া",
  "বাগেরহাট",
  "ঝিনাইদহ",
  // Barisal Division
  "বরিশাল",
  "পটুয়াখালী",
  "ভোলা",
  "পিরোজপুর",
  "বরগুনা",
  "ঝালকাঠি",
  // Sylhet Division
  "সিলেট",
  "মৌলভীবাজার",
  "হবিগঞ্জ",
  "সুনামগঞ্জ",
  // Mymensingh Division
  "ময়মনসিংহ",
  "জামালপুর",
  "শেরপুর",
  "নেত্রকোণা",
]

// ── Seasons ─────────────────────────────────────────────────────
export const SEASONS = {
  kharif1: { bengali: "খরিফ-১", english: "Kharif-1", months: "মার্চ - জুন" },
  kharif2: { bengali: "খরিফ-২", english: "Kharif-2", months: "জুলাই - অক্টোবর" },
  rabi: { bengali: "রবি", english: "Rabi", months: "নভেম্বর - ফেব্রুয়ারি" },
} as const
