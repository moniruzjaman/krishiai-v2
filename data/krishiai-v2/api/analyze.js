// api/analyze.js — Crop Analysis
// Chain: Gemini 2.0 Flash → Groq Llama 4 Scout (vision) → Rule-based Bengali

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `তুমি বাংলাদেশের কৃষি বিশেষজ্ঞ AI। তুমি DAE, BARI, BRRI, BARC, SRDI-এর নির্দেশিকা অনুযায়ী পরামর্শ দাও।
সর্বদা বাংলায় উত্তর দাও। কাঠামোবদ্ধ উত্তর দাও:
১. সমস্যা চিহ্নিতকরণ
২. কারণ
৩. প্রতিকার
৪. প্রস্তাবিত কীটনাশক/সার (DAE-অনুমোদিত)
৫. প্রতিরোধমূলক ব্যবস্থা`;

async function callGemini(prompt, imageBase64, mimeType) {
  const parts = [{ text: prompt }];
  if (imageBase64) {
    parts.unshift({ inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } });
  }

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024, topP: 0.9 }
    })
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt, imageBase64, mimeType) {
  const content = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` } },
        { type: 'text', text: prompt }
      ]
    : prompt;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: imageBase64
        ? 'meta-llama/llama-4-scout-17b-16e-instruct'
        : 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content }
      ],
      max_tokens: 1024,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function ruleBasedResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('ধান') || p.includes('rice'))
    return '🌾 ধানের জন্য সাধারণ পরামর্শ: সঠিক সময়ে সেচ দিন, সার প্রয়োগ করুন এবং পোকামাকড়ের জন্য নিয়মিত পর্যবেক্ষণ করুন। বিস্তারিত পরামর্শের জন্য স্থানীয় DAE কার্যালয়ে যোগাযোগ করুন।';
  if (p.includes('সবজি') || p.includes('vegetable'))
    return '🥬 সবজি চাষে জৈব সার ব্যবহার করুন। মাটি পরীক্ষা করে সার প্রয়োগ করুন। IPM পদ্ধতিতে কীটপতঙ্গ নিয়ন্ত্রণ করুন।';
  return '🌱 আপনার প্রশ্নের জন্য ধন্যবাদ। নেটওয়ার্ক সমস্যার কারণে এই মুহূর্তে বিস্তারিত পরামর্শ দেওয়া সম্ভব হচ্ছে না। স্থানীয় উপজেলা কৃষি অফিসে যোগাযোগ করুন।';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, imageBase64, mimeType, upazila, district } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const fullPrompt = upazila
      ? `[অবস্থান: ${upazila}, ${district || 'কুড়িগ্রাম'}]\n\n${prompt}`
      : prompt;

    let result = '';
    let provider = '';

    if (process.env.GEMINI_API_KEY) {
      try { result = await callGemini(fullPrompt, imageBase64, mimeType); provider = 'gemini'; }
      catch (e) { console.warn('Gemini failed:', e.message); }
    }

    if (!result && process.env.GROQ_API_KEY) {
      try { result = await callGroq(fullPrompt, imageBase64, mimeType); provider = 'groq'; }
      catch (e) { console.warn('Groq failed:', e.message); }
    }

    if (!result) { result = ruleBasedResponse(prompt); provider = 'rule-based'; }

    res.status(200).json({ result, provider });
  } catch (err) {
    console.error('analyze error:', err);
    res.status(500).json({ error: 'বিশ্লেষণ ব্যর্থ হয়েছে।', result: ruleBasedResponse(req.body?.prompt || '') });
  }
}
