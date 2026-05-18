import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import LocationSelector from '../components/LocationSelector'
import {
  MessageCircle, Leaf, Bug, Cloud, ShoppingCart,
  Layers, CalendarDays, TrendingUp, Droplets, Thermometer, Wind
} from 'lucide-react'

const QUICK_LINKS = [
  { to: '/chat',     icon: MessageCircle, label: 'কৃষি পরামর্শ',      color: 'bg-green-600',  desc: 'AI-চালিত কৃষি পরামর্শ নিন' },
  { to: '/disease',  icon: Bug,           label: 'রোগ নির্ণয়',        color: 'bg-red-600',    desc: 'ছবি দেখে রোগ শনাক্ত করুন' },
  { to: '/analyzer', icon: Leaf,          label: 'ফসল বিশ্লেষণ',      color: 'bg-emerald-600',desc: 'ফসলের সমস্যা বিশ্লেষণ' },
  { to: '/weather',  icon: Cloud,         label: 'আবহাওয়া',           color: 'bg-sky-600',    desc: 'সেচ ও স্প্রে পরামর্শ' },
  { to: '/market',   icon: ShoppingCart,  label: 'বাজার মূল্য',       color: 'bg-amber-600',  desc: 'আজকের বাজার দর' },
  { to: '/soil',     icon: Layers,        label: 'মাটি বিশ্লেষণ',     color: 'bg-orange-700', desc: 'GPS থেকে মাটির তথ্য' },
  { to: '/calendar', icon: CalendarDays,  label: 'ফসল ক্যালেন্ডার',  color: 'bg-violet-600', desc: 'রোপণ ও মৌসুম সূচি' },
]

const TIPS = [
  '🌱 IPM পদ্ধতিতে কীটনাশক ব্যবহার কমান — পরিবেশ ও স্বাস্থ্য রক্ষা হবে।',
  '💧 সন্ধ্যায় বা ভোরে সেচ দিন — বাষ্পীভবন কম হবে।',
  '🧪 মাটি পরীক্ষা করে সার দিন — অপচয় রোধ হবে।',
  '📸 রোগের লক্ষণ দেখলে সাথে সাথে ছবি তুলুন।',
  '🌾 BRRI ও BARI-এর অনুমোদিত জাত ব্যবহার করুন।',
]

export default function Home() {
  const { gps, upazila } = useAppStore()
  const lat = gps?.lat ?? 25.8041
  const lon = gps?.lon ?? 89.6393

  const { data: weather } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () => fetch(`/api/weather?lat=${lat}&lon=${lon}`).then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  })

  const { data: market } = useQuery({
    queryKey: ['market'],
    queryFn: () => fetch('/api/market').then(r => r.json()),
    staleTime: 30 * 60 * 1000,
  })

  const tip = TIPS[new Date().getDay() % TIPS.length]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-green-900">কৃষি AI</h1>
          <p className="text-sm text-stone-500">বাংলাদেশের কৃষকদের AI সহায়তা</p>
        </div>
        <LocationSelector />
      </div>

      {/* Weather Strip */}
      {weather?.current && (
        <div className="card bg-gradient-to-r from-green-800 to-green-700 text-white border-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-green-200 text-xs mb-1">{upazila} — আজকের আবহাওয়া</p>
              <p className="text-2xl font-bold">{weather.current.weatherBn}</p>
              <p className="text-green-200 text-xs mt-1">{weather.current.weatherAdvisory}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Thermometer size={18} className="mx-auto text-green-300 mb-1" />
                <p className="text-xl font-semibold">{weather.current.temperature}°C</p>
                <p className="text-xs text-green-300">তাপমাত্রা</p>
              </div>
              <div>
                <Droplets size={18} className="mx-auto text-green-300 mb-1" />
                <p className="text-xl font-semibold">{weather.current.humidity}%</p>
                <p className="text-xs text-green-300">আর্দ্রতা</p>
              </div>
              <div>
                <Wind size={18} className="mx-auto text-green-300 mb-1" />
                <p className="text-xl font-semibold">{weather.current.windSpeed}</p>
                <p className="text-xs text-green-300">km/h বায়ু</p>
              </div>
            </div>
          </div>

          {/* Irrigation advisory */}
          {weather.current.irrigationAdvisory && (
            <div className="mt-3 pt-3 border-t border-green-600 text-sm text-green-100">
              {weather.current.irrigationAdvisory}
            </div>
          )}
        </div>
      )}

      {/* Market ticker */}
      {market?.items?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-stone-700">আজকের বাজার দর</span>
            <span className="badge-amber ml-auto">{market.source}</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
            {market.items.slice(0, 10).map((item: { nameBn: string; priceMin: number; priceMax: number; unit: string }, i: number) => (
              <div key={i} className="flex-shrink-0 text-center min-w-[80px]">
                <p className="text-xs text-stone-500 mb-0.5">{item.nameBn}</p>
                <p className="font-bold text-green-800">
                  ৳{item.priceMin}{item.priceMax !== item.priceMin ? `–${item.priceMax}` : ''}
                </p>
                <p className="text-[10px] text-stone-400">{item.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links grid */}
      <div>
        <h2 className="section-title">সেবাসমূহ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ to, icon: Icon, label, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
            >
              <div className={`${color} text-white rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <p className="font-semibold text-sm text-stone-800">{label}</p>
              <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily tip */}
      <div className="advisory-green">
        <p className="text-xs font-semibold text-green-700 mb-1">💡 আজকের পরামর্শ</p>
        <p className="text-sm">{tip}</p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-stone-400 pb-2">
        DAE কুড়িগ্রাম • BARI • BRRI • BARC নির্দেশিকা অনুযায়ী
      </p>
    </div>
  )
}
