import { create } from "zustand"
import { persist } from "zustand/middleware"

// ── Types ───────────────────────────────────────────────────────

type Language = "bn" | "en"
type Theme = "light" | "dark"
type FontSize = "normal" | "large"

interface SettingsState {
  language: Language
  theme: Theme
  fontSize: FontSize

  setLanguage: (lang: Language) => void
  setTheme: (theme: Theme) => void
  setFontSize: (size: FontSize) => void
  t: (key: string) => string
}

// ── Translations ────────────────────────────────────────────────

const TRANSLATIONS: Record<string, Record<Language, string>> = {
  // ── Navigation ──────────────────────────────────────────
  "nav.home": { bn: "হোম", en: "Home" },
  "nav.chat": { bn: "চ্যাট", en: "Chat" },
  "nav.analyzer": { bn: "বিশ্লেষক", en: "Analyzer" },
  "nav.disease": { bn: "রোগ শনাক্তকরণ", en: "Disease Detection" },
  "nav.weather": { bn: "আবহাওয়া", en: "Weather" },
  "nav.market": { bn: "বাজার মূল্য", en: "Market Prices" },
  "nav.soil": { bn: "মাটি বিশ্লেষণ", en: "Soil Analysis" },
  "nav.calendar": { bn: "কৃষি ক্যালেন্ডার", en: "Agri Calendar" },
  "nav.login": { bn: "লগইন", en: "Login" },
  "nav.profile": { bn: "প্রোফাইল", en: "Profile" },

  // ── Common actions ──────────────────────────────────────
  "action.save": { bn: "সংরক্ষণ", en: "Save" },
  "action.share": { bn: "শেয়ার", en: "Share" },
  "action.loading": { bn: "লোড হচ্ছে...", en: "Loading..." },
  "action.error": { bn: "ত্রুটি হয়েছে", en: "An error occurred" },
  "action.retry": { bn: "আবার চেষ্টা করুন", en: "Retry" },
  "action.back": { bn: "পিছনে", en: "Back" },
  "action.next": { bn: "পরবর্তী", en: "Next" },
  "action.submit": { bn: "জমা দিন", en: "Submit" },
  "action.cancel": { bn: "বাতিল", en: "Cancel" },
  "action.close": { bn: "বন্ধ", en: "Close" },
  "action.refresh": { bn: "রিফ্রেশ", en: "Refresh" },
  "action.search": { bn: "খুঁজুন", en: "Search" },
  "action.download": { bn: "ডাউনলোড", en: "Download" },
  "action.copy": { bn: "কপি", en: "Copy" },
  "action.delete": { bn: "মুছুন", en: "Delete" },
  "action.edit": { bn: "সম্পাদনা", en: "Edit" },

  // ── Weather terms ───────────────────────────────────────
  "weather.title": { bn: "আবহাওয়া পূর্বাভাস", en: "Weather Forecast" },
  "weather.temperature": { bn: "তাপমাত্রা", en: "Temperature" },
  "weather.humidity": { bn: "আর্দ্রতা", en: "Humidity" },
  "weather.rainfall": { bn: "বৃষ্টিপাত", en: "Rainfall" },
  "weather.wind": { bn: "বাতাসের গতি", en: "Wind Speed" },
  "weather.advisory": { bn: "কৃষি পরামর্শ", en: "Ag Advisory" },
  "weather.today": { bn: "আজ", en: "Today" },
  "weather.tomorrow": { bn: "আগামীকাল", en: "Tomorrow" },
  "weather.weekly": { bn: "সাপ্তাহিক", en: "Weekly" },

  // ── Market terms ────────────────────────────────────────
  "market.title": { bn: "বাজার মূল্য", en: "Market Prices" },
  "market.commodity": { bn: "পণ্য", en: "Commodity" },
  "market.price": { bn: "মূল্য", en: "Price" },
  "market.unit": { bn: "একক", en: "Unit" },
  "market.change": { bn: "পরিবর্তন", en: "Change" },
  "market.highest": { bn: "সর্বোচ্চ", en: "Highest" },
  "market.lowest": { bn: "সর্বনিম্ন", en: "Lowest" },
  "market.trend": { bn: "প্রবণতা", en: "Trend" },

  // ── Soil terms ──────────────────────────────────────────
  "soil.title": { bn: "মাটি বিশ্লেষণ", en: "Soil Analysis" },
  "soil.type": { bn: "মাটির ধরন", en: "Soil Type" },
  "soil.ph": { bn: "পিএইচ মান", en: "pH Level" },
  "soil.nitrogen": { bn: "নাইট্রোজেন", en: "Nitrogen" },
  "soil.phosphorus": { bn: "ফসফরাস", en: "Phosphorus" },
  "soil.potassium": { bn: "পটাশিয়াম", en: "Potassium" },
  "soil.organicCarbon": { bn: "জৈব কার্বন", en: "Organic Carbon" },
  "soil.fertilizer": { bn: "সারের পরামর্শ", en: "Fertilizer Advice" },

  // ── Disease terms ───────────────────────────────────────
  "disease.title": { bn: "রোগ শনাক্তকরণ", en: "Disease Detection" },
  "disease.upload": { bn: "ছবি আপলোড করুন", en: "Upload Image" },
  "disease.result": { bn: "ফলাফল", en: "Result" },
  "disease.treatment": { bn: "চিকিৎসা", en: "Treatment" },
  "disease.confidence": { bn: "নিশ্চিততা", en: "Confidence" },
  "disease.severity": { bn: "মাত্রা", en: "Severity" },

  // ── Chat terms ──────────────────────────────────────────
  "chat.placeholder": { bn: "আপনার প্রশ্ন লিখুন...", en: "Type your question..." },
  "chat.send": { bn: "পাঠান", en: "Send" },
  "chat.history": { bn: "চ্যাট ইতিহাস", en: "Chat History" },
  "chat.clear": { bn: "চ্যাট মুছুন", en: "Clear Chat" },

  // ── Auth terms ──────────────────────────────────────────
  "auth.signIn": { bn: "সাইন ইন", en: "Sign In" },
  "auth.signUp": { bn: "সাইন আপ", en: "Sign Up" },
  "auth.signOut": { bn: "সাইন আউট", en: "Sign Out" },
  "auth.email": { bn: "ইমেইল", en: "Email" },
  "auth.password": { bn: "পাসওয়ার্ড", en: "Password" },
  "auth.phone": { bn: "ফোন নম্বর", en: "Phone Number" },
  "auth.otp": { bn: "ওটিপি কোড", en: "OTP Code" },

  // ── General ─────────────────────────────────────────────
  "general.appName": { bn: "কৃষি এআই", en: "KrishiAI" },
  "general.noData": { bn: "কোনো তথ্য পাওয়া যায়নি", en: "No data found" },
  "general.offline": { bn: "অফলাইনে আছেন", en: "You are offline" },
  "general.welcome": { bn: "স্বাগতম", en: "Welcome" },
  "general.language": { bn: "ভাষা", en: "Language" },
  "general.settings": { bn: "সেটিংস", en: "Settings" },
  "general.about": { bn: "সম্পর্কে", en: "About" },
  "general.location": { bn: "অবস্থান", en: "Location" },
  "general.gps": { bn: "জিপিএস", en: "GPS" },
  "general.upazila": { bn: "উপজেলা", en: "Upazila" },
  "general.district": { bn: "জেলা", en: "District" },
}

// ── Store ───────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "bn",
      theme: "light",
      fontSize: "normal",

      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),

      t: (key: string): string => {
        const lang = get().language
        const entry = TRANSLATIONS[key]
        if (!entry) return key
        return entry[lang] ?? key
      },
    }),
    {
      name: "krishiai-settings",
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        fontSize: state.fontSize,
      }),
    },
  ),
)
