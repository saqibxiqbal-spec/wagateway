const express = require('express');
const QRCode = require('qrcode');
const { requireAuth, publicUser } = require('../auth');
const config = require('../config');

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Attach the manager from app.locals so routes stay stateless. */
const mgr = (req) => req.app.locals.wa;

router.use(requireAuth);

// GET /api/sessions  -> all sessions for the logged-in user
router.get(
  '/',
  wrap(async (req, res) => {
    const sessions = await mgr(req).listForUser(req.userId);
    res.json({ ok: true, sessions });
  })
);

// GET /api/sessions/meta/limits -> plan info for the dashboard
router.get(
  '/meta/limits',
  wrap(async (req, res) => {
    const used = await mgr(req).countForUser(req.userId);
    res.json({ ok: true, used, max: config.MAX_SESSIONS_PER_USER, user: publicUser(req.user) });
  })
);

// POST /api/sessions  { number, label }
router.post(
  '/',
  wrap(async (req, res) => {
    const { number, label } = req.body || {};
    const session = await mgr(req).createSession({ userId: req.userId, rawNumber: number, label });
    res.status(201).json({ ok: true, session });
  })
);

// POST /api/sessions/:id/pair  -> returns 8-digit pairing code
router.post(
  '/:id/pair',
  wrap(async (req, res) => {
    const out = await mgr(req).pair(req.params.id, req.userId);
    res.json({ ok: true, ...out });
  })
);

// GET /api/sessions/:id/qr  -> { qr: dataUrl|null, raw: string|null }
router.get(
  '/:id/qr',
  wrap(async (req, res) => {
    const doc = await mgr(req).getSession(req.params.id, req.userId);
    if (!doc) return res.status(404).json({ ok: false, error: 'Session nahi mili.' });

    const raw = mgr(req).getQr(req.params.id);
    if (!raw) return res.json({ ok: true, qr: null, raw: null });

    const dataUrl = await QRCode.toDataURL(raw, { margin: 1, width: 320 });
    res.json({ ok: true, qr: dataUrl, raw });
  })
);

// GET /api/sessions/:id/code -> current pairing code
router.get(
  '/:id/code',
  wrap(async (req, res) => {
    const code = await mgr(req).getPairCode(req.params.id, req.userId);
    res.json({ ok: true, code });
  })
);

// POST /api/sessions/:id/disconnect
router.post(
  '/:id/disconnect',
  wrap(async (req, res) => {
    const session = await mgr(req).disconnect(req.params.id, req.userId);
    res.json({ ok: true, session });
  })
);

// DELETE /api/sessions/:id
router.delete(
  '/:id',
  wrap(async (req, res) => {
    const out = await mgr(req).remove(req.params.id, req.userId);
    res.json({ ok: true, ...out });
  })
);

module.exports = router;
