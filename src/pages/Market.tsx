import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, WifiOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocationStore } from "@/store/useLocationStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { getMarketPrices, type MarketData, type CommodityPrice } from "@/services/marketService"
import { BD_DISTRICTS, COMMODITY_MAP } from "@/lib/constants"
import { toBengaliNumber, formatRelativeTime } from "@/lib/bengali"
import { cn } from "@/lib/utils"

// ── Commodity categories ──
const categories = [
  { key: "all", label: "সব", labelEn: "All" },
  { key: "grain", label: "শস্য", labelEn: "Grains" },
  { key: "vegetable", label: "সবজি", labelEn: "Vegetables" },
  { key: "fruit", label: "ফল", labelEn: "Fruits" },
  { key: "spice", label: "মসলা", labelEn: "Spices" },
]

// ── Category mapping for commodities ──
const commodityCategory: Record<string, string> = {
  rice: "grain", wheat: "grain", lentil: "grain", chickpea: "grain", mustard: "grain",
  potato: "vegetable", onion: "vegetable", garlic: "spice", ginger: "spice",
  turmeric: "spice", chili: "spice", tomato: "vegetable", brinjal: "vegetable",
  cauliflower: "vegetable", cabbage: "vegetable", okra: "vegetable", radish: "vegetable",
  banana: "fruit", mango: "fruit", papaya: "fruit", jute: "grain",
}

function getCategoryForCommodity(name: string): string {
  return commodityCategory[name.toLowerCase().trim()] ?? "grain"
}

// ── Time threshold for stale data (2 hours) ──
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000

export default function Market() {
  const { district, setDistrict } = useLocationStore()
  const { language, t } = useSettingsStore()

  const [selectedDistrict, setSelectedDistrict] = useState(district || "কুড়িগ্রাম")
  const [activeCategory, setActiveCategory] = useState("all")

  // ── Market data query ──
  const marketQuery = useQuery({
    queryKey: ["market", selectedDistrict],
    queryFn: () => getMarketPrices(selectedDistrict, "retail"),
    staleTime: 30 * 60 * 1000,
  })

  const marketData = marketQuery.data
  const isStale = marketData
    ? Date.now() - new Date(marketData.date).getTime() > STALE_THRESHOLD_MS
    : false

  // Filter commodities by category
  const filteredCommodities = marketData?.commodities.filter((c) => {
    if (activeCategory === "all") return true
    return getCategoryForCommodity(c.commodity) === activeCategory
  }) ?? []

  return (
    <div className="space-y-5 p-4">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {t("market.title")}
        </h1>
      </div>

      {/* ── District Selector ── */}
      <section>
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value)
            setDistrict(e.target.value)
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {BD_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </section>

      {/* ── Category Filter ── */}
      <section>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                activeCategory === cat.key
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-border bg-white text-muted-foreground hover:border-primary-200 hover:text-primary-600"
              )}
            >
              {language === "bn" ? cat.label : cat.labelEn}
            </button>
          ))}
        </div>
      </section>

      {/* ── Last Updated + Offline Badge ── */}
      {marketData && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {language === "bn" ? "সর্বশেষ হালনাগাদ" : "Last updated"}: {" "}
            {formatRelativeTime(new Date(marketData.date))}
          </span>
          {isStale && (
            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
              <WifiOff className="h-3 w-3" />
              {language === "bn" ? "অফলাইন ডেটা" : "Offline data"}
            </Badge>
          )}
        </div>
      )}

      {/* ── Loading Skeletons ── */}
      {marketQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Error State ── */}
      {marketQuery.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-red-700">
              {language === "bn" ? "বাজারের তথ্য লোড করতে সমস্যা হয়েছে" : "Failed to load market data"}
            </p>
            <Button variant="outline" size="sm" onClick={() => marketQuery.refetch()}>
              <RefreshCw className="h-3 w-3" />
              {t("action.retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Commodity Price Cards ── */}
      {filteredCommodities.length > 0 && (
        <section className="space-y-3">
          {filteredCommodities.map((commodity) => {
            const trendDirection =
              commodity.change > 0 ? "up" : commodity.change < 0 ? "down" : "stable"
            const TrendIcon =
              trendDirection === "up"
                ? TrendingUp
                : trendDirection === "down"
                ? TrendingDown
                : Minus

            const trendColor =
              trendDirection === "up"
                ? "text-red-500"
                : trendDirection === "down"
                ? "text-green-600"
                : "text-gray-400"

            return (
              <Card key={commodity.commodity} className="transition-all hover:shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    {/* Left: Name + Price */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {commodity.bengaliName}
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-foreground">
                          ৳{toBengaliNumber(commodity.avgPrice)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          /{commodity.unit}
                        </span>
                      </div>
                    </div>

                    {/* Right: Trend + Range */}
                    <div className="flex flex-col items-end gap-1">
                      <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
                        <TrendIcon className="h-4 w-4" />
                        <span>
                          {trendDirection === "up" && "+"}
                          {toBengaliNumber(Math.abs(commodity.change))}%
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {toBengaliNumber(commodity.minPrice)} - {toBengaliNumber(commodity.maxPrice)} ৳
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}

      {/* ── Empty State ── */}
      {marketData && filteredCommodities.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "এই বিভাগে কোনো পণ্য নেই"
              : "No commodities in this category"}
          </p>
        </div>
      )}
    </div>
  )
}
