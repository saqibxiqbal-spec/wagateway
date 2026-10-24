/** INFO: country, IP, phone, domain, package, general lookups. */

const { fetchJson } = require('./_util');
const { bulk } = require('./_bulk');

const COUNTRIES = {
  pakistan: { capital: 'Islamabad', currency: 'PKR', pop: '240M', code: 'PK' },
  india: { capital: 'New Delhi', currency: 'INR', pop: '1.4B', code: 'IN' },
  usa: { capital: 'Washington DC', currency: 'USD', pop: '335M', code: 'US' },
  uk: { capital: 'London', currency: 'GBP', pop: '67M', code: 'GB' },
  china: { capital: 'Beijing', currency: 'CNY', pop: '1.4B', code: 'CN' },
  japan: { capital: 'Tokyo', currency: 'JPY', pop: '125M', code: 'JP' },
  turkey: { capital: 'Ankara', currency: 'TRY', pop: '85M', code: 'TR' },
  saudi: { capital: 'Riyadh', currency: 'SAR', pop: '35M', code: 'SA' },
  uae: { capital: 'Abu Dhabi', currency: 'AED', pop: '10M', code: 'AE' },
  germany: { capital: 'Berlin', currency: 'EUR', pop: '84M', code: 'DE' },
  france: { capital: 'Paris', currency: 'EUR', pop: '68M', code: 'FR' },
  canada: { capital: 'Ottawa', currency: 'CAD', pop: '40M', code: 'CA' },
  australia: { capital: 'Canberra', currency: 'AUD', pop: '26M', code: 'AU' },
  brazil: { capital: 'Brasilia', currency: 'BRL', pop: '215M', code: 'BR' },
  indonesia: { capital: 'Jakarta', currency: 'IDR', pop: '275M', code: 'ID' },
  malaysia: { capital: 'Kuala Lumpur', currency: 'MYR', pop: '33M', code: 'MY' },
  bangladesh: { capital: 'Dhaka', currency: 'BDT', pop: '170M', code: 'BD' },
  egypt: { capital: 'Cairo', currency: 'EGP', pop: '105M', code: 'EG' },
  russia: { capital: 'Moscow', currency: 'RUB', pop: '144M', code: 'RU' },
  italy: { capital: 'Rome', currency: 'EUR', pop: '59M', code: 'IT' },
};

module.exports = (def, defMany) => {
  def({ name: ['ip', 'ipinfo', 'myip', 'iplookup'], category: 'info', desc: '.ip <address>', run: async (ctx) => {
    const q = ctx.args[0] || '';
    try {
      const d = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(q)}`);
      if (d.status !== 'success') return '\u274c IP nahi mili.';
      return `\ud83c\udf10 *IP Info*\n\u2022 IP: ${d.query}\n\u2022 Country: ${d.country}\n\u2022 City: ${d.city}\n\u2022 ISP: ${d.isp}\n\u2022 Timezone: ${d.timezone}`;
    } catch { return '\u274c IP lookup fail.'; }
  } });
  def({ name: ['country', 'countryinfo'], category: 'info', desc: '.country <name>', run: async (ctx) => {
    const c = COUNTRIES[(ctx.args[0] || '').toLowerCase()];
    if (!c) return `\u274c Country nahi mili. Available: ${Object.keys(COUNTRIES).slice(0, 10).join(', ')}`;
    return `\ud83c\udf0d *${ctx.args[0]}*\n\u2022 Capital: ${c.capital}\n\u2022 Currency: ${c.currency}\n\u2022 Population: ${c.pop}\n\u2022 Code: ${c.code}`;
  } });
  def({ name: ['phone', 'phoneinfo'], category: 'info', desc: '.phone <number>', run: async (ctx) => {
    const n = (ctx.args[0] || '').replace(/\D/g, '');
    if (!n) return '\u274c Number dein.';
    return `\ud83d\udcf1 *Phone:* +${n}\n\u2022 Length: ${n.length} digits\n\u2022 Country code: +${n.slice(0, 2)}`;
  } });
  def({ name: ['domain', 'domaininfo', 'whois'], category: 'info', desc: '.domain <site>', run: async (ctx) => {
    const d = (ctx.args[0] || '').replace(/^https?:\/\//, '').split('/')[0];
    if (!d) return '\u274c Domain dein.';
    try {
      const r = await fetchJson(`https://dns.google/resolve?name=${encodeURIComponent(d)}&type=A`);
      const a = (r.Answer || []).filter((x) => x.type === 1).map((x) => x.data);
      return `\ud83c\udf10 *${d}*\n\u2022 A records: ${a.length ? a.join(', ') : 'none'}`;
    } catch { return '\u274c Domain lookup fail.'; }
  } });
  def({ name: ['npm', 'npmpackage'], category: 'info', desc: '.npm <package>', run: async (ctx) => {
    const p = ctx.args[0];
    if (!p) return '\u274c Misal: `.npm express`';
    try {
      const d = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(p)}/latest`);
      return `\ud83d\udce6 *${d.name}* v${d.version}\n${d.description || ''}`;
    } catch { return '\u274c Package nahi mila.'; }
  } });
  def({ name: ['github', 'ghuser'], category: 'info', desc: '.github <username>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Misal: `.github octocat`';
    try {
      const d = await fetchJson(`https://api.github.com/users/${encodeURIComponent(u)}`);
      return `\ud83d\udc19 *${d.login}*\n\u2022 Name: ${d.name || '-'}\n\u2022 Repos: ${d.public_repos}\n\u2022 Followers: ${d.followers}\n\u2022 Bio: ${d.bio || '-'}`;
    } catch { return '\u274c User nahi mila.'; }
  } });
  def({ name: ['weatherinfo', 'climate'], category: 'info', desc: '.weatherinfo <city>', run: async (ctx) => {
    const c = ctx.args.join(' ') || 'Lahore';
    try {
      const d = await fetchJson(`https://wttr.in/${encodeURIComponent(c)}?format=j1`);
      const cur = d.current_condition[0];
      return `\ud83c\udf24\ufe0f *${c}*\n\u2022 Temp: ${cur.temp_C}\u00b0C\n\u2022 Feels: ${cur.FeelsLikeC}\u00b0C\n\u2022 Humidity: ${cur.humidity}%\n\u2022 ${cur.weatherDesc[0].value}`;
    } catch { return '\u274c Weather fail.'; }
  } });
  def({ name: ['prayerinfo', 'namazinfo'], category: 'info', desc: '.prayerinfo <city>', run: async (ctx) => {
    const c = ctx.args.join(' ') || 'Lahore';
    try {
      const d = await fetchJson(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(c)}&country=PK&method=1`);
      const t = d.data.timings;
      return `\ud83d\udd4c *${c}*\nFajr ${t.Fajr} | Dhuhr ${t.Dhuhr} | Asr ${t.Asr} | Maghrib ${t.Maghrib} | Isha ${t.Isha}`;
    } catch { return '\u274c Prayer times fail.'; }
  } });
  def({ name: ['currencyinfo', 'forex'], category: 'info', desc: '.currencyinfo <from> <to>', run: async (ctx) => {
    const from = (ctx.args[0] || 'USD').toUpperCase();
    const to = (ctx.args[1] || 'PKR').toUpperCase();
    try {
      const d = await fetchJson(`https://api.exchangerate-api.com/v4/latest/${from}`);
      return `\ud83d\udcb1 1 ${from} = *${d.rates[to]} ${to}*`;
    } catch { return '\u274c Rate fail.'; }
  } });
  def({ name: ['wiki2', 'wikipedia2'], category: 'info', desc: '.wiki2 <topic>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Topic dein.';
    try {
      const d = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      return `\ud83d\udcd6 *${d.title}*\n${(d.extract || '').slice(0, 700)}`;
    } catch { return '\u274c Topic nahi mila.'; }
  } });
  def({ name: ['define2', 'meaning2'], category: 'info', desc: '.define2 <word>', run: async (ctx) => {
    const w = ctx.args[0];
    if (!w) return '\u274c Word dein.';
    try {
      const d = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      const m = d[0].meanings[0];
      return `\ud83d\udcd6 *${w}* (${m.partOfSpeech})\n${m.definitions[0].definition}`;
    } catch { return '\u274c Word nahi mila.'; }
  } });
  def({ name: ['translate2', 'tr2'], category: 'info', desc: '.translate2 <lang> <text>', run: async (ctx) => {
    const lang = ctx.args[0] || 'ur';
    const text = ctx.args.slice(1).join(' ');
    if (!text) return '\u274c Misal: `.translate2 ur hello`';
    try {
      const d = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`);
      return `\ud83c\udf10 ${d.responseData.translatedText}`;
    } catch { return '\u274c Translation fail.'; }
  } });

  bulk(defMany, 'info', [
    { names: ['info2', 'botinfo2'], desc: 'Bot info', replies: ['\ud83e\udd16 Bot: wagateway pairing system.'] },
    { names: ['server', 'serverstatus'], desc: 'Server', replies: ['\ud83d\udda5\ufe0f Server: Railway cloud.'] },
    { names: ['uptime2', 'botuptime'], desc: 'Uptime', replies: ['\u23f1\ufe0f Uptime `.uptime` se dekhein.'] },
    { names: ['ping2', 'latency2'], desc: 'Ping', replies: ['\ud83c\udfd3 Pong!'] },
    { names: ['status2', 'botstatus'], desc: 'Status', replies: ['\u2705 Bot online hai.'] },
    { names: ['help2', 'helpm'], desc: 'Help', replies: ['\ud83d\udcda `.menu` se poori list dekhein.'] },
    { names: ['about2', 'aboutbot'], desc: 'About', replies: ['\ud83e\udd16 *SAQIB MD* \u2014 WhatsApp automation bot.'] },
    { names: ['version2', 'botversion'], desc: 'Version', replies: ['\ud83d\udce6 Version 2.0.0'] },
    { names: ['developer2', 'dev2'], desc: 'Developer', replies: ['\ud83d\udc68\u200d\ud83d\udcbb Developer: Saqib'] },
    { names: ['owner2', 'ownerinfo'], desc: 'Owner', replies: ['\ud83d\udc51 Owner: Saqib'] },
    { names: ['privacy', 'privacypolicy'], desc: 'Privacy', replies: ['\ud83d\udd12 Aapka data safe hai.'] },
    { names: ['terms', 'tos'], desc: 'Terms', replies: ['\ud83d\udcdc Terms: fair use only.'] },
    { names: ['contact', 'contactus'], desc: 'Contact', replies: ['\ud83d\udce7 Contact: dashboard se.'] },
    { names: ['support', 'support2'], desc: 'Support', replies: ['\ud83e\udd1d Support: dashboard help.'] },
    { names: ['faq', 'faq2'], desc: 'FAQ', replies: ['\u2753 FAQ: `.help` dekhein.'] },
    { names: ['changelog', 'changes'], desc: 'Changelog', replies: ['\ud83d\udcdd Changelog: v2.0.0 \u2014 1800+ commands.'] },
    { names: ['credits', 'credit'], desc: 'Credits', replies: ['\ud83d\udc4f Built with Baileys + Node.js.'] },
    { names: ['license', 'lic'], desc: 'License', replies: ['\ud83d\udcdc MIT License'] },
    { names: ['stats2', 'botstats2'], desc: 'Stats', replies: ['\ud83d\udcca Stats: dashboard.'] },
    { names: ['health', 'healthcheck'], desc: 'Health', replies: ['\ud83d\udc9a All systems operational.'] },
  ]);
};
