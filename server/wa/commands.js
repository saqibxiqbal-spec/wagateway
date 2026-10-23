/**
 * Command engine for linked WhatsApp sessions.
 *
 * The gateway used to be pairing-only: it held the socket but never listened
 * for incoming messages, so a linked number answered nothing. This module
 * attaches a message handler to every socket and replies to commands.
 *
 * Design notes:
 *  - Prefix is configurable (default "."), also accepts "/" and "!".
 *  - SELF-CHAT SUPPORT: a linked device receives its own messages with
 *    `key.fromMe = true`. The public page tells users to type commands in the
 *    "Message yourself" chat, so those messages MUST be processed. We keep a
 *    bounded set of message ids the bot itself sent and skip only those, which
 *    makes self-chat work without ever creating a reply loop.
 *  - Every reply is wrapped so one failing command can't kill the socket.
 *  - Works in DMs and groups.
 */

const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const PREFIXES = ['.', '/', '!', '#'];
const BOT_NAME = 'SAQIB MD';

const startedAt = Date.now();

/* ------------------------------------------------------------------ utils */

function jidToNumber(jid = '') {
  return String(jid).split('@')[0].split(':')[0];
}

function humanUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function extractText(msg) {
  if (!msg) return '';
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    msg.buttonsResponseMessage?.selectedButtonId ||
    msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg.templateButtonReplyMessage?.selectedId ||
    ''
  ).trim();
}

function getContextInfo(msg) {
  if (!msg) return null;
  return (
    msg.extendedTextMessage?.contextInfo ||
    msg.imageMessage?.contextInfo ||
    msg.videoMessage?.contextInfo ||
    msg.documentMessage?.contextInfo ||
    msg.audioMessage?.contextInfo ||
    msg.stickerMessage?.contextInfo ||
    null
  );
}

/** Bounded FIFO set — remembers which messages the bot sent / already handled. */
class IdSet {
  constructor(max = 400) {
    this.max = max;
    this.set = new Set();
  }
  add(id) {
    if (!id) return;
    this.set.add(id);
    if (this.set.size > this.max) {
      const first = this.set.values().next().value;
      this.set.delete(first);
    }
  }
  has(id) {
    return this.set.has(id);
  }
}

/* --------------------------------------------------------------- commands */

const commands = new Map();

function cmd(name, meta, run) {
  for (const n of [].concat(name)) commands.set(n, { ...meta, run });
}

cmd(['menu', 'help', 'commands', 'list'], {
  category: 'main',
  desc: 'Poori command list dikhata hai',
}, async () => {
  const groups = {};
  for (const [name, c] of commands) {
    if (c.hidden) continue;
    (groups[c.category] = groups[c.category] || []).push(name);
  }
  const order = ['main', 'general', 'tools', 'group', 'owner'];
  const titles = {
    main: '\ud83d\udccb MAIN',
    general: '\ud83d\udcac GENERAL',
    tools: '\ud83d\udee0\ufe0f TOOLS',
    group: '\ud83d\udc65 GROUP',
    owner: '\ud83d\udc51 OWNER',
  };
  let out = `\u256d\u2501\u2501\u2501\u3014 *${BOT_NAME}* \u3015\u2501\u2501\u2501\u256e\n`;
  out += `\u2503 \ud83e\udd16 Bot: *Online*\n`;
  out += `\u2503 \u23f1\ufe0f Uptime: ${humanUptime(Date.now() - startedAt)}\n`;
  out += `\u2503 \ud83d\udd27 Prefix: . / ! #\n`;
  out += `\u2570\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u256f\n`;
  for (const key of order) {
    if (!groups[key]) continue;
    out += `\n*${titles[key]}*\n`;
    const names = [...new Set(groups[key])].sort();
    for (const n of names) {
      out += `\u2022 .${n} \u2014 ${commands.get(n).desc}\n`;
    }
  }
  out += `\n_Total ${commands.size} commands_`;
  return out;
});

cmd(['ping', 'speed'], { category: 'main', desc: 'Bot ki speed check karein' }, async (ctx) => {
  const t = Date.now();
  await ctx.reply('\ud83c\udfd3 Pinging...');
  return `\ud83c\udfd3 *Pong!*\n\u26a1 Speed: *${Date.now() - t} ms*`;
});

cmd(['alive', 'active', 'online'], { category: 'main', desc: 'Bot zinda hai ya nahi' }, async () => {
  return (
    `\u2705 *${BOT_NAME} is ALIVE*\n\n` +
    `\u23f1\ufe0f Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `\ud83d\udcbe Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
    `\ud83d\udfe2 Status: Connected\n` +
    `\ud83d\udcc5 ${new Date().toUTCString()}`
  );
});

cmd(['uptime', 'runtime'], { category: 'main', desc: 'Bot kitni der se chal raha hai' }, async () => {
  return `\u23f1\ufe0f *Uptime:* ${humanUptime(Date.now() - startedAt)}`;
});

cmd(['id', 'myid', 'jid'], { category: 'general', desc: 'Aapki WhatsApp ID' }, async (ctx) => {
  return `\ud83c\udd94 *Your ID*\n\n\ud83d\udc64 You: \`${ctx.sender}\`\n\ud83d\udcac Chat: \`${ctx.chat}\`\n\ud83e\udd16 Bot: \`${ctx.botJid}\``;
});

cmd(['owner', 'creator', 'dev'], { category: 'owner', desc: 'Bot owner ki info' }, async () => {
  return `\ud83d\udc51 *Owner*\n\n\ud83d\udcdb Name: Saqib\n\ud83e\udd16 Bot: ${BOT_NAME}\n\ud83c\udf10 Host: Railway`;
});

cmd(['info', 'bot', 'about'], { category: 'main', desc: 'Bot ki tafseel' }, async () => {
  return (
    `\ud83e\udd16 *${BOT_NAME}*\n\n` +
    `\ud83d\udce6 Engine: Baileys Multi-Device\n` +
    `\u2699\ufe0f Node: ${process.version}\n` +
    `\ud83d\udda5\ufe0f Platform: ${process.platform}\n` +
    `\u23f1\ufe0f Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `\ud83d\udd27 Commands: ${commands.size}`
  );
});

cmd(['time'], { category: 'tools', desc: 'Abhi ka waqt' }, async () => {
  return `\ud83d\udd50 *Time:* ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi' })} (PKT)\n\ud83d\udcc5 *Date:* ${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' })}`;
});

cmd(['date'], { category: 'tools', desc: 'Aaj ki tareekh' }, async () => {
  return `\ud83d\udcc5 *Date:* ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
});

cmd(['echo', 'say'], { category: 'tools', desc: '.echo <text> \u2014 text repeat' }, async (ctx) => {
  if (!ctx.args.length) return '\u274c Misal: .echo Hello world';
  return ctx.args.join(' ');
});

cmd(['calc', 'math'], { category: 'tools', desc: '.calc 2+2 \u2014 hisaab' }, async (ctx) => {
  const expr = ctx.args.join(' ');
  if (!expr) return '\u274c Misal: .calc 25*4';
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) return '\u274c Sirf numbers aur + - * / ( ) allowed hain.';
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict";return (${expr})`)();
    return `\ud83e\uddee *${expr}* = *${val}*`;
  } catch {
    return '\u274c Expression theek nahi hai.';
  }
});

cmd(['joke', 'fun'], { category: 'general', desc: 'Random joke' }, async () => {
  const jokes = [
    'Teacher: Tumhein sabse zyada kya pasand hai?\nStudent: Homework nahi karna. \ud83d\ude04',
    'Doctor: Aapko din mein 3 baar dawa lena hai.\nPatient: Subah, dopahar, shaam?\nDoctor: Nahi, breakfast, lunch, dinner. \ud83d\ude02',
    'WiFi aur rishtedar dono ek jaise hote hain \u2014 signal kamzor, demand zyada. \ud83d\udcf6',
    'Mera phone 100% charged hai, bas meri himmat 2% reh gayi hai. \ud83d\udd0b',
  ];
  return '\ud83d\ude04 ' + jokes[Math.floor(Math.random() * jokes.length)];
});

cmd(['quote', 'hadith'], { category: 'general', desc: 'Random quote' }, async () => {
  const q = [
    'Mehnat itni khamoshi se karo ke kamyabi shor macha de. \ud83d\udcaa',
    'Jo aaj taklif uthata hai, woh kal rahat paata hai. \ud83c\udf31',
    'Sabr ka phal meetha hota hai. \ud83c\udf6f',
    'Ilm hasil karo, kyunke ilm roshni hai. \ud83d\udcda',
  ];
  return '\u2728 ' + q[Math.floor(Math.random() * q.length)];
});

cmd(['status', 'session'], { category: 'main', desc: 'Session ki health' }, async (ctx) => {
  return (
    `\ud83d\udcca *Session Status*\n\n` +
    `\u2705 Connection: Online\n` +
    `\ud83c\udd94 Number: ${jidToNumber(ctx.botJid)}\n` +
    `\u23f1\ufe0f Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `\ud83d\udcbe Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
    `\ud83d\udd27 Commands: ${commands.size}`
  );
});

cmd(['groupid', 'gid'], { category: 'group', desc: 'Group ki ID' }, async (ctx) => {
  if (!ctx.isGroup) return '\u274c Ye command sirf group mein chalti hai.';
  return `\ud83d\udc65 *Group ID*\n\n\`${ctx.chat}\``;
});

cmd(['tagall', 'everyone', 'all'], { category: 'group', desc: 'Group ke sab members ko tag karein' }, async (ctx) => {
  if (!ctx.isGroup) return '\u274c Sirf group mein.';
  if (!ctx.groupMetadata) return '\u274c Group info nahi mili.';
  const members = ctx.groupMetadata.participants || [];
  const text = ctx.args.join(' ') || 'Attention please!';
  let msg = `\ud83d\udce2 *${text}*\n\n`;
  const mentions = [];
  for (const p of members) {
    const id = p.id || p.jid;
    if (!id) continue;
    mentions.push(id);
    msg += `@${jidToNumber(id)}\n`;
  }
  await ctx.sock.sendMessage(ctx.chat, { text: msg, mentions });
  return null;
});

cmd(['vv', 'viewonce', 'reveal'], { category: 'tools', desc: 'View-once media dobara bhejein (reply karein)' }, async (ctx) => {
  const quoted = ctx.quoted;
  if (!quoted) return '\u274c Kisi view-once media par reply karke .vv likhein.';
  const m = quoted.message || {};
  const media =
    m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage;
  if (!media) return '\u274c Quoted message mein media nahi hai.';
  try {
    // Baileys 7 exports downloadMediaMessage as a standalone helper; the
    // socket no longer carries a `downloadMediaMessage` method.
    const buf = await downloadMediaMessage(
      quoted,
      'buffer',
      {},
      { logger: ctx.logger || undefined, reuploadRequest: ctx.sock.updateMediaMessage }
    );
    const kind = m.imageMessage ? 'image' : m.videoMessage ? 'video' : m.audioMessage ? 'audio' : 'document';
    await ctx.sock.sendMessage(ctx.chat, { [kind]: buf, caption: media.caption || '' });
    return null;
  } catch (e) {
    return '\u274c Media download fail: ' + e.message;
  }
});

cmd(['save', 'download'], { category: 'tools', desc: 'Quoted media save karein' }, async () => {
  return '\ud83d\udcbe Media save karne ke liye quoted media par reply karke .vv try karein.';
});

cmd(['report', 'bug'], { category: 'general', desc: 'Bug report' }, async () => {
  return '\ud83d\udc1e Bug mila? Owner ko batayein: .owner';
});

cmd(['hi', 'hello', 'salam'], { category: 'general', desc: 'Greeting' }, async (ctx) => {
  const name = ctx.pushName || 'friend';
  return `\ud83d\udc4b Salam *${name}*!\n\nMain *${BOT_NAME}* hoon. \`.menu\` likhein poori list ke liye.`;
});

/* ------------------------------------------------------------- dispatcher */

/**
 * Attach the command handler to a live socket.
 * @param {object} sock Baileys socket
 * @param {object} opts { sessionId, number, logger, onEvent }
 */
function attachCommands(sock, opts = {}) {
  const { logger, sessionId } = opts;
  const log = logger || console;

  // Message ids the bot itself produced — used to break the self-chat loop.
  const sentIds = new IdSet(500);
  const seenIds = new IdSet(800);

  // Every outbound message is recorded so the self-chat handler can ignore it.
  const origSend = sock.sendMessage.bind(sock);
  sock.sendMessage = async (...args) => {
    const res = await origSend(...args);
    try {
      if (res?.key?.id) sentIds.add(res.key.id);
    } catch {
      /* ignore */
    }
    return res;
  };

  const handler = async ({ messages, type }) => {
    // "notify" = fresh live message. "append" is history/offline sync, but a
    // linked device also receives its own self-chat sends as "append", so we
    // accept that one only for very recent self-chat messages.
    if (type !== 'notify' && type !== 'append') return;

    for (const raw of messages || []) {
      try {
        if (!raw?.message) continue;
        if (!raw.key?.id) continue;
        if (seenIds.has(raw.key.id)) continue;
        seenIds.add(raw.key.id);

        const chat = raw.key.remoteJid;
        if (!chat) continue;
        if (chat === 'status@broadcast') continue;

        const botNumber = jidToNumber(sock.user?.id);
        const chatNumber = jidToNumber(chat);
        const isSelfChat = Boolean(botNumber) && chatNumber === botNumber;

        // --- the fix that makes the bot actually answer -------------------
        // Previously every `fromMe` message was dropped, which silently broke
        // the "Message yourself" flow the landing page instructs users to use.
        // We now process `fromMe` messages only in the self-chat and only when
        // the bot did not send them itself.
        if (raw.key.fromMe) {
          if (!isSelfChat) continue;
          if (sentIds.has(raw.key.id)) continue;
        }

        // Ignore ancient messages replayed by history sync.
        const ts = Number(raw.messageTimestamp || 0) * 1000;
        if (type === 'append' && ts && Date.now() - ts > 120_000) continue;

        const text = extractText(raw.message);
        if (!text) continue;

        const prefix = text[0];
        if (!PREFIXES.includes(prefix)) continue;

        const body = text.slice(1).trim();
        if (!body) continue;

        const [nameRaw, ...args] = body.split(/\s+/);
        const name = nameRaw.toLowerCase();
        const entry = commands.get(name);
        if (!entry) continue;

        const isGroup = chat.endsWith('@g.us');
        let groupMetadata = null;
        if (isGroup) {
          try {
            groupMetadata = await sock.groupMetadata(chat);
          } catch {
            /* ignore */
          }
        }

        const ctxInfo = getContextInfo(raw.message);
        const quoted = ctxInfo?.quotedMessage
          ? {
              key: {
                remoteJid: chat,
                fromMe: ctxInfo.participant
                  ? jidToNumber(ctxInfo.participant) === botNumber
                  : false,
                id: ctxInfo.stanzaId,
                participant: ctxInfo.participant,
              },
              message: ctxInfo.quotedMessage,
            }
          : null;

        const ctx = {
          sock,
          raw,
          chat,
          isGroup,
          groupMetadata,
          quoted,
          args,
          text: body,
          sender: isGroup ? raw.key.participant : chat,
          pushName: raw.pushName || '',
          botJid: sock.user?.id || '',
          sessionId,
          logger: log,
          reply: (t) => sock.sendMessage(chat, { text: t }, { quoted: raw }),
        };

        const started = Date.now();
        const out = await entry.run(ctx);
        if (out) {
          await sock.sendMessage(chat, { text: out }, { quoted: raw });
        }
        log.info?.(
          { sessionId, cmd: name, ms: Date.now() - started, self: isSelfChat },
          'command handled'
        );
        opts.onEvent?.({ type: 'command', cmd: name, chat, self: isSelfChat });
      } catch (err) {
        log.warn?.({ err: err.message }, 'command failed');
        try {
          await sock.sendMessage(
            raw.key.remoteJid,
            { text: '\u274c Command mein error aaya. Dobara try karein.' },
            { quoted: raw }
          );
        } catch {
          /* socket may be closed */
        }
      }
    }
  };

  sock.ev.on('messages.upsert', handler);

  return () => {
    try {
      sock.ev.removeListener('messages.upsert', handler);
    } catch {
      /* ignore */
    }
  };
}

module.exports = { attachCommands, commands, PREFIXES, jidToNumber };
