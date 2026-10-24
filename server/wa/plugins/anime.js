/** Anime / manga flavoured commands. */

const { fetchJson, pick, randInt } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const cat = 'anime';

  const ANIME = [
    'Naruto', 'One Piece', 'Bleach', 'Attack on Titan', 'Death Note', 'Demon Slayer',
    'Jujutsu Kaisen', 'My Hero Academia', 'Tokyo Ghoul', 'Fullmetal Alchemist',
    'Hunter x Hunter', 'Dragon Ball Z', 'One Punch Man', 'Sword Art Online',
    'Steins;Gate', 'Code Geass', 'Evangelion', 'Cowboy Bebop', 'Vinland Saga',
    'Chainsaw Man', 'Spy x Family', 'Blue Lock', 'Haikyuu', 'Your Name',
    'Spirited Away', 'Princess Mononoke', 'A Silent Voice', 'Violet Evergarden',
    'Re:Zero', 'Konosuba', 'Overlord', 'Fairy Tail', 'Black Clover', 'Dr. Stone',
  ];
  const CHARACTERS = [
    'Naruto Uzumaki', 'Sasuke Uchiha', 'Kakashi Hatake', 'Itachi Uchiha',
    'Monkey D. Luffy', 'Roronoa Zoro', 'Sanji', 'Nami', 'Ichigo Kurosaki',
    'Levi Ackerman', 'Eren Yeager', 'Mikasa Ackerman', 'Light Yagami', 'L',
    'Tanjiro Kamado', 'Nezuko Kamado', 'Zenitsu Agatsuma', 'Gojo Satoru',
    'Yuji Itadori', 'Megumi Fushiguro', 'Izuku Midoriya', 'Katsuki Bakugo',
    'Goku', 'Vegeta', 'Saitama', 'Genos', 'Edward Elric', 'Roy Mustang',
    'Gon Freecss', 'Killua Zoldyck', 'Lelouch Lamperouge', 'Spike Spiegel',
    'Makise Kurisu', 'Okabe Rintarou', 'Anya Forger', 'Denji', 'Power',
  ];
  const QUOTES = [
    'I never go back on my word. That is my ninja way! — Naruto',
    'I am going to be the Pirate King! — Luffy',
    'Power comes in response to a need, not a desire. — Goku',
    'The world is not beautiful, therefore it is. — Kino',
    'Whatever happens, happens. — Spike Spiegel',
    'A lesson without pain is meaningless. — Edward Elric',
    'If you don\'t take risks, you can\'t create a future. — Luffy',
    'Fear is not evil. It tells you what your weakness is. — Gildarts',
    'People\'s lives don\'t end when they die, it ends when they lose faith. — Itachi',
    'Hard work is worthless for those that don\'t believe in themselves. — Naruto',
    'The moment you think of giving up, think of the reason why you held on so long. — Natsu',
    'Wake up to reality, nothing ever goes as planned in this world. — Madara',
  ];
  const WAIFU_TRAITS = [
    'kind', 'tsundere', 'yandere', 'kuudere', 'genki', 'cool', 'shy', 'energetic',
    'mysterious', 'loyal', 'clever', 'clumsy', 'brave', 'gentle', 'playful',
  ];

  defMany(['anime', 'animesearch', 'animeinfo'], {
    category: cat,
    desc: 'Get a random anime recommendation',
    run: async () => {
      const a = pick(ANIME);
      return `\u{1F3AC} *${a}*\n\nRating: ${(Math.random() * 4 + 6).toFixed(1)}/10\nStatus: ${pick(['Completed', 'Ongoing', 'Upcoming'])}\nGenre: ${pick(['Action', 'Adventure', 'Fantasy', 'Romance', 'Thriller', 'Comedy'])}\n\n_Try another with .anime_`;
    },
  });

  defMany(['character', 'animechar', 'randomchar'], {
    category: cat,
    desc: 'Random anime character',
    run: async () => `\u{1F9D1}\u200D\u{1F3A8} *${pick(CHARACTERS)}*`,
  });

  defMany(['animequote', 'aquote'], {
    category: cat,
    desc: 'Random anime quote',
    run: async () => `\u{1F4AC} _${pick(QUOTES)}_`,
  });

  defMany(['waifu', 'waifurandom'], {
    category: cat,
    desc: 'Random waifu rating',
    run: async () => {
      const name = pick(CHARACTERS);
      return `\u{1F495} *${name}*\n\nTraits: ${pick(WAIFU_TRAITS)}, ${pick(WAIFU_TRAITS)}\nWaifu score: ${randInt(70, 100)}/100`;
    },
  });

  defMany(['husbando', 'husbandorandom'], {
    category: cat,
    desc: 'Random husbando rating',
    run: async () => {
      const name = pick(CHARACTERS);
      return `\u{1F9E1} *${name}*\n\nHusbando score: ${randInt(70, 100)}/100`;
    },
  });

  defMany(['animerate', 'rateanime'], {
    category: cat,
    desc: 'Rate an anime you name',
    usage: '.animerate <name>',
    run: async (ctx) => {
      const name = ctx.text || pick(ANIME);
      return `\u2B50 *${name}* \u2192 ${(Math.random() * 4 + 6).toFixed(1)}/10`;
    },
  });

  defMany(['manga', 'mangainfo'], {
    category: cat,
    desc: 'Random manga suggestion',
    run: async () => `\u{1F4D6} *${pick(ANIME)}* (manga)\nChapters: ${randInt(50, 900)} | Volumes: ${randInt(5, 80)}`,
  });

  defMany(['animelist', 'topanime'], {
    category: cat,
    desc: 'Show a short top anime list',
    run: async () => {
      const shuffled = [...ANIME].sort(() => Math.random() - 0.5).slice(0, 10);
      return '\u{1F3C6} *Top Anime (random)*\n\n' + shuffled.map((a, i) => `${i + 1}. ${a}`).join('\n');
    },
  });

  defMany(['animefact', 'animefacts'], {
    category: cat,
    desc: 'Random anime fact',
    run: async () => {
      const facts = [
        'Naruto was originally planned to be about a chef, not a ninja.',
        'One Piece has been running since 1997 and has over 1000 chapters.',
        'Studio Ghibli was founded in 1985 by Hayao Miyazaki and Isao Takahata.',
        'Attack on Titan\'s author Hajime Isayama based the walls on his hometown.',
        'Saitama from One Punch Man was designed to be intentionally plain-looking.',
        'Death Note was originally rejected by publishers twice before release.',
        'Spirited Away won the Academy Award for Best Animated Feature in 2003.',
      ];
      return `\u{1F4A1} ${pick(facts)}`;
    },
  });

  defMany(['otaku', 'otakurate'], {
    category: cat,
    desc: 'How much of an otaku are you?',
    run: async () => `\u{1F60E} Otaku level: ${randInt(1, 100)}/100`,
  });

  defMany(['animegif', 'animepic'], {
    category: cat,
    desc: 'Random anime picture',
    run: async () => `\u{1F5BC} ${pick([
      'https://api.waifu.pics/sfw/waifu',
      'https://api.waifu.pics/sfw/neko',
      'https://api.waifu.pics/sfw/shinobu',
      'https://api.waifu.pics/sfw/megumin',
    ])}`,
  });

  bulk(defMany, cat, [
    { names: ['aot', 'attackontitan'], replies: ['\u{1F5E1} Attack on Titan \u2192 9.0/10'] },
    { names: ['onepiece', 'luffy'], replies: ['\u{1F3F4}\u200D\u2620\uFE0F One Piece \u2192 9.2/10'] },
    { names: ['naruto', 'narutobot'], replies: ['\u{1F342} Naruto \u2192 8.8/10'] },
    { names: ['bleach'], replies: ['\u2694\uFE0F Bleach \u2192 8.5/10'] },
    { names: ['deathnote', 'kira'], replies: ['\u{1F4D3} Death Note \u2192 9.0/10'] },
    { names: ['demonslayer', 'kimetsu'], replies: ['\u{1F5E1}\uFE0F Demon Slayer \u2192 8.9/10'] },
    { names: ['jjk', 'jujutsukaisen'], replies: ['\u{1F44A} Jujutsu Kaisen \u2192 8.7/10'] },
    { names: ['mha', 'myheroacademia'], replies: ['\u{1F9B8} My Hero Academia \u2192 8.4/10'] },
    { names: ['tokyoghoul'], replies: ['\u{1F3AD} Tokyo Ghoul \u2192 8.2/10'] },
    { names: ['fmab', 'fullmetalalchemist'], replies: ['\u2697\uFE0F Fullmetal Alchemist \u2192 9.5/10'] },
    { names: ['hxh', 'hunterxhunter'], replies: ['\u{1F3AF} Hunter x Hunter \u2192 9.1/10'] },
    { names: ['dbz', 'dragonball'], replies: ['\u{1F409} Dragon Ball Z \u2192 8.6/10'] },
    { names: ['opm', 'onepunchman'], replies: ['\u{1F44A} One Punch Man \u2192 8.8/10'] },
    { names: ['sao', 'swordartonline'], replies: ['\u{1F5E1}\uFE0F Sword Art Online \u2192 7.9/10'] },
    { names: ['steinsgate'], replies: ['\u23F0 Steins;Gate \u2192 9.3/10'] },
    { names: ['codegeass'], replies: ['\u{1F451} Code Geass \u2192 9.2/10'] },
    { names: ['evangelion', 'eva'], replies: ['\u{1F916} Evangelion \u2192 8.7/10'] },
    { names: ['cowboybebop'], replies: ['\u{1F680} Cowboy Bebop \u2192 9.0/10'] },
    { names: ['vinlandsaga'], replies: ['\u{1FA93} Vinland Saga \u2192 9.0/10'] },
    { names: ['chainsawman', 'csm'], replies: ['\u{1FA9A} Chainsaw Man \u2192 8.8/10'] },
    { names: ['spyfamily', 'anya'], replies: ['\u{1F47B} Spy x Family \u2192 8.6/10'] },
    { names: ['bluelock'], replies: ['\u26BD Blue Lock \u2192 8.4/10'] },
    { names: ['haikyuu'], replies: ['\u{1F3D0} Haikyuu \u2192 9.0/10'] },
    { names: ['yourname', 'kiminonawa'], replies: ['\u{1F31F} Your Name \u2192 9.1/10'] },
    { names: ['spiritedaway'], replies: ['\u{1F43E} Spirited Away \u2192 9.3/10'] },
    { names: ['mononoke'], replies: ['\u{1F43A} Princess Mononoke \u2192 9.0/10'] },
    { names: ['silentvoice'], replies: ['\u{1F497} A Silent Voice \u2192 9.1/10'] },
    { names: ['violet', 'violetgardens'], replies: ['\u{1F48C} Violet Evergarden \u2192 9.2/10'] },
    { names: ['rezero'], replies: ['\u{1F504} Re:Zero \u2192 8.7/10'] },
    { names: ['konosuba'], replies: ['\u{1F9D9} Konosuba \u2192 8.5/10'] },
    { names: ['overlord'], replies: ['\u{1F480} Overlord \u2192 8.4/10'] },
    { names: ['fairytail'], replies: ['\u{1F409} Fairy Tail \u2192 8.0/10'] },
    { names: ['blackclover'], replies: ['\u{1F340} Black Clover \u2192 8.3/10'] },
    { names: ['drstone'], replies: ['\u{1F52C} Dr. Stone \u2192 8.6/10'] },
    { names: ['solo leveling', 'sololeveling'], replies: ['\u{1F5E1}\uFE0F Solo Leveling \u2192 8.7/10'] },
  ]);
};
