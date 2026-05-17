import { useLocation, useNavigate } from "react-router-dom"
import { Home, MessageCircle, Cloud, Layers, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function Navbar({ onMoreClick, showMoreMenu = false }: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavClick = (item: (typeof navItems)[number]) => {
    if (item.path === "/more") {
      onMoreClick?.()
    } else {
      navigate(item.path)
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 backdrop-blur-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isMoreItem = item.path === "/more"
          const isActive = isMoreItem
            ? showMoreMenu
            : item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-primary-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
              aria-current={isActive && !isMoreItem ? "page" : undefined}
              aria-label={item.label}
              aria-expanded={isMoreItem ? showMoreMenu : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive && !isMoreItem && "fill-primary-100 stroke-primary-600",
                  isMoreItem && showMoreMenu && "rotate-90"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "transition-all duration-200",
                  isActive && "font-bold"
                )}
              >
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
