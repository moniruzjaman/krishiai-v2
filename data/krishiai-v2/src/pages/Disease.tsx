import { useState } from 'react'
import { Bug, AlertTriangle, CheckCircle, Info, Loader } from 'lucide-react'
import ImageCapture from '../components/ImageCapture'

interface DiseaseResult {
  tier: number
  model: string
  confidence: number | null
  crop?: string
  disease?: string
  isHealthy?: boolean
  isGeminiAnalysis?: boolean
  analysis?: string
  eppoCode?: string
  scientificName?: string
  raw?: { label: string; score: number }[]
}

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'ViT মডেল (উচ্চ নির্ভুলতা)', color: 'badge-green' },
  2: { label: 'MobileNet মডেল', color: 'badge-green' },
  3: { label: 'PlantNet API', color: 'badge-amber' },
  4: { label: 'Gemini বিশ্লেষণ', color: 'badge-amber' },
  0: { label: 'সাধারণ পরামর্শ', color: 'badge-red' },
}

export default function Disease() {
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [result, setResult] = useState<DiseaseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    if (!imageBase64) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType })
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setError('বিশ্লেষণ ব্যর্থ হয়েছে। নেটওয়ার্ক সংযোগ পরীক্ষা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
          <Bug size={22} className="text-red-600" />
          রোগ ও পোকা নির্ণয়
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          রোগাক্রান্ত পাতা বা ফসলের ছবি তুলুন — AI স্বয়ংক্রিয়ভাবে রোগ শনাক্ত করবে
        </p>
      </div>

      {/* Photo tips */}
      <div className="advisory-amber text-xs space-y-1">
        <p className="font-semibold">📸 ভালো ফলাফলের জন্য:</p>
        <p>• রোগাক্রান্ত পাতা স্পষ্ট আলোতে সরাসরি ছবি তুলুন</p>
        <p>• পাতার উভয় দিকের ছবি তুলুন</p>
        <p>• ছায়ায় বা রাতে ছবি তুলবেন না</p>
      </div>

      {/* Image capture */}
      <ImageCapture
        onImage={(b64, mime) => { setImageBase64(b64); setMimeType(mime); setResult(null) }}
        onClear={() => { setImageBase64(null); setResult(null) }}
        label="ফসলের রোগাক্রান্ত পাতার ছবি তুলুন"
      />

      {/* Analyze button */}
      {imageBase64 && !result && (
        <button
          onClick={analyze}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader size={18} className="animate-spin" /> বিশ্লেষণ চলছে…</>
          ) : (
            <><Bug size={18} /> রোগ শনাক্ত করুন</>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="advisory-red flex gap-2">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Model used */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-700">বিশ্লেষণ ফলাফল</span>
            <span className={TIER_LABELS[result.tier]?.color || 'badge-green'}>
              {TIER_LABELS[result.tier]?.label}
            </span>
          </div>

          {/* Healthy or diseased */}
          {result.isHealthy ? (
            <div className="card border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle size={32} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">গাছটি সুস্থ! 🌿</p>
                  <p className="text-sm text-green-700">ফসল: {result.crop}</p>
                  {result.confidence && (
                    <p className="text-xs text-green-600 mt-1">
                      নিশ্চয়তা: {(result.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : result.isGeminiAnalysis ? (
            /* Gemini full analysis */
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-amber-600" />
                <span className="font-semibold text-stone-800">Gemini AI বিশ্লেষণ</span>
              </div>
              <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {result.analysis}
              </div>
            </div>
          ) : (
            /* Structured disease result */
            <div className="space-y-3">
              <div className="card border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={28} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-800 text-lg">{result.disease}</p>
                    <p className="text-sm text-red-700">ফসল: <strong>{result.crop}</strong></p>
                    {result.confidence && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-red-600 mb-1">
                          <span>শনাক্তের নিশ্চয়তা</span>
                          <span>{(result.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {result.eppoCode && (
                      <p className="text-xs text-red-500 mt-1">EPPO: {result.eppoCode}</p>
                    )}
                    {result.scientificName && (
                      <p className="text-xs text-red-500 italic">{result.scientificName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next step — Gemini detailed analysis */}
              <div className="advisory-amber text-sm">
                <p className="font-semibold mb-1">📋 পরবর্তী পদক্ষেপ:</p>
                <p>বিস্তারিত চিকিৎসা পরামর্শের জন্য <strong>ফসল বিশ্লেষণ</strong> পেজে এই রোগের নাম দিয়ে জিজ্ঞেস করুন অথবা <strong>কৃষি পরামর্শ</strong> চ্যাটে রোগের নাম বলুন।</p>
              </div>

              {/* Alternative results */}
              {result.raw && result.raw.length > 1 && (
                <div className="card">
                  <p className="text-xs font-semibold text-stone-600 mb-2">অন্যান্য সম্ভাবনা:</p>
                  <div className="space-y-1.5">
                    {result.raw.slice(1, 4).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-stone-500">
                        <span>{r.label.replace(/___/g, ' → ')}</span>
                        <span>{(r.score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DAE contact */}
          <div className="advisory-green text-sm">
            <p>🏢 <strong>নিশ্চিত নন?</strong> নিকটতম উপজেলা কৃষি অফিসে যোগাযোগ করুন বা উপসহকারী কৃষি কর্মকর্তার পরামর্শ নিন।</p>
          </div>
        </div>
      )}
    </div>
  )
}
