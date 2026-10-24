/**
 * Public "quick pair" routes — NO login, NO signup.
 *
 * One job: take a phone number, hand back an 8-digit WhatsApp pairing code
 * (plus a QR fallback) and report live status until the device links.
 *
 * All sessions created here are owned by a single synthetic guest id so the
 * existing multi-tenant manager works unchanged.
 */
const express = require('express');
const QRCode = require('qrcode');
const { normalizePhone } = require('../wa/manager');
const config = require('../config');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const mgr = (req) => req.app.locals.wa;

const GUEST_ID = 'guest-public';
const GUEST_MAX = 25;

/** Small in-memory rate limit: 8 pair requests / minute / IP. */
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || 'x';
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  if (arr.length >= 8) {
    return res.status(429).json({ ok: false, error: 'Bohat zyada requests — 1 minute baad try karein.' });
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  next();
}

async function guestCount(wa) {
  return wa.countForUser(GUEST_ID);
}

// POST /api/quick/pair  { number }
router.post(
  '/pair',
  rateLimit,
  wrap(async (req, res) => {
    const wa = mgr(req);
    const raw = (req.body && req.body.number) || '';
    const number = normalizePhone(raw);
    if (!number) {
      return res.status(400).json({
        ok: false,
        error: 'Number ghalat hai. Country code ke sath likhein, e.g. 923001234567',
      });
    }

    // Reuse a session for the same number instead of failing with 409.
    const existing = await wa.col.findOne({ userId: GUEST_ID, number });
    let session;
    if (existing) {
      session = existing;
    } else {
      if ((await guestCount(wa)) >= GUEST_MAX) {
        // Trim the oldest guest session so the public page never gets stuck.
        const oldest = await wa.col.find({ userId: GUEST_ID }).sort({ createdAt: 1 }).limit(1).toArray();
        if (oldest[0]) await wa.remove(String(oldest[0]._id), GUEST_ID).catch(() => {});
      }
      session = await wa.createSession({ userId: GUEST_ID, rawNumber: number, label: 'Quick link' });
    }

    const id = String(session._id || session.id);
    const result = await wa.pair(id, GUEST_ID);
    const fresh = await wa.getSession(id, GUEST_ID);

    res.json({
      ok: true,
      sessionId: id,
      number,
      code: result.code || null,
      pending: !!result.pending,
      alreadyConnected: !!result.alreadyConnected,
      message: result.message || null,
      status: fresh ? fresh.status : 'pairing',
      qr: fresh ? !!fresh.hasQr : false,
      me: fresh ? fresh.me || null : null,
    });
  })
);

// GET /api/quick/status/:id
router.get(
  '/status/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    res.json({
      ok: true,
      sessionId: String(s.id || s._id),
      status: s.status,
      code: s.pairingCode || null,
      qr: !!s.hasQr,
      me: s.me || null,
      pushName: s.pushName || null,
      lastError: s.lastError || null,
      live: !!(wa.runtimes && wa.runtimes.get(String(s.id || s._id))),
    });
  })
);

// GET /api/quick/qr/:id  -> { dataUrl }
router.get(
  '/qr/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const raw = wa.getQr(String(s.id || s._id));
    if (!raw) return res.status(404).json({ ok: false, error: 'QR abhi tayyar nahi.' });
    const dataUrl = await QRCode.toDataURL(raw, { margin: 1, width: 320 });
    res.json({ ok: true, dataUrl });
  })
);

// POST /api/quick/repair/:id  -> fresh code (old one expired)
router.post(
  '/repair/:id',
  rateLimit,
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const result = await wa.pair(String(s.id || s._id), GUEST_ID, { force: true });
    res.json({ ok: true, sessionId: String(s.id || s._id), code: result.code || null, pending: !!result.pending });
  })
);

// GET /api/quick/selftest/:id  -> is the command engine actually live?
router.get(
  '/selftest/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const sid = String(s.id || s._id);
    const { commands } = require('../wa/commands');
    const aiAgent = require('../wa/aiAgent');
    const rt = wa.runtimes && wa.runtimes.get(sid);
    const commandsAttached = !!(rt && rt.commandsAttached);
    const aiOn = await aiAgent.isEnabled(sid).catch(() => false);
    const doc = await wa.col.findOne({ _id: s._id || s.id });
    res.json({
      ok: true,
      sessionId: sid,
      number: s.number,
      status: s.status,
      connected: !!rt,
      hasSocket: !!(rt && rt.sock),
      commandHandlerAttached: commandsAttached,
      commandsLoaded: commands.size,
      selfChatReady: commandsAttached,
      aiAgentAttached: !!(rt && rt.agentAttached),
      aiAgentOn: aiOn,
      alwaysOnline: config.ALWAYS_ONLINE,
      autoRead: config.AUTO_READ,
      leaseOwner: doc ? doc.lockOwner || null : null,
      thisInstance: wa.instanceId || null,
      me: s.me || null,
    });
  })
);

// POST /api/quick/say/:id  { text }  -> bot apne hi number par message bheje
router.post(
  '/say/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const sid = String(s.id || s._id);
    const rt = wa.runtimes && wa.runtimes.get(sid);
    if (!rt || !rt.sock) {
      return res.status(409).json({ ok: false, error: 'Socket live nahi hai. Pehle link karein.' });
    }
    const text = (req.body && req.body.text) || '✅ Bot active hai! .menu likhein.';
    const target = rt.sock.user && rt.sock.user.id ? rt.sock.user.id : s.number + '@s.whatsapp.net';
    await rt.sock.sendMessage(target, { text });
    res.json({ ok: true, sentTo: target, text });
  })
);

// POST /api/quick/simulate/:id  { text }  -> run the REAL command engine on the
// live socket by injecting a synthetic self-chat message. Used by the "Test bot"
// button and by support to prove the bot answers without a second phone.
router.post(
  '/simulate/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const sid = String(s.id || s._id);
    const rt = wa.runtimes && wa.runtimes.get(sid);
    if (!rt || !rt.sock) {
      return res.status(409).json({ ok: false, error: 'Socket live nahi hai. Pehle link karein.' });
    }
    if (!rt.commandsAttached) {
      return res.status(409).json({ ok: false, error: 'Command engine attach nahi hua.' });
    }
    const selfJid = rt.sock.user && rt.sock.user.id;
    if (!selfJid) {
      return res.status(409).json({ ok: false, error: 'Identity abhi load nahi hui.' });
    }
    const text = String((req.body && req.body.text) || '.ping');
    const id = 'SIM' + Date.now().toString(36).toUpperCase();
    rt.sock.ev.emit('messages.upsert', {
      type: 'notify',
      messages: [
        {
          key: { remoteJid: selfJid, fromMe: true, id },
          message: { conversation: text },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: 'Self Test',
        },
      ],
    });
    res.json({ ok: true, injected: text, id, chat: selfJid });
  })
);

// POST /api/quick/revive/:id  -> force a dead-but-linked session back online
router.post(
  '/revive/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    const sid = String(s.id || s._id);
    const doc = await wa.col.findOne({ _id: s._id || s.id });
    if (!doc || !doc.me) {
      return res.status(409).json({ ok: false, error: 'Ye number linked nahi hai. Pehle link karein.' });
    }
    await wa.persist(doc._id, { status: 'connecting', lastError: null });
    await wa.startSocket({ ...doc, status: 'connecting' });
    res.json({ ok: true, sessionId: sid, status: 'connecting' });
  })
);

// POST /api/quick/logout/:id
router.post(
  '/logout/:id',
  wrap(async (req, res) => {
    const wa = mgr(req);
    const s = await wa.getSession(req.params.id, GUEST_ID);
    if (!s) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });
    await wa.remove(String(s.id || s._id), GUEST_ID);
    res.json({ ok: true });
  })
);

module.exports = router;
