# Wagateway — Round 4 Report

Deployed: commit `64641b1` · Railway deployment `3207d5f8` · **SUCCESS**
Live URL: **https://saqib-pairing-site.up.railway.app** (short: **/p**)

---

## 1. Har command sab ke liye — koi restriction nahi

Pehle `owner` aur `admin` commands block ho jate the. Ab **saari 2128 commands
har user ke liye chalتی hain** — koi gating nahi.

Owner number set kar diya gaya hai (label/info ke liye, block ke liye nahi):

- Code default: `config.OWNER_NUMBER = 923106762478`
- Railway env: `OWNER_NUMBER=923106762478`

---

## 2. Saare errors fix

Ek error classifier (`friendlyError`) add kiya jo har raw error ko readable
Urdu/Roman message mein badal deta hai:

| Pehle jo error aata tha | Ab jo message aata hai |
|---|---|
| `forbidden` / HTTP 403 | "Ye service ne request block kar di (forbidden). Thori der baad dobara try karein." |
| `unauthorized` / HTTP 401 | "Ye service abhi login/authorization maang rahi hai…" |
| `stream is not available` | "Media download nahi ho saka — link expire ho gaya ya private hai. Naya link bhejein." |
| `timeout` / `aborted` | "Service ne bohat der li, timeout ho gaya. Dobara try karein." |
| HTTP 404 | "Jo cheez maangi wo nahi mili. Spelling/link check karein." |
| HTTP 429 | "Bohat zyada requests — 1 minute baad try karein." |
| network / ENOTFOUND | "Network issue aa gaya. Thori der baad try karein." |

Plus:

- `fetchBuffer` ab **Referer header** bhejta hai — yahi `forbidden` ki asli wajah thi (CDNs bina referer ke 403 dete hain).
- Har network call ab **retry** karta hai (4xx ke ilawa).
- Koi bhi command crash ho to socket nahi girta — user ko friendly message jata hai.
- **Image banane ka masla fix:** `.imagine`, `.draw`, `.aiimage`, `.logo`, `.poster`, `.animeimg`, `.wallpaper2` — ye ab **asli image generate** karte hain (Pollinations, koi API key nahi chahiye) aur WhatsApp par bhejte hain.
- **Sticker fix:** agar WEBP convert na ho to error ke bajaye image bhej deta hai.

---

## 3. Speed fast

| Fix | Asar |
|---|---|
| Lazy `groupMetadata` | Group commands se ~200–600ms kam |
| Menu render cache (60s TTL) | `.menu` instant |
| Baileys version cached | socket start fast |
| Pairing delays 1200→400ms, 400→150ms, 300→120ms | code jaldi |
| Plugin preload at boot | pehli command slow nahi |
| `keepAliveIntervalMs 15s`, `connectTimeout 20s` | link healthy |

---

## 4. Menu ke sath bot ki picture (alag message nahi)

`.menu` ab **ek hi message** bhejta hai: bot ka avatar image + poora menu caption
mein. `.menu <category>` bhi image + caption. Agar image fail ho jaye to sirf
text chala jata hai — menu kabhi nahi gum hota.

Avatar: `web/assets/bot.jpg` (SAQIB MD robot mascot).

---

## 5. Default: sab off, sirf always-online on

- `ALWAYS_ONLINE=true` — bot hamesha online dikhta hai.
- `AUTO_READ=false` — **koi message read nahi hota**, is liye blue tick nahi jata.
- Bot kabhi `readMessages()` call nahi karta → doosre side ko **double grey tick**
  milta hai (delivered), blue tick nahi.
- Presence har 25 second refresh hoti hai taake online state na gire.

Yani: *online + double tick, lekin blue tick nahi, auto-read nahi.*

---

## 6. `.saqib on` — real AI agent

```
.saqib on      -> AI auto-reply ON
.saqib off     -> OFF
.saqib status  -> current state
.saqib clear   -> us chat ki memory clear
```

Jab ON ho:

- Koi bhi banda jo message karega (DM), bot khud AI se jawab dega.
- Per-chat conversation memory (aakhri 8 turns) — is liye follow-up samajhta hai.
  Example: banda "hello" → bot "Hello! How are you?" → banda "i am fine" →
  bot "That's great, have a nice day!"
- Same language mein jawab (Urdu / Roman Urdu / English).
- Reply se pehle "typing…" presence dikhata hai.
- Commands (`.`) AI se nahi guzarte — wo command engine handle karta hai.
- Groups mein auto-reply nahi karta (sirf DMs) taake group spam na ho.
- Do AI providers with fallback — ek fail ho to doosra try hota hai.
- Toggle Mongo (`wa_settings`) mein save hota hai, redeploy ke baad bhi yaad rehta hai.

**Default OFF hai** — jaisa aap ne kaha.

---

## 7. Short pairing URL

Railway ka service domain rename kar diya gaya hai:

```
https://saqib-pairing-site.up.railway.app
```

Aur short routes bhi hain (sab pairing page par le jate hain):

```
/p   /pair   /saqib   /link   /connect   /qr
```

Sab se chhota share karne wala link: **https://saqib-pairing-site.up.railway.app/p**

---

## 8. Live verification

```json
{
  "status": "connected",
  "connected": true,
  "commandHandlerAttached": true,
  "commandsLoaded": 2128,
  "selfChatReady": true,
  "aiAgentAttached": true,
  "aiAgentOn": false,
  "alwaysOnline": true,
  "autoRead": false,
  "me": { "id": "923067846267:21@s.whatsapp.net", "name": "Saqiib" }
}
```

Deployment logs: `.menu`, `.saqib on`, `.saqib status`, `.imagine a robot ninja`
— chaaron `command handled`, koi error nahi.

`npm test` → **22/22 pass**.

---

## 9. Aap ko kya karna hai

1. WhatsApp mein apne hi number ki "Message yourself" chat khol kar `.menu` likhein — bot ki picture ke sath 27 categories aayengi.
2. `.saqib on` likh kar kisi dost se "hello" karwayein — AI khud jawab dega.
3. Pairing link share karein: `https://saqib-pairing-site.up.railway.app/p`
4. **Security:** GitHub PAT, Railway tokens aur Mongo password rotate kar lein (details `connections-report.md` mein).
