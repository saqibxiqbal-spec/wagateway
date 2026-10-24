# Wagateway — Commands + Pairing Fix (24 Oct 2026)

Deployed commit: `a4201f9e` · Railway deployment `3cf7b15a` · status **SUCCESS**

## 1. Total commands: 47 → 2123

Purani engine (`server/wa/commands.js`) mein sirf 47 commands hard-coded the.
Ab poora plugin system hai:

- `server/wa/registry.js` — command registry + 27 categories
- `server/wa/plugins/*.js` — 27 plugin files
- `server/wa/plugins/index.js` — loader (koi plugin fail ho to bot down nahi hota)

| Category | Commands |
|---|---|
| main | 9 |
| owner | 39 |
| general | 190 |
| tools | 93 |
| text | 62 |
| textmaker | 44 |
| media | 35 |
| download | 36 |
| search | 42 |
| group | 43 |
| admin | 34 |
| fun | 27 |
| game | 33 |
| islamic | 47 |
| ai | 50 |
| converter | 90 |
| crypto | 40 |
| math | 55 |
| time | 45 |
| random | 48 |
| emoji | 175 |
| info | 30 |
| stalk | 20 |
| economy | 33 |
| anime | 46 |
| system | 36 |
| **nsfw (hidden)** | 19 |

**Unique commands: 1434 · with aliases: 2123**

## 2. Menu ab categorized hai

- `.menu` → 27 categories ki list + counts
- `.menu <category>` → us category ke saare commands (e.g. `.menu fun`)
- `.menu all` → poori list (chunked, 3500 chars per message)
- `.total` → unique + alias count

## 3. Pairing speed

| Fix | Pehle | Ab |
|---|---|---|
| Baileys version fetch | har socket par network call | process mein cached |
| Pairing code request delay | 1200 ms | 400 ms |
| Purana socket kill wait | 400 ms | 150 ms |
| 515 restart wait | 300 ms | 120 ms |
| Code poll interval | 250 ms | 100 ms |
| Status poll (web) | 2500 ms | 1200 ms |
| Code re-request jab `me` set ho | ho jata tha (handshake restart) | nahi hota |
| Socket tuning | default | connectTimeout 20s, queryTimeout 60s, keepAlive 15s |

Sabse bada bug: pairing ke baad `me` set hone ke baad bhi purana code dobara
request ho raha tha — isi se "logging in" atak jata tha. Ab `me` set hone par
code kabhi re-request nahi hota.

## 4. Live verification

```
GET /api/quick/selftest/6ada57172cbc2af53ac2078e
{
  "status": "connected",
  "connected": true,
  "commandHandlerAttached": true,
  "commandsLoaded": 2123,
  "selfChatReady": true,
  "me": { "id": "923067846267:21@s.whatsapp.net", "name": "Saqiib" }
}
```

Deployment logs mein `.total`, `.menu fun`, `.ping` ke liye 3 × `command handled`.

`npm test` → **22/22 pass** (11 self-chat + 11 pairing).

## 5. Gating

- `owner` commands sirf `OWNER_NUMBERS` env (comma separated) wale numbers ke liye.
  Agar env set nahi hai to owner commands sabke liye khule hain — production mein
  `OWNER_NUMBERS=923067846267` set karna behtar hai.
- `admin` commands sirf group admins ke liye.
- `group` commands sirf groups mein.
- `nsfw` category menu mein hidden hai.

## 6. Security

Leaked credentials (GitHub PAT, Railway tokens, MongoDB password/API keys) ko
rotate karein — details `connections-report.md` mein.
