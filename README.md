# কৃষি AI v2 — Krishi AI Bangladesh

AI-চালিত কৃষি পরামর্শ সেবা | AI-powered agricultural advisory for Bangladesh farmers

## Features

| Feature | API Used | Cost |
|---------|----------|------|
| 🤖 Agricultural Chatbot | Gemini 2.0 Flash → Groq Llama 3.3 70B | Free |
| 🔍 Crop Analyzer (image + text) | Gemini Vision → Groq Llama 4 Scout | Free |
| 🐛 Plant Disease Detection (3-tier) | HF ViT → PlantNet → Gemini Vision | Free |
| 🌤️ Weather + Ag Indices | Open-Meteo (ET₀, soil moisture, GDD, leaf wetness) | Free |
| 💹 Market Prices | DAM print endpoint → WFP/HDX fallback | Free |
| 🪨 Soil Profiler | SoilGrids ISRIC (250m GPS-based) | Free |
| 📅 Crop Calendar | GEMS UMN → BD static fallback | Free |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + CVA (shadcn-style) |
| State Management | Zustand (persisted) |
| Data Fetching | TanStack Query |
| Routing | React Router v7 |
| API | Vercel Serverless Functions |
| Auth | Supabase (email + phone OTP) |
| PWA | Vite PWA + Workbox |
| CI | GitHub Actions |

## Project Structure

```
krishiai-v2/
├── api/                        ← Vercel Serverless Functions
│   ├── analyze.js              ← Crop/image analysis (Gemini primary)
│   ├── chat.js                 ← Agricultural chatbot (Gemini + Groq fallback)
│   ├── disease.js              ← Plant disease detection (HF → PlantNet → Gemini)
│   ├── weather.js              ← Open-Meteo proxy + ag indices
│   ├── market.js               ← DAM scraper + WFP/HDX fallback
│   ├── soil.js                 ← SoilGrids REST proxy
│   └── calendar.js             ← GEMS crop calendar + BD static
│
├── src/
│   ├── main.tsx
│   ├── App.tsx                 ← Router + Providers
│   ├── index.css               ← Tailwind base
│   │
│   ├── components/             ← Shared UI components
│   │   ├── ui/                 ← Button, Card, Input, Badge, Skeleton
│   │   ├── Layout.tsx          ← App shell with header + bottom nav
│   │   ├── Navbar.tsx          ← Mobile bottom navigation
│   │   ├── VoiceInput.tsx      ← Bengali SpeechRecognition (bn-BD)
│   │   ├── ImageCapture.tsx    ← Camera / file upload
│   │   ├── WeatherStrip.tsx    ← Live weather display
│   │   └── MarketTicker.tsx    ← DAM price ticker
│   │
│   ├── pages/
│   │   ├── Home.tsx            ← Dashboard / landing
│   │   ├── Chat.tsx            ← Agricultural chatbot
│   │   ├── Analyzer.tsx        ← Crop image analyzer
│   │   ├── Disease.tsx         ← Plant disease detector
│   │   ├── Weather.tsx         ← Full weather + ag indices
│   │   ├── Market.tsx          ← Market prices
│   │   ├── Soil.tsx            ← GPS-based soil characterization
│   │   ├── Calendar.tsx        ← GEMS crop calendar
│   │   ├── Login.tsx           ← Supabase auth
│   │   └── Profile.tsx         ← Saved reports / settings
│   │
│   ├── services/               ← Client-side API wrappers
│   │   ├── aiService.ts
│   │   ├── weatherService.ts
│   │   ├── marketService.ts
│   │   ├── soilService.ts
│   │   ├── diseaseService.ts
│   │   ├── cacheService.ts
│   │   └── supabaseClient.ts
│   │
│   ├── store/                  ← Zustand stores
│   │   ├── useLocationStore.ts ← GPS + upazila + soil cache
│   │   ├── useAuthStore.ts     ← User session
│   │   └── useSettingsStore.ts ← Language (bn/en), theme, fontSize
│   │
│   └── lib/
│       ├── utils.ts            ← cn() + helpers
│       ├── bengali.ts          ← Bengali number/date formatters
│       └── constants.ts        ← Upazilas, commodities, crops, weather codes
│
├── public/
│   ├── manifest.json
│   └── favicon.svg
│
├── .env.example
├── .github/workflows/ci.yml
├── vercel.json
├── vite.config.ts
└── package.json
```

## Setup

```bash
# 1. Clone
git clone https://github.com/moniruzjaman/krishiai-v2
cd krishiai-v2

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Edit .env.local — add GEMINI_API_KEY and GROQ_API_KEY (minimum)

# 4. Dev server
npm run dev
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add env vars in Vercel dashboard:
# GEMINI_API_KEY, GROQ_API_KEY, HUGGINGFACE_API_KEY
# (PLANTNET_API_KEY optional for Tier 3 disease detection)
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (for auth)
```

## API Keys Required

| Key | Where to Get | Required? |
|-----|-------------|-----------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ Yes |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | ✅ Yes |
| `HUGGINGFACE_API_KEY` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | ✅ Yes |
| `PLANTNET_API_KEY` | [my.plantnet.org](https://my.plantnet.org/account/api-access) | Optional |
| `VITE_SUPABASE_URL` | [supabase.com](https://supabase.com) | Optional (auth) |
| `VITE_SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) | Optional (auth) |

No key needed for: Open-Meteo, SoilGrids, GEMS Crop Calendar, DAM, WFP/HDX.

## Architecture

```
Browser → Vercel CDN (React SPA)
              ↓
       Vercel Serverless Functions (/api/*)
              ↓
    ┌─────────────────────────────┐
    │  Gemini 2.0 Flash (primary) │
    │  Groq Llama 4 / 3.3 (fallback) │
    │  HF ViT → PlantNet → Gemini │
    │  Open-Meteo (weather+ag)    │
    │  SoilGrids ISRIC            │
    │  DAM → WFP/HDX (market)     │
    │  GEMS Crop Calendar         │
    └─────────────────────────────┘
```

## LLM Fallback Chain

```
1. Gemini 2.0 Flash     → primary (best Bengali, multimodal)
2. Groq Llama 4 Scout   → vision fallback (1K RPD, fast)
3. Groq Llama 3.3 70B   → text-only fallback (14.4K RPD)
4. Rule-based Bengali   → always-on, zero cost
```

## Caching Strategy

| Data | Stale Time | Garbage Collection |
|------|-----------|-------------------|
| Weather | 30 min | 1 hour |
| Market Prices | 30 min | 2 hours |
| Soil Data | 7 days | 30 days |
| Crop Calendar | 30 days | 90 days |
| LLM Responses | No cache | — |

## Developer

Abu Md. Moniruzzaman
Additional Deputy Director (Horticulture), DAE Kurigram
GitHub: [@moniruzjaman](https://github.com/moniruzjaman)
