/**
 * Command engine for linked WhatsApp sessions.
 *
 * Commands live in ./plugins/* and are registered into ./registry. This file
 * only parses, dispatches and guards them.
 *
 * Rules (Round 4):
 *  - EVERY command is available to EVERY user. No owner/admin gating.
 *  - A command can never crash the socket: every failure is converted to a
 *    human-readable message (see friendlyError).
 *  - groupMetadata is fetched lazily, only for commands that need it. That
 *    alone removed ~200-600ms from every group command.
 *  - A plugin may return either a string, or `{ text, image, caption }` so a
 *    command can send a picture with its caption (used by `.menu`).
 *  - Self-chat works (LID + PN aware), replies never loop.
 */

const registry = require('./plugins');
const { friendlyError } = require('./plugins/_util');
const config = require('../config');

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

/** Categories whose commands genuinely need group metadata. */
const NEEDS_GROUP_META = new Set(['group', 'admin']);

/* ------------------------------------------------------------- dispatcher */

/**
 * Attach the command handler to a live socket.
 * @param {object} sock Baileys socket
 * @param {object} opts { sessionId, number, logger, onEvent }
 */
function attachCommands(sock, opts = {}) {
  const { logger, sessionId } = opts;
  const log = logger || console;

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
        // A "Message yourself" chat can arrive as either the PN or the LID.
        const isSelfChat = Boolean(
          (botPn && (chatNumber === botPn || altNumber === botPn)) ||
            (botLid && (chatNumber === botLid || altNumber === botLid))
        );

        if (raw.key.fromMe) {
          if (!isSelfChat) continue;
          if (sentIds.has(raw.key.id)) continue;
        }

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
        const senderJid = isGroup ? raw.key.participant : chat;
        const senderNumber = jidToNumber(senderJid);

        // Lazy group metadata — only when the command actually needs it.
        let groupMetadata = null;
        if (isGroup && (entry.group || entry.admin || NEEDS_GROUP_META.has(entry.category))) {
          try {
            groupMetadata = await sock.groupMetadata(chat);
          } catch {
            /* non-fatal */
          }
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
          isOwner: senderNumber === config.OWNER_NUMBER,
          isAdmin: false,
          logger: log,
          reply: (t) => sock.sendMessage(chat, { text: t }, { quoted: raw }),
        };

        const started = Date.now();
        let out;
        try {
          out = await entry.run(ctx);
        } catch (err) {
          log.warn?.({ err: err.message, cmd: entry.name }, 'command threw');
          out = friendlyError(err);
        }

        if (out) {
          // Plugins may return { text, image, caption } to send media.
          if (typeof out === 'object') {
            const caption = out.caption || out.text || '';
            if (out.image) {
              try {
                await sock.sendMessage(chat, { image: out.image, caption }, { quoted: raw });
              } catch {
                // Image failed (bad buffer / too big) — never lose the text.
                if (caption) await sock.sendMessage(chat, { text: caption }, { quoted: raw });
              }
            } else if (caption) {
              await sock.sendMessage(chat, { text: String(caption) }, { quoted: raw });
            }
          } else {
            await sock.sendMessage(chat, { text: String(out) }, { quoted: raw });
          }
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
            { text: friendlyError(err) },
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
