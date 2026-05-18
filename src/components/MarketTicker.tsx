import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Commodity data type ──
export interface Commodity {
  nameBn: string          // Bengali name e.g. "ধান"
  nameEn: string          // English name e.g. "Rice"
  price: number           // Price in BDT (৳)
  unit: string            // Unit e.g. "কেজি", "মণ"
  change: number          // Price change: positive = up, negative = down, 0 = stable
}

interface MarketTickerProps {
  commodities: Commodity[]
  className?: string
}

export function MarketTicker({ commodities, className }: MarketTickerProps) {
  const displayItems = commodities.slice(0, 5)

  if (displayItems.length === 0) {
    return (
      <div className={cn("rounded-xl border border-border bg-white p-4 text-center text-sm text-muted-foreground", className)}>
        বাজারের তথ্য লোড হচ্ছে...
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Section label */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          বাজার মূল্য
        </h3>
        <span className="text-[10px] text-muted-foreground">
          ৳ প্রতি ইউনিট
        </span>
      </div>

      {/* Horizontal scrollable ticker */}
      <div className="-mx-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-1 pb-1">
          {displayItems.map((item) => {
            const trendDirection =
              item.change > 0 ? "up" : item.change < 0 ? "down" : "stable"
            const TrendIcon =
              trendDirection === "up"
                ? TrendingUp
                : trendDirection === "down"
                ? TrendingDown
                : Minus

            const trendColor =
              trendDirection === "up"
                ? "text-red-500"       // price up = bad for buyers (red in BD)
                : trendDirection === "down"
                ? "text-green-600"     // price down = good for buyers (green)
                : "text-gray-400"

            return (
              <div
                key={item.nameEn}
                className="flex min-w-[130px] flex-col gap-1 rounded-xl border border-border bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary-200"
              >
                {/* Commodity name */}
                <span className="text-xs font-semibold text-foreground truncate">
                  {item.nameBn}
                </span>

                {/* Price + unit */}
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-foreground">
                    ৳{item.price.toLocaleString("bn-BD")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    /{item.unit}
                  </span>
                </div>

                {/* Trend indicator */}
                <div className={cn("flex items-center gap-0.5 text-[11px] font-medium", trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span>
                    {trendDirection === "up" && "+"}
                    {item.change !== 0 ? Math.abs(item.change) : "—"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
