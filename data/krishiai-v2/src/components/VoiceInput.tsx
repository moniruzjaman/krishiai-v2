import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'

interface Props {
  onTranscript: (text: string) => void
  disabled?: boolean
}

// Extend window type for SpeechRecognition
interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function VoiceInput({ onTranscript, disabled }: Props) {
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('আপনার ব্রাউজার ভয়েস ইনপুট সাপোর্ট করে না। Chrome ব্যবহার করুন।')
      return
    }

    const recognition = new SR()
    recognition.lang = 'bn-BD'
    recognition.continuous = false
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => setIsListening(true)
    recognition.onend   = () => { setIsListening(false); setInterim('') }
    recognition.onerror = () => { setIsListening(false); setInterim('') }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interimText += event.results[i][0].transcript
      }
      if (final) onTranscript(final)
      setInterim(interimText)
    }

    recognition.start()
  }, [onTranscript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`p-2.5 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-200'
            : 'bg-green-100 hover:bg-green-200 text-green-700'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        title={isListening ? 'থামুন' : 'বাংলায় বলুন'}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {isListening && (
        <span className="text-xs text-stone-500 flex items-center gap-1">
          <Loader size={12} className="animate-spin" />
          {interim || 'শুনছি…'}
        </span>
      )}
    </div>
  )
}
