import { useQuery } from '@tanstack/react-query'
import { Layers, MapPin, Navigation, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

function PHBar({ ph }: { ph: number }) {
  const pct = Math.max(0, Math.min(100, ((ph - 3) / (10 - 3)) * 100))
  const color = ph < 5.5 ? 'bg-red-500' : ph > 7.5 ? 'bg-purple-500' : 'bg-green-500'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-stone-500 mb-1">
        <span>অম্লীয় (৩)</span><span>নিরপেক্ষ (৭)</span><span>ক্ষারীয় (১০)</span>
      </div>
      <div className="relative h-3 bg-gradient-to-r from-red-200 via-green-200 to-purple-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 h-full w-1 ${color} shadow rounded-full transition-all`}
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span />
        <span className={`font-bold ${ph < 5.5 ? 'text-red-600' : ph > 7.5 ? 'text-purple-600' : 'text-green-600'}`}>
          pH {ph?.toFixed(1)}
        </span>
        <span />
      </div>
    </div>
  )
}

function TextureTriangle({ clay, sand, silt }: { clay: number; sand: number; silt: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {[['এঁটেল', clay, 'bg-orange-400'], ['বালি', sand, 'bg-yellow-400'], ['পলি', silt, 'bg-blue-400']].map(
        ([label, val, color]) => (
          <div key={label as string} className="card p-3">
            <div className="text-lg font-bold text-stone-800">{(val as number)?.toFixed(0)}%</div>
            <div className={`h-1.5 rounded-full mt-1.5 ${color as string}`} style={{ width: `${val}%`, maxWidth: '100%' }} />
            <div className="text-xs text-stone-500 mt-1">{label}</div>
          </div>
        )
      )}
    </div>
  )
}

export default function Soil() {
  const { gps, setGPS, upazila } = useAppStore()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['soil', gps?.lat, gps?.lon],
    queryFn: () => fetch(`/api/soil?lat=${gps!.lat}&lon=${gps!.lon}`).then(r => r.json()),
    enabled: !!gps,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })

  const detectGPS = () => {
    navigator.geolocation?.getCurrentPosition(
      p => setGPS({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => alert('GPS অনুমতি দিন।')
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
          <Layers size={22} className="text-orange-700" /> মাটি বিশ্লেষণ
        </h1>
        <p className="text-sm text-stone-500 mt-1">GPS অবস্থান থেকে স্বয়ংক্রিয় মাটির তথ্য</p>
      </div>

      {/* GPS section */}
      {!gps ? (
        <div className="card text-center py-8">
          <MapPin size={48} className="mx-auto text-orange-400 mb-3" />
          <p className="font-semibold text-stone-700 mb-1">GPS অবস্থান প্রয়োজন</p>
          <p className="text-sm text-stone-500 mb-4">
            আপনার মাঠের GPS অবস্থান থেকে মাটির pH, জৈব পদার্থ ও গঠন জানুন
          </p>
          <button onClick={detectGPS} className="btn-primary flex items-center gap-2 mx-auto">
            <Navigation size={16} /> GPS দিয়ে অবস্থান নিন
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-sm text-green-700">
            <MapPin size={14} />
            <span>{upazila} ({gps.lat.toFixed(4)}, {gps.lon.toFixed(4)})</span>
          </div>
          <button onClick={detectGPS} className="text-xs text-green-600 hover:text-green-800 border border-green-200 rounded-lg px-2 py-1 bg-white">
            <Navigation size={12} className="inline mr-1" />আপডেট GPS
          </button>
        </div>
      )}

      {isLoading && gps && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          <p className="text-xs text-center text-stone-400">SoilGrids থেকে তথ্য আনা হচ্ছে (২৫০ মিটার রেজোলিউশন)…</p>
        </div>
      )}

      {isError && (
        <div className="advisory-red">
          <p>মাটির তথ্য পাওয়া যায়নি।</p>
          <button onClick={() => refetch()} className="btn-primary mt-2 text-sm">আবার চেষ্টা</button>
        </div>
      )}

      {data && !data.error && (
        <div className="space-y-4">
          {/* Texture class */}
          <div className="card">
            <h2 className="section-title">মাটির ধরন</h2>
            <div className="flex items-center gap-3">
              <div className="text-3xl">🪨</div>
              <div>
                <p className="text-xl font-bold text-orange-800">{data.textureBn || 'দোআঁশ'}</p>
                <p className="text-xs text-stone-500">{data.textureClass} • ISRIC SoilGrids</p>
              </div>
            </div>
            {data.clay != null && data.sand != null && data.silt != null && (
              <div className="mt-4">
                <TextureTriangle clay={data.clay} sand={data.sand} silt={data.silt} />
              </div>
            )}
          </div>

          {/* pH */}
          {data.ph != null && (
            <div className="card">
              <h2 className="section-title">মাটির pH ({data.phLevel})</h2>
              <PHBar ph={data.ph} />
            </div>
          )}

          {/* Organic carbon */}
          {data.organicCarbon != null && (
            <div className="card">
              <h2 className="section-title">জৈব পদার্থ</h2>
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${data.organicCarbon < 1 ? 'text-red-600' : data.organicCarbon < 2 ? 'text-amber-600' : 'text-green-600'}`}>
                  {data.organicCarbon?.toFixed(2)} g/kg
                </div>
                <div className={`flex-shrink-0 ${data.organicCarbon < 1 ? 'text-red-600' : data.organicCarbon < 2 ? 'text-amber-600' : 'text-green-600'}`}>
                  {data.organicCarbon < 1 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                </div>
                <div className="text-sm text-stone-600">
                  {data.organicCarbon < 1 ? 'কম — জৈব সার যোগ করুন' : data.organicCarbon < 2 ? 'মাঝারি' : 'ভালো'}
                </div>
              </div>
            </div>
          )}

          {/* CEC */}
          {data.cec != null && (
            <div className="card">
              <h2 className="section-title">আয়ন বিনিময় ক্ষমতা (CEC)</h2>
              <p className="text-xl font-bold text-stone-800">{data.cec?.toFixed(1)} cmol/kg</p>
              <p className="text-xs text-stone-500 mt-1">
                {data.cec > 20 ? '✅ সার ধারণক্ষমতা ভালো' : data.cec > 10 ? '⚠️ সার ধারণক্ষমতা মাঝারি' : '🔴 সার ধারণক্ষমতা কম'}
              </p>
            </div>
          )}

          {/* Fertilizer advice */}
          {data.fertilizerAdvice?.length > 0 && (
            <div className="card">
              <h2 className="section-title">🌿 সার সুপারিশ</h2>
              <ul className="space-y-2">
                {data.fertilizerAdvice.map((advice: string, i: number) => (
                  <li key={i} className="text-sm text-stone-700 leading-relaxed">{advice}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-stone-400 text-center">{data.source}</p>
        </div>
      )}

      {data?.error && (
        <div className="advisory-amber">
          <p>{data.error}</p>
          <p className="text-sm mt-1">{data.suggestion}</p>
        </div>
      )}
    </div>
  )
}
