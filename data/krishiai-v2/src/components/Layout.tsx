import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Home, MessageCircle, Leaf, Bug, Cloud,
  ShoppingCart, Layers, CalendarDays, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/',         icon: Home,         label: 'হোম',       labelEn: 'Home' },
  { to: '/chat',     icon: MessageCircle, label: 'পরামর্শ',   labelEn: 'Chat' },
  { to: '/analyzer', icon: Leaf,          label: 'ফসল বিশ্লেষণ', labelEn: 'Analyze' },
  { to: '/disease',  icon: Bug,           label: 'রোগ নির্ণয়', labelEn: 'Disease' },
  { to: '/weather',  icon: Cloud,         label: 'আবহাওয়া',   labelEn: 'Weather' },
  { to: '/market',   icon: ShoppingCart,  label: 'বাজার মূল্য', labelEn: 'Market' },
  { to: '/soil',     icon: Layers,        label: 'মাটি',       labelEn: 'Soil' },
  { to: '/calendar', icon: CalendarDays,  label: 'ফসল ক্যালেন্ডার', labelEn: 'Calendar' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-green-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <div>
              <div className="font-bold text-base leading-tight" style={{ fontFamily: 'Noto Serif Bengali, sans-serif' }}>কৃষি AI</div>
              <div className="text-xs text-green-300 leading-tight">Krishi AI Bangladesh</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'text-green-200 hover:bg-green-800 hover:text-white'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-green-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="মেনু"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-green-800 border-t border-green-700 px-4 py-3 grid grid-cols-2 gap-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white font-medium'
                      : 'text-green-200 hover:bg-green-700 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 page-enter">
        <Outlet />
      </main>

      {/* Bottom mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40 shadow-xl">
        <div className="grid grid-cols-5 h-16">
          {NAV.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isActive ? 'text-green-700' : 'text-stone-500'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  )
}
