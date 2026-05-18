import { useState, useRef, useCallback, useEffect } from "react"
import { Mic, MicOff, Square } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
  className?: string
}

// Type for Web Speech API (non-standard)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionInstance) | null
}

export function VoiceInput({ onTranscript, disabled = false, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [finalText, setFinalText] = useState("")
  const [speechSupported, setSpeechSupported] = useState(true)
  const [fallbackText, setFallbackText] = useState("")
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "bn-BD"
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (interim) setInterimText(interim)
      if (final) {
        setFinalText((prev) => prev + final)
        setInterimText("")
        onTranscript(final)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const safeError = String(event.error).replace(/[\r\n]/g, ' ')
      console.error("Speech recognition error:", safeError)
      setIsListening(false)
      if (event.error === "not-allowed") {
        setSpeechSupported(false)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [onTranscript])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setInterimText("")
      recognitionRef.current.start()
    }
  }, [isListening])

  const handleFallbackSubmit = useCallback(() => {
    if (fallbackText.trim()) {
      onTranscript(fallbackText.trim())
      setFallbackText("")
    }
  }, [fallbackText, onTranscript])

  const handleFallbackKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleFallbackSubmit()
      }
    },
    [handleFallbackSubmit]
  )

  // If speech is not supported, show fallback text input
  if (!speechSupported) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Input
          value={fallbackText}
          onChange={(e) => setFallbackText(e.target.value)}
          onKeyDown={handleFallbackKeyDown}
          placeholder="আপনার প্রশ্ন লিখুন..."
          disabled={disabled}
          className="flex-1 text-base"
          dir="auto"
        />
        <button
          onClick={handleFallbackSubmit}
          disabled={disabled || !fallbackText.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          পাঠান
        </button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Transcript Display */}
      {(finalText || interimText) && (
        <div className="rounded-xl border border-border bg-primary-50/50 p-3 text-sm" dir="auto">
          <p className="text-foreground">
            {finalText}
            {interimText && (
              <span className="text-muted-foreground italic">{interimText}</span>
            )}
          </p>
        </div>
      )}

      {/* Microphone Button */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            isListening
              ? "bg-red-500 text-white shadow-red-200"
              : "bg-primary-600 text-white shadow-primary-200 hover:bg-primary-700"
          )}
          aria-label={isListening ? "রেকর্ডিং বন্ধ করুন" : "ভয়েস ইনপুট শুরু করুন"}
        >
          {/* Pulsing rings when listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
              <span className="absolute inset-0 animate-pulse rounded-full bg-red-400 opacity-20" />
            </>
          )}

          {isListening ? (
            <Square className="relative z-10 h-6 w-6 fill-current" />
          ) : (
            <Mic className="relative z-10 h-7 w-7" />
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {isListening ? "শুনছি..." : "মাইক্রোফোন চাপুন"}
          </p>
          {isListening && (
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "0ms" }} />
              <span className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "150ms" }} />
              <span className="inline-block h-4 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "300ms" }} />
              <span className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "450ms" }} />
              <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-red-400" style={{ animationDelay: "600ms" }} />
            </div>
          )}
        </div>
      </div>

      {/* Fallback text input alongside mic */}
      <div className="flex gap-2">
        <Input
          value={fallbackText}
          onChange={(e) => setFallbackText(e.target.value)}
          onKeyDown={handleFallbackKeyDown}
          placeholder="অথবা টাইপ করুন..."
          disabled={disabled}
          className="flex-1 text-sm"
          dir="auto"
        />
        <button
          onClick={handleFallbackSubmit}
          disabled={disabled || !fallbackText.trim()}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          পাঠান
        </button>
      </div>
    </div>
  )
}
