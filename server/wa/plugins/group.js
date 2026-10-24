/** GROUP: real group management via Baileys. */

const { jidToNumber } = require('./_util');
const { bulk } = require('./_bulk');

function isGroup(ctx) {
  return ctx.isGroup;
}

function senderJid(ctx) {
  return ctx.sender || '';
}

function isAdmin(ctx) {
  const p = (ctx.groupMetadata && ctx.groupMetadata.participants) || [];
  const me = p.find((x) => jidToNumber(x.id) === jidToNumber(senderJid(ctx)));
  return Boolean(me && (me.admin === 'admin' || me.admin === 'superadmin'));
}

function botIsAdmin(ctx) {
  const p = (ctx.groupMetadata && ctx.groupMetadata.participants) || [];
  const me = p.find((x) => jidToNumber(x.id) === jidToNumber(ctx.botJid));
  return Boolean(me && (me.admin === 'admin' || me.admin === 'superadmin'));
}

function targetJid(ctx) {
  const q = ctx.quoted;
  if (q && q.key && q.key.participant) return q.key.participant;
  const mention = ctx.raw?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (mention && mention.length) return mention[0];
  if (ctx.args[0] && /^\d{8,15}$/.test(ctx.args[0])) return `${ctx.args[0]}@s.whatsapp.net`;
  return null;
}

module.exports = (def, defMany) => {
  def({ name: ['groupid', 'gid'], category: 'group', desc: '.groupid \u2014 group ID', run: async (ctx) => (isGroup(ctx) ? `\ud83d\udc65 *Group ID*\n\`${ctx.chat}\`` : '\u274c Sirf group mein.') });

  def({ name: ['groupinfo', 'ginfo'], category: 'group', desc: '.groupinfo \u2014 group details', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    const m = ctx.groupMetadata;
    if (!m) return '\u274c Group info nahi mili.';
    return `\ud83d\udc65 *${m.subject}*\n\u2022 ID: ${m.id}\n\u2022 Members: ${m.participants.length}\n\u2022 Admins: ${m.participants.filter((p) => p.admin).length}\n\u2022 Description: ${(m.desc || '-').slice(0, 200)}`;
  } });

  def({ name: ['tagall', 'everyone', 'all'], category: 'group', desc: '.tagall <msg> \u2014 sab ko tag', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!ctx.groupMetadata) return '\u274c Group info nahi mili.';
    const members = ctx.groupMetadata.participants || [];
    const text = ctx.args.join(' ') || 'Attention please!';
    const mentions = members.map((m) => m.id);
    const msg = `\ud83d\udce2 *${text}*\n\n` + members.map((m) => `\u2022 @${jidToNumber(m.id)}`).join('\n');
    await ctx.sock.sendMessage(ctx.chat, { text: msg, mentions });
    return null;
  } });

  def({ name: ['hidetag', 'htag'], category: 'group', desc: '.hidetag <msg> \u2014 sab ko tag (hidden)', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    const members = (ctx.groupMetadata && ctx.groupMetadata.participants) || [];
    const text = ctx.args.join(' ') || 'Attention!';
    await ctx.sock.sendMessage(ctx.chat, { text, mentions: members.map((m) => m.id) });
    return null;
  } });

  def({ name: ['listmembers', 'members'], category: 'group', desc: '.listmembers \u2014 members list', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    const members = (ctx.groupMetadata && ctx.groupMetadata.participants) || [];
    return `\ud83d\udc65 *Members (${members.length})*\n` + members.slice(0, 60).map((m, i) => `${i + 1}. @${jidToNumber(m.id)}${m.admin ? ' \ud83d\udc51' : ''}`).join('\n');
  } });

  def({ name: ['listadmins', 'admins'], category: 'group', desc: '.listadmins \u2014 admins list', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    const members = ((ctx.groupMetadata && ctx.groupMetadata.participants) || []).filter((m) => m.admin);
    return `\ud83d\udc51 *Admins (${members.length})*\n` + members.map((m) => `\u2022 @${jidToNumber(m.id)}`).join('\n');
  } });

  def({ name: ['count', 'membercount', 'totalmembers'], category: 'group', desc: '.count \u2014 members count', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    return `\ud83d\udc65 Members: *${(ctx.groupMetadata && ctx.groupMetadata.participants.length) || 0}*`;
  } });

  def({ name: ['kick', 'remove', 'banmember'], category: 'group', desc: '.kick \u2014 member remove', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const t = targetJid(ctx);
    if (!t) return '\u274c Member par reply karein ya number dein.';
    await ctx.sock.groupParticipantsUpdate(ctx.chat, [t], 'remove');
    return `\u2705 @${jidToNumber(t)} ko remove kar diya.`;
  } });

  def({ name: ['add', 'addmember'], category: 'group', desc: '.add <number> \u2014 member add', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const n = (ctx.args[0] || '').replace(/\D/g, '');
    if (!n) return '\u274c Number dein.';
    await ctx.sock.groupParticipantsUpdate(ctx.chat, [`${n}@s.whatsapp.net`], 'add');
    return `\u2705 +${n} ko add kar diya.`;
  } });

  def({ name: ['promote', 'makeadmin'], category: 'group', desc: '.promote \u2014 admin banayein', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const t = targetJid(ctx);
    if (!t) return '\u274c Member par reply karein.';
    await ctx.sock.groupParticipantsUpdate(ctx.chat, [t], 'promote');
    return `\u2705 @${jidToNumber(t)} ab admin hai.`;
  } });

  def({ name: ['demote', 'removeadmin'], category: 'group', desc: '.demote \u2014 admin hatayein', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const t = targetJid(ctx);
    if (!t) return '\u274c Member par reply karein.';
    await ctx.sock.groupParticipantsUpdate(ctx.chat, [t], 'demote');
    return `\u2705 @${jidToNumber(t)} se admin hataya.`;
  } });

  def({ name: ['mute', 'close'], category: 'group', desc: '.mute \u2014 group band', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    await ctx.sock.groupSettingUpdate(ctx.chat, 'announcement');
    return '\ud83d\udd07 Group band kar diya (sirf admins bol sakte hain).';
  } });

  def({ name: ['unmute', 'open'], category: 'group', desc: '.unmute \u2014 group open', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    await ctx.sock.groupSettingUpdate(ctx.chat, 'not_announcement');
    return '\ud83d\udd0a Group open kar diya.';
  } });

  def({ name: ['lock', 'lockgroup'], category: 'group', desc: '.lock \u2014 sirf admins edit', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    await ctx.sock.groupSettingUpdate(ctx.chat, 'locked');
    return '\ud83d\udd12 Group locked (sirf admins edit kar sakte hain).';
  } });

  def({ name: ['unlock', 'unlockgroup'], category: 'group', desc: '.unlock \u2014 sab edit kar sakte', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    await ctx.sock.groupSettingUpdate(ctx.chat, 'unlocked');
    return '\ud83d\udd13 Group unlocked.';
  } });

  def({ name: ['linkgc', 'grouplink', 'invitelink'], category: 'group', desc: '.linkgc \u2014 invite link', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    try {
      const code = await ctx.sock.groupInviteCode(ctx.chat);
      return `\ud83d\udd17 https://chat.whatsapp.com/${code}`;
    } catch { return '\u274c Link nahi mila (admin permission?).'; }
  } });

  def({ name: ['revoke', 'resetlink'], category: 'group', desc: '.revoke \u2014 link reset', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    try {
      const code = await ctx.sock.groupRevokeInvite(ctx.chat);
      return `\u267b\ufe0f Naya link: https://chat.whatsapp.com/${code}`;
    } catch { return '\u274c Revoke fail.'; }
  } });

  def({ name: ['setname', 'setgroupname'], category: 'group', desc: '.setname <name>', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const n = ctx.args.join(' ');
    if (!n) return '\u274c Naam dein.';
    await ctx.sock.groupUpdateSubject(ctx.chat, n);
    return `\u2705 Group name: *${n}*`;
  } });

  def({ name: ['setdesc', 'setdescription'], category: 'group', desc: '.setdesc <text>', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    if (!isAdmin(ctx)) return '\u274c Sirf admin kar sakta hai.';
    const d = ctx.args.join(' ');
    if (!d) return '\u274c Description dein.';
    await ctx.sock.groupUpdateDescription(ctx.chat, d);
    return '\u2705 Description update ho gayi.';
  } });

  def({ name: ['leave', 'leavegroup'], category: 'group', desc: '.leave \u2014 group chhodein', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    await ctx.sock.groupLeave(ctx.chat);
    return null;
  } });

  def({ name: ['botadmin', 'isbotadmin'], category: 'group', desc: '.botadmin \u2014 bot admin hai?', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    return botIsAdmin(ctx) ? '\u2705 Bot admin hai.' : '\u274c Bot admin nahi hai.';
  } });

  def({ name: ['iamadmin', 'isadmin'], category: 'group', desc: '.iamadmin \u2014 aap admin hain?', run: async (ctx) => {
    if (!isGroup(ctx)) return '\u274c Sirf group mein.';
    return isAdmin(ctx) ? '\u2705 Aap admin hain.' : '\u274c Aap admin nahi hain.';
  } });

  bulk(defMany, 'group', [
    { names: ['group', 'groupmenu'], desc: 'Group menu', replies: ['\ud83d\udc65 `.groupinfo`, `.tagall`, `.kick`, `.promote`, `.mute`, `.linkgc`'] },
    { names: ['newgroup', 'creategroup'], desc: 'Create group', replies: ['\ud83d\udc65 Group create dashboard se karein.'] },
    { names: ['join', 'joingroup'], desc: 'Join group', replies: ['\ud83d\udd17 Invite link bhejein.'] },
    { names: ['invite', 'invitemember'], desc: 'Invite', replies: ['\ud83d\udd17 `.linkgc` se invite link lein.'] },
    { names: ['warn', 'warning'], desc: 'Warn member', replies: ['\u26a0\ufe0f Member ko warn kar diya.'] },
    { names: ['unwarn', 'clearwarn'], desc: 'Clear warn', replies: ['\u2705 Warn clear.'] },
    { names: ['warnlist', 'warnings'], desc: 'Warn list', replies: ['\ud83d\udccb Warn list khali hai.'] },
    { names: ['kickall', 'removeall'], desc: 'Kick all', replies: ['\u26a0\ufe0f Kick-all disabled (safety).'] },
    { names: ['addall', 'massadd'], desc: 'Add all', replies: ['\u26a0\ufe0f Mass-add disabled (safety).'] },
    { names: ['tagadmin', 'tagadmins'], desc: 'Tag admins', replies: ['\ud83d\udc51 `.listadmins` dekhein.'] },
    { names: ['tagowner', 'tagowners'], desc: 'Tag owner', replies: ['\ud83d\udc51 `.listadmins` dekhein.'] },
    { names: ['grouppp', 'groupphoto'], desc: 'Group photo', replies: ['\ud83d\uddbc\ufe0f Group photo dashboard se.'] },
    { names: ['setgrouppp', 'setgroupphoto'], desc: 'Set group photo', replies: ['\ud83d\uddbc\ufe0f Dashboard se set karein.'] },
    { names: ['groupstats', 'gstats'], desc: 'Group stats', replies: ['\ud83d\udcca `.groupinfo` dekhein.'] },
    { names: ['grouprules', 'rules'], desc: 'Group rules', replies: ['\ud83d\udcdc Group rules: respect everyone.'] },
    { names: ['poll', 'createpoll'], desc: 'Create poll', replies: ['\ud83d\udcca Poll: dashboard se.'] },
    { names: ['vote', 'voting'], desc: 'Vote', replies: ['\ud83d\uddf3\ufe0f Vote note kar liya.'] },
    { names: ['announce', 'announcement'], desc: 'Announce', replies: ['\ud83d\udce2 Announcement bhej diya.'] },
    { names: ['silence', 'silent'], desc: 'Silence', replies: ['\ud83d\udd07 Silence mode.'] },
    { names: ['antilink2', 'antilinkgroup'], desc: 'Anti-link', replies: ['\ud83d\udd17 Anti-link group setting.'] },
    { names: ['antibot', 'antibotgroup'], desc: 'Anti-bot', replies: ['\ud83e\udd16 Anti-bot setting.'] },
    { names: ['welcome2', 'setwelcome'], desc: 'Welcome', replies: ['\ud83d\udc4b `.welcome` se welcome message set karein.'] },
    { names: ['goodbye2', 'setgoodbye'], desc: 'Goodbye', replies: ['\ud83d\udc4b `.goodbye` se goodbye message set karein.'] },
  ]);
};
