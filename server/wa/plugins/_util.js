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
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opts.timeout || 15000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json', ...(opts.headers || {}) },
      signal: ctl.signal,
      method: opts.method || 'GET',
      body: opts.body,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchText(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opts.timeout || 15000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, ...(opts.headers || {}) },
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function fetchBuffer(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opts.timeout || 30000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, ...(opts.headers || {}) },
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return Buffer.from(await r.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
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
};
