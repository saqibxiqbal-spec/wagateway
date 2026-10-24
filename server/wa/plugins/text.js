/** TEXT: text analysis, counting, formatting, transformations. */

const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const arg = (ctx) => ctx.args.join(' ');

  def({ name: ['count', 'textcount', 'chars'], category: 'text', desc: '.count <text> \u2014 characters ginein',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return `\ud83d\udd22 Characters: *${t.length}*`; } });

  def({ name: ['words', 'wordcount2'], category: 'text', desc: '.words <text> \u2014 words ginein',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const w = t.trim().split(/\s+/).filter(Boolean).length; return `\ud83d\udcdd Words: *${w}*`; } });

  def({ name: ['lines', 'linecount'], category: 'text', desc: '.lines <text> \u2014 lines ginein',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return `\ud83d\udcc4 Lines: *${t.split('\n').length}*`; } });

  def({ name: ['sentences', 'sentencecount'], category: 'text', desc: '.sentences <text> \u2014 sentences',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const s = t.split(/[.!?]+/).filter((x) => x.trim()).length; return `\ud83d\udcdd Sentences: *${s}*`; } });

  def({ name: ['paragraphs', 'paracount'], category: 'text', desc: '.paragraphs <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const p = t.split(/\n\s*\n/).filter((x) => x.trim()).length; return `\ud83d\udcd6 Paragraphs: *${p}*`; } });

  def({ name: ['vowels', 'vowelcount'], category: 'text', desc: '.vowels <text>',
    run: async (ctx) => { const t = arg(ctx); const v = (t.match(/[aeiou]/gi) || []).length; return `\ud83d\udd24 Vowels: *${v}*`; } });

  def({ name: ['consonants', 'conscount'], category: 'text', desc: '.consonants <text>',
    run: async (ctx) => { const t = arg(ctx); const c = (t.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length; return `\ud83d\udd23 Consonants: *${c}*`; } });

  def({ name: ['digits', 'digitcount'], category: 'text', desc: '.digits <text>',
    run: async (ctx) => { const t = arg(ctx); const d = (t.match(/\d/g) || []).length; return `\ud83d\udd22 Digits: *${d}*`; } });

  def({ name: ['spaces', 'spacecount'], category: 'text', desc: '.spaces <text>',
    run: async (ctx) => { const t = arg(ctx); const s = (t.match(/\s/g) || []).length; return `\u2423 Spaces: *${s}*`; } });

  def({ name: ['punctuation', 'punctcount'], category: 'text', desc: '.punctuation <text>',
    run: async (ctx) => { const t = arg(ctx); const p = (t.match(/[.,!?;:'"()[\]{}]/g) || []).length; return `\u2757 Punctuation: *${p}*`; } });

  def({ name: ['palindrome', 'palindrometext'], category: 'text', desc: '.palindrome <text>',
    run: async (ctx) => { const t = arg(ctx).toLowerCase().replace(/[^a-z0-9]/g, ''); if (!t) return '\u274c Text dein.'; const ok = t === t.split('').reverse().join(''); return ok ? `\u2705 Haan! *${arg(ctx)}* palindrome hai.` : `\u274c Nahi, *${arg(ctx)}* palindrome nahi hai.`; } });

  def({ name: ['anagram', 'anagramcheck'], category: 'text', desc: '.anagram <a> | <b>',
    run: async (ctx) => { const parts = arg(ctx).split('|'); if (parts.length < 2) return '\u274c Misal: `.anagram listen | silent`'; const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join(''); return norm(parts[0]) === norm(parts[1]) ? '\u2705 Anagram hai!' : '\u274c Anagram nahi hai.'; } });

  def({ name: ['rot13text', 'caesar'], category: 'text', desc: '.rot13text <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)); } });

  def({ name: ['title', 'titlecase2'], category: 'text', desc: '.title <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()); } });

  def({ name: ['sentencecase', 'sentence'], category: 'text', desc: '.sentencecase <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase()); } });

  def({ name: ['alternating', 'altcase'], category: 'text', desc: '.alternating <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return Array.from(t).map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''); } });

  def({ name: ['invertcase', 'togglecase'], category: 'text', desc: '.invertcase <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return Array.from(t).map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(''); } });

  def({ name: ['nospace', 'removespaces'], category: 'text', desc: '.nospace <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.replace(/\s+/g, ''); } });

  def({ name: ['extraspace', 'doublespace'], category: 'text', desc: '.extraspace <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.split('').join(' '); } });

  def({ name: ['shuffle_text', 'scramble'], category: 'text', desc: '.shuffle_text <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.split('').sort(() => Math.random() - 0.5).join(''); } });

  def({ name: ['sortwords', 'wordsort'], category: 'text', desc: '.sortwords <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.split(/\s+/).sort().join(' '); } });

  def({ name: ['revwords', 'reversewords'], category: 'text', desc: '.revwords <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.split(/\s+/).reverse().join(' '); } });

  def({ name: ['revlines', 'reverselines'], category: 'text', desc: '.revlines <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return t.split('\n').reverse().join('\n'); } });

  def({ name: ['firstword', 'first'], category: 'text', desc: '.firstword <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; return `\u27a1\ufe0f *${t.split(/\s+/)[0]}*`; } });

  def({ name: ['lastword', 'last'], category: 'text', desc: '.lastword <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const w = t.split(/\s+/); return `\u2b05\ufe0f *${w[w.length - 1]}*`; } });

  def({ name: ['longestword', 'longest'], category: 'text', desc: '.longestword <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const w = t.split(/\s+/).sort((a, b) => b.length - a.length)[0]; return `\ud83d\udcdd Longest: *${w}* (${w.length})`; } });

  def({ name: ['shortestword', 'shortest'], category: 'text', desc: '.shortestword <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const w = t.split(/\s+/).sort((a, b) => a.length - b.length)[0]; return `\ud83d\udcdd Shortest: *${w}* (${w.length})`; } });

  def({ name: ['unique_words', 'uniqwords'], category: 'text', desc: '.unique_words <text>',
    run: async (ctx) => { const t = arg(ctx); if (!t) return '\u274c Text dein.'; const u = [...new Set(t.toLowerCase().split(/\s+/))]; return `\ud83d\udd22 Unique words: *${u.length}*\n${u.slice(0, 30).join(', ')}`; } });

  def({ name: ['wordfreq', 'frequency'], category: 'text', desc: '.wordfreq <text>',
    run: async (ctx) => { const t = arg(ctx).toLowerCase().split(/\s+/).filter(Boolean); if (!t.length) return '\u274c Text dein.'; const m = {}; t.forEach((w) => (m[w] = (m[w] || 0) + 1)); const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10); return '\ud83d\udcca Top words:\n' + top.map(([w, n]) => `\u2022 ${w}: ${n}`).join('\n'); } });

  def({ name: ['charcount_map', 'charmap'], category: 'text', desc: '.charcount_map <text>',
    run: async (ctx) => { const t = arg(ctx).replace(/\s/g, ''); if (!t) return '\u274c Text dein.'; const m = {}; Array.from(t).forEach((c) => (m[c] = (m[c] || 0) + 1)); return '\ud83d\udd24 Chars:\n' + Object.entries(m).slice(0, 20).map(([c, n]) => `\u2022 ${c}: ${n}`).join('\n'); } });

  def({ name: ['readtime', 'readingtime'], category: 'text', desc: '.readtime <text>',
    run: async (ctx) => { const t = arg(ctx); const w = t.trim().split(/\s+/).filter(Boolean).length; const min = Math.max(1, Math.ceil(w / 200)); return `\u23f1\ufe0f Reading time: *${min} min* (${w} words)`; } });

  def({ name: ['speaktime', 'speakingtime'], category: 'text', desc: '.speaktime <text>',
    run: async (ctx) => { const t = arg(ctx); const w = t.trim().split(/\s+/).filter(Boolean).length; const min = Math.max(1, Math.ceil(w / 130)); return `\ud83c\udfa4 Speaking time: *${min} min* (${w} words)`; } });

  bulk(defMany, 'text', [
    { names: ['uppercase2', 'allcaps'], desc: 'UPPERCASE', replies: [(c) => (c.args.join(' ') || 'text').toUpperCase()] },
    { names: ['lowercase2', 'allsmall'], desc: 'lowercase', replies: [(c) => (c.args.join(' ') || 'TEXT').toLowerCase()] },
    { names: ['trim2', 'strip'], desc: 'Trim text', replies: [(c) => (c.args.join(' ') || '').trim() || '(khali)'] },
    { names: ['slug2', 'urlslug'], desc: 'Slug', replies: [(c) => (c.args.join(' ') || 'hello world').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')] },
    { names: ['camel2', 'camelcase2'], desc: 'camelCase', replies: [(c) => (c.args.join(' ') || 'hello world').replace(/\s+(.)/g, (_, x) => x.toUpperCase())] },
    { names: ['snake2', 'snakecase2'], desc: 'snake_case', replies: [(c) => (c.args.join(' ') || 'hello world').toLowerCase().replace(/\s+/g, '_')] },
    { names: ['kebab2', 'kebabcase2'], desc: 'kebab-case', replies: [(c) => (c.args.join(' ') || 'hello world').toLowerCase().replace(/\s+/g, '-')] },
    { names: ['constant', 'constcase'], desc: 'CONSTANT_CASE', replies: [(c) => (c.args.join(' ') || 'hello world').toUpperCase().replace(/\s+/g, '_')] },
    { names: ['pascal', 'pascalcase'], desc: 'PascalCase', replies: [(c) => (c.args.join(' ') || 'hello world').replace(/(^|\s)(.)/g, (_, s, x) => x.toUpperCase())] },
    { names: ['dotcase', 'dot'], desc: 'dot.case', replies: [(c) => (c.args.join(' ') || 'hello world').toLowerCase().replace(/\s+/g, '.')] },
    { names: ['pathcase', 'path'], desc: 'path/case', replies: [(c) => (c.args.join(' ') || 'hello world').toLowerCase().replace(/\s+/g, '/')] },
    { names: ['textstats', 'textinfo'], desc: 'Text stats', replies: ['\ud83d\udcca Text stats ke liye `.count`, `.words`, `.lines` use karein.'] },
    { names: ['striphtml', 'nohtml'], desc: 'Strip HTML', replies: [(c) => (c.args.join(' ') || '<b>hi</b>').replace(/<[^>]*>/g, '')] },
    { names: ['stripemoji', 'noemoji'], desc: 'Strip emoji', replies: [(c) => (c.args.join(' ') || 'hi \ud83d\ude00').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '')] },
    { names: ['onlyemoji', 'emojionly'], desc: 'Only emoji', replies: [(c) => (c.args.join(' ') || 'hi \ud83d\ude00').replace(/[^\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '')] },
    { names: ['onlynumbers', 'numbersonly'], desc: 'Only numbers', replies: [(c) => (c.args.join(' ') || 'abc123').replace(/\D/g, '')] },
    { names: ['onlyletters', 'lettersonly'], desc: 'Only letters', replies: [(c) => (c.args.join(' ') || 'abc123').replace(/[^a-zA-Z]/g, '')] },
    { names: ['swapcase2', 'swapcase3'], desc: 'Swap case', replies: [(c) => Array.from(c.args.join(' ') || 'Hello').map((x) => (x === x.toUpperCase() ? x.toLowerCase() : x.toUpperCase())).join('')] },
    { names: ['wrap', 'wordwrap'], desc: 'Word wrap', replies: [(c) => (c.args.join(' ') || 'hello world').replace(/(.{20})/g, '$1\n')] },
    { names: ['truncate', 'shorten'], desc: 'Truncate', replies: [(c) => (c.args.join(' ') || 'hello world').slice(0, 50)] },
    { names: ['padleft', 'leftpad'], desc: 'Pad left', replies: [(c) => (c.args.join(' ') || 'hi').padStart(20, ' ')] },
    { names: ['padright', 'rightpad'], desc: 'Pad right', replies: [(c) => (c.args.join(' ') || 'hi').padEnd(20, ' ')] },
    { names: ['center', 'centertext'], desc: 'Center text', replies: [(c) => (c.args.join(' ') || 'hi').padStart(30, ' ')] },
    { names: ['quote_text', 'quoteit'], desc: 'Quote text', replies: [(c) => `\u201c${c.args.join(' ') || 'text'}\u201d`] },
    { names: ['bracket', 'brackettext'], desc: 'Bracket text', replies: [(c) => `[${c.args.join(' ') || 'text'}]`] },
    { names: ['paren', 'parentext'], desc: 'Paren text', replies: [(c) => `(${c.args.join(' ') || 'text'})`] },
    { names: ['curly', 'curlytext'], desc: 'Curly text', replies: [(c) => `{${c.args.join(' ') || 'text'}}`] },
    { names: ['angle', 'angletext'], desc: 'Angle text', replies: [(c) => `<${c.args.join(' ') || 'text'}>`] },
    { names: ['repeat2', 'dup'], desc: 'Duplicate text', replies: [(c) => { const t = c.args.join(' ') || 'hi'; return t + ' ' + t; }] },
    { names: ['mirror2', 'mirrorline'], desc: 'Mirror line', replies: [(c) => { const t = c.args.join(' ') || 'hi'; return t + ' | ' + t.split('').reverse().join(''); }] },
  ]);
};
