import { MapPin, Navigation } from 'lucide-react'
import { useAppStore, KURIGRAM_UPAZILAS } from '../store/useAppStore'

export default function LocationSelector() {
  const { upazila, district, setUpazila, setGPS } = useAppStore()

  const detectGPS = () => {
    if (!navigator.geolocation) {
      alert('আপনার ডিভাইসে GPS সাপোর্ট নেই।')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setGPS({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => alert('অবস্থান সনাক্ত করা যায়নি। অনুমতি দিন।')
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-green-700">
        <MapPin size={14} />
        <select
          value={upazila}
          onChange={e => setUpazila(e.target.value)}
          className="text-sm border border-green-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        >
          {KURIGRAM_UPAZILAS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      <span className="text-stone-400 text-sm">{district}</span>

      <button
        onClick={detectGPS}
        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded-lg px-2 py-1 bg-white hover:bg-green-50 transition-colors"
        title="GPS থেকে অবস্থান নিন"
      >
        <Navigation size={12} />
        GPS
      </button>
    </div>
  )
}
