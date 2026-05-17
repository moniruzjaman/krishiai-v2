import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Layers,
  MapPin,
  FlaskConical,
  ChevronRight,
  RefreshCw,
  Edit,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { getSoilData, getSoilType, getFertilizerRecommendation } from "@/services/soilService"
import { SOIL_TYPES } from "@/lib/constants"
import { toBengaliNumber } from "@/lib/bengali"
import { cn } from "@/lib/utils"

export default function Soil() {
  const { gps, upazila, soilCache, setSoilCache, requestGps } = useLocationStore()
  const { language, t } = useSettingsStore()

  const [manualLat, setManualLat] = useState("")
  const [manualLon, setManualLon] = useState("")
  const [useManual, setUseManual] = useState(false)
  const [labMode, setLabMode] = useState(false)
  const [labValues, setLabValues] = useState({
    ph: "",
    organicCarbon: "",
    clay: "",
    sand: "",
    silt: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
  })
  const [selectedCrop, setSelectedCrop] = useState("ধান")

  // ── Soil data query ──
  const lat = useManual ? parseFloat(manualLat) : gps?.lat
  const lon = useManual ? parseFloat(manualLon) : gps?.lon

  const soilQuery = useQuery({
    queryKey: ["soil", lat, lon],
    queryFn: () => {
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) throw new Error("Invalid coordinates")
      return getSoilData(lat, lon)
    },
    enabled: !!lat && !!lon && !isNaN(lat!) && !isNaN(lon!),
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  })

  // Use cached soil data if available and query hasn't loaded yet
  const soilData = soilQuery.data ?? soilCache

  // ── Fertilizer recommendation mutation ──
  const fertilizerMutation = useMutation({
    mutationFn: () => {
      if (!soilData) throw new Error("No soil data")
      return getFertilizerRecommendation(soilData, selectedCrop)
    },
  })

  // Cache soil data when loaded
  if (soilQuery.data && !soilCache) {
    setSoilCache(soilQuery.data)
  }

  // Soil type info
  const soilTypeKey = soilData
    ? getSoilType(soilData.clay, soilData.sand, soilData.silt)
    : null
  const soilTypeInfo = soilTypeKey ? SOIL_TYPES[soilTypeKey] : null

  // Handle GPS detect
  const handleGpsDetect = async () => {
    try {
      await requestGps()
      setUseManual(false)
    } catch {
      // Error handled in store
    }
  }

  // Handle lab value submission
  const handleLabSubmit = () => {
    if (!soilData) return
    const override = {
      ...soilData,
      ph: labValues.ph ? parseFloat(labValues.ph) : soilData.ph,
      organicCarbon: labValues.organicCarbon ? parseFloat(labValues.organicCarbon) : soilData.organicCarbon,
      clay: labValues.clay ? parseFloat(labValues.clay) : soilData.clay,
      sand: labValues.sand ? parseFloat(labValues.sand) : soilData.sand,
      silt: labValues.silt ? parseFloat(labValues.silt) : soilData.silt,
      nitrogen: labValues.nitrogen ? parseFloat(labValues.nitrogen) : soilData.nitrogen,
      phosphorus: labValues.phosphorus ? parseFloat(labValues.phosphorus) : soilData.phosphorus,
      potassium: labValues.potassium ? parseFloat(labValues.potassium) : soilData.potassium,
    }
    setSoilCache(override)
    setLabMode(false)
  }

  return (
    <div className="space-y-5 p-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {t("soil.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {language === "bn"
            ? "আপনার এলাকার মাটির গুণাগুণ জানুন"
            : "Know your soil quality"}
        </p>
      </div>

      {/* ── GPS Auto-detect ── */}
      <Card className="border-primary-200 bg-primary-50/40">
        <CardContent className="p-4">
          <Button
            onClick={handleGpsDetect}
            className="w-full"
            size="lg"
            disabled={soilQuery.isLoading}
          >
            <MapPin className="h-5 w-5" />
            {language === "bn" ? "আমার অবস্থান থেকে মাটি বিশ্লেষণ" : "Analyze Soil from My Location"}
          </Button>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {language === "bn" ? "অথবা ম্যানুয়াল স্থানাঙ্ক" : "Or manual coordinates"}
            </span>
            <button
              onClick={() => setUseManual(!useManual)}
              className="text-xs font-medium text-primary-600 hover:underline"
            >
              {useManual
                ? (language === "bn" ? "GPS ব্যবহার করুন" : "Use GPS")
                : (language === "bn" ? "ম্যানুয়াল ইনপুট" : "Manual Input")}
            </button>
          </div>

          {useManual && (
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                step="0.0001"
                placeholder="অক্ষাংশ (Lat)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.0001"
                placeholder="দ্রাঘিমাংশ (Lon)"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="flex-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Loading State ── */}
      {soilQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      )}

      {/* ── Soil Data Display ── */}
      {soilData && !soilQuery.isLoading && (
        <section className="space-y-4">
          {/* Soil Type Classification */}
          {soilTypeInfo && (
            <Card className="border-earth-200 bg-gradient-to-br from-earth-50 to-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-earth-600" />
                    <CardTitle className="text-base">
                      {t("soil.type")}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-earth-700 border-earth-300">
                    USDA: {soilTypeKey?.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-foreground">{soilTypeInfo.bengali}</p>
                <p className="mt-1 text-sm text-muted-foreground">{soilTypeInfo.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Soil Texture Triangle (CSS representation) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {language === "bn" ? "মাটির টেক্সচার সংকেত" : "Soil Texture Composition"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 justify-center py-2">
                {[
                  { label: language === "bn" ? "বেলে" : "Sand", value: soilData.sand, color: "bg-amber-400" },
                  { label: language === "bn" ? "এঁটেল" : "Clay", value: soilData.clay, color: "bg-red-400" },
                  { label: language === "bn" ? "পলি" : "Silt", value: soilData.silt, color: "bg-green-400" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-foreground">
                      {toBengaliNumber(parseFloat(item.value.toFixed(1)))}%
                    </span>
                    <div
                      className={cn("w-12 rounded-t-md transition-all duration-700", item.color)}
                      style={{ height: `${Math.max(item.value * 1.5, 8)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Soil Properties Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">{t("soil.ph")}</p>
                <p className="text-lg font-bold text-foreground">{toBengaliNumber(parseFloat(soilData.ph.toFixed(1)))}</p>
                <p className="text-[10px] text-muted-foreground">
                  {soilData.ph < 5.5 ? (language === "bn" ? "অম্লীয়" : "Acidic")
                    : soilData.ph > 7.5 ? (language === "bn" ? "ক্ষারীয়" : "Alkaline")
                    : (language === "bn" ? "প্রায় নিরপেক্ষ" : "Near Neutral")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">{t("soil.organicCarbon")}</p>
                <p className="text-lg font-bold text-foreground">
                  {toBengaliNumber(parseFloat(soilData.organicCarbon.toFixed(2)))}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {soilData.organicCarbon < 0.5 ? (language === "bn" ? "কম" : "Low")
                    : soilData.organicCarbon > 1.5 ? (language === "bn" ? "ভালো" : "Good")
                    : (language === "bn" ? "মাঝারি" : "Moderate")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">{t("soil.nitrogen")}</p>
                <p className="text-sm font-bold text-foreground">
                  {toBengaliNumber(parseFloat((soilData.nitrogen ?? 0).toFixed(2)))}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">{t("soil.phosphorus")}</p>
                <p className="text-sm font-bold text-foreground">
                  {toBengaliNumber(parseFloat((soilData.phosphorus ?? 0).toFixed(1)))} mg/kg
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground">{t("soil.potassium")}</p>
                <p className="text-sm font-bold text-foreground">
                  {toBengaliNumber(parseFloat((soilData.potassium ?? 0).toFixed(1)))} meq/100g
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lab Override */}
          <Card className="border-dashed">
            <CardContent className="p-3">
              <button
                onClick={() => setLabMode(!labMode)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {language === "bn" ? "ল্যাব টেস্ট ভ্যালু দিন" : "Enter Lab Test Values"}
                  </span>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", labMode && "rotate-90")} />
              </button>

              {labMode && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="pH"
                      type="number"
                      step="0.1"
                      value={labValues.ph}
                      onChange={(e) => setLabValues({ ...labValues, ph: e.target.value })}
                    />
                    <Input
                      placeholder="Organic Carbon %"
                      type="number"
                      step="0.01"
                      value={labValues.organicCarbon}
                      onChange={(e) => setLabValues({ ...labValues, organicCarbon: e.target.value })}
                    />
                    <Input
                      placeholder="Clay %"
                      type="number"
                      step="0.1"
                      value={labValues.clay}
                      onChange={(e) => setLabValues({ ...labValues, clay: e.target.value })}
                    />
                    <Input
                      placeholder="Sand %"
                      type="number"
                      step="0.1"
                      value={labValues.sand}
                      onChange={(e) => setLabValues({ ...labValues, sand: e.target.value })}
                    />
                    <Input
                      placeholder="Silt %"
                      type="number"
                      step="0.1"
                      value={labValues.silt}
                      onChange={(e) => setLabValues({ ...labValues, silt: e.target.value })}
                    />
                    <Input
                      placeholder="Nitrogen %"
                      type="number"
                      step="0.01"
                      value={labValues.nitrogen}
                      onChange={(e) => setLabValues({ ...labValues, nitrogen: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleLabSubmit} size="sm" className="w-full">
                    <Check className="h-4 w-4" />
                    {language === "bn" ? "ভ্যালু আপডেট করুন" : "Update Values"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fertilizer Recommendation */}
          <Card className="border-green-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-green-600" />
                <CardTitle className="text-sm">{t("soil.fertilizer")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {["ধান", "গম", "আলু", "সরিষা"].map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setSelectedCrop(crop)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                      selectedCrop === crop
                        ? "border-green-300 bg-green-100 text-green-800"
                        : "border-border bg-white text-muted-foreground hover:border-green-200"
                    )}
                  >
                    {crop}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => fertilizerMutation.mutate()}
                disabled={fertilizerMutation.isPending}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {fertilizerMutation.isPending
                  ? t("action.loading")
                  : language === "bn"
                  ? `${selectedCrop} এর জন্য সারের পরামর্শ নিন`
                  : `Get fertilizer advice for ${selectedCrop}`}
              </Button>
              {fertilizerMutation.data && (
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-sm leading-relaxed text-foreground" dir="auto">
                    {fertilizerMutation.data}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Error State ── */}
      {soilQuery.isError && !soilCache && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <RefreshCw className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-700">
              {language === "bn" ? "মাটির তথ্য লোড করতে সমস্যা হয়েছে" : "Failed to load soil data"}
            </p>
            <Button variant="outline" size="sm" onClick={() => soilQuery.refetch()}>
              {t("action.retry")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
