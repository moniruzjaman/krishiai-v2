import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Sprout,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { toBengaliNumber, BENGALI_MONTHS } from "@/lib/bengali"
import { KURIGRAM_UPAZILAS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ── Crop tabs ──
const cropTabs = [
  { key: "rice", label: "ধান", labelEn: "Rice", emoji: "🌾" },
  { key: "wheat", label: "গম", labelEn: "Wheat", emoji: "🌿" },
  { key: "jute", label: "জুট", labelEn: "Jute", emoji: "🪢" },
  { key: "vegetables", label: "সবজি", labelEn: "Vegetables", emoji: "🥬" },
]

// ── Rice sub-tabs ──
const riceSubTabs = [
  { key: "aus", label: "অুস", labelEn: "Aus" },
  { key: "aman", label: "আমন", labelEn: "Aman" },
  { key: "boro", label: "বোরো", labelEn: "Boro" },
]

// ── Crop calendar data ──
interface Stage {
  name: string
  nameEn: string
  startMonth: number // 0-indexed
  endMonth: number
  advisory: string
}

const CROP_CALENDARS: Record<string, Stage[]> = {
  aus: [
    { name: "জমি তৈরি", nameEn: "Land Prep", startMonth: 2, endMonth: 2, advisory: "জমি ভালোভাবে চাষ ও মই দিন। সার প্রয়োগ করুন।" },
    { name: "বীজ বপন", nameEn: "Sowing", startMonth: 3, endMonth: 3, advisory: "উন্নত জাতের বীজ বপন করুন। সারি থেকে সারি দূরত্ব ২০ সেমি।" },
    { name: "চারা বৃদ্ধি", nameEn: "Seedling Growth", startMonth: 3, endMonth: 4, advisory: "নিড়ন ও আগাছা পরিষ্কার করুন। প্রথম কিস্তি সার দিন।" },
    { name: "কুশি বের হওয়া", nameEn: "Tillering", startMonth: 4, endMonth: 5, advisory: "দ্বিতীয় কিস্তি নাইট্রোজেন সার দিন। সেচ ব্যবস্থা নিশ্চিত করুন।" },
    { name: "ফুল আসা", nameEn: "Flowering", startMonth: 5, endMonth: 6, advisory: "পানি নিষ্কাশন ও সেচ ব্যবস্থা করুন। পোকামাকড় পরিদর্শন করুন।" },
    { name: "ফসল কাটা", nameEn: "Harvest", startMonth: 6, endMonth: 7, advisory: "ধান পুরোপুরি পাকলে কাটুন। শুকনো আবহাওয়ায় মাড়াই করুন।" },
  ],
  aman: [
    { name: "বীজতলা তৈরি", nameEn: "Seedbed Prep", startMonth: 5, endMonth: 5, advisory: "বীজতলা উঁচু জায়গায় তৈরি করুন। প্রতি শতকে ৫ কেজি বীজ লাগবে।" },
    { name: "চারা রোপণ", nameEn: "Transplanting", startMonth: 6, endMonth: 7, advisory: "২৫-৩০ দিনের চারা রোপণ করুন। সারি থেকে সারি ২০ সেমি, চারা থেকে চারা ১৫ সেমি।" },
    { name: "কুশি বের হওয়া", nameEn: "Tillering", startMonth: 7, endMonth: 8, advisory: "প্রথম ও দ্বিতীয় কিস্তি ইউরিয়া সার দিন। আগাছা পরিষ্কার করুন।" },
    { name: "ফুল আসা ও দানা বাঁধা", nameEn: "Flowering & Grain Fill", startMonth: 9, endMonth: 10, advisory: "সেচ ব্যবস্থা রাখুন। পোকামাকড় ও রোগের লক্ষণ দেখুন।" },
    { name: "ফসল কাটা", nameEn: "Harvest", startMonth: 10, endMonth: 11, advisory: "ধান ৮০% পাকলে কাটুন। বৃষ্টির আগে কেটে নিন।" },
  ],
  boro: [
    { name: "বীজতলা তৈরি", nameEn: "Seedbed Prep", startMonth: 10, endMonth: 10, advisory: "শীতের শুরুতে বীজতলা তৈরি করুন। পলিথিন দিয়ে ঢেকে রাখুন।" },
    { name: "চারা রোপণ", nameEn: "Transplanting", startMonth: 11, endMonth: 0, advisory: "৩০-৪০ দিনের চারা ২-৩ টুকরা করে রোপণ করুন। স্থির পানিতে রোপণ করবেন না।" },
    { name: "কুশি বের হওয়া", nameEn: "Tillering", startMonth: 0, endMonth: 1, advisory: "তিন কিস্তিতে ইউরিয়া সার দিন। সেচ ও নিষ্কাশন নিশ্চিত করুন।" },
    { name: "ফুল আসা", nameEn: "Flowering", startMonth: 2, endMonth: 3, advisory: "ফুল আসার সময় পানি ধরে রাখুন। রোগবালাই পরিদর্শন করুন।" },
    { name: "ফসল কাটা", nameEn: "Harvest", startMonth: 3, endMonth: 4, advisory: "ধান পুরোপুরি পাকলে কাটুন। রোদে ভালোভাবে শুকিয়ে মাড়াই করুন।" },
  ],
  wheat: [
    { name: "জমি তৈরি ও বীজ বপন", nameEn: "Land Prep & Sowing", startMonth: 10, endMonth: 11, advisory: "জমি ভালোভাবে চাষ করুন। বারি গম-২৫, ২৬ জাতের বীজ বপন করুন।" },
    { name: "সেচ ও সার প্রয়োগ", nameEn: "Irrigation & Fertilizer", startMonth: 11, endMonth: 1, advisory: "৩টি সেচ দিন। নাইট্রোজেন সার ২ কিস্তিতে দিন।" },
    { name: "ফুল আসা ও দানা বাঁধা", nameEn: "Flowering & Grain Fill", startMonth: 1, endMonth: 2, advisory: "ব্লাস্ট রোগ প্রতিরোধে সতর্ক থাকুন। টিল্ট স্প্রে করুন।" },
    { name: "ফসল কাটা", nameEn: "Harvest", startMonth: 2, endMonth: 3, advisory: "গম পুরোপুরি পাকলে কাটুন। বৃষ্টির আগে ঘরে তুলুন।" },
  ],
  jute: [
    { name: "জমি তৈরি ও বীজ বপন", nameEn: "Land Prep & Sowing", startMonth: 2, endMonth: 3, advisory: "জমি ভালোভাবে চাষ করুন। প্রতি হেক্টরে ৫-৬ কেজি বীজ লাগবে।" },
    { name: "চারা পাতলা করা", nameEn: "Thinning", startMonth: 3, endMonth: 4, advisory: "চারা ১০-১৫ সেমি উঁচু হলে পাতলা করুন। সারি দূরত্ব ৩০ সেমি।" },
    { name: "সার ও নিড়ন", nameEn: "Fertilizer & Weeding", startMonth: 4, endMonth: 5, advisory: "নাইট্রোজেন সার দিন। নিড়ন করে আগাছা পরিষ্কার করুন।" },
    { name: "ফসল কাটা ও পানিতে ভেজানো", nameEn: "Harvest & Retting", startMonth: 6, endMonth: 7, advisory: "ফুল আসার আগে কাটুন। ১৫-২০ দিন পানিতে ভিজিয়ে আঁশ ছাড়ান।" },
  ],
  vegetables: [
    { name: "শীতকালীন সবজি চাষ", nameEn: "Winter Vegetables", startMonth: 9, endMonth: 11, advisory: "ফুলকপি, বাঁধাকপি, টমেটো, মূলার চারা লাগান। জমিতে জৈব সার মেশান।" },
    { name: "যত্ন ও সেচ", nameEn: "Care & Irrigation", startMonth: 10, endMonth: 1, advisory: "নিয়মিত সেচ দিন। পোকামাকড় পরিদর্শন করুন। সার প্রয়োগ করুন।" },
    { name: "ফসল তোলা", nameEn: "Harvest", startMonth: 11, endMonth: 2, advisory: "সবজি সময়মতো তুলুন। ফুলকপি মুখ ঢেকে রাখুন।" },
    { name: "গ্রীষ্মকালীন সবজি", nameEn: "Summer Vegetables", startMonth: 2, endMonth: 5, advisory: "ঢেঁড়স, লাউ, কুমড়া, মরিচ লাগান। সেচ ব্যবস্থা নিশ্চিত করুন।" },
  ],
}

export default function Calendar() {
  const { gps, upazila, setUpazila, requestGps } = useLocationStore()
  const { language, t } = useSettingsStore()

  const [activeCrop, setActiveCrop] = useState("rice")
  const [activeRiceSub, setActiveRiceSub] = useState("aman")
  const [scrollMonth, setScrollMonth] = useState(new Date().getMonth())

  const currentMonth = new Date().getMonth()

  // Get calendar key
  const calendarKey = activeCrop === "rice" ? activeRiceSub : activeCrop
  const stages = CROP_CALENDARS[calendarKey] ?? []

  // Find current stage
  const currentStage = stages.find(
    (s) => currentMonth >= s.startMonth && currentMonth <= s.endMonth
  )

  // Find next upcoming stage
  const nextStage = stages.find(
    (s) => s.startMonth > currentMonth
  )

  // Days until next stage
  const daysUntilNext = useMemo(() => {
    if (!nextStage) return null
    const now = new Date()
    const target = new Date(now.getFullYear(), nextStage.startMonth, 1)
    if (target < now) target.setFullYear(target.getFullYear() + 1)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }, [nextStage])

  // All months for timeline
  const months = BENGALI_MONTHS

  return (
    <div className="space-y-5 p-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {t("nav.calendar")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {language === "bn"
            ? "ফসলের মৌসুম অনুযায়ী কৃষি পরামর্শ"
            : "Seasonal agricultural advice"}
        </p>
      </div>

      {/* ── Upazila Selector ── */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
        <select
          value={upazila}
          onChange={(e) => setUpazila(e.target.value)}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{language === "bn" ? "উপজেলা নির্বাচন" : "Select Upazila"}</option>
          {KURIGRAM_UPAZILAS.map((uz) => (
            <option key={uz} value={uz}>{uz}</option>
          ))}
        </select>
      </div>

      {/* ── Crop Selector Tabs ── */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {cropTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCrop(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                activeCrop === tab.key
                  ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm"
                  : "border-border bg-white text-muted-foreground hover:border-primary-200"
              )}
            >
              <span>{tab.emoji}</span>
              {language === "bn" ? tab.label : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Rice sub-tabs */}
        {activeCrop === "rice" && (
          <div className="mt-2 flex gap-2">
            {riceSubTabs.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setActiveRiceSub(sub.key)}
                className={cn(
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  activeRiceSub === sub.key
                    ? "border-green-300 bg-green-100 text-green-800"
                    : "border-border bg-white text-muted-foreground hover:border-green-200"
                )}
              >
                {language === "bn" ? sub.label : sub.labelEn}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Countdown Banner ── */}
      {daysUntilNext !== null && nextStage && (
        <Card className="border-primary-200 bg-primary-50/50">
          <CardContent className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {toBengaliNumber(daysUntilNext)} {language === "bn" ? "দিন পরে" : "days until"}
              </p>
              <p className="text-xs text-muted-foreground">
                {nextStage.name} — {nextStage.advisory.split("।")[0]}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Current Stage ── */}
      {currentStage && (
        <Card className="border-green-300 bg-gradient-to-br from-green-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-[10px]">
                {language === "bn" ? "বর্তমান পর্যায়" : "Current Stage"}
              </Badge>
            </div>
            <CardTitle className="text-base">{currentStage.name}</CardTitle>
            <CardDescription>
              {BENGALI_MONTHS[currentStage.startMonth]} - {BENGALI_MONTHS[currentStage.endMonth]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground" dir="auto">
              {currentStage.advisory}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Monthly Timeline ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === "bn" ? "মাসিক সময়রেখা" : "Monthly Timeline"}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {months.map((monthName, idx) => {
            // Check if this month falls within any stage
            const stageInMonth = stages.find(
              (s) => {
                if (s.startMonth <= s.endMonth) {
                  return idx >= s.startMonth && idx <= s.endMonth
                }
                // Wraps around year (e.g. Nov to Feb)
                return idx >= s.startMonth || idx <= s.endMonth
              }
            )
            const isCurrentMonth = idx === currentMonth
            const hasStage = !!stageInMonth

            return (
              <div
                key={idx}
                className={cn(
                  "flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border p-2 text-center transition-all",
                  isCurrentMonth
                    ? "border-primary-300 bg-primary-50 shadow-sm"
                    : hasStage
                    ? "border-green-200 bg-green-50/50"
                    : "border-border bg-white"
                )}
              >
                <span className={cn(
                  "text-[10px] font-semibold",
                  isCurrentMonth ? "text-primary-700" : "text-muted-foreground"
                )}>
                  {monthName}
                </span>
                {hasStage ? (
                  <>
                    <Sprout className="h-4 w-4 text-green-600" />
                    <span className="text-[9px] text-green-700 font-medium leading-tight">
                      {stageInMonth.name}
                    </span>
                  </>
                ) : (
                  <div className="h-4 w-4 rounded-full border border-dashed border-gray-300" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── All Stages ── */}
      <section className="space-y-3">
        {stages.map((stage, idx) => {
          const isCurrent = currentStage === stage
          return (
            <Card
              key={idx}
              className={cn(
                "transition-all",
                isCurrent && "border-green-300 shadow-md"
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {/* Step number */}
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    isCurrent
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {toBengaliNumber(idx + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                      {isCurrent && (
                        <Badge variant="success" className="text-[9px] px-1.5 py-0">
                          {language === "bn" ? "এখন" : "Now"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {BENGALI_MONTHS[stage.startMonth]} - {BENGALI_MONTHS[stage.endMonth]}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground" dir="auto">
                      {stage.advisory}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
