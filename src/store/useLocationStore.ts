import { create } from "zustand"
import { persist } from "zustand/middleware"
import { reverseGeocode, isInBangladesh, getLocationLabel, type ReverseGeocodeResult } from "../services/locationService"
import { GPS_OPTIONS, GPS_WATCH_OPTIONS, DEFAULT_DISTRICT_BN, DEFAULT_UPAZILA_BN } from "../lib/appConfig"

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
  // GPS coordinates
  gps: { lat: number; lon: number } | null
  // Auto-decoded location info
  district: string
  upazila: string
  village: string
  division: string
  fullAddress: string
  locationLabel: string
  // Soil cache
  soilCache: SoilData | null
  soilCachedAt: number
  // Loading states
  isLocating: boolean
  isGeocoding: boolean
  locationError: string | null
  // GPS watch ID
  watchId: number | null

  // Actions
  setGps: (gps: { lat: number; lon: number } | null) => void
  setUpazila: (upazila: string) => void
  setDistrict: (district: string) => void
  setSoilCache: (data: SoilData) => void
  requestGps: () => Promise<void>
  /** Auto-request GPS + reverse geocode on app startup */
  autoInitLocation: () => Promise<void>
  /** Start watching GPS position continuously */
  startWatching: () => void
  /** Stop watching GPS position */
  stopWatching: () => void
}

// ── Store ───────────────────────────────────────────────────────

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      gps: null,
      district: "",
      upazila: "",
      village: "",
      division: "",
      fullAddress: "",
      locationLabel: "",
      soilCache: null,
      soilCachedAt: 0,
      isLocating: false,
      isGeocoding: false,
      locationError: null,
      watchId: null,

      setGps: (gps) => set({ gps }),

      setUpazila: (upazila) => set((s) => ({
        upazila,
        locationLabel: getLocationLabel(upazila, s.district),
      })),

      setDistrict: (district) => set((s) => ({
        district,
        locationLabel: getLocationLabel(s.upazila, district),
      })),

      setSoilCache: (data) =>
        set({
          soilCache: data,
          soilCachedAt: Date.now(),
        }),

      requestGps: async () => {
        if (!navigator.geolocation) {
          set({ locationError: "Geolocation is not supported by this browser." })
          throw new Error("Geolocation is not supported by this browser.")
        }

        set({ isLocating: true, locationError: null })

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, GPS_OPTIONS)
          })

          const gps = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          }

          set({ gps, isLocating: false })

          // Auto reverse-geocode
          if (isInBangladesh(gps.lat, gps.lon)) {
            set({ isGeocoding: true })
            try {
              const geo = await reverseGeocode(gps.lat, gps.lon)
              set({
                district: geo.district,
                upazila: geo.upazila,
                village: geo.village,
                division: geo.division,
                fullAddress: geo.displayName,
                locationLabel: getLocationLabel(geo.upazila, geo.district),
                isGeocoding: false,
              })
            } catch {
              // Geocoding failed — still keep GPS, just no address
              set({
                district: DEFAULT_DISTRICT_BN,
                upazila: DEFAULT_UPAZILA_BN,
                locationLabel: getLocationLabel(DEFAULT_UPAZILA_BN, DEFAULT_DISTRICT_BN),
                isGeocoding: false,
              })
            }
          }
        } catch (error) {
          let message = "GPS লোকেশন পেতে ব্যর্থ হয়েছে।"
          const geoError = error as GeolocationPositionError
          if (geoError?.code === geoError?.PERMISSION_DENIED) {
            message = "লোকেশন অনুমতি দেওয়া হয়নি। দয়া করে ব্রাউজার সেটিংসে অনুমতি দিন।"
          } else if (geoError?.code === geoError?.POSITION_UNAVAILABLE) {
            message = "লোকেশন তথ্য পাওয়া যায়নি।"
          } else if (geoError?.code === geoError?.TIMEOUT) {
            message = "লোকেশন পেতে সময় শেষ হয়েছে। আবার চেষ্টা করুন।"
          }
          set({ locationError: message, isLocating: false })
          throw new Error(message)
        }
      },

      autoInitLocation: async () => {
        const state = get()
        // Skip if already located
        if (state.gps && state.district) return
        // Skip if already locating
        if (state.isLocating) return

        // Try to get GPS permission silently — if previously granted,
        // this will return immediately without prompting
        try {
          await state.requestGps()
        } catch {
          // Permission not yet granted or denied — silently fail
          // User can tap the GPS button later
        }
      },

      startWatching: () => {
        if (!navigator.geolocation) return
        const state = get()
        // Already watching
        if (state.watchId !== null) return

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const gps = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            }
            set({ gps })

            // Reverse geocode if district is empty or GPS moved significantly
            const currentGps = get().gps
            if (!get().district && isInBangladesh(gps.lat, gps.lon)) {
              reverseGeocode(gps.lat, gps.lon)
                .then((geo) => {
                  set({
                    district: geo.district,
                    upazila: geo.upazila,
                    village: geo.village,
                    division: geo.division,
                    fullAddress: geo.displayName,
                    locationLabel: getLocationLabel(geo.upazila, geo.district),
                  })
                })
                .catch(() => {
                  // Silent fail — keep previous location data
                })
            }
          },
          () => {
            // Watch error — ignore, keep last known position
          },
          GPS_WATCH_OPTIONS,
        )

        set({ watchId })
      },

      stopWatching: () => {
        const { watchId } = get()
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId)
          set({ watchId: null })
        }
      },
    }),
    {
      name: "krishiai-location",
      partialize: (state) => ({
        gps: state.gps,
        upazila: state.upazila,
        district: state.district,
        village: state.village,
        division: state.division,
        fullAddress: state.fullAddress,
        locationLabel: state.locationLabel,
        soilCache: state.soilCache,
        soilCachedAt: state.soilCachedAt,
      }),
    },
  ),
)
