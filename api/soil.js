// KrishiAI v2 — /api/soil
// GET handler for soil data from SoilGrids (ISRIC)
// Transforms ISRIC response to readable format with Bengali labels

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- Soil classification helper ----------
function classifySoil(clay, sand, silt) {
  // USDA soil texture triangle classification
  if (clay >= 40) return { soilType: 'Clay', bengaliType: 'এঁটেল মাটি', code: 'C' };
  if (sand >= 50 && clay < 20) return { soilType: 'Sandy', bengaliType: 'বেলে মাটি', code: 'S' };
  if (silt >= 50 && clay < 27) return { soilType: 'Silty', bengaliType: 'পলিমাটি', code: 'Si' };
  if (clay >= 27 && sand < 50) return { soilType: 'Clay Loam', bengaliType: 'এঁটেল দোঁয়াশ মাটি', code: 'CL' };
  if (sand >= 30 && clay < 27 && silt < 50) return { soilType: 'Sandy Loam', bengaliType: 'বেলে দোঁয়াশ মাটি', code: 'SL' };
  if (silt >= 28 && clay < 27 && sand < 50) return { soilType: 'Silt Loam', bengaliType: 'পলি দোঁয়াশ মাটি', code: 'SiL' };
  return { soilType: 'Loam', bengaliType: 'দোঁয়াশ মাটি', code: 'L' };
}

// ---------- Generate soil recommendations ----------
function generateRecommendation(ph, organicCarbon, cec, soilType, clay) {
  const recs = [];

  // pH recommendations
  if (ph < 5.5) {
    recs.push('🔧 মাটির অম্লতা বেশি (pH ' + ph.toFixed(1) + ')। চুন (ডলোমাইট) প্রয়োগ করুন — প্রতি শতকে ৫-১০ কেজি। ধানে বোরো মৌসুমে বেশি লাভজনক।');
  } else if (ph > 7.5) {
    recs.push('🔧 মাটির ক্ষারীয়তা বেশি (pH ' + ph.toFixed(1) + ')। জিপসাম প্রয়োগ করুন ও জৈব সার বাড়ান।');
  } else {
    recs.push('✅ মাটির pH অনুকূল (' + ph.toFixed(1) + ') — সাধারণ ফসলের জন্য উপযুক্ত।');
  }

  // Organic carbon recommendations
  if (organicCarbon < 1.0) {
    recs.push('🧪 জৈব কার্বন কম (' + organicCarbon.toFixed(2) + '%)। গোবর সার, কম্পোস্ট ও সবুজ সার প্রয়োগ করুন। ধানের খড় মাটিতে মিশিয়ে দিন।');
  } else if (organicCarbon > 2.5) {
    recs.push('🧪 জৈব কার্বন ভালো (' + organicCarbon.toFixed(2) + '%) — মাটির উর্বরতা সন্তোষজনক।');
  } else {
    recs.push('🧪 জৈব কার্বন মাঝারি (' + organicCarbon.toFixed(2) + '%) — জৈব সার প্রয়োগ চালিয়ে যান।');
  }

  // CEC recommendations
  if (cec < 10) {
    recs.push('📊 ক্যাশন বিনিময় ক্ষমতা কম — মাটি পুষ্টি ধরে রাখতে পারছে না। জৈব সার ও হিউমাস বাড়ান। সার কয়েক কিস্তায় দিন।');
  } else if (cec > 25) {
    recs.push('📊 ক্যাশন বিনিময় ক্ষমতা ভালো — মাটি পুষ্টি ভালো ধরে রাখে।');
  }

  // Soil type recommendations
  if (clay > 40) {
    recs.push('🌱 এঁটেল মাটিতে জল নিষ্কাশন খারাপ। নালা খনন করুন। বোরো ধান ও গমের জন্য উপযুক্ত।');
  } else if (clay < 15 && soilType === 'Sandy') {
    recs.push('🌱 বেলে মাটিতে পানি ও পুষ্টি দ্রুত নিচে চলে যায়। ড্রিপ সেচ ব্যবহার করুন। সার ছোট ছোট কিস্তায় দিন। সবজি ও তরমুজের জন্য উপযুক্ত।');
  } else {
    recs.push('🌱 দোঁয়াশ মাটি সব ধরনের ফসলের জন্য উপযুক্ত — ধান, গম, সবজি, ডাল সবই চাষ করতে পারেন।');
  }

  return recs;
}

// ---------- Extract value from SoilGrids response ----------
function extractPropertyValue(properties, propName, depthRange) {
  const prop = properties?.[propName];
  if (!prop) return undefined;

  // SoilGrids returns { "0-5cm": { mean: X }, "5-15cm": { mean: Y }, ... }
  // Sometimes depth keys use different formats
  for (const key of Object.keys(prop)) {
    if (key.includes(depthRange)) {
      return prop[key]?.mean;
    }
  }

  // Fallback: take the first available depth
  const firstKey = Object.keys(prop)[0];
  return prop[firstKey]?.mean;
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
    const { lat, lon } = req.query || {};

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

    const properties = 'phh2o,soc,clay,sand,silt,bdod,cec';
    const depths = '0-5cm,5-15cm';

    const url =
      `https://rest.isric.org/soilgrids/v2.0/properties/query?` +
      `lon=${longitude}&lat=${latitude}` +
      `&property=${properties}&depth=${depths}`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SoilGrids API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const props = data?.properties?.layers || {};

    // Build a map of property name to data
    const propMap = {};
    if (Array.isArray(data?.properties?.layers)) {
      for (const layer of data.properties.layers) {
        propMap[layer.name] = layer.depths;
      }
    } else {
      // Alternative response structure
      propMap.phh2o = data?.properties?.phh2o;
      propMap.soc = data?.properties?.soc;
      propMap.clay = data?.properties?.clay;
      propMap.sand = data?.properties?.sand;
      propMap.silt = data?.properties?.silt;
      propMap.bdod = data?.properties?.bdod;
      propMap.cec = data?.properties?.cec;
    }

    // Extract values for each depth
    function getVal(propName, depthLabel) {
      const prop = propMap[propName];
      if (!prop) return undefined;

      if (Array.isArray(prop)) {
        // layers array format
        const depthObj = prop.find((d) => {
          const label = d.label || d.depth || '';
          return label.includes(depthLabel.replace('cm', '')) || label === depthLabel;
        });
        return depthObj?.values?.mean || depthObj?.value?.mean;
      }

      // Direct property format
      for (const key of Object.keys(prop)) {
        if (key.includes(depthLabel) || key.includes(depthLabel.replace('-', '_'))) {
          return prop[key]?.mean ?? prop[key]?.value?.mean;
        }
      }

      // Fallback: first available depth
      const firstKey = Object.keys(prop)[0];
      return prop[firstKey]?.mean ?? prop[firstKey]?.value?.mean;
    }

    // SoilGrids values need conversion: pH is ×10, others are ×10 or ×100
    // pH: actual = value / 10
    // SOC: actual = value / 10 (g/kg → divide by 10 for %)
    // Clay/Sand/Silt: actual = value / 10 (g/kg → %)
    // BD: actual = value / 100 (kg/dm³)
    // CEC: actual = value / 10 (cmol/kg)

    const phRaw = getVal('phh2o', '0-5cm');
    const socRaw = getVal('soc', '0-5cm');
    const clayRaw = getVal('clay', '0-5cm');
    const sandRaw = getVal('sand', '0-5cm');
    const siltRaw = getVal('silt', '0-5cm');
    const bdodRaw = getVal('bdod', '0-5cm');
    const cecRaw = getVal('cec', '0-5cm');

    const ph = phRaw !== undefined ? phRaw / 10 : undefined;
    const organicCarbon = socRaw !== undefined ? socRaw / 100 : undefined; // g/kg → %
    const clay = clayRaw !== undefined ? clayRaw / 10 : undefined;
    const sand = sandRaw !== undefined ? sandRaw / 10 : undefined;
    const silt = siltRaw !== undefined ? siltRaw / 10 : undefined;
    const bulkDensity = bdodRaw !== undefined ? bdodRaw / 100 : undefined;
    const cec = cecRaw !== undefined ? cecRaw / 10 : undefined;

    // Deep values (5-15cm)
    const phDeep = getVal('phh2o', '5-15cm');
    const socDeep = getVal('soc', '5-15cm');
    const clayDeep = getVal('clay', '5-15cm');
    const sandDeep = getVal('sand', '5-15cm');
    const siltDeep = getVal('silt', '5-15cm');
    const bdodDeep = getVal('bdod', '5-15cm');
    const cecDeep = getVal('cec', '5-15cm');

    // Soil classification
    const soilClassification = classifySoil(clay || 0, sand || 0, silt || 0);

    // Generate recommendations
    const recommendation = generateRecommendation(
      ph || 6.5,
      organicCarbon || 1.0,
      cec || 15,
      soilClassification.soilType,
      clay || 20
    );

    const result = {
      ph: ph !== undefined ? parseFloat(ph.toFixed(1)) : null,
      ph_label_bn: ph !== undefined ? `মাটির pH: ${ph.toFixed(1)}` : null,
      organicCarbon: organicCarbon !== undefined ? parseFloat(organicCarbon.toFixed(2)) : null,
      organicCarbon_label_bn: organicCarbon !== undefined ? `জৈব কার্বন: ${organicCarbon.toFixed(2)}%` : null,
      clay: clay !== undefined ? parseFloat(clay.toFixed(1)) : null,
      clay_label_bn: clay !== undefined ? `এঁটেল: ${clay.toFixed(1)}%` : null,
      sand: sand !== undefined ? parseFloat(sand.toFixed(1)) : null,
      sand_label_bn: sand !== undefined ? `বালি: ${sand.toFixed(1)}%` : null,
      silt: silt !== undefined ? parseFloat(silt.toFixed(1)) : null,
      silt_label_bn: silt !== undefined ? `পলি: ${silt.toFixed(1)}%` : null,
      bulkDensity: bulkDensity !== undefined ? parseFloat(bulkDensity.toFixed(2)) : null,
      bulkDensity_label_bn: bulkDensity !== undefined ? `আয়তন ঘনত্ব: ${bulkDensity.toFixed(2)} kg/dm³` : null,
      cec: cec !== undefined ? parseFloat(cec.toFixed(1)) : null,
      cec_label_bn: cec !== undefined ? `CEC: ${cec.toFixed(1)} cmol/kg` : null,
      soilType: soilClassification.soilType,
      soilType_bn: soilClassification.bengaliType,
      depths: {
        '0-5cm': {
          ph: ph !== undefined ? parseFloat(ph.toFixed(1)) : null,
          organicCarbon: organicCarbon !== undefined ? parseFloat(organicCarbon.toFixed(2)) : null,
          clay: clay !== undefined ? parseFloat(clay.toFixed(1)) : null,
          sand: sand !== undefined ? parseFloat(sand.toFixed(1)) : null,
          silt: silt !== undefined ? parseFloat(silt.toFixed(1)) : null,
          bulkDensity: bulkDensity !== undefined ? parseFloat(bulkDensity.toFixed(2)) : null,
          cec: cec !== undefined ? parseFloat(cec.toFixed(1)) : null,
        },
        '5-15cm': {
          ph: phDeep !== undefined ? parseFloat((phDeep / 10).toFixed(1)) : null,
          organicCarbon: socDeep !== undefined ? parseFloat((socDeep / 100).toFixed(2)) : null,
          clay: clayDeep !== undefined ? parseFloat((clayDeep / 10).toFixed(1)) : null,
          sand: sandDeep !== undefined ? parseFloat((sandDeep / 10).toFixed(1)) : null,
          silt: siltDeep !== undefined ? parseFloat((siltDeep / 10).toFixed(1)) : null,
          bulkDensity: bdodDeep !== undefined ? parseFloat((bdodDeep / 100).toFixed(2)) : null,
          cec: cecDeep !== undefined ? parseFloat((cecDeep / 10).toFixed(1)) : null,
        },
      },
      recommendation,
      source: 'soilgrids-isric',
      location: { lat: latitude, lon: longitude },
      fetchedAt: new Date().toISOString(),
    };

    res.status(200).set(corsHeaders()).json(result);
  } catch (err) {
    console.error('[soil] Error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Failed to fetch soil data',
      detail: err.message,
    });
  }
}
