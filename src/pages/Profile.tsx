import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Bug,
  ScanSearch,
  Globe,
  SunMoon,
  Type,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/store/useAuthStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { useLocationStore } from "@/store/useLocationStore"
import { toBengaliDate } from "@/lib/bengali"
import { cn } from "@/lib/utils"

// ── Mock saved reports ──
const MOCK_REPORTS = [
  { type: "disease", typeBn: "রোগ", emoji: "🦠", date: new Date(Date.now() - 86400000 * 2), preview: "ধানের ব্লাস্ট রোগ শনাক্ত — আত্মবিশ্বাস ৮৭%" },
  { type: "analysis", typeBn: "বিশ্লেষণ", emoji: "🔬", date: new Date(Date.now() - 86400000 * 5), preview: "পাতায় হলুদ দাগ — নাইট্রোজেনের অভাব" },
  { type: "chat", typeBn: "চ্যাট", emoji: "💬", date: new Date(Date.now() - 86400000 * 7), preview: "আমন ধানে কখন সার দেব?" },
]

const typeBadgeColors: Record<string, string> = {
  disease: "bg-red-100 text-red-700",
  analysis: "bg-amber-100 text-amber-700",
  chat: "bg-blue-100 text-blue-700",
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuthStore()
  const { language, setLanguage, theme, setTheme, fontSize, setFontSize, t } = useSettingsStore()
  const { district, upazila } = useLocationStore()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
    } catch {
      // Error handled in store
    }
  }

  // ── Not authenticated state ──
  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {language === "bn" ? "লগইন করুন" : "Please Log In"}
        </h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {language === "bn"
            ? "আপনার প্রোফাইল ও সংরক্ষিত রিপোর্ট দেখতে লগইন করুন"
            : "Log in to view your profile and saved reports"}
        </p>
        <Button className="mt-6" size="lg" onClick={() => navigate("/login")}>
          {language === "bn" ? "লগইন করুন" : "Log In"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4">
      {/* ── User Info Card ── */}
      <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">
                {user.email ?? (language === "bn" ? "ব্যবহারকারী" : "User")}
              </h2>
              <div className="mt-1 space-y-0.5">
                {user.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate" dir="ltr">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span dir="ltr">{user.phone}</span>
                  </div>
                )}
                {(district || upazila) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{upazila}{upazila && district ? ", " : ""}{district}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Saved Reports ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {language === "bn" ? "সংরক্ষিত রিপোর্ট" : "Saved Reports"}
        </h2>
        <div className="space-y-2">
          {MOCK_REPORTS.map((report, idx) => (
            <Card key={idx} className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99]">
              <CardContent className="flex items-center gap-3 p-3">
                <span className="text-xl shrink-0">{report.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[9px] px-1.5 py-0 border-0", typeBadgeColors[report.type] ?? "bg-gray-100 text-gray-700")}>
                      {report.typeBn}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {toBengaliDate(report.date)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground truncate" dir="auto">
                    {report.preview}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Chat History Link ── */}
      <Card
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={() => navigate("/chat")}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("chat.history")}</p>
            <p className="text-xs text-muted-foreground">
              {language === "bn" ? "আপনার কৃষি চ্যাট ইতিহাস দেখুন" : "View your agri chat history"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* ── Settings ── */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("general.settings")}
        </h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {/* Language Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("general.language")}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {language === "bn" ? "বাংলা / English" : "Bengali / English"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
              >
                {language === "bn" ? "English" : "বাংলা"}
              </Button>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <SunMoon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {language === "bn" ? "থিম" : "Theme"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {theme === "light"
                      ? (language === "bn" ? "লাইট মোড" : "Light mode")
                      : (language === "bn" ? "ডার্ক মোড" : "Dark mode")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light"
                  ? (language === "bn" ? "ডার্ক" : "Dark")
                  : (language === "bn" ? "লাইট" : "Light")}
              </Button>
            </div>

            {/* Font Size Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Type className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {language === "bn" ? "ফন্ট সাইজ" : "Font Size"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {fontSize === "normal"
                      ? (language === "bn" ? "স্বাভাবিক" : "Normal")
                      : (language === "bn" ? "বড়" : "Large")}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFontSize(fontSize === "normal" ? "large" : "normal")}
              >
                {fontSize === "normal"
                  ? (language === "bn" ? "বড় করুন" : "Enlarge")
                  : (language === "bn" ? "স্বাভাবিক" : "Normal")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Logout ── */}
      <Button
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        size="lg"
        onClick={handleSignOut}
        disabled={loading}
      >
        <LogOut className="h-4 w-4" />
        {loading
          ? (language === "bn" ? "সাইন আউট হচ্ছে..." : "Signing out...")
          : t("auth.signOut")}
      </Button>

      {/* ── Footer ── */}
      <div className="pt-2 text-center">
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          <span>
            {language === "bn"
              ? "আপনার ডেটা সুরক্ষিত ও গোপনীয়"
              : "Your data is secure and private"}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          কৃষি AI v2 — {language === "bn" ? "বাংলাদেশ কৃষকদের জন্য" : "For Bangladesh Farmers"}
        </p>
      </div>
    </div>
  )
}
