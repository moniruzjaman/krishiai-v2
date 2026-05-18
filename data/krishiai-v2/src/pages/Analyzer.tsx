import { useState } from 'react'
import { Leaf, Send, Loader, Layers } from 'lucide-react'
import ImageCapture from '../components/ImageCapture'
import LocationSelector from '../components/LocationSelector'
import { useAppStore } from '../store/useAppStore'
import { useQuery } from '@tanstack/react-query'

export default function Analyzer() {
  const { gps, upazila, district, soilCache } = useAppStore()
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Soil data for context
  const { data: soil } = useQuery({
    queryKey: ['soil', gps?.lat, gps?.lon],
    queryFn: () => fetch(`/api/soil?lat=${gps!.lat}&lon=${gps!.lon}`).then(r => r.json()),
    enabled: !!gps,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  })

  const buildPrompt = () => {
    const parts = [prompt]
    if (soil?.ph) parts.push(`[মাটির pH: ${soil.ph?.toFixed(1)}, ধরন: ${soil.textureBn || 'অজানা'}]`)
    if (upazila) parts.push(`[এলাকা: ${upazila}, ${district}]`)
    return parts.join('\n')
  }

  const analyze = async () => {
    if (!prompt.trim() && !imageBase64) return
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: buildPrompt(),
          imageBase64,
          mimeType,
          upazila,
          district
        })
      })
      const data = await res.json()
      setResult(data.result)
      setProvider(data.provider)
    } catch {
      setResult('⚠️ বিশ্লেষণ করা সম্ভব হয়নি। নেটওয়ার্ক সংযোগ পরীক্ষা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
          <Leaf size={22} className="text-emerald-600" />
          ফসল বিশ্লেষণ
        </h1>
        <p className="text-sm text-stone-500 mt-1">ছবি বা বর্ণনা দিয়ে ফসলের সমস্যা বিশ্লেষণ করুন</p>
      </div>

      <LocationSelector />

      {/* Soil context badge */}
      {soil?.textureBn && (
        <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          <Layers size={14} />
          <span>মাটি: <strong>{soil.textureBn}</strong> | pH: <strong>{soil.ph?.toFixed(1)}</strong> ({soil.phLevel})</span>
        </div>
      )}
      {gps && !soil && (
        <div className="text-xs text-stone-400 flex items-center gap-1">
          <Layers size={12} /> মাটির তথ্য লোড হচ্ছে…
        </div>
      )}

      {/* Image capture */}
      <ImageCapture
        onImage={(b64, mime) => { setImageBase64(b64); setMimeType(mime) }}
        onClear={() => setImageBase64(null)}
        label="ফসলের ছবি তুলুন (ঐচ্ছিক)"
      />

      {/* Text input */}
      <div>
        <label className="text-sm font-medium text-stone-700 block mb-1.5">
          সমস্যার বিবরণ লিখুন
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="যেমন: আমার ধান গাছের পাতায় বাদামি দাগ দেখা দিয়েছে, কী করব?"
          rows={4}
          className="input-field resize-none text-sm"
        />
      </div>

      <button
        onClick={analyze}
        disabled={loading || (!prompt.trim() && !imageBase64)}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <><Loader size={18} className="animate-spin" /> বিশ্লেষণ চলছে…</>
        ) : (
          <><Send size={18} /> বিশ্লেষণ করুন</>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title mb-0">বিশ্লেষণ ফলাফল</span>
            {provider && <span className="badge-green">{provider}</span>}
          </div>
          <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-400">
            DAE, BARI, BRRI নির্দেশিকা অনুযায়ী। চূড়ান্ত সিদ্ধান্তের আগে স্থানীয় কৃষি কর্মকর্তার পরামর্শ নিন।
          </div>
        </div>
      )}
    </div>
  )
}
