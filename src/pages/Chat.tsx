import { useState, useRef, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Send, Bot, User, ChevronDown, Trash2, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { VoiceInput } from "@/components/VoiceInput"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { sendChat, type ChatMessage } from "@/services/aiService"
import { KURIGRAM_UPAZILAS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ── Quick question chips ──
const quickQuestions = [
  "আমার ধানে পোকা লেগেছে",
  "কবে সার দেব",
  "আজ সেচ দরকার?",
  "ধানের দাম কত",
]

// ── Typing dots animation ──
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
      <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
    </div>
  )
}

export default function Chat() {
  const { gps, upazila, setUpazila } = useLocationStore()
  const { language, t } = useSettingsStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [showUpazilaSelect, setShowUpazilaSelect] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Send message mutation ──
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      const location = {
        lat: gps?.lat ?? 25.82,
        lon: gps?.lon ?? 89.72,
        upazila: upazila || undefined,
      }
      return sendChat(message, messages, location)
    },
    onSuccess: (response) => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: language === "bn"
          ? "দুঃখিত, একটি ত্রুটি হয়েছে। আবার চেষ্টা করুন।"
          : "Sorry, an error occurred. Please try again.",
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    },
  })

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sendMessageMutation.isPending) return

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputText("")
    sendMessageMutation.mutate(trimmed)
  }

  const handleVoiceTranscript = (transcript: string) => {
    handleSend(transcript)
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col bg-gray-50/50">
      {/* ── Top Bar: Voice Input + Upazila Selector ── */}
      <div className="border-b border-border bg-white px-4 pb-3 pt-3">
        {/* Voice Input */}
        <VoiceInput
          onTranscript={handleVoiceTranscript}
          disabled={sendMessageMutation.isPending}
          className="mb-3"
        />

        {/* Upazila Selector */}
        <div className="relative">
          <button
            onClick={() => setShowUpazilaSelect(!showUpazilaSelect)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm text-foreground transition-colors hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("general.upazila")}:</span>
              <span className="font-medium">{upazila || (language === "bn" ? "নির্বাচন করুন" : "Select")}</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showUpazilaSelect && "rotate-180")} />
          </button>
          {showUpazilaSelect && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
              {KURIGRAM_UPAZILAS.map((uz) => (
                <button
                  key={uz}
                  onClick={() => {
                    setUpazila(uz)
                    setShowUpazilaSelect(false)
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary-50",
                    upazila === uz && "bg-primary-50 font-semibold text-primary-700"
                  )}
                >
                  {uz}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Message List ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Empty State / Welcome */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {language === "bn" ? "কৃষি এআই সহকারী" : "KrishiAI Assistant"}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {language === "bn"
                ? "আপনার কৃষি সম্পর্কিত যেকোনো প্রশ্ন করুন। আমি বাংলায় উত্তর দেব।"
                : "Ask me anything about agriculture. I respond in Bengali."}
            </p>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "mb-3 flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex max-w-[85%] gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                  msg.role === "user" ? "bg-green-600" : "bg-gray-500"
                )}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              {/* Bubble */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "rounded-tr-sm bg-green-600 text-white"
                    : "rounded-tl-sm bg-white text-foreground shadow-sm border border-border/50"
                )}
                dir="auto"
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sendMessageMutation.isPending && (
          <div className="mb-3 flex justify-start">
            <div className="flex max-w-[85%] gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-500 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm border border-border/50">
                <TypingDots />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Quick Question Chips ── */}
      {messages.length === 0 && (
        <div className="border-t border-border/50 bg-white px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={sendMessageMutation.isPending}
                className="shrink-0 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 active:scale-95 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Input Bar ── */}
      <div className="border-t border-border bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
              title={t("chat.clear")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend(inputText)
              }
            }}
            placeholder={t("chat.placeholder")}
            disabled={sendMessageMutation.isPending}
            className="flex-1 text-base"
            dir="auto"
          />
          <Button
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
