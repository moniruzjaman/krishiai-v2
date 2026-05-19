import { useState, useRef, useCallback, useEffect } from "react"
import { Camera, Upload, X, RotateCcw, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageCaptureProps {
  onImageCapture: (base64: string) => void
  disabled?: boolean
  className?: string
}

type CaptureMode = "none" | "camera" | "upload"

export function ImageCapture({ onImageCapture, disabled = false, className }: ImageCaptureProps) {
  const [mode, setMode] = useState<CaptureMode>("none")
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setCameraStream(stream)
      setMode("camera")

      // Attach stream to video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      console.error("Camera access failed:", err)
      // Fallback to upload mode
      setMode("upload")
    }
  }, [])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setMode("none")
  }, [cameraStream])

  // Capture frame from video
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL("image/jpeg", 0.85)

    setPreview(base64)
    onImageCapture(base64)
    stopCamera()
  }, [onImageCapture, stopCamera])

  // Process file to base64
  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        setPreview(base64)
        onImageCapture(base64)
      }
      reader.readAsDataURL(file)
    },
    [onImageCapture]
  )

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  // Clear preview
  const clearPreview = useCallback(() => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  // ── Preview State ──
  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative overflow-hidden rounded-xl border border-border bg-black">
          <img
            src={preview}
            alt="Captured preview"
            className="h-56 w-full object-contain"
          />
          <button
            onClick={clearPreview}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white shadow-md transition-colors hover:bg-red-600"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={clearPreview}
          disabled={disabled}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          আবার ছবি তুলুন
        </button>
      </div>
    )
  }

  // ── Camera Mode ──
  if (mode === "camera") {
    return (
      <div className={cn("relative", className)}>
        <div className="overflow-hidden rounded-xl border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-56 w-full object-cover"
          />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            বাতিল
          </button>
          <button
            onClick={captureFrame}
            disabled={disabled}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-md transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-4 w-4" />
            ছবি তুলুন
          </button>
        </div>
      </div>
    )
  }

  // ── Upload Mode ──
  if (mode === "upload") {
    return (
      <div className={cn("relative", className)}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200",
            isDragging
              ? "border-primary-500 bg-primary-50"
              : "border-border bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            isDragging ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
          )}>
            <Upload className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              ছবি এখানে টেনে আনুন
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              অথবা ক্লিক করে ফাইল বেছে নিন
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <button
          onClick={() => setMode("none")}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          ফিরে যান
        </button>
      </div>
    )
  }

  // ── Default: Mode Selection ──
  return (
    <div className={cn("flex gap-3", className)}>
      <button
        onClick={startCamera}
        disabled={disabled}
        className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
          <Camera className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-foreground">ক্যামেরা</span>
        <span className="text-[11px] text-muted-foreground">ছবি তুলুন</span>
      </button>

      <button
        onClick={() => setMode("upload")}
        disabled={disabled}
        className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 hover:shadow-md active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-earth-100 text-earth-700">
          <ImageIcon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-foreground">আপলোড</span>
        <span className="text-[11px] text-muted-foreground">ফাইল থেকে</span>
      </button>
    </div>
  )
}
