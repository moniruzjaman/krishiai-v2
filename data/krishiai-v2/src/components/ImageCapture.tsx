import { useRef, useState, useCallback } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'

interface Props {
  onImage: (base64: string, mimeType: string) => void
  onClear?: () => void
  label?: string
}

const MAX_DIM = 800
const QUALITY = 0.75

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM }
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ImageCapture({ onImage, onClear, label = 'ছবি তুলুন বা আপলোড করুন' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return
    setProcessing(true)
    try {
      const { base64, mimeType } = await compressImage(file)
      setPreview(`data:${mimeType};base64,${base64}`)
      onImage(base64, mimeType)
    } catch {
      alert('ছবি প্রসেস করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setProcessing(false)
    }
  }, [onImage])

  const clear = () => {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
    onClear?.()
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border-2 border-green-200">
        <img src={preview} alt="নির্বাচিত ছবি" className="w-full max-h-64 object-contain bg-stone-100" />
        <button
          onClick={clear}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
          title="ছবি সরান"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-2 left-2 badge-green">
          <ImageIcon size={12} /> ছবি প্রস্তুত
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-dashed border-green-300 rounded-xl p-6 bg-green-50 text-center">
      <div className="text-green-600 mb-2">
        <ImageIcon size={40} className="mx-auto opacity-60" />
      </div>
      <p className="text-sm text-stone-600 mb-4">{label}</p>

      <div className="flex gap-3 justify-center flex-wrap">
        {/* Camera capture (mobile) */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={processing}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Camera size={16} />
          ক্যামেরা
        </button>

        {/* File upload */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={processing}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Upload size={16} />
          {processing ? 'লোড হচ্ছে…' : 'গ্যালারি'}
        </button>
      </div>

      {/* Camera input (capture attribute triggers camera on mobile) */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />

      {/* File picker */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0] ?? null)}
      />

      <p className="text-xs text-stone-400 mt-3">
        রোগাক্রান্ত পাতা স্পষ্ট আলোতে সরাসরি ছবি তুলুন
      </p>
    </div>
  )
}
