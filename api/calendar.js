// KrishiAI v2 — /api/calendar
// GET handler for crop calendar
// Primary: GEMS API, Fallback: static Bangladesh crop calendar data

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- Static Bangladesh Crop Calendar Data ----------
const STATIC_CROP_CALENDAR = {
  rice_aus: {
    crop: 'Rice (Aus)',
    bengaliCrop: 'আউস ধান',
    stages: [
      {
        name: 'Land Preparation',
        bengaliName: 'জমি তৈরি',
        startDate: '03-01',
        endDate: '03-15',
        advisory: 'জমি ২-৩ বার চাষ ও মই দিন। শেষ চাষে সার প্রয়োগ করুন। পানি নিষ্কাশনের ব্যবস্থা করুন।',
      },
      {
        name: 'Seed Sowing',
        bengaliName: 'বীজ বপন',
        startDate: '03-15',
        endDate: '04-01',
        advisory: 'উন্নত জাতের বীজ ব্যবহার করুন (ব্রি ধান-৪৩, ব্রি ধান-৪৮)। সারি করে বুনুন। বীজ শোধন করে বপন করুন।',
      },
      {
        name: 'Vegetative Growth',
        bengaliName: 'vegetative বৃদ্ধি',
        startDate: '04-01',
        endDate: '05-15',
        advisory: 'নিড়ানি দিন, সারের ২য় কিস্তা প্রয়োগ করুন। পানি ব্যবস্থাপনা করুন। কীটপতঙ্গ পর্যবেক্ষণ করুন।',
      },
      {
        name: 'Reproductive Stage',
        bengaliName: 'প্রজনন পর্যায়',
        startDate: '05-15',
        endDate: '06-15',
        advisory: 'শীষ বের হওয়ার সময় পানির অভাব হতে দেবেন না। ব্লাস্ট রোগের জন্য সতর্ক থাকুন।',
      },
      {
        name: 'Harvesting',
        bengaliName: 'ফসল কাটা',
        startDate: '06-15',
        endDate: '07-15',
        advisory: 'ধান ৮০-৮৫% পাকলে কাটুন। বর্ষার আগে ফসল ঘরে তোলার ব্যবস্থা করুন।',
      },
    ],
  },
  rice_aman: {
    crop: 'Rice (Aman)',
    bengaliCrop: 'আমন ধান',
    stages: [
      {
        name: 'Seedling Raising',
        bengaliName: 'চারা উৎপাদন',
        startDate: '06-01',
        endDate: '07-01',
        advisory: 'বীজতলা তৈরি করুন। প্রতি শতকে ৪-৫ কেজি বীজ লাগান। ব্রি ধান-৫২, ব্রি ধান-৫৭ জাত ব্যবহার করুন।',
      },
      {
        name: 'Transplanting',
        bengaliName: 'রোপণ',
        startDate: '07-01',
        endDate: '08-15',
        advisory: '২১-৩০ দিনের চারা রোপণ করুন। সারিতে ১৫×১০ সেমি দূরত্বে লাগান। শেষ চাষে সার দিন।',
      },
      {
        name: 'Tillering',
        bengaliName: 'শিষ বের হওয়া',
        startDate: '08-15',
        endDate: '09-30',
        advisory: 'নিড়ানি দিন। ইউরিয়া শীর্ষ সার প্রয়োগ করুন। বাদামি গাছফড়িং ও মাজরা পোকা পর্যবেক্ষণ করুন।',
      },
      {
        name: 'Flowering & Grain Filling',
        bengaliName: 'ফুল ও দানা ভরাট',
        startDate: '10-01',
        endDate: '11-15',
        advisory: 'এ সময় পানির অভাব হতে দেবেন না। ব্লাস্ট ও শিট ব্লাইট রোগ সতর্কতা। প্রয়োজনে ছত্রাকনাশক প্রয়োগ।',
      },
      {
        name: 'Harvesting',
        bengaliName: 'ফসল কাটা',
        startDate: '11-15',
        endDate: '12-15',
        advisory: 'ধান পুরোপুরি পাকলে কাটুন। শুকনো আবহাওয়ায় মাড়াই করুন। বীজের জন্য আলাদা করে রাখুন।',
      },
    ],
  },
  rice_boro: {
    crop: 'Rice (Boro)',
    bengaliCrop: 'বোরো ধান',
    stages: [
      {
        name: 'Seedling Raising',
        bengaliName: 'চারা উৎপাদন',
        startDate: '11-01',
        endDate: '12-15',
        advisory: 'বীজতলা তৈরি করুন। ব্রি ধান-৮৯, ব্রি ধান-৯২ জাত ব্যবহার করুন। শীতের সময় চারা রক্ষায় পলিথিন ব্যবহার করুন।',
      },
      {
        name: 'Transplanting',
        bengaliName: 'রোপণ',
        startDate: '12-15',
        endDate: '01-31',
        advisory: '৩৫-৪৫ দিনের বয়স্ক চারা রোপণ করুন। ২০×১৫ সেমি বা ২৫×১৫ সেমি দূরত্বে লাগান। সার প্রয়োগ নিশ্চিত করুন।',
      },
      {
        name: 'Vegetative Growth',
        bengaliName: 'vegetative বৃদ্ধি',
        startDate: '02-01',
        endDate: '03-15',
        advisory: 'ইউরিয়া শীর্ষ সার ৩ কিস্তায় প্রয়োগ করুন। নিড়ানি দিন। পানির স্তর ৩-৫ সেমি রাখুন।',
      },
      {
        name: 'Reproductive Stage',
        bengaliName: 'প্রজনন পর্যায়',
        startDate: '03-15',
        endDate: '04-30',
        advisory: 'শীষ আসার সময় পানি বন্ধ করবেন না। ব্লাস্ট রোগ ও মাজরা পোকার জন্য সতর্ক থাকুন।',
      },
      {
        name: 'Harvesting',
        bengaliName: 'ফসল কাটা',
        startDate: '04-30',
        endDate: '05-31',
        advisory: 'বোরো ধান ৮০-৮৫% পাকলে কেটে নিন। বর্ষার আগে ফসল ঘরে তোলার ব্যবস্থা করুন। রোদে শুকিয়ে মাড়াই করুন।',
      },
    ],
  },
  wheat: {
    crop: 'Wheat',
    bengaliCrop: 'গম',
    stages: [
      {
        name: 'Land Preparation',
        bengaliName: 'জমি তৈরি',
        startDate: '10-15',
        endDate: '11-15',
        advisory: 'জমি ৩-৪ বার চাষ দিন। শেষ চাষে সার মেশান। সুষম সার: ইউরিয়া ১৪০, টিএসপি ১০০, এমপি ৬০ কেজি/হেক্টর।',
      },
      {
        name: 'Sowing',
        bengaliName: 'বপন',
        startDate: '11-15',
        endDate: '11-30',
        advisory: 'ব্রি গম-৩২, ব্রি গম-৩৩ জাত ব্যবহার করুন। সারিতে ২০-২৫ সেমি দূরত্বে বুনুন। বীজ হার: ১২০ কেজি/হেক্টর।',
      },
      {
        name: 'Irrigation',
        bengaliName: 'সেচ ব্যবস্থাপনা',
        startDate: '12-01',
        endDate: '02-15',
        advisory: '৩টি সেচ দিন: ক্রাউন রুট স্টেজ (১৭-২১ দিন), শীষ বের হওয়ার সময়, দানা ভরাটের সময়। AWD পদ্ধতিতে পানি বাঁচান।',
      },
      {
        name: 'Disease & Pest Control',
        bengaliName: 'রোগ ও কীট দমন',
        startDate: '01-01',
        endDate: '03-15',
        advisory: 'পাতার মরিচা (হলুদ/বাদামি) দেখলে প্রোপাইকোনাজোল প্রয়োগ করুন। আংটা রোগের জন্য কার্বেনডাজিম ব্যবহার করুন।',
      },
      {
        name: 'Harvesting',
        bengaliName: 'ফসল কাটা',
        startDate: '03-15',
        endDate: '04-15',
        advisory: 'গম সম্পূর্ণ পাকলে (দানা শক্ত হলে) কাটুন। বর্ষার আগে ঘরে তুলুন। শুকনো স্থানে সংরক্ষণ করুন।',
      },
    ],
  },
  jute: {
    crop: 'Jute',
    bengaliCrop: 'পাট',
    stages: [
      {
        name: 'Land Preparation',
        bengaliName: 'জমি তৈরি',
        startDate: '03-01',
        endDate: '03-31',
        advisory: 'জমি ৪-৫ বার চাষ ও মই দিন। মাটি ঝুরঝুরে করুন। সার প্রয়োগ: ইউরিয়া ৬০, টিএসপি ৪০, এমপি ২০ কেজি/হেক্টর।',
      },
      {
        name: 'Sowing',
        bengaliName: 'বপন',
        startDate: '03-15',
        endDate: '04-15',
        advisory: 'তোষা পাট (বিজ্ঞানী কমল), মেস্তা পাট (হেইমাল) জাত ব্যবহার করুন। সারিতে ৩০ সেমি দূরত্বে বুনুন। বীজ হার: ৫-৭ কেজি/হেক্টর।',
      },
      {
        name: 'Thinning & Weeding',
        bengaliName: 'পাতলা করা ও নিড়ানি',
        startDate: '04-15',
        endDate: '05-15',
        advisory: 'চারা ১০-১৫ সেমি উচ্চতায় পাতলা করুন। সারির মাঝে নিড়ানি দিন। প্রথম নিড়ানি বপনের ২১ দিন পর, ২য় নিড়ানি ৪৫ দিন পর।',
      },
      {
        name: 'Growth & Care',
        bengaliName: 'বৃদ্ধি ও পরিচর্যা',
        startDate: '05-15',
        endDate: '07-15',
        advisory: 'পানি জমতে দেবেন না। জলাবদ্ধতা পাটের জন্য ক্ষতিকর। শীষ মোচা পোকা দেখলে ডাইক্লোরোভস প্রয়োগ করুন।',
      },
      {
        name: 'Harvesting & Retting',
        bengaliName: 'কাটা ও পানিতে ভেজানো',
        startDate: '07-15',
        endDate: '08-31',
        advisory: 'ফুল আসার আগে বা আসার সময় কাটুন — এতে আঁশের গুণমান ভালো হয়। ৬০-৯০ সেমি নিচে কেটে পরিষ্কার পানিতে ১৫-২০ দিন ভিজিয়ে রাখুন।',
      },
      {
        name: 'Fiber Extraction & Drying',
        bengaliName: 'আঁশ ছাড়ানো ও শুকানো',
        startDate: '08-01',
        endDate: '09-30',
        advisory: 'আঁশ হাতে বা যন্ত্র দিয়ে ছাড়ান। পরিষ্কার পানিতে ধুয়ে রোদে শুকান। শুকনো আঁশ ব্যালে বেঁধে শুকনো স্থানে সংরক্ষণ করুন।',
      },
    ],
  },
};

// ---------- Map crop query to calendar key ----------
function getCropKey(crop) {
  const lower = (crop || '').toLowerCase().trim();
  const map = {
    rice: 'rice_boro',
    aus: 'rice_aus',
    'rice-aus': 'rice_aus',
    'aus-rice': 'rice_aus',
    aman: 'rice_aman',
    'rice-aman': 'rice_aman',
    'aman-rice': 'rice_aman',
    boro: 'rice_boro',
    'rice-boro': 'rice_boro',
    'boro-rice': 'rice_boro',
    wheat: 'wheat',
    jute: 'jute',
  };
  return map[lower] || 'rice_boro';
}

// ---------- Fetch from GEMS API ----------
async function fetchGemsCalendar(lat, lon, crop) {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon), crop });
  const url = `https://gems.umn.edu/apis/crop-calendar?${params}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GEMS API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  if (!data || !data.stages || !Array.isArray(data.stages)) {
    throw new Error('Invalid GEMS response structure');
  }

  // Map GEMS response to our format
  const stages = data.stages.map((stage) => ({
    name: stage.name || stage.stage || 'Unknown',
    bengaliName: stage.bengaliName || stage.localName || stage.name || 'অজানা',
    startDate: stage.startDate || stage.start || '',
    endDate: stage.endDate || stage.end || '',
    advisory: stage.advisory || stage.recommendation || '',
  }));

  return {
    crop: data.crop || crop,
    location: data.location || { lat, lon },
    stages,
  };
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
    const { lat, lon, crop = 'rice' } = req.query || {};

    if (!lat || !lon) {
      res.status(400).set(corsHeaders()).json({
        error: 'lat এবং lon প্যারামিটার আবশ্যক। (Latitude and longitude required.)',
      });
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      res.status(400).set(corsHeaders()).json({ error: 'Invalid lat/lon values.' });
      return;
    }

    // Allowlist crop values
    const ALLOWED_CROPS = new Set(['rice','aus','rice-aus','aus-rice','aman','rice-aman','aman-rice','boro','rice-boro','boro-rice','wheat','jute']);
    const safeCrop = ALLOWED_CROPS.has(String(crop).toLowerCase().trim()) ? String(crop).toLowerCase().trim() : 'rice';

    let result;
    let source = 'gems';

    // Try GEMS API first
    try {
      result = await fetchGemsCalendar(latitude, longitude, safeCrop);
    } catch (err) {
      console.error(`[calendar] GEMS API failed: ${err.message}, using static data`);
      source = 'static';

      // Fallback: static Bangladesh crop calendar
      const cropKey = getCropKey(safeCrop);
      const calendar = STATIC_CROP_CALENDAR[cropKey];

      if (!calendar) {
        res.status(404).set(corsHeaders()).json({
          error: `ফসল '${crop}' এর ক্যালেন্ডার পাওয়া যায়নি। উপলব্ধ: rice (aus/aman/boro), wheat, jute`,
        });
        return;
      }

      // Build current year dates
      const year = new Date().getFullYear();
      const stages = calendar.stages.map((stage) => ({
        name: stage.name,
        bengaliName: stage.bengaliName,
        startDate: `${year}-${stage.startDate}`,
        endDate: `${year}-${stage.endDate}`,
        advisory: stage.advisory,
      }));

      result = {
        crop: calendar.crop,
        bengaliCrop: calendar.bengaliCrop,
        location: { lat: latitude, lon: longitude },
        stages,
      };
    }

    // Determine current stage
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();
    const dayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    );

    let currentStage = null;
    if (result.stages) {
      for (const stage of result.stages) {
        if (stage.startDate && stage.endDate) {
          const startParts = stage.startDate.split('-');
          const endParts = stage.endDate.split('-');
          if (startParts.length >= 2 && endParts.length >= 2) {
            const startMonth = parseInt(startParts[1] || startParts[0], 10);
            const startDay = parseInt(startParts[2] || startParts[1], 10);
            const endMonth = parseInt(endParts[1] || endParts[0], 10);
            const endDay = parseInt(endParts[2] || endParts[1], 10);

            // Simple month-based check
            if (
              (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) &&
              (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay))
            ) {
              currentStage = stage.name;
              break;
            }
          }
        }
      }
    }

    res.status(200).set(corsHeaders()).json({
      ...result,
      currentStage,
      source,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[calendar] Unhandled error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Failed to fetch crop calendar',
      detail: err.message,
    });
  }
}
