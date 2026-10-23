/**
 * WaManager — the session engine.
 *
 * One WaManager instance owns every live Baileys socket in the process. Each
 * WhatsApp number a user links becomes one document in `wa_sessions` plus a
 * runtime object in `this.runtimes` that holds the socket, the QR string and
 * the pairing code.
 *
 * Design rules that matter on a real host:
 *  - Creds live in Mongo (see authState.js) so a redeploy resumes pairings.
 *  - A socket is NEVER left dangling: every failure path either reconnects or
 *    closes the socket and clears the runtime.
 *  - 515 (restartRequired) is normal: WhatsApp sends it the instant the phone
 *    submits the pairing code, *before* `creds.registered` flips to true. We
 *    must reconnect immediately, not treat it as a logout.
 *  - 401 (loggedOut) is terminal: wipe the auth rows so the user can pair again.
 *  - Poisoned creds guard: if `creds.me` exists but `registered` is false, the
 *    next LOGIN node fails with 401 "could not link device". We drop the fake
 *    `me` so Baileys starts a clean pairing handshake.
 */
const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');
const { ObjectId } = require('mongodb');
const pino = require('pino');

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,
  delay,
} = require('@whiskeysockets/baileys');

const config = require('../config');
const { getDb } = require('../db');
const { useMongoAuthState, clearAuth } = require('./authState');
const { attachCommands } = require('./commands');

const COLL = 'wa_sessions';
const EVENTS = 'wa_events';

const STATUS = Object.freeze({
  IDLE: 'idle',
  PAIRING: 'pairing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  LOGGED_OUT: 'logged_out',
  ERROR: 'error',
});

const logger = pino({ level: process.env.WA_LOG_LEVEL || 'warn' });

/**
 * A single Baileys socket may exist per linked number, worldwide. Railway does
 * rolling deploys: for a few seconds the old container and the new one both
 * run. If both open a socket for the same creds WhatsApp answers with
 * 440 "Stream Errored (conflict)" and kills both — the linked number then goes
 * silent until the watchdog fights it back, forever.
 *
 * A Mongo lease solves it: only the instance holding the lease for a session
 * may open its socket. Leases are renewed by a heartbeat and released on
 * graceful shutdown, so a crashed container is recovered within LEASE_MS.
 */
const LEASE_MS = 45_000;
const HEARTBEAT_MS = 15_000;

/** Small in-memory cache so getMessage() can answer retry/decrypt requests. */
class MsgCache {
  constructor(max = 300) {
    this.max = max;
    this.map = new Map();
  }
  set(id, msg) {
    if (!id) return;
    this.map.set(id, msg);
    if (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }
  get(id) {
    return this.map.get(id);
  }
}

/**
 * Turn anything a human might type into a bare international number.
 *   "0300 1234567"  -> "923001234567"   (uses DEFAULT_COUNTRY_CODE)
 *   "+92 300-1234567" -> "923001234567"
 *   "00923001234567"  -> "923001234567"
 * Returns null when the result cannot be a real MSISDN.
 */
function normalizePhone(raw, cc = config.DEFAULT_COUNTRY_CODE) {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).replace(/[^\d+]/g, '');
  if (!s) return null;

  if (s.startsWith('+')) s = s.slice(1); // explicit international
  else if (s.startsWith('00')) s = s.slice(2); // international prefix
  else if (s.startsWith('0')) s = cc + s.slice(1); // local trunk prefix (0300...)
  else if (s.length <= 10) s = cc + s; // bare local number, no country code
  // 11+ digits without +/00 is already an international number (e.g. 50955733672)
  // — never prepend the default country code to it.

  s = s.replace(/\D/g, '');
  if (s.length < 8 || s.length > 15) return null;
  return s;
}

/** Strip everything secret before a session doc crosses the wire. */
function publicSession(doc) {
  if (!doc) return null;
  const me = doc.me || null;
  return {
    id: String(doc._id),
    number: doc.number,
    label: doc.label || '',
    status: doc.status || STATUS.IDLE,
    me: me ? { id: me.id, name: me.name || me.verifiedName || null } : null,
    pushName: doc.pushName || null,
    platform: doc.platform || null,
    lastError: doc.lastError || null,
    hasQr: Boolean(doc.hasQr),
    pairingCode: doc.pairingCode || null,
    pairingAt: doc.pairingAt || null,
    connectedAt: doc.connectedAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
  };
}

class WaManager extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, {sock:any, qr:string|null, code:string|null, docId:ObjectId, userId:string}>} */
    this.runtimes = new Map();
    this.startedAt = Date.now();
    this._shuttingDown = false;
    this.instanceId = randomUUID();
    this.msgCache = new MsgCache(300);
    this._heartbeat = null;
  }

  // ---------------------------------------------------------------- helpers

  get col() {
    return getDb().collection(COLL);
  }

  async logEvent(sessionId, type, detail) {
    try {
      await getDb().collection(EVENTS).insertOne({
        sessionId: String(sessionId),
        type,
        detail: detail || null,
        at: new Date(),
      });
    } catch {
      /* audit trail is best-effort, never break the socket for it */
    }
  }

  emitUpdate(userId, session) {
    // Socket.io layer listens on "session" and forwards to the user's room.
    this.emit('session', { userId: String(userId), session });
  }

  async persist(id, patch) {
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    const update = { ...patch, updatedAt: new Date() };
    await this.col.updateOne({ _id }, { $set: update });
    const doc = await this.col.findOne({ _id });
    if (doc) this.emitUpdate(doc.userId, publicSession(doc));
    return doc;
  }

  async getSession(id, ownerId) {
    if (!ObjectId.isValid(String(id))) return null;
    const doc = await this.col.findOne({ _id: new ObjectId(String(id)) });
    if (!doc) return null;
    if (ownerId && String(doc.userId) !== String(ownerId)) return null;
    return doc;
  }

  async listForUser(userId) {
    const docs = await this.col
      .find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(publicSession);
  }

  async countForUser(userId) {
    return this.col.countDocuments({ userId: String(userId) });
  }

  async countAll() {
    return this.col.countDocuments({});
  }

  // ------------------------------------------------------------ socket lease

  /**
   * Try to become the single owner of a session's socket.
   * Returns true when this instance may open the socket.
   */
  async acquireLease(docId) {
    const _id = typeof docId === 'string' ? new ObjectId(docId) : docId;
    const now = new Date();
    const staleBefore = new Date(Date.now() - LEASE_MS);
    try {
      const res = await this.col.findOneAndUpdate(
        {
          _id,
          $or: [
            { lockOwner: { $in: [null, this.instanceId] } },
            { lockOwner: { $exists: false } },
            { lockAt: { $lt: staleBefore } },
          ],
        },
        { $set: { lockOwner: this.instanceId, lockAt: now } },
        { returnDocument: 'after' }
      );
      // mongodb driver v6 returns the document directly; older versions wrap
      // it in { value }. Support both so the lease can never silently fail.
      const doc = res && (res.value !== undefined ? res.value : res);
      return Boolean(doc && doc._id);
    } catch (err) {
      logger.warn({ err: err.message }, 'acquireLease failed');
      return false;
    }
  }

  async releaseLease(docId) {
    const _id = typeof docId === 'string' ? new ObjectId(docId) : docId;
    try {
      await this.col.updateOne(
        { _id, lockOwner: this.instanceId },
        { $set: { lockOwner: null, lockAt: null } }
      );
    } catch {
      /* best effort */
    }
  }

  startHeartbeat() {
    if (this._heartbeat) return this._heartbeat;
    this._heartbeat = setInterval(async () => {
      if (this._shuttingDown) return;
      const ids = [...this.runtimes.values()].map((rt) => rt.docId);
      if (!ids.length) return;
      try {
        await this.col.updateMany(
          { _id: { $in: ids }, lockOwner: this.instanceId },
          { $set: { lockAt: new Date() } }
        );
      } catch {
        /* best effort */
      }
    }, HEARTBEAT_MS);
    if (this._heartbeat.unref) this._heartbeat.unref();
    return this._heartbeat;
  }

  stopHeartbeat() {
    if (this._heartbeat) {
      clearInterval(this._heartbeat);
      this._heartbeat = null;
    }
  }

  // -------------------------------------------------------------- lifecycle

  async createSession({ userId, rawNumber, label }) {
    const number = normalizePhone(rawNumber);
    if (!number) {
      const e = new Error('Phone number valid nahi hai. Country code ke saath daalein, e.g. 923001234567.');
      e.status = 400;
      throw e;
    }

    const perUser = await this.countForUser(userId);
    if (perUser >= config.MAX_SESSIONS_PER_USER) {
      const e = new Error(`Aap ${config.MAX_SESSIONS_PER_USER} numbers tak link kar sakte hain.`);
      e.status = 429;
      throw e;
    }
    const total = await this.countAll();
    if (total >= config.MAX_SESSIONS_TOTAL) {
      const e = new Error('Server ki capacity full hai, thodi der baad try karein.');
      e.status = 503;
      throw e;
    }

    const now = new Date();
    const doc = {
      userId: String(userId),
      number,
      label: String(label || '').trim().slice(0, 60),
      status: STATUS.IDLE,
      me: null,
      pushName: null,
      platform: null,
      lastError: null,
      hasQr: false,
      pairingCode: null,
      pairingAt: null,
      connectedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const res = await this.col.insertOne(doc);
      doc._id = res.insertedId;
    } catch (err) {
      if (err && err.code === 11000) {
        const e = new Error('Ye number already linked hai.');
        e.status = 409;
        throw e;
      }
      throw err;
    }

    await this.logEvent(doc._id, 'created', { number });
    const pub = publicSession(doc);
    this.emitUpdate(userId, pub);
    return pub;
  }

  /**
   * Start (or restart) a socket for a session and ask WhatsApp for an 8-digit
   * pairing code. The socket must stay alive for the whole ~2 minute window,
   * otherwise the code the user types on their phone is rejected.
   */
  async pair(sessionId, ownerId) {
    const doc = await this.getSession(sessionId, ownerId);
    if (!doc) {
      const e = new Error('Session nahi mili.');
      e.status = 404;
      throw e;
    }

    // Already linked? Never tear down a healthy socket just because the user
    // re-submitted the same number — that used to disconnect a working bot.
    const live = this.runtimes.get(String(doc._id));
    if (doc.status === STATUS.CONNECTED && (doc.me || (live && live.sock?.user))) {
      return {
        code: null,
        sessionId: String(doc._id),
        alreadyConnected: true,
        status: STATUS.CONNECTED,
        me: doc.me || null,
        message: 'Ye number pehle se linked hai aur bot chal raha hai.',
      };
    }

    // Kill any existing socket for this session first.
    await this._killRuntime(String(doc._id));

    await this.persist(doc._id, {
      status: STATUS.PAIRING,
      pairingAt: new Date(),
      lastError: null,
      hasQr: false,
      pairingCode: null,
    });

    const runtime = await this.startSocket({ ...doc, status: STATUS.PAIRING, pairingAt: new Date() });
    if (!runtime) {
      const e = new Error('Connection start nahi ho saki.');
      e.status = 500;
      throw e;
    }

    // Wait until Baileys exposes the code (it arrives on the first QR/register
    // tick). Bounded so the HTTP request cannot hang forever.
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (runtime.code) break;
      if (runtime.failed) break;
      await delay(250);
    }

    if (runtime.code) {
      await this.persist(doc._id, { pairingCode: runtime.code, status: STATUS.PAIRING });
      await this.logEvent(doc._id, 'pair_code', { code: runtime.code });
      return { code: runtime.code, sessionId: String(doc._id) };
    }

    // No code yet but the socket is alive: the client can poll /qr or wait for
    // the socket event. Report the current state instead of a hard failure.
    return {
      code: null,
      sessionId: String(doc._id),
      pending: true,
      message: 'Pairing shuru ho gayi — code 10-20 second mein aa jayega.',
    };
  }

  async startSocket(doc) {
    const sessionId = String(doc._id);
    if (this._shuttingDown) return null;

    // --- Single-socket guard ---------------------------------------------
    // Two sockets sharing one set of creds make WhatsApp emit
    // "Stream Errored (conflict)" and kill both. If a runtime already exists
    // for this session, tear it down before opening a new one.
    if (this.runtimes.has(sessionId)) {
      logger.warn({ sessionId }, 'startSocket: killing existing runtime first');
      await this._killRuntime(sessionId);
      await delay(400);
    }

    // --- Cross-instance lease guard ---------------------------------------
    // A rolling deploy briefly runs two containers. Without this only one of
    // them may own the socket, otherwise WhatsApp kills both with 440.
    const leased = await this.acquireLease(doc._id);
    if (!leased) {
      logger.warn({ sessionId }, 'startSocket: lease held by another instance, skipping');
      await this.logEvent(doc._id, 'lease_busy', { instance: this.instanceId });
      return null;
    }
    this.startHeartbeat();

    let state, saveCreds;
    try {
      ({ state, saveCreds } = await useMongoAuthState(sessionId));
    } catch (err) {
      // A shutdown mid-read is not a real failure — leave the row alone so the
      // next boot resumes it instead of parking the session as `error`.
      if (this._shuttingDown) return null;
      await this.persist(doc._id, { status: STATUS.ERROR, lastError: 'auth state: ' + err.message });
      await this.releaseLease(doc._id);
      return null;
    }

    // --- Poisoned-creds guard -------------------------------------------
    // `me` set + `registered:false` => the next LOGIN node is rejected with
    // 401 "could not link device". `registered` only flips to true AFTER the
    // phone accepts the code, so any `me` before that is half-written garbage
    // and must be dropped, no matter how the session got here.
    if (!state.creds.registered && state.creds.me) {
      delete state.creds.me;
      delete state.creds.pairingCode;
      try {
        await saveCreds();
      } catch {
        /* non-fatal */
      }
    }

    let version;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      version = undefined; // Baileys falls back to its bundled version
    }

    let sock;
    try {
      sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop'),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
        // Retry receipts / decrypt retries ask for the original message again.
        // Returning undefined here makes media and view-once downloads fail.
        getMessage: async (key) => {
          const cached = this.msgCache.get(key?.id);
          if (cached) return cached;
          return undefined;
        },
      });
    } catch (err) {
      if (this._shuttingDown) return null;
      await this.persist(doc._id, { status: STATUS.ERROR, lastError: 'socket: ' + err.message });
      await this.releaseLease(doc._id);
      return null;
    }

    const runtime = {
      sock,
      qr: null,
      code: null,
      failed: false,
      docId: doc._id,
      userId: String(doc.userId),
      number: doc.number,
      attempts: 0,
    };
    this.runtimes.set(sessionId, runtime);

    sock.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (err) {
        logger.warn({ err }, 'saveCreds failed');
      }
    });

    // --- Pairing code ----------------------------------------------------
    // Only request a code when the device is not yet registered. Calling it on
    // an already-registered socket throws "already logged in".
    if (!state.creds.registered) {
      (async () => {
        try {
          await delay(1200); // let the socket reach the handshake stage
          const code = await sock.requestPairingCode(runtime.number);
          runtime.code = code;
          await this.persist(doc._id, { pairingCode: code, status: STATUS.PAIRING });
          await this.logEvent(doc._id, 'pair_code', { code });
          this.emit('pair-code', { userId: runtime.userId, sessionId, code });
        } catch (err) {
          runtime.failed = true;
          logger.warn({ err: err.message }, 'requestPairingCode failed');
          await this.persist(doc._id, { lastError: 'pair code: ' + err.message });
          this.emit('pair-code-error', { userId: runtime.userId, sessionId, error: err.message });
        }
      })();
    }

    sock.ev.on('connection.update', (update) => {
      this.onConnectionUpdate(runtime, update).catch((err) =>
        logger.error({ err }, 'connection.update handler failed')
      );
    });

    // Cache recent messages so retry receipts and .vv can re-download media.
    sock.ev.on('messages.upsert', ({ messages }) => {
      for (const m of messages || []) {
        if (m?.key?.id) this.msgCache.set(m.key.id, m.message);
      }
    });

    // --- Command engine ---------------------------------------------------
    // Without this the socket is connected but deaf: a linked number answers
    // nothing. attachCommands() wires .menu/.ping/... onto this socket.
    try {
      runtime.detachCommands = attachCommands(sock, {
        sessionId,
        number: runtime.number,
        logger,
        onEvent: (e) => this.emit('command', { sessionId, ...e }),
      });
      runtime.commandsAttached = true;
    } catch (err) {
      logger.warn({ err: err.message }, 'attachCommands failed');
    }

    return runtime;
  }

  async onConnectionUpdate(runtime, update) {
    const sessionId = String(runtime.docId);
    const { connection, lastDisconnect, qr } = update || {};

    if (qr) {
      runtime.qr = qr;
      await this.persist(runtime.docId, { hasQr: true, status: STATUS.PAIRING });
      this.emit('qr', { userId: runtime.userId, sessionId, qr });
    }

    if (connection === 'connecting') {
      await this.persist(runtime.docId, { status: STATUS.CONNECTING });
      return;
    }

    if (connection === 'open') {
      const me = runtime.sock.user || null;
      runtime.attempts = 0;
      await this.persist(runtime.docId, {
        status: STATUS.CONNECTED,
        me: me ? { id: me.id, name: me.name || me.verifiedName || null } : null,
        pushName: me?.name || null,
        platform: me?.platform || null,
        connectedAt: new Date(),
        lastError: null,
        hasQr: false,
        pairingCode: null,
      });
      await this.logEvent(runtime.docId, 'connected', { id: me?.id });
      this.emit('connected', { userId: runtime.userId, sessionId, me });
      return;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || 'connection closed';
      this.runtimes.delete(sessionId);

      // 401 — user logged the device out from their phone. Terminal.
      if (statusCode === DisconnectReason.loggedOut) {
        await clearAuth(sessionId);
        await this.persist(runtime.docId, {
          status: STATUS.LOGGED_OUT,
          lastError: 'Device unlinked from phone.',
          hasQr: false,
          pairingCode: null,
          me: null,
        });
        await this.logEvent(runtime.docId, 'logged_out', { reason });
        this.emit('logged-out', { userId: runtime.userId, sessionId });
        return;
      }

      // 440 — connectionReplaced / "Stream Errored (conflict)". Another
      // container (or a stale socket) is using the same creds. Reconnecting
      // instantly just repeats the fight, so back off and let the lease
      // decide who wins.
      if (statusCode === 440 || statusCode === DisconnectReason.connectionReplaced) {
        await this.persist(runtime.docId, {
          status: STATUS.CONNECTING,
          lastError: 'Another instance is using this session (440).',
          hasQr: false,
        });
        await this.logEvent(runtime.docId, 'conflict', { reason });
        await this.releaseLease(runtime.docId);
        await delay(20_000 + Math.floor(Math.random() * 10_000));
        this.reconnect(runtime.docId).catch(() => {});
        return;
      }

      // 515 — restartRequired. This is the normal "phone accepted the code"
      // signal. Reconnect fast so the registration completes.
      if (statusCode === DisconnectReason.restartRequired) {
        await this.persist(runtime.docId, { status: STATUS.CONNECTING });
        await this.logEvent(runtime.docId, 'restart_required', { reason });
        await delay(300);
        this.reconnect(runtime.docId).catch(() => {});
        return;
      }

      // Everything else — transient network / 428 / 408 / timeout. Back off
      // and retry a few times, then park the session as disconnected.
      runtime.attempts = (runtime.attempts || 0) + 1;
      const retryable = runtime.attempts <= 5 && !this._shuttingDown;
      await this.persist(runtime.docId, {
        status: retryable ? STATUS.CONNECTING : STATUS.DISCONNECTED,
        lastError: reason,
        hasQr: false,
      });
      await this.logEvent(runtime.docId, 'closed', { statusCode, reason, attempt: runtime.attempts });

      if (retryable) {
        const wait = Math.min(2000 * runtime.attempts, 15000);
        await delay(wait);
        this.reconnect(runtime.docId).catch(() => {});
      } else {
        this.emit('disconnected', { userId: runtime.userId, sessionId, reason });
      }
    }
  }

  async reconnect(docId) {
    if (this._shuttingDown) return;
    const doc = await this.col.findOne({ _id: typeof docId === 'string' ? new ObjectId(docId) : docId });
    if (!doc) return;
    if (doc.status === STATUS.LOGGED_OUT) return;
    // Do not auto-start a socket for a session that never got a pairing code
    // request — otherwise we would spawn sockets for idle rows on boot.
    if (!doc.pairingAt && !doc.connectedAt) return;
    await this.startSocket(doc);
  }

  /**
   * Keep linked sessions alive.
   *
   * A session that has `me` set is a real, linked device. If its socket is not
   * in `this.runtimes` (dropped by a network blip, a 401 retry, a container
   * restart) the number silently stops answering commands. This loop notices
   * that within 30s and brings it back — that is what "stays active" means in
   * practice.
   */
  startWatchdog(intervalMs = 30_000) {
    if (this._watchdog) return this._watchdog;
    this._watchdog = setInterval(async () => {
      if (this._shuttingDown) return;
      try {
        // Only reviving genuinely-live states. DISCONNECTED is what the user
        // gets after pressing "Disconnect" — reviving it made the button
        // useless and brought the bot back 30s later.
        const docs = await this.col
          .find({
            me: { $ne: null },
            status: { $in: [STATUS.CONNECTED, STATUS.CONNECTING, STATUS.ERROR] },
          })
          .toArray();
        for (const doc of docs) {
          const sid = String(doc._id);
          if (this.runtimes.has(sid)) continue;
          // Another instance may own this session right now.
          if (doc.lockOwner && doc.lockOwner !== this.instanceId) {
            const lockAge = doc.lockAt ? Date.now() - new Date(doc.lockAt).getTime() : Infinity;
            if (lockAge < LEASE_MS) continue;
          }
          logger.warn({ sid, number: doc.number, status: doc.status }, 'watchdog: reviving linked session');
          await this.logEvent(doc._id, 'watchdog_revive', { status: doc.status });
          await this.startSocket({ ...doc, status: STATUS.CONNECTING });
        }
      } catch (err) {
        logger.warn({ err: err.message }, 'watchdog tick failed');
      }
    }, intervalMs);
    if (this._watchdog.unref) this._watchdog.unref();
    return this._watchdog;
  }

  stopWatchdog() {
    if (this._watchdog) {
      clearInterval(this._watchdog);
      this._watchdog = null;
    }
  }

  /** Reconnect every session that was connected when the process died. */
  async resumeAll() {
    // ERROR is included on purpose: a redeploy can interrupt a Mongo write and
    // leave a perfectly-linked session parked as `error`. Skipping it would
    // mean a linked number silently stops working after every deploy.
    const docs = await this.col
      .find({
        status: {
          $in: [STATUS.CONNECTED, STATUS.CONNECTING, STATUS.PAIRING, STATUS.ERROR],
        },
      })
      .toArray();
    let resumed = 0;
    for (const doc of docs) {
      // Skip stale pairing rows whose window has long expired.
      if (doc.status === STATUS.PAIRING && doc.pairingAt) {
        const age = Date.now() - new Date(doc.pairingAt).getTime();
        if (age > 10 * 60 * 1000) {
          await this.persist(doc._id, { status: STATUS.DISCONNECTED, hasQr: false, pairingCode: null });
          continue;
        }
      }
      try {
        await this.startSocket(doc);
        resumed += 1;
      } catch (err) {
        logger.warn({ err: err.message }, 'resume failed');
      }
    }
    return resumed;
  }

  async _killRuntime(sessionId) {
    const rt = this.runtimes.get(sessionId);
    if (!rt) {
      await this.releaseLease(sessionId);
      return;
    }
    this.runtimes.delete(sessionId);
    try {
      rt.detachCommands?.();
      rt.sock.ev.removeAllListeners('connection.update');
      rt.sock.ev.removeAllListeners('creds.update');
      rt.sock.ev.removeAllListeners('messages.upsert');
      rt.sock.end(undefined);
    } catch {
      /* already gone */
    }
    await this.releaseLease(rt.docId || sessionId);
  }

  async disconnect(sessionId, ownerId) {
    const doc = await this.getSession(sessionId, ownerId);
    if (!doc) {
      const e = new Error('Session nahi mili.');
      e.status = 404;
      throw e;
    }
    await this._killRuntime(String(doc._id));
    await this.persist(doc._id, {
      status: STATUS.DISCONNECTED,
      hasQr: false,
      pairingCode: null,
      lastError: 'Manually disconnected.',
    });
    await this.logEvent(doc._id, 'disconnected', { by: 'user' });
    return publicSession(await this.getSession(sessionId, ownerId));
  }

  async remove(sessionId, ownerId) {
    const doc = await this.getSession(sessionId, ownerId);
    if (!doc) {
      const e = new Error('Session nahi mili.');
      e.status = 404;
      throw e;
    }
    await this._killRuntime(String(doc._id));
    await clearAuth(String(doc._id));
    await this.col.deleteOne({ _id: doc._id });
    await this.logEvent(doc._id, 'removed', { number: doc.number });
    this.emitUpdate(doc.userId, { id: String(doc._id), deleted: true, status: STATUS.IDLE });
    return { id: String(doc._id), deleted: true };
  }

  /** QR string for the live socket, if any. */
  getQr(sessionId) {
    const rt = this.runtimes.get(String(sessionId));
    return rt ? rt.qr : null;
  }

  /** Live pairing code, if any (falls back to the persisted one). */
  async getPairCode(sessionId, ownerId) {
    const doc = await this.getSession(sessionId, ownerId);
    if (!doc) return null;
    const rt = this.runtimes.get(String(sessionId));
    return (rt && rt.code) || doc.pairingCode || null;
  }

  stats() {
    const counts = {};
    for (const rt of this.runtimes.values()) {
      counts[rt.number] = true;
    }
    return {
      liveSockets: this.runtimes.size,
      uptimeMs: Date.now() - this.startedAt,
      shuttingDown: this._shuttingDown,
    };
  }

  async shutdown() {
    this._shuttingDown = true;
    this.stopWatchdog();
    this.stopHeartbeat();
    for (const [sessionId, rt] of this.runtimes.entries()) {
      try {
        rt.sock.ev.removeAllListeners('connection.update');
        rt.sock.end(undefined);
      } catch {
        /* ignore */
      }
      this.runtimes.delete(sessionId);
      // Hand the lease back so the replacement container can connect at once
      // instead of waiting for the 45s stale window.
      await this.releaseLease(rt.docId || sessionId);
    }
  }
}

module.exports = { WaManager, STATUS, normalizePhone, publicSession };
