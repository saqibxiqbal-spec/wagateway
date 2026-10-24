/** STALK: public profile lookups (best-effort, link based). */

const { fetchJson } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({ name: ['githubstalk', 'ghstalk'], category: 'stalk', desc: '.githubstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Username dein.';
    try {
      const d = await fetchJson(`https://api.github.com/users/${encodeURIComponent(u)}`);
      return `\ud83d\udc19 *${d.login}*\n\u2022 Name: ${d.name || '-'}\n\u2022 Repos: ${d.public_repos}\n\u2022 Followers: ${d.followers}\n\u2022 Following: ${d.following}\n\u2022 Created: ${String(d.created_at).slice(0, 10)}\n\u2022 Bio: ${d.bio || '-'}`;
    } catch { return '\u274c User nahi mila.'; }
  } });
  def({ name: ['npmstalk', 'npminfo'], category: 'stalk', desc: '.npmstalk <pkg>', run: async (ctx) => {
    const p = ctx.args[0];
    if (!p) return '\u274c Package dein.';
    try {
      const d = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(p)}/latest`);
      return `\ud83d\udce6 *${d.name}* v${d.version}\n${d.description || ''}\n\u2022 License: ${d.license || '-'}`;
    } catch { return '\u274c Package nahi mila.'; }
  } });
  def({ name: ['igstalk', 'instastalk'], category: 'stalk', desc: '.igstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83d\udcf8 Instagram: https://www.instagram.com/${encodeURIComponent(u)}/` : '\u274c Username dein.';
  } });
  def({ name: ['twstalk', 'twitterstalk'], category: 'stalk', desc: '.twstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83d\udc26 Twitter: https://twitter.com/${encodeURIComponent(u)}` : '\u274c Username dein.';
  } });
  def({ name: ['tiktokstalk', 'ttstalk'], category: 'stalk', desc: '.tiktokstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83c\udfb5 TikTok: https://www.tiktok.com/@${encodeURIComponent(u)}` : '\u274c Username dein.';
  } });
  def({ name: ['fbstalk', 'facebookstalk'], category: 'stalk', desc: '.fbstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83d\udc26 Facebook: https://facebook.com/${encodeURIComponent(u)}` : '\u274c Username dein.';
  } });
  def({ name: ['ytstalk', 'youtubestalk'], category: 'stalk', desc: '.ytstalk <channel>', run: async (ctx) => {
    const u = ctx.args.join(' ');
    return u ? `\u25b6\ufe0f YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(u)}` : '\u274c Channel dein.';
  } });
  def({ name: ['redditstalk', 'reddituser'], category: 'stalk', desc: '.redditstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83d\udc7d Reddit: https://www.reddit.com/user/${encodeURIComponent(u)}` : '\u274c Username dein.';
  } });
  def({ name: ['pinstalk', 'pintereststalk'], category: 'stalk', desc: '.pinstalk <user>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83d\udccc Pinterest: https://www.pinterest.com/${encodeURIComponent(u)}/` : '\u274c Username dein.';
  } });
  def({ name: ['linkedin', 'listalk'], category: 'stalk', desc: '.linkedin <name>', run: async (ctx) => {
    const u = ctx.args.join(' ');
    return u ? `\ud83d\udcbc LinkedIn: https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(u)}` : '\u274c Name dein.';
  } });

  bulk(defMany, 'stalk', [
    { names: ['stalk', 'stalkmenu'], desc: 'Stalk menu', replies: ['\ud83d\udd0d `.githubstalk`, `.igstalk`, `.twstalk`, `.tiktokstalk`, `.ytstalk`'] },
    { names: ['userinfo', 'userlookup'], desc: 'User info', replies: ['\ud83d\udc64 User info: platform + username dein.'] },
    { names: ['username', 'uname'], desc: 'Username', replies: ['\ud83d\udc64 Username check ready.'] },
    { names: ['social', 'socials'], desc: 'Socials', replies: ['\ud83c\udf10 GitHub, Instagram, Twitter, TikTok, Facebook, YouTube, Reddit, Pinterest'] },
    { names: ['emailcheck', 'emailverify'], desc: 'Email check', replies: ['\ud83d\udce7 Email check: dashboard se.'] },
    { names: ['numbercheck', 'phonecheck'], desc: 'Number check', replies: ['\ud83d\udcf1 Number check: dashboard se.'] },
    { names: ['whois2', 'domainstalk'], desc: 'Whois', replies: ['\ud83c\udf10 `.domain <site>`'] },
    { names: ['ipstalk', 'iplook'], desc: 'IP stalk', replies: ['\ud83c\udf10 `.ip <address>`'] },
    { names: ['dnsstalk', 'dns'], desc: 'DNS', replies: ['\ud83c\udf10 `.domain <site>`'] },
    { names: ['sherlock', 'username_search'], desc: 'Username search', replies: ['\ud83d\udd0e https://sherlockproject.xyz/'] },
  ]);
};
