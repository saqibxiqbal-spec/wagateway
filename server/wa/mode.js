/**
 * Bot access mode — `.mode public` / `.mode private`.
 *
 *   public  (default) → every WhatsApp user can run every command
 *   private           → only the owner (self-chat + OWNER_NUMBER) can
 *
 * Stored per session in Mongo (`wa_settings.mode`) so it survives redeploys,
 * with a process cache so the hot path costs zero DB round-trips.
 */

const db = require('../db');

const SETTINGS = 'wa_settings';
const MODES = ['public', 'private'];
const cache = new Map(); // sessionId -> 'public' | 'private'

function normalise(value) {
  const v = String(value || '').toLowerCase().trim();
  return MODES.includes(v) ? v : null;
}

async function getMode(sessionId) {
  const sid = String(sessionId);
  if (cache.has(sid)) return cache.get(sid);
  try {
    const doc = await db.getDb().collection(SETTINGS).findOne({ _id: sid });
    const mode = normalise(doc && doc.mode) || 'public';
    cache.set(sid, mode);
    return mode;
  } catch {
    return 'public';
  }
}

async function setMode(sessionId, mode) {
  const sid = String(sessionId);
  const clean = normalise(mode);
  if (!clean) throw new Error('mode must be public or private');
  cache.set(sid, clean);
  try {
    await db
      .getDb()
      .collection(SETTINGS)
      .updateOne(
        { _id: sid },
        { $set: { mode: clean, updatedAt: new Date() } },
        { upsert: true }
      );
  } catch {
    /* cache still applies for this process */
  }
  return clean;
}

module.exports = { getMode, setMode, MODES, normalise };
