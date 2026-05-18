import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GPS { lat: number; lon: number }

interface AppState {
  // Location
  gps: GPS | null
  upazila: string
  district: string
  setGPS: (gps: GPS) => void
  setUpazila: (u: string) => void
  setDistrict: (d: string) => void

  // Settings
  language: 'bn' | 'en'
  setLanguage: (l: 'bn' | 'en') => void

  // Soil cache (GPS-based, slow-changing)
  soilCache: Record<string, unknown> | null
  soilCachedAt: number
  setSoilCache: (data: Record<string, unknown>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      gps: null,
      upazila: 'কুড়িগ্রাম সদর',
      district: 'কুড়িগ্রাম',
      setGPS: (gps) => set({ gps }),
      setUpazila: (upazila) => set({ upazila }),
      setDistrict: (district) => set({ district }),

      language: 'bn',
      setLanguage: (language) => set({ language }),

      soilCache: null,
      soilCachedAt: 0,
      setSoilCache: (data) => set({ soilCache: data, soilCachedAt: Date.now() }),
    }),
    { name: 'krishiai-store' }
  )
)

// Kurigram upazilas for the location selector
export const KURIGRAM_UPAZILAS = [
  'কুড়িগ্রাম সদর', 'উলিপুর', 'চিলমারী', 'রৌমারী', 'রাজারহাট',
  'নাগেশ্বরী', 'ভূরুঙ্গামারী', 'ফুলবাড়ী', 'রাজিবপুর'
]

export const ALL_DISTRICTS = [
  'কুড়িগ্রাম', 'রংপুর', 'লালমনিরহাট', 'গাইবান্ধা', 'নীলফামারী',
  'ঠাকুরগাঁও', 'পঞ্চগড়', 'দিনাজপুর'
]
