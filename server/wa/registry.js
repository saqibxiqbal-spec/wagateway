/**
 * Command registry + category-aware menu renderer.
 *
 * Every plugin file under ./plugins receives `def()` and registers commands
 * into this single registry. Aliases are first-class: a command may be known
 * by many names (`.sticker`, `.s`, `.stiker`) but is stored once, so the menu
 * never shows duplicates.
 */

const BOT_NAME = process.env.BOT_NAME || 'SAQIB MD';
const PREFIXES = ['.', '/', '!', '#'];

/* ------------------------------------------------------------- categories */

const CATEGORIES = new Map();

function category(key, meta) {
  CATEGORIES.set(key, {
    key,
    order: 100,
    emoji: '\u2022',
    title: key.toUpperCase(),
    desc: '',
    ...meta,
  });
}

// Order matters: this is the order shown in `.menu`.
category('main', { order: 1, emoji: '\ud83d\udccb', title: 'MAIN', desc: 'Bot ki basic commands' });
category('owner', { order: 2, emoji: '\ud83d\udc51', title: 'OWNER', desc: 'Sirf owner ke liye' });
category('general', { order: 3, emoji: '\ud83d\udcac', title: 'GENERAL', desc: 'Aam istemaal ki commands' });
category('tools', { order: 4, emoji: '\ud83d\udee0\ufe0f', title: 'TOOLS', desc: 'Kaam ki utilities' });
category('text', { order: 5, emoji: '\u270d\ufe0f', title: 'TEXT & FONTS', desc: 'Text banayein aur badlein' });
category('textmaker', { order: 6, emoji: '\ud83c\udfa8', title: 'TEXTMAKER', desc: 'Stylish text banners' });
category('media', { order: 7, emoji: '\ud83c\udf9e\ufe0f', title: 'MEDIA & STICKER', desc: 'Sticker, image, audio' });
category('download', { order: 8, emoji: '\u2b07\ufe0f', title: 'DOWNLOADER', desc: 'Social media se download' });
category('search', { order: 9, emoji: '\ud83d\udd0d', title: 'SEARCH', desc: 'Internet par talash' });
category('group', { order: 10, emoji: '\ud83d\udc65', title: 'GROUP', desc: 'Group management' });
category('admin', { order: 11, emoji: '\ud83d\udee1\ufe0f', title: 'ADMIN', desc: 'Admin commands' });
category('fun', { order: 12, emoji: '\ud83c\udf89', title: 'FUN', desc: 'Maza, games, jokes' });
category('game', { order: 13, emoji: '\ud83c\udfb2', title: 'GAMES', desc: 'Games aur puzzles' });
category('islamic', { order: 14, emoji: '\ud83d\udd4c', title: 'ISLAMIC', desc: 'Deeni maloomat' });
category('ai', { order: 15, emoji: '\ud83e\udd16', title: 'AI', desc: 'AI aur chat' });
category('converter', { order: 16, emoji: '\ud83d\udd04', title: 'CONVERTER', desc: 'Units, currency, format' });
category('crypto', { order: 17, emoji: '\ud83d\udd10', title: 'CRYPTO & HASH', desc: 'Hashing aur encoding' });
category('math', { order: 18, emoji: '\ud83e\uddee', title: 'MATH', desc: 'Hisaab aur formulas' });
category('time', { order: 19, emoji: '\ud83d\udd52', title: 'TIME', desc: 'Waqt aur tareekh' });
category('random', { order: 20, emoji: '\ud83c\udfb1', title: 'RANDOM', desc: 'Random generators' });
category('emoji', { order: 21, emoji: '\ud83d\ude00', title: 'EMOJI', desc: 'Emoji packs' });
category('info', { order: 22, emoji: '\u2139\ufe0f', title: 'INFO', desc: 'Maloomat aur lookup' });
category('stalk', { order: 23, emoji: '\ud83d\udd75\ufe0f', title: 'STALKER', desc: 'Public profile lookup' });
category('economy', { order: 24, emoji: '\ud83d\udcb0', title: 'ECONOMY', desc: 'Coins aur rewards' });
category('anime', { order: 25, emoji: '\ud83c\udf8c', title: 'ANIME', desc: 'Anime reactions' });
category('system', { order: 26, emoji: '\ud83d\udda5\ufe0f', title: 'SYSTEM', desc: 'Server aur bot info' });
category('nsfw', { order: 27, emoji: '\ud83d\udd1e', title: '18+', desc: 'Adult commands (owner only)' });

/* --------------------------------------------------------------- registry */

const commands = new Map(); // lowercase name -> entry
const entries = []; // unique entries, in registration order

function def(spec) {
  const primary = [].concat(spec.name)[0];
  if (!primary) throw new Error('command needs a name');

  const entry = {
    name: String(primary).toLowerCase(),
    aliases: (spec.alias || []).map((a) => String(a).toLowerCase()),
    category: spec.category || 'general',
    desc: spec.desc || '',
    usage: spec.usage || '',
    owner: spec.owner === true,
    admin: spec.admin === true,
    group: spec.group === true,
    hidden: spec.hidden === true,
    premium: spec.premium === true,
    run: spec.run,
  };

  const names = [entry.name, ...entry.aliases];
  let added = 0;
  for (const n of names) {
    if (!n) continue;
    if (commands.has(n)) continue; // first registration wins
    commands.set(n, entry);
    added += 1;
  }
  if (added) entries.push(entry);
  return entry;
}

/** Bulk-register many commands that share one handler and one description. */
function defMany(names, spec) {
  const list = [].concat(names);
  return def({ ...spec, name: list[0], alias: list.slice(1) });
}

function get(name) {
  return commands.get(String(name || '').toLowerCase());
}

function has(name) {
  return commands.has(String(name || '').toLowerCase());
}

function totalNames() {
  return commands.size;
}

function totalCommands() {
  return entries.length;
}

function byCategory(key) {
  return entries.filter((e) => e.category === key && !e.hidden);
}

function categoryList() {
  return [...CATEGORIES.values()].sort((a, b) => a.order - b.order);
}

module.exports = {
  BOT_NAME,
  PREFIXES,
  CATEGORIES,
  category,
  commands,
  entries,
  def,
  defMany,
  get,
  has,
  totalNames,
  totalCommands,
  byCategory,
  categoryList,
};
