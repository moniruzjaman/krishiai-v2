// KrishiAI v2 — /api/weather
// GET handler for weather data from Open-Meteo
// Returns data matching the frontend WeatherData type (camelCase)
// Plus Bengali labels, agricultural indices, and advisory

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
  const temp = current?.temperature2m;
  const humidity = current?.relativeHumidity2m;
  const weatherCode = current?.weatherCode;

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
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'surface_pressure',
    ].join(',');

    const dailyParams = [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'et0_fao_evapotranspiration',
    ].join(',');

    const hourlyParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'soil_moisture_0_to_1cm',
      'soil_moisture_1_to_3cm',
      'soil_moisture_3_to_9cm',
    ].join(',');

    const url =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&current=${currentParams}` +
      `&daily=${dailyParams}` +
      `&hourly=${hourlyParams}` +
      `&timezone=Asia/Dhaka&forecast_days=7`;

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Open-Meteo API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // ── Build response matching frontend WeatherData type (camelCase) ──
    const weatherLabel = getWeatherLabel(data.current?.weather_code);

    const current = {
      temperature2m: data.current?.temperature_2m,
      relativeHumidity2m: data.current?.relative_humidity_2m,
      apparentTemperature: data.current?.apparent_temperature,
      weatherCode: data.current?.weather_code,
      windSpeed10m: data.current?.wind_speed_10m,
      windDirection10m: data.current?.wind_direction_10m,
      precipitation: data.current?.precipitation,
      surfacePressure: data.current?.surface_pressure,
    };

    const daily = {
      date: data.daily?.time || [],
      weatherCode: data.daily?.weather_code || [],
      temperature2mMax: data.daily?.temperature_2m_max || [],
      temperature2mMin: data.daily?.temperature_2m_min || [],
      precipitationSum: data.daily?.precipitation_sum || [],
      precipitationProbabilityMax: data.daily?.precipitation_probability_max || [],
      windSpeed10mMax: data.daily?.wind_speed_10m_max || [],
      et0Evapotranspiration: data.daily?.et0_fao_evapotranspiration || [],
    };

    const hourly = {
      time: data.hourly?.time || [],
      temperature2m: data.hourly?.temperature_2m || [],
      relativeHumidity2m: data.hourly?.relative_humidity_2m || [],
      precipitation: data.hourly?.precipitation || [],
      soilMoisture0To1cm: data.hourly?.soil_moisture_0_to_1cm,
      soilMoisture1To3cm: data.hourly?.soil_moisture_1_to_3cm,
      soilMoisture3To9cm: data.hourly?.soil_moisture_3_to_9cm,
    };

    // ── Agricultural indices (today = index 0) ──
    const agIndices = {
      et0: data.daily?.et0_fao_evapotranspiration?.[0],
      leafWetness: data.daily?.leaf_wetness_probability_mean?.[0],
      vpd: data.daily?.vapour_pressure_deficit_max?.[0],
      soilMoisture:
        data.current?.soil_moisture_0_to_1cm !== undefined
          ? (data.current.soil_moisture_0_to_1cm + (data.current.soil_moisture_1_to_3cm || 0)) / 2
          : undefined,
    };

    // ── Bengali labels ──
    const bengaliLabels = {
      weatherBn: weatherLabel.bn,
      weatherEn: weatherLabel.en,
      temperatureBn: `${data.current?.temperature_2m}°সে`,
      humidityBn: `${data.current?.relative_humidity_2m}% আর্দ্রতা`,
      windBn: `${data.current?.wind_speed_10m} কিমি/ঘন্টা বাতাস`,
    };

    // ── Generate advisory ──
    const advisory = generateAdvisory(current, daily, agIndices);

    res.status(200).set(corsHeaders()).json({
      // Primary data matching frontend WeatherData type
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      current,
      daily,
      hourly,
      // Extra enriched data
      agIndices,
      bengaliLabels,
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
