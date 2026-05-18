// api/chat.js — Agricultural Chatbot
// Chain: Gemini 2.0 Flash → Groq Llama 3.3 70B → Rule-based Bengali

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

function buildSystemPrompt(upazila, district, month) {
  return `তুমি কৃষি AI — বাংলাদেশের কৃষকদের জন্য AI-চালিত কৃষি পরামর্শদাতা।
তুমি DAE, BARI, BRRI, BARC, SRDI এবং বাংলাদেশ সরকারের কৃষি মন্ত্রণালয়ের নির্দেশিকা মেনে পরামর্শ দাও।

বর্তমান প্রসঙ্গ:
- অবস্থান: ${upazila ? upazila + ', ' : ''}${district || 'বাংলাদেশ'}
- মাস: ${month || 'অজানা'}
- লক্ষ্য কৃষক: ক্ষুদ্র ও প্রান্তিক কৃষক

নিয়মাবলী:
১. সর্বদা বাংলায় সহজ ভাষায় উত্তর দাও
২. ব্যবহারিক ও স্থানীয়ভাবে প্রযোজ্য পরামর্শ দাও
৩. DAE-অনুমোদিত কীটনাশক ও সারের নাম উল্লেখ করো
৪. প্রয়োজনে স্থানীয় কৃষি অফিসে যোগাযোগ করতে বলো
৫. IPM (সমন্বিত বালাই ব্যবস্থাপনা) পদ্ধতি অগ্রাধিকার দাও`;
}

const BENGALI_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
  'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

async function callGemini(messages, systemPrompt) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.9 }
    })
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(messages, systemPrompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function ruleBasedChat(lastMessage) {
  const msg = lastMessage.toLowerCase();
  if (msg.includes('ধান') || msg.includes('rice'))
    return '🌾 ধান চাষে সফলতার জন্য: সঠিক বীজ নির্বাচন (BRRI দাবি-৮৯, ৯২), সময়মতো রোপণ, সুষম সার প্রয়োগ এবং নিয়মিত সেচ নিশ্চিত করুন। আপনার এলাকার উপজেলা কৃষি অফিসে যোগাযোগ করুন।';
  if (msg.includes('পোকা') || msg.includes('রোগ'))
    return '🐛 ফসলে পোকামাকড় বা রোগ দেখা দিলে: প্রথমে IPM পদ্ধতি ব্যবহার করুন। প্রয়োজনে স্থানীয় DAE কর্মকর্তার সাথে পরামর্শ করুন। ছবি তুলে আমাদের Disease Detector ব্যবহার করুন।';
  if (msg.includes('সার') || msg.includes('fertilizer'))
    return '🌿 সার ব্যবহারে: মাটি পরীক্ষা করুন, প্রস্তাবিত মাত্রায় সার দিন। ইউরিয়া, TSP, MOP সার সঠিক অনুপাতে দেওয়া জরুরি। বিস্তারিত পরামর্শের জন্য ছবি পাঠান।';
  return '🌱 আপনার প্রশ্নের জন্য ধন্যবাদ। নেটওয়ার্ক সমস্যায় এই মুহূর্তে বিস্তারিত পরামর্শ সম্ভব হচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন বা স্থানীয় কৃষি অফিসে যোগাযোগ করুন।';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages = [], upazila, district } = req.body;
    if (!messages.length) return res.status(400).json({ error: 'messages required' });

    const month = BENGALI_MONTHS[new Date().getMonth()];
    const systemPrompt = buildSystemPrompt(upazila, district, month);

    let result = '';
    let provider = '';

    if (process.env.GEMINI_API_KEY) {
      try { result = await callGemini(messages, systemPrompt); provider = 'gemini'; }
      catch (e) { console.warn('Gemini chat failed:', e.message); }
    }

    if (!result && process.env.GROQ_API_KEY) {
      try { result = await callGroq(messages, systemPrompt); provider = 'groq'; }
      catch (e) { console.warn('Groq chat failed:', e.message); }
    }

    const lastMsg = messages[messages.length - 1]?.content || '';
    if (!result) { result = ruleBasedChat(lastMsg); provider = 'rule-based'; }

    res.status(200).json({ result, provider });
  } catch (err) {
    console.error('chat error:', err);
    res.status(500).json({ error: 'চ্যাট ব্যর্থ হয়েছে।' });
  }
}
