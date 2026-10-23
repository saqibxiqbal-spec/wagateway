/**
 * Command engine for linked WhatsApp sessions.
 *
 * The gateway used to be pairing-only: it held the socket but never listened
 * for incoming messages, so a linked number answered nothing. This module
 * attaches a message handler to every socket and replies to commands.
 *
 * Design notes:
 *  - Prefix is configurable (default "."), also accepts "/" and "!".
 *  - Ignores messages sent by the bot itself so it can never loop.
 *  - Every reply is wrapped so one failing command can't kill the socket.
 *  - Works in DMs and groups. Group commands need the bot to be mentioned
 *    only for the heavy ones (tagall), normal commands work anywhere.
 */

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
    main: '📋 MAIN',
    general: '💬 GENERAL',
    tools: '🛠️ TOOLS',
    group: '👥 GROUP',
    owner: '👑 OWNER',
  };
  let out = `╭━━━〔 *${BOT_NAME}* 〕━━━╮\n`;
  out += `┃ 🤖 Bot: *Online*\n`;
  out += `┃ ⏱️ Uptime: ${humanUptime(Date.now() - startedAt)}\n`;
  out += `┃ 🔧 Prefix: . / ! #\n`;
  out += `╰━━━━━━━━━━━━━━━━━━╯\n`;
  for (const key of order) {
    if (!groups[key]) continue;
    out += `\n*${titles[key]}*\n`;
    const names = [...new Set(groups[key])].sort();
    for (const n of names) {
      out += `• .${n} — ${commands.get(n).desc}\n`;
    }
  }
  out += `\n_Total ${commands.size} commands_`;
  return out;
});

cmd(['ping', 'speed'], { category: 'main', desc: 'Bot ki speed check karein' }, async (ctx) => {
  const t = Date.now();
  await ctx.reply('🏓 Pinging...');
  return `🏓 *Pong!*\n⚡ Speed: *${Date.now() - t} ms*`;
});

cmd(['alive', 'active', 'online'], { category: 'main', desc: 'Bot zinda hai ya nahi' }, async () => {
  return (
    `✅ *${BOT_NAME} is ALIVE*\n\n` +
    `⏱️ Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `💾 Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
    `🟢 Status: Connected\n` +
    `📅 ${new Date().toUTCString()}`
  );
});

cmd(['uptime', 'runtime'], { category: 'main', desc: 'Bot kitni der se chal raha hai' }, async () => {
  return `⏱️ *Uptime:* ${humanUptime(Date.now() - startedAt)}`;
});

cmd(['id', 'myid', 'jid'], { category: 'general', desc: 'Aapki WhatsApp ID' }, async (ctx) => {
  return `🆔 *Your ID*\n\n👤 You: \`${ctx.sender}\`\n💬 Chat: \`${ctx.chat}\`\n🤖 Bot: \`${ctx.botJid}\``;
});

cmd(['owner', 'creator', 'dev'], { category: 'owner', desc: 'Bot owner ki info' }, async () => {
  return `👑 *Owner*\n\n📛 Name: Saqib\n🤖 Bot: ${BOT_NAME}\n🌐 Host: Railway`;
});

cmd(['info', 'bot', 'about'], { category: 'main', desc: 'Bot ki tafseel' }, async () => {
  return (
    `🤖 *${BOT_NAME}*\n\n` +
    `📦 Engine: Baileys Multi-Device\n` +
    `⚙️ Node: ${process.version}\n` +
    `🖥️ Platform: ${process.platform}\n` +
    `⏱️ Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `🔧 Commands: ${commands.size}`
  );
});

cmd(['time'], { category: 'tools', desc: 'Abhi ka waqt' }, async () => {
  return `🕐 *Time:* ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi' })} (PKT)\n📅 *Date:* ${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi' })}`;
});

cmd(['date'], { category: 'tools', desc: 'Aaj ki tareekh' }, async () => {
  return `📅 *Date:* ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
});

cmd(['echo', 'say'], { category: 'tools', desc: '.echo <text> — text repeat' }, async (ctx) => {
  if (!ctx.args.length) return '❌ Misal: .echo Hello world';
  return ctx.args.join(' ');
});

cmd(['calc', 'math'], { category: 'tools', desc: '.calc 2+2 — hisaab' }, async (ctx) => {
  const expr = ctx.args.join(' ');
  if (!expr) return '❌ Misal: .calc 25*4';
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) return '❌ Sirf numbers aur + - * / ( ) allowed hain.';
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict";return (${expr})`)();
    return `🧮 *${expr}* = *${val}*`;
  } catch {
    return '❌ Expression theek nahi hai.';
  }
});

cmd(['joke', 'fun'], { category: 'general', desc: 'Random joke' }, async () => {
  const jokes = [
    'Teacher: Tumhein sabse zyada kya pasand hai?\nStudent: Homework nahi karna. 😄',
    'Doctor: Aapko din mein 3 baar dawa lena hai.\nPatient: Subah, dopahar, shaam?\nDoctor: Nahi, breakfast, lunch, dinner. 😂',
    'WiFi aur rishtedar dono ek jaise hote hain — signal kamzor, demand zyada. 📶',
    'Mera phone 100% charged hai, bas meri himmat 2% reh gayi hai. 🔋',
  ];
  return '😄 ' + jokes[Math.floor(Math.random() * jokes.length)];
});

cmd(['quote', 'hadith'], { category: 'general', desc: 'Random quote' }, async () => {
  const q = [
    'Mehnat itni khamoshi se karo ke kamyabi shor macha de. 💪',
    'Jo aaj taklif uthata hai, woh kal rahat paata hai. 🌱',
    'Sabr ka phal meetha hota hai. 🍯',
    'Ilm hasil karo, kyunke ilm roshni hai. 📚',
  ];
  return '✨ ' + q[Math.floor(Math.random() * q.length)];
});

cmd(['status', 'session'], { category: 'main', desc: 'Session ki health' }, async (ctx) => {
  return (
    `📊 *Session Status*\n\n` +
    `✅ Connection: Online\n` +
    `🆔 Number: ${jidToNumber(ctx.botJid)}\n` +
    `⏱️ Uptime: ${humanUptime(Date.now() - startedAt)}\n` +
    `💾 Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
    `🔧 Commands: ${commands.size}`
  );
});

cmd(['groupid', 'gid'], { category: 'group', desc: 'Group ki ID' }, async (ctx) => {
  if (!ctx.isGroup) return '❌ Ye command sirf group mein chalti hai.';
  return `👥 *Group ID*\n\n\`${ctx.chat}\``;
});

cmd(['tagall', 'everyone', 'all'], { category: 'group', desc: 'Group ke sab members ko tag karein' }, async (ctx) => {
  if (!ctx.isGroup) return '❌ Sirf group mein.';
  if (!ctx.groupMetadata) return '❌ Group info nahi mili.';
  const members = ctx.groupMetadata.participants || [];
  const text = ctx.args.join(' ') || 'Attention please!';
  let msg = `📢 *${text}*\n\n`;
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
  if (!quoted) return '❌ Kisi view-once media par reply karke .vv likhein.';
  const m = quoted.message || {};
  const media =
    m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage;
  if (!media) return '❌ Quoted message mein media nahi hai.';
  try {
    const buf = await ctx.sock.downloadMediaMessage(quoted);
    const kind = m.imageMessage ? 'image' : m.videoMessage ? 'video' : m.audioMessage ? 'audio' : 'document';
    await ctx.sock.sendMessage(ctx.chat, { [kind]: buf, caption: media.caption || '' });
    return null;
  } catch (e) {
    return '❌ Media download fail: ' + e.message;
  }
});

cmd(['save', 'download'], { category: 'tools', desc: 'Quoted media save karein' }, async (ctx) => {
  return '💾 Media save karne ke liye quoted media par reply karke .vv try karein.';
});

cmd(['report', 'bug'], { category: 'general', desc: 'Bug report' }, async () => {
  return '🐞 Bug mila? Owner ko batayein: .owner';
});

cmd(['hi', 'hello', 'salam'], { category: 'general', desc: 'Greeting' }, async (ctx) => {
  const name = ctx.pushName || 'friend';
  return `👋 Salam *${name}*!\n\nMain *${BOT_NAME}* hoon. \`.menu\` likhein poori list ke liye.`;
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

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const raw of messages || []) {
      try {
        if (!raw?.message) continue;
        if (raw.key?.fromMe) continue; // never answer ourselves

        const chat = raw.key.remoteJid;
        if (!chat) continue;
        if (chat === 'status@broadcast') continue;

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
                fromMe: ctxInfo.participant === jidToNumber(sock.user?.id) + '@s.whatsapp.net',
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
          reply: (t) => sock.sendMessage(chat, { text: t }, { quoted: raw }),
        };

        const started = Date.now();
        const out = await entry.run(ctx);
        if (out) {
          await sock.sendMessage(chat, { text: out }, { quoted: raw });
        }
        log.info?.(
          { sessionId, cmd: name, ms: Date.now() - started },
          'command handled'
        );
        opts.onEvent?.({ type: 'command', cmd: name, chat });
      } catch (err) {
        log.warn?.({ err: err.message, cmd: 'unknown' }, 'command failed');
        try {
          await sock.sendMessage(
            raw.key.remoteJid,
            { text: '❌ Command mein error aaya. Dobara try karein.' },
            { quoted: raw }
          );
        } catch {
          /* socket may be closed */
        }
      }
    }
  });

  return () => {
    try {
      sock.ev.removeAllListeners('messages.upsert');
    } catch {
      /* ignore */
    }
  };
}

module.exports = { attachCommands, commands, PREFIXES };
