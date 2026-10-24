/** CRYPTO: hashing, encoding, crypto prices, wallet helpers. */

const crypto = require('crypto');
const { fetchJson } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const arg = (ctx) => ctx.args.join(' ');
  const hash = (name, aliases, fn, desc) =>
    def({ name: [name, ...aliases], category: 'crypto', desc, run: async (ctx) => {
      const t = arg(ctx);
      if (!t) return `\u274c Misal: \`.${name} hello\``;
      return `\ud83d\udd10 ${fn(t)}`;
    } });

  hash('sha256', ['sha_256'], (t) => crypto.createHash('sha256').update(t).digest('hex'), '.sha256 <text>');
  hash('sha512', ['sha_512'], (t) => crypto.createHash('sha512').update(t).digest('hex'), '.sha512 <text>');
  hash('sha1', ['sha_1'], (t) => crypto.createHash('sha1').update(t).digest('hex'), '.sha1 <text>');
  hash('md5', ['md_5'], (t) => crypto.createHash('md5').update(t).digest('hex'), '.md5 <text>');
  hash('sha384', ['sha_384'], (t) => crypto.createHash('sha384').update(t).digest('hex'), '.sha384 <text>');
  hash('sha224', ['sha_224'], (t) => crypto.createHash('sha224').update(t).digest('hex'), '.sha224 <text>');
  hash('ripemd160', ['rmd160'], (t) => crypto.createHash('ripemd160').update(t).digest('hex'), '.ripemd160 <text>');
  hash('sha3', ['sha3_256'], (t) => crypto.createHash('sha3-256').update(t).digest('hex'), '.sha3 <text>');

  def({ name: ['hmac', 'hmacsha256'], category: 'crypto', desc: '.hmac <key> <text>', run: async (ctx) => {
    if (ctx.args.length < 2) return '\u274c Misal: `.hmac secret hello`';
    const [key, ...rest] = ctx.args;
    return `\ud83d\udd10 ${crypto.createHmac('sha256', key).update(rest.join(' ')).digest('hex')}`;
  } });

  def({ name: ['base64', 'b64', 'tobase64'], category: 'crypto', desc: '.base64 <text>', run: async (ctx) => { const t = arg(ctx); return t ? `\ud83d\udd10 ${Buffer.from(t).toString('base64')}` : '\u274c Text dein.'; } });
  def({ name: ['unbase64', 'frombase64', 'b64decode'], category: 'crypto', desc: '.unbase64 <b64>', run: async (ctx) => { const t = arg(ctx); try { return `\ud83d\udd10 ${Buffer.from(t, 'base64').toString('utf8')}`; } catch { return '\u274c Invalid base64.'; } } });
  def({ name: ['base64url', 'b64url'], category: 'crypto', desc: '.base64url <text>', run: async (ctx) => { const t = arg(ctx); return t ? `\ud83d\udd10 ${Buffer.from(t).toString('base64url')}` : '\u274c Text dein.'; } });
  def({ name: ['hex', 'tohex', 'hexencode'], category: 'crypto', desc: '.hex <text>', run: async (ctx) => { const t = arg(ctx); return t ? `\ud83d\udd10 ${Buffer.from(t).toString('hex')}` : '\u274c Text dein.'; } });
  def({ name: ['unhex', 'fromhex', 'hexdecode'], category: 'crypto', desc: '.unhex <hex>', run: async (ctx) => { const t = arg(ctx); try { return `\ud83d\udd10 ${Buffer.from(t, 'hex').toString('utf8')}`; } catch { return '\u274c Invalid hex.'; } } });
  def({ name: ['binary', 'tobinary', 'bin'], category: 'crypto', desc: '.binary <text>', run: async (ctx) => { const t = arg(ctx); return t ? `\ud83d\udd10 ${Array.from(t).map((c) => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')}` : '\u274c Text dein.'; } });
  def({ name: ['unbinary', 'frombinary', 'bin2text'], category: 'crypto', desc: '.unbinary <binary>', run: async (ctx) => { const t = arg(ctx).replace(/\s+/g, ''); try { return `\ud83d\udd10 ${t.match(/.{8}/g).map((b) => String.fromCharCode(parseInt(b, 2))).join('')}`; } catch { return '\u274c Invalid binary.'; } } });
  def({ name: ['morse', 'tomorse'], category: 'crypto', desc: '.morse <text>', run: async (ctx) => {
    const map = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
    const t = arg(ctx).toLowerCase();
    if (!t) return '\u274c Text dein.';
    return `\ud83d\udd10 ${Array.from(t).map((c) => map[c] || (c === ' ' ? '/' : c)).join(' ')}`;
  } });
  def({ name: ['unmorse', 'frommorse'], category: 'crypto', desc: '.unmorse <morse>', run: async (ctx) => {
    const map = { '.-': 'a', '-...': 'b', '-.-.': 'c', '-..': 'd', '.': 'e', '..-.': 'f', '--.': 'g', '....': 'h', '..': 'i', '.---': 'j', '-.-': 'k', '.-..': 'l', '--': 'm', '-.': 'n', '---': 'o', '.--.': 'p', '--.-': 'q', '.-.': 'r', '...': 's', '-': 't', '..-': 'u', '...-': 'v', '.--': 'w', '-..-': 'x', '-.--': 'y', '--..': 'z' };
    const t = arg(ctx);
    if (!t) return '\u274c Morse dein.';
    return `\ud83d\udd10 ${t.split(' ').map((c) => map[c] || (c === '/' ? ' ' : c)).join('')}`;
  } });
  def({ name: ['jwtdecode', 'jwt'], category: 'crypto', desc: '.jwtdecode <token>', run: async (ctx) => {
    const t = arg(ctx);
    if (!t) return '\u274c Token dein.';
    try {
      const p = t.split('.')[1];
      return `\ud83d\udd10 ${Buffer.from(p, 'base64').toString('utf8')}`;
    } catch { return '\u274c Invalid JWT.'; }
  } });
  def({ name: ['uuid', 'guid'], category: 'crypto', desc: '.uuid \u2014 generate UUID', run: async () => `\ud83c\udd94 ${crypto.randomUUID()}` });
  def({ name: ['uuid4', 'guid4'], category: 'crypto', desc: '.uuid4', run: async () => `\ud83c\udd94 ${crypto.randomUUID()}` });
  def({ name: ['randombytes', 'randbytes'], category: 'crypto', desc: '.randombytes <n>', run: async (ctx) => { const n = Math.min(parseInt(ctx.args[0], 10) || 16, 256); return `\ud83d\udd10 ${crypto.randomBytes(n).toString('hex')}`; } });
  def({ name: ['randomhex', 'randhex'], category: 'crypto', desc: '.randomhex', run: async () => `\ud83d\udd10 ${crypto.randomBytes(8).toString('hex')}` });
  def({ name: ['checksum', 'crc'], category: 'crypto', desc: '.checksum <text>', run: async (ctx) => { const t = arg(ctx); return t ? `\ud83d\udd10 ${crypto.createHash('sha256').update(t).digest('hex').slice(0, 16)}` : '\u274c Text dein.'; } });
  def({ name: ['encrypt', 'aesencrypt'], category: 'crypto', desc: '.encrypt <key> <text>', run: async (ctx) => {
    if (ctx.args.length < 2) return '\u274c Misal: `.encrypt secret hello`';
    const [key, ...rest] = ctx.args;
    const k = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    const c = crypto.createCipheriv('aes-256-cbc', k, iv);
    const enc = Buffer.concat([c.update(rest.join(' '), 'utf8'), c.final()]);
    return `\ud83d\udd12 ${iv.toString('hex')}:${enc.toString('hex')}`;
  } });
  def({ name: ['decrypt', 'aesdecrypt'], category: 'crypto', desc: '.decrypt <key> <payload>', run: async (ctx) => {
    if (ctx.args.length < 2) return '\u274c Misal: `.decrypt secret iv:data`';
    const [key, payload] = ctx.args;
    try {
      const [ivHex, dataHex] = payload.split(':');
      const k = crypto.createHash('sha256').update(key).digest();
      const d = crypto.createDecipheriv('aes-256-cbc', k, Buffer.from(ivHex, 'hex'));
      return `\ud83d\udd13 ${Buffer.concat([d.update(Buffer.from(dataHex, 'hex')), d.final()]).toString('utf8')}`;
    } catch { return '\u274c Decrypt fail. Key/payload check karein.'; }
  } });

  // Live crypto prices
  def({ name: ['btc', 'bitcoin'], category: 'crypto', desc: '.btc \u2014 Bitcoin price', run: async () => price('bitcoin', 'BTC') });
  def({ name: ['eth', 'ethereum'], category: 'crypto', desc: '.eth \u2014 Ethereum price', run: async () => price('ethereum', 'ETH') });
  def({ name: ['bnb'], category: 'crypto', desc: '.bnb \u2014 BNB price', run: async () => price('binancecoin', 'BNB') });
  def({ name: ['sol', 'solana'], category: 'crypto', desc: '.sol \u2014 Solana price', run: async () => price('solana', 'SOL') });
  def({ name: ['ada', 'cardano'], category: 'crypto', desc: '.ada \u2014 Cardano price', run: async () => price('cardano', 'ADA') });
  def({ name: ['doge', 'dogecoin'], category: 'crypto', desc: '.doge \u2014 Dogecoin price', run: async () => price('dogecoin', 'DOGE') });
  def({ name: ['xrp', 'ripple'], category: 'crypto', desc: '.xrp \u2014 XRP price', run: async () => price('ripple', 'XRP') });
  def({ name: ['matic', 'polygon'], category: 'crypto', desc: '.matic \u2014 Polygon price', run: async () => price('matic-network', 'MATIC') });
  def({ name: ['trx', 'tron'], category: 'crypto', desc: '.trx \u2014 Tron price', run: async () => price('tron', 'TRX') });
  def({ name: ['ltc', 'litecoin'], category: 'crypto', desc: '.ltc \u2014 Litecoin price', run: async () => price('litecoin', 'LTC') });
  def({ name: ['crypto', 'cryptoprice', 'coinprice'], category: 'crypto', desc: '.crypto <coin>', run: async (ctx) => {
    const id = (ctx.args[0] || '').toLowerCase();
    if (!id) return '\u274c Misal: `.crypto bitcoin`';
    return price(id, id.toUpperCase());
  } });
  def({ name: ['cryptolist', 'topcoins'], category: 'crypto', desc: '.cryptolist \u2014 top coins', run: async () => {
    try {
      const d = await fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1');
      return '\ud83d\udcb0 *Top 10 Coins*\n' + d.map((c, i) => `${i + 1}. ${c.symbol.toUpperCase()} \u2014 $${c.current_price}`).join('\n');
    } catch { return '\u274c Crypto list abhi available nahi.'; }
  } });

  async function price(id, sym) {
    try {
      const d = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,pkr&include_24hr_change=true`);
      const c = d[id];
      if (!c) return `\u274c Coin ${sym} nahi mili.`;
      const ch = c.usd_24h_change || 0;
      return `\ud83d\udcb0 *${sym}*\n\u2022 USD: $${c.usd}\n\u2022 PKR: \u20a8${c.pkr || '-'}\n\u2022 24h: ${ch >= 0 ? '\ud83d\udcc8 +' : '\ud83d\udcc9 '}${ch.toFixed(2)}%`;
    } catch { return `\u274c ${sym} price abhi available nahi.`; }
  }

  bulk(defMany, 'crypto', [
    { names: ['cryptomenu', 'cryptohelp'], desc: 'Crypto menu', replies: ['\ud83d\udcb0 `.btc`, `.eth`, `.sol`, `.doge`, `.cryptolist` \u2014 live prices'] },
    { names: ['wallet', 'walletcheck'], desc: 'Wallet', replies: ['\ud83d\udc5b Wallet check: dashboard se karein.'] },
    { names: ['cryptotips', 'cryptoadvice'], desc: 'Crypto tips', replies: ['\ud83d\udca1 Crypto mein invest se pehle research karein. DYOR!'] },
    { names: ['hodl', 'hodl2'], desc: 'HODL', replies: ['\ud83d\udc8e HODL!'] },
    { names: ['bull', 'bullmarket'], desc: 'Bull market', replies: ['\ud83d\udcc8 Bull market vibes!'] },
    { names: ['bear', 'bearmarket'], desc: 'Bear market', replies: ['\ud83d\udcc9 Bear market... patience.'] },
    { names: ['moon', 'tothemoon'], desc: 'To the moon', replies: ['\ud83d\ude80 To the moon!'] },
    { names: ['pump', 'pumpfun'], desc: 'Pump', replies: ['\ud83d\udcc8 Pump it!'] },
    { names: ['dump', 'dumpfun'], desc: 'Dump', replies: ['\ud83d\udcc9 Dump...'] },
    { names: ['defi', 'defiinfo'], desc: 'DeFi', replies: ['\ud83c\udfe6 DeFi \u2014 decentralized finance.'] },
    { names: ['nft', 'nftinfo'], desc: 'NFT', replies: ['\ud83d\uddbc\ufe0f NFT \u2014 non-fungible token.'] },
    { names: ['web3', 'web3info'], desc: 'Web3', replies: ['\ud83c\udf10 Web3 \u2014 decentralized web.'] },
    { names: ['blockchain', 'blockchaininfo'], desc: 'Blockchain', replies: ['\u26d3\ufe0f Blockchain \u2014 distributed ledger.'] },
    { names: ['gas', 'gasfee'], desc: 'Gas fee', replies: ['\u26fd Gas fees network par depend karti hain.'] },
    { names: ['staking', 'stake'], desc: 'Staking', replies: ['\ud83d\udd12 Staking \u2014 coins lock karke rewards.'] },
    { names: ['mining', 'mine'], desc: 'Mining', replies: ['\u26cf\ufe0f Mining \u2014 blocks solve karke coins.'] },
  ]);
};
