import { create } from "zustand"
import { persist } from "zustand/middleware"

// ── Types ───────────────────────────────────────────────────────

export interface SoilData {
  clay: number
  sand: number
  silt: number
  ph: number
  organicCarbon: number
  nitrogen: number
  phosphorus: number
  potassium: number
  soilType: string
  texture: string
}

interface LocationState {
  gps: { lat: number; lon: number } | null
  upazila: string
  district: string
  soilCache: SoilData | null
  soilCachedAt: number

  setGps: (gps: { lat: number; lon: number } | null) => void
  setUpazila: (upazila: string) => void
  setDistrict: (district: string) => void
  setSoilCache: (data: SoilData) => void
  requestGps: () => Promise<void>
}

// ── Store ───────────────────────────────────────────────────────

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      gps: null,
      upazila: "",
      district: "",
      soilCache: null,
      soilCachedAt: 0,

      setGps: (gps) => set({ gps }),

      setUpazila: (upazila) => set({ upazila }),

      setDistrict: (district) => set({ district }),

      setSoilCache: (data) =>
        set({
          soilCache: data,
          soilCachedAt: Date.now(),
        }),

      requestGps: async () => {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by this browser.")
        }

        return new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              set({
                gps: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude,
                },
              })
              resolve()
            },
            (error) => {
              let message = "GPS লোকেশন পেতে ব্যর্থ হয়েছে।"
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  message = "লোকেশন অনুমতি দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংসে অনুমতি দিন।"
                  break
                case error.POSITION_UNAVAILABLE:
                  message = "লোকেশন তথ্য পাওয়া যায়নি।"
                  break
                case error.TIMEOUT:
                  message = "লোকেশন পেতে সময় শেষ হয়েছে। আবার চেষ্টা করুন।"
                  break
              }
              reject(new Error(message))
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000, // 5 minutes cache
            },
          )
        })
      },
    }),
    {
      name: "krishiai-location",
      partialize: (state) => ({
        gps: state.gps,
        upazila: state.upazila,
        district: state.district,
        soilCache: state.soilCache,
        soilCachedAt: state.soilCachedAt,
      }),
    },
  ),
)
