# WA Gateway — Bug Fix Report

**Project:** `wagateway-pairing` / service `wagateway`
**Live:** https://wagateway-production-1f69.up.railway.app
**Repo:** https://github.com/saqibxiqbal-spec/wagateway
**Commits:** `bf4a624` (main fixes) → `15a9e65` (cleanup)
**Date:** 2026-10-23

---

## 1. Bug: bot kabhi reply nahi karta tha (CRITICAL)

**File:** `server/wa/commands.js`

Landing page user ko kehti hai: *"Apne hi number ki chat (Message yourself) mein likhein."*
Lekin linked device ko apni hi messages `key.fromMe = true` ke saath milti hain, aur code
mein ye line thi:

```js
if (raw.key?.fromMe) continue; // never answer ourselves
```

Natija: **har** self-chat command silently drop ho jati thi. Number link ho jata tha,
socket bhi live tha, magar bot chup. Yehi wajah thi ke "bot kaam nahi karta".

**Fix:** `fromMe` messages sirf self-chat mein process hoti hain, aur bot apni bheji hui
messages ko `sentIds` set se pehchaan kar skip karta hai — is liye reply loop kabhi nahi banta.

```js
if (raw.key.fromMe) {
  if (!isSelfChat) continue;              // apni outbound to friends ignore
  if (sentIds.has(raw.key.id)) continue;  // apna hi reply ignore
}
```

---

## 2. Bug: Railway redeploy par 440 "Stream Errored (conflict)" loop

**File:** `server/wa/manager.js`

Rolling deploy mein kuch seconds ke liye purana aur naya container dono chalte hain. Dono
same creds se socket kholte hain → WhatsApp dono ko 440 se maar deta hai → watchdog wapas
uthata hai → phir conflict. Linked number bar-bar offline.

**Fix:** Mongo-backed **lease** per session (`lockOwner` + `lockAt`, 45s TTL, 15s heartbeat).
Sirf lease holder socket khol sakta hai. Graceful shutdown lease chhor deta hai, is liye
naya container foran connect ho jata hai.

**Proof:** deploy ke baad koi `conflict` event nahi. Sirf `lease_busy` (purana container
khud back off kar gaya) aur phir `connected`.

---

## 3. Bug: "Disconnect" button bekaar tha

**File:** `server/wa/manager.js` → `startWatchdog()`

Watchdog har 30s mein `me != null && status != logged_out` wale sab sessions revive karta tha.
Manual disconnect ke 30 second baad bot khud wapas online aa jata tha.

**Fix:** watchdog sirf `connected / connecting / error` revive karta hai. `disconnected`
ab disconnected rehta hai.

**Proof:** fake disconnected session 40s tak observe kiya — `connected: false`, status
`disconnected` hi raha.

---

## 4. Bug: poisoned creds → 401 "could not link device"

**File:** `server/wa/manager.js`

Agar `creds.me` maujood ho magar `creds.registered === false` (adhoori pairing), agli LOGIN
node 401 deti hai. Purana guard sirf tab chalta tha jab `pairingAt` na ho — yani retry par
guard bypass ho jata tha.

**Fix:** ab har start par `!registered && me` ho to `me` / `pairingCode` delete kar ke clean
handshake hota hai.

---

## 5. Bug: `.vv` (view-once) crash

**File:** `server/wa/commands.js`

`sock.downloadMediaMessage()` Baileys 7 mein maujood nahi. Ab standalone helper use hota hai:

```js
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
```

Sath hi `getMessage` ab in-memory cache (300 messages) se answer karta hai, is liye retry
receipts aur media re-download bhi kaam karte hain.

---

## 6. Bug: linked number dobara daalne par bot disconnect

**File:** `server/wa/manager.js` → `pair()`, `server/routes/quick.js`

User wahi number dobara submit karta to `pair()` pehle live socket kill karta tha. Ab
already-connected session detect ho kar `alreadyConnected: true` return hota hai — socket
chhua bhi nahi jata. Frontend seedha "Linked! Bot Active hai" screen dikhata hai.

---

## 7. Bug: duplicate `pair_code` audit event

`pair()` aur `startSocket()` dono same code log karte the. Ab sirf `startSocket()` log karta hai.

---

## 8. Bug: stray external script

`web/quick.html` aur `web/index.html` mein `sites.super.myninja.ai/.../ninja-daytona-script.js`
leftover tha. Production se hata diya (privacy + extra request).

---

## Verification

### Offline unit tests — 11/11 pass (`npm run test:commands`)

```
PASS  self-chat .ping answered
PASS  reply is Pong
PASS  bot ignores its own message (no loop)
PASS  no-prefix text ignored
PASS  .menu returns list
PASS  .calc computes 100
PASS  .alive responds
PASS  duplicate message id handled once
PASS  DM from another user answered
PASS  own outbound to a friend ignored
PASS  stale history message ignored
```

### Live production checks

| Check | Result |
|---|---|
| `GET /api/health` | 200, `mongo: up` |
| Pairing code generation | `1CJDFJ5Z` in ~4.7s |
| QR generation | valid PNG data URL |
| Linked number `923067846267` | `connected`, socket live |
| Command handler attached | `commandHandlerAttached: true`, 47 commands |
| Lease ownership | `leaseOwner === thisInstance` |
| Bot send test | `sentTo 923067846267:21@s.whatsapp.net` OK |
| 440 conflicts after fix | 0 |

---

## Aap kaise test karein

1. https://wagateway-production-1f69.up.railway.app kholein
2. Number daalein → 8-digit code
3. Phone: WhatsApp → Settings → Linked devices → Link a device → "Link with phone number"
4. Code type karein
5. **Apni hi chat ("Message yourself")** mein likhein:
   - `.menu` — poori list
   - `.ping` — speed
   - `.alive` — status
   - `.calc 25*4` — hisaab

---

## Note

- Railway service ab GitHub repo `saqibxiqbal-spec/wagateway` (branch `main`) se connected hai.
  Deploy abhi manual trigger se hota hai. Push par automatic deploy ke liye Railway GitHub App
  ko repo par install karna hoga (permission Railway dashboard se).
- Purani `logged_out` sessions DB mein padi hain — chahein to cleanup kar sakte hain.
