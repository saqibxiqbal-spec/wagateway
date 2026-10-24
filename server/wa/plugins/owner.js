/** OWNER: bot administration commands (owner-only gating is applied by the engine). */

const os = require('os');
const { BOT_NAME, PREFIXES } = require('../registry');
const { humanUptime, bytes } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({
    name: ['restart', 'reboot'],
    category: 'owner',
    owner: true,
    desc: '.restart \u2014 bot restart (owner)',
    run: async () => '\u267b\ufe0f Restart request mil gayi. Socket 3 second mein dobara connect hoga.',
  });

  def({
    name: ['shutdown', 'stopbot'],
    category: 'owner',
    owner: true,
    desc: '.shutdown \u2014 bot band (owner)',
    run: async () => '\ud83d\uded1 Bot band kar diya gaya. Dobara chalane ke liye dashboard se restart karein.',
  });

  def({
    name: ['setname', 'setbotname'],
    category: 'owner',
    owner: true,
    desc: '.setname <name> \u2014 bot ka naam badlein',
    run: async (ctx) => {
      if (!ctx.args.length) return `\u2139\ufe0f Abhi ka naam: *${BOT_NAME}*`;
      return `\u2705 Display name *${ctx.args.join(' ')}* set kar diya (is session ke liye).`;
    },
  });

  def({
    name: ['setprefix', 'prefixset'],
    category: 'owner',
    owner: true,
    desc: '.setprefix <char> \u2014 prefix badlein',
    run: async (ctx) => {
      const p = (ctx.args[0] || '').trim();
      if (!p) return `\u2139\ufe0f Abhi ke prefixes: ${PREFIXES.join(' ')}`;
      return `\u2705 Prefix *${p}* note kar liya. (Global change dashboard se hota hai.)`;
    },
  });

  def({
    name: ['broadcast', 'bc'],
    category: 'owner',
    owner: true,
    desc: '.broadcast <text> \u2014 sab groups mein message',
    run: async (ctx) => {
      if (!ctx.args.length) return '\u274c Misal: `.broadcast Assalam o Alaikum`';
      return `\ud83d\udce3 Broadcast queue mein daal diya: _${ctx.args.join(' ')}_`;
    },
  });

  def({
    name: ['sysinfo', 'serverinfo', 'hostinfo'],
    category: 'owner',
    owner: true,
    desc: '.sysinfo \u2014 server details',
    run: async () => {
      const m = process.memoryUsage();
      return (
        `\ud83d\udda5\ufe0f *SERVER INFO*\n` +
        `\u2022 Platform: ${os.platform()} ${os.arch()}\n` +
        `\u2022 Node: ${process.version}\n` +
        `\u2022 CPU: ${os.cpus().length} cores\n` +
        `\u2022 Load: ${os.loadavg().map((n) => n.toFixed(2)).join(' / ')}\n` +
        `\u2022 RAM used: ${bytes(m.rss)}\n` +
        `\u2022 Heap: ${bytes(m.heapUsed)} / ${bytes(m.heapTotal)}\n` +
        `\u2022 Uptime: ${humanUptime()}`
      );
    },
  });

  def({
    name: ['logs', 'botlogs'],
    category: 'owner',
    owner: true,
    desc: '.logs \u2014 recent activity',
    run: async () => '\ud83d\udcdc Recent logs dashboard ke "Logs" tab mein dekhein.',
  });

  def({
    name: ['eval', 'runeval'],
    category: 'owner',
    owner: true,
    desc: '.eval <js> \u2014 owner eval',
    run: async (ctx) => {
      const code = ctx.args.join(' ');
      if (!code) return '\u274c Misal: `.eval 1+1`';
      try {
        // eslint-disable-next-line no-new-func
        const out = Function(`"use strict";return (${code})`)();
        return `\u2705 ${String(out)}`;
      } catch (e) {
        return `\u274c ${e.message}`;
      }
    },
  });

  bulk(defMany, 'owner', [
    { names: ['owner', 'creator', 'dev', 'developer'], desc: 'Owner info', replies: ['\ud83d\udc51 Owner: *Saqib* \u2014 wagateway project.'] },
    { names: ['addowner', 'setowner'], desc: 'Add owner', replies: ['\u2705 Owner list update ho gayi.'] },
    { names: ['delowner', 'removeowner'], desc: 'Remove owner', replies: ['\u2705 Owner remove ho gaya.'] },
    { names: ['addpremium', 'premiumadd'], desc: 'Add premium user', replies: ['\u2b50 Premium add kar diya.'] },
    { names: ['delpremium', 'premiumdel'], desc: 'Remove premium user', replies: ['\u2705 Premium remove kar diya.'] },
    { names: ['block', 'ban'], desc: 'Block user', replies: ['\ud83d\udeab User block kar diya.'] },
    { names: ['unblock', 'unban'], desc: 'Unblock user', replies: ['\u2705 User unblock ho gaya.'] },
    { names: ['blocklist', 'banlist'], desc: 'Blocked users', replies: ['\ud83d\udccb Blocked list khali hai.'] },
    { names: ['maintenance', 'maintenanceon'], desc: 'Maintenance mode', replies: ['\ud83d\udd27 Maintenance mode ON.'] },
    { names: ['maintenanceoff', 'fixmode'], desc: 'Maintenance off', replies: ['\u2705 Maintenance mode OFF.'] },
    { names: ['autoread', 'readall'], desc: 'Auto read toggle', replies: ['\u2705 Auto-read toggle ho gaya.'] },
    { names: ['autotyping', 'typing'], desc: 'Auto typing toggle', replies: ['\u2705 Auto-typing toggle ho gaya.'] },
    { names: ['autoreact', 'reactall'], desc: 'Auto react toggle', replies: ['\u2705 Auto-react toggle ho gaya.'] },
    { names: ['antilink', 'antilinkon'], desc: 'Anti-link', replies: ['\ud83d\udd17 Anti-link ON.'] },
    { names: ['antilinkoff'], desc: 'Anti-link off', replies: ['\u2705 Anti-link OFF.'] },
    { names: ['antispam', 'antispamon'], desc: 'Anti-spam', replies: ['\ud83d\uded1 Anti-spam ON.'] },
    { names: ['antispamoff'], desc: 'Anti-spam off', replies: ['\u2705 Anti-spam OFF.'] },
    { names: ['antidelete', 'antideleteon'], desc: 'Anti-delete', replies: ['\ud83d\uddd1\ufe0f Anti-delete ON.'] },
    { names: ['antideleteoff'], desc: 'Anti-delete off', replies: ['\u2705 Anti-delete OFF.'] },
    { names: ['welcome', 'welcomeon'], desc: 'Welcome message', replies: ['\ud83d\udc4b Welcome message ON.'] },
    { names: ['welcomeoff'], desc: 'Welcome off', replies: ['\u2705 Welcome OFF.'] },
    { names: ['goodbye', 'goodbyeon'], desc: 'Goodbye message', replies: ['\ud83d\udc4b Goodbye message ON.'] },
    { names: ['goodbyeoff'], desc: 'Goodbye off', replies: ['\u2705 Goodbye OFF.'] },
    { names: ['clearsession', 'resetsession'], desc: 'Clear session', replies: ['\ud83e\uddf9 Session clear kar diya.'] },
    { names: ['backup', 'dbbackup'], desc: 'Backup DB', replies: ['\ud83d\uddc4\ufe0f Backup start ho gaya.'] },
    { names: ['restore', 'dbrestore'], desc: 'Restore DB', replies: ['\u267b\ufe0f Restore start ho gaya.'] },
    { names: ['update', 'updatebot'], desc: 'Update bot', replies: ['\u2b06\ufe0f Update check ho raha hai...'] },
    { names: ['version_check', 'checkupdate'], desc: 'Check update', replies: ['\u2705 Bot latest version par hai.'] },
    { names: ['stats', 'botstats'], desc: 'Bot stats', replies: ['\ud83d\udcca Stats dashboard par available hain.'] },
    { names: ['users', 'userlist'], desc: 'User list', replies: ['\ud83d\udc65 User list dashboard se dekhein.'] },
    { names: ['sessions', 'sessionlist'], desc: 'Session list', replies: ['\ud83d\udcf1 Session list dashboard se dekhein.'] },
  ]);
};
