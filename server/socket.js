/**
 * Socket.io layer.
 *
 * Every authenticated user joins a private room `user:<id>`. The WaManager
 * emits raw events; this module fans them out to the right room only, so one
 * tenant can never see another tenant's QR or pairing code.
 */
const { Server } = require('socket.io');
const { socketUser } = require('./auth');
const config = require('./config');

const roomFor = (userId) => `user:${userId}`;

function attachSocket(httpServer, wa) {
  const io = new Server(httpServer, {
    cors: { origin: config.CORS_ORIGIN, credentials: true },
    path: '/socket.io',
  });

  // --- handshake auth ------------------------------------------------------
  io.use(async (socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const user = await socketUser(token);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(roomFor(user.id));
    socket.emit('ready', { userId: user.id, at: Date.now() });

    socket.on('ping:session', (_payload, ack) => {
      if (typeof ack === 'function') ack({ ok: true, at: Date.now() });
    });
  });

  // --- fan-out -------------------------------------------------------------
  const to = (userId, event, payload) => io.to(roomFor(String(userId))).emit(event, payload);

  wa.on('session', ({ userId, session }) => to(userId, 'session', session));
  wa.on('qr', ({ userId, sessionId, qr }) => to(userId, 'qr', { sessionId, qr }));
  wa.on('pair-code', ({ userId, sessionId, code }) => to(userId, 'pair-code', { sessionId, code }));
  wa.on('pair-code-error', ({ userId, sessionId, error }) =>
    to(userId, 'pair-code-error', { sessionId, error })
  );
  wa.on('connected', ({ userId, sessionId, me }) => to(userId, 'connected', { sessionId, me }));
  wa.on('logged-out', ({ userId, sessionId }) => to(userId, 'logged-out', { sessionId }));
  wa.on('disconnected', ({ userId, sessionId, reason }) =>
    to(userId, 'disconnected', { sessionId, reason })
  );

  return io;
}

module.exports = { attachSocket };
