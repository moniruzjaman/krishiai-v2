// KrishiAI v2 — /api/analyze
// POST handler for crop/image analysis
// Fallback chain: Gemini 2.0 Flash → Groq Llama 4 Scout → Groq Llama 3.3 70B → rule-based Bengali

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

const SYSTEM_PROMPT_BN =
  'তুমি বাংলাদেশের কৃষি বিশেষজ্ঞ। চাষাবাদ, ফসল রোগ, সার প্রয়োগ সম্পর্কে বাংলায় উত্তর দাও। উত্তরের কাঠামো: সমস্যা → কারণ → প্রতিকার → সুপারিশকৃত কীটনাশক → প্রতিরোধ।';

const SYSTEM_PROMPT_EN =
  'You are an agricultural expert for Bangladesh. Answer questions about farming, crop diseases, and fertilizer application. Response structure: Problem → Cause → Remedy → Recommended Pesticide → Prevention.';

// ---------- Gemini 2.0 Flash ----------
async function callGemini({ image, text, language }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const systemPrompt = language === 'bn' ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;

  const parts = [{ text: systemPrompt + '\n\n' + (text || 'এই ছবিটি বিশ্লেষণ করো।') }];

  if (image) {
    // Expect image as { mimeType, data } or raw base64 string
    let mimeType = 'image/jpeg';
    let data = image;
    if (typeof image === 'object') {
      mimeType = image.mimeType || 'image/jpeg';
      data = image.data;
    }
    // Strip data URI prefix if present
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = data.match(/^data:(.+?);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      }
    }
    parts.push({ inlineData: { mimeType, data } });
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,
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
  const result =
    json?.candidates?.[0]?.content?.parts?.[0]?.text ||
    (language === 'bn' ? 'কোনো উত্তর তৈরি করা যায়নি।' : 'No response generated.');

  return { result, provider: 'gemini-2.0-flash', confidence: 0.9 };
}

// ---------- Groq Llama 4 Scout (multimodal) ----------
async function callGroqScout({ image, text, language }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const systemPrompt = language === 'bn' ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;
  const content = [];

  if (image) {
    let mimeType = 'image/jpeg';
    let data = image;
    if (typeof image === 'object') {
      mimeType = image.mimeType || 'image/jpeg';
      data = image.data;
    }
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = data.match(/^data:(.+?);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      }
    }
    content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } });
  }

  content.push({ type: 'text', text: text || (language === 'bn' ? 'এই ছবিটি বিশ্লেষণ করো।' : 'Analyze this image.') });

  const body = {
    model: 'llama-4-scout-17b-16e-instruct',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    temperature: 0.4,
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
    throw new Error(`Groq Scout API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const result = json?.choices?.[0]?.message?.content ||
    (language === 'bn' ? 'কোনো উত্তর তৈরি করা যায়নি।' : 'No response generated.');

  return { result, provider: 'groq-llama4-scout', confidence: 0.75 };
}

// ---------- Groq Llama 3.3 70B (text-only) ----------
async function callGroqLlama({ text, language }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const systemPrompt = language === 'bn' ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text || 'বাংলাদেশের কৃষি সম্পর্কে তথ্য দাও।' },
    ],
    temperature: 0.4,
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
    throw new Error(`Groq Llama API error ${response.status}: ${errText}`);
  }

  const json = await response.json();
  const result = json?.choices?.[0]?.message?.content ||
    (language === 'bn' ? 'কোনো উত্তর তৈরি করা যায়নি।' : 'No response generated.');

  return { result, provider: 'groq-llama3.3-70b', confidence: 0.6 };
}

// ---------- Rule-based Bengali fallback ----------
function ruleBasedFallback({ text, language }) {
  if (language === 'en') {
    return {
      result:
        'General Agricultural Advisory for Bangladesh:\n\n' +
        '• Problem: Crop issues may arise from pests, diseases, nutrient deficiency, or weather stress.\n' +
        '• Cause: Common causes include improper fertilization, water stress, pest infestation.\n' +
        '• Remedy: Apply balanced fertilizers (NPK), ensure proper irrigation, use recommended pesticides.\n' +
        '• Recommended Pesticide: Consult local agricultural extension officer for specific recommendations.\n' +
        '• Prevention: Practice crop rotation, maintain field hygiene, use resistant varieties, monitor regularly.',
      provider: 'rule-based',
      confidence: 0.3,
    };
  }

  return {
    result:
      'সাধারণ কৃষি পরামর্শ:\n\n' +
      '• সমস্যা: ফসলে কীটপতঙ্গ, রোগ, পুষ্টির অভাব বা আবহাওয়ার প্রভাব দেখা দিতে পারে।\n' +
      '• কারণ: অনিয়মিত সার প্রয়োগ, পানির অভাব, কীটপতঙ্গের আক্রমণ ইত্যাদি।\n' +
      '• প্রতিকার: সুষম সার প্রয়োগ (ইউরিয়া, টিএসপি, এমপি), সেচ নিশ্চিত করুন, প্রস্তাবিত কীটনাশক ব্যবহার করুন।\n' +
      '• সুপারিশকৃত কীটনাশক: স্থানীয় কৃষি সম্প্রসারণ অফিসারের পরামর্শ নিন।\n' +
      '• প্রতিরোধ: ফসল আবর্তন করুন, মাঠ পরিষ্কার রাখুন, রোগ প্রতিরোধী জাত ব্যবহার করুন, নিয়মিত পর্যবেক্ষণ করুন।',
    provider: 'rule-based',
    confidence: 0.3,
  };
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
    const { image, text, language = 'bn', location } = req.body || {};

    if (!image && !text) {
      res.status(400).set(corsHeaders()).json({
        error: language === 'bn'
          ? 'ছবি বা টেক্সট প্রদান করুন।'
          : 'Please provide image or text for analysis.',
      });
      return;
    }

    const params = { image, text, language, location };

    // Fallback chain: Gemini → Groq Scout (if image) → Groq Llama 3.3 → rule-based
    const providers = [
      callGemini,
      ...(image ? [callGroqScout] : []),
      callGroqLlama,
    ];

    for (const provider of providers) {
      try {
        const result = await provider(params);
        res.status(200).set(corsHeaders()).json(result);
        return;
      } catch (err) {
        console.error(`[analyze] Provider failed: ${err.message}`);
        // Continue to next provider
      }
    }

    // All providers failed — rule-based fallback
    const fallback = ruleBasedFallback(params);
    res.status(200).set(corsHeaders()).json(fallback);
  } catch (err) {
    console.error('[analyze] Unhandled error:', err);
    res.status(500).set(corsHeaders()).json({
      error: 'Internal server error',
      detail: err.message,
    });
  }
}
