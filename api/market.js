// KrishiAI v2 — /api/market
// GET handler for market prices
// Primary: DAM print endpoint, Fallback: WFP/HDX
// In-memory TTL cache (30 min)

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- In-memory TTL Cache ----------
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ---------- Commodity Map with Bengali names ----------
const COMMODITY_MAP = {
  // Rice
  'রাইস/চাল (সূক্ষ্ম)': { name: 'Rice (Fine)', bengaliName: 'সূক্ষ্ম চাল', unit: 'কেজি' },
  'রাইস/চাল (মাঝারি)': { name: 'Rice (Medium)', bengaliName: 'মাঝারি চাল', unit: 'কেজি' },
  'রাইস/চাল (মোটা)': { name: 'Rice (Coarse)', bengaliName: 'মোটা চাল', unit: 'কেজি' },
  'ধান (সূক্ষ্ম)': { name: 'Paddy (Fine)', bengaliName: 'সূক্ষ্ম ধান', unit: 'কেজি' },
  'ধান (মাঝারি)': { name: 'Paddy (Medium)', bengaliName: 'মাঝারি ধান', unit: 'কেজি' },
  'ধান (মোটা)': { name: 'Paddy (Coarse)', bengaliName: 'মোটা ধান', unit: 'কেজি' },
  // Wheat
  'গম': { name: 'Wheat', bengaliName: 'গম', unit: 'কেজি' },
  'আটা': { name: 'Flour', bengaliName: 'আটা', unit: 'কেজি' },
  // Pulses
  'মসুর ডাল': { name: 'Lentil', bengaliName: 'মসুর ডাল', unit: 'কেজি' },
  'মুগ ডাল': { name: 'Mung Bean', bengaliName: 'মুগ ডাল', unit: 'কেজি' },
  'খেসারি ডাল': { name: 'Grass Pea', bengaliName: 'খেসারি ডাল', unit: 'কেজি' },
  'ছোলা': { name: 'Chickpea', bengaliName: 'ছোলা', unit: 'কেজি' },
  // Oil
  'সরিষার তেল': { name: 'Mustard Oil', bengaliName: 'সরিষার তেল', unit: 'লিটার' },
  'সয়াবিন তেল': { name: 'Soybean Oil', bengaliName: 'সয়াবিন তেল', unit: 'লিটার' },
  'পাম তেল': { name: 'Palm Oil', bengaliName: 'পাম তেল', unit: 'লিটার' },
  // Vegetables
  'আলু': { name: 'Potato', bengaliName: 'আলু', unit: 'কেজি' },
  'পেঁয়াজ': { name: 'Onion', bengaliName: 'পেঁয়াজ', unit: 'কেজি' },
  'রসুন': { name: 'Garlic', bengaliName: 'রসুন', unit: 'কেজি' },
  'আদা': { name: 'Ginger', bengaliName: 'আদা', unit: 'কেজি' },
  'মরিচ (শুকনা)': { name: 'Chili (Dry)', bengaliName: 'শুকনা মরিচ', unit: 'কেজি' },
  'মরিচ (সবুজ)': { name: 'Chili (Green)', bengaliName: 'সবুজ মরিচ', unit: 'কেজি' },
  'টমেটো': { name: 'Tomato', bengaliName: 'টমেটো', unit: 'কেজি' },
  'বেগুন': { name: 'Eggplant', bengaliName: 'বেগুন', unit: 'কেজি' },
  'ফুলকপি': { name: 'Cauliflower', bengaliName: 'ফুলকপি', unit: 'পিস' },
  'পাতকপি': { name: 'Cabbage', bengaliName: 'পাতকপি', unit: 'পিস' },
  'লাউ': { name: 'Bottle Gourd', bengaliName: 'লাউ', unit: 'পিস' },
  'মিষ্টি কুমড়া': { name: 'Sweet Pumpkin', bengaliName: 'মিষ্টি কুমড়া', unit: 'পিস' },
  'শসা': { name: 'Cucumber', bengaliName: 'শসা', unit: 'কেজি' },
  'রাঙা আলু': { name: 'Sweet Potato', bengaliName: 'রাঙা আলু', unit: 'কেজি' },
  // Fish
  'রুই মাছ': { name: 'Rui Fish', bengaliName: 'রুই মাছ', unit: 'কেজি' },
  'কাতলা মাছ': { name: 'Katla Fish', bengaliName: 'কাতলা মাছ', unit: 'কেজি' },
  'ইলিশ': { name: 'Hilsa', bengaliName: 'ইলিশ', unit: 'কেজি' },
  // Spices
  'জিরা': { name: 'Cumin', bengaliName: 'জিরা', unit: 'কেজি' },
  'হলুদ': { name: 'Turmeric', bengaliName: 'হলুদ', unit: 'কেজি' },
  'দারুচিনি': { name: 'Cinnamon', bengaliName: 'দারুচিনি', unit: 'কেজি' },
  // Fruits
  'কাঁচা কলা': { name: 'Green Banana', bengaliName: 'কাঁচা কলা', unit: 'ডজন' },
  'পাকা কলা': { name: 'Ripe Banana', bengaliName: 'পাকা কলা', unit: 'ডজন' },
  'আম': { name: 'Mango', bengaliName: 'আম', unit: 'কেজি' },
  'পেঁপে': { name: 'Papaya', bengaliName: 'পেঁপে', unit: 'কেজি' },
  // Jute
  'পাট': { name: 'Jute', bengaliName: 'পাট', unit: 'কেজি' },
  // Fertilizer
  'ইউরিয়া': { name: 'Urea', bengaliName: 'ইউরিয়া', unit: 'কেজি' },
  'টিএসপি': { name: 'TSP', bengaliName: 'টিএসপি', unit: 'কেজি' },
  'এমপি': { name: 'MP', bengaliName: 'এমপি', unit: 'কেজি' },
  'ডিএপি': { name: 'DAP', bengaliName: 'ডিএপি', unit: 'কেজি' },
};

// English-to-Bengali commodity name matching for WFP data
const EN_BN_COMMODITY_MAP = {
  'Rice': 'চাল',
  'Wheat': 'গম',
  'Lentil': 'মসুর ডাল',
  'Potato': 'আলু',
  'Onion': 'পেঁয়াজ',
  'Garlic': 'রসুন',
  'Ginger': 'আদা',
  'Mustard Oil': 'সরিষার তেল',
  'Soybean Oil': 'সয়াবিন তেল',
  'Chili': 'মরিচ',
  'Tomato': 'টমেটো',
  'Eggplant': 'বেগুন',
  'Banana': 'কলা',
  'Jute': 'পাট',
  'Urea': 'ইউরিয়া',
  'Flour': 'আটা',
  'Sugar': 'চিনি',
  'Salt': 'লবণ',
};

// ---------- Parse DAM HTML table ----------
function parseDamHtml(html) {
  const commodities = [];
  const seen = new Set();

  // Match table rows — look for commodity name and price patterns
  // DAM HTML structure varies, so we use flexible regex matching
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowContent = rowMatch[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      // Strip HTML tags
      const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
      cells.push(text);
    }

    // Look for rows with commodity name + price
    if (cells.length >= 3) {
      for (let i = 0; i < cells.length - 1; i++) {
        const name = cells[i].trim();
        const priceStr = cells[i + 1].trim();
        const price = parseFloat(priceStr.replace(/[^\d.]/g, ''));

        if (name && !isNaN(price) && price > 0 && price < 100000 && !seen.has(name)) {
          const mapped = COMMODITY_MAP[name];
          if (mapped || name.length > 1) {
            seen.add(name);
            commodities.push({
              name: mapped?.name || name,
              bengaliName: mapped?.bengaliName || name,
              unit: mapped?.unit || 'কেজি',
              price,
              trend: 'stable',
            });
          }
        }
      }
    }
  }

  return commodities;
}

// ---------- Fetch from DAM ----------
async function fetchDamPrices() {
  const url = 'https://market.dam.gov.bd/market_daily_price_report/print';

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KrishiAI-Bot/2.0',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`DAM API error ${response.status}`);
  }

  const html = await response.text();
  return parseDamHtml(html);
}

// ---------- Allowed districts allowlist ----------
const ALLOWED_DISTRICTS = new Set([
  'kurigram','rangpur','dinajpur','gaibandha','lalmonirhat','nilphamari','panchagarh','thakurgaon',
  'dhaka','faridpur','gazipur','gopalganj','kishoreganj','madaripur','manikganj','munshiganj',
  'narayanganj','narsingdi','rajbari','shariatpur','tangail','chittagong','coxsbazar','comilla',
  'feni','khagrachhari','lakshmipur','noakhali','rangamati','brahmanbaria','chandpur','bandarban',
  'rajshahi','natore','naogaon','chapainawabganj','pabna','sirajganj','bogura','joypurhat',
  'khulna','jessore','satkhira','meherpur','narail','chuadanga','kushtia','bagerhat','jhenaidah',
  'barisal','patuakhali','bhola','pirojpur','barguna','jhalokati','sylhet','moulvibazar',
  'habiganj','sunamganj','mymensingh','jamalpur','sherpur','netrokona',
]);

function sanitizeDistrict(district) {
  const d = String(district).toLowerCase().trim().replace(/[^a-z]/g, '');
  return ALLOWED_DISTRICTS.has(d) ? d : 'kurigram';
}

// ---------- Fetch from WFP/HDX ----------
async function fetchWfpPrices(district) {
  const safeDistrict = sanitizeDistrict(district);
  const resourceId = 'b6c8b6b8-710b-464a-9e11-b7d5c4e8a5d2'; // WFP Bangladesh food prices
  const params = new URLSearchParams({ resource_id: resourceId, limit: '100' });
  const url = `https://data.humdata.org/api/3/action/datastore_search?${params}&filters=${encodeURIComponent(JSON.stringify({ district: safeDistrict }))}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'KrishiAI-Bot/2.0' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`WFP/HDX API error ${response.status}`);
  }

  const json = await response.json();
  const records = json?.result?.records || [];

  if (records.length === 0) {
    throw new Error('No records from WFP/HDX');
  }

  const commodities = [];
  const seen = new Set();

  for (const rec of records) {
    const commodityName = rec.commodity || rec.item || rec.item_name || '';
    const price = parseFloat(rec.price || rec.avg_price || rec.value || 0);

    if (commodityName && price > 0 && !seen.has(commodityName)) {
      seen.add(commodityName);
      const bnName = EN_BN_COMMODITY_MAP[commodityName] || commodityName;
      commodities.push({
        name: commodityName,
        bengaliName: bnName,
        unit: rec.unit || 'কেজি',
        price,
        trend: 'stable',
      });
    }
  }

  return commodities;
}

// ---------- Fallback static data ----------
function getStaticPrices(district) {
  const date = new Date().toISOString().split('T')[0];
  const basePrices = {
    'সূক্ষ্ম চাল': { name: 'Rice (Fine)', unit: 'কেজি', price: 72 },
    'মাঝারি চাল': { name: 'Rice (Medium)', unit: 'কেজি', price: 58 },
    'মোটা চাল': { name: 'Rice (Coarse)', unit: 'কেজি', price: 48 },
    'আলু': { name: 'Potato', unit: 'কেজি', price: 22 },
    'পেঁয়াজ': { name: 'Onion', unit: 'কেজি', price: 45 },
    'রসুন': { name: 'Garlic', unit: 'কেজি', price: 120 },
    'মসুর ডাল': { name: 'Lentil', unit: 'কেজি', price: 130 },
    'সরিষার তেল': { name: 'Mustard Oil', unit: 'লিটার', price: 180 },
    'সয়াবিন তেল': { name: 'Soybean Oil', unit: 'লিটার', price: 165 },
    'শুকনা মরিচ': { name: 'Chili (Dry)', unit: 'কেজি', price: 250 },
    'টমেটো': { name: 'Tomato', unit: 'কেজি', price: 30 },
    'গম': { name: 'Wheat', unit: 'কেজি', price: 42 },
    'ইউরিয়া': { name: 'Urea', unit: 'কেজি', price: 28 },
    'পাট': { name: 'Jute', unit: 'কেজি', price: 85 },
  };

  // Add slight district variation
  const districtFactor = district.toLowerCase() === 'kurigram' ? 0.95 : 1.0;

  return Object.entries(basePrices).map(([bn, info]) => ({
    name: info.name,
    bengaliName: bn,
    unit: info.unit,
    price: Math.round(info.price * districtFactor),
    trend: 'stable',
  }));
}

// ---------- Main handler ----------
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders()).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).set(corsHeaders()).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    const { district = 'kurigram', level = 'district' } = req.query || {};
    const cacheKey = `market:${district}:${level}`;

    // Check cache
    const cached = getCached(cacheKey);
    if (cached) {
      res.status(200).set(corsHeaders()).json({ ...cached, fromCache: true });
      return;
    }

    let commodities = [];
    let source = 'dam';

    // Primary: DAM
    try {
      commodities = await fetchDamPrices();
      if (commodities.length === 0) {
        throw new Error('No commodities parsed from DAM');
      }
    } catch (err) {
      console.error(`[market] DAM failed: ${err.message}, trying WFP/HDX`);
      source = 'wfp-hdx';

      // Fallback: WFP/HDX
      try {
        commodities = await fetchWfpPrices(district);
        if (commodities.length === 0) {
          throw new Error('No commodities from WFP/HDX');
        }
      } catch (err2) {
        console.error(`[market] WFP/HDX failed: ${err2.message}, using static data`);
        source = 'static';
        commodities = getStaticPrices(district);
      }
    }

    // Calculate trends (simplified: compare with expected baseline)
    const baselineMap = {
      'Rice (Fine)': 72, 'Rice (Medium)': 58, 'Rice (Coarse)': 48,
      'Potato': 22, 'Onion': 45, 'Lentil': 130, 'Wheat': 42,
    };

    commodities = commodities.map((c) => {
      const baseline = baselineMap[c.name] || baselineMap[c.bengaliName];
      let change = 0;
      if (baseline && c.price > 0) {
        change = parseFloat(((c.price - baseline) / baseline * 100).toFixed(1));
        c.trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
      }

      // Transform to match frontend CommodityPrice type
      return {
        commodity: c.name,
        bengaliName: c.bengaliName,
        unit: c.unit,
        minPrice: Math.round(c.price * 0.9),
        maxPrice: Math.round(c.price * 1.1),
        avgPrice: Math.round(c.price),
        lastUpdated: new Date().toISOString().split('T')[0],
        change,
        trend: c.trend || 'stable',
      };
    });

    const result = {
      district,
      level,
      date: new Date().toISOString().split('T')[0],
      commodities,
      source,
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    setCache(cacheKey, result);

    res.status(200).set(corsHeaders()).json(result);
  } catch (err) {
    console.error('[market] Unhandled error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Failed to fetch market prices',
      detail: err.message,
    });
  }
}
