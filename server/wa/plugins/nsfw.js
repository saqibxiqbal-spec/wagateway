/**
 * "NSFW" category — kept deliberately tasteful and hidden from the public menu.
 * Nothing explicit is produced; these are flirt/rate style fun commands that
 * are hidden by default and only appear if a user knows the name.
 */

const { pick, randInt } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const cat = 'nsfw';
  const hidden = true;

  const HIDDEN_WARNING = '\u{1F512} This command is hidden. Use responsibly.';

  defMany(['nsfw', 'nsfwmenu', 'adult'], {
    category: cat,
    hidden,
    desc: 'About the hidden category',
    run: async () => `${HIDDEN_WARNING}\n\nThis bot keeps things family-friendly. Try .fun, .game or .flirt instead.`,
  });

  defMany(['flirt', 'flirty', 'flirtline'], {
    category: cat,
    hidden,
    desc: 'A playful flirt line',
    run: async () => `\u{1F60F} ${pick([
      'Are you a magician? Because whenever I look at you, everyone else disappears.',
      'Do you have a map? I keep getting lost in your eyes.',
      'Are you Wi-Fi? Because I am feeling a connection.',
      'If you were a vegetable, you would be a cute-cumber.',
      'Is your name Google? Because you have everything I am searching for.',
      'Do you believe in love at first sight, or should I walk by again?',
    ])}`,
  });

  defMany(['hot', 'hotrate', 'hotness'], {
    category: cat,
    hidden,
    desc: 'Hotness meter',
    run: async (ctx) => `\u{1F525} ${ctx.text || 'You'} \u2192 ${randInt(50, 100)}/100 hotness`,
  });

  defMany(['crush', 'crushrate'], {
    category: cat,
    hidden,
    desc: 'Crush compatibility',
    run: async () => `\u{1F495} Crush compatibility: ${randInt(40, 100)}%`,
  });

  defMany(['kiss', 'kissrate'], {
    category: cat,
    hidden,
    desc: 'Kiss meter',
    run: async () => `\u{1F48B} Kiss meter: ${randInt(1, 100)}/100`,
  });

  defMany(['love', 'lovecalc', 'lovemeter'], {
    category: cat,
    hidden,
    desc: 'Love calculator',
    usage: '.love <name1> | <name2>',
    run: async (ctx) => {
      const parts = String(ctx.text || '').split('|').map((s) => s.trim()).filter(Boolean);
      const a = parts[0] || 'You';
      const b = parts[1] || 'Crush';
      return `\u{1F498} *Love Calculator*\n\n${a} \u2764\uFE0F ${b}\nScore: ${randInt(10, 100)}%`;
    },
  });

  defMany(['ship', 'shipper'], {
    category: cat,
    hidden,
    desc: 'Ship two names',
    usage: '.ship <a> | <b>',
    run: async (ctx) => {
      const parts = String(ctx.text || '').split('|').map((s) => s.trim()).filter(Boolean);
      const a = parts[0] || 'A';
      const b = parts[1] || 'B';
      return `\u{1F6A2} *${a}* + *${b}* = ${randInt(10, 100)}% compatible`;
    },
  });

  defMany(['bodycount', 'bodycountrate'], {
    category: cat,
    hidden,
    desc: 'Playful body count meter',
    run: async () => `\u{1F605} Body count meter: ${randInt(0, 10)}`,
  });

  defMany(['rizz', 'rizzrate'], {
    category: cat,
    hidden,
    desc: 'Rizz meter',
    run: async (ctx) => `\u{1F60E} ${ctx.text || 'Your'} rizz: ${randInt(0, 100)}/100`,
  });

  defMany(['simp', 'simprate'], {
    category: cat,
    hidden,
    desc: 'Simp meter',
    run: async (ctx) => `\u{1F971} ${ctx.text || 'Your'} simp level: ${randInt(0, 100)}%`,
  });

  defMany(['sus', 'susrate'], {
    category: cat,
    hidden,
    desc: 'Suspicion meter',
    run: async (ctx) => `\u{1F575}\uFE0F ${ctx.text || 'You'} look ${randInt(0, 100)}% sus`,
  });

  defMany(['aura', 'aurarate'], {
    category: cat,
    hidden,
    desc: 'Aura points',
    run: async (ctx) => `\u2728 ${ctx.text || 'Your'} aura: ${randInt(-100, 100)} points`,
  });

  bulk(defMany, cat, [
    { names: ['naughty', 'naughtyr'], replies: ['\u{1F608} Naughty level: ' + randInt(0, 100) + '%'], hidden },
    { names: ['cuddle', 'cuddler'], replies: ['\u{1F917} Cuddle score: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['hug', 'hugrate'], replies: ['\u{1F917} Hug rating: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['date', 'daterate'], replies: ['\u{1F46B} Date rating: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['marry', 'marryrate'], replies: ['\u{1F48D} Marriage material: ' + randInt(50, 100) + '%'], hidden },
    { names: ['ex', 'exrate'], replies: ['\u{1F494} Ex meter: ' + randInt(0, 100) + '%'], hidden },
    { names: ['jealous', 'jealousy'], replies: ['\u{1F620} Jealousy: ' + randInt(0, 100) + '%'], hidden },
    { names: ['attractive', 'attract'], replies: ['\u{1F60D} Attractiveness: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['sexy', 'sexyrate'], replies: ['\u{1F525} Rating: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['single', 'singlecheck'], replies: ['\u{1F494} Status: single (probably)'], hidden },
    { names: ['couple', 'couplename'], replies: ['\u{1F491} Couple name generator ready — use .ship a | b'], hidden },
    { names: ['bae', 'baerate'], replies: ['\u{1F495} Bae rating: ' + randInt(50, 100) + '/100'], hidden },
    { names: ['heart', 'heartrate'], replies: ['\u2764\uFE0F Heart rate: ' + randInt(60, 120) + ' bpm'], hidden },
    { names: ['dream', 'dreampartner'], replies: ['\u{1F4AD} Dream partner: kind, funny, loyal.'], hidden },
    { names: ['cheat', 'cheatrate'], replies: ['\u{1F440} Trust score: ' + randInt(50, 100) + '%'], hidden },
    { names: ['secret', 'secretrate'], replies: ['\u{1F910} Secrets kept: ' + randInt(50, 100) + '%'], hidden },
    { names: ['bed', 'bedroom'], replies: ['\u{1F6CF}\uFE0F This bot stays family-friendly.'], hidden },
    { names: ['strip', 'stripcmd'], replies: ['\u{1F645} Not available. Try .flirt instead.'], hidden },
    { names: ['18plus', 'adultonly'], replies: ['\u{1F6AB} Adult content is disabled.'], hidden },
    { names: ['xxx', 'explicit'], replies: ['\u{1F6AB} Explicit content is disabled.'], hidden },
  ]);
};
