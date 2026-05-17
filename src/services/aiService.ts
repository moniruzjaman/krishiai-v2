/**
 * AI Service — client-side wrapper for KrishiAI AI API endpoints.
 */

// ── Types ───────────────────────────────────────────────────────

export interface LocationData {
  lat: number
  lon: number
  upazila?: string
  district?: string
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: number
}

export interface AnalysisResult {
  summary: string
  details: string
  recommendations: string[]
  confidence: number
  tags: string[]
}

export interface ChatResponse {
  message: string
  followUpQuestions?: string[]
  sources?: string[]
}

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

async function fetchApi<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

// ── Public functions ────────────────────────────────────────────

/**
 * Analyze an image + text query with location context.
 */
export async function analyzeImage(
  image: string | null,
  text: string,
  location: LocationData,
): Promise<AnalysisResult> {
  return fetchApi<AnalysisResult>("/api/analyze", {
    image,
    text,
    location,
  })
}

/**
 * Send a chat message with conversation history and location context.
 */
export async function sendChat(
  message: string,
  history: ChatMessage[],
  location: LocationData,
): Promise<ChatResponse> {
  return fetchApi<ChatResponse>("/api/chat", {
    message,
    history,
    location,
  })
}

/**
 * Detect a plant disease from an image.
 */
export async function detectDisease(image: string): Promise<DiseaseResult> {
  return fetchApi<DiseaseResult>("/api/disease", {
    image,
  })
}
