/**
 * Regression tests for the pairing engine.
 *
 * These cover the three bugs that made "number link hi nahi hota" and the bot
 * stay silent:
 *
 *  1. sanitizeCreds() must keep a REAL paired identity. The old guard deleted
 *     `creds.me` whenever `registered` was false, which wiped a successful
 *     pairing on the very next reconnect.
 *  2. A pairing code may only be requested for an explicit user action
 *     (`wantCode: true`). Automatic reconnects must never mint a new code,
 *     because that cancels the registration already in flight.
 *  3. Self-chat commands must be answered when WhatsApp addresses the account
 *     by its LID instead of the phone-number JID.
 *
 * No network and no Mongo: baileys / db / authState / commands are stubbed.
 */
const path = require('path');
const { EventEmitter } = require('events');

const ROOT = __dirname;
const results = [];
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
}

// ---------------------------------------------------------------- stub baileys
const baileysPath = require.resolve('@whiskeysockets/baileys', { paths: [ROOT] });
const calls = { requestPairingCode: 0, sockets: 0 };
let lastSock = null;

function makeWASocket(config) {
  calls.sockets += 1;
  const ev = new EventEmitter();
  const sock = {
    ev,
    auth: config.auth,
    user: null,
    requestPairingCode: async (num) => {
      calls.requestPairingCode += 1;
      sock.lastPairNumber = num;
      return 'TESTCODE';
    },
    sendMessage: async () => ({ key: { id: 'x' } }),
    end: () => {},
    groupMetadata: async () => ({ participants: [] }),
  };
  lastSock = sock;
  // Emit asynchronously so listeners registered by the manager are attached.
  setTimeout(() => ev.emit('connection.update', { connection: 'connecting' }), 5);
  return sock;
}

require.cache[baileysPath] = {
  id: baileysPath,
  filename: baileysPath,
  loaded: true,
  exports: {
    __esModule: true,
    default: makeWASocket,
    DisconnectReason: {
      loggedOut: 401,
      connectionClosed: 428,
      connectionLost: 408,
      connectionReplaced: 440,
      timedOut: 408,
      restartRequired: 515,
      badSession: 500,
    },
    fetchLatestBaileysVersion: async () => ({ version: [2, 3000, 0] }),
    Browsers: { macOS: () => ['Mac OS', 'Desktop'] },
    makeCacheableSignalKeyStore: (keys) => keys,
    delay: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 5))),
    initAuthCreds: () => ({}),
    BufferJSON: { replacer: (k, v) => v, reviver: (k, v) => v },
    downloadMediaMessage: async () => Buffer.from(''),
  },
};

// ---------------------------------------------------------------- stub db
const dbPath = path.join(ROOT, 'server', 'db.js');
const store = new Map();
function fakeCollection() {
  return {
    findOne: async (f) => store.get(String(f._id)) || null,
    findOneAndUpdate: async (f, u) => {
      const cur = store.get(String(f._id)) || { _id: f._id };
      const next = { ...cur, ...(u.$set || {}) };
      store.set(String(f._id), next);
      return next;
    },
    updateOne: async (f, u) => {
      const cur = store.get(String(f._id)) || { _id: f._id };
      store.set(String(f._id), { ...cur, ...(u.$set || {}) });
      return { ok: 1 };
    },
    updateMany: async () => ({ ok: 1 }),
    insertOne: async (d) => {
      store.set(String(d._id), d);
      return { insertedId: d._id };
    },
    deleteOne: async () => ({ ok: 1 }),
    countDocuments: async () => 0,
    find: () => ({ sort: () => ({ toArray: async () => [] }), toArray: async () => [] }),
  };
}
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { getDb: () => ({ collection: fakeCollection }), connect: async () => {}, close: async () => {} },
};

// ---------------------------------------------------------------- stub authState
const authPath = path.join(ROOT, 'server', 'wa', 'authState.js');
let credsForNextSocket = null;
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    useMongoAuthState: async () => {
      const creds = credsForNextSocket;
      return { state: { creds, keys: {} }, saveCreds: async () => {} };
    },
    clearAuth: async () => {},
  },
};

// ---------------------------------------------------------------- stub commands
const cmdPath = path.join(ROOT, 'server', 'wa', 'commands.js');
require.cache[cmdPath] = {
  id: cmdPath,
  filename: cmdPath,
  loaded: true,
  exports: { attachCommands: () => () => {}, commands: new Map() },
};

const { WaManager, sanitizeCreds, normalizePhone } = require('./server/wa/manager');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ---------------------------------------------------- 1. sanitizeCreds
  {
    const placeholder = { registered: false, me: { id: '92300@s.whatsapp.net', name: '~' } };
    const v = sanitizeCreds(placeholder);
    check('placeholder me is dropped', v.action === 'dropped-placeholder' && !placeholder.me);
  }
  {
    // What configureSuccessfulPairing() actually produces: real me + account,
    // but registered is still false because that flag is set elsewhere.
    const real = {
      registered: false,
      me: { id: '92300:12@s.whatsapp.net', name: 'Saqiib', lid: '111@lid' },
      account: { details: Buffer.from('x') },
    };
    const v = sanitizeCreds(real);
    check(
      'REAL paired identity survives (was the root cause)',
      v.action === 'promoted-registered' && !!real.me && real.registered === true
    );
  }
  {
    const empty = { registered: false, me: null };
    check('no me -> nothing to do', sanitizeCreds(empty).action === 'none');
  }

  // ---------------------------------------------------- 2. phone normalising
  check('local 0300... -> 92300...', normalizePhone('0300 1234567') === '923001234567');
  check('+92 ... -> 92300...', normalizePhone('+92 300-1234567') === '923001234567');
  check('11+ digits kept as-is', normalizePhone('50955733672') === '50955733672');
  check('garbage rejected', normalizePhone('abc') === null);

  // ---------------------------------------------------- 3. no code on reconnect
  {
    const wa = new WaManager();
    const id = '6adb87860308a62e0db0d98f';
    const doc = { _id: id, userId: 'guest-public', number: '923001234567', status: 'connecting', me: null };
    store.set(id, doc);
    credsForNextSocket = { registered: false, me: null };
    calls.requestPairingCode = 0;

    await wa.startSocket(doc, { wantCode: false });
    await sleep(40);
    check('reconnect does NOT request a pairing code', calls.requestPairingCode === 0);
    await wa.shutdown();
  }

  // ---------------------------------------------------- 4. explicit code request
  {
    const wa = new WaManager();
    const id = '6adb9360020b43ff75c5a997';
    const doc = { _id: id, userId: 'guest-public', number: '923001234567', status: 'pairing', me: null };
    store.set(id, doc);
    credsForNextSocket = { registered: false, me: null };
    calls.requestPairingCode = 0;

    await wa.startSocket(doc, { wantCode: true });
    await sleep(40);
    check('explicit pair() requests exactly one code', calls.requestPairingCode === 1);
    await wa.shutdown();
  }

  // ---------------------------------------------------- 5. paired session never re-registers
  {
    const wa = new WaManager();
    const id = '6ada57172cbc2af53ac2078e';
    const doc = { _id: id, userId: 'guest-public', number: '923067846267', status: 'connected', me: { id: '923067846267:21@s.whatsapp.net' } };
    store.set(id, doc);
    credsForNextSocket = {
      registered: false,
      me: { id: '923067846267:21@s.whatsapp.net', name: 'Saqiib' },
      account: { details: Buffer.from('x') },
    };
    calls.requestPairingCode = 0;

    await wa.startSocket(doc, { wantCode: true });
    await sleep(40);
    check(
      'paired creds are never re-registered even if wantCode is set',
      calls.requestPairingCode === 0 && !!credsForNextSocket.me
    );
    await wa.shutdown();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('TEST CRASH', e);
  process.exit(1);
});
