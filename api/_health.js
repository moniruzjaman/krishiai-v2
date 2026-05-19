// KrishiAI v2 — /api/_health
// Health check endpoint for monitoring and deployment verification

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'krishiai-v2',
    version: '2.0.0',
    env: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
      PLANTNET_API_KEY: !!process.env.PLANTNET_API_KEY,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage ? {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    } : null,
  };

  res.status(200).json(health);
}
