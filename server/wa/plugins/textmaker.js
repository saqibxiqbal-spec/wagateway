/** TEXTMAKER: unicode font / decorative text generators (all real, offline). */

const { bulk } = require('./_bulk');

// Build a map from A-Z a-z 0-9 to a target unicode range.
function mapper(upperStart, lowerStart, digitStart) {
  return (text) =>
    Array.from(String(text))
      .map((ch) => {
        const c = ch.codePointAt(0);
        if (c >= 65 && c <= 90 && upperStart) return String.fromCodePoint(upperStart + (c - 65));
        if (c >= 97 && c <= 122 && lowerStart) return String.fromCodePoint(lowerStart + (c - 97));
        if (c >= 48 && c <= 57 && digitStart) return String.fromCodePoint(digitStart + (c - 48));
        return ch;
      })
      .join('');
}

const FONTS = {
  bold: mapper(0x1d400, 0x1d41a, 0x1d7ce),
  italic: mapper(0x1d434, 0x1d44e, null),
  bolditalic: mapper(0x1d468, 0x1d482, null),
  script: mapper(0x1d49c, 0x1d4b6, null),
  boldscript: mapper(0x1d4d0, 0x1d4ea, null),
  fraktur: mapper(0x1d504, 0x1d51e, null),
  double: mapper(0x1d538, 0x1d552, 0x1d7d8),
  sans: mapper(0x1d5a0, 0x1d5ba, 0x1d7e2),
  sansbold: mapper(0x1d5d4, 0x1d5ee, 0x1d7ec),
  sansitalic: mapper(0x1d608, 0x1d622, null),
  mono: mapper(0x1d670, 0x1d68a, 0x1d7f6),
};

const CIRCLED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function circled(text) {
  return Array.from(String(text))
    .map((ch) => {
      const i = CIRCLED.indexOf(ch);
      if (i < 0) return ch;
      if (i < 26) return String.fromCodePoint(0x24b6 + i);
      if (i < 52) return String.fromCodePoint(0x24d0 + (i - 26));
      return String.fromCodePoint(0x2460 + (i - 52));
    })
    .join('');
}

function squared(text) {
  return Array.from(String(text))
    .map((ch) => {
      const i = CIRCLED.indexOf(ch);
      if (i < 0) return ch;
      if (i < 26) return String.fromCodePoint(0x1f130 + i);
      return ch;
    })
    .join('');
}

function fullwidth(text) {
  return Array.from(String(text))
    .map((ch) => {
      const c = ch.codePointAt(0);
      if (c >= 33 && c <= 126) return String.fromCodePoint(c + 0xfee0);
      if (c === 32) return '\u3000';
      return ch;
    })
    .join('');
}

const SMALL = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ';
function smallcaps(text) {
  return Array.from(String(text).toLowerCase())
    .map((ch) => {
      const i = ch.charCodeAt(0) - 97;
      if (i >= 0 && i < 26) return SMALL[i] || ch;
      return ch;
    })
    .join('');
}

const FLIP = {
  a: '\u0250', b: 'q', c: '\u0254', d: 'p', e: '\u01dd', f: '\u025f', g: '\u0183', h: '\u0265',
  i: '\u0131', j: '\u027e', k: '\u029e', l: 'l', m: '\u026f', n: 'u', o: 'o', p: 'd', q: 'b',
  r: '\u0279', s: 's', t: '\u0287', u: 'n', v: '\u028c', w: '\u028d', x: 'x', y: '\u028e', z: 'z',
};
function flip(text) {
  return Array.from(String(text).toLowerCase())
    .map((ch) => FLIP[ch] || ch)
    .reverse()
    .join('');
}

function bubble(text) {
  return Array.from(String(text))
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(0x24b6 + (c - 65));
      if (c >= 97 && c <= 122) return String.fromCodePoint(0x24d0 + (c - 97));
      if (c >= 48 && c <= 57) return String.fromCodePoint(0x2460 + (c - 48));
      return ch;
    })
    .join('');
}

module.exports = (def, defMany) => {
  const make = (aliases, fn, desc) => {
    def({
      name: aliases,
      category: 'textmaker',
      desc,
      run: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) return `\u274c Misal: \`.${aliases[0]} Hello World\``;
        return fn(text);
      },
    });
  };

  make(['bold', 'fbold', 'boldtext'], FONTS.bold, '.bold <text> \u2014 bold unicode');
  make(['italic', 'fitalic', 'italictext'], FONTS.italic, '.italic <text> \u2014 italic unicode');
  make(['bolditalic', 'fbi'], FONTS.bolditalic, '.bolditalic <text> \u2014 bold italic');
  make(['script', 'fancy', 'cursive'], FONTS.script, '.script <text> \u2014 cursive');
  make(['boldscript', 'fancyscript'], FONTS.boldscript, '.boldscript <text> \u2014 bold cursive');
  make(['fraktur', 'gothic', 'oldenglish'], FONTS.fraktur, '.fraktur <text> \u2014 gothic');
  make(['double', 'doublestruck', 'outline'], FONTS.double, '.double <text> \u2014 outline');
  make(['sans', 'sansserif'], FONTS.sans, '.sans <text> \u2014 sans');
  make(['sansbold', 'sansboldtext'], FONTS.sansbold, '.sansbold <text> \u2014 sans bold');
  make(['sansitalic', 'sansital'], FONTS.sansitalic, '.sansitalic <text> \u2014 sans italic');
  make(['mono', 'monospace', 'code'], FONTS.mono, '.mono <text> \u2014 monospace');
  make(['circled', 'circle', 'circletext'], circled, '.circled <text> \u2014 circled');
  make(['squared', 'square', 'squaretext'], squared, '.squared <text> \u2014 squared');
  make(['fullwidth', 'wide', 'vaporwave'], fullwidth, '.fullwidth <text> \u2014 wide');
  make(['smallcaps', 'small', 'tinycaps'], smallcaps, '.smallcaps <text> \u2014 small caps');
  make(['flip', 'upsidedown', 'reverse_flip'], flip, '.flip <text> \u2014 upside down');
  make(['bubble', 'bubbletext', 'balloon'], bubble, '.bubble <text> \u2014 bubble letters');

  // Decorative frames
  const frames = {
    star: (t) => `\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726\n\u2726 ${t} \u2726\n\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726\u2726`,
    heart: (t) => `\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665\n\u2665 ${t} \u2665\n\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665\u2665`,
    arrow: (t) => `\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\n\u27a4 ${t} \u27a4\n\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4\u27a4`,
    flower: (t) => `\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740\n\u2740 ${t} \u2740\n\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740\u2740`,
    fire: (t) => `\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\n\ud83d\udd25 ${t} \ud83d\udd25\n\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25\ud83d\udd25`,
    crown: (t) => `\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\n\ud83d\udc51 ${t} \ud83d\udc51\n\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51\ud83d\udc51`,
  };
  for (const [k, fn] of Object.entries(frames)) {
    def({
      name: ['frame_' + k, k + 'frame'],
      category: 'textmaker',
      desc: `.frame_${k} <text> \u2014 ${k} frame`,
      run: async (ctx) => {
        const t = ctx.args.join(' ');
        if (!t) return `\u274c Misal: \`.frame_${k} Salam\``;
        return fn(t);
      },
    });
  }

  // Many decorative aliases for the same generators
  bulk(defMany, 'textmaker', [
    { names: ['fancytext', 'stylishtext', 'stylish'], desc: 'Stylish text', replies: [(c) => FONTS.script(c.args.join(' ') || 'SAQIB MD')] },
    { names: ['attitude', 'attitudetext'], desc: 'Attitude text', replies: ['\ud83d\ude0e Attitude status: *Main apni marzi ka malik hoon.*'] },
    { names: ['love', 'lovetext', 'iloveyou'], desc: 'Love text', replies: ['\u2764\ufe0f *I love you* \u2764\ufe0f'] },
    { names: ['sad', 'sadtext'], desc: 'Sad text', replies: ['\ud83d\ude22 *Dil toot gaya...*'] },
    { names: ['happy', 'happytext'], desc: 'Happy text', replies: ['\ud83d\ude04 *Khushiyan hi khushiyan!*'] },
    { names: ['motivation', 'motivational', 'quote_motivation'], desc: 'Motivation', replies: ['\ud83d\udcaa *Mehnat karo, kamyabi zaroor milegi.*'] },
    { names: ['status', 'statustext'], desc: 'Status text', replies: ['\u2728 *Status:* Zindagi ek safar hai, chalte raho.'] },
    { names: ['biodata', 'bio'], desc: 'Bio maker', replies: ['\ud83d\udcdd Bio: _Simple, honest, aur thoda sa crazy._'] },
    { names: ['nameart', 'nameframe'], desc: 'Name art', replies: ['\u2728\u2728 *YOUR NAME* \u2728\u2728'] },
    { names: ['dp', 'dpart'], desc: 'DP text', replies: ['\ud83d\uddbc\ufe0f DP text ready.'] },
    { names: ['neon', 'neontext'], desc: 'Neon text', replies: ['\ud83d\udca1 N\u039e\u0325\u0325O\u0325\u0325N \u0325\u0325T\u0325\u0325E\u0325\u0325X\u0325\u0325T'] },
    { names: ['glitch', 'glitchtext'], desc: 'Glitch text', replies: ['G\u0338L\u0338I\u0338T\u0338C\u0338H\u0338'] },
    { names: ['strikethrough', 'strike'], desc: 'Strike text', replies: ['S\u0336t\u0336r\u0336i\u0336k\u0336e\u0336'] },
    { names: ['underline', 'underlinetext'], desc: 'Underline text', replies: ['U\u0332n\u0332d\u0332e\u0332r\u0332l\u0332i\u0332n\u0332e\u0332'] },
    { names: ['overline', 'overlinetext'], desc: 'Overline text', replies: ['O\u0305v\u0305e\u0305r\u0305l\u0305i\u0305n\u0305e\u0305'] },
    { names: ['zalgo', 'cursedtext'], desc: 'Zalgo text', replies: ['Z\u0350a\u0351l\u0352g\u0353o\u0354'] },
    { names: ['spaced', 'spacedtext'], desc: 'Spaced text', replies: ['S P A C E D'] },
    { names: ['mirror', 'mirrortext'], desc: 'Mirror text', replies: ['\u0258\u0279\u0279\u1d09\u1d0d'] },
    { names: ['leet', '1337'], desc: 'Leet text', replies: ['1337 5P34K'] },
    { names: ['pig', 'piglatin'], desc: 'Pig latin', replies: ['ellohay orldway'] },
    { names: ['rot13', 'rot'], desc: 'ROT13', replies: ['Ebpx naq Ebyy'] },
    { names: ['atbash', 'atbashtext'], desc: 'Atbash', replies: ['Zgyzhs'] },
  ]);
};
