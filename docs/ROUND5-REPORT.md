# Round 5 — AI Engines + `.mode public/private`

**Date:** 2026-10-24
**Commit:** `6c9d3bd`
**Live:** https://saqib-pairing-site.up.railway.app/p

---

## 1. AI Engines — DeepSeek + Gemini + OpenAI

Teeno keys add ki gayin aur ek **provider chain** banayi (`server/wa/aiProviders.js`).
Har request pehle sab se tez provider try karti hai; jo fail ho use 30s–10m ke liye
skip kar diya jata hai, taake user ko dobara wohi error na aaye.

### Chain order

| # | Provider | Model | Halat |
|---|----------|-------|-------|
| 1 | **Gemini** | `gemini-flash-lite-latest` | ✅ Chal raha — **~550ms** |
| 2 | DeepSeek | `deepseek-chat` | ⚠️ Key valid, **balance khatam** (`402 Insufficient Balance`) |
| 3 | OpenAI | `gpt-4o-mini` | ⚠️ Key valid, **credits khatam** (`429 insufficient_quota`) |
| 4 | Pollinations | free | ✅ Backup, key ki zaroorat nahi |

### Live test
```
601ms  { text: 'OK', provider: 'gemini' }
541ms  { text: 'Walaikum Assalam! Main aik AI hoon jo aap ki madad karne aur
                sawalon ke jawab dene ke liye banaya gaya hoon.', provider: 'gemini' }
```

Roman Urdu mein sahi jawab, ~550ms — WhatsApp auto-reply ke liye perfect.

### Model fix
Purana `gemini-2.5-flash` ab naye users ke liye band hai:
> `models/gemini-2.5-flash is no longer available to new users.`

Is liye `gemini-flash-lite-latest` default kiya, aur `gemini-3.5-flash` quality
fallback rakha. `gemini-3.8-flash` bhi chalta hai lekin **53 second** leta hai
(thinking model) — is liye chain mein nahi rakha.

### Kahan use hota hai
- `.saqib on` — auto AI agent (incoming messages ka jawab)
- `.ai`, `.aiexplain`, `.aicode`, `.aistory`, `.aitranslate`, `.aitone`, `.aiformal`,
  `.aicausal`, `.aiurdu`, `.aienglish`, `.airoman` — sab ab paid chain use karte hain
- `.aistatus` — live engine status
- `.aimodel` — kaunsa model active hai

---

## 2. `.mode public` / `.mode private`

Naya module: `server/wa/mode.js` (Mongo `wa_settings.mode`, process cache ke sath).

| Mode | Matlab |
|------|--------|
| **public** (default) | Har WhatsApp user har command chala sakta hai |
| **private** | Sirf owner commands chala sakta hai, baqi sab **chupchap ignore** |

**Owner kaun?**
1. `OWNER_NUMBER` = `923106762478`
2. Bot ka apna account (self-chat)
3. Bot ka LID

`.mode` command khud **hamesha** reachable hai, taake owner kahin se bhi wapas
public kar sake. Ghair-owner `.mode` likhe to sirf "Sirf owner mode badal sakta hai"
milta hai — mode change nahi hota.

### Commands
```
.mode              → current mode dikhata hai
.mode public       → sab ke liye khol do
.mode private      → sirf owner
```
Aliases: `.public`, `.private`

### Live proof
```
after private:  mode= private
after public:   mode= public
```
Mode Mongo mein save hota hai — redeploy ke baad bhi rehta hai.

---

## 3. Tests

`test-selfchat.js` — **17/17 pass**

```
PASS  self-chat .ping answered
PASS  reply is Pong
PASS  bot ignores its own message (no loop)
PASS  no-prefix text ignored
PASS  .menu returns list (image + caption)
PASS  .calc computes 100
PASS  .alive responds
PASS  duplicate message id handled once
PASS  DM from another user answered
PASS  own outbound to a friend ignored
PASS  stale history message ignored
PASS  .mode shows PUBLIC by default
PASS  private mode blocks other users
PASS  private mode still allows owner (self-chat)
PASS  non-owner cannot change mode
PASS  owner switches back to PUBLIC
PASS  public mode re-opens for everyone
```

---

## 4. Production selftest

```json
{
  "ok": true,
  "status": "connected",
  "connected": true,
  "commandHandlerAttached": true,
  "commandsLoaded": 2126,
  "selfChatReady": true,
  "aiAgentAttached": true,
  "aiAgentOn": false,
  "alwaysOnline": true,
  "autoRead": false,
  "mode": "public",
  "ownerNumber": "923106762478",
  "aiEngines": {
    "deepseek": true,
    "gemini": true,
    "openai": true,
    "pollinations": true,
    "healthy": ["gemini", "deepseek", "openai", "pollinations"]
  },
  "me": { "id": "923067846267:21@s.whatsapp.net", "name": "Saqiib" }
}
```

Live commands injected: `.mode`, `.aistatus`, `.ai Salam, tum kaun ho?`
→ **3 × `command handled`**, koi error nahi.

---

## 5. Railway env vars set

```
GEMINI_API_KEY      = AQ.Ab8R…FUr-QA
GEMINI_MODEL        = gemini-flash-lite-latest
DEEPSEEK_API_KEY    = sk-d842…69150
DEEPSEEK_MODEL      = deepseek-chat
OPENAI_API_KEY      = sk-proj-…hjAA
OPENAI_MODEL        = gpt-4o-mini
DEFAULT_MODE        = public
OWNER_NUMBER        = 923106762478
ALWAYS_ONLINE       = true
AUTO_READ           = false
```

---

## 6. Files

| File | Kya hua |
|------|---------|
| `server/wa/aiProviders.js` | **Naya** — Gemini/DeepSeek/OpenAI/Pollinations chain + health backoff |
| `server/wa/mode.js` | **Naya** — public/private mode, Mongo persist + cache |
| `server/wa/aiAgent.js` | Provider chain use karta hai |
| `server/wa/commands.js` | Mode gating + proper `isOwner` |
| `server/wa/plugins/main.js` | `.mode` command |
| `server/wa/plugins/ai.js` | Provider chain + real `.aistatus` / `.aimodel` |
| `server/config.js` | Keys, models, `DEFAULT_MODE` |
| `server/routes/quick.js` | Selftest mein `mode`, `ownerNumber`, `aiEngines` |
| `test-selfchat.js` | 6 naye mode tests |
| `.env.example` | Naye vars documented |

---

## 7. Note — DeepSeek & OpenAI balance

Dono keys **valid** hain lekin account mein credit nahi:

- DeepSeek → `402 Insufficient Balance`
- OpenAI → `429 You have no credits remaining`

Balance add karte hi ye automatically chain mein aa jayengi (code change ki
zaroorat nahi). Filhal Gemini sab kuch handle kar raha hai.
