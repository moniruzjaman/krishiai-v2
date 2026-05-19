/**
 * Disease Service — client-side wrapper for KrishiAI disease detection API.
 */

// ── Types ───────────────────────────────────────────────────────

export interface DiseaseResult {
  disease: string
  bengaliName: string
  confidence: number
  severity: "low" | "medium" | "high" | "critical"
  description: string
  symptoms: string[]
  treatment: string
  barcTreatment: string
  preventiveMeasures: string[]
  affectedCrops: string[]
}

// ── API base ────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || ""

// ── Bengali disease name map ────────────────────────────────────

const DISEASE_BENGALI: Record<string, string> = {
  // Rice diseases
  "rice blast": "ধানের ব্লাস্ট রোগ",
  "bacterial leaf blight": "ব্যাকটেরিয়াল পাতা পোড়া রোগ",
  "sheath blight": "খোল পোড়া রোগ",
  "tungro": "টুংরো রোগ",
  "brown spot": "বাদামী দাগ রোগ",
  "rice sheath rot": "খোল পচা রোগ",
  "stem rot": "কাণ্ড পচা রোগ",
  "bacterial leaf streak": "ব্যাকটেরিয়াল পাতায় ডোরা রোগ",

  // Wheat diseases
  "wheat rust": "গমের মরিচা রোগ",
  "wheat blast": "গমের ব্লাস্ট রোগ",
  "powdery mildew": "গুঁড়া ছাঁচ রোগ",
  "spot blotch": "বাদামী দাগ রোগ",

  // Potato diseases
  "late blight": "পরবর্তী ঝলসা রোগ",
  "early blight": "প্রাথমিক ঝলসা রোগ",
  "potato scab": "আলুর খোসা রোগ",
  "black scurf": "কালো খোসা রোগ",

  // Vegetable diseases
  "downy mildew": "নিচের ছাঁচ রোগ",
  "fusarium wilt": "ফিউজেরিয়াম উইল্ট রোগ",
  "verticillium wilt": "ভার্টিসিলিয়াম উইল্ট রোগ",
  "anthracnose": "অ্যানথ্রাকনোজ রোগ",
  "mosaic virus": "মোজাইক ভাইরাস",
  "leaf curl": "পাতা কুঁচকানো রোগ",
  "damping off": "চারা পচা রোগ",
  "root rot": "শিকড় পচা রোগ",
  "fruit rot": "ফল পচা রোগ",
  "bacterial wilt": "ব্যাকটেরিয়াল উইল্ট রোগ",
  "gray mold": "ধূসর ছাঁচ রোগ",
  "white mold": "সাদা ছাঁচ রোগ",
  "sooty mold": "কালো ছাঁচ রোগ",
  "leaf spot": "পাতায় দাগ রোগ",
  "blight": "ঝলসা রোগ",
  "canker": "ক্যাঙ্কার রোগ",
  "scab": "খোসা রোগ",
  "rust": "মরিচা রোগ",
  "wilt": "উইল্ট রোগ",
  "rot": "পচা রোগ",
  "mildew": "ছাঁচ রোগ",
  "nematode": "নেমাটোড রোগ",
}

// ── BARI Treatment map ──────────────────────────────────────────

const BARI_TREATMENTS: Record<string, string> = {
  "rice blast":
    "বারি সুপারিশ: টিল্ট ২৫০ ইসি (প্রোপিকোনাজোল) প্রতি লিটার পানিতে ১ মিলি হারে মিশিয়ে ৩ বার স্প্রে করুন। রোগ প্রতিরোধী জাত যেমন বিআর৯, বিআর১১, বিআর২২ চাষ করুন।",
  "bacterial leaf blight":
    "বারি সুপারিশ: কপার হাইড্রক্সাইড ৭৭% ডব্লিউপি প্রতি লিটার পানিতে ২ গ্রাম হারে প্রয়োগ করুন। আক্রান্ত গাছ মাটি সহ তুলে ফেলুন।",
  "sheath blight":
    "বারি সুপারিশ: হেক্সাকোনাজোল ৫% ইসি প্রতি লিটার পানিতে ২ মিলি হারে স্প্রে করুন। অতিরিক্ত নাইট্রোজেন সার প্রয়োগ এড়িয়ে চলুন।",
  "late blight":
    "বারি সুপারিশ: মেটাল্যাক্সিল + ম্যানকোজেব (রিডোমিল গোল্ড) প্রতি লিটার পানিতে ২.৫ গ্রাম হারে ৩ দিন পর পর স্প্রে করুন।",
  "early blight":
    "বারি সুপারিশ: ম্যানকোজেব ৮০% ডব্লিউপি প্রতি লিটার পানিতে ২.৫ গ্রাম হারে স্প্রে করুন। শস্য পর্যায়ক্রম অনুসরণ করুন।",
  "powdery mildew":
    "বারি সুপারিশ: সালফার ৮০% ডব্লিউপি প্রতি লিটার পানিতে ৩ গ্রাম হারে স্প্রে করুন। গাছের ফাঁকা রাখুন এবং আলো-বাতাস নিশ্চিত করুন।",
  "downy mildew":
    "বারি সুপারিশ: মেটাল্যাক্সিল + ম্যানকোজেব প্রতি লিটার পানিতে ২.৫ গ্রাম হারে স্প্রে করুন। পানি জমতে দেবেন না।",
  "fusarium wilt":
    "বারি সুপারিশ: কার্বেন্ডাজিম ৫০% ডব্লিউপি প্রতি লিটার পানিতে ১ গ্রাম হারে মাটিতে প্রয়োগ করুন। রোগ প্রতিরোধী জাত ব্যবহার করুন।",
  "anthracnose":
    "বারি সুপারিশ: কার্বেন্ডাজিম ৫০% ডব্লিউপি বা ম্যানকোজেব প্রতি লিটার পানিতে ২ গ্রাম হারে স্প্রে করুন।",
  "mosaic virus":
    "বারি সুপারিশ: ভাইরাস বাহক আফিদ দমনে ইমিডাক্লোপ্রিড প্রতি লিটার পানিতে ০.৫ মিলি হারে স্প্রে করুন। আক্রান্ত গাছ অবিলম্বে তুলে ফেলুন।",
  "leaf curl":
    "বারি সুপারিশ: সাদা মাছি দমনে ট্রায়াজোফোস ৪০% ইসি প্রতি লিটার পানিতে ১.৫ মিলি হারে স্প্রে করুন। রোগ প্রতিরোধী জাত চাষ করুন।",
  "bacterial wilt":
    "বারি সুপারিশ: শস্য পর্যায়ক্রম অনুসরণ করুন। ট্রাইকোডারমা ভিরিডি মাটিতে প্রয়োগ করুন। আক্রান্ত গাছ মাটি সহ তুলে ফেলুন।",
  "root rot":
    "বারি সুপারিশ: কার্বেন্ডাজিম মাটিতে প্রয়োগ করুন। নিষ্কাশন ব্যবস্থা উন্নত করুন। ট্রাইকোডারমা জৈব নিয়ন্ত্রক হিসেবে ব্যবহার করুন।",
  "stem rot":
    "বারি সুপারিশ: হেক্সাকোনাজোল প্রতি লিটার পানিতে ২ মিলি হারে স্প্রে করুন। পানি নিষ্কাশন নিশ্চিত করুন।",
  "fruit rot":
    "বারি সুপারিশ: ম্যানকোজেব ৮০% ডব্লিউপি প্রতি লিটার পানিতে ২.৫ গ্রাম হারে স্প্রে করুন। পাকা ফল সময়মতো তুলুন।",
  "gray mold":
    "বারি সুপারিশ: ক্যাপটান ৫০% ডব্লিউপি বা প্রোপাইনব ৭০% ডব্লিউপি প্রতি লিটার পানিতে ২ গ্রাম হারে স্প্রে করুন।",
  "wheat blast":
    "বারি সুপারিশ: ট্রাইফ্লক্সিস্ট্রোবিন + টেবুকোনাজোল প্রতি লিটার পানিতে ১ গ্রাম হারে স্প্রে করুন। ব্লাস্ট সহনশীল জাত বারি গম-২৫, ২৬ চাষ করুন।",
}

// ── Public functions ────────────────────────────────────────────

/**
 * Detect a plant disease from a base64-encoded image.
 */
export async function detectDisease(image: string): Promise<DiseaseResult> {
  const response = await fetch(`${API_BASE}/api/disease`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`Disease API error (${response.status}): ${errorText}`)
  }

  const result = (await response.json()) as DiseaseResult

  // Enrich with Bengali name if not provided by API
  if (!result.bengaliName || result.bengaliName === result.disease) {
    result.bengaliName = getBengaliDiseaseName(result.disease)
  }

  // Enrich with BARI treatment if not provided
  if (!result.barcTreatment) {
    result.barcTreatment = getBARITreatment(result.disease)
  }

  return result
}

/**
 * Get the Bengali name for a disease from its English name.
 */
export function getBengaliDiseaseName(english: string): string {
  const key = english.toLowerCase().trim()
  return DISEASE_BENGALI[key] ?? english
}

/**
 * Get BARI-recommended treatment for a disease.
 */
export function getBARITreatment(disease: string): string {
  const key = disease.toLowerCase().trim()

  // Try exact match
  if (BARI_TREATMENTS[key]) {
    return BARI_TREATMENTS[key]
  }

  // Try partial match (check if any key is a substring of the disease name)
  for (const [diseaseKey, treatment] of Object.entries(BARI_TREATMENTS)) {
    if (key.includes(diseaseKey) || diseaseKey.includes(key)) {
      return treatment
    }
  }

  // General fallback
  return "বারি সুপারিশ: স্থানীয় কৃষি সম্প্রসারণ অফিসে যোগাযোগ করুন অথবা কৃষি কল সেন্টারে (১৬১২৩) ফোন করুন।"
}
