import { useQuery } from "@tanstack/react-query"
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  AlertTriangle,
  Sprout,
  Gauge,
  Leaf,
  CloudDrizzle,
  Flame,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WeatherStrip } from "@/components/WeatherStrip"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { getWeather, getAgAdvisory, type WeatherData as ApiWeatherData } from "@/services/weatherService"
import { toBengaliNumber, BENGALI_DAYS, BENGALI_MONTHS } from "@/lib/bengali"
import { WEATHER_CODES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { WeatherData as StripWeatherData } from "@/components/WeatherStrip"

export default function Weather() {
  const { gps, requestGps } = useLocationStore()
  const { language, t } = useSettingsStore()

  // ── Weather query ──
  const weatherQuery = useQuery({
    queryKey: ["weather-full", gps?.lat, gps?.lon],
    queryFn: () => {
      if (!gps) throw new Error("No GPS")
      return getWeather(gps.lat, gps.lon)
    },
    enabled: !!gps,
    staleTime: 10 * 60 * 1000,
  })

  const weather = weatherQuery.data

  // Transform for WeatherStrip
  const stripWeather: StripWeatherData | null = weather
    ? {
        temperature: Math.round(weather.current.temperature2m),
        humidity: weather.current.relativeHumidity2m,
        windSpeed: Math.round(weather.current.windSpeed10m),
        weatherCode: weather.current.weatherCode,
        isDay: true,
        precipitationChance: weather.daily.precipitationProbabilityMax[0] ?? 0,
      }
    : null

  // Agricultural advisory
  const advisory = weather ? getAgAdvisory(weather) : null

  // Rain alert check
  const hasRainAlert = weather
    ? (weather.daily.precipitationSum[0] ?? 0) > 10 || (weather.daily.precipitationProbabilityMax[0] ?? 0) > 60
    : false

  // Calculate agricultural indices
  const et0Today = weather?.daily.et0Evapotranspiration[0] ?? 0
  const precipToday = weather?.daily.precipitationSum[0] ?? 0
  const needsIrrigation = et0Today > 4 && precipToday < 5

  // Soil moisture from hourly
  const soilMoisture = weather?.hourly?.soilMoisture0To1cm
    ? weather.hourly.soilMoisture0To1cm.reduce((a, b) => a + b, 0) /
      weather.hourly.soilMoisture0To1cm.length
    : null

  // Growing degree days (base 10°C for rice)
  const gdd = weather
    ? Math.max(0, ((weather.daily.temperature2mMax[0] + weather.daily.temperature2mMin[0]) / 2) - 10)
    : 0

  // Fungal disease risk from leaf wetness (using humidity proxy)
  const leafWetnessRisk = weather
    ? weather.current.relativeHumidity2m > 85
      ? "high"
      : weather.current.relativeHumidity2m > 70
      ? "medium"
      : "low"
    : null

  // VPD calculation
  const vpd = weather
    ? (() => {
        const t = weather.current.temperature2m
        const rh = weather.current.relativeHumidity2m / 100
        const svp = 0.6108 * Math.exp((17.27 * t) / (t + 237.3))
        return svp * (1 - rh)
      })()
    : null

  if (!gps) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CloudDrizzle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold text-foreground">
          {language === "bn" ? "আবহাওয়া তথ্য পাওয়া যায়নি" : "Weather data unavailable"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === "bn" ? "অবস্থান শেয়ার করুন" : "Share your location"}
        </p>
        <Button className="mt-4" onClick={() => requestGps()}>
          {language === "bn" ? "অবস্থান দিন" : "Share Location"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4">
      {/* ── Rain Alert Banner ── */}
      {hasRainAlert && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {language === "bn" ? "বৃষ্টির সতর্কতা" : "Rain Alert"}
            </p>
            <p className="text-xs text-blue-600">
              {language === "bn"
                ? "আজ বৃষ্টির সম্ভাবনা রয়েছে। কীটনাশক স্প্রে স্থগিত করুন।"
                : "Rain expected today. Postpone pesticide spraying."}
            </p>
          </div>
        </div>
      )}

      {/* ── Current Conditions ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("weather.today")}
        </h2>
        {weatherQuery.isLoading ? (
          <Skeleton className="h-36 w-full rounded-xl" />
        ) : stripWeather ? (
          <WeatherStrip weather={stripWeather} />
        ) : null}
      </section>

      {/* ── Current Details Grid ── */}
      {weather && (
        <section>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("weather.temperature")}</p>
                  <p className="text-sm font-bold text-foreground">
                    {toBengaliNumber(Math.round(weather.current.temperature2m))}°C
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Droplets className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("weather.humidity")}</p>
                  <p className="text-sm font-bold text-foreground">
                    {toBengaliNumber(weather.current.relativeHumidity2m)}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Wind className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("weather.wind")}</p>
                  <p className="text-sm font-bold text-foreground">
                    {toBengaliNumber(Math.round(weather.current.windSpeed10m))} কিমি/ঘণ্টা
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                  <CloudRain className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("weather.rainfall")}</p>
                  <p className="text-sm font-bold text-foreground">
                    {toBengaliNumber(parseFloat(precipToday.toFixed(1)))} মিমি
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── 7-Day Forecast ── */}
      {weather && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("weather.weekly")}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {weather.daily.date.map((dateStr, idx) => {
              const date = new Date(dateStr + "T00:00:00")
              const dayName = BENGALI_DAYS[date.getDay()]
              const isToday = idx === 0
              const weatherInfo = WEATHER_CODES[weather.daily.weatherCode[idx]]
              return (
                <Card
                  key={dateStr}
                  className={cn(
                    "min-w-[100px] shrink-0",
                    isToday && "border-primary-300 bg-primary-50/50"
                  )}
                >
                  <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {isToday ? t("weather.today") : dayName}
                    </span>
                    <span className="text-lg">{weatherInfo?.icon ?? "🌤️"}</span>
                    <span className="text-xs text-muted-foreground">
                      {weatherInfo?.bengali?.split(" ").slice(0, 2).join(" ") ?? ""}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-foreground">
                        {toBengaliNumber(Math.round(weather.daily.temperature2mMax[idx]))}°
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {toBengaliNumber(Math.round(weather.daily.temperature2mMin[idx]))}°
                      </span>
                    </div>
                    {weather.daily.precipitationProbabilityMax[idx] > 20 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                        💧 {toBengaliNumber(weather.daily.precipitationProbabilityMax[idx])}%
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Agricultural Indices ── */}
      {weather && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {language === "bn" ? "কৃষি সূচক" : "Agricultural Indices"}
          </h2>
          <div className="space-y-3">
            {/* Soil Moisture */}
            {soilMoisture !== null && (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">
                        {language === "bn" ? "মাটির আর্দ্রতা (০-১০ সেমি)" : "Soil Moisture (0-10cm)"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {toBengaliNumber(parseFloat((soilMoisture * 100).toFixed(1)))}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        soilMoisture < 0.2
                          ? "bg-red-400"
                          : soilMoisture < 0.35
                          ? "bg-yellow-400"
                          : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(soilMoisture * 200, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {soilMoisture < 0.2
                      ? language === "bn" ? "মাটি শুষ্ক — সেচ দরকার" : "Soil dry — irrigation needed"
                      : soilMoisture > 0.4
                      ? language === "bn" ? "মাটিতে পানি বেশি — নিষ্কাশন দরকার" : "Excess moisture — drainage needed"
                      : language === "bn" ? "মাটির আর্দ্রতা স্বাভাবিক" : "Soil moisture normal"}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* ET₀ Irrigation Advisory */}
            <Card className={cn(needsIrrigation ? "border-orange-200 bg-orange-50/50" : "border-green-200 bg-green-50/50")}>
              <CardContent className="flex items-center gap-3 p-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  needsIrrigation ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                )}>
                  <Gauge className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {needsIrrigation
                      ? language === "bn" ? "আজ সেচ দরকার" : "Irrigation needed today"
                      : language === "bn" ? "সেচ দরকার নেই" : "No irrigation needed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ET₀: {toBengaliNumber(parseFloat(et0Today.toFixed(1)))} মিমি/দিন • {" "}
                    {language === "bn" ? "বৃষ্টি" : "Rain"}: {toBengaliNumber(parseFloat(precipToday.toFixed(1)))} মিমি
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Growing Degree Days */}
            <Card>
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {language === "bn" ? "বৃদ্ধি ডিগ্রি দিন (GDD)" : "Growing Degree Days"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn"
                      ? `আজকের GDD: ${toBengaliNumber(parseFloat(gdd.toFixed(1)))}°C-দিন (ভিত্তি: ১০°C)`
                      : `Today's GDD: ${gdd.toFixed(1)}°C-days (base: 10°C)`}
                  </p>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {toBengaliNumber(parseFloat(gdd.toFixed(1)))}
                </span>
              </CardContent>
            </Card>

            {/* Leaf Wetness → Fungal Risk */}
            {leafWetnessRisk && (
              <Card className={cn(
                leafWetnessRisk === "high" ? "border-red-200" : leafWetnessRisk === "medium" ? "border-yellow-200" : "border-green-200"
              )}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    leafWetnessRisk === "high" ? "bg-red-100 text-red-600" : leafWetnessRisk === "medium" ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"
                  )}>
                    <Leaf className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {language === "bn" ? "পাতার আর্দ্রতা → ছত্রাক ঝুঁকি" : "Leaf Wetness → Fungal Risk"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === "bn"
                        ? `আর্দ্রতা ${toBengaliNumber(weather.current.relativeHumidity2m)}%`
                        : `Humidity ${weather.current.relativeHumidity2m}%`}
                    </p>
                  </div>
                  <Badge className={cn(
                    leafWetnessRisk === "high" ? "bg-red-100 text-red-800" : leafWetnessRisk === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                  )}>
                    {leafWetnessRisk === "high"
                      ? (language === "bn" ? "উচ্চ" : "High")
                      : leafWetnessRisk === "medium"
                      ? (language === "bn" ? "মাঝারি" : "Medium")
                      : (language === "bn" ? "নিম্ন" : "Low")}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Vapor Pressure Deficit */}
            {vpd !== null && (
              <Card>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Sprout className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      VPD {language === "bn" ? "(বাষ্প চাপ ঘাটতি)" : "(Vapor Pressure Deficit)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {vpd < 0.4
                        ? (language === "bn" ? "ট্রান্সপিরেশন ধীর, ছত্রাকের ঝুঁকি" : "Slow transpiration, fungal risk")
                        : vpd > 1.2
                        ? (language === "bn" ? "উচ্চ বাষ্পীভবন, সেচ দরকার" : "High evaporation, irrigation needed")
                        : (language === "bn" ? "স্বাভাবিক পরিসর" : "Normal range")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-purple-700">
                    {toBengaliNumber(parseFloat(vpd.toFixed(2)))} kPa
                  </span>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── Agricultural Advisory ── */}
      {advisory && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("weather.advisory")}
          </h2>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              {advisory.split("\n\n").map((para, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-foreground" dir="auto">
                  {para}
                </p>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ── Loading State ── */}
      {weatherQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {/* ── Error State ── */}
      {weatherQuery.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-700">
              {language === "bn" ? "আবহাওয়া তথ্য লোড করতে সমস্যা হয়েছে" : "Failed to load weather data"}
            </p>
            <Button variant="outline" size="sm" onClick={() => weatherQuery.refetch()}>
              {t("action.retry")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
