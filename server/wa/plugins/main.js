/** MAIN category: menu, ping, alive, info, status, uptime, speed. */

const {
  BOT_NAME,
  PREFIXES,
  categoryList,
  byCategory,
  totalCommands,
  totalNames,
} = require('../registry');
const { humanUptime, jidToNumber } = require('./_util');

const LINE = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

function header(subtitle) {
  return (
    `\u256d${LINE.slice(0, 17)}\u256e\n` +
    `\u2503 \ud83e\udd16 *${BOT_NAME}*${subtitle ? '\n\u2503 ' + subtitle : ''}\n` +
    `\u2570${LINE.slice(0, 17)}\u256f`
  );
}

function overview() {
  const cats = categoryList();
  let out = header('\ud83d\udcca Command Menu');
  out += `\n\n\u23f1\ufe0f Uptime: *${humanUptime()}*\n`;
  out += `\ud83d\udd27 Total: *${totalNames()}* commands\n`;
  out += `\u2702\ufe0f Prefix: ${PREFIXES.join(' ')}\n`;
  out += `\n*CATEGORIES*  \u2014  \`.menu <name>\`\n`;
  for (const c of cats) {
    const n = byCategory(c.key).length;
    if (!n) continue;
    out += `${c.emoji} \`.menu ${c.key}\` \u2014 ${c.title} (${n})\n`;
  }
  out += `\n_Tip: \`.menu all\` se poori list_`;
  return out;
}

function categoryMenu(key) {
  const cat = categoryList().find((c) => c.key === key);
  if (!cat) return null;
  const list = byCategory(key).sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) return null;

  let out = `${cat.emoji} *${cat.title}* \u2014 ${list.length} commands\n${LINE.slice(0, 14)}\n`;
  for (const e of list) {
    out += `\u2022 \`.${e.name}\` \u2014 ${e.desc || 'no description'}\n`;
  }
  out += `\n_Total in this category: ${list.length}_`;
  return out;
}

function allMenu() {
  const cats = categoryList();
  const chunks = [];
  let cur = `\ud83d\udcda *ALL COMMANDS (${totalNames()})*\n`;
  for (const c of cats) {
    const list = byCategory(c.key).sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) continue;
    let block = `\n${c.emoji} *${c.title}* (${list.length})\n`;
    block += list.map((e) => `\u2022 .${e.name}`).join('  ');
    block += '\n';
    if (cur.length + block.length > 3500) {
      chunks.push(cur);
      cur = '';
    }
    cur += block;
  }
  if (cur) chunks.push(cur);
  return chunks;
}

module.exports = (def) => {
  def({
    name: ['menu', 'help', 'commands', 'list', 'cmd'],
    category: 'main',
    desc: 'Command list (category ke sath)',
    usage: '.menu | .menu tools | .menu all',
    run: async (ctx) => {
      const arg = (ctx.args[0] || '').toLowerCase();
      if (arg === 'all' || arg === 'full') {
        const chunks = allMenu();
        for (let i = 1; i < chunks.length; i += 1) {
          await ctx.sock.sendMessage(ctx.chat, { text: chunks[i] });
        }
        return chunks[0];
      }
      if (arg) {
        const m = categoryMenu(arg);
        if (m) return m;
        return `\u274c Category \`${arg}\` nahi mili. \`.menu\` likhein list ke liye.`;
      }
      return overview();
    },
  });

  def({
    name: ['ping', 'speed', 'latency'],
    category: 'main',
    desc: 'Bot ki speed check karein',
    run: async (ctx) => {
      const t = Date.now();
      await ctx.sock.sendMessage(ctx.chat, { text: '\ud83c\udfd3 Pinging\u2026' });
      return `\ud83c\udfd3 *Pong!*\n\u26a1 Speed: *${Date.now() - t} ms*\n\u23f1\ufe0f Uptime: ${humanUptime()}`;
    },
  });

  def({
    name: ['alive', 'active', 'online', 'status'],
    category: 'main',
    desc: 'Bot zinda hai ya nahi',
    run: async () =>
      `\u2705 *${BOT_NAME} is ALIVE*\n\n` +
      `\u23f1\ufe0f Uptime: ${humanUptime()}\n` +
      `\ud83d\udcbe Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
      `\ud83d\udfe2 Status: Connected\n` +
      `\ud83d\udcc5 ${new Date().toUTCString()}`,
  });

  def({
    name: ['uptime', 'runtime', 'up'],
    category: 'main',
    desc: 'Bot kitni der se chal raha hai',
    run: async () => `\u23f1\ufe0f *Uptime:* ${humanUptime()}`,
  });

  def({
    name: ['info', 'bot', 'about', 'botinfo'],
    category: 'main',
    desc: 'Bot ki tafseel',
    run: async (ctx) =>
      `\ud83e\udd16 *${BOT_NAME}*\n\n` +
      `\ud83d\udce6 Engine: Baileys Multi-Device\n` +
      `\u2699\ufe0f Node: ${process.version}\n` +
      `\ud83d\udda5\ufe0f Platform: ${process.platform}\n` +
      `\u23f1\ufe0f Uptime: ${humanUptime()}\n` +
      `\ud83d\udd27 Commands: ${totalNames()}\n` +
      `\ud83c\udd94 Number: ${jidToNumber(ctx.botJid)}`,
  });

  def({
    name: ['myid', 'id', 'jid', 'whoami'],
    category: 'main',
    desc: 'Aapki WhatsApp ID',
    run: async (ctx) =>
      `\ud83c\udd94 *Your ID*\n\n\ud83d\udc64 You: \`${ctx.sender}\`\n\ud83d\udcac Chat: \`${ctx.chat}\`\n\ud83e\udd16 Bot: \`${ctx.botJid}\``,
  });

  def({
    name: ['session', 'sessioninfo', 'health'],
    category: 'main',
    desc: 'Session ki health',
    run: async (ctx) =>
      `\ud83d\udcca *Session Status*\n\n` +
      `\u2705 Connection: Online\n` +
      `\ud83c\udd94 Number: ${jidToNumber(ctx.botJid)}\n` +
      `\u23f1\ufe0f Uptime: ${humanUptime()}\n` +
      `\ud83d\udcbe Memory: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB\n` +
      `\ud83d\udd27 Commands: ${totalNames()}`,
  });

  def({
    name: ['start', 'getstarted', 'guide'],
    category: 'main',
    desc: 'Shuru kaise karein',
    run: async () =>
      `\ud83d\ude80 *Shuru karein*\n\n` +
      `1\ufe0f\u20e3 \`.menu\` \u2014 poori list\n` +
      `2\ufe0f\u20e3 \`.menu tools\` \u2014 category\n` +
      `3\ufe0f\u20e3 \`.ping\` \u2014 speed test\n` +
      `4\ufe0f\u20e3 \`.sticker\` \u2014 image par reply karke\n\n` +
      `Prefix: ${PREFIXES.join(' ')}`,
  });

  def({
    name: ['total', 'count', 'cmdcount'],
    category: 'main',
    desc: 'Kitni commands hain',
    run: async () =>
      `\ud83d\udd22 *Commands*\n\n\u2705 Unique: *${totalCommands()}*\n\ud83d\udd01 With aliases: *${totalNames()}*`,
  });
};
