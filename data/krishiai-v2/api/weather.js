// api/weather.js — Expanded Open-Meteo with agricultural indices
// No API key needed. Free. Same endpoint as v1 — just more parameters.

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

// Default to Kurigram district headquarters
const DEFAULT_LAT = 25.8041;
const DEFAULT_LON = 89.6393;

const WEATHER_CODES = {
  0: { bn: 'আকাশ পরিষ্কার', advisory: 'সেচ ও স্প্রে করার উপযুক্ত সময়।' },
  1: { bn: 'প্রায় পরিষ্কার', advisory: 'মাঠ পরিদর্শনের ভালো সময়।' },
  2: { bn: 'আংশিক মেঘলা', advisory: 'সাধারণ কৃষি কাজ করা যাবে।' },
  3: { bn: 'সম্পূর্ণ মেঘলা', advisory: 'বৃষ্টির সম্ভাবনা আছে, স্প্রে করবেন না।' },
  45: { bn: 'কুয়াশা', advisory: 'ছত্রাক রোগের ঝুঁকি বেশি, সতর্ক থাকুন।' },
  51: { bn: 'হালকা গুঁড়ি বৃষ্টি', advisory: 'কীটনাশক স্প্রে করবেন না।' },
  61: { bn: 'হালকা বৃষ্টি', advisory: 'স্প্রে করবেন না। পানি নিষ্কাশন নিশ্চিত করুন।' },
  63: { bn: 'মাঝারি বৃষ্টি', advisory: 'মাঠে কাজ বন্ধ রাখুন। সেচের প্রয়োজন নেই।' },
  65: { bn: 'ভারী বৃষ্টি', advisory: '⚠️ মাঠে যাবেন না। পানি নিষ্কাশন ব্যবস্থা পরীক্ষা করুন।' },
  80: { bn: 'বজ্রসহ বৃষ্টি', advisory: '⚠️ মাঠে যাবেন না। নিরাপদ থাকুন।' },
  95: { bn: 'বজ্রঝড়', advisory: '🚨 মাঠে যাবেন না। ঘরে থাকুন।' },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { bn: 'আবহাওয়া তথ্য অপ্রাপ্য', advisory: '' };
}

function getIrrigationAdvice(soilMoisture, et0) {
  if (soilMoisture === null) return 'মাটির আর্দ্রতা তথ্য নেই।';
  if (soilMoisture > 0.35) return '✅ মাটিতে পর্যাপ্ত আর্দ্রতা আছে। সেচ দেওয়ার দরকার নেই।';
  if (soilMoisture > 0.20) return '⚠️ মাটির আর্দ্রতা মাঝারি। ফসল অনুযায়ী সেচ বিবেচনা করুন।';
  return `🔴 মাটি শুষ্ক (আর্দ্রতা: ${(soilMoisture * 100).toFixed(0)}%)। সেচ দেওয়া জরুরি। ET₀: ${et0?.toFixed(1) || 'N/A'} mm/day`;
}

function getLeafWetnessAdvice(prob) {
  if (prob === null) return '';
  if (prob > 70) return '🍄 পাতার আর্দ্রতা বেশি — ছত্রাক রোগের ঝুঁকি উচ্চ। প্রতিরোধমূলক ছত্রাকনাশক বিবেচনা করুন।';
  if (prob > 40) return '⚠️ পাতার আর্দ্রতা মাঝারি — রোগের লক্ষণ পর্যবেক্ষণ করুন।';
  return '✅ পাতার আর্দ্রতা কম — ছত্রাক রোগের ঝুঁকি কম।';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const lat = parseFloat(req.query.lat) || DEFAULT_LAT;
  const lon = parseFloat(req.query.lon) || DEFAULT_LON;

  try {
    const params = new URLSearchParams({
      latitude:  lat,
      longitude: lon,
      timezone:  'Asia/Dhaka',
      // Current conditions — v1 params + NEW agricultural indices
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'weather_code',
        'wind_speed_10m',
        'precipitation',
        // NEW — agricultural indices (free, same endpoint)
        'soil_moisture_0_to_1cm',
        'soil_temperature_0cm',
        'et0_fao_evapotranspiration',
        'leaf_wetness_probability_mean',
        'vapour_pressure_deficit_max'
      ].join(','),
      // Daily forecast
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'et0_fao_evapotranspiration',
        'growing_degree_days_base_0_limit_50',
        'soil_moisture_0_to_1cm_mean',
        'leaf_wetness_probability_mean'
      ].join(','),
      forecast_days: 7
    });

    const response = await fetch(`${OPEN_METEO}?${params}`);
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json();

    const c = data.current;
    const weatherInfo = getWeatherInfo(c.weather_code);

    // Structured response with Bengali labels
    const result = {
      current: {
        temperature:     c.temperature_2m,
        humidity:        c.relative_humidity_2m,
        weatherCode:     c.weather_code,
        weatherBn:       weatherInfo.bn,
        windSpeed:       c.wind_speed_10m,
        precipitation:   c.precipitation,
        soilMoisture:    c.soil_moisture_0_to_1cm,
        soilTemp:        c.soil_temperature_0cm,
        et0:             c.et0_fao_evapotranspiration,
        leafWetness:     c.leaf_wetness_probability_mean,
        vpd:             c.vapour_pressure_deficit_max,
        // Advisory messages
        weatherAdvisory:    weatherInfo.advisory,
        irrigationAdvisory: getIrrigationAdvice(c.soil_moisture_0_to_1cm, c.et0_fao_evapotranspiration),
        leafWetnessAdvisory: getLeafWetnessAdvice(c.leaf_wetness_probability_mean)
      },
      daily: {
        dates:       data.daily.time,
        weatherCode: data.daily.weather_code,
        tempMax:     data.daily.temperature_2m_max,
        tempMin:     data.daily.temperature_2m_min,
        rainfall:    data.daily.precipitation_sum,
        et0:         data.daily.et0_fao_evapotranspiration,
        gdd:         data.daily.growing_degree_days_base_0_limit_50,
        soilMoisture: data.daily.soil_moisture_0_to_1cm_mean,
        leafWetness: data.daily.leaf_wetness_probability_mean
      },
      meta: { lat, lon, fetchedAt: new Date().toISOString() }
    };

    res.setHeader('Cache-Control', 'public, s-maxage=1800');
    res.status(200).json(result);
  } catch (err) {
    console.error('Weather error:', err);
    res.status(500).json({ error: 'আবহাওয়া তথ্য পাওয়া যায়নি।', details: err.message });
  }
}
