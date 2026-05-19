import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Sprout, Globe, MapPin, ChevronDown } from "lucide-react"
import { Navbar } from "./Navbar"

const moreMenuItems = [
  { label: "Analyzer", labelBn: "বিশ্লেষক", path: "/analyzer", emoji: "🔬" },
  { label: "Disease", labelBn: "রোগ", path: "/disease", emoji: "🦠" },
  { label: "Market", labelBn: "বাজার", path: "/market", emoji: "📈" },
  { label: "Calendar", labelBn: "ক্যালেন্ডার", path: "/calendar", emoji: "📅" },
  { label: "Profile", labelBn: "প্রোফাইল", path: "/profile", emoji: "👤" },
]

interface LanguageToggleProps {
  lang: "bn" | "en"
  onToggle: () => void
}

function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300"
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{lang === "bn" ? "বাং" : "EN"}</span>
    </button>
  )
}

function GPSIndicator() {
  const [gpsStatus, setGpsStatus] = useState<"loading" | "active" | "error">("loading")

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("error")
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus("active"),
      () => setGpsStatus("error"),
      { timeout: 5000 }
    )
  }, [])

  return (
    <div className="flex items-center gap-1 text-xs">
      <MapPin
        className={`h-3.5 w-3.5 ${
          gpsStatus === "active"
            ? "text-primary-600"
            : gpsStatus === "error"
            ? "text-red-400"
            : "text-gray-400 animate-pulse"
        }`}
      />
      <span
        className={
          gpsStatus === "active"
            ? "text-primary-600"
            : gpsStatus === "error"
            ? "text-red-400"
            : "text-gray-400"
        }
      >
        {gpsStatus === "active" ? "GPS" : gpsStatus === "error" ? "—" : "..."}
      </span>
    </div>
  )
}

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [lang, setLang] = useState<"bn" | "en">("bn")
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

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

  return (
    <div className="flex min-h-screen flex-col bg-background font-bengali">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-md">
        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
            <Sprout className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            কৃষি <span className="text-primary-600">AI</span>
          </h1>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <GPSIndicator />
          <LanguageToggle
            lang={lang}
            onToggle={() => setLang((l) => (l === "bn" ? "en" : "bn"))}
          />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* ── More Menu Overlay ── */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMoreMenu(false)}
            aria-hidden="true"
          />
          {/* Menu Panel */}
          <div className="fixed bottom-20 left-0 right-0 z-50 mx-auto max-w-lg">
            <div className="mx-4 mb-2 overflow-hidden rounded-2xl border border-border bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-200">
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    আরো দেখুন
                  </h3>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
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
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs transition-all duration-200 ${
                        isActive
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-gray-600 hover:bg-primary-50/50 hover:text-primary-700"
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
                      <span>{item.labelBn}</span>
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
