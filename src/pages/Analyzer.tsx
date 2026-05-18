import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ScanSearch, Save, ChevronRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageCapture } from "@/components/ImageCapture"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { analyzeImage, type AnalysisResult } from "@/services/aiService"
import { KURIGRAM_UPAZILAS, SOIL_TYPES } from "@/lib/constants"
import { toBengaliNumber } from "@/lib/bengali"
import { cn } from "@/lib/utils"

export default function Analyzer() {
  const { gps, upazila, setUpazila, soilCache } = useLocationStore()
  const { language, t } = useSettingsStore()

  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [selectedUpazila, setSelectedUpazila] = useState(upazila)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saved, setSaved] = useState(false)

  // Soil type display from cache
  const soilTypeDisplay = soilCache
    ? SOIL_TYPES[soilCache.soilType ?? soilCache.texture]?.bengali ?? soilCache.soilType ?? soilCache.texture
    : null

  // ── Analyze mutation ──
  const analyzeMutation = useMutation({
    mutationFn: () => {
      const location = {
        lat: gps?.lat ?? 25.82,
        lon: gps?.lon ?? 89.72,
        upazila: selectedUpazila || undefined,
      }
      return analyzeImage(imageBase64, description, location)
    },
    onSuccess: (data) => {
      setResult(data)
    },
  })

  const handleAnalyze = () => {
    if (!imageBase64 && !description.trim()) return
    analyzeMutation.mutate()
  }

  const handleSave = () => {
    // Future: save to Supabase
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 p-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {language === "bn" ? "ফসল বিশ্লেষণ" : "Crop Analyzer"}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {language === "bn"
            ? "ছবি দিয়ে আপনার ফসলের সমস্যা বিশ্লেষণ করুন"
            : "Analyze your crop issues with a photo"}
        </p>
      </div>

      {/* ── Image Capture ── */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {language === "bn" ? "ফসলের ছবি" : "Crop Photo"}
        </h2>
        <ImageCapture
          onImageCapture={(base64) => setImageBase64(base64)}
          disabled={analyzeMutation.isPending}
        />
      </section>

      {/* ── Description ── */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {language === "bn" ? "অতিরিক্ত বিবরণ (ঐচ্ছিক)" : "Additional Description (optional)"}
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={language === "bn" ? "সমস্যার বিবরণ লিখুন, যেমন: পাতায় হলুদ দাগ দেখা যাচ্ছে..." : "Describe the issue..."}
          disabled={analyzeMutation.isPending}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          rows={3}
          dir="auto"
        />
      </section>

      {/* ── Context: Soil Type ── */}
      {soilTypeDisplay && (
        <div className="flex items-center gap-2 rounded-lg bg-earth-50 border border-earth-200 p-3">
          <span className="text-xs text-muted-foreground">{t("soil.type")}:</span>
          <Badge variant="outline" className="text-earth-700 border-earth-300">{soilTypeDisplay}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {language === "bn" ? "(স্বয়ংক্রিয়)" : "(auto-detected)"}
          </span>
        </div>
      )}

      {/* ── Upazila Selector ── */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">{t("general.upazila")}</h2>
        <select
          value={selectedUpazila}
          onChange={(e) => {
            setSelectedUpazila(e.target.value)
            setUpazila(e.target.value)
          }}
          disabled={analyzeMutation.isPending}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <option value="">{language === "bn" ? "উপজেলা নির্বাচন করুন" : "Select Upazila"}</option>
          {KURIGRAM_UPAZILAS.map((uz) => (
            <option key={uz} value={uz}>{uz}</option>
          ))}
        </select>
      </section>

      {/* ── Analyze Button ── */}
      <Button
        onClick={handleAnalyze}
        disabled={(!imageBase64 && !description.trim()) || analyzeMutation.isPending}
        size="lg"
        className="w-full"
      >
        <ScanSearch className="h-5 w-5" />
        {analyzeMutation.isPending
          ? t("action.loading")
          : language === "bn" ? "বিশ্লেষণ করুন" : "Analyze"}
      </Button>

      {/* ── Loading Skeleton ── */}
      {analyzeMutation.isPending && (
        <Card>
          <CardContent className="space-y-4 p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Error State ── */}
      {analyzeMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {language === "bn" ? "বিশ্লেষণ ব্যর্থ হয়েছে" : "Analysis Failed"}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {language === "bn" ? "আবার চেষ্টা করুন" : "Please try again"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => analyzeMutation.mutate()}>
              {t("action.retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Results ── */}
      {result && !analyzeMutation.isPending && (
        <section className="space-y-4">
          <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {language === "bn" ? "বিশ্লেষণ ফলাফল" : "Analysis Result"}
                </CardTitle>
                <Badge variant="success">
                  {toBengaliNumber(Math.round(result.confidence * 100))}% {t("disease.confidence")}
                </Badge>
              </div>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
          </Card>

          {/* Detailed Sections */}
          {result.details && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {language === "bn" ? "সমস্যা → কারণ" : "Problem → Cause"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground" dir="auto">
                  {result.details}
                </p>
              </CardContent>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {language === "bn" ? "প্রতিকার ও সুপারিশ" : "Remedy & Recommendations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed text-foreground" dir="auto">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Save Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSave}
            disabled={saved}
          >
            <Save className="h-4 w-4" />
            {saved
              ? (language === "bn" ? "সংরক্ষিত!" : "Saved!")
              : (language === "bn" ? "ফলাফল সংরক্ষণ করুন" : "Save Result")}
          </Button>
        </section>
      )}
    </div>
  )
}
