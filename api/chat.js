// Serverless chat endpoint for the Meridian widget. Holds the model API key
// and the system prompt so neither ever reaches the browser.

const MAX_QUESTION_CHARS = 1000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

const DEFAULT_MODELS = {
  gemini: 'gemini-2.5-flash',
  groq: 'llama-3.3-70b-versatile',
};

function loadConfig() {
  const env = process.env;
  const provider = (env.PROVIDER || 'gemini').toLowerCase();
  return {
    allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    systemPrompt: env.SYSTEM_PROMPT || '',
    systemPrompts: parsePrompts(env.SYSTEM_PROMPTS),
    provider,
    model: env.MODEL || DEFAULT_MODELS[provider],
    apiKey: provider === 'groq' ? env.GROQ_API_KEY : env.GEMINI_API_KEY,
  };
}

function parsePrompts(raw) {
  return raw ? JSON.parse(raw) : {};
}

const hits = new Map();

// In-memory, so the limit is per warm instance. Good enough to stop one
// browser tab from draining the quota; use the platform firewall for more.
export function rateLimited(ip, now = Date.now()) {
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

export function resetRateLimit() {
  hits.clear();
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function resolvePrompt(cfg, business) {
  if (business) return Object.hasOwn(cfg.systemPrompts, business) ? cfg.systemPrompts[business] : '';
  return cfg.systemPrompt;
}

export default async function handler(req, res) {
  const cfg = loadConfig();
  const origin = req.headers.origin || '';

  if (!cfg.allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const body = typeof req.body === 'string' ? parseBody(req.body) : req.body || {};
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) return res.status(400).json({ error: 'Missing question' });
  if (question.length > MAX_QUESTION_CHARS) {
    return res.status(413).json({ error: 'Question too long' });
  }

  const business = typeof body.business === 'string' ? body.business : '';
  const system = resolvePrompt(cfg, business);
  if (!system) {
    return res.status(business ? 400 : 503).json({ error: business ? 'Unknown business' : 'Not configured' });
  }
  if (!cfg.apiKey || !cfg.model) return res.status(503).json({ error: 'Not configured' });

  try {
    const call = cfg.provider === 'groq' ? callGroq : callGemini;
    const reply = await call(cfg, system, question);
    if (!reply) return res.status(502).json({ error: 'No reply from model' });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chat.upstream_error', err.message);
    return res.status(502).json({ error: 'Upstream error' });
  }
}

function parseBody(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

async function callGemini(cfg, system, question) {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(cfg.model) + ':generateContent';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
    }),
  });
  if (!r.ok) throw new Error('gemini status=' + r.status);
  const data = await r.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

async function callGroq(cfg, system, question) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: question },
      ],
      max_tokens: 160,
      temperature: 0.3,
    }),
  });
  if (!r.ok) throw new Error('groq status=' + r.status);
  const data = await r.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}
