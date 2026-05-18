import { useQuery } from '@tanstack/react-query'
import { CalendarDays, MapPin } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import LocationSelector from '../components/LocationSelector'

interface CropEntry {
  key: string
  nameBn: string
  crop: string
  plantingStart: string
  plantingEnd: string
  harvestStart: string
  harvestEnd: string
  notes: string
}

const CROP_ICONS: Record<string, string> = {
  boro_rice: '🌾', aman_rice: '🌾', aus_rice: '🌾',
  wheat: '🌿', jute: '🪢', potato: '🥔',
  mustard: '🌻', maize: '🌽'
}

const SEASON_COLORS: Record<string, string> = {
  'রবি মৌসুম': 'bg-amber-100 text-amber-800 border-amber-200',
  'খরিফ মৌসুম': 'bg-green-100 text-green-800 border-green-200',
  'প্রাক-খরিফ': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'রবি প্রস্তুতি': 'bg-orange-100 text-orange-800 border-orange-200',
}

export default function Calendar() {
  const { gps, upazila } = useAppStore()
  const lat = gps?.lat ?? 25.8041
  const lon = gps?.lon ?? 89.6393

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', lat, lon],
    queryFn: () => fetch(`/api/calendar?lat=${lat}&lon=${lon}&crop=all`).then(r => r.json()),
    staleTime: 30 * 24 * 60 * 60 * 1000,
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
          <CalendarDays size={22} className="text-violet-600" /> ফসল ক্যালেন্ডার
        </h1>
        <LocationSelector />
      </div>

      {/* Current season banner */}
      {data && (
        <div className={`rounded-xl p-4 border ${SEASON_COLORS[data.currentSeason] || 'bg-green-100 text-green-800 border-green-200'}`}>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-medium opacity-70 mb-1">
                <MapPin size={12} className="inline mr-1" />{upazila} — {data.currentMonth}
              </p>
              <p className="text-lg font-bold">{data.currentSeason}</p>
              <p className="text-sm mt-1 opacity-80">এই মৌসুমে উপযুক্ত ফসল:</p>
              <p className="font-semibold">{data.recommendedCrops?.join(' • ')}</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {/* Crop cards */}
      {data?.calendar && (
        <div className="space-y-3">
          <h2 className="section-title">ফসলের রোপণ ও কর্তন সূচি</h2>
          {data.calendar.map((crop: CropEntry) => (
            <div key={crop.key} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{CROP_ICONS[crop.key] || '🌱'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-stone-800">{crop.nameBn}</h3>
                  <p className="text-xs text-stone-500 mb-3">{crop.crop}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-green-700 mb-1">🌱 রোপণ সময়</p>
                      <p className="text-sm font-bold text-green-900">
                        {crop.plantingStart} – {crop.plantingEnd}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-amber-700 mb-1">🌾 কর্তন সময়</p>
                      <p className="text-sm font-bold text-amber-900">
                        {crop.harvestStart} – {crop.harvestEnd}
                      </p>
                    </div>
                  </div>

                  {crop.notes && (
                    <p className="text-xs text-stone-600 mt-2.5 leading-relaxed border-t border-stone-100 pt-2">
                      💡 {crop.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-stone-400">
        তথ্যসূত্র: DAE বাংলাদেশ • BARI • BRRI • {data?.source?.includes('GEMS') ? 'GEMS Crop Calendar (UMN)' : ''}
      </p>
    </div>
  )
}
