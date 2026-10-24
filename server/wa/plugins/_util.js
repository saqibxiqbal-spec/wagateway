/** Shared helpers for plugins. No external deps beyond Node + Baileys. */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const startedAt = Date.now();

function humanUptime(ms = Date.now() - startedAt) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function jidToNumber(jid = '') {
  return String(jid).split('@')[0].split(':')[0];
}

async function fetchJson(url, opts = {}) {
  const attempt = async () => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), opts.timeout || 15000);
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(opts.headers || {}),
        },
        signal: ctl.signal,
        method: opts.method || 'GET',
        body: opts.body,
      });
      if (!r.ok) {
        const e = new Error(`HTTP ${r.status}`);
        e.status = r.status;
        throw e;
      }
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  };
  return retry(attempt, opts.retries ?? 1);
}

async function fetchText(url, opts = {}) {
  const attempt = async () => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), opts.timeout || 15000);
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'text/plain, text/html, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(opts.headers || {}),
        },
        signal: ctl.signal,
      });
      if (!r.ok) {
        const e = new Error(`HTTP ${r.status}`);
        e.status = r.status;
        throw e;
      }
      return await r.text();
    } finally {
      clearTimeout(t);
    }
  };
  return retry(attempt, opts.retries ?? 1);
}

async function fetchBuffer(url, opts = {}) {
  const attempt = async () => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), opts.timeout || 30000);
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: '*/*',
          // Many CDNs 403 without a referer — this is what produced the
          // "forbidden" / "stream is not available" errors.
          Referer: opts.referer || new URL(url).origin + '/',
          ...(opts.headers || {}),
        },
        signal: ctl.signal,
      });
      if (!r.ok) {
        const e = new Error(`HTTP ${r.status}`);
        e.status = r.status;
        throw e;
      }
      const buf = Buffer.from(await r.arrayBuffer());
      if (!buf.length) {
        const e = new Error('empty stream');
        e.code = 'EMPTY_STREAM';
        throw e;
      }
      return buf;
    } finally {
      clearTimeout(t);
    }
  };
  return retry(attempt, opts.retries ?? 2);
}

/** Retry an async fn with a tiny backoff. Non-retryable errors bubble up. */
async function retry(fn, times = 1) {
  let last;
  for (let i = 0; i <= times; i += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const st = Number(err && err.status);
      // 4xx (except 429) will never succeed on retry.
      if (st && st >= 400 && st < 500 && st !== 429) break;
      if (i < times) await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }
  }
  throw last;
}

/**
 * Turn any thrown error into a message a WhatsApp user can actually read.
 * This is what removes the raw "forbidden", "unauthorized",
 * "stream is not available" replies.
 */
function friendlyError(err) {
  const msg = String((err && (err.message || err.code)) || err || '');
  const st = Number(err && err.status);
  const low = msg.toLowerCase();

  if (st === 401 || low.includes('unauthorized') || low.includes('401')) {
    return '\u{1F512} Ye service abhi login/authorization maang rahi hai, is liye kaam nahi kar saki. Kisi doosri command se try karein.';
  }
  if (st === 403 || low.includes('forbidden') || low.includes('403')) {
    return '\u26D4 Ye service ne request block kar di (forbidden). Thori der baad dobara try karein.';
  }
  if (st === 404 || low.includes('not found') || low.includes('404')) {
    return '\u{1F50D} Jo cheez aap ne maangi wo nahi mili. Spelling ya link check karein.';
  }
  if (st === 429 || low.includes('too many') || low.includes('rate limit')) {
    return '\u23F3 Bohat zyada requests ho gayi hain. 1 minute baad try karein.';
  }
  if (low.includes('stream is not available') || low.includes('empty stream') || low.includes('stream')) {
    return '\u{1F4F9} Media download nahi ho saka \u2014 link expire ho gaya hai ya private hai. Naya link bhejein.';
  }
  if (low.includes('abort') || low.includes('timeout') || low.includes('timed out') || low.includes('etimedout')) {
    return '\u{1F40C} Service ne bohat der li, is liye timeout ho gaya. Dobara try karein.';
  }
  if (low.includes('enotfound') || low.includes('econnrefused') || low.includes('network') || low.includes('fetch failed')) {
    return '\u{1F4E1} Network issue aa gaya. Thori der baad dobara try karein.';
  }
  if (low.includes('unsupported') || low.includes('invalid')) {
    return '\u26A0\uFE0F Input sahi nahi hai. `.menu` dekh kar sahi tareeqa try karein.';
  }
  return '\u26A0\uFE0F Command mukammal nahi ho saki. Dobara try karein ya `.menu` se doosri command use karein.';
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function num(v) {
  return Number(String(v).replace(/[^\d.-]/g, '')) || 0;
}

/** Download the media of a quoted message (or the message itself). */
async function quotedMediaBuffer(ctx) {
  const q = ctx.quoted;
  if (!q) return null;
  return downloadMediaMessage(q, 'buffer', {}, { logger: ctx.logger });
}

/** Download media attached to the current message. */
async function ownMediaBuffer(ctx) {
  const m = ctx.raw && ctx.raw.message;
  if (!m) return null;
  const has =
    m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage || m.stickerMessage;
  if (!has) return null;
  return downloadMediaMessage(ctx.raw, 'buffer', {}, { logger: ctx.logger });
}

/** Either the quoted media or the media the user just sent. */
async function anyMediaBuffer(ctx) {
  return (await quotedMediaBuffer(ctx)) || (await ownMediaBuffer(ctx));
}

function requireMedia(ctx, hint) {
  return hint || 'Kisi media (image/video) par reply karein ya media ke sath command likhein.';
}

function bytes(n) {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}

function clampText(s, max = 4000) {
  const t = String(s || '');
  return t.length > max ? t.slice(0, max) + '\u2026' : t;
}

module.exports = {
  UA,
  startedAt,
  humanUptime,
  jidToNumber,
  fetchJson,
  fetchText,
  fetchBuffer,
  pick,
  randInt,
  num,
  quotedMediaBuffer,
  ownMediaBuffer,
  anyMediaBuffer,
  requireMedia,
  bytes,
  clampText,
  retry,
  friendlyError,
};
