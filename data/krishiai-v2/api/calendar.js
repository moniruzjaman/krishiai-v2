// api/calendar.js — Crop Calendar
// Primary: GEMS Crop Calendar API (gems.umn.edu)
// Fallback: Bangladesh-specific static data (Aus/Aman/Boro seasons)

const GEMS_URL = 'https://gems.umn.edu/apis/crop-calendar';

// Bangladesh crop calendar (authoritative fallback)
const BD_CALENDAR = {
  'boro_rice': {
    nameBn: 'বোরো ধান', crop: 'Rice (Boro)',
    plantingStart: 'ডিসেম্বর', plantingEnd: 'জানুয়ারি',
    harvestStart: 'মে', harvestEnd: 'জুন',
    notes: 'সেচনির্ভর। উচ্চফলনশীল জাত — BRRI dhan28, dhan29, dhan89, dhan92 প্রস্তাবিত।'
  },
  'aman_rice': {
    nameBn: 'আমন ধান', crop: 'Rice (Aman)',
    plantingStart: 'জুন', plantingEnd: 'আগস্ট',
    harvestStart: 'নভেম্বর', harvestEnd: 'ডিসেম্বর',
    notes: 'বৃষ্টিনির্ভর। BRRI dhan51, dhan52 বন্যাসহিষ্ণু জাত প্রস্তাবিত।'
  },
  'aus_rice': {
    nameBn: 'আউশ ধান', crop: 'Rice (Aus)',
    plantingStart: 'মার্চ', plantingEnd: 'এপ্রিল',
    harvestStart: 'জুলাই', harvestEnd: 'আগস্ট',
    notes: 'স্বল্পমেয়াদি। BRRI dhan48, dhan55 প্রস্তাবিত।'
  },
  'wheat': {
    nameBn: 'গম', crop: 'Wheat',
    plantingStart: 'নভেম্বর', plantingEnd: 'ডিসেম্বর',
    harvestStart: 'মার্চ', harvestEnd: 'এপ্রিল',
    notes: 'BARI Gom-25, Gom-26 উচ্চফলনশীল জাত প্রস্তাবিত।'
  },
  'jute': {
    nameBn: 'পাট', crop: 'Jute',
    plantingStart: 'মার্চ', plantingEnd: 'মে',
    harvestStart: 'জুলাই', harvestEnd: 'সেপ্টেম্বর',
    notes: 'BJC-83, O-9897 জাত প্রস্তাবিত। রোয়া পদ্ধতিতে চাষ করুন।'
  },
  'potato': {
    nameBn: 'আলু', crop: 'Potato',
    plantingStart: 'অক্টোবর', plantingEnd: 'নভেম্বর',
    harvestStart: 'জানুয়ারি', harvestEnd: 'ফেব্রুয়ারি',
    notes: 'BARI Alu-7, Alu-8 প্রস্তাবিত। মাটির তাপমাত্রা ১৫-২০°C আদর্শ।'
  },
  'mustard': {
    nameBn: 'সরিষা', crop: 'Mustard',
    plantingStart: 'অক্টোবর', plantingEnd: 'নভেম্বর',
    harvestStart: 'জানুয়ারি', harvestEnd: 'ফেব্রুয়ারি',
    notes: 'BARI Sarisha-14, BINA sarisha-3 প্রস্তাবিত।'
  },
  'maize': {
    nameBn: 'ভুট্টা', crop: 'Maize',
    plantingStart: 'নভেম্বর', plantingEnd: 'ডিসেম্বর',
    harvestStart: 'মার্চ', harvestEnd: 'এপ্রিল',
    notes: 'হাইব্রিড জাত — NK40, Pacific-984 প্রস্তাবিত। সুনিষ্কাশিত জমিতে ভালো হয়।'
  }
};

const MONTH_MAP = {
  1: 'জানুয়ারি', 2: 'ফেব্রুয়ারি', 3: 'মার্চ', 4: 'এপ্রিল',
  5: 'মে', 6: 'জুন', 7: 'জুলাই', 8: 'আগস্ট',
  9: 'সেপ্টেম্বর', 10: 'অক্টোবর', 11: 'নভেম্বর', 12: 'ডিসেম্বর'
};

function getCurrentSeasonAdvice(month) {
  if ([12, 1, 2].includes(month)) return { season: 'রবি মৌসুম', crops: ['boro_rice', 'wheat', 'potato', 'mustard', 'maize'] };
  if ([3, 4, 5].includes(month))  return { season: 'প্রাক-খরিফ', crops: ['aus_rice', 'jute'] };
  if ([6, 7, 8, 9].includes(month)) return { season: 'খরিফ মৌসুম', crops: ['aman_rice'] };
  return { season: 'রবি প্রস্তুতি', crops: ['wheat', 'potato', 'mustard'] };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const lat  = parseFloat(req.query.lat) || 25.8;
  const lon  = parseFloat(req.query.lon) || 89.6;
  const crop = req.query.crop || 'all';

  // Try GEMS API
  let gemsData = null;
  try {
    const gemsRes = await fetch(
      `${GEMS_URL}?lat=${lat}&lng=${lon}&crop=${encodeURIComponent(crop)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (gemsRes.ok) gemsData = await gemsRes.json();
  } catch (e) {
    console.warn('GEMS API failed, using BD static data:', e.message);
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthBn = MONTH_MAP[currentMonth];
  const seasonInfo = getCurrentSeasonAdvice(currentMonth);

  // Return BD static calendar (always available) + GEMS if available
  const calendarData = crop === 'all'
    ? Object.entries(BD_CALENDAR).map(([key, val]) => ({ key, ...val }))
    : [{ key: crop, ...(BD_CALENDAR[crop] || BD_CALENDAR['boro_rice']) }];

  const result = {
    location: { lat, lon },
    currentMonth: currentMonthBn,
    currentSeason: seasonInfo.season,
    recommendedCrops: seasonInfo.crops.map(k => BD_CALENDAR[k]?.nameBn).filter(Boolean),
    calendar: calendarData,
    gemsData: gemsData || null,
    source: gemsData ? 'GEMS + Bangladesh DAE' : 'Bangladesh DAE (static)',
    fetchedAt: new Date().toISOString()
  };

  // Calendar data is very stable
  res.setHeader('Cache-Control', 'public, s-maxage=2592000'); // 30 days
  res.status(200).json(result);
}
