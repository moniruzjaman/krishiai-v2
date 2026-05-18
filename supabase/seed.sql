-- ============================================================
-- KrishiAI v2 — Seed Data (local dev only)
-- ============================================================

-- Sample market cache for Kurigram district
insert into public.market_cache (district, level, data) values (
  'Kurigram', 'retail',
  '{
    "district": "Kurigram",
    "level": "retail",
    "date": "2026-05-18",
    "commodities": [
      {"commodity": "rice",    "bengaliName": "চাল",    "unit": "kg", "minPrice": 52, "maxPrice": 60, "avgPrice": 56, "change": 1.2,  "trend": "up",     "lastUpdated": "2026-05-18"},
      {"commodity": "potato",  "bengaliName": "আলু",    "unit": "kg", "minPrice": 22, "maxPrice": 28, "avgPrice": 25, "change": -0.5, "trend": "down",   "lastUpdated": "2026-05-18"},
      {"commodity": "onion",   "bengaliName": "পেঁয়াজ", "unit": "kg", "minPrice": 45, "maxPrice": 55, "avgPrice": 50, "change": 0.0,  "trend": "stable", "lastUpdated": "2026-05-18"},
      {"commodity": "mustard", "bengaliName": "সরিষা",  "unit": "kg", "minPrice": 70, "maxPrice": 80, "avgPrice": 75, "change": 2.1,  "trend": "up",     "lastUpdated": "2026-05-18"},
      {"commodity": "wheat",   "bengaliName": "গম",     "unit": "kg", "minPrice": 30, "maxPrice": 36, "avgPrice": 33, "change": 0.3,  "trend": "stable", "lastUpdated": "2026-05-18"}
    ]
  }'::jsonb
) on conflict do nothing;

-- Sample soil cache for Kurigram GPS center (~25.82, 89.64)
insert into public.soil_cache (lat, lon, data) values (
  25.82, 89.64,
  '{
    "clay": 28.5,
    "sand": 35.2,
    "silt": 36.3,
    "ph": 6.4,
    "organicCarbon": 1.2,
    "nitrogen": 0.12,
    "phosphorus": 18.5,
    "potassium": 145.0,
    "soilType": "clay_loam",
    "texture": "Clay Loam"
  }'::jsonb
) on conflict (lat, lon) do nothing;
