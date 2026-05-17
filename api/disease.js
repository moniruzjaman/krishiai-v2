// KrishiAI v2 — /api/disease
// POST handler for plant disease detection
// Three-tier: HuggingFace ViT → PlantNet → Gemini Vision

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- Label-to-Bengali mapping for crop leaf diseases ----------
const DISEASE_LABEL_MAP = {
  'Apple___Apple_scab': { bn: 'আপেল স্ক্যাব', treatment: 'ক্যাপ্টান বা ম্যানকোজেব ছত্রাকনাশক প্রয়োগ করুন।', prevention: 'আক্রান্ত পাতা অপসারণ, প্রতিরোধী জাত লাগান।' },
  'Apple___Black_rot': { bn: 'আপেল কালো পচা', treatment: 'মাইক্লোবিউটানিল ছত্রাকনাশক ব্যবহার করুন।', prevention: 'ছাঁটাইয়ের সময় আক্রান্ত ডাল কেটে ফেলুন।' },
  'Apple___Cedar_apple_rust': { bn: 'আপেল সিডার মরিচা', treatment: 'মাইক্লোবিউটানিল বা ফেনারিমল প্রয়োগ করুন।', prevention: 'জুনিপার গাছ থেকে দূরে লাগান।' },
  'Apple___healthy': { bn: 'আপেল (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ ও সুষম সার প্রয়োগ করুন।' },
  'Blueberry___healthy': { bn: 'ব্লুবেরি (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'মাটির অম্লতা (pH 4.5-5.5) বজায় রাখুন।' },
  'Cherry___Powdery_mildew': { bn: 'চেরি গুঁড়া ছাতা', treatment: 'সালফার বা ট্রাইঅ্যাডিমেফন প্রয়োগ করুন।', prevention: 'গাছের মধ্যে পর্যাপ্ত বাতাস চলাচল নিশ্চিত করুন।' },
  'Cherry___healthy': { bn: 'চেরি (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ করুন।' },
  'Corn___Cercospora_leaf_spot': { bn: 'ভুট্টা সারকোস্পোরা পাতার দাগ', treatment: 'ম্যানকোজেব বা পাইরাক্লোস্ট্রোবিন প্রয়োগ করুন।', prevention: 'ফসল আবর্তন করুন, আক্রান্ত অবশিষ্ট পুড়িয়ে দিন।' },
  'Corn___Common_rust': { bn: 'ভুট্টা সাধারণ মরিচা', treatment: 'প্রোপাইকোনাজোল বা মাইক্লোবিউটানিল প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত লাগান।' },
  'Corn___Northern_Leaf_Blight': { bn: 'ভুট্টা উত্তর পাতা ব্লাইট', treatment: 'অ্যাজোক্সিস্ট্রোবিন + প্রোপাইকোনাজোল প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী সংকর জাত ব্যবহার করুন।' },
  'Corn___healthy': { bn: 'ভুট্টা (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'সুষম সার ও সেচ নিশ্চিত করুন।' },
  'Grape___Black_rot': { bn: 'আঙুর কালো পচা', treatment: 'মাইক্লোবিউটানিল বা ম্যানকোজেব প্রয়োগ করুন।', prevention: 'আক্রান্ত ফল ও পাতা অপসারণ করুন।' },
  'Grape___Esca_(Black_Measles)': { bn: 'আঙুর এসকা রোগ', treatment: 'ক্ষতস্থানে ছত্রাকনাশক প্রয়োগ করুন।', prevention: 'ছাঁটাইয়ের সময় সতর্কতা অবলম্বন করুন।' },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': { bn: 'আঙুর পাতা ব্লাইট', treatment: 'ম্যানকোজেব বা ক্লোরোথালোনিল প্রয়োগ করুন।', prevention: 'জল সেচ পদ্ধতি উন্নত করুন।' },
  'Grape___healthy': { bn: 'আঙুর (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত ছাঁটাই ও পর্যবেক্ষণ করুন।' },
  'Orange___Haunglongbing_(Citrus_greening)': { bn: 'কমলা হুয়াংলংবিং (সাইট্রাস গ্রিনিং)', treatment: 'বর্তমানে কোনো নিরাময় নেই। আক্রান্ত গাছ অপসারণ করুন।', prevention: 'এশিয়ান সাইট্রাস সাইলিড পোকা দমন করুন।' },
  'Peach___Bacterial_spot': { bn: 'পিচ ব্যাকটেরিয়াল দাগ', treatment: 'কপার ভিত্তিক ব্যাকটেরিয়ানাশক প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত লাগান।' },
  'Peach___healthy': { bn: 'পিচ (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ করুন।' },
  'Pepper,_bell___Bacterial_spot': { bn: 'মরিচ ব্যাকটেরিয়াল দাগ', treatment: 'কপার হাইড্রোক্সাইড প্রয়োগ করুন।', prevention: 'বীজ শোধন করুন, আক্রান্ত গাছ অপসারণ করুন।' },
  'Pepper,_bell___healthy': { bn: 'মরিচ (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'সুষম সার প্রয়োগ করুন।' },
  'Potato___Early_blight': { bn: 'আলু প্রাথমিক ব্লাইট', treatment: 'ম্যানকোজেব বা ক্লোরোথালোনিল প্রয়োগ করুন।', prevention: 'ফসল আবর্তন করুন, আলুর চারা পরিষ্কার রাখুন।' },
  'Potato___Late_blight': { bn: 'আলু বিলম্বিত ব্লাইট', treatment: 'মেটাল্যাক্সিল + ম্যানকোজেব প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত ব্যবহার, সময়মতো ছত্রাকনাশক প্রয়োগ।' },
  'Potato___healthy': { bn: 'আলু (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'সুষম সার ও সেচ নিশ্চিত করুন।' },
  'Rice___Brown_Spot': { bn: 'ধান বাদামি দাগ', treatment: 'প্রোপাইকোনাজোল বা আইসোপ্রোথিওলেন প্রয়োগ করুন।', prevention: 'বীজ শোধন, সুষম সার প্রয়োগ, পটাশিয়াম সার বাড়ান।' },
  'Rice___Leaf_Blast': { bn: 'ধান পাতা ব্লাস্ট', treatment: 'ট্রাইসাইক্লাজোল ছত্রাকনাশক প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত, নাইট্রোজেন সারের মাত্রা কমান।' },
  'Rice___Neck_Blast': { bn: 'ধান গলা ব্লাস্ট', treatment: 'ট্রাইসাইক্লাজোল বা আইসোপ্রোথিওলেন প্রয়োগ করুন।', prevention: 'ব্লাস্ট প্রতিরোধী জাত লাগান।' },
  'Rice___healthy': { bn: 'ধান (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ ও সুষম সার প্রয়োগ করুন।' },
  'Soybean___healthy': { bn: 'সয়াবিন (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'সুষম সার ও সঠিক সেচ নিশ্চিত করুন।' },
  'Squash___Powdery_mildew': { bn: 'স্কোয়াশ গুঁড়া ছাতা', treatment: 'সালফার বা ট্রাইঅ্যাডিমেফন প্রয়োগ করুন।', prevention: 'বাতাস চলাচল বাড়ান, ঘন লাগানো এড়িয়ে চলুন।' },
  'Strawberry___Leaf_scorch': { bn: 'স্ট্রবেরি পাতা পোড়া', treatment: 'মাইক্লোবিউটানিল প্রয়োগ করুন।', prevention: 'আক্রান্ত পাতা অপসারণ, সেচ নিয়ন্ত্রণ।' },
  'Strawberry___healthy': { bn: 'স্ট্রবেরি (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ করুন।' },
  'Tomato___Bacterial_spot': { bn: 'টমেটো ব্যাকটেরিয়াল দাগ', treatment: 'কপার হাইড্রোক্সাইড প্রয়োগ করুন।', prevention: 'বীজ শোধন, আক্রান্ত গাছ অপসারণ।' },
  'Tomato___Early_blight': { bn: 'টমেটো প্রাথমিক ব্লাইট', treatment: 'ম্যানকোজেব বা ক্লোরোথালোনিল প্রয়োগ করুন।', prevention: 'ফসল আবর্তন, আক্রান্ত পাতা অপসারণ।' },
  'Tomato___Late_blight': { bn: 'টমেটো বিলম্বিত ব্লাইট', treatment: 'মেটাল্যাক্সিল + ম্যানকোজেব প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত, সময়মতো ছত্রাকনাশক।' },
  'Tomato___Leaf_Mold': { bn: 'টমেটো পাতা ছাঁচ', treatment: 'ক্যাপ্টান বা মাইক্লোবিউটানিল প্রয়োগ করুন।', prevention: 'গ্রিনহাউসে বায়ুচলাচল বাড়ান।' },
  'Tomato___Septoria_leaf_spot': { bn: 'টমেটো সেপ্টোরিয়া পাতার দাগ', treatment: 'ক্লোরোথালোনিল বা ম্যানকোজেব প্রয়োগ করুন।', prevention: 'নিচের পাতা অপসারণ, জল ছিটানো এড়িয়ে চলুন।' },
  'Tomato___Spider_mites_Two-spotted_spider_mite': { bn: 'টমেটো মাকড় মাইট', treatment: 'অ্যাবামেক্টিন বা স্পাইরোমেসিফেন প্রয়োগ করুন।', prevention: 'পাতায় পানি ছিটিয়ে আর্দ্রতা বাড়ান।' },
  'Tomato___Target_Spot': { bn: 'টমেটো টার্গেট দাগ', treatment: 'অ্যাজোক্সিস্ট্রোবিন + ডাইফেনকোনাজোল প্রয়োগ করুন।', prevention: 'ফসল আবর্তন, সঠিক দূরত্বে লাগান।' },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': { bn: 'টমেটো হলুদ পাতা কুঁচকানো ভাইরাস', treatment: 'ভাইরাসের কোনো নিরাময় নেই। সাদা মাছি দমন করুন।', prevention: 'সাদা মাছি প্রতিরোধী জাল ব্যবহার, রোগ প্রতিরোধী জাত।' },
  'Tomato___Tomato_mosaic_virus': { bn: 'টমেটো মোজাইক ভাইরাস', treatment: 'ভাইরাসের কোনো নিরাময় নেই। আক্রান্ত গাছ অপসারণ করুন।', prevention: 'বীজ শোধন, হাত ধুয়ে গাছ স্পর্শ, তামাক থেকে দূরে থাকুন।' },
  'Tomato___healthy': { bn: 'টমেটো (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'নিয়মিত পর্যবেক্ষণ ও সুষম সার প্রয়োগ করুন।' },
  'Wheat___Brown_rust': { bn: 'গম বাদামি মরিচা', treatment: 'প্রোপাইকোনাজোল ছত্রাকনাশক প্রয়োগ করুন।', prevention: 'রোগ প্রতিরোধী জাত লাগান।' },
  'Wheat___Yellow_rust': { bn: 'গম হলুদ মরিচা', treatment: 'টেবুকোনাজোল বা প্রোপাইকোনাজোল প্রয়োগ করুন।', prevention: 'প্রতিরোধী জাত নির্বাচন, সময়মতো বপন।' },
  'Wheat___healthy': { bn: 'গম (সুস্থ)', treatment: 'কোনো চিকিৎসার প্রয়োজন নেই।', prevention: 'সুষম সার ও সেচ নিশ্চিত করুন।' },
};

function getDiseaseInfo(label) {
  const mapped = DISEASE_LABEL_MAP[label];
  if (mapped) {
    return { bengaliName: mapped.bn, treatment: mapped.treatment, prevention: mapped.prevention };
  }
  // Fallback: clean up the label
  const clean = label.replace(/_/g, ' ').replace(/___/g, ' — ');
  return {
    bengaliName: clean + ' (বাংলা নাম অজানা)',
    treatment: 'স্থানীয় কৃষি অফিসারের পরামর্শ নিন।',
    prevention: 'ফসল আবর্তন, সুষম সার ও পরিষ্কার জমি বজায় রাখুন।',
  };
}

// ---------- Tier 1: HuggingFace ViT ----------
async function callHuggingFace(imageBase64) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

  // Strip data URI prefix if present
  let data = imageBase64;
  if (typeof data === 'string' && data.startsWith('data:')) {
    const match = data.match(/^data:.+;base64,(.*)$/);
    if (match) data = match[1];
  }

  // Convert base64 to binary
  const buffer = Buffer.from(data, 'base64');

  const url = 'https://api-inference.huggingface.co/models/wambugu71/crop_leaf_diseases_vit';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HuggingFace API error ${response.status}: ${errText}`);
  }

  const predictions = await response.json();

  if (!Array.isArray(predictions) || predictions.length === 0) {
    throw new Error('No predictions returned from HuggingFace');
  }

  // Sort by score descending, take top 3
  const top3 = predictions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((p) => ({
      label: p.label,
      score: p.score,
    }));

  return top3;
}

// ---------- Tier 2: PlantNet ----------
async function callPlantNet(imageBase64) {
  const apiKey = process.env.PLANTNET_API_KEY;
  if (!apiKey) throw new Error('PLANTNET_API_KEY not configured');

  let data = imageBase64;
  if (typeof data === 'string' && data.startsWith('data:')) {
    const match = data.match(/^data:(.+?);base64,(.*)$/);
    if (match) data = match[2];
  }

  const buffer = Buffer.from(data, 'base64');

  // PlantNet requires multipart/form-data
  const formData = new FormData();
  formData.append('images', new Blob([buffer], { type: 'image/jpeg' }), 'leaf.jpg');

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`PlantNet API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const results = json?.results || [];

  if (results.length === 0) {
    throw new Error('No results from PlantNet');
  }

  // Get best result
  const best = results[0];
  const score = best.score || 0;
  const species = best.species || {};

  return {
    disease: species.scientificName || species.commonNames?.[0] || 'Unknown',
    confidence: score,
    eppoCode: species.epoCode || null,
    commonNames: species.commonNames || [],
  };
}

// ---------- Tier 3: Gemini Vision ----------
async function callGeminiVision(imageBase64, language) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const systemPrompt =
    language === 'bn'
      ? 'তুমি বাংলাদেশের উদ্ভিদ রোগ বিশেষজ্ঞ। পাতার ছবি দেখে রোগ শনাক্ত করো। ' +
        'JSON ফরম্যাটে উত্তর দাও: {"disease":"রোগের নাম","bengaliName":"বাংলা নাম",' +
        '"treatment":"চিকিৎসা","prevention":"প্রতিরোধ","confidence":0.8}'
      : 'You are a plant disease expert for Bangladesh. Identify the disease from the leaf image. ' +
        'Respond in JSON format: {"disease":"disease name","bengaliName":"Bengali name",' +
        '"treatment":"treatment","prevention":"prevention","confidence":0.8}';

  let mimeType = 'image/jpeg';
  let data = imageBase64;
  if (typeof data === 'string' && data.startsWith('data:')) {
    const match = data.match(/^data:(.+?);base64,(.*)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    }
  }

  const body = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { inlineData: { mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Try to parse JSON from response
  try {
    // Strip markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);
    return {
      disease: parsed.disease || 'Unknown',
      bengaliName: parsed.bengaliName || '',
      treatment: parsed.treatment || '',
      prevention: parsed.prevention || '',
      confidence: parsed.confidence || 0.5,
    };
  } catch {
    // If JSON parsing fails, return the raw text as result
    return {
      disease: 'Unknown',
      bengaliName: '',
      treatment: text,
      prevention: '',
      confidence: 0.3,
    };
  }
}

// ---------- Main handler ----------
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders()).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).set(corsHeaders()).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { image, language = 'bn' } = req.body || {};

    if (!image) {
      res.status(400).set(corsHeaders()).json({
        error: language === 'bn' ? 'ছবি প্রদান করুন (base64 ফরম্যাটে)।' : 'Please provide an image (base64 format).',
      });
      return;
    }

    // ---- Tier 1: HuggingFace ViT ----
    try {
      const predictions = await callHuggingFace(image);
      const topPrediction = predictions[0];

      if (topPrediction.score >= 0.5) {
        const info = getDiseaseInfo(topPrediction.label);
        const result = {
          disease: topPrediction.label.replace(/_/g, ' '),
          confidence: topPrediction.score,
          bengaliName: info.bengaliName,
          treatment: info.treatment,
          prevention: info.prevention,
          eppoCode: null,
          tier: 1,
          provider: 'huggingface-vit',
          alternatives: predictions.slice(1).map((p) => ({
            disease: p.label.replace(/_/g, ' '),
            confidence: p.score,
          })),
        };
        res.status(200).set(corsHeaders()).json(result);
        return;
      }

      // Low confidence — try PlantNet
      console.log(`[disease] HF confidence ${topPrediction.score} < 0.5, trying PlantNet`);
    } catch (err) {
      console.error(`[disease] HuggingFace failed: ${err.message}, trying PlantNet`);
    }

    // ---- Tier 2: PlantNet ----
    try {
      const plantNetResult = await callPlantNet(image);

      if (plantNetResult.confidence >= 0.7) {
        const result = {
          disease: plantNetResult.disease,
          confidence: plantNetResult.confidence,
          bengaliName: plantNetResult.commonNames?.[0] || plantNetResult.disease,
          treatment: 'স্থানীয় কৃষি সম্প্রসারণ অফিসারের পরামর্শ নিন।',
          prevention: 'ফসল আবর্তন, সুষম সার ও পরিষ্কার জমি বজায় রাখুন।',
          eppoCode: plantNetResult.eppoCode,
          tier: 2,
          provider: 'plantnet',
        };
        res.status(200).set(corsHeaders()).json(result);
        return;
      }

      console.log(`[disease] PlantNet confidence ${plantNetResult.confidence} < 0.7, trying Gemini`);
    } catch (err) {
      console.error(`[disease] PlantNet failed: ${err.message}, trying Gemini`);
    }

    // ---- Tier 3: Gemini Vision ----
    try {
      const geminiResult = await callGeminiVision(image, language);
      const result = {
        disease: geminiResult.disease,
        confidence: geminiResult.confidence,
        bengaliName: geminiResult.bengaliName,
        treatment: geminiResult.treatment,
        prevention: geminiResult.prevention,
        eppoCode: null,
        tier: 3,
        provider: 'gemini-vision',
      };
      res.status(200).set(corsHeaders()).json(result);
      return;
    } catch (err) {
      console.error(`[disease] Gemini Vision failed: ${err.message}`);
    }

    // ---- All tiers failed ----
    res.status(200).set(corsHeaders()).json({
      disease: language === 'bn' ? 'শনাক্ত করা যায়নি' : 'Unidentified',
      confidence: 0,
      bengaliName: language === 'bn' ? 'অজানা' : 'Unknown',
      treatment: language === 'bn'
        ? 'স্থানীয় কৃষি সম্প্রসারণ অফিসারের সাথে যোগাযোগ করুন।'
        : 'Please consult your local agricultural extension officer.',
      prevention: language === 'bn'
        ? 'ফসল আবর্তন, সুষম সার ও পরিষ্কার জমি বজায় রাখুন।'
        : 'Practice crop rotation, balanced fertilization, and field hygiene.',
      eppoCode: null,
      tier: 0,
      provider: 'none',
    });
  } catch (err) {
    console.error('[disease] Unhandled error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Internal server error',
      detail: err.message,
    });
  }
}
