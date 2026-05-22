import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  MessageSquare,
  ScanSearch,
  Bug,
  CloudSun,
  TrendingUp,
  Layers,
  MapPin,
  Sprout,
  ChevronRight,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WeatherStrip } from "@/components/WeatherStrip"
import { MarketTicker, type Commodity } from "@/components/MarketTicker"
import LocationMap from "@/components/LocationMap"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { getWeather, getAgAdvisory, type WeatherData as ApiWeatherData } from "@/services/weatherService"
import { getMarketPrices, type CommodityPrice } from "@/services/marketService"
import { toBengaliNumber, toBengaliDate, BENGALI_MONTHS, BENGALI_DAYS } from "@/lib/bengali"
import { CROP_LIST } from "@/lib/constants"
import { MARKET_DEFAULT_DISTRICT } from "@/lib/appConfig"
import type { WeatherData as StripWeatherData } from "@/components/WeatherStrip"

// ── Seasonal advisory logic (dynamic, based on month) ───────────
function getSeasonalAdvisory(): { crop: string; advisory: string; emoji: string } {
  const month = new Date().getMonth() // 0-indexed
  const seasonAdvisories: Record<number, { crop: string; advisory: string; emoji: string }> = {
    0: { crop: "বোরো ধান", advisory: "বোরো মৌসুমের চারা রোপণের উপযুক্ত সময়। সেচ ব্যবস্থা নিশ্চিত করুন।", emoji: "🌾" },
    1: { crop: "বোরো ধান ও গম", advisory: "সেচ দিন এবং সার প্রয়োগ করুন। ঠান্ডা থেকে চারা রক্ষা করুন।", emoji: "🌾" },
    2: { crop: "বোরো ধান ও সবজি", advisory: "সার প্রয়োগ ও পোকামাকড় পরিদর্শন করুন। বসন্তের সবজি লাগান।", emoji: "🥬" },
    3: { crop: "ঔস ধান", advisory: "ঔস ধানের বীজ বপন শুরু করুন। জমি তৈরি ও সার প্রয়োগ করুন।", emoji: "🌱" },
    4: { crop: "ঔস ধান ও পাট", advisory: "ঔস ধানের চারা রোপণ করুন। পাটের বীজ বপনের সময়।", emoji: "🪢" },
    5: { crop: "পাট ও সবজি", advisory: "পাটের যত্ন নিন। বর্ষার সবজি চাষ শুরু করুন।", emoji: "🪢" },
    6: { crop: "আমন ধান", advisory: "আমন ধানের বীজতলা তৈরি করুন। বর্ষায় নিষ্কাশন নিশ্চিত করুন।", emoji: "🌾" },
    7: { crop: "আমন ধান", advisory: "আমন ধানের চারা রোপণ করুন। পানি নিষ্কাশন ও সার ব্যবস্থা করুন।", emoji: "🌾" },
    8: { crop: "আমন ধান", advisory: "আমন ধানে সার ও কীটনাশক প্রয়োগ করুন। পানির ব্যবস্থা রাখুন।", emoji: "🌾" },
    9: { crop: "আমন ধান ও সরিষা", advisory: "আমন ধান কাটার প্রস্তুতি নিন। সরিষার বীজ বপন শুরু করুন।", emoji: "🌼" },
    10: { crop: "রবি শস্য", advisory: "সরিষা, গম, আলু ও সবজি চাষ শুরু করুন। জমি তৈরি করুন।", emoji: "🥔" },
    11: { crop: "রবি শস্য", advisory: "সবজি ও রবি শস্যের যত্ন নিন। সেচ দিন ও মালচিং করুন।", emoji: "🥦" },
  }
  return seasonAdvisories[month] ?? seasonAdvisories[0]
}

// ── Quick access items ──
const quickAccessItems = [
  { label: "চ্যাট", labelEn: "Chat", icon: MessageSquare, path: "/chat", color: "bg-green-100 text-green-700" },
  { label: "ফসল বিশ্লেষণ", labelEn: "Analyzer", icon: ScanSearch, path: "/analyzer", color: "bg-amber-100 text-amber-700" },
  { label: "রোগ শনাক্তকরণ", labelEn: "Disease", icon: Bug, path: "/disease", color: "bg-red-100 text-red-700" },
  { label: "আবহাওয়া", labelEn: "Weather", icon: CloudSun, path: "/weather", color: "bg-blue-100 text-blue-700" },
  { label: "বাজার দর", labelEn: "Market", icon: TrendingUp, path: "/market", color: "bg-purple-100 text-purple-700" },
  { label: "মাটি বিশ্লেষণ", labelEn: "Soil", icon: Layers, path: "/soil", color: "bg-earth-100 text-earth-700" },
]

export default function Home() {
  const navigate = useNavigate()
  const { gps, upazila, district, locationLabel, requestGps, isLocating } = useLocationStore()
  const { language, setLanguage, t } = useSettingsStore()

  // ── Weather query ──
  const weatherQuery = useQuery({
    queryKey: ["weather", gps?.lat, gps?.lon],
    queryFn: () => {
      if (!gps) throw new Error("No GPS")
      return getWeather(gps.lat, gps.lon)
    },
    enabled: !!gps,
    staleTime: 10 * 60 * 1000,
  })

  // ── Market query — uses user's district or default ──
  const marketDistrict = district || MARKET_DEFAULT_DISTRICT
  const marketQuery = useQuery({
    queryKey: ["market", marketDistrict],
    queryFn: () => getMarketPrices(marketDistrict, "retail"),
    staleTime: 30 * 60 * 1000,
  })

  // Transform API weather data to WeatherStrip format
  const stripWeather: StripWeatherData | null = weatherQuery.data
    ? {
        temperature: Math.round(weatherQuery.data.current.temperature2m),
        humidity: weatherQuery.data.current.relativeHumidity2m,
        windSpeed: Math.round(weatherQuery.data.current.windSpeed10m),
        weatherCode: weatherQuery.data.current.weatherCode,
        isDay: true,
        precipitationChance: weatherQuery.data.daily.precipitationProbabilityMax[0] ?? 0,
      }
    : null

  // Transform market data to MarketTicker format
  const tickerCommodities: Commodity[] = marketQuery.data
    ? marketQuery.data.commodities.slice(0, 5).map((c: CommodityPrice) => ({
        nameBn: c.bengaliName,
        nameEn: c.commodity,
        price: c.avgPrice,
        unit: c.unit,
        change: c.change,
      }))
    : []

  const seasonal = getSeasonalAdvisory()

  const handleRequestGps = async () => {
    try {
      await requestGps()
    } catch {
      // Error handled within store
    }
  }

  // Current date in Bengali
  const now = new Date()
  const dateStr = `${BENGALI_DAYS[now.getDay()]}, ${toBengaliNumber(now.getDate())} ${BENGALI_MONTHS[now.getMonth()]}`

  return (
    <div className="space-y-5 p-4">
      {/* ── Location & Date Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={cn("h-4 w-4", gps ? "text-primary-600" : "text-muted-foreground")} />
          <span className="text-sm font-medium text-foreground">
            {locationLabel || (language === "bn" ? "অবস্থান নির্ণয় হচ্ছে..." : "Locating...")}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* ── GPS Prompt (only if not located) ── */}
      {!gps && (
        <Card className="border-primary-200 bg-primary-50/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {language === "bn" ? "আপনার অবস্থান শেয়ার করুন" : "Share your location"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "bn"
                  ? "আপনার এলাকার আবহাওয়া ও পরামর্শ পেতে"
                  : "To get local weather & advisories"}
              </p>
            </div>
            <Button size="sm" onClick={handleRequestGps} disabled={isLocating}>
              <MapPin className="h-4 w-4" />
              {isLocating
                ? (language === "bn" ? "খুঁজছি..." : "Locating...")
                : (language === "bn" ? "অনুমতি দিন" : "Allow")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Map Card ── */}
      <section>
        <LocationMap height={180} zoom={12} />
        {locationLabel && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {locationLabel}
          </p>
        )}
      </section>

      {/* ── Weather Strip ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("weather.today")}
        </h2>
        {weatherQuery.isLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : stripWeather ? (
          <div className="cursor-pointer" onClick={() => navigate("/weather")} role="button" tabIndex={0}>
            <WeatherStrip weather={stripWeather} />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <CloudSun className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "আবহাওয়া তথ্য পেতে GPS চালু করুন" : "Enable GPS for weather data"}
              </p>
              <Button variant="outline" size="sm" onClick={handleRequestGps}>
                <MapPin className="h-4 w-4" />
                {language === "bn" ? "অবস্থান দিন" : "Share Location"}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Market Ticker ── */}
      <section>
        {marketQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : (
          <MarketTicker commodities={tickerCommodities} />
        )}
        {marketQuery.data && (
          <div className="mt-1 text-right">
            <button
              onClick={() => navigate("/market")}
              className="text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              {language === "bn" ? "সব দাম দেখুন" : "View all prices"} →
            </button>
          </div>
        )}
      </section>

      {/* ── Quick Access Grid ── */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === "bn" ? "দ্রুত অ্যাক্সেস" : "Quick Access"}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickAccessItems.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.path}
                className="cursor-pointer border-border/60 transition-all duration-200 hover:border-primary-300 hover:shadow-md active:scale-[0.97]"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="flex flex-col items-center gap-2 p-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-center text-xs font-medium leading-tight text-foreground">
                    {language === "bn" ? item.label : item.labelEn}
                  </span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Seasonal Advisory ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === "bn" ? "মৌসুমি পরামর্শ" : "Seasonal Advisory"}
        </h2>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl shrink-0">
                {seasonal.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-[10px]">
                    {BENGALI_MONTHS[new Date().getMonth()]}
                  </Badge>
                  <span className="text-sm font-bold text-foreground">{seasonal.crop}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {seasonal.advisory}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/calendar")}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-green-200 bg-white py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              {language === "bn" ? "কৃষি ক্যালেন্ডার দেখুন" : "View Agri Calendar"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </section>

      {/* ── Location Footer ── */}
      {locationLabel && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{locationLabel}</span>
        </div>
      )}
    </div>
  )
}

// Helper — re-import cn to avoid error
function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ")
}
