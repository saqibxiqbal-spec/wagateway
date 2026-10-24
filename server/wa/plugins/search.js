/** SEARCH: web, images, youtube, news, lyrics, apps. */

const { fetchJson } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({ name: ['google', 'search', 'websearch'], category: 'search', desc: '.google <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Query dein.';
    return `\ud83d\udd0d *${q}*\n\nhttps://www.google.com/search?q=${encodeURIComponent(q)}`;
  } });
  def({ name: ['bing', 'bingsearch'], category: 'search', desc: '.bing <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83d\udd0e *${q}*\nhttps://www.bing.com/search?q=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });
  def({ name: ['ddg', 'duckduckgo'], category: 'search', desc: '.ddg <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83e\udd86 *${q}*\nhttps://duckduckgo.com/?q=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });
  def({ name: ['youtube', 'yt', 'ytsearch'], category: 'search', desc: '.youtube <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\u25b6\ufe0f *${q}*\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });
  def({ name: ['ytvideo', 'ytlink'], category: 'search', desc: '.ytvideo <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\u25b6\ufe0f Video search: https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });
  def({ name: ['image', 'img', 'imagesearch'], category: 'search', desc: '.image <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83d\uddbc\ufe0f *${q}*\nhttps://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });
  def({ name: ['news', 'latestnews'], category: 'search', desc: '.news <topic>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83d\udcf0 *${q || 'Latest news'}*\nhttps://news.google.com/search?q=${encodeURIComponent(q || 'latest')}`;
  } });
  def({ name: ['wiki3', 'wikipedia3'], category: 'search', desc: '.wiki3 <topic>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Topic dein.';
    try {
      const d = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
      return `\ud83d\udcd6 *${d.title}*\n${(d.extract || '').slice(0, 800)}\n\n${d.content_urls?.desktop?.page || ''}`;
    } catch { return '\u274c Nahi mila.'; }
  } });
  def({ name: ['lyrics', 'songlyrics'], category: 'search', desc: '.lyrics <song>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83c\udfb5 *${q}* lyrics:\nhttps://www.google.com/search?q=${encodeURIComponent(q + ' lyrics')}` : '\u274c Song name dein.';
  } });
  def({ name: ['app', 'playstore', 'appsearch'], category: 'search', desc: '.app <name>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83d\udcf2 *${q}*\nhttps://play.google.com/store/search?q=${encodeURIComponent(q)}` : '\u274c App name dein.';
  } });
  def({ name: ['movie', 'moviesearch'], category: 'search', desc: '.movie <name>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83c\udfac *${q}*\nhttps://www.imdb.com/find?q=${encodeURIComponent(q)}` : '\u274c Movie name dein.';
  } });
  def({ name: ['recipe', 'recipes'], category: 'search', desc: '.recipe <dish>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83c\udf73 *${q}* recipe:\nhttps://www.google.com/search?q=${encodeURIComponent(q + ' recipe')}` : '\u274c Dish name dein.';
  } });
  def({ name: ['define3', 'dictionary2'], category: 'search', desc: '.define3 <word>', run: async (ctx) => {
    const w = ctx.args[0];
    if (!w) return '\u274c Word dein.';
    try {
      const d = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      const m = d[0].meanings[0];
      return `\ud83d\udcd6 *${w}* (${m.partOfSpeech})\n${m.definitions.slice(0, 3).map((x, i) => `${i + 1}. ${x.definition}`).join('\n')}`;
    } catch { return '\u274c Word nahi mila.'; }
  } });
  def({ name: ['translate3', 'tarjuma2'], category: 'search', desc: '.translate3 <lang> <text>', run: async (ctx) => {
    const lang = ctx.args[0] || 'ur';
    const text = ctx.args.slice(1).join(' ');
    if (!text) return '\u274c Misal: `.translate3 ur hello`';
    try {
      const d = await fetchJson(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`);
      return `\ud83c\udf10 *${lang.toUpperCase()}:* ${d.responseData.translatedText}`;
    } catch { return '\u274c Translation fail.'; }
  } });
  def({ name: ['map', 'maps', 'location'], category: 'search', desc: '.map <place>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83d\uddfa\ufe0f *${q}*\nhttps://www.google.com/maps/search/${encodeURIComponent(q)}` : '\u274c Place dein.';
  } });
  def({ name: ['flights', 'flightsearch'], category: 'search', desc: '.flights <from> <to>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\u2708\ufe0f Flights: https://www.google.com/travel/flights?q=${encodeURIComponent(q || 'flights')}`;
  } });
  def({ name: ['hotel', 'hotels'], category: 'search', desc: '.hotel <city>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83c\udfe8 Hotels in *${q || 'city'}*: https://www.google.com/travel/hotels/${encodeURIComponent(q || '')}`;
  } });
  def({ name: ['jobs', 'jobsearch'], category: 'search', desc: '.jobs <role>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83d\udcbc Jobs: https://www.google.com/search?q=${encodeURIComponent((q || 'jobs') + ' jobs')}`;
  } });
  def({ name: ['scholar', 'research'], category: 'search', desc: '.scholar <topic>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83c\udf93 Scholar: https://scholar.google.com/scholar?q=${encodeURIComponent(q || '')}`;
  } });
  def({ name: ['githubsearch', 'ghsearch'], category: 'search', desc: '.githubsearch <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83d\udc19 GitHub: https://github.com/search?q=${encodeURIComponent(q || '')}`;
  } });
  def({ name: ['npmsearch', 'npmfind'], category: 'search', desc: '.npmsearch <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83d\udce6 NPM: https://www.npmjs.com/search?q=${encodeURIComponent(q || '')}`;
  } });
  def({ name: ['stackoverflow', 'so'], category: 'search', desc: '.stackoverflow <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return `\ud83d\udc69\u200d\ud83d\udcbb StackOverflow: https://stackoverflow.com/search?q=${encodeURIComponent(q || '')}`;
  } });

  bulk(defMany, 'search', [
    { names: ['searchhelp', 'searchmenu'], desc: 'Search help', replies: ['\ud83d\udd0d `.google`, `.youtube`, `.image`, `.news`, `.wiki3`'] },
    { names: ['trending', 'trends'], desc: 'Trending', replies: ['\ud83d\udcc8 https://trends.google.com/trends/'] },
    { names: ['twitter', 'xsearch'], desc: 'Twitter search', replies: ['\ud83d\udc26 https://twitter.com/search'] },
    { names: ['reddit', 'redditsearch'], desc: 'Reddit', replies: ['\ud83d\udc7d https://www.reddit.com/search/'] },
    { names: ['pinterest', 'pinsearch'], desc: 'Pinterest', replies: ['\ud83d\udccc https://www.pinterest.com/search/'] },
    { names: ['instagram', 'igsearch'], desc: 'Instagram', replies: ['\ud83d\udcf8 https://www.instagram.com/explore/'] },
    { names: ['tiktok', 'ttsearch'], desc: 'TikTok', replies: ['\ud83c\udfb5 https://www.tiktok.com/search'] },
    { names: ['amazon', 'amazonsearch'], desc: 'Amazon', replies: ['\ud83d\uded2 https://www.amazon.com/s'] },
    { names: ['daraz', 'darazsearch'], desc: 'Daraz', replies: ['\ud83d\uded2 https://www.daraz.pk/catalog/'] },
    { names: ['olx', 'olxsearch'], desc: 'OLX', replies: ['\ud83d\udcb0 https://www.olx.com.pk/'] },
    { names: ['zameen', 'property'], desc: 'Property', replies: ['\ud83c\udfe0 https://www.zameen.com/'] },
    { names: ['pakwheels', 'cars'], desc: 'Cars', replies: ['\ud83d\ude97 https://www.pakwheels.com/'] },
    { names: ['dictionary', 'dict2'], desc: 'Dictionary', replies: ['\ud83d\udcd6 `.define3 <word>`'] },
    { names: ['thesaurus', 'synonyms'], desc: 'Synonyms', replies: ['\ud83d\udcdd https://www.thesaurus.com/'] },
    { names: ['antonyms', 'opposite'], desc: 'Antonyms', replies: ['\ud83d\udcdd https://www.thesaurus.com/browse/'] },
    { names: ['quotesearch', 'quote2'], desc: 'Quote search', replies: ['\ud83d\udcdd https://www.brainyquote.com/'] },
    { names: ['poem', 'poetry2'], desc: 'Poetry', replies: ['\ud83d\udcdd https://www.rekhta.org/'] },
    { names: ['book', 'books'], desc: 'Books', replies: ['\ud83d\udcd6 https://www.goodreads.com/'] },
    { names: ['imdb', 'imdbsearch'], desc: 'IMDb', replies: ['\ud83c\udfac https://www.imdb.com/'] },
    { names: ['wiki_ur', 'urduwiki'], desc: 'Urdu wiki', replies: ['\ud83d\udcd6 https://ur.wikipedia.org/'] },
  ]);
};
