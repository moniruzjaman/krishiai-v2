import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, RefreshCw } from 'lucide-react'
import VoiceInput from '../components/VoiceInput'
import LocationSelector from '../components/LocationSelector'
import { useAppStore } from '../store/useAppStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  provider?: string
}

const QUICK_QUESTIONS = [
  'আমার ধানে পোকা লেগেছে, কী করব?',
  'এখন কোন সার দেওয়া উচিত?',
  'সেচ কখন দেব?',
  'ধানের ব্লাস্ট রোগের প্রতিকার কী?',
  'ভুট্টা চাষের সঠিক পদ্ধতি কী?',
  'জৈব সার কীভাবে তৈরি করব?',
]

export default function Chat() {
  const { upazila, district } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `আসসালামু আলাইকুম! আমি কৃষি AI। আপনার ফসল সম্পর্কে যেকোনো প্রশ্ন করুন — বাংলায় বলুন বা টাইপ করুন। আমি ${upazila}, ${district}-এর কৃষি অবস্থা অনুযায়ী পরামর্শ দেব। 🌾`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Send last 10 messages for context (cost control)
      const contextMessages = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, upazila, district })
      })
      const data = await res.json()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.result || 'দুঃখিত, উত্তর দেওয়া সম্ভব হয়নি।',
        provider: data.provider
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ নেটওয়ার্ক সমস্যা। দয়া করে আবার চেষ্টা করুন।'
      }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessages([{
      role: 'assistant',
      content: `নতুন কথোপকথন শুরু হয়েছে। আপনার ফসল সম্পর্কে প্রশ্ন করুন। 🌱`
    }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-green-900">কৃষি পরামর্শ</h1>
          <LocationSelector />
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
          <RefreshCw size={14} /> নতুন প্রশ্ন
        </button>
      </div>

      {/* Quick questions */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => send(q)}
            disabled={loading}
            className="flex-shrink-0 text-xs bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 py-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
              msg.role === 'user' ? 'bg-amber-600' : 'bg-green-700'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white rounded-tr-sm'
                  : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
              {msg.provider && msg.role === 'assistant' && (
                <span className="text-[10px] text-stone-400 px-1">{msg.provider}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pt-3 border-t border-stone-200">
        <div className="flex gap-2 items-end">
          <VoiceInput onTranscript={t => setInput(prev => prev + t)} disabled={loading} />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="আপনার প্রশ্ন লিখুন বা মাইক চাপুন…"
            rows={2}
            className="flex-1 input-field resize-none text-sm"
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center gap-1.5 self-end"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
