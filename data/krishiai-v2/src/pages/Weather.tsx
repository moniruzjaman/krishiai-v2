import { useQuery } from '@tanstack/react-query'
import { Cloud, Droplets, Thermometer, Wind, Sprout, Sun, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import LocationSelector from '../components/LocationSelector'

const WEATHER_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 51: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '⛈️', 80: '🌩️', 95: '⛈️'
}

function getIcon(code: number) {
  const keys = Object.keys(WEATHER_ICONS).map(Number).sort((a, b) => b - a)
  for (const k of keys) { if (code >= k) return WEATHER_ICONS[k] }
  return '🌤️'
}

const BANGLA_DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']

export default function Weather() {
  const { gps, upazila } = useAppStore()
  const lat = gps?.lat ?? 25.8041
  const lon = gps?.lon ?? 89.6393

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetch(`/api/weather?lat=${lat}&lon=${lon}`).then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  })

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
    </div>
  )

  if (isError || !data?.current) return (
    <div className="advisory-red">
      <p>আবহাওয়া তথ্য পাওয়া যায়নি।</p>
      <button onClick={() => refetch()} className="btn-primary mt-2 text-sm">আবার চেষ্টা</button>
    </div>
  )

  const c = data.current
  const d = data.daily

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
          <Cloud size={22} className="text-sky-600" /> আবহাওয়া
        </h1>
        <LocationSelector />
      </div>

      {/* Current conditions */}
      <div className="card bg-gradient-to-br from-sky-600 to-sky-800 text-white border-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-200 text-sm">{upazila} — এখন</p>
            <p className="text-5xl font-bold mt-1">{c.temperature}°C</p>
            <p className="text-xl mt-1">{c.weatherBn}</p>
          </div>
          <div className="text-6xl">{getIcon(c.weatherCode)}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-sky-500">
          <div className="text-center">
            <Droplets size={18} className="mx-auto text-sky-300 mb-1" />
            <p className="font-semibold">{c.humidity}%</p>
            <p className="text-xs text-sky-300">আর্দ্রতা</p>
          </div>
          <div className="text-center">
            <Wind size={18} className="mx-auto text-sky-300 mb-1" />
            <p className="font-semibold">{c.windSpeed} km/h</p>
            <p className="text-xs text-sky-300">বায়ু</p>
          </div>
          <div className="text-center">
            <Sun size={18} className="mx-auto text-sky-300 mb-1" />
            <p className="font-semibold">{c.precipitation ?? 0} mm</p>
            <p className="text-xs text-sky-300">বৃষ্টি</p>
          </div>
        </div>
      </div>

      {/* Agricultural advisories */}
      <div className="space-y-3">
        <h2 className="section-title">🌾 কৃষি পরামর্শ</h2>

        {c.weatherAdvisory && (
          <div className="advisory-green">
            <p className="font-semibold text-xs mb-1">আবহাওয়া পরামর্শ</p>
            <p>{c.weatherAdvisory}</p>
          </div>
        )}

        {c.irrigationAdvisory && (
          <div className={c.irrigationAdvisory.includes('🔴') ? 'advisory-red' : c.irrigationAdvisory.includes('⚠️') ? 'advisory-amber' : 'advisory-green'}>
            <p className="font-semibold text-xs mb-1">💧 সেচ পরামর্শ</p>
            <p>{c.irrigationAdvisory}</p>
          </div>
        )}

        {c.leafWetnessAdvisory && (
          <div className={c.leafWetnessAdvisory.includes('🍄') ? 'advisory-amber' : 'advisory-green'}>
            <p className="font-semibold text-xs mb-1">🍂 রোগ ঝুঁকি</p>
            <p>{c.leafWetnessAdvisory}</p>
          </div>
        )}
      </div>

      {/* Ag indices grid */}
      <div>
        <h2 className="section-title">📊 কৃষি সূচক</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: Droplets, label: 'মাটির আর্দ্রতা (০-১ সেমি)',
              value: c.soilMoisture != null ? `${(c.soilMoisture * 100).toFixed(0)}%` : 'N/A',
              sub: c.soilMoisture > 0.35 ? '✅ পর্যাপ্ত' : c.soilMoisture > 0.20 ? '⚠️ মাঝারি' : '🔴 শুষ্ক'
            },
            {
              icon: Thermometer, label: 'মাটির তাপমাত্রা (০ সেমি)',
              value: c.soilTemp != null ? `${c.soilTemp?.toFixed(1)}°C` : 'N/A',
              sub: 'ভূপৃষ্ঠ তাপমাত্রা'
            },
            {
              icon: Sun, label: 'ET₀ (Penman-Monteith)',
              value: c.et0 != null ? `${c.et0?.toFixed(2)} mm` : 'N/A',
              sub: 'আজকের বাষ্পীভবন'
            },
            {
              icon: Sprout, label: 'পাতার আর্দ্রতা',
              value: c.leafWetness != null ? `${c.leafWetness?.toFixed(0)}%` : 'N/A',
              sub: c.leafWetness > 70 ? '🍄 ছত্রাক ঝুঁকি' : '✅ স্বাভাবিক'
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="card">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className="text-sky-600" />
                <span className="text-xs text-stone-500">{label}</span>
              </div>
              <p className="text-xl font-bold text-stone-800">{value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day forecast */}
      {d?.dates && (
        <div>
          <h2 className="section-title">📅 ৭ দিনের পূর্বাভাস</h2>
          <div className="card">
            <div className="space-y-3">
              {d.dates.slice(0, 7).map((date: string, i: number) => {
                const day = new Date(date)
                const dayName = BANGLA_DAYS[day.getDay()]
                return (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-stone-500 w-12 flex-shrink-0">{i === 0 ? 'আজ' : dayName}</span>
                    <span className="text-xl flex-shrink-0">{getIcon(d.weatherCode[i])}</span>
                    <div className="flex-1 min-w-0">
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${Math.min((d.rainfall[i] || 0) * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-sky-600 flex-shrink-0">{d.rainfall[i]?.toFixed(0) ?? 0}mm</span>
                    <span className="text-xs font-medium text-stone-700 flex-shrink-0">
                      {d.tempMin[i]?.toFixed(0)}–{d.tempMax[i]?.toFixed(0)}°
                    </span>
                    {d.leafWetness?.[i] > 60 && (
                      <span title="ছত্রাক ঝুঁকি" className="flex-shrink-0">
                        <AlertTriangle size={14} className="text-amber-500" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
