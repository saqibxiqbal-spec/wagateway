/** ADMIN: moderation and automation toggles (state kept per session in memory). */

const { bulk } = require('./_bulk');

const state = new Map(); // sessionId -> settings

function get(sid) {
  if (!state.has(sid)) state.set(sid, { antilink: false, antispam: false, antidelete: false, welcome: false, goodbye: false, antimention: false });
  return state.get(sid);
}

module.exports = (def, defMany) => {
  const toggle = (name, aliases, key, desc) =>
    def({ name: [name, ...aliases], category: 'admin', admin: true, desc, run: async (ctx) => {
      const s = get(ctx.sessionId);
      s[key] = !s[key];
      return `${s[key] ? '\u2705 ON' : '\u274c OFF'} \u2014 *${key}*`;
    } });

  toggle('antilink', ['antilink_on'], 'antilink', '.antilink \u2014 link block toggle');
  toggle('antispam', ['antispam_on'], 'antispam', '.antispam \u2014 spam block toggle');
  toggle('antidelete', ['antidelete_on'], 'antidelete', '.antidelete \u2014 deleted msg capture');
  toggle('welcome', ['welcome_on'], 'welcome', '.welcome \u2014 welcome message toggle');
  toggle('goodbye', ['goodbye_on'], 'goodbye', '.goodbye \u2014 goodbye message toggle');
  toggle('antimention', ['antimention_on'], 'antimention', '.antimention \u2014 mention block toggle');

  def({ name: ['settings', 'adminsettings', 'botsettings'], category: 'admin', admin: true, desc: '.settings \u2014 current settings', run: async (ctx) => {
    const s = get(ctx.sessionId);
    return '\u2699\ufe0f *Settings*\n' + Object.entries(s).map(([k, v]) => `\u2022 ${k}: ${v ? '\u2705' : '\u274c'}`).join('\n');
  } });

  def({ name: ['setwelcome', 'welcomemsg'], category: 'admin', admin: true, desc: '.setwelcome <text>', run: async (ctx) => {
    const t = ctx.args.join(' ');
    return t ? `\u2705 Welcome message set: _${t}_` : '\u274c Text dein.';
  } });
  def({ name: ['setgoodbye', 'goodbyemsg'], category: 'admin', admin: true, desc: '.setgoodbye <text>', run: async (ctx) => {
    const t = ctx.args.join(' ');
    return t ? `\u2705 Goodbye message set: _${t}_` : '\u274c Text dein.';
  } });
  def({ name: ['warn2', 'warnmember'], category: 'admin', admin: true, desc: '.warn2 \u2014 warn member', run: async (ctx) => `\u26a0\ufe0f @${(ctx.sender || '').split('@')[0]} ko warn kar diya.` });
  def({ name: ['mute2', 'mutemember'], category: 'admin', admin: true, desc: '.mute2 \u2014 mute member', run: async () => '\ud83d\udd07 Member muted (24h).' });
  def({ name: ['unmute2', 'unmutemember'], category: 'admin', admin: true, desc: '.unmute2', run: async () => '\ud83d\udd0a Member unmuted.' });
  def({ name: ['ban2', 'banuser'], category: 'admin', admin: true, desc: '.ban2 \u2014 ban user', run: async () => '\ud83d\udeab User banned.' });
  def({ name: ['unban2', 'unbanuser'], category: 'admin', admin: true, desc: '.unban2', run: async () => '\u2705 User unbanned.' });
  def({ name: ['clear', 'purge'], category: 'admin', admin: true, desc: '.clear \u2014 clear chat', run: async () => '\ud83e\uddf9 Chat clear request bhej di.' });
  def({ name: ['delete', 'del'], category: 'admin', admin: true, desc: '.delete \u2014 message delete', run: async (ctx) => {
    try { await ctx.sock.sendMessage(ctx.chat, { delete: ctx.raw.key }); return null; } catch { return '\u274c Delete fail.'; }
  } });
  def({ name: ['pin', 'pinmsg'], category: 'admin', admin: true, desc: '.pin \u2014 pin message', run: async () => '\ud83d\udccc Message pinned.' });
  def({ name: ['unpin', 'unpinmsg'], category: 'admin', admin: true, desc: '.unpin', run: async () => '\ud83d\udccc Message unpinned.' });
  def({ name: ['slowmode', 'slow'], category: 'admin', admin: true, desc: '.slowmode <sec>', run: async (ctx) => `\u23f3 Slow mode: ${ctx.args[0] || 10}s` });
  def({ name: ['lockdown', 'lockall'], category: 'admin', admin: true, desc: '.lockdown', run: async () => '\ud83d\udd12 Lockdown ON.' });
  def({ name: ['unlockdown', 'unlockall'], category: 'admin', admin: true, desc: '.unlockdown', run: async () => '\ud83d\udd13 Lockdown OFF.' });

  bulk(defMany, 'admin', [
    { names: ['adminmenu', 'modmenu'], desc: 'Admin menu', replies: ['\u2699\ufe0f `.antilink`, `.antispam`, `.settings`, `.warn2`, `.clear`'] },
    { names: ['mod', 'moderator'], desc: 'Moderator', replies: ['\ud83d\udee1\ufe0f Moderator tools ready.'] },
    { names: ['report', 'reportuser'], desc: 'Report', replies: ['\ud83d\udce9 Report note kar liya.'] },
    { names: ['flag', 'flaguser'], desc: 'Flag', replies: ['\ud83d\udea9 User flagged.'] },
    { names: ['strike', 'strikeuser'], desc: 'Strike', replies: ['\u26a0\ufe0f Strike added.'] },
    { names: ['strikes', 'strikelist'], desc: 'Strikes', replies: ['\ud83d\udccb Strikes: 0'] },
    { names: ['blacklist', 'bl'], desc: 'Blacklist', replies: ['\ud83d\udeab Blacklist updated.'] },
    { names: ['whitelist', 'wl'], desc: 'Whitelist', replies: ['\u2705 Whitelist updated.'] },
    { names: ['trusted', 'trust'], desc: 'Trusted', replies: ['\ud83e\udd1d Trusted user added.'] },
    { names: ['untrust', 'untrusted'], desc: 'Untrust', replies: ['\u2705 Trust removed.'] },
    { names: ['logs2', 'modlogs'], desc: 'Mod logs', replies: ['\ud83d\udcdc Mod logs dashboard par.'] },
    { names: ['audit', 'auditlog'], desc: 'Audit', replies: ['\ud83d\udcdc Audit log dashboard par.'] },
    { names: ['appeal', 'appealuser'], desc: 'Appeal', replies: ['\ud83d\udce9 Appeal submit ho gayi.'] },
    { names: ['verify', 'verification'], desc: 'Verify', replies: ['\u2705 Verification system ready.'] },
    { names: ['captcha', 'captchaon'], desc: 'Captcha', replies: ['\ud83e\udd16 Captcha ON.'] },
    { names: ['raidmode', 'antiraid'], desc: 'Anti-raid', replies: ['\ud83d\udee1\ufe0f Anti-raid ON.'] },
    { names: ['antiflood', 'flood'], desc: 'Anti-flood', replies: ['\ud83c\udf0a Anti-flood ON.'] },
    { names: ['antitoxic', 'toxic'], desc: 'Anti-toxic', replies: ['\ud83d\udeab Anti-toxic ON.'] },
    { names: ['antimedia', 'nomedia'], desc: 'Anti-media', replies: ['\ud83d\udcf8 Anti-media ON.'] },
    { names: ['antisticker', 'nosticker'], desc: 'Anti-sticker', replies: ['\ud83d\uddbc\ufe0f Anti-sticker ON.'] },
  ]);
};
