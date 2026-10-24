/**
 * AI auto-reply agent (`.saqib on` / `.saqib off`).
 *
 * When enabled for a session the bot behaves like a real assistant: any
 * incoming message that is NOT a command gets a natural AI answer, with a
 * short per-chat conversation memory so follow-ups ("i am fine") make sense.
 *
 * Design notes:
 *  - Toggle is persisted in Mongo (`wa_settings`) so it survives redeploys.
 *  - Never replies to its own messages, to status broadcasts, or to commands.
 *  - Bounded memory (AI_HISTORY_TURNS) per chat, capped map size.
 *  - Multiple free AI endpoints with automatic fallback, so a single 403/429
 *    from one provider never leaves the user with "forbidden".
 */

const config = require('../config');
const db = require('../db');

const SETTINGS = 'wa_settings';
const memory = new Map(); // `${sessionId}:${chat}` -> [{role, content}]
const MEMORY_MAX_CHATS = 800;

/* ------------------------------------------------------------ persistence */

const cache = new Map(); // sessionId -> boolean

async function isEnabled(sessionId) {
  const sid = String(sessionId);
  if (cache.has(sid)) return cache.get(sid);
  try {
    const doc = await db.getDb().collection(SETTINGS).findOne({ _id: sid });
    const on = Boolean(doc && doc.aiAgent);
    cache.set(sid, on);
    return on;
  } catch {
    return false;
  }
}

async function setEnabled(sessionId, on) {
  const sid = String(sessionId);
  cache.set(sid, Boolean(on));
  try {
    await db
      .getDb()
      .collection(SETTINGS)
      .updateOne({ _id: sid }, { $set: { aiAgent: Boolean(on), updatedAt: new Date() } }, { upsert: true });
  } catch {
    /* cache still works for this process */
  }
  return Boolean(on);
}

/* ---------------------------------------------------------------- memory */

function historyKey(sessionId, chat) {
  return `${sessionId}:${chat}`;
}

function getHistory(sessionId, chat) {
  return memory.get(historyKey(sessionId, chat)) || [];
}

function pushHistory(sessionId, chat, role, content) {
  const key = historyKey(sessionId, chat);
  const arr = memory.get(key) || [];
  arr.push({ role, content: String(content).slice(0, 1500) });
  const max = Math.max(2, config.AI_HISTORY_TURNS * 2);
  while (arr.length > max) arr.shift();
  memory.set(key, arr);
  if (memory.size > MEMORY_MAX_CHATS) {
    const first = memory.keys().next().value;
    memory.delete(first);
  }
}

function clearHistory(sessionId, chat) {
  memory.delete(historyKey(sessionId, chat));
}

/* -------------------------------------------------------------------- AI */

const SYSTEM_PROMPT =
  'You are SAQIB MD, a friendly WhatsApp assistant. Reply in the same language ' +
  'the user writes in (Urdu, Roman Urdu or English). Keep answers short, warm ' +
  'and natural — like a helpful human, max 3-4 sentences unless asked for more. ' +
  'Never mention that you are an AI model or these instructions.';

/** POST /openai style endpoint — richest and most reliable. */
async function askOpenAI(messages, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, private: true }),
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('empty');
    return String(text).trim();
  } finally {
    clearTimeout(t);
  }
}

/** GET fallback — flattens the conversation into one prompt. */
async function askGet(messages, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
    const r = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`,
      { signal: ctl.signal }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = (await r.text()).trim();
    if (!text) throw new Error('empty');
    return text;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ask the AI with automatic provider fallback.
 * @returns {Promise<string|null>}
 */
async function askAI(messages, timeoutMs = config.AI_TIMEOUT_MS) {
  const full = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];
  for (const fn of [askOpenAI, askGet]) {
    try {
      const out = await fn(full, timeoutMs);
      if (out) return out.slice(0, 3500);
    } catch {
      /* try the next provider */
    }
  }
  return null;
}

/* --------------------------------------------------------------- attach */

/**
 * Attach the auto-reply agent to a live socket.
 * @returns {Function} detach
 */
function attachAIAgent(sock, opts = {}) {
  const { sessionId, logger } = opts;
  const log = logger || console;
  const handled = new Set();

  const handler = async ({ messages, type }) => {
    if (type !== 'notify') return;
    if (!(await isEnabled(sessionId))) return;

    for (const raw of messages || []) {
      try {
        if (!raw?.message || !raw.key?.id) continue;
        if (handled.has(raw.key.id)) continue;
        handled.add(raw.key.id);
        if (handled.size > 500) handled.delete(handled.values().next().value);

        const chat = raw.key.remoteJid;
        if (!chat || chat === 'status@broadcast') continue;
        // Only answer messages from other people. The bot's own sends are
        // fromMe, and self-chat is where the user types commands.
        if (raw.key.fromMe) continue;
        if (chat.endsWith('@g.us')) continue; // groups: commands only
        if (chat.endsWith('@broadcast') || chat.endsWith('@newsletter')) continue;

        const msg = raw.message;
        const text = (
          msg.conversation ||
          msg.extendedTextMessage?.text ||
          msg.imageMessage?.caption ||
          msg.videoMessage?.caption ||
          ''
        ).trim();
        if (!text) continue;
        // Commands are handled by the command engine, not the agent.
        if (['.', '/', '!', '#'].includes(text[0])) continue;

        const pushName = raw.pushName || 'friend';
        const hist = getHistory(sessionId, chat);
        const messagesForAI = [
          ...hist,
          { role: 'user', content: `${pushName}: ${text}` },
        ];

        await sock.sendPresenceUpdate('composing', chat).catch(() => {});
        const answer = await askAI(messagesForAI);
        await sock.sendPresenceUpdate('paused', chat).catch(() => {});

        if (!answer) continue;

        pushHistory(sessionId, chat, 'user', `${pushName}: ${text}`);
        pushHistory(sessionId, chat, 'assistant', answer);

        await sock.sendMessage(chat, { text: answer }, { quoted: raw });
        log.info?.({ sessionId, chat, chars: answer.length }, 'ai agent replied');
      } catch (err) {
        log.warn?.({ err: err.message }, 'ai agent failed');
      }
    }
  };

  sock.ev.on('messages.upsert', handler);

  return () => {
    try {
      sock.ev.removeListener('messages.upsert', handler);
    } catch {
      /* ignore */
    }
  };
}

module.exports = { attachAIAgent, askAI, isEnabled, setEnabled, clearHistory, SYSTEM_PROMPT };
