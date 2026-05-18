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
```

## API Keys Required

| Key | Where to Get | Required? |
|-----|-------------|-----------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ Yes |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | ✅ Yes |
| `HUGGINGFACE_API_KEY` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | ✅ Yes |
| `PLANTNET_API_KEY` | [my.plantnet.org](https://my.plantnet.org/account/api-access) | Optional |

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

## Developer

Abu Md. Moniruzzaman  
Additional Deputy Director (Horticulture), DAE Kurigram  
GitHub: [@moniruzjaman](https://github.com/moniruzjaman)
