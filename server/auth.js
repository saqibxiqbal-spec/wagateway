const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const config = require('./config');
const { getDb } = require('./db');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function sign(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, name: user.name || '' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES }
  );
}

function verify(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
}

async function register({ email, password, name }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) throw httpError(400, 'Valid email daalein.');
  if (String(password || '').length < 8) throw httpError(400, 'Password kam az kam 8 characters ka ho.');

  const db = getDb();
  const exists = await db.collection('users').findOne({ email: cleanEmail });
  if (exists) throw httpError(409, 'Ye email already registered hai.');

  const doc = {
    email: cleanEmail,
    name: String(name || '').trim().slice(0, 60) || cleanEmail.split('@')[0],
    passwordHash: await bcrypt.hash(String(password), 10),
    plan: 'free',
    createdAt: new Date(),
    lastLoginAt: null,
  };
  const res = await db.collection('users').insertOne(doc);
  doc._id = res.insertedId;
  return { token: sign(doc), user: publicUser(doc) };
}

async function login({ email, password }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const db = getDb();
  const user = await db.collection('users').findOne({ email: cleanEmail });
  // Never reveal whether the email exists.
  const ok = user && (await bcrypt.compare(String(password || ''), user.passwordHash));
  if (!ok) throw httpError(401, 'Email ya password ghalat hai.');

  await db.collection('users').updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { token: sign(user), user: publicUser(user) };
}

function publicUser(u) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name || '',
    plan: u.plan || 'free',
    createdAt: u.createdAt,
  };
}

/** Express middleware — requires `Authorization: Bearer <jwt>`. */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verify(token);
  if (!payload) return res.status(401).json({ ok: false, error: 'Login required.' });

  try {
    const user = await getDb().collection('users').findOne({ _id: new ObjectId(payload.sub) });
    if (!user) return res.status(401).json({ ok: false, error: 'Account not found.' });
    req.user = user;
    req.userId = String(user._id);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid session.' });
  }
}

/** Socket.io handshake auth. */
async function socketUser(token) {
  const payload = token && verify(token);
  if (!payload) return null;
  try {
    const user = await getDb().collection('users').findOne({ _id: new ObjectId(payload.sub) });
    return user ? { id: String(user._id), email: user.email, name: user.name } : null;
  } catch {
    return null;
  }
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { register, login, requireAuth, socketUser, publicUser, httpError, sign };
