import { useState, useEffect, memo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Sprout, Globe, MapPin, ChevronDown } from "lucide-react"
import { Navbar } from "./Navbar"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLocationStore } from "@/store/useLocationStore"

const moreMenuItems = [
  { label: "Analyzer", labelBn: "বিশ্লেষক", path: "/analyzer", emoji: "🔬" },
  { label: "Disease", labelBn: "রোগ", path: "/disease", emoji: "🦠" },
  { label: "Market", labelBn: "বাজার", path: "/market", emoji: "📈" },
  { label: "Calendar", labelBn: "ক্যালেন্ডার", path: "/calendar", emoji: "📅" },
  { label: "Profile", labelBn: "প্রোফাইল", path: "/profile", emoji: "👤" },
]

// ── Memoized sub-components to prevent unnecessary re-renders ─────

const LanguageToggle = memo(function LanguageToggle({ lang, onToggle }: {
  lang: "bn" | "en"
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm active:bg-primary-50 active:text-primary-700"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{lang === "bn" ? "বাং" : "EN"}</span>
    </button>
  )
})

/**
 * GPSIndicator — Uses useLocationStore instead of making
 * a separate geolocation call (which was redundant and slow).
 * Now reads from the already-initialized location store.
 */
const GPSIndicator = memo(function GPSIndicator() {
  const { gps, isLocating, locationError } = useLocationStore()

  const status = gps ? "active" : locationError ? "error" : isLocating ? "loading" : "loading"

  return (
    <div className="flex items-center gap-1 text-xs">
      <MapPin
        className={`h-3.5 w-3.5 ${
          status === "active"
            ? "text-primary-600"
            : status === "error"
            ? "text-red-400"
            : "text-gray-400 animate-pulse"
        }`}
      />
      <span
        className={
          status === "active"
            ? "text-primary-600"
            : status === "error"
            ? "text-red-400"
            : "text-gray-400"
        }
      >
        {status === "active" ? "GPS" : status === "error" ? "—" : "..."}
      </span>
    </div>
  )
})

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { language, setLanguage } = useSettingsStore()

  // Close more menu on route change
  useEffect(() => {
    setShowMoreMenu(false)
  }, [location.pathname])

  // Close more menu on back button
  useEffect(() => {
    if (!showMoreMenu) return

    const handlePopState = () => setShowMoreMenu(false)
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [showMoreMenu])

  const handleMoreNavigate = (path: string) => {
    setShowMoreMenu(false)
    navigate(path)
  }

  const handleToggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-bengali">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border bg-white px-4">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight">
            কৃষি <span className="text-primary-600">AI</span>
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <GPSIndicator />
          <LanguageToggle
            lang={language}
            onToggle={handleToggleLanguage}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto pb-18">
        {children}
      </main>

      {/* ── More Menu Overlay ── */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          {/* Menu Panel */}
          <div className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-lg">
            <div className="mx-4 mb-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {language === "bn" ? "আরো দেখুন" : "More"}
                  </h3>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="rounded-full p-1 text-gray-400 active:bg-gray-100 active:text-gray-600"
                    aria-label="Close menu"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 px-3 pb-4">
                {moreMenuItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleMoreNavigate(item.path)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-gray-600 active:bg-primary-50/50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        <span className="text-lg">{item.emoji}</span>
                      </div>
                      <span>{language === "bn" ? item.labelBn : item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bottom Navigation ── */}
      <Navbar onMoreClick={() => setShowMoreMenu((prev) => !prev)} showMoreMenu={showMoreMenu} />
    </div>
  )
}
