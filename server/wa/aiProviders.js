/**
 * AI provider chain.
 *
 * Order matters: the fastest / most reliable paid provider is tried first and
 * the free one is only a safety net, so a user never sees "forbidden" or
 * "stream is not available" just because one vendor rate-limited us.
 *
 *   1. DeepSeek   (deepseek-chat)        — cheap, very fast, great at Roman Urdu
 *   2. Gemini     (gemini-2.5-flash)     — strong general model
 *   3. OpenAI     (gpt-4o-mini)          — best instruction following
 *   4. Pollinations (free, no key)       — last resort so the bot never dies
 *
 * Every call is time-boxed and errors are swallowed so the next provider runs.
 * A tiny in-memory health score skips providers that keep failing, which keeps
 * replies fast after the first bad key.
 */

const config = require('../config');

const health = new Map(); // provider -> { fails, skipUntil }

function penalise(name) {
  const h = health.get(name) || { fails: 0, skipUntil: 0 };
  h.fails += 1;
  // 1st fail: 30s, then 2m, 10m — exponential-ish backoff, capped.
  const wait = Math.min(10 * 60_000, 30_000 * Math.pow(4, Math.min(h.fails - 1, 3)));
  h.skipUntil = Date.now() + wait;
  health.set(name, h);
}

function reward(name) {
  health.set(name, { fails: 0, skipUntil: 0 });
}

function usable(name) {
  const h = health.get(name);
  return !h || h.skipUntil < Date.now();
}

async function timed(fn, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fn(ctl.signal);
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------------------------------------- providers */

async function deepseek(messages, timeoutMs) {
  if (!config.DEEPSEEK_API_KEY) throw new Error('no key');
  const r = await timed(
    (signal) =>
      fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.DEEPSEEK_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 800,
          stream: false,
        }),
        signal,
      }),
    timeoutMs
  );
  if (!r.ok) throw new Error(`deepseek HTTP ${r.status}`);
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('deepseek empty');
  return String(text).trim();
}

async function gemini(messages, timeoutMs) {
  if (!config.GEMINI_API_KEY) throw new Error('no key');
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const body = {
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  // Fast lite models first (sub-second), then bigger ones for hard questions.
  const models = [config.GEMINI_MODEL, 'gemini-flash-lite-latest', 'gemini-3.5-flash']
    .filter(Boolean)
    .filter((m, i, a) => a.indexOf(m) === i);

  let lastErr;
  for (const model of models) {
    try {
      const r = await timed(
        (signal) =>
          fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // New AI Studio keys (AQ.*) work with the header form.
                'x-goog-api-key': config.GEMINI_API_KEY,
              },
              body: JSON.stringify(body),
              signal,
            }
          ),
        timeoutMs
      );
      if (!r.ok) {
        lastErr = new Error(`gemini ${model} HTTP ${r.status}`);
        continue; // try the next model
      }
      const data = await r.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
      if (!text) {
        lastErr = new Error('gemini empty');
        continue;
      }
      return String(text).trim();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('gemini failed');
}

async function openai(messages, timeoutMs) {
  if (!config.OPENAI_API_KEY) throw new Error('no key');
  const r = await timed(
    (signal) =>
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.OPENAI_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 800,
        }),
        signal,
      }),
    timeoutMs
  );
  if (!r.ok) throw new Error(`openai HTTP ${r.status}`);
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('openai empty');
  return String(text).trim();
}

async function pollinations(messages, timeoutMs) {
  const r = await timed(
    (signal) =>
      fetch('https://text.pollinations.ai/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages, private: true }),
        signal,
      }),
    timeoutMs
  );
  if (!r.ok) throw new Error(`pollinations HTTP ${r.status}`);
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('pollinations empty');
  return String(text).trim();
}

const CHAIN = [
  ['gemini', gemini],
  ['deepseek', deepseek],
  ['openai', openai],
  ['pollinations', pollinations],
];

/* ------------------------------------------------------------------ api */

/**
 * Ask any available provider.
 * @param {Array<{role:string,content:string}>} messages
 * @param {{timeoutMs?:number, maxChars?:number}} [opts]
 * @returns {Promise<{text:string, provider:string}|null>}
 */
async function ask(messages, opts = {}) {
  const timeoutMs = opts.timeoutMs || config.AI_TIMEOUT_MS;
  const maxChars = opts.maxChars || 3500;

  for (const [name, fn] of CHAIN) {
    if (!usable(name)) continue;
    try {
      const text = await fn(messages, timeoutMs);
      if (text) {
        reward(name);
        return { text: text.slice(0, maxChars), provider: name };
      }
    } catch {
      penalise(name);
    }
  }
  return null;
}

/** Which providers are configured (for `.ai status`). */
function status() {
  return {
    deepseek: Boolean(config.DEEPSEEK_API_KEY),
    gemini: Boolean(config.GEMINI_API_KEY),
    openai: Boolean(config.OPENAI_API_KEY),
    pollinations: true,
    healthy: CHAIN.filter(([n]) => usable(n)).map(([n]) => n),
  };
}

module.exports = { ask, status };
