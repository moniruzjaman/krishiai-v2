import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react'

interface MarketItem {
  nameBn: string
  name: string
  priceMin: number
  priceMax: number
  unit: string
}

const CATEGORIES: Record<string, string[]> = {
  '🌾 শস্য ও চাল': ['চাল', 'মোটা চাল', 'চিকন চাল', 'বোরো চাল', 'আমন চাল', 'আটা', 'ময়দা', 'গম'],
  '🥔 সবজি': ['আলু', 'পেঁয়াজ', 'রসুন', 'আদা', 'কাঁচা মরিচ', 'শুকনো মরিচ'],
  '🫘 ডাল ও তেল': ['মসুর ডাল', 'মুগ ডাল', 'ডাল', 'সয়াবিন তেল', 'পাম তেল', 'সরিষার তেল'],
  '🍗 প্রাণিজ': ['ব্রয়লার মুরগি', 'গরুর মাংস', 'খাসির মাংস', 'ডিম', 'ইলিশ', 'মাছ'],
  '🧂 অন্যান্য': ['চিনি', 'লবণ'],
}

function categorize(items: MarketItem[]) {
  const result: Record<string, MarketItem[]> = {}
  const used = new Set<number>()

  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    result[cat] = items.filter((item, idx) => {
      if (used.has(idx)) return false
      const match = keywords.some(k => item.nameBn?.includes(k) || item.name?.toLowerCase().includes(k.toLowerCase()))
      if (match) used.add(idx)
      return match
    })
  }

  const uncategorized = items.filter((_, idx) => !used.has(idx))
  if (uncategorized.length) result['📦 অন্যান্য পণ্য'] = uncategorized

  return result
}

export default function Market() {
  const { data, isLoading, isError, dataUpdatedAt, refetch, isFetching } = useQuery({
    queryKey: ['market'],
    queryFn: () => fetch('/api/market').then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  })

  const categories = data?.items ? categorize(data.items) : {}

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-green-900 flex items-center gap-2">
            <ShoppingCart size={22} className="text-amber-600" /> বাজার মূল্য
          </h1>
          {data && (
            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
              <span className={`badge-${data.stale ? 'amber' : 'green'}`}>
                {data.source}
              </span>
              {data.stale && <span className="text-amber-600">পুরনো তথ্য</span>}
              {updatedTime && <span>আপডেট: {updatedTime}</span>}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 border border-green-200 rounded-lg px-3 py-1.5 bg-white hover:bg-green-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          রিফ্রেশ
        </button>
      </div>

      {/* Stale warning */}
      {data?.stale && (
        <div className="advisory-amber flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          DAM ওয়েবসাইট সাময়িক বন্ধ। সর্বশেষ পাওয়া তথ্য দেখানো হচ্ছে।
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      )}

      {isError && (
        <div className="advisory-red">বাজার মূল্য পাওয়া যায়নি। নেটওয়ার্ক সংযোগ পরীক্ষা করুন।</div>
      )}

      {/* Price categories */}
      {Object.entries(categories).map(([cat, items]) => (
        items.length > 0 && (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1">
              <TrendingUp size={14} className="text-amber-600" /> {cat}
            </h2>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-stone-500">পণ্য</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-stone-500">মূল্য</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-stone-500">একক</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {items.map((item, i) => (
                    <tr key={i} className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-stone-800">{item.nameBn || item.name}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-800">
                        ৳{item.priceMin}
                        {item.priceMax !== item.priceMin && `–${item.priceMax}`}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-stone-500">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ))}

      <p className="text-center text-xs text-stone-400">
        তথ্যসূত্র: কৃষি বিপণন অধিদপ্তর (DAM) • WFP/HDX Bangladesh
      </p>
    </div>
  )
}
