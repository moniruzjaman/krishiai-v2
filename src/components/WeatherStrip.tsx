import {
  Sun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ── Weather data types ──
export interface WeatherData {
  temperature: number       // °C
  humidity: number          // %
  windSpeed: number         // km/h
  weatherCode: number       // Open-Meteo WMO code
  isDay: boolean
  precipitationChance: number // 0-100 %
  description?: string        // override Bengali description
}

// ── Open-Meteo WMO weather code → Bengali description + icon ──
interface WeatherInfo {
  labelBn: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>
}

const weatherCodeMap: Record<number, WeatherInfo> = {
  0: { labelBn: "পরিষ্কার আকাশ", Icon: Sun },
  1: { labelBn: "মূলত পরিষ্কার", Icon: Sun },
  2: { labelBn: "আংশিক মেঘলা", Icon: Cloud },
  3: { labelBn: "মেঘলা", Icon: Cloud },
  45: { labelBn: "কুয়াশা", Icon: CloudFog },
  48: { labelBn: "কুয়াশা (তুষারাবৃত)", Icon: CloudFog },
  51: { labelBn: "হালকা গুঁড়িগুঁড়ি", Icon: CloudDrizzle },
  53: { labelBn: "মাঝারি গুঁড়িগুঁড়ি", Icon: CloudDrizzle },
  55: { labelBn: "ঘন গুঁড়িগুঁড়ি", Icon: CloudDrizzle },
  56: { labelBn: "হিমায়িত গুঁড়িগুঁড়ি", Icon: CloudDrizzle },
  57: { labelBn: "ঘন হিমায়িত গুঁড়িগুঁড়ি", Icon: CloudDrizzle },
  61: { labelBn: "হালকা বৃষ্টি", Icon: CloudRain },
  63: { labelBn: "মাঝারি বৃষ্টি", Icon: CloudRain },
  65: { labelBn: "ভারী বৃষ্টি", Icon: CloudRain },
  66: { labelBn: "হিমায়িত বৃষ্টি", Icon: CloudRain },
  67: { labelBn: "ভারী হিমায়িত বৃষ্টি", Icon: CloudRain },
  71: { labelBn: "হালকা তুষারপাত", Icon: CloudSnow },
  73: { labelBn: "মাঝারি তুষারপাত", Icon: CloudSnow },
  75: { labelBn: "ভারী তুষারপাত", Icon: CloudSnow },
  77: { labelBn: "তুষার দানা", Icon: CloudSnow },
  80: { labelBn: "হালকা ঝর্ণা বৃষ্টি", Icon: CloudRain },
  81: { labelBn: "মাঝারি ঝর্ণা বৃষ্টি", Icon: CloudRain },
  82: { labelBn: "ভারী ঝর্ণা বৃষ্টি", Icon: CloudRain },
  85: { labelBn: "হালকা তুষার ঝর্ণা", Icon: CloudSnow },
  86: { labelBn: "ভারী তুষার ঝর্ণা", Icon: CloudSnow },
  95: { labelBn: "বজ্রপাত", Icon: CloudLightning },
  96: { labelBn: "বজ্রপাত ও শিলা", Icon: CloudLightning },
  99: { labelBn: "বজ্রপাত ও ভারী শিলা", Icon: CloudLightning },
}

function getWeatherInfo(code: number): WeatherInfo {
  return weatherCodeMap[code] ?? { labelBn: "অজানা", Icon: Cloud }
}

interface WeatherStripProps {
  weather: WeatherData
  compact?: boolean
  className?: string
}

export function WeatherStrip({ weather, compact = false, className }: WeatherStripProps) {
  const info = getWeatherInfo(weather.weatherCode)
  const description = weather.description ?? info.labelBn
  const Icon = info.Icon
  const hasRainAlert = weather.precipitationChance >= 40

  // ── Mini / Compact Mode ──
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-primary-50/70 px-3 py-1.5 text-xs",
          className
        )}
      >
        <Icon className="h-4 w-4 text-primary-600 shrink-0" />
        <span className="font-semibold text-foreground">{weather.temperature}°C</span>
        <span className="text-muted-foreground truncate">{description}</span>
        {hasRainAlert && (
          <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
            বৃষ্টি
          </Badge>
        )}
      </div>
    )
  }

  // ── Full Mode ──
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-gradient-to-br from-primary-50 to-white p-4 shadow-sm",
        className
      )}
    >
      {/* Top row: icon + temp + description */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 shrink-0">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              {weather.temperature}°C
            </span>
            {hasRainAlert && (
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                <AlertTriangle className="mr-0.5 h-3 w-3" />
                বৃষ্টি সতর্কতা
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
      </div>

      {/* Bottom row: stats */}
      <div className="mt-3 flex items-center gap-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5 text-blue-400" />
          <span>{weather.humidity}% আর্দ্রতা</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5 text-gray-400" />
          <span>{weather.windSpeed} কিমি/ঘণ্টা</span>
        </div>
        {weather.precipitationChance > 0 && (
          <div className="flex items-center gap-1">
            <CloudRain className="h-3.5 w-3.5 text-blue-400" />
            <span>{weather.precipitationChance}% বৃষ্টি</span>
          </div>
        )}
      </div>
    </div>
  )
}
