const express = require('express');
const { register, login, requireAuth, publicUser } = require('../auth');

const router = express.Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/register',
  wrap(async (req, res) => {
    const { email, password, name } = req.body || {};
    const out = await register({ email, password, name });
    res.status(201).json({ ok: true, ...out });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const out = await login({ email, password });
    res.json({ ok: true, ...out });
  })
);

router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

module.exports = router;
