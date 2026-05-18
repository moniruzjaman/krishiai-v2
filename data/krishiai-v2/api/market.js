// api/market.js — Market Prices
// Primary:  DAM print endpoint (more stable HTML)
// Fallback: WFP/HDX CKAN API (weekly, free, no key)
// Safety:   Always serves last cached data — never throws to user

const DAM_PRINT_URL = 'https://market.dam.gov.bd/market_daily_price_report/print';
const WFP_URL = 'https://api.hungermapdata.org/v2/foodprices/country/BGD';

// Commodity map: English/DAM → Bengali
const COMMODITY_MAP = {
  'coarse rice': 'মোটা চাল', 'fine rice': 'চিকন চাল', 'boro rice': 'বোরো চাল',
  'aman rice': 'আমন চাল', 'rice': 'চাল', 'wheat': 'গম', 'atta': 'আটা',
  'flour': 'ময়দা', 'potato': 'আলু', 'onion': 'পেঁয়াজ', 'garlic': 'রসুন',
  'ginger': 'আদা', 'green chilli': 'কাঁচা মরিচ', 'dry chilli': 'শুকনো মরিচ',
  'lentil': 'মসুর ডাল', 'pulse': 'ডাল', 'musur dal': 'মসুর ডাল',
  'moog dal': 'মুগ ডাল', 'soybean oil': 'সয়াবিন তেল', 'palm oil': 'পাম তেল',
  'mustard oil': 'সরিষার তেল', 'sugar': 'চিনি', 'salt': 'লবণ',
  'egg': 'ডিম', 'broiler chicken': 'ব্রয়লার মুরগি', 'beef': 'গরুর মাংস',
  'mutton': 'খাসির মাংস', 'fish': 'মাছ', 'hilsha': 'ইলিশ'
};

function matchBengali(name) {
  const lower = name.toLowerCase();
  for (const [en, bn] of Object.entries(COMMODITY_MAP)) {
    if (lower.includes(en)) return bn;
  }
  return name;
}

// In-memory cache (lasts for serverless function lifetime)
let lastSuccessfulData = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchDAM() {
  const res = await fetch(DAM_PRINT_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KrishiAI/2.0; agricultural data)',
      'Accept': 'text/html,application/xhtml+xml'
    },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`DAM returned ${res.status}`);
  const html = await res.text();

  // Parse table rows from the print-friendly page
  const items = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells = [];
    let cellMatch;
    const cellContent = rowMatch[1];
    while ((cellMatch = cellRegex.exec(cellContent)) !== null) {
      const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text) cells.push(text);
    }
    if (cells.length >= 3 && !/বাজার|commodity|name/i.test(cells[0])) {
      const name = cells[0];
      const priceRange = cells[1] || cells[2];
      const [min, max] = priceRange.split('-').map(p => parseFloat(p.replace(/[^\d.]/g, '')));
      if (name && !isNaN(min)) {
        items.push({
          name,
          nameBn: matchBengali(name),
          priceMin: min,
          priceMax: max || min,
          unit: 'টাকা/কেজি'
        });
      }
    }
  }

  if (!items.length) throw new Error('DAM parsing returned no items');
  return { source: 'DAM', items, fetchedAt: new Date().toISOString() };
}

async function fetchWFP() {
  const res = await fetch(WFP_URL, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error(`WFP returned ${res.status}`);
  const data = await res.json();

  const items = (data.prices || []).slice(0, 20).map(p => ({
    name: p.name,
    nameBn: matchBengali(p.name),
    priceMin: p.price,
    priceMax: p.price,
    unit: p.unit ? `টাকা/${p.unit}` : 'টাকা/কেজি',
    date: p.date
  }));

  return { source: 'WFP/HDX', items, fetchedAt: new Date().toISOString() };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const now = Date.now();

  // Serve from cache if fresh
  if (lastSuccessfulData && (now - lastFetchTime) < CACHE_TTL) {
    res.setHeader('Cache-Control', 'public, s-maxage=1800');
    return res.status(200).json({ ...lastSuccessfulData, cached: true });
  }

  // Try DAM primary
  try {
    const data = await fetchDAM();
    lastSuccessfulData = data;
    lastFetchTime = now;
    res.setHeader('Cache-Control', 'public, s-maxage=1800');
    return res.status(200).json(data);
  } catch (e) {
    console.warn('DAM fetch failed:', e.message);
  }

  // Try WFP fallback
  try {
    const data = await fetchWFP();
    lastSuccessfulData = data;
    lastFetchTime = now;
    res.setHeader('Cache-Control', 'public, s-maxage=1800');
    return res.status(200).json(data);
  } catch (e) {
    console.warn('WFP fetch failed:', e.message);
  }

  // Serve stale cache rather than error
  if (lastSuccessfulData) {
    return res.status(200).json({ ...lastSuccessfulData, cached: true, stale: true });
  }

  // Absolute fallback — hardcoded essential prices
  return res.status(200).json({
    source: 'fallback',
    stale: true,
    fetchedAt: new Date().toISOString(),
    items: [
      { name: 'Coarse Rice',     nameBn: 'মোটা চাল',       priceMin: 45, priceMax: 50, unit: 'টাকা/কেজি' },
      { name: 'Fine Rice',       nameBn: 'চিকন চাল',       priceMin: 65, priceMax: 75, unit: 'টাকা/কেজি' },
      { name: 'Potato',          nameBn: 'আলু',             priceMin: 30, priceMax: 40, unit: 'টাকা/কেজি' },
      { name: 'Onion',           nameBn: 'পেঁয়াজ',         priceMin: 60, priceMax: 80, unit: 'টাকা/কেজি' },
      { name: 'Soybean Oil',     nameBn: 'সয়াবিন তেল',    priceMin: 155, priceMax: 165, unit: 'টাকা/লিটার' },
      { name: 'Broiler Chicken', nameBn: 'ব্রয়লার মুরগি', priceMin: 170, priceMax: 190, unit: 'টাকা/কেজি' },
    ]
  });
}
