/** ECONOMY: in-chat coins, daily rewards, shop, gambling-lite. */

const { randInt, pick } = require('./_util');
const { bulk } = require('./_bulk');

const wallets = new Map(); // sessionId:jid -> { coins, lastDaily, inventory }

function key(ctx) {
  return `${ctx.sessionId}:${ctx.sender || ctx.chat}`;
}
function getWallet(ctx) {
  const k = key(ctx);
  if (!wallets.has(k)) wallets.set(k, { coins: 100, lastDaily: 0, inventory: [] });
  return wallets.get(k);
}

module.exports = (def, defMany) => {
  def({ name: ['balance', 'bal', 'coins', 'wallet2'], category: 'economy', desc: '.balance \u2014 coins dekhein', run: async (ctx) => {
    const w = getWallet(ctx);
    return `\ud83d\udcb0 *Balance:* ${w.coins} coins\n\ud83c\udf92 Items: ${w.inventory.length}`;
  } });

  def({ name: ['daily', 'dailyreward'], category: 'economy', desc: '.daily \u2014 roz ka reward', run: async (ctx) => {
    const w = getWallet(ctx);
    const now = Date.now();
    if (now - w.lastDaily < 86400000) {
      const left = Math.ceil((86400000 - (now - w.lastDaily)) / 3600000);
      return `\u23f3 Daily already liya. *${left}h* baad dobara.`;
    }
    const amt = randInt(50, 200);
    w.coins += amt;
    w.lastDaily = now;
    return `\ud83c\udf81 Daily reward: *+${amt} coins* (Total: ${w.coins})`;
  } });

  def({ name: ['work', 'job'], category: 'economy', desc: '.work \u2014 kaam karke coins', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = randInt(10, 60);
    w.coins += amt;
    return `\ud83d\udcbc Kaam kiya: *+${amt} coins* (Total: ${w.coins})`;
  } });

  def({ name: ['beg', 'bhik'], category: 'economy', desc: '.beg \u2014 bheek maangein', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = randInt(1, 20);
    w.coins += amt;
    return `\ud83d\ude4f Kisi ne ${amt} coins de diye. (Total: ${w.coins})`;
  } });

  def({ name: ['gamble', 'bet'], category: 'economy', desc: '.gamble <amount>', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = parseInt(ctx.args[0], 10);
    if (Number.isNaN(amt) || amt <= 0) return '\u274c Misal: `.gamble 50`';
    if (amt > w.coins) return `\u274c Tumhare paas sirf ${w.coins} coins hain.`;
    if (Math.random() < 0.5) { w.coins += amt; return `\ud83c\udf89 Jeet gaye! *+${amt}* (Total: ${w.coins})`; }
    w.coins -= amt; return `\ud83d\ude22 Haar gaye. *-${amt}* (Total: ${w.coins})`;
  } });

  def({ name: ['rob', 'steal'], category: 'economy', desc: '.rob \u2014 coins churao', run: async (ctx) => {
    const w = getWallet(ctx);
    if (Math.random() < 0.4) { const amt = randInt(10, 50); w.coins += amt; return `\ud83e\udd77 Chori kamyab: *+${amt}* (Total: ${w.coins})`; }
    const amt = Math.min(30, w.coins); w.coins -= amt; return `\ud83d\udea8 Pakra gaye! *-${amt}* (Total: ${w.coins})`;
  } });

  def({ name: ['pay', 'transfer'], category: 'economy', desc: '.pay <amount>', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = parseInt(ctx.args[0], 10);
    if (Number.isNaN(amt) || amt <= 0) return '\u274c Misal: `.pay 50`';
    if (amt > w.coins) return '\u274c Itne coins nahi hain.';
    w.coins -= amt; return `\u2705 ${amt} coins transfer ho gaye. (Total: ${w.coins})`;
  } });

  def({ name: ['shop', 'store'], category: 'economy', desc: '.shop \u2014 items dekhein', run: async () => {
    const items = [['\ud83c\udf55 Pizza', 50], ['\u2615 Coffee', 30], ['\ud83c\udf81 Gift', 100], ['\ud83d\udc51 Crown', 500], ['\ud83d\udc8e Diamond', 1000]];
    return '\ud83d\uded2 *SHOP*\n' + items.map(([n, p]) => `\u2022 ${n} \u2014 ${p} coins`).join('\n') + '\n\nBuy: `.buy <item>`';
  } });

  def({ name: ['buy', 'purchase'], category: 'economy', desc: '.buy <item>', run: async (ctx) => {
    const w = getWallet(ctx);
    const items = { pizza: 50, coffee: 30, gift: 100, crown: 500, diamond: 1000 };
    const name = (ctx.args[0] || '').toLowerCase();
    const price = items[name];
    if (!price) return '\u274c Item nahi mila. `.shop` dekhein.';
    if (w.coins < price) return `\u274c ${price} coins chahiye. Tumhare paas ${w.coins} hain.`;
    w.coins -= price; w.inventory.push(name);
    return `\u2705 *${name}* kharida! (Total: ${w.coins})`;
  } });

  def({ name: ['inventory', 'inv'], category: 'economy', desc: '.inventory \u2014 items', run: async (ctx) => {
    const w = getWallet(ctx);
    return w.inventory.length ? `\ud83c\udf92 *Inventory*\n` + w.inventory.map((i) => `\u2022 ${i}`).join('\n') : '\ud83c\udf92 Inventory khali hai.';
  } });

  def({ name: ['leaderboard2', 'richlist'], category: 'economy', desc: '.leaderboard2 \u2014 top rich', run: async () => {
    const arr = [...wallets.entries()].sort((a, b) => b[1].coins - a[1].coins).slice(0, 10);
    if (!arr.length) return '\ud83c\udfc6 Leaderboard khali hai.';
    return '\ud83c\udfc6 *Richest*\n' + arr.map(([k, v], i) => `${i + 1}. ${k.split(':').pop()} \u2014 ${v.coins}`).join('\n');
  } });

  def({ name: ['give', 'gift_coins'], category: 'economy', desc: '.give <amount>', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = parseInt(ctx.args[0], 10);
    if (Number.isNaN(amt) || amt <= 0 || amt > w.coins) return '\u274c Invalid amount.';
    w.coins -= amt; return `\ud83c\udf81 ${amt} coins gift kar diye. (Total: ${w.coins})`;
  } });

  def({ name: ['coinflip_bet', 'cfbet'], category: 'economy', desc: '.coinflip_bet <amount>', run: async (ctx) => {
    const w = getWallet(ctx);
    const amt = parseInt(ctx.args[0], 10);
    if (Number.isNaN(amt) || amt <= 0 || amt > w.coins) return '\u274c Invalid amount.';
    if (Math.random() < 0.5) { w.coins += amt; return `\ud83e\ude99 Heads! *+${amt}*`; }
    w.coins -= amt; return `\ud83e\ude99 Tails! *-${amt}*`;
  } });

  bulk(defMany, 'economy', [
    { names: ['economy', 'ecomenu'], desc: 'Economy menu', replies: ['\ud83d\udcb0 `.balance`, `.daily`, `.work`, `.gamble`, `.shop`, `.buy`'] },
    { names: ['bank', 'bank2'], desc: 'Bank', replies: ['\ud83c\udfe6 Bank: `.balance` dekhein.'] },
    { names: ['deposit', 'dep'], desc: 'Deposit', replies: ['\ud83c\udfe6 Deposit note kar liya.'] },
    { names: ['withdraw', 'wd'], desc: 'Withdraw', replies: ['\ud83c\udfe6 Withdraw note kar liya.'] },
    { names: ['interest', 'int'], desc: 'Interest', replies: ['\ud83d\udcc8 Interest: 5% daily.'] },
    { names: ['loan', 'borrow'], desc: 'Loan', replies: ['\ud83c\udfe6 Loan available.'] },
    { names: ['repay', 'repayloan'], desc: 'Repay', replies: ['\u2705 Loan repay note.'] },
    { names: ['invest', 'investment'], desc: 'Invest', replies: ['\ud83d\udcc8 Invest: dashboard.'] },
    { names: ['stocks', 'stock'], desc: 'Stocks', replies: ['\ud83d\udcc8 Stocks: dashboard.'] },
    { names: ['crypto_wallet', 'cwallet'], desc: 'Crypto wallet', replies: ['\ud83d\udcb0 Crypto wallet: `.btc`'] },
    { names: ['sell', 'sellitem'], desc: 'Sell', replies: ['\ud83d\udcb0 Sell: `.sell <item>`'] },
    { names: ['trade', 'trading'], desc: 'Trade', replies: ['\ud83e\udd1d Trade: dashboard.'] },
    { names: ['auction', 'bid'], desc: 'Auction', replies: ['\ud83d\udd28 Auction: dashboard.'] },
    { names: ['lottery2', 'lotterybuy'], desc: 'Lottery', replies: ['\ud83c\udf9f\ufe0f `.lottery` se numbers lein.'] },
    { names: ['jackpot', 'jackpot2'], desc: 'Jackpot', replies: ['\ud83c\udfaf Jackpot: 10,000 coins!'] },
    { names: ['reward', 'rewards'], desc: 'Rewards', replies: ['\ud83c\udf81 Rewards: `.daily`'] },
    { names: ['streak2', 'dailystreak'], desc: 'Streak', replies: ['\ud83d\udd25 Streak: 0'] },
    { names: ['cash', 'cash2'], desc: 'Cash', replies: ['\ud83d\udcb5 Cash: `.balance`'] },
    { names: ['rich', 'richcheck'], desc: 'Rich', replies: ['\ud83d\udcb0 Rich: `.balance`'] },
    { names: ['poor', 'poorcheck'], desc: 'Poor', replies: ['\ud83d\ude22 Poor: `.beg`'] },
  ]);
};
