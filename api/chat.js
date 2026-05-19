// KrishiAI v2 — /api/chat
// POST handler for agricultural chatbot
// Fallback chain: Gemini 2.0 Flash → Groq Llama 3.3 70B → rule-based keyword matching

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ---------- District lookup (basic) ----------
const UPAZILA_DISTRICT_MAP = {
  // Kurigram
  kurigram_sadar: 'কুড়িগ্রাম',
  nageshwari: 'কুড়িগ্রাম',
  bhurungamari: 'কুড়িগ্রাম',
  phulbari: 'কুড়িগ্রাম',
  rajarhat: 'কুড়িগ্রাম',
  ulipur: 'কুড়িগ্রাম',
  chilmari: 'কুড়িগ্রাম',
  char_rajibpur: 'কুড়িগ্রাম',
  hatibandha: 'কুড়িগ্রাম',
  // Rangpur
  rangpur_sadar: 'রংপুর',
  pirgachha: 'রংপুর',
  pirganj: 'রংপুর',
  mithapukur: 'রংপুর',
  badarganj: 'রংপুর',
  gangachara: 'রংপুর',
  taraganj: 'রংপুর',
  kaunia: 'রংপুর',
  // Dhaka
  dct_dhaka: 'ঢাকা',
  // General fallback
};

function getDistrictFromUpazila(upazila) {
  if (!upazila) return 'বাংলাদেশ';
  const key = upazila.toLowerCase().replace(/[\s-]/g, '_');
  return UPAZILA_DISTRICT_MAP[key] || upazila;
}

// ---------- Gemini 2.0 Flash ----------
async function callGemini({ message, history, language, location }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const upazila = location?.upazila || 'বাংলাদেশ';
  const district = getDistrictFromUpazila(location?.upazila);

  const systemPrompt =
    language === 'bn'
      ? `তুমি বাংলাদেশের ${upazila}, ${district}-এর কৃষি বিশেষজ্ঞ। কৃষি, চাষাবাদ, ফসল রোগ, সার প্রয়োগ, আবহাওয়া ও বাজার সম্পর্কে বাংলায় সহজ ভাষায় উত্তর দাও। কৃষকদের বোঝার উপযোগী করে লিখো।`
      : `You are an agricultural expert for ${upazila}, ${district}, Bangladesh. Answer farming, crop disease, fertilizer, weather and market questions in simple language for farmers.`;

  const contents = [];
  // Build conversation history
  if (history && Array.isArray(history)) {
    for (const msg of history) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }
  // Add current message
  contents.push({ role: 'user', parts: [{ text: message }] });

  // Prepend system instruction via first user message if no history
  if (!history || history.length === 0) {
    if (contents.length > 0 && contents[0].role === 'user') {
      contents[0].parts[0].text = systemPrompt + '\n\n' + contents[0].parts[0].text;
    } else {
      contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
    }
  } else {
    // Insert system as first user message
    contents.unshift({ role: 'user', parts: [{ text: systemPrompt + '\n\nআমার প্রশ্ন: ' + message }] });
    // Remove duplicate user message at end
    contents.pop();
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
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
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const reply =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ||
    (language === 'bn' ? 'দুঃখিত, উত্তর তৈরি করা যায়নি।' : 'Sorry, no response generated.');

  return { reply, message: reply, provider: 'gemini-2.0-flash' };
}

// ---------- Groq Llama 3.3 70B ----------
async function callGroq({ message, history, language, location }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const upazila = location?.upazila || 'বাংলাদেশ';
  const district = getDistrictFromUpazila(location?.upazila);

  const systemPrompt =
    language === 'bn'
      ? `তুমি বাংলাদেশের ${upazila}, ${district}-এর কৃষি বিশেষজ্ঞ। কৃষি, চাষাবাদ, ফসল রোগ, সার প্রয়োগ, আবহাওয়া ও বাজার সম্পর্কে বাংলায় সহজ ভাষায় উত্তর দাও।`
      : `You are an agricultural expert for ${upazila}, ${district}, Bangladesh. Answer farming questions in simple language.`;

  const messages = [{ role: 'system', content: systemPrompt }];

  if (history && Array.isArray(history)) {
    for (const msg of history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: message });

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.5,
    max_tokens: 1024,
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const reply = json?.choices?.[0]?.message?.content ||
    (language === 'bn' ? 'দুঃখিত, উত্তর তৈরি করা যায়নি।' : 'Sorry, no response generated.');

  return { reply, message: reply, provider: 'groq-llama3.3-70b' };
}

// ---------- Rule-based keyword matching ----------
const KEYWORD_RESPONSES = {
  bn: [
    {
      keywords: ['ধান', 'চাষ', 'রোপা', 'বীজ'],
      reply:
        'ধান চাষের জন্য: উপযুক্ত জাত নির্বাচন করুন (বোরো মৌসুমে ব্রি ধান-৮৯, আমন মৌসুমে ব্রি ধান-৫২)। সুষম সার প্রয়োগ করুন — ইউরিয়া ২৫০ কেজি, টিএসপি ১০০ কেজি, এমপি ৮০ কেজি প্রতি হেক্টরে। সময়মতো সেচ ও নিড়ানি দিন।',
    },
    {
      keywords: ['রোগ', 'ব্লাস্ট', 'পোড়া', 'ছোপ'],
      reply:
        'ধানের ব্লাস্ট রোগের লক্ষণ: পাতায় ডিম্বাকৃতির বাদামি দাগ। প্রতিকার: ট্রাইসাইক্লাজোল জাতীয় ছত্রাকনাশক ব্যবহার করুন। প্রতিরোধ: রোগ প্রতিরোধী জাত লাগান, সারের মাত্রা সঠিক রাখুন, জমি পরিষ্কার রাখুন।',
    },
    {
      keywords: ['সার', 'ইউরিয়া', 'টিএসপি', 'এমপি', 'জিপসাম'],
      reply:
        'সার প্রয়োগের নিয়ম: শেষ চাষের সময় সব টিএসপি ও জিপসাম, অর্ধেক এমপি দিন। ইউরিয়া তিন কিস্তায় দিন — রোপার ১৫-২০ দিন পর, ৩০-৩৫ দিন পর এবং ৪৫-৫০ দিন পর। বাকি এমপি ২য় কিস্তায় দিন।',
    },
    {
      keywords: ['পানি', 'সেচ', 'খরা', 'বন্যা'],
      reply:
        'পানি ব্যবস্থাপনা: ধান ক্ষেতে ৩-৫ সেমি পানি রাখুন। খরার সময় বিরল সেচ পদ্ধতি (AWD) ব্যবহার করুন — এতে ৩০% পানি বাঁচে। বন্যার সময় উঁচু জমিতে ধান রাখুন ও দ্রুত পানি নিষ্কাশনের ব্যবস্থা করুন।',
    },
    {
      keywords: ['কীট', 'পোকা', 'মাজরা', 'গুঁড়া'],
      reply:
        'কীটপতঙ্গ দমন: বাদামি গাছফড়িং — ইমিডাক্লোপ্রিড প্রয়োগ করুন। ধানের মাজরা পোকা — কার্বোসালফোরান দানাদার সার হিসেবে প্রয়োগ করুন। সাদা গুঁড়া পোকা — বিটিএক্স (Bt) জৈবিক কীটনাশক ব্যবহার করুন।',
    },
    {
      keywords: ['মাছ', 'পুকুর', 'চিংড়ি', 'aquaculture'],
      reply:
        'মাছ চাষ: পুকুরে পলিকালচার পদ্ধতিতে রুই, কাতলা, মৃগেল ও সিলভার কার্প চাষ করুন। প্রতি শতাংশে ৮০-১০০ পোনা মাছ ছাড়ুন। নিয়মিত খাবার দিন — সরিষার খৈল, চালের কুঁড়া ও মাছের ফিড।',
    },
    {
      keywords: ['বাজার', 'দাম', 'মূল্য', 'বিক্রি'],
      reply:
        'বাজার মূল্য: ফসল বিক্রির সময় স্থানীয় বাজারের দাম জানুন। সরকারি ক্রয় মূল্যে ধান বিক্রি করতে স্থানীয় খাদ্য গুদামে যোগাযোগ করুন। সমবায় সমিতির মাধ্যমে সরাসরি বাজারে বিক্রি করলে বেশি লাভ হয়।',
    },
  ],
  en: [
    {
      keywords: ['rice', 'cultivation', 'seed', 'planting'],
      reply:
        'Rice cultivation: Select suitable varieties (Boro season: BRRI dhan-89, Aman season: BRRI dhan-52). Apply balanced fertilizers — Urea 250kg, TSP 100kg, MP 80kg per hectare. Ensure timely irrigation and weeding.',
    },
    {
      keywords: ['disease', 'blast', 'blight'],
      reply:
        'Rice blast disease: Symptoms include diamond-shaped brown spots on leaves. Treatment: Use Tricyclazole fungicide. Prevention: Plant resistant varieties, maintain proper fertilization, keep fields clean.',
    },
    {
      keywords: ['fertilizer', 'urea', 'tsp', 'mp'],
      reply:
        'Fertilizer application: Apply all TSP and Gypsum, half MP during final land preparation. Apply Urea in 3 splits — 15-20, 30-35, and 45-50 days after transplanting. Apply remaining MP with 2nd split.',
    },
  ],
};

function ruleBasedFallback({ message, language }) {
  const lang = language === 'en' ? 'en' : 'bn';
  const responses = KEYWORD_RESPONSES[lang] || KEYWORD_RESPONSES.bn;
  const lowerMsg = (message || '').toLowerCase();

  // Find best keyword match
  let bestMatch = null;
  let bestMatchCount = 0;

  for (const entry of responses) {
    const matchCount = entry.keywords.filter((kw) => lowerMsg.includes(kw)).length;
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = entry;
    }
  }

  if (bestMatch) {
    return { reply: bestMatch.reply, message: bestMatch.reply, provider: 'rule-based' };
  }

  // Generic fallback
  if (lang === 'en') {
    const enReply = 'I can help with rice cultivation, crop diseases, fertilizer application, pest control, ' +
        'irrigation, market prices, and aquaculture. Please ask a specific question about farming in Bangladesh.';
    return { reply: enReply, message: enReply, provider: 'rule-based' };
  }

  const bnReply = 'আমি ধান চাষ, ফসল রোগ, সার প্রয়োগ, কীটপতঙ্গ দমন, সেচ, বাজার মূল্য এবং মাছ চাষ ' +
      'সম্পর্কে সাহায্য করতে পারি। বাংলাদেশের কৃষি সম্পর্কে নির্দিষ্ট প্রশ্ন করুন।';
  return { reply: bnReply, message: bnReply, provider: 'rule-based' };
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
    const { message, history, language = 'bn', location } = req.body || {};

    if (!message) {
      res.status(400).set(corsHeaders()).json({
        error: language === 'bn' ? 'বার্তা প্রদান করুন।' : 'Please provide a message.',
      });
      return;
    }

    const params = { message, history, language, location };

    // Fallback chain: Gemini → Groq Llama 3.3 → rule-based
    const providers = [callGemini, callGroq];

    for (const provider of providers) {
      try {
        const result = await provider(params);
        res.status(200).set(corsHeaders()).json(result);
        return;
      } catch (err) {
        console.error(`[chat] Provider failed: ${err.message}`);
      }
    }

    // All providers failed — rule-based fallback
    const fallback = ruleBasedFallback(params);
    res.status(200).set(corsHeaders()).json(fallback);
  } catch (err) {
    console.error('[chat] Unhandled error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Internal server error',
      detail: err.message,
    });
  }
}
