/**
 * Command engine for linked WhatsApp sessions.
 *
 * The gateway used to be pairing-only: it held the socket but never listened
 * for incoming messages, so a linked number answered nothing. This module
 * attaches a message handler to every socket and replies to commands.
 *
 * Commands themselves live in ./plugins/* and are registered into ./registry.
 * This file only parses, gates and dispatches them.
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

const registry = require('./plugins');

const PREFIXES = registry.PREFIXES;
const BOT_NAME = registry.BOT_NAME;

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

/* -------------------------------------------------------------- gating */

/** Numbers that may run owner-only commands (comma separated env var). */
function ownerNumbers() {
  return String(process.env.OWNER_NUMBERS || process.env.OWNER || '')
    .split(',')
    .map((n) => n.replace(/[^0-9]/g, ''))
    .filter(Boolean);
}

function isOwnerNumber(num) {
  const owners = ownerNumbers();
  if (!owners.length) return true; // no owner configured -> don't lock the bot
  return owners.includes(String(num || ''));
}

/** Is `participant` an admin in this group? */
function participantIsAdmin(groupMetadata, participant) {
  if (!groupMetadata?.participants) return false;
  const target = jidToNumber(participant);
  return groupMetadata.participants.some(
    (p) =>
      jidToNumber(p.id) === target &&
      (p.admin === 'admin' || p.admin === 'superadmin')
  );
}

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

        const botPn = jidToNumber(sock.user?.id);
        const botLid = jidToNumber(sock.user?.lid);
        const chatNumber = jidToNumber(chat);
        const altNumber = jidToNumber(raw.key.remoteJidAlt);
        // Modern WhatsApp addresses the same account by two ids: the phone
        // number JID and a LID. A "Message yourself" chat can arrive as either
        // one, so both must count as self-chat or the bot stays silent.
        const isSelfChat = Boolean(
          (botPn && (chatNumber === botPn || altNumber === botPn)) ||
            (botLid && (chatNumber === botLid || altNumber === botLid))
        );

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
        const entry = registry.get(name);
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

        const senderJid = isGroup ? raw.key.participant : chat;
        const senderNumber = jidToNumber(senderJid);

        // ---- permission gates -------------------------------------------
        if (entry.group && !isGroup) continue;
        if (entry.owner && !isOwnerNumber(senderNumber)) {
          await sock.sendMessage(
            chat,
            { text: '\u{1F512} Ye command sirf bot owner ke liye hai.' },
            { quoted: raw }
          );
          continue;
        }
        if (entry.admin && isGroup && !participantIsAdmin(groupMetadata, senderJid)) {
          await sock.sendMessage(
            chat,
            { text: '\u{1F512} Ye command sirf group admin ke liye hai.' },
            { quoted: raw }
          );
          continue;
        }

        const ctxInfo = getContextInfo(raw.message);
        const quoted = ctxInfo?.quotedMessage
          ? {
              key: {
                remoteJid: chat,
                fromMe: ctxInfo.participant
                  ? [botPn, botLid].includes(jidToNumber(ctxInfo.participant))
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
          arg: args.join(' '),
          sender: senderJid,
          senderNumber,
          pushName: raw.pushName || '',
          botJid: sock.user?.id || '',
          sessionId,
          command: entry.name,
          isOwner: isOwnerNumber(senderNumber),
          isAdmin: isGroup && participantIsAdmin(groupMetadata, senderJid),
          logger: log,
          reply: (t) => sock.sendMessage(chat, { text: t }, { quoted: raw }),
        };

        const started = Date.now();
        const out = await entry.run(ctx);
        if (out) {
          await sock.sendMessage(chat, { text: String(out) }, { quoted: raw });
        }
        log.info?.(
          { sessionId, cmd: entry.name, ms: Date.now() - started, self: isSelfChat },
          'command handled'
        );
        opts.onEvent?.({ type: 'command', cmd: entry.name, chat, self: isSelfChat });
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

module.exports = {
  attachCommands,
  commands: registry.commands,
  registry,
  PREFIXES,
  BOT_NAME,
  jidToNumber,
  humanUptime,
  startedAt,
};
