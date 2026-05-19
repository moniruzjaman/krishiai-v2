// KrishiAI v2 — /api/weather
// GET handler for weather data from Open-Meteo
// Returns Bengali weather labels and agricultural advisories

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- WMO Weather Code to Bengali/English label ----------
const WEATHER_CODE_MAP = {
  0: { en: 'Clear sky', bn: 'মেঘমুক্ত আকাশ' },
  1: { en: 'Mainly clear', bn: 'অধিকাংশ পরিষ্কার' },
  2: { en: 'Partly cloudy', bn: 'আংশিক মেঘলা' },
  3: { en: 'Overcast', bn: 'মেঘলা' },
  45: { en: 'Foggy', bn: 'কুয়াশা' },
  48: { en: 'Depositing rime fog', bn: 'কুয়াশা (তুষারপাত)' },
  51: { en: 'Light drizzle', bn: 'হালকা গুঁড়ি গুঁড়ি বৃষ্টি' },
  53: { en: 'Moderate drizzle', bn: 'মাঝারি গুঁড়ি গুঁড়ি বৃষ্টি' },
  55: { en: 'Dense drizzle', bn: 'ঘন গুঁড়ি গুঁড়ি বৃষ্টি' },
  56: { en: 'Light freezing drizzle', bn: 'হালকা বরফের গুঁড়ি বৃষ্টি' },
  57: { en: 'Dense freezing drizzle', bn: 'ঘন বরফের গুঁড়ি বৃষ্টি' },
  61: { en: 'Slight rain', bn: 'হালকা বৃষ্টি' },
  63: { en: 'Moderate rain', bn: 'মাঝারি বৃষ্টি' },
  65: { en: 'Heavy rain', bn: 'ভারী বৃষ্টি' },
  66: { en: 'Light freezing rain', bn: 'হালকা বরফের বৃষ্টি' },
  67: { en: 'Heavy freezing rain', bn: 'ভারী বরফের বৃষ্টি' },
  71: { en: 'Slight snowfall', bn: 'হালকা তুষারপাত' },
  73: { en: 'Moderate snowfall', bn: 'মাঝারি তুষারপাত' },
  75: { en: 'Heavy snowfall', bn: 'ভারী তুষারপাত' },
  77: { en: 'Snow grains', bn: 'তুষার দানা' },
  80: { en: 'Slight rain showers', bn: 'হালকা ঝর্ণা বৃষ্টি' },
  81: { en: 'Moderate rain showers', bn: 'মাঝারি ঝর্ণা বৃষ্টি' },
  82: { en: 'Violent rain showers', bn: 'প্রবল ঝর্ণা বৃষ্টি' },
  85: { en: 'Slight snow showers', bn: 'হালকা তুষার ঝর্ণা' },
  86: { en: 'Heavy snow showers', bn: 'ভারী তুষার ঝর্ণা' },
  95: { en: 'Thunderstorm', bn: 'বজ্রপাত' },
  96: { en: 'Thunderstorm with slight hail', bn: 'বজ্রপাত ও হালকা শিলাবৃষ্টি' },
  99: { en: 'Thunderstorm with heavy hail', bn: 'বজ্রপাত ও ভারী শিলাবৃষ্টি' },
};

function getWeatherLabel(code) {
  return WEATHER_CODE_MAP[code] || { en: 'Unknown', bn: 'অজানা' };
}

// ---------- Generate agricultural advisory ----------
function generateAdvisory(current, daily, agIndices) {
  const advisories = [];
  const temp = current?.temperature_2m;
  const humidity = current?.relative_humidity_2m;
  const weatherCode = current?.weather_code;

  // Temperature advisory
  if (temp !== undefined) {
    if (temp > 38) {
      advisories.push('🔥 তাপমাত্রা অত্যন্ত বেশি। ফসলে পানি সংকট এড়াতে সেচ বাড়ান। গরমে কাজ কম করুন।');
    } else if (temp > 35) {
      advisories.push('🌡️ উচ্চ তাপমাত্রা। সেচের ব্যবস্থা নিশ্চিত করুন এবং ছায়াযুক্ত স্থানে কাজ করুন।');
    } else if (temp < 10) {
      advisories.push('❄️ তাপমাত্রা কম। শীতজনিত ক্ষতি থেকে ফসল রক্ষায় আবরণ ব্যবহার করুন।');
    }
  }

  // Humidity advisory
  if (humidity !== undefined) {
    if (humidity > 85) {
      advisories.push('💧 আর্দ্রতা অত্যন্ত বেশি — ছত্রাক রোগের ঝুঁকি। ছত্রাকনাশক প্রয়োগ বিবেচনা করুন।');
    } else if (humidity < 40) {
      advisories.push('🏜️ আর্দ্রতা কম — পানি সংকটের আশঙ্কা। সেচ বাড়ান।');
    }
  }

  // Rain advisory
  if (weatherCode !== undefined) {
    if ([61, 63, 65, 80, 81, 82].includes(weatherCode)) {
      advisories.push('🌧️ বৃষ্টির পূর্বাভাস — সার প্রয়োগ ও কীটনাশক স্প্রে স্থগিত করুন। পানি নিষ্কাশনের ব্যবস্থা করুন।');
    }
    if ([95, 96, 99].includes(weatherCode)) {
      advisories.push('⛈️ বজ্রপাতের সম্ভাবনা — খোলা মাঠে কাজ এড়িয়ে চলুন। গৃহপালিত পশু আশ্রয়ে রাখুন।');
    }
    if ([45, 48].includes(weatherCode)) {
      advisories.push('🌫️ কুয়াশা — ফসলে শিশির ও ছত্রাকের ঝুঁকি। পাতা শুকানোর ব্যবস্থা করুন।');
    }
  }

  // ET0 advisory
  if (agIndices?.et0 !== undefined) {
    if (agIndices.et0 > 5) {
      advisories.push('☀️ বাষ্পীভবন বেশি — ফসলে পানির চাহিদা বেড়েছে। অতিরিক্ত সেচ দিন।');
    }
  }

  // VPD advisory
  if (agIndices?.vpd !== undefined) {
    if (agIndices.vpd > 3) {
      advisories.push('💨 বাষ্প চাপ ঘাটতি বেশি — ফসল পানি হারাচ্ছে। সেচ ও শীতল আবরণ ব্যবহার করুন।');
    }
  }

  // Leaf wetness advisory
  if (agIndices?.leafWetness !== undefined) {
    if (agIndices.leafWetness > 70) {
      advisories.push('🍃 পাতায় আর্দ্রতা বেশি — ছত্রাক ও ব্যাকটেরিয়াল রোগের ঝুঁকি। রোগতাত্ত্বিক পর্যবেক্ষণ বাড়ান।');
    }
  }

  // Soil moisture advisory
  if (agIndices?.soilMoisture !== undefined) {
    if (agIndices.soilMoisture < 0.15) {
      advisories.push('🌾 মাটির আর্দ্রতা কম — শুষ্ক অবস্থা। জরুরি সেচ প্রয়োজন।');
    } else if (agIndices.soilMoisture > 0.40) {
      advisories.push('🌊 মাটির আর্দ্রতা বেশি — পানি জমার আশঙ্কা। নিষ্কাশন ব্যবস্থা করুন।');
    }
  }

  if (advisories.length === 0) {
    advisories.push('✅ আবহাওয়া অনুকূল — স্বাভাবিক কৃষিকাজ চালিয়ে যান।');
  }

  return advisories;
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
      res.status(400).set(corsHeaders()).json({
        error: 'Invalid lat/lon values.',
      });
      return;
    }

    const currentParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_temperature_0cm',
      'soil_temperature_6cm',
    ].join(',');

    const dailyParams = [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'et0_fao_evapotranspiration',
      'growing_degree_days_base_0_limit_50',
      'leaf_wetness_probability_mean',
      'vapour_pressure_deficit_max',
    ].join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&current=${currentParams}` +
      `&daily=${dailyParams}` +
      `&timezone=Asia/Dhaka&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Open-Meteo API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Transform current weather with Bengali labels
    const weatherLabel = getWeatherLabel(data.current?.weather_code);
    const current = {
      temperature_2m: data.current?.temperature_2m,
      temperature_label: `${data.current?.temperature_2m}°C`,
      temperature_bn: `${data.current?.temperature_2m}°সে`,
      relative_humidity_2m: data.current?.relative_humidity_2m,
      humidity_bn: `${data.current?.relative_humidity_2m}% আর্দ্রতা`,
      weather_code: data.current?.weather_code,
      weather_en: weatherLabel.en,
      weather_bn: weatherLabel.bn,
      wind_speed_10m: data.current?.wind_speed_10m,
      wind_bn: `${data.current?.wind_speed_10m} কিমি/ঘন্টা বাতাস`,
      soil_moisture_0_to_1cm: data.current?.soil_moisture_0_to_1cm,
      soil_moisture_1_to_3cm: data.current?.soil_moisture_1_to_3cm,
      soil_temperature_0cm: data.current?.soil_temperature_0cm,
      soil_temperature_6cm: data.current?.soil_temperature_6cm,
    };

    // Transform daily forecast with Bengali labels
    const daily = (data.daily?.time || []).map((date, i) => {
      const dayWeatherLabel = getWeatherLabel(data.daily?.weather_code?.[i]);
      return {
        date,
        weather_code: data.daily?.weather_code?.[i],
        weather_en: dayWeatherLabel.en,
        weather_bn: dayWeatherLabel.bn,
        temperature_2m_max: data.daily?.temperature_2m_max?.[i],
        temperature_2m_min: data.daily?.temperature_2m_min?.[i],
        tempRange_bn: `${data.daily?.temperature_2m_min?.[i]}°সে — ${data.daily?.temperature_2m_max?.[i]}°সে`,
        precipitation_sum: data.daily?.precipitation_sum?.[i],
        precipitation_bn: `${data.daily?.precipitation_sum?.[i]} মিমি বৃষ্টিপাত`,
      };
    });

    // Agricultural indices (today = index 0)
    const todayIdx = 0;
    const agIndices = {
      et0: data.daily?.et0_fao_evapotranspiration?.[todayIdx],
      et0_label_bn: `বাষ্পীভবন: ${data.daily?.et0_fao_evapotranspiration?.[todayIdx]?.toFixed(1) || '—'} মিমি/দিন`,
      gdd: data.daily?.growing_degree_days_base_0_limit_50?.[todayIdx],
      gdd_label_bn: `বৃদ্ধি ডিগ্রি দিন: ${data.daily?.growing_degree_days_base_0_limit_50?.[todayIdx]?.toFixed(1) || '—'}`,
      leafWetness: data.daily?.leaf_wetness_probability_mean?.[todayIdx],
      leafWetness_label_bn: `পাতায় আর্দ্রতা সম্ভাবনা: ${data.daily?.leaf_wetness_probability_mean?.[todayIdx] ?? '—'}%`,
      vpd: data.daily?.vapour_pressure_deficit_max?.[todayIdx],
      vpd_label_bn: `বাষ্প চাপ ঘাটতি: ${data.daily?.vapour_pressure_deficit_max?.[todayIdx]?.toFixed(2) || '—'} kPa`,
      soilMoisture:
        data.current?.soil_moisture_0_to_1cm !== undefined
          ? (data.current.soil_moisture_0_to_1cm + (data.current.soil_moisture_1_to_3cm || 0)) / 2
          : undefined,
      soilMoisture_label_bn:
        data.current?.soil_moisture_0_to_1cm !== undefined
          ? `মাটির আর্দ্রতা: ${(((data.current.soil_moisture_0_to_1cm + (data.current.soil_moisture_1_to_3cm || 0)) / 2) * 100).toFixed(1)}%`
          : 'মাটির আর্দ্রতা: অজানা',
    };

    // Generate advisory
    const advisory = generateAdvisory(current, daily, agIndices);

    res.status(200).set(corsHeaders()).json({
      current,
      daily,
      agIndices,
      advisory,
      source: 'open-meteo',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[weather] Error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Failed to fetch weather data',
      detail: err.message,
    });
  }
}
