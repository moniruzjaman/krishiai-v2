import { memo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Home, MessageCircle, Cloud, Layers, Menu } from "lucide-react"

const navItems = [
  { label: "হোম", icon: Home, path: "/" },
  { label: "চ্যাট", icon: MessageCircle, path: "/chat" },
  { label: "আবহাওয়া", icon: Cloud, path: "/weather" },
  { label: "মাটি", icon: Layers, path: "/soil" },
  { label: "আরো", icon: Menu, path: "/more" },
]

interface NavbarProps {
  onMoreClick?: () => void
  showMoreMenu?: boolean
}

/**
 * Navbar — Memoized bottom navigation bar.
 *
 * Performance optimizations:
 * - Wrapped in React.memo to prevent re-renders on route changes
 *   (useLocation triggers re-render but memo shallow-compare prevents DOM updates)
 * - Removed backdrop-blur-md (expensive on mobile, causes high INP)
 * - Simplified CSS transitions (removed transition-all, using will-change)
 * - Minimal className computation
 */
function NavbarInner({ onMoreClick, showMoreMenu = false }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (item: (typeof navItems)[number]) => {
    if (item.path === "/more") {
      onMoreClick?.()
    } else {
      navigate(item.path)
    }
  }

  const currentPath = location.pathname

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isMoreItem = item.path === "/more"
          const isActive = isMoreItem
            ? showMoreMenu
            : item.path === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.path)

          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium min-w-[52px] ${
                isActive ? "text-primary-600" : "text-gray-400"
              }`}
              aria-current={isActive && !isMoreItem ? "page" : undefined}
              aria-label={item.label}
              aria-expanded={isMoreItem ? showMoreMenu : undefined}
            >
              <Icon
                className={`h-5 w-5 ${isActive && !isMoreItem ? "fill-primary-100 stroke-primary-600" : ""} ${isMoreItem && showMoreMenu ? "rotate-90" : ""}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className={isActive ? "font-bold" : ""}>
                {item.label}
              </span>
              {isActive && !isMoreItem && (
                <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-600" />
              )}
            </button>
          )
        })}
      </div>
      {/* Safe area padding for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

export const Navbar = memo(NavbarInner)
