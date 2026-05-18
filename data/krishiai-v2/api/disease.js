// api/disease.js — Plant Disease Detection
// Tier 1: HuggingFace wambugu71/crop_leaf_diseases_vit  (rice, wheat, corn)
// Tier 2: HuggingFace linkanjarad/mobilenet_v2          (PlantVillage, actual fallback)
// Tier 3: PlantNet API                                   (500/day free, 50K+ species)
// Tier 4: Gemini 2.0 Flash Vision                       (Bengali analysis, always works)

const HF_URL        = 'https://api-inference.huggingface.co/models/';
const VIT_MODEL     = 'wambugu71/crop_leaf_diseases_vit';
const MNV2_MODEL    = 'linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
const PLANTNET_URL  = 'https://my-api.plantnet.org/v2/identify/all';
const GEMINI_URL    = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Bangladesh crop name mapping (English → Bengali)
const CROP_MAP = {
  rice: 'ধান', wheat: 'গম', corn: 'ভুট্টা', maize: 'ভুট্টা',
  tomato: 'টমেটো', potato: 'আলু', pepper: 'মরিচ', grape: 'আঙুর',
  apple: 'আপেল', strawberry: 'স্ট্রবেরি', peach: 'পিচ', cherry: 'চেরি',
  soybean: 'সয়াবিন', squash: 'কুমড়া', orange: 'কমলা', jute: 'পাট'
};

// Disease name mapping
const DISEASE_MAP = {
  'bacterial_blight': 'ব্যাকটেরিয়াল ব্লাইট', 'blast': 'ব্লাস্ট রোগ',
  'brown_spot': 'বাদামি দাগ রোগ', 'leaf_scald': 'পাতা পোড়া রোগ',
  'sheath_blight': 'খোল পচা রোগ', 'healthy': 'সুস্থ', 'rust': 'মরিচা রোগ',
  'early_blight': 'আগাম ধ্বসা', 'late_blight': 'নাবি ধ্বসা',
  'leaf_mold': 'পাতার ছাঁচ', 'septoria': 'সেপটোরিয়া দাগ',
  'northern_leaf_blight': 'উত্তরীয় পাতা ঝলসা', 'common_rust': 'সাধারণ মরিচা'
};

function parseHFLabel(label) {
  const parts = label.toLowerCase().replace(/_{2,}/g, '___').split('___');
  const crop = parts[0] || 'অজানা ফসল';
  const disease = parts[1] || 'অজানা রোগ';
  return {
    crop: CROP_MAP[crop] || crop,
    disease: Object.entries(DISEASE_MAP).find(([k]) => disease.includes(k))?.[1] || disease,
    isHealthy: disease.includes('healthy')
  };
}

async function callHuggingFace(model, imageBuffer) {
  const res = await fetch(`${HF_URL}${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/octet-stream'
    },
    body: imageBuffer
  });
  if (!res.ok) throw new Error(`HF ${model} error: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('HF empty response');
  return data; // [{ label, score }, ...]
}

async function callPlantNet(imageBase64, mimeType) {
  const form = new FormData();
  const blob = new Blob([Buffer.from(imageBase64, 'base64')], { type: mimeType || 'image/jpeg' });
  form.append('images', blob, 'plant.jpg');
  form.append('organs', 'leaf');

  const res = await fetch(`${PLANTNET_URL}?api-key=${process.env.PLANTNET_API_KEY}&lang=bn&nb-results=3`, {
    method: 'POST',
    body: form
  });
  if (!res.ok) throw new Error(`PlantNet error: ${res.status}`);
  return await res.json();
}

async function callGeminiVision(imageBase64, mimeType) {
  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: 'তুমি একজন বাংলাদেশের উদ্ভিদ রোগ বিশেষজ্ঞ। BARI ও BRRI নির্দেশিকা অনুযায়ী রোগ চিহ্নিত করো এবং বাংলায় চিকিৎসা পদ্ধতি বলো।' }]
      },
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
          { text: 'এই গাছের পাতায় কী রোগ হয়েছে? রোগের নাম, কারণ, প্রতিকার ও প্রতিরোধ বাংলায় বলো। DAE-অনুমোদিত কীটনাশকের নাম উল্লেখ করো।' }
        ]
      }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
    })
  });
  if (!res.ok) throw new Error(`Gemini vision error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const CONFIDENCE_THRESHOLD = 0.70;

  // --- Tier 1: ViT model (rice, wheat, corn, better BD crop coverage) ---
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const results = await callHuggingFace(VIT_MODEL, imageBuffer);
      const top = results[0];
      if (top.score >= CONFIDENCE_THRESHOLD) {
        const parsed = parseHFLabel(top.label);
        return res.status(200).json({
          tier: 1, model: 'ViT (HuggingFace)', confidence: top.score,
          ...parsed, raw: results.slice(0, 3)
        });
      }
      console.log(`ViT confidence too low (${top.score}), trying tier 2`);
    } catch (e) { console.warn('ViT failed:', e.message); }

    // --- Tier 2: MobileNetV2 (PlantVillage — DIFFERENT model, actual fallback) ---
    try {
      const results = await callHuggingFace(MNV2_MODEL, imageBuffer);
      const top = results[0];
      if (top.score >= CONFIDENCE_THRESHOLD) {
        const parsed = parseHFLabel(top.label);
        return res.status(200).json({
          tier: 2, model: 'MobileNetV2 (HuggingFace)', confidence: top.score,
          ...parsed, raw: results.slice(0, 3)
        });
      }
      console.log(`MNV2 confidence too low (${top.score}), trying tier 3`);
    } catch (e) { console.warn('MNV2 failed:', e.message); }
  }

  // --- Tier 3: PlantNet API ---
  if (process.env.PLANTNET_API_KEY) {
    try {
      const data = await callPlantNet(imageBase64, mimeType);
      const top = data.results?.[0];
      if (top && top.score >= 0.5) {
        return res.status(200).json({
          tier: 3, model: 'PlantNet', confidence: top.score,
          crop: top.species?.commonNames?.[0] || top.species?.scientificNameWithoutAuthor,
          disease: 'PlantNet দিয়ে রোগ বিশ্লেষণ চলছে — Gemini বিস্তারিত বলবে',
          isHealthy: false, eppoCode: top.species?.eppoCode,
          scientificName: top.species?.scientificNameWithoutAuthor
        });
      }
    } catch (e) { console.warn('PlantNet failed:', e.message); }
  }

  // --- Tier 4: Gemini Vision (always Bengali, always works) ---
  if (process.env.GEMINI_API_KEY) {
    try {
      const analysis = await callGeminiVision(imageBase64, mimeType);
      return res.status(200).json({
        tier: 4, model: 'Gemini Vision', confidence: null,
        analysis, isGeminiAnalysis: true
      });
    } catch (e) { console.warn('Gemini vision failed:', e.message); }
  }

  return res.status(200).json({
    tier: 0, model: 'rule-based',
    analysis: '⚠️ ছবি বিশ্লেষণ সম্ভব হয়নি। ছবিটি স্পষ্ট আলোতে তুলুন এবং রোগাক্রান্ত পাতা সরাসরি দেখা যাচ্ছে কিনা নিশ্চিত করুন। বিস্তারিত পরামর্শের জন্য স্থানীয় কৃষি অফিসে যোগাযোগ করুন।'
  });
}
