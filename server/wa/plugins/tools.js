/** TOOLS: genuinely useful utilities that work without API keys. */

const crypto = require('crypto');
const { fetchJson, fetchText, pick, humanUptime } = require('./_util');

module.exports = (def, defMany) => {
  def({
    name: ['echo', 'say', 'repeat'],
    category: 'tools',
    desc: '.echo <text> \u2014 text repeat',
    run: async (ctx) => {
      if (!ctx.args.length) return '\u274c Misal: `.echo Hello world`';
      return ctx.args.join(' ');
    },
  });

  def({
    name: ['calc', 'math', 'calculate', 'eval'],
    category: 'tools',
    desc: '.calc 2+2 \u2014 hisaab',
    run: async (ctx) => {
      const expr = ctx.args.join(' ');
      if (!expr) return '\u274c Misal: `.calc 25*4`';
      if (!/^[\d\s+\-*/().%^]+$/.test(expr)) return '\u274c Sirf numbers aur + - * / ( ) allowed hain.';
      try {
        const safe = expr.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const val = Function(`"use strict";return (${safe})`)();
        return `\ud83e\uddee *${expr}* = *${val}*`;
      } catch {
        return '\u274c Expression theek nahi hai.';
      }
    },
  });

  def({
    name: ['uuid', 'guid'],
    category: 'tools',
    desc: 'Random UUID',
    run: async () => `\ud83c\udd94 \`${crypto.randomUUID()}\``,
  });

  def({
    name: ['password', 'passgen', 'genpass'],
    category: 'tools',
    desc: '.password [length] \u2014 strong password',
    run: async (ctx) => {
      const len = Math.min(Math.max(parseInt(ctx.args[0], 10) || 16, 6), 64);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
      let out = '';
      const buf = crypto.randomBytes(len);
      for (let i = 0; i < len; i += 1) out += chars[buf[i] % chars.length];
      return `\ud83d\udd10 *Password (${len})*\n\n\`${out}\``;
    },
  });

  def({
    name: ['randomstring', 'randstr', 'rs'],
    category: 'tools',
    desc: '.randomstring [length]',
    run: async (ctx) => {
      const len = Math.min(Math.max(parseInt(ctx.args[0], 10) || 10, 1), 128);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let out = '';
      const buf = crypto.randomBytes(len);
      for (let i = 0; i < len; i += 1) out += chars[buf[i] % chars.length];
      return `\ud83d\udd24 \`${out}\``;
    },
  });

  def({
    name: ['timestamp', 'ts', 'now'],
    category: 'tools',
    desc: 'Unix timestamp',
    run: async () => {
      const now = Date.now();
      return `\u23f1\ufe0f *Timestamp*\n\nSeconds: \`${Math.floor(now / 1000)}\`\nMillis: \`${now}\`\nISO: \`${new Date(now).toISOString()}\``;
    },
  });

  def({
    name: ['fromtimestamp', 'fromts'],
    category: 'tools',
    desc: '.fromtimestamp <secs> \u2014 date',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (!n) return '\u274c Misal: `.fromtimestamp 1700000000`';
      const d = new Date(n * 1000);
      return `\ud83d\udcc5 \`${n}\` = *${d.toUTCString()}*`;
    },
  });

  def({
    name: ['shorturl', 'shorten', 'tinyurl', 'isgd'],
    category: 'tools',
    desc: '.shorturl <link> \u2014 chhota link',
    run: async (ctx) => {
      const url = ctx.args[0];
      if (!url || !/^https?:\/\//i.test(url)) return '\u274c Misal: `.shorturl https://example.com/very/long`';
      try {
        const txt = await fetchText(
          `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`
        );
        return `\ud83d\udd17 *Short URL*\n\n${txt.trim()}`;
      } catch (e) {
        return `\u274c Shorten fail: ${e.message}`;
      }
    },
  });

  def({
    name: ['qr', 'qrcode', 'makeqr'],
    category: 'tools',
    desc: '.qr <text> \u2014 QR code image',
    run: async (ctx) => {
      const text = ctx.args.join(' ');
      if (!text) return '\u274c Misal: `.qr https://google.com`';
      const QRCode = require('qrcode');
      const buf = await QRCode.toBuffer(text, { margin: 1, width: 512 });
      await ctx.sock.sendMessage(ctx.chat, { image: buf, caption: `\ud83d\udd33 QR: ${text}` });
      return null;
    },
  });

  def({
    name: ['weather', 'mausam'],
    category: 'tools',
    desc: '.weather <city> \u2014 mausam',
    run: async (ctx) => {
      const city = ctx.args.join(' ') || 'Karachi';
      try {
        const txt = await fetchText(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const j = JSON.parse(txt);
        const cur = j.current_condition[0];
        return (
          `\ud83c\udf24\ufe0f *Weather \u2014 ${city}*\n\n` +
          `\ud83c\udf21\ufe0f Temp: *${cur.temp_C}\u00b0C* (feels ${cur.FeelsLikeC}\u00b0C)\n` +
          `\u2601\ufe0f ${cur.weatherDesc[0].value}\n` +
          `\ud83d\udca7 Humidity: ${cur.humidity}%\n` +
          `\ud83d\udca8 Wind: ${cur.windspeedKmph} km/h\n` +
          `\ud83d\udd0e Pressure: ${cur.pressure} hPa`
        );
      } catch (e) {
        return `\u274c Weather nahi mila (${e.message}). City ka naam check karein.`;
      }
    },
  });

  def({
    name: ['wiki', 'wikipedia', 'pedia'],
    category: 'tools',
    desc: '.wiki <topic> \u2014 Wikipedia summary',
    run: async (ctx) => {
      const q = ctx.args.join(' ');
      if (!q) return '\u274c Misal: `.wiki Pakistan`';
      try {
        const j = await fetchJson(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`
        );
        if (!j.extract) return `\u274c "${q}" ka page nahi mila.`;
        return `\ud83d\udcd6 *${j.title}*\n\n${j.extract}\n\n\ud83d\udd17 ${j.content_urls?.desktop?.page || ''}`;
      } catch {
        return `\u274c "${q}" ka page nahi mila. Spelling check karein.`;
      }
    },
  });

  def({
    name: ['define', 'dictionary', 'meaning', 'dict'],
    category: 'tools',
    desc: '.define <word> \u2014 English meaning',
    run: async (ctx) => {
      const w = ctx.args[0];
      if (!w) return '\u274c Misal: `.define serendipity`';
      try {
        const j = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
        const e = Array.isArray(j) ? j[0] : null;
        if (!e) return `\u274c "${w}" nahi mila.`;
        const m = e.meanings[0];
        const d = m.definitions[0];
        return (
          `\ud83d\udcda *${e.word}* ${e.phonetic || ''}\n\n` +
          `*${m.partOfSpeech}*\n${d.definition}` +
          (d.example ? `\n\n_Example:_ ${d.example}` : '')
        );
      } catch {
        return `\u274c "${w}" nahi mila.`;
      }
    },
  });

  def({
    name: ['translate', 'tr', 'tarjuma'],
    category: 'tools',
    desc: '.translate <lang> <text>',
    usage: '.translate ur Hello world',
    run: async (ctx) => {
      const lang = ctx.args[0];
      const text = ctx.args.slice(1).join(' ');
      if (!lang || !text) return '\u274c Misal: `.translate ur Hello world`';
      try {
        const j = await fetchJson(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${encodeURIComponent(lang)}`
        );
        const out = j?.responseData?.translatedText;
        if (!out) return '\u274c Translate fail.';
        return `\ud83c\udf10 *Translate (${lang})*\n\n${out}`;
      } catch (e) {
        return `\u274c Translate fail: ${e.message}`;
      }
    },
  });

  def({
    name: ['ip', 'ipinfo', 'myip', 'iplookup'],
    category: 'tools',
    desc: '.ip [address] \u2014 IP info',
    run: async (ctx) => {
      const addr = ctx.args[0] || '';
      try {
        const j = await fetchJson(`http://ip-api.com/json/${encodeURIComponent(addr)}`);
        if (j.status !== 'success') return '\u274c IP nahi mila.';
        return (
          `\ud83c\udf10 *IP Info*\n\n` +
          `\ud83d\udcf1 IP: \`${j.query}\`\n` +
          `\ud83c\udf0d Country: ${j.country} (${j.countryCode})\n` +
          `\ud83c\udfd9\ufe0f City: ${j.city || '-'}\n` +
          `\ud83d\udccd Region: ${j.regionName || '-'}\n` +
          `\ud83d\udcf6 ISP: ${j.isp || '-'}\n` +
          `\ud83d\udee9\ufe0f Timezone: ${j.timezone || '-'}`
        );
      } catch (e) {
        return `\u274c IP lookup fail: ${e.message}`;
      }
    },
  });

  def({
    name: ['base64', 'b64', 'tobase64'],
    category: 'tools',
    desc: '.base64 <text> \u2014 encode',
    run: async (ctx) => {
      const t = ctx.args.join(' ');
      if (!t) return '\u274c Misal: `.base64 hello`';
      return `\ud83d\udd10 \`${Buffer.from(t).toString('base64')}\``;
    },
  });

  def({
    name: ['unbase64', 'frombase64', 'b64decode'],
    category: 'tools',
    desc: '.unbase64 <b64> \u2014 decode',
    run: async (ctx) => {
      const t = ctx.args.join(' ');
      if (!t) return '\u274c Misal: `.unbase64 aGVsbG8=`';
      try {
        return `\ud83d\udd13 \`${Buffer.from(t, 'base64').toString('utf8')}\``;
      } catch {
        return '\u274c Invalid base64.';
      }
    },
  });

  def({
    name: ['urlencode', 'urlenc'],
    category: 'tools',
    desc: '.urlencode <text>',
    run: async (ctx) => `\ud83d\udd17 \`${encodeURIComponent(ctx.args.join(' '))}\``,
  });

  def({
    name: ['urldecode', 'urldec'],
    category: 'tools',
    desc: '.urldecode <text>',
    run: async (ctx) => {
      try {
        return `\ud83d\udd17 \`${decodeURIComponent(ctx.args.join(' '))}\``;
      } catch {
        return '\u274c Invalid encoding.';
      }
    },
  });

  def({
    name: ['hex', 'tohex', 'hexencode'],
    category: 'tools',
    desc: '.hex <text> \u2014 hex encode',
    run: async (ctx) => `\ud83d\udd22 \`${Buffer.from(ctx.args.join(' ')).toString('hex')}\``,
  });

  def({
    name: ['unhex', 'fromhex', 'hexdecode'],
    category: 'tools',
    desc: '.unhex <hex> \u2014 hex decode',
    run: async (ctx) => {
      const t = ctx.args.join(' ').replace(/\s+/g, '');
      if (!/^[0-9a-fA-F]+$/.test(t) || t.length % 2) return '\u274c Invalid hex.';
      return `\ud83d\udd22 \`${Buffer.from(t, 'hex').toString('utf8')}\``;
    },
  });

  def({
    name: ['binary', 'tobinary', 'bin'],
    category: 'tools',
    desc: '.binary <text> \u2014 binary encode',
    run: async (ctx) =>
      `\ud83d\udcbb \`${[...Buffer.from(ctx.args.join(' '))].map((b) => b.toString(2).padStart(8, '0')).join(' ')}\``,
  });

  def({
    name: ['unbinary', 'frombinary'],
    category: 'tools',
    desc: '.unbinary <bits> \u2014 binary decode',
    run: async (ctx) => {
      const bits = ctx.args.join(' ').split(/\s+/).filter(Boolean);
      if (!bits.length || bits.some((b) => !/^[01]{8}$/.test(b))) return '\u274c 8-bit binary likhein.';
      return `\ud83d\udcbb \`${Buffer.from(bits.map((b) => parseInt(b, 2))).toString('utf8')}\``;
    },
  });

  def({
    name: ['morse', 'tomorse'],
    category: 'tools',
    desc: '.morse <text> \u2014 Morse code',
    run: async (ctx) => {
      const map = {
        a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
        i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
        q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
        y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
        5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
      };
      const out = [...ctx.args.join(' ').toLowerCase()]
        .map((c) => (c === ' ' ? '/' : map[c] || ''))
        .filter(Boolean)
        .join(' ');
      return `\ud83d\udce1 \`${out || '-'}\``;
    },
  });

  def({
    name: ['len', 'length', 'charcount'],
    category: 'tools',
    desc: '.len <text> \u2014 characters count',
    run: async (ctx) => {
      const t = ctx.args.join(' ');
      if (!t) return '\u274c Text likhein.';
      return `\ud83d\udcdd Characters: *${t.length}*\n\ud83d\udd24 Words: *${t.split(/\s+/).filter(Boolean).length}*`;
    },
  });

  def({
    name: ['wordcount', 'wc'],
    category: 'tools',
    desc: '.wordcount <text>',
    run: async (ctx) => {
      const t = ctx.args.join(' ');
      const words = t.split(/\s+/).filter(Boolean);
      return `\ud83d\udcdd Words: *${words.length}*\n\ud83d\udd24 Characters: *${t.length}*\n\ud83d\udcc4 Lines: *${t.split('\n').length}*`;
    },
  });

  def({
    name: ['upper', 'uppercase', 'toupper'],
    category: 'tools',
    desc: '.upper <text>',
    run: async (ctx) => ctx.args.join(' ').toUpperCase() || '\u274c Text likhein.',
  });

  def({
    name: ['lower', 'lowercase', 'tolower'],
    category: 'tools',
    desc: '.lower <text>',
    run: async (ctx) => ctx.args.join(' ').toLowerCase() || '\u274c Text likhein.',
  });

  def({
    name: ['titlecase', 'titletext'],
    category: 'tools',
    desc: '.title <text>',
    run: async (ctx) =>
      ctx.args.join(' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) ||
      '\u274c Text likhein.',
  });

  def({
    name: ['capitalize', 'cap'],
    category: 'tools',
    desc: '.capitalize <text>',
    run: async (ctx) => {
      const t = ctx.args.join(' ');
      return t ? t[0].toUpperCase() + t.slice(1) : '\u274c Text likhein.';
    },
  });

  def({
    name: ['reverse', 'rev'],
    category: 'tools',
    desc: '.reverse <text>',
    run: async (ctx) => [...ctx.args.join(' ')].reverse().join('') || '\u274c Text likhein.',
  });

  def({
    name: ['trim', 'cleantext'],
    category: 'tools',
    desc: '.trim <text>',
    run: async (ctx) => ctx.args.join(' ').trim() || '\u274c Text likhein.',
  });

  def({
    name: ['slug', 'slugify'],
    category: 'tools',
    desc: '.slug <text> \u2014 URL slug',
    run: async (ctx) => {
      const s = ctx.args
        .join(' ')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return `\ud83d\udd17 \`${s || '-'}\``;
    },
  });

  def({
    name: ['camel', 'camelcase'],
    category: 'tools',
    desc: '.camel <text>',
    run: async (ctx) => {
      const parts = ctx.args.join(' ').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      return `\ud83d\udc2b \`${parts.map((p, i) => (i ? p[0].toUpperCase() + p.slice(1) : p)).join('') || '-'}\``;
    },
  });

  def({
    name: ['snake', 'snakecase'],
    category: 'tools',
    desc: '.snake <text>',
    run: async (ctx) => {
      const s = ctx.args.join(' ').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return `\ud83d\udc0d \`${s || '-'}\``;
    },
  });

  def({
    name: ['kebab', 'kebabcase'],
    category: 'tools',
    desc: '.kebab <text>',
    run: async (ctx) => {
      const s = ctx.args.join(' ').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `\ud83c\udf5e \`${s || '-'}\``;
    },
  });

  def({
    name: ['swapcase', 'swap'],
    category: 'tools',
    desc: '.swapcase <text>',
    run: async (ctx) =>
      [...ctx.args.join(' ')].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('') ||
      '\u274c Text likhein.',
  });

  def({
    name: ['repeat_text', 'multiply'],
    category: 'tools',
    desc: '.repeat <n> <text>',
    run: async (ctx) => {
      const n = Math.min(parseInt(ctx.args[0], 10) || 1, 50);
      const t = ctx.args.slice(1).join(' ');
      if (!t) return '\u274c Misal: `.repeat 3 hi`';
      return t.repeat(n);
    },
  });

  def({
    name: ['pwdcheck', 'passwordstrength'],
    category: 'tools',
    desc: '.pwdcheck <password>',
    run: async (ctx) => {
      const p = ctx.args.join(' ');
      if (!p) return '\u274c Password likhein.';
      let score = 0;
      if (p.length >= 8) score += 1;
      if (p.length >= 12) score += 1;
      if (/[a-z]/.test(p)) score += 1;
      if (/[A-Z]/.test(p)) score += 1;
      if (/\d/.test(p)) score += 1;
      if (/[^A-Za-z0-9]/.test(p)) score += 1;
      const label = ['Bohat kamzor', 'Kamzor', 'Theek', 'Acha', 'Strong', 'Bohat strong'][Math.min(score, 5)];
      return `\ud83d\udd10 *Strength:* ${label}\n\u2b50 Score: *${score}/6*\n\ud83d\udcdd Length: ${p.length}`;
    },
  });

  def({
    name: ['color', 'colorinfo', 'hexcolor'],
    category: 'tools',
    desc: '.color #ff0000 \u2014 color info',
    run: async (ctx) => {
      const hex = (ctx.args[0] || '').replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '\u274c Misal: `.color #ff0000`';
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `\ud83c\udfa8 *#${hex.toUpperCase()}*\n\nRGB: \`rgb(${r}, ${g}, ${b})\`\nHEX: \`#${hex}\``;
    },
  });

  def({
    name: ['rgb2hex', 'rgbtohex'],
    category: 'tools',
    desc: '.rgb2hex 255 0 0',
    run: async (ctx) => {
      const [r, g, b] = ctx.args.map((x) => Math.min(Math.max(parseInt(x, 10) || 0, 0), 255));
      const hex = [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
      return `\ud83c\udfa8 \`#${hex.toUpperCase()}\``;
    },
  });

  def({
    name: ['hex2rgb', 'hextorgb'],
    category: 'tools',
    desc: '.hex2rgb #ff0000',
    run: async (ctx) => {
      const hex = (ctx.args[0] || '').replace('#', '');
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '\u274c Misal: `.hex2rgb #ff0000`';
      return `\ud83c\udfa8 \`rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})\``;
    },
  });

  def({
    name: ['ascii', 'toascii'],
    category: 'tools',
    desc: '.ascii <char> \u2014 ASCII code',
    run: async (ctx) => {
      const c = ctx.args.join(' ')[0];
      if (!c) return '\u274c Ek character likhein.';
      return `\ud83d\udd24 \`${c}\` = *${c.charCodeAt(0)}*`;
    },
  });

  def({
    name: ['fromascii', 'ascii2char'],
    category: 'tools',
    desc: '.fromascii 65',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (!n) return '\u274c Misal: `.fromascii 65`';
      return `\ud83d\udd24 *${n}* = \`${String.fromCharCode(n)}\``;
    },
  });

  def({
    name: ['sort', 'sortlines'],
    category: 'tools',
    desc: '.sort <lines> \u2014 sort text',
    run: async (ctx) => {
      const lines = ctx.args.join(' ').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return '\u274c Text likhein (comma se alag).';
      return lines.sort().map((l, i) => `${i + 1}. ${l}`).join('\n');
    },
  });

  def({
    name: ['unique', 'dedupe'],
    category: 'tools',
    desc: '.unique <items>',
    run: async (ctx) => {
      const items = ctx.args.join(' ').split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      return [...new Set(items)].join('\n') || '\u274c Text likhein.';
    },
  });

  def({
    name: ['split', 'chunk'],
    category: 'tools',
    desc: '.split <n> <text>',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10) || 10;
      const t = ctx.args.slice(1).join(' ');
      if (!t) return '\u274c Misal: `.split 5 abcdefghij`';
      const out = [];
      for (let i = 0; i < t.length; i += n) out.push(t.slice(i, i + n));
      return out.map((s, i) => `${i + 1}. \`${s}\``).join('\n');
    },
  });

  def({
    name: ['prayer', 'namaz', 'salah'],
    category: 'tools',
    desc: '.prayer <city> \u2014 namaz timings',
    run: async (ctx) => {
      const city = ctx.args.join(' ') || 'Karachi';
      try {
        const j = await fetchJson(
          `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=PK&method=1`
        );
        const t = j.data.timings;
        return (
          `\ud83d\udd4c *Namaz Timings \u2014 ${city}*\n\n` +
          `\ud83c\udf05 Fajr: *${t.Fajr}*\n` +
          `\u2600\ufe0f Dhuhr: *${t.Dhuhr}*\n` +
          `\ud83c\udf24\ufe0f Asr: *${t.Asr}*\n` +
          `\ud83c\udf07 Maghrib: *${t.Maghrib}*\n` +
          `\ud83c\udf19 Isha: *${t.Isha}*`
        );
      } catch (e) {
        return `\u274c Timings nahi mili: ${e.message}`;
      }
    },
  });

  def({
    name: ['qibla', 'qibladirection'],
    category: 'tools',
    desc: '.qibla <lat> <lon> \u2014 Qibla direction',
    run: async (ctx) => {
      const lat = parseFloat(ctx.args[0]);
      const lon = parseFloat(ctx.args[1]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return '\u274c Misal: `.qibla 24.86 67.00`';
      const kLat = (21.4225 * Math.PI) / 180;
      const kLon = (39.8262 * Math.PI) / 180;
      const la = (lat * Math.PI) / 180;
      const lo = (lon * Math.PI) / 180;
      const y = Math.sin(kLon - lo);
      const x = Math.cos(la) * Math.tan(kLat) - Math.sin(la) * Math.cos(kLon - lo);
      let deg = (Math.atan2(y, x) * 180) / Math.PI;
      deg = (deg + 360) % 360;
      return `\ud83d\udd4c *Qibla Direction*\n\n\ud83d\udccd ${lat}, ${lon}\n\ud83e\udded *${deg.toFixed(1)}\u00b0* from North`;
    },
  });

  def({
    name: ['agecalc', 'dob'],
    category: 'tools',
    desc: '.agecalc 2000-01-15 \u2014 umar',
    run: async (ctx) => {
      const d = new Date(ctx.args[0]);
      if (Number.isNaN(d.getTime())) return '\u274c Misal: `.agecalc 2000-01-15`';
      const now = new Date();
      let years = now.getFullYear() - d.getFullYear();
      let months = now.getMonth() - d.getMonth();
      let days = now.getDate() - d.getDate();
      if (days < 0) {
        months -= 1;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      const totalDays = Math.floor((now - d) / 86400000);
      return `\ud83c\udf82 *Age*\n\n\u2705 ${years} years, ${months} months, ${days} days\n\ud83d\udcc5 Total days: *${totalDays}*`;
    },
  });

  def({
    name: ['daysbetween', 'datediff'],
    category: 'tools',
    desc: '.daysbetween 2024-01-01 2024-12-31',
    run: async (ctx) => {
      const a = new Date(ctx.args[0]);
      const b = new Date(ctx.args[1]);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '\u274c Do tareekhein dein.';
      const d = Math.round(Math.abs(b - a) / 86400000);
      return `\ud83d\udcc5 *Difference:* *${d}* days`;
    },
  });

  def({
    name: ['bmi'],
    category: 'tools',
    desc: '.bmi <kg> <cm>',
    run: async (ctx) => {
      const w = parseFloat(ctx.args[0]);
      const h = parseFloat(ctx.args[1]) / 100;
      if (!w || !h) return '\u274c Misal: `.bmi 70 175`';
      const bmi = w / (h * h);
      const label = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
      return `\u2696\ufe0f *BMI:* *${bmi.toFixed(1)}* \u2014 ${label}`;
    },
  });

  def({
    name: ['tipcalc', 'bill'],
    category: 'tools',
    desc: '.tipcalc <bill> <percent>',
    run: async (ctx) => {
      const bill = parseFloat(ctx.args[0]);
      const pct = parseFloat(ctx.args[1]) || 10;
      if (!bill) return '\u274c Misal: `.tipcalc 1000 15`';
      const tip = (bill * pct) / 100;
      return `\ud83d\udcb0 *Bill:* ${bill}\n\ud83d\udc64 *Tip (${pct}%):* ${tip.toFixed(2)}\n\u2705 *Total:* ${(bill + tip).toFixed(2)}`;
    },
  });

  def({
    name: ['emi', 'loan'],
    category: 'tools',
    desc: '.emi <principal> <rate> <months>',
    run: async (ctx) => {
      const p = parseFloat(ctx.args[0]);
      const r = parseFloat(ctx.args[1]) / 12 / 100;
      const n = parseFloat(ctx.args[2]);
      if (!p || !r || !n) return '\u274c Misal: `.emi 100000 12 24`';
      const emi = (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
      return `\ud83c\udfe6 *EMI:* *${emi.toFixed(2)}* / month\n\ud83d\udcb8 Total: ${(emi * n).toFixed(2)}\n\ud83d\udcc8 Interest: ${(emi * n - p).toFixed(2)}`;
    },
  });

  def({
    name: ['percent', 'pct', 'percentage'],
    category: 'tools',
    desc: '.percent <part> <total>',
    run: async (ctx) => {
      const a = parseFloat(ctx.args[0]);
      const b = parseFloat(ctx.args[1]);
      if (!b) return '\u274c Misal: `.percent 25 200`';
      return `\ud83d\udcca *${((a / b) * 100).toFixed(2)}%*`;
    },
  });

  def({
    name: ['discount', 'sale'],
    category: 'tools',
    desc: '.discount <price> <percent>',
    run: async (ctx) => {
      const p = parseFloat(ctx.args[0]);
      const d = parseFloat(ctx.args[1]);
      if (!p || !d) return '\u274c Misal: `.discount 2000 20`';
      const off = (p * d) / 100;
      return `\ud83c\udff7\ufe0f *Discount:* ${off.toFixed(2)}\n\ud83d\udcb0 *Final:* ${(p - off).toFixed(2)}`;
    },
  });

  def({
    name: ['gst', 'tax'],
    category: 'tools',
    desc: '.gst <amount> [percent]',
    run: async (ctx) => {
      const a = parseFloat(ctx.args[0]);
      const r = parseFloat(ctx.args[1]) || 17;
      if (!a) return '\u274c Misal: `.gst 1000 17`';
      const t = (a * r) / 100;
      return `\ud83e\uddfe *Tax (${r}%):* ${t.toFixed(2)}\n\u2705 *Total:* ${(a + t).toFixed(2)}`;
    },
  });

  def({
    name: ['zakat'],
    category: 'tools',
    desc: '.zakat <amount> \u2014 2.5%',
    run: async (ctx) => {
      const a = parseFloat(ctx.args[0]);
      if (!a) return '\u274c Misal: `.zakat 100000`';
      return `\ud83d\udd4c *Zakat (2.5%)*\n\n\ud83d\udcb0 Amount: ${a}\n\u2705 Zakat: *${(a * 0.025).toFixed(2)}*`;
    },
  });

  def({
    name: ['savings', 'savecalc'],
    category: 'tools',
    desc: '.savings <monthly> <months>',
    run: async (ctx) => {
      const m = parseFloat(ctx.args[0]);
      const n = parseFloat(ctx.args[1]);
      if (!m || !n) return '\u274c Misal: `.savings 5000 12`';
      return `\ud83d\udc37 *Savings:* *${(m * n).toFixed(2)}* in ${n} months`;
    },
  });

  def({
    name: ['fuel', 'fuelcost'],
    category: 'tools',
    desc: '.fuel <km> <kmpl> <price>',
    run: async (ctx) => {
      const km = parseFloat(ctx.args[0]);
      const kmpl = parseFloat(ctx.args[1]);
      const price = parseFloat(ctx.args[2]);
      if (!km || !kmpl || !price) return '\u274c Misal: `.fuel 300 15 280`';
      const litres = km / kmpl;
      return `\u26fd *Fuel*\n\nLitres: *${litres.toFixed(2)}*\nCost: *${(litres * price).toFixed(2)}*`;
    },
  });

  def({
    name: ['avgspeed', 'speedcalc'],
    category: 'tools',
    desc: '.avgspeed <km> <hours>',
    run: async (ctx) => {
      const d = parseFloat(ctx.args[0]);
      const t = parseFloat(ctx.args[1]);
      if (!d || !t) return '\u274c Misal: `.avgspeed 120 2`';
      return `\ud83d\ude97 *Average speed:* *${(d / t).toFixed(1)} km/h*`;
    },
  });

  def({
    name: ['sha256'],
    category: 'tools',
    desc: '.sha256 <text>',
    run: async (ctx) =>
      `\ud83d\udd10 \`${crypto.createHash('sha256').update(ctx.args.join(' ')).digest('hex')}\``,
  });

  def({
    name: ['md5'],
    category: 'tools',
    desc: '.md5 <text>',
    run: async (ctx) => `\ud83d\udd10 \`${crypto.createHash('md5').update(ctx.args.join(' ')).digest('hex')}\``,
  });

  def({
    name: ['sha1'],
    category: 'tools',
    desc: '.sha1 <text>',
    run: async (ctx) => `\ud83d\udd10 \`${crypto.createHash('sha1').update(ctx.args.join(' ')).digest('hex')}\``,
  });

  def({
    name: ['sha512'],
    category: 'tools',
    desc: '.sha512 <text>',
    run: async (ctx) => `\ud83d\udd10 \`${crypto.createHash('sha512').update(ctx.args.join(' ')).digest('hex')}\``,
  });

  def({
    name: ['hmac'],
    category: 'tools',
    desc: '.hmac <key> <text>',
    run: async (ctx) => {
      const [key, ...rest] = ctx.args;
      if (!key || !rest.length) return '\u274c Misal: `.hmac secret hello`';
      return `\ud83d\udd10 \`${crypto.createHmac('sha256', key).update(rest.join(' ')).digest('hex')}\``;
    },
  });

  def({
    name: ['jwtdecode', 'jwt'],
    category: 'tools',
    desc: '.jwtdecode <token>',
    run: async (ctx) => {
      const t = ctx.args[0];
      if (!t) return '\u274c Token dein.';
      const parts = t.split('.');
      if (parts.length < 2) return '\u274c Invalid JWT.';
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return `\ud83d\udd11 *JWT Payload*\n\n\`\`\`${JSON.stringify(payload, null, 2)}\`\`\``;
      } catch {
        return '\u274c Decode fail.';
      }
    },
  });

  def({
    name: ['jsonformat', 'pretty'],
    category: 'tools',
    desc: '.json <text> \u2014 format JSON',
    run: async (ctx) => {
      try {
        return `\ud83d\udcc4 \`\`\`${JSON.stringify(JSON.parse(ctx.args.join(' ')), null, 2)}\`\`\``;
      } catch {
        return '\u274c Invalid JSON.';
      }
    },
  });

  def({
    name: ['jsonmin', 'minify'],
    category: 'tools',
    desc: '.jsonmin <text>',
    run: async (ctx) => {
      try {
        return `\ud83d\udcc4 \`${JSON.stringify(JSON.parse(ctx.args.join(' ')))}\``;
      } catch {
        return '\u274c Invalid JSON.';
      }
    },
  });

  def({
    name: ['img2b64', 'base64image'],
    category: 'tools',
    desc: 'Image par reply karke \u2014 base64',
    run: async (ctx) => {
      const { anyMediaBuffer } = require('./_util');
      const buf = await anyMediaBuffer(ctx);
      if (!buf) return '\u274c Image par reply karein.';
      const b64 = buf.toString('base64');
      return `\ud83d\uddbc\ufe0f *Base64* (${Math.round(b64.length / 1024)} KB)\n\n\`data:image/jpeg;base64,${b64.slice(0, 200)}\u2026\``;
    },
  });

  def({
    name: ['stats', 'botstats', 'sysinfo'],
    category: 'tools',
    desc: 'System stats',
    run: async () => {
      const m = process.memoryUsage();
      const cpus = require('os').cpus().length;
      return (
        `\ud83d\udcca *System Stats*\n\n` +
        `\u23f1\ufe0f Uptime: ${humanUptime()}\n` +
        `\ud83d\udcbe RSS: ${(m.rss / 1024 / 1024).toFixed(1)} MB\n` +
        `\ud83d\udcc8 Heap: ${(m.heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
        `\u2699\ufe0f CPUs: ${cpus}\n` +
        `\ud83d\udda5\ufe0f Platform: ${process.platform} ${process.arch}\n` +
        `\ud83d\udce6 Node: ${process.version}`
      );
    },
  });

  def({
    name: ['load', 'loadavg'],
    category: 'tools',
    desc: 'Load average',
    run: async () => {
      const l = require('os').loadavg().map((x) => x.toFixed(2));
      return `\ud83d\udcc8 *Load Average*\n\n1m: ${l[0]}\n5m: ${l[1]}\n15m: ${l[2]}`;
    },
  });

  def({
    name: ['disk', 'diskspace'],
    category: 'tools',
    desc: 'Disk space',
    run: async () => {
      try {
        const fs = require('fs');
        const s = fs.statfsSync('/');
        const total = s.blocks * s.bsize;
        const free = s.bavail * s.bsize;
        const { bytes } = require('./_util');
        return `\ud83d\udcbe *Disk*\n\nTotal: ${bytes(total)}\nFree: ${bytes(free)}\nUsed: ${bytes(total - free)}`;
      } catch {
        return '\u274c Disk info nahi mili.';
      }
    },
  });

  def({
    name: ['env', 'envcheck'],
    category: 'tools',
    desc: 'Environment check',
    run: async () =>
      `\u2699\ufe0f *Environment*\n\nNODE_ENV: \`${process.env.NODE_ENV || 'development'}\`\nTZ: \`${process.env.TZ || 'UTC'}\`\nPID: \`${process.pid}\``,
  });

  def({
    name: ['randemoji', 'emoji_random'],
    category: 'tools',
    desc: 'Random emoji',
    run: async () =>
      `\ud83c\udfb2 ${pick(['\ud83d\ude00', '\ud83d\ude0e', '\ud83e\udd29', '\ud83d\udd25', '\u2b50', '\ud83c\udf89', '\ud83d\udc96', '\ud83c\udf08', '\ud83e\udd84', '\ud83d\ude80'])}`,
  });

  def({
    name: ['choice', 'choose'],
    category: 'tools',
    desc: '.choice a b c \u2014 random pick',
    run: async (ctx) => {
      const items = ctx.args.join(' ').split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      if (items.length < 2) return '\u274c Kam az kam 2 options dein (comma se alag).';
      return `\ud83c\udfaf *Chosen:* *${pick(items)}*`;
    },
  });

  def({
    name: ['shuffle', 'randomize'],
    category: 'tools',
    desc: '.shuffle a,b,c',
    run: async (ctx) => {
      const items = ctx.args.join(' ').split(/[,|]/).map((s) => s.trim()).filter(Boolean);
      if (!items.length) return '\u274c Items dein.';
      for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items.map((x, i) => `${i + 1}. ${x}`).join('\n');
    },
  });

  def({
    name: ['numwords', 'numbertowords'],
    category: 'tools',
    desc: '.numwords 1234',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (Number.isNaN(n)) return '\u274c Number dein.';
      const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
      const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      const toWords = (x) => {
        if (x < 20) return ones[x];
        if (x < 100) return tens[Math.floor(x / 10)] + (x % 10 ? '-' + ones[x % 10] : '');
        if (x < 1000) return ones[Math.floor(x / 100)] + ' hundred' + (x % 100 ? ' ' + toWords(x % 100) : '');
        if (x < 1000000) return toWords(Math.floor(x / 1000)) + ' thousand' + (x % 1000 ? ' ' + toWords(x % 1000) : '');
        return String(x);
      };
      return `\ud83d\udd24 *${n}* = ${toWords(n)}`;
    },
  });

  def({
    name: ['roman', 'toroman'],
    category: 'tools',
    desc: '.roman 2024',
    run: async (ctx) => {
      let n = parseInt(ctx.args[0], 10);
      if (!n || n < 1 || n > 3999) return '\u274c 1-3999 ke darmiyan number dein.';
      const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let out = '';
      for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
      return `\ud83c\udffa \`${out}\``;
    },
  });

  def({
    name: ['factorial', 'fact'],
    category: 'tools',
    desc: '.factorial 5',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (!n || n < 0 || n > 170) return '\u274c 0-170 ke darmiyan number dein.';
      let r = 1n;
      for (let i = 2n; i <= BigInt(n); i += 1n) r *= i;
      return `\ud83e\uddee *${n}!* = \`${r}\``;
    },
  });

  def({
    name: ['fibonacci', 'fib'],
    category: 'tools',
    desc: '.fib 10',
    run: async (ctx) => {
      const n = Math.min(parseInt(ctx.args[0], 10) || 10, 100);
      const a = [0, 1];
      for (let i = 2; i < n; i += 1) a.push(a[i - 1] + a[i - 2]);
      return `\ud83d\udd22 ${a.slice(0, n).join(', ')}`;
    },
  });

  def({
    name: ['prime', 'isprime'],
    category: 'tools',
    desc: '.prime 17',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (!n || n < 2) return '\u274c Number > 1 dein.';
      for (let i = 2; i * i <= n; i += 1) if (n % i === 0) return `\u274c *${n}* prime nahi hai (${i} \u00d7 ${n / i}).`;
      return `\u2705 *${n}* prime hai.`;
    },
  });

  def({
    name: ['gcd', 'hcf'],
    category: 'tools',
    desc: '.gcd 12 18',
    run: async (ctx) => {
      let a = Math.abs(parseInt(ctx.args[0], 10));
      let b = Math.abs(parseInt(ctx.args[1], 10));
      if (!a || !b) return '\u274c Do numbers dein.';
      while (b) [a, b] = [b, a % b];
      return `\ud83e\uddee *GCD:* *${a}*`;
    },
  });

  def({
    name: ['lcm'],
    category: 'tools',
    desc: '.lcm 12 18',
    run: async (ctx) => {
      const a = Math.abs(parseInt(ctx.args[0], 10));
      const b = Math.abs(parseInt(ctx.args[1], 10));
      if (!a || !b) return '\u274c Do numbers dein.';
      let x = a;
      let y = b;
      while (y) [x, y] = [y, x % y];
      return `\ud83e\uddee *LCM:* *${(a * b) / x}*`;
    },
  });

  def({
    name: ['sqrt', 'squareroot'],
    category: 'tools',
    desc: '.sqrt 144',
    run: async (ctx) => {
      const n = parseFloat(ctx.args[0]);
      if (n < 0 || Number.isNaN(n)) return '\u274c Positive number dein.';
      return `\u221a${n} = *${Math.sqrt(n)}*`;
    },
  });

  def({
    name: ['pow', 'power'],
    category: 'tools',
    desc: '.pow 2 10',
    run: async (ctx) => {
      const a = parseFloat(ctx.args[0]);
      const b = parseFloat(ctx.args[1]);
      if (Number.isNaN(a) || Number.isNaN(b)) return '\u274c Do numbers dein.';
      return `\ud83e\uddee ${a}^${b} = *${a ** b}*`;
    },
  });

  def({
    name: ['log10', 'log'],
    category: 'tools',
    desc: '.log 1000',
    run: async (ctx) => {
      const n = parseFloat(ctx.args[0]);
      if (!n || n <= 0) return '\u274c Positive number dein.';
      return `\ud83e\uddee log10(${n}) = *${Math.log10(n)}*`;
    },
  });

  def({
    name: ['ln'],
    category: 'tools',
    desc: '.ln <n>',
    run: async (ctx) => {
      const n = parseFloat(ctx.args[0]);
      if (!n || n <= 0) return '\u274c Positive number dein.';
      return `\ud83e\uddee ln(${n}) = *${Math.log(n)}*`;
    },
  });

  def({
    name: ['sin', 'cos', 'tan'],
    category: 'tools',
    desc: '.sin <degrees>',
    run: async (ctx) => {
      const cmd = ctx.command;
      const d = parseFloat(ctx.args[0]);
      if (Number.isNaN(d)) return '\u274c Angle dein.';
      const r = (d * Math.PI) / 180;
      const v = cmd === 'sin' ? Math.sin(r) : cmd === 'cos' ? Math.cos(r) : Math.tan(r);
      return `\ud83d\udcd0 ${cmd}(${d}\u00b0) = *${v.toFixed(6)}*`;
    },
  });

  def({
    name: ['round', 'ceil', 'floor', 'abs'],
    category: 'tools',
    desc: '.round <n>',
    run: async (ctx) => {
      const n = parseFloat(ctx.args[0]);
      if (Number.isNaN(n)) return '\u274c Number dein.';
      const fn = { round: Math.round, ceil: Math.ceil, floor: Math.floor, abs: Math.abs }[ctx.command];
      return `\ud83e\uddee ${ctx.command}(${n}) = *${fn(n)}*`;
    },
  });

  def({
    name: ['min', 'max'],
    category: 'tools',
    desc: '.min 3 7 2',
    run: async (ctx) => {
      const nums = ctx.args.map(Number).filter((n) => !Number.isNaN(n));
      if (!nums.length) return '\u274c Numbers dein.';
      return `\ud83d\udcca ${ctx.command} = *${ctx.command === 'min' ? Math.min(...nums) : Math.max(...nums)}*`;
    },
  });

  def({
    name: ['sum', 'add'],
    category: 'tools',
    desc: '.sum 1 2 3',
    run: async (ctx) => {
      const nums = ctx.args.map(Number).filter((n) => !Number.isNaN(n));
      if (!nums.length) return '\u274c Numbers dein.';
      return `\u2795 Sum = *${nums.reduce((a, b) => a + b, 0)}*`;
    },
  });

  def({
    name: ['avg', 'average', 'mean'],
    category: 'tools',
    desc: '.avg 1 2 3',
    run: async (ctx) => {
      const nums = ctx.args.map(Number).filter((n) => !Number.isNaN(n));
      if (!nums.length) return '\u274c Numbers dein.';
      return `\ud83d\udcca Average = *${(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)}*`;
    },
  });

  def({
    name: ['median'],
    category: 'tools',
    desc: '.median 1 2 3',
    run: async (ctx) => {
      const nums = ctx.args.map(Number).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
      if (!nums.length) return '\u274c Numbers dein.';
      const m = Math.floor(nums.length / 2);
      const v = nums.length % 2 ? nums[m] : (nums[m - 1] + nums[m]) / 2;
      return `\ud83d\udcca Median = *${v}*`;
    },
  });

  def({
    name: ['mode'],
    category: 'tools',
    desc: '.mode 1 2 2 3',
    run: async (ctx) => {
      const nums = ctx.args.map(Number).filter((n) => !Number.isNaN(n));
      if (!nums.length) return '\u274c Numbers dein.';
      const f = {};
      nums.forEach((n) => (f[n] = (f[n] || 0) + 1));
      const max = Math.max(...Object.values(f));
      return `\ud83d\udcca Mode = *${Object.keys(f).filter((k) => f[k] === max).join(', ')}*`;
    },
  });

  def({
    name: ['range'],
    category: 'tools',
    desc: '.range 1 5',
    run: async (ctx) => {
      const a = parseInt(ctx.args[0], 10);
      const b = parseInt(ctx.args[1], 10);
      if (Number.isNaN(a) || Number.isNaN(b)) return '\u274c Do numbers dein.';
      const out = [];
      for (let i = a; i <= b && out.length < 200; i += 1) out.push(i);
      return out.join(', ');
    },
  });

  def({
    name: ['table', 'multiplytable'],
    category: 'tools',
    desc: '.table 7',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (!n) return '\u274c Number dein.';
      let out = `\ud83d\udcd0 *Table of ${n}*\n\n`;
      for (let i = 1; i <= 12; i += 1) out += `${n} \u00d7 ${i} = ${n * i}\n`;
      return out;
    },
  });
};
