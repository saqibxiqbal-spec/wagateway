# WA Gateway — WhatsApp Multi-Device Pairing SaaS

A self-hosted web dashboard that links WhatsApp numbers to your stack using
**8-digit pairing codes** or a **live QR**, then keeps every session alive with
automatic reconnects. Built on **Baileys v7** (WhatsApp Web multi-device
protocol), **Express**, **Socket.io** and **MongoDB**.

```
┌────────────┐   JWT    ┌──────────────┐  Baileys  ┌────────────┐
│  Browser   │ ───────► │   Express    │ ────────► │  WhatsApp  │
│  (SPA)     │ ◄─────── │  + Socket.io │ ◄──────── │  servers   │
└────────────┘  events  └──────┬───────┘           └────────────┘
                               │
                        ┌──────▼───────┐
                        │   MongoDB    │  users · wa_sessions · wa_auth · wa_events
                        └──────────────┘
```

---

## What's inside

| Module | Where | What it does |
|---|---|---|
| Landing page | `web/index.html` + `web/app.js` | Marketing hero, features, how-it-works |
| Auth | `server/auth.js`, `server/routes/auth.js` | bcrypt signup/login, JWT sessions, `requireAuth` |
| Dashboard | `web/app.js` (`renderDashboard`) | Stats, session list, live status pills |
| Connection generator | `web/app.js` (`openConnectModal`, `openPairModal`) | 8-digit code display + QR container |
| Session manager | `server/wa/manager.js` | Socket lifecycle, reconnects, statuses, cleanup |
| Realtime | `server/socket.js` | Per-user rooms, `session`/`qr`/`pair-code`/`connected` events |
| Auth state | `server/wa/authState.js` | Baileys creds + signal keys persisted in Mongo |

---

## Quick start (local)

```bash
cd wagateway
cp .env.example .env          # then edit MONGODB_URI + JWT_SECRET
npm install
npm run seed                  # optional demo account
npm start                     # http://localhost:3000
```

Open <http://localhost:3000>, sign up, click **Connect a number**, enter
`923001234567`, and type the 8-digit code on the phone under
**WhatsApp → Settings → Linked devices → Link a device → Link with phone number**.

Smoke test (server must be running):

```bash
npm run smoke
```

---

## Environment variables

| Key | Default | Notes |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | local mongo | Atlas SRV string works |
| `MONGODB_DB` | `wagateway` | Separate from the bot's `saqib_md` |
| `JWT_SECRET` | `change-me…` | **Must** be set in production |
| `JWT_EXPIRES` | `7d` | Token lifetime |
| `MAX_SESSIONS_PER_USER` | `10` | Plan limit |
| `MAX_SESSIONS_TOTAL` | `500` | Server-wide cap |
| `DEFAULT_COUNTRY_CODE` | `92` | Used to expand `0300…` numbers |
| `PAIR_CODE_TTL_MS` | `110000` | WhatsApp's pairing window |
| `FETCH_TIMEOUT_MS` | `120000` | Outbound fetch guard |
| `CORS_ORIGIN` | `*` | Lock this down in production |
| `SERVE_WEB` | `true` | Serve `web/` from Express |

---

## API

All session routes require `Authorization: Bearer <jwt>`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness + Mongo ping + live socket count |
| `POST` | `/api/auth/register` | `{ email, password, name }` → `{ token, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/sessions` | List this user's sessions |
| `POST` | `/api/sessions` | `{ number, label }` → new session |
| `POST` | `/api/sessions/:id/pair` | Start socket, return 8-digit code |
| `GET` | `/api/sessions/:id/qr` | `{ qr: dataUrl, raw }` |
| `GET` | `/api/sessions/:id/code` | Current pairing code |
| `POST` | `/api/sessions/:id/disconnect` | Close socket, keep creds |
| `DELETE` | `/api/sessions/:id` | Unlink + wipe creds |
| `GET` | `/api/sessions/meta/limits` | `{ used, max }` |

Socket.io events (server → client, scoped to the user's room):
`session`, `qr`, `pair-code`, `pair-code-error`, `connected`, `logged-out`,
`disconnected`.

---

## How pairing actually works

1. `POST /api/sessions` normalises the number and creates a `wa_sessions` row.
2. `POST /api/sessions/:id/pair` opens a Baileys socket with Mongo-backed auth
   and calls `sock.requestPairingCode(number)`.
3. WhatsApp returns an 8-character code (valid ~2 minutes). The socket **must
   stay open** for the whole window or the code is rejected.
4. When the phone submits the code, WhatsApp sends a **515 restartRequired**
   disconnect. We reconnect in ~300 ms and `creds.registered` flips to `true`.
5. `connection: open` → status `connected`, `me` populated, QR cleared.
6. **401 loggedOut** (user removed the device) wipes `wa_auth` and marks the
   session `logged_out` so it can be re-paired.

### Poisoned-creds guard

If `creds.me` is set but `creds.registered` is `false`, the next LOGIN node is
rejected with *401 could not link device*. `manager.js` detects this and drops
the half-written `me` so Baileys starts a clean pairing handshake.

---

## Deploy

### Docker

```bash
docker build -t wagateway .
docker run -p 3000:3000 --env-file .env wagateway
```

### Railway

`railway.json` is included (Nixpacks, `node server/index.js`, health check
`/api/health`). Create a project, add the Mongo env vars, deploy. Because creds
live in Mongo, redeploys and restarts resume every linked session.

### Any VPS

```bash
npm ci --omit=dev
NODE_ENV=production node server/index.js
```

Put it behind Nginx/Caddy with TLS. Socket.io needs WebSocket upgrade headers.

---

## Security notes

- Passwords are bcrypt-hashed (10 rounds); login never reveals whether an email exists.
- Every session route checks `userId` ownership — cross-tenant access returns 404.
- Pairing codes and QR strings are only emitted to the owning user's Socket.io room.
- `wa_auth` holds live WhatsApp credentials: treat the database as a secret.
- Set a strong `JWT_SECRET`, a real `CORS_ORIGIN`, and rotate any credentials
  that were ever shared in plaintext.

## Limits & caveats

- Baileys is an unofficial client; WhatsApp can change the protocol at any time.
- One process can hold a few hundred sockets; scale horizontally only with a
  shared session lock (not included).
- Media sending/receiving is intentionally out of scope — this is a **pairing
  and session gateway**, not a full bot.
