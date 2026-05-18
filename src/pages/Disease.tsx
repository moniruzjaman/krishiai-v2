import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  Bug,
  AlertTriangle,
  ShieldCheck,
  FlaskConical,
  MessageSquare,
  Lightbulb,
  Camera,
  Sun,
  Focus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageCapture } from "@/components/ImageCapture"
import { useSettingsStore } from "@/store/useSettingsStore"
import { detectDisease as apiDetectDisease, type DiseaseResult } from "@/services/diseaseService"
import { toBengaliNumber } from "@/lib/bengali"
import { cn } from "@/lib/utils"

// ── Photo tips ──
const photoTips = [
  { icon: Focus, text: "স্পষ্ট ছবি তুলুন", color: "text-blue-600" },
  { icon: Sun, text: "আলোতে তুলুন", color: "text-amber-600" },
  { icon: Camera, text: "পাতার কাছাকাছি তুলুন", color: "text-green-600" },
]

// ── Severity color map ──
const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  critical: "bg-red-100 text-red-800 border-red-300",
}

const severityLabels: Record<string, string> = {
  low: "হালকা",
  medium: "মাঝারি",
  high: "মারাত্মক",
  critical: "অত্যন্ত মারাত্মক",
}

export default function Disease() {
  const navigate = useNavigate()
  const { language, t } = useSettingsStore()

  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [result, setResult] = useState<DiseaseResult | null>(null)
  const [showTips, setShowTips] = useState(true)

  // ── Detect disease mutation ──
  const detectMutation = useMutation({
    mutationFn: () => {
      if (!imageBase64) throw new Error("No image")
      return apiDetectDisease(imageBase64)
    },
    onSuccess: (data) => {
      setResult(data)
      setShowTips(false)
    },
  })

  const handleDetect = () => {
    if (!imageBase64) return
    detectMutation.mutate()
  }

  const handleImageCapture = (base64: string) => {
    setImageBase64(base64)
    setShowTips(false)
  }

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0

  return (
    <div className="space-y-5 p-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {language === "bn" ? "রোগ শনাক্তকরণ" : "Disease Detection"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {language === "bn"
            ? "গাছের ছবি দিয়ে রোগ শনাক্ত করুন"
            : "Detect plant diseases from photos"}
        </p>
      </div>

      {/* ── Photo Tips Overlay ── */}
      {showTips && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-800">
                {language === "bn" ? "ছবি তোলার পরামর্শ" : "Photo Tips"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photoTips.map((tip) => {
                const Icon = tip.icon
                return (
                  <div
                    key={tip.text}
                    className="flex flex-col items-center gap-1 rounded-lg bg-white/70 p-2 text-center"
                  >
                    <Icon className={cn("h-5 w-5", tip.color)} />
                    <span className="text-[10px] font-medium text-foreground">{tip.text}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Image Capture ── */}
      <section>
        <ImageCapture
          onImageCapture={handleImageCapture}
          disabled={detectMutation.isPending}
        />
      </section>

      {/* ── Detect Button ── */}
      <Button
        onClick={handleDetect}
        disabled={!imageBase64 || detectMutation.isPending}
        size="lg"
        className="w-full"
      >
        <Bug className="h-5 w-5" />
        {detectMutation.isPending
          ? t("action.loading")
          : language === "bn" ? "রোগ শনাক্তকরণ" : "Detect Disease"}
      </Button>

      {/* ── Loading Skeleton ── */}
      {detectMutation.isPending && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </CardContent>
        </Card>
      )}

      {/* ── Error State ── */}
      {detectMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {language === "bn" ? "শনাক্তকরণ ব্যর্থ" : "Detection Failed"}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {language === "bn" ? "স্পষ্ট ছবি দিয়ে আবার চেষ্টা করুন" : "Try again with a clearer photo"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => detectMutation.mutate()}>
              {t("action.retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {result && !detectMutation.isPending && (
        <section className="space-y-4">
          {/* Disease Name & Confidence */}
          <Card className="border-primary-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{result.bengaliName || result.disease}</CardTitle>
                  {result.bengaliName !== result.disease && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{result.disease}</p>
                  )}
                </div>
                <Badge className={cn("border", severityColors[result.severity] ?? severityColors.medium)}>
                  {severityLabels[result.severity] ?? result.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Confidence Score Bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{t("disease.confidence")}</span>
                  <span className="text-sm font-bold text-foreground">
                    {toBengaliNumber(confidencePercent)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      confidencePercent >= 80
                        ? "bg-green-500"
                        : confidencePercent >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              {result.description && (
                <p className="text-sm leading-relaxed text-muted-foreground" dir="auto">
                  {result.description}
                </p>
              )}

              {/* Symptoms */}
              {result.symptoms && result.symptoms.length > 0 && (
                <div>
                  <h4 className="mb-1 text-xs font-semibold text-foreground">
                    {language === "bn" ? "লক্ষণসমূহ" : "Symptoms"}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.symptoms.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[11px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Affected Crops */}
              {result.affectedCrops && result.affectedCrops.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {language === "bn" ? "আক্রান্ত ফসল:" : "Affected crops:"}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {result.affectedCrops.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BARI/BRRI Treatment */}
          {(result.barcTreatment || result.treatment) && (
            <Card className="border-green-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-green-600" />
                  <CardTitle className="text-sm">
                    {language === "bn" ? "বারি/ব্রি সুপারিশকৃত চিকিৎসা" : "BARI/BRRI Recommended Treatment"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground" dir="auto">
                  {result.barcTreatment || result.treatment}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Preventive Measures */}
          {result.preventiveMeasures && result.preventiveMeasures.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm">
                    {language === "bn" ? "প্রতিরোধমূলক ব্যবস্থা" : "Preventive Measures"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.preventiveMeasures.map((measure, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                      {toBengaliNumber(idx + 1)}
                    </span>
                    <p className="text-sm leading-relaxed text-foreground" dir="auto">{measure}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Consult Expert Link */}
          <Card className="border-primary-200 bg-primary-50/40">
            <CardContent className="flex items-center gap-3 p-4">
              <MessageSquare className="h-5 w-5 text-primary-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {language === "bn" ? "বিশেষজ্ঞের পরামর্শ নিন" : "Consult an Expert"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === "bn"
                    ? "আরো বিস্তারিত পরামর্শের জন্য চ্যাট করুন"
                    : "Chat for detailed advice"}
                </p>
              </div>
              <Button variant="default" size="sm" onClick={() => navigate("/chat")}>
                {language === "bn" ? "চ্যাট" : "Chat"}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
