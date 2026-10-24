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
const { attachAIAgent } = require('./aiAgent');

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

/**
 * Decide what a stored creds blob means before a socket is opened.
 *
 * Baileys picks registration vs login from `creds.me` (`if (!creds.me)`), so
 * the only thing that must be removed is the PLACEHOLDER me that
 * `requestPairingCode()` writes (`{ id, name: '~' }`). A real me — one that
 * carries an `account` from `configureSuccessfulPairing()` — must survive,
 * otherwise a completed pairing is wiped on the next reconnect and Baileys
 * starts registering (and minting codes) all over again.
 *
 * Returns { action, changed }.
 */
function sanitizeCreds(creds) {
  if (!creds || !creds.me) return { action: 'none', changed: false };
  const placeholder = !creds.registered && creds.me.name === '~' && !creds.account;
  if (placeholder) {
    // Only `me` is dropped: it is what makes Baileys send a REGISTRATION node.
    // `pairingCode` and `pairingEphemeralKeyPair` must survive, because they
    // are what decrypts the phone's response when the socket reconnects while
    // a pairing is still in flight.
    delete creds.me;
    return { action: 'dropped-placeholder', changed: true };
  }
  if (!creds.registered) {
    creds.registered = true;
    return { action: 'promoted-registered', changed: true };
  }
  return { action: 'kept', changed: false };
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
    /**
     * One promise chain per session. Two concurrent startSocket() calls for the
     * same number used to create two live sockets; WhatsApp then answers with
     * 440/515 and the registration of the first socket is cancelled by the
     * second one asking for a brand-new pairing code. Serialising every
     * lifecycle operation per session removes that race completely.
     */
    this._locks = new Map();
    /**
     * Reconnect attempts per session, kept OUTSIDE the runtime object. The
     * runtime is recreated on every reconnect, so a per-runtime counter always
     * restarted at 0 and the retry limit never triggered — that is what turned
     * one failed pairing into an endless code-churn loop.
     */
    this._attempts = new Map();
  }

  /** Run `fn` exclusively for one session (serialised, never rejects the chain). */
  withLock(sessionId, fn) {
    const key = String(sessionId);
    const prev = this._locks.get(key) || Promise.resolve();
    const run = prev.then(fn, fn);
    this._locks.set(key, run.then(() => {}, () => {}));
    return run;
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
  async pair(sessionId, ownerId, opts = {}) {
    const force = opts.force === true;
    const doc = await this.getSession(sessionId, ownerId);
    if (!doc) {
      const e = new Error('Session nahi mili.');
      e.status = 404;
      throw e;
    }

    const sid = String(doc._id);

    // Already linked? Never tear down a healthy socket just because the user
    // re-submitted the same number — that used to disconnect a working bot.
    const live = this.runtimes.get(sid);
    if (doc.status === STATUS.CONNECTED && (doc.me || (live && live.sock?.user))) {
      return {
        code: null,
        sessionId: sid,
        alreadyConnected: true,
        status: STATUS.CONNECTED,
        me: doc.me || null,
        message: 'Ye number pehle se linked hai aur bot chal raha hai.',
      };
    }

    // A pairing code that is still inside its TTL must be REUSED, not replaced.
    // Every page refresh / double click used to request a fresh code, which
    // instantly invalidated the code the user was typing on their phone — the
    // single biggest reason "number link hi nahi hota" was reported.
    const age = doc.pairingAt ? Date.now() - new Date(doc.pairingAt).getTime() : Infinity;
    if (!force && live && live.code && age < config.PAIR_CODE_TTL_MS) {
      return { code: live.code, sessionId: sid, reused: true };
    }

    return this.withLock(sid, async () => {
      // Re-check inside the lock: a concurrent request may have just created a
      // socket while we were waiting for the lock.
      const docNow = (await this.getSession(sid, ownerId)) || doc;
      const rt = this.runtimes.get(sid);
      const ageNow = docNow.pairingAt
        ? Date.now() - new Date(docNow.pairingAt).getTime()
        : Infinity;
      if (!force && rt && rt.code && ageNow < config.PAIR_CODE_TTL_MS) {
        return { code: rt.code, sessionId: sid, reused: true };
      }
      if (docNow.status === STATUS.CONNECTED && (docNow.me || rt?.sock?.user)) {
        return {
          code: null,
          sessionId: sid,
          alreadyConnected: true,
          status: STATUS.CONNECTED,
          me: docNow.me || null,
          message: 'Ye number pehle se linked hai aur bot chal raha hai.',
        };
      }

      // Kill any existing socket for this session first.
      await this._killRuntime(sid);

      await this.persist(docNow._id, {
        status: STATUS.PAIRING,
        pairingAt: new Date(),
        lastError: null,
        hasQr: false,
        pairingCode: null,
      });

      // wantCode:true is the ONLY place a pairing code is ever requested.
      const runtime = await this.startSocket(
        { ...docNow, status: STATUS.PAIRING, pairingAt: new Date() },
        { wantCode: true }
      );
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
        await delay(100);
      }

      if (runtime.code) {
        await this.persist(docNow._id, { pairingCode: runtime.code, status: STATUS.PAIRING });
        return { code: runtime.code, sessionId: sid };
      }

      // No code yet but the socket is alive: the client can poll /qr or wait for
      // the socket event. Report the current state instead of a hard failure.
      return {
        code: null,
        sessionId: sid,
        pending: true,
        message: 'Pairing shuru ho gayi — code 10-20 second mein aa jayega.',
      };
    });
  }

  async startSocket(doc, opts = {}) {
    const sessionId = String(doc._id);
    if (this._shuttingDown) return null;

    // Only an explicit user action ("Get code" / "Naya code") may request a new
    // pairing code. Automatic reconnects must never do it: a fresh code cancels
    // the registration that is already in flight.
    const wantCode = opts.wantCode === true;

    // --- Single-socket guard ---------------------------------------------
    // Two sockets sharing one set of creds make WhatsApp emit
    // "Stream Errored (conflict)" and kill both. If a runtime already exists
    // for this session, tear it down before opening a new one.
    if (this.runtimes.has(sessionId)) {
      logger.warn({ sessionId }, 'startSocket: killing existing runtime first');
      await this._killRuntime(sessionId);
      await delay(150);
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

    // --- Poisoned-creds guard (rc14 semantics) ----------------------------
    // See sanitizeCreds() for the full reasoning.
    const verdict = sanitizeCreds(state.creds);
    if (verdict.changed) {
      try {
        await saveCreds();
      } catch {
        /* non-fatal */
      }
      await this.logEvent(doc._id, 'creds_' + verdict.action, null);
    }

    // fetchLatestBaileysVersion() is a network round-trip. Doing it on every
    // socket start added ~1-3s to the pairing flow, so cache it per process.
    if (!WaManager._versionPromise) {
      WaManager._versionPromise = fetchLatestBaileysVersion()
        .then((r) => r.version)
        .catch(() => undefined);
    }
    const version = await WaManager._versionPromise;

    let sock;
    try {
      sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        // The QR-ref budget is what kills a pairing socket: Baileys ends the
        // connection with 408 "QR refs attempts ended" after ~60s + 4x20s.
        // A user needs time to open WhatsApp, tap Link a device and type the
        // code, so stretch the window well past the code TTL.
        qrTimeout: 300_000,
        browser: Browsers.macOS('Desktop'),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        // Appear online so messages are DELIVERED (double grey tick). We never
        // call readMessages(), so the sender never gets a blue tick.
        markOnlineOnConnect: config.ALWAYS_ONLINE,
        // Keep the handshake snappy and the link healthy.
        connectTimeoutMs: 20_000,
        defaultQueryTimeoutMs: 60_000,
        keepAliveIntervalMs: 15_000,
        retryRequestDelayMs: 250,
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
      // Survives across reconnects (see this._attempts).
      attempts: this._attempts.get(sessionId) || 0,
      wantCode,
      registered: Boolean(state.creds.registered),
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
    // A code is minted only for an explicit user action. On an automatic
    // reconnect during an unfinished pairing we re-send the SAME code, which
    // re-establishes the companion_hello handshake without invalidating the
    // digits the user is typing.
    if (!state.creds.registered) {
      const previous = state.creds.pairingCode;
      // Never re-request a code once WhatsApp has given us an identity: that
      // restarts the companion handshake and is what made "logging in" hang.
      const reuse =
        !wantCode &&
        !state.creds.me &&
        typeof previous === 'string' &&
        /^[A-Z0-9]{8}$/i.test(previous);
      if (wantCode || reuse) {
      (async () => {
        try {
          await delay(400); // let the socket reach the handshake stage
          const code = await sock.requestPairingCode(runtime.number, reuse ? previous : undefined);
          runtime.code = code;
          await this.persist(doc._id, { pairingCode: code, status: STATUS.PAIRING, lastError: null });
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

    // --- AI auto-reply agent (.saqib on) ---------------------------------
    try {
      runtime.detachAgent = attachAIAgent(sock, { sessionId, logger });
      runtime.agentAttached = true;
    } catch (err) {
      logger.warn({ err: err.message }, 'attachAIAgent failed');
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
      runtime.registered = true;
      this._attempts.delete(sessionId);
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

      // --- Always-online presence -----------------------------------------
      // `available` makes the account show online and lets WhatsApp deliver
      // messages (double grey tick). We deliberately NEVER send read receipts,
      // so the other side never sees a blue tick.
      if (config.ALWAYS_ONLINE) {
        const ping = () =>
          runtime.sock?.sendPresenceUpdate('available').catch(() => {});
        ping();
        clearInterval(runtime.presenceTimer);
        runtime.presenceTimer = setInterval(ping, config.PRESENCE_INTERVAL_MS);
        if (runtime.presenceTimer.unref) runtime.presenceTimer.unref();
      }
      return;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = lastDisconnect?.error?.message || 'connection closed';
      clearInterval(runtime.presenceTimer);
      runtime.presenceTimer = null;
      this.runtimes.delete(sessionId);

      // 401 — user logged the device out from their phone. Terminal.
      if (statusCode === DisconnectReason.loggedOut) {
        this._attempts.delete(sessionId);
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

      // 408 timedOut — the QR/pairing window ran out before the phone submitted
      // the code. Do NOT silently reconnect: that would mint a brand-new code
      // and confuse the user. Park the row and ask for a fresh code instead.
      if (statusCode === DisconnectReason.timedOut && !runtime.registered) {
        this._attempts.delete(sessionId);
        await this.releaseLease(runtime.docId);
        await this.persist(runtime.docId, {
          status: STATUS.DISCONNECTED,
          lastError: 'Pairing code expire ho gaya — "Naya code" dabayein.',
          hasQr: false,
          pairingCode: null,
        });
        await this.logEvent(runtime.docId, 'pair_expired', { reason });
        this.emit('disconnected', { userId: runtime.userId, sessionId, reason });
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
        await delay(120);
        this.reconnect(runtime.docId).catch(() => {});
        return;
      }

      // Everything else — transient network / 428 / timeout. Back off and retry
      // a few times, then park the session as disconnected. The counter lives
      // in this._attempts so the limit actually holds across reconnects.
      const attempts = (this._attempts.get(sessionId) || 0) + 1;
      this._attempts.set(sessionId, attempts);
      runtime.attempts = attempts;
      const retryable = attempts <= 5 && !this._shuttingDown;
      await this.persist(runtime.docId, {
        status: retryable ? STATUS.CONNECTING : STATUS.DISCONNECTED,
        lastError: reason,
        hasQr: false,
      });
      await this.logEvent(runtime.docId, 'closed', { statusCode, reason, attempt: attempts });

      if (retryable) {
        const wait = Math.min(2000 * attempts, 15000);
        await delay(wait);
        this.reconnect(runtime.docId).catch(() => {});
      } else {
        this._attempts.delete(sessionId);
        this.emit('disconnected', { userId: runtime.userId, sessionId, reason });
      }
    }
  }

  async reconnect(docId) {
    if (this._shuttingDown) return;
    const sid = String(docId);
    // Serialise with pair()/watchdog so two sockets never race for one session.
    return this.withLock(sid, async () => {
      const doc = await this.col.findOne({ _id: typeof docId === 'string' ? new ObjectId(docId) : docId });
      if (!doc) return;
      if (doc.status === STATUS.LOGGED_OUT) return;
      // Do not auto-start a socket for a session that never got a pairing code
      // request — otherwise we would spawn sockets for idle rows on boot.
      if (!doc.pairingAt && !doc.connectedAt) return;
      // A pairing row without a code cannot be resumed: the code is bound to a
      // dead socket. Park it so the user can request a fresh one.
      if (doc.status === STATUS.PAIRING && !doc.me) return;
      await this.startSocket(doc);
    });
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
          await this.withLock(sid, async () => {
            if (this.runtimes.has(sid)) return;
            await this.startSocket({ ...doc, status: STATUS.CONNECTING });
          });
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
    //
    // PAIRING rows are deliberately NOT resumed: the pairing code is bound to
    // the socket that produced it, so a new socket would invalidate the code
    // the user is typing. Park them and let the page ask for a fresh one.
    const docs = await this.col
      .find({
        status: { $in: [STATUS.CONNECTED, STATUS.CONNECTING, STATUS.ERROR] },
      })
      .toArray();

    await this.col.updateMany(
      { status: STATUS.PAIRING, me: null },
      { $set: { status: STATUS.DISCONNECTED, hasQr: false, pairingCode: null, updatedAt: new Date() } }
    );

    let resumed = 0;
    for (const doc of docs) {
      try {
        await this.withLock(String(doc._id), async () => {
          if (this.runtimes.has(String(doc._id))) return;
          await this.startSocket(doc);
        });
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

module.exports = { WaManager, STATUS, normalizePhone, publicSession, sanitizeCreds };
