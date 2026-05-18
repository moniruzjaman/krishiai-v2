// api/soil.js — SoilGrids REST API (ISRIC)
// No API key needed. Free. 250m resolution.
// Cache aggressively — soil properties change very slowly.

const SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query';

const TEXTURE_CLASSES = {
  clay: 'এঁটেল মাটি', silty_clay: 'পলিযুক্ত এঁটেল', sandy_clay: 'বালি এঁটেল',
  clay_loam: 'এঁটেল দোআঁশ', silty_clay_loam: 'পলিযুক্ত এঁটেল দোআঁশ',
  sandy_clay_loam: 'বালিযুক্ত এঁটেল দোআঁশ', loam: 'দোআঁশ',
  silty_loam: 'পলি দোআঁশ', silt: 'পলি মাটি',
  sandy_loam: 'বালি দোআঁশ', loamy_sand: 'দোআঁশ বালি', sand: 'বালি মাটি'
};

function classifyTexture(clay, sand, silt) {
  // USDA texture triangle simplified
  if (clay > 40) return silt > 40 ? 'silty_clay' : (sand > 45 ? 'sandy_clay' : 'clay');
  if (clay > 27 && silt > 20) return 'clay_loam';
  if (clay > 20 && sand < 45) return silt > 50 ? 'silty_clay_loam' : 'clay_loam';
  if (sand > 70 && clay < 15) return clay > 10 ? 'sandy_loam' : 'loamy_sand';
  if (silt > 50 && clay < 27) return 'silty_loam';
  if (silt > 80) return 'silt';
  return 'loam';
}

function getFertilizerAdvice(ph, soc, texture) {
  const advice = [];
  if (ph < 5.5) advice.push('🔴 মাটি অম্লীয়। চুন প্রয়োগ করুন (৪-৫ কেজি/শতাংশ)।');
  else if (ph > 7.5) advice.push('🟡 মাটি ক্ষারীয়। জৈব সার প্রয়োগ বাড়ান।');
  else advice.push('✅ মাটির pH স্বাভাবিক।');

  if (soc < 1.0) advice.push('🔴 জৈব পদার্থ কম। সবুজ সার, কম্পোস্ট বা গোবর সার দিন।');
  else if (soc < 2.0) advice.push('⚠️ জৈব পদার্থ মাঝারি। নিয়মিত জৈব সার যোগ করুন।');
  else advice.push('✅ জৈব পদার্থের পরিমাণ ভালো।');

  if (texture === 'sand' || texture === 'loamy_sand')
    advice.push('⚠️ বালি মাটি — ঘন ঘন সেচ দিন, সার ভাগে ভাগে দিন।');
  if (texture === 'clay') advice.push('⚠️ এঁটেল মাটি — পানি নিষ্কাশনের ব্যবস্থা করুন।');

  return advice;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon required' });
  }

  try {
    const params = new URLSearchParams({
      lon, lat,
      property: ['phh2o', 'soc', 'clay', 'sand', 'silt', 'bdod', 'cec'].join(','),
      depth: ['0-5cm', '5-15cm'].join(','),
      value: 'mean'
    });

    const sgRes = await fetch(`${SOILGRIDS_URL}?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000) // SoilGrids can be slow
    });

    if (!sgRes.ok) throw new Error(`SoilGrids ${sgRes.status}`);
    const data = await sgRes.json();

    // Extract 0-5cm values (converted from SoilGrids units)
    const extract = (propName, depthIdx = 0) => {
      const prop = data.properties?.layers?.find(l => l.name === propName);
      const val = prop?.depths?.[depthIdx]?.values?.mean;
      if (val === null || val === undefined) return null;
      // Unit conversions per SoilGrids documentation
      if (propName === 'phh2o') return val / 10;          // 10x → actual pH
      if (propName === 'soc')   return val / 10;          // dg/kg → g/kg
      if (propName === 'clay' || propName === 'sand' || propName === 'silt')
        return val / 10;                                  // g/kg → %
      if (propName === 'bdod')  return val / 100;         // cg/cm³ → g/cm³
      if (propName === 'cec')   return val / 10;          // mmol(c)/kg → cmol/kg
      return val;
    };

    const ph    = extract('phh2o');
    const soc   = extract('soc');
    const clay  = extract('clay');
    const sand  = extract('sand');
    const silt  = extract('silt');
    const bd    = extract('bdod');
    const cec   = extract('cec');

    const textureKey = (clay !== null && sand !== null && silt !== null)
      ? classifyTexture(clay, sand, silt)
      : null;

    const result = {
      lat, lon,
      ph,
      organicCarbon: soc,
      clay, sand, silt,
      bulkDensity: bd,
      cec,
      textureClass: textureKey,
      textureBn: textureKey ? (TEXTURE_CLASSES[textureKey] || textureKey) : null,
      phLevel: ph < 5.5 ? 'অম্লীয়' : ph > 7.5 ? 'ক্ষারীয়' : 'নিরপেক্ষ',
      fertilizerAdvice: (ph !== null && soc !== null && textureKey)
        ? getFertilizerAdvice(ph, soc, textureKey)
        : ['মাটি পরীক্ষার তথ্য সম্পূর্ণ নয়।'],
      source: 'SoilGrids (ISRIC) — 250m resolution',
      fetchedAt: new Date().toISOString()
    };

    // Soil data is very stable — cache for 7 days
    res.setHeader('Cache-Control', 'public, s-maxage=604800');
    res.status(200).json(result);
  } catch (err) {
    console.error('SoilGrids error:', err);
    res.status(500).json({
      error: 'মাটির তথ্য পাওয়া যায়নি।',
      details: err.message,
      suggestion: 'আপনার মাটি পরীক্ষা করতে নিকটতম কৃষি অফিসে যোগাযোগ করুন।'
    });
  }
}
