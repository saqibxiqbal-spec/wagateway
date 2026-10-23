/**
 * WA Gateway — Express + Socket.io bootstrap.
 *
 * Boot order matters:
 *   1. connect Mongo (indexes created here)
 *   2. create the WaManager and hang it on app.locals
 *   3. start the HTTP server
 *   4. attach Socket.io
 *   5. resume previously-connected WhatsApp sessions
 */
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const db = require('./db');
const { WaManager } = require('./wa/manager');
const { attachSocket } = require('./socket');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const quickRoutes = require('./routes/quick');

// --- global outbound fetch guard (same idea as the bot) ---------------------
(() => {
  const realFetch = globalThis.fetch;
  if (typeof realFetch !== 'function' || realFetch.__waGuarded) return;
  const guarded = (input, init = {}) => {
    if (init && init.signal) return realFetch(input, init);
    return realFetch(input, { ...(init || {}), signal: AbortSignal.timeout(config.FETCH_TIMEOUT_MS) });
  };
  guarded.__waGuarded = true;
  globalThis.fetch = guarded;
})();

function createApp(wa) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.locals.wa = wa;

  // --- health --------------------------------------------------------------
  app.get('/api/health', async (_req, res) => {
    let mongo = 'down';
    try {
      await db.getDb().command({ ping: 1 });
      mongo = 'up';
    } catch {
      /* leave as down */
    }
    res.status(mongo === 'up' ? 200 : 503).json({
      ok: mongo === 'up',
      service: 'wagateway',
      version: '1.0.0',
      env: config.NODE_ENV,
      mongo,
      wa: wa.stats(),
      at: new Date().toISOString(),
    });
  });

  // --- API -----------------------------------------------------------------
  app.use('/api/auth', authRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/quick', quickRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ ok: false, error: 'Not found.' }));

  // --- static frontend -----------------------------------------------------
  if (config.SERVE_WEB) {
    const webDir = path.join(__dirname, '..', 'web');
    app.use(express.static(webDir, { maxAge: '1h', index: 'quick.html' }));
    // SPA fallback for non-API GETs
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  // --- error handler -------------------------------------------------------
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error('[api]', err);
    res.status(status).json({ ok: false, error: err.message || 'Server error.' });
  });

  return app;
}

async function main() {
  await db.connect();
  console.log('[db] connected ->', config.MONGODB_DB);

  const wa = new WaManager();
  const app = createApp(wa);
  const server = http.createServer(app);
  const io = attachSocket(server, wa);

  await new Promise((resolve) => server.listen(config.PORT, resolve));
  console.log(`[http] listening on :${config.PORT} (${config.NODE_ENV})`);

  const resumed = await wa.resumeAll();
  if (resumed) console.log(`[wa] resumed ${resumed} session(s)`);

  // Keep every linked number online, not just at boot.
  wa.startWatchdog(30_000);
  console.log('[wa] watchdog started (30s)');

  // --- graceful shutdown ---------------------------------------------------
  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`[shutdown] ${signal}`);
    try {
      await wa.shutdown();
      io.close();
      server.close();
      await db.close();
    } catch (err) {
      console.error('[shutdown]', err);
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
  process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[boot] failed:', err);
    process.exit(1);
  });
}

module.exports = { createApp, main };
