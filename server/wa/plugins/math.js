/** MATH: arithmetic, number theory, statistics, geometry. */

const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const n1 = (ctx) => parseFloat(ctx.args[0]);
  const n2 = (ctx) => parseFloat(ctx.args[1]);
  const bad = '\u274c Number dein. Misal: `.sqrt 16`';

  def({ name: ['add', 'plus', 'sum2'], category: 'math', desc: '.add <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\u2795 ${a} + ${b} = *${a + b}*`; } });
  def({ name: ['sub', 'minus', 'subtract'], category: 'math', desc: '.sub <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\u2796 ${a} - ${b} = *${a - b}*`; } });
  def({ name: ['mul', 'times', 'multiply'], category: 'math', desc: '.mul <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\u2716\ufe0f ${a} \u00d7 ${b} = *${a * b}*`; } });
  def({ name: ['div', 'divide'], category: 'math', desc: '.div <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); if (Number.isNaN(a) || Number.isNaN(b)) return bad; if (b === 0) return '\u274c Zero se divide nahi hota.'; return `\u2797 ${a} \u00f7 ${b} = *${a / b}*`; } });
  def({ name: ['mod', 'remainder'], category: 'math', desc: '.mod <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\ud83d\udd22 ${a} mod ${b} = *${a % b}*`; } });
  def({ name: ['pow2', 'power'], category: 'math', desc: '.pow2 <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\ud83d\udd22 ${a}^${b} = *${a ** b}*`; } });
  def({ name: ['sqrt2', 'squareroot'], category: 'math', desc: '.sqrt2 <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u221a${a} = *${Math.sqrt(a)}*`; } });
  def({ name: ['cbrt', 'cuberoot'], category: 'math', desc: '.cbrt <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u221b${a} = *${Math.cbrt(a)}*`; } });
  def({ name: ['abs', 'absolute'], category: 'math', desc: '.abs <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `|${a}| = *${Math.abs(a)}*`; } });
  def({ name: ['round', 'roundnum'], category: 'math', desc: '.round <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 ${a} \u2192 *${Math.round(a)}*`; } });
  def({ name: ['ceil', 'ceiling'], category: 'math', desc: '.ceil <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u2191 ${a} \u2192 *${Math.ceil(a)}*`; } });
  def({ name: ['floor', 'floornum'], category: 'math', desc: '.floor <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u2193 ${a} \u2192 *${Math.floor(a)}*`; } });
  def({ name: ['fact', 'factorial'], category: 'math', desc: '.fact <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); if (Number.isNaN(a) || a < 0 || a > 170) return '\u274c 0 se 170 tak number dein.'; let r = 1; for (let i = 2; i <= a; i++) r *= i; return `\ud83d\udd22 ${a}! = *${r}*`; } });
  def({ name: ['fib', 'fibonacci'], category: 'math', desc: '.fib <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); if (Number.isNaN(a) || a < 0 || a > 90) return '\u274c 0 se 90 tak number dein.'; let x = 0, y = 1; for (let i = 0; i < a; i++) [x, y] = [y, x + y]; return `\ud83d\udd22 Fib(${a}) = *${x}*`; } });
  def({ name: ['prime', 'isprime'], category: 'math', desc: '.prime <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); if (Number.isNaN(a)) return bad; if (a < 2) return `\u274c ${a} prime nahi hai.`; for (let i = 2; i * i <= a; i++) if (a % i === 0) return `\u274c ${a} prime nahi hai (${i} se divide hota hai).`; return `\u2705 ${a} prime hai.`; } });
  def({ name: ['gcd', 'hcf'], category: 'math', desc: '.gcd <a> <b>', run: async (ctx) => { let a = Math.abs(parseInt(ctx.args[0], 10)), b = Math.abs(parseInt(ctx.args[1], 10)); if (Number.isNaN(a) || Number.isNaN(b)) return bad; while (b) [a, b] = [b, a % b]; return `\ud83d\udd22 GCD = *${a}*`; } });
  def({ name: ['lcm'], category: 'math', desc: '.lcm <a> <b>', run: async (ctx) => { let a = Math.abs(parseInt(ctx.args[0], 10)), b = Math.abs(parseInt(ctx.args[1], 10)); if (Number.isNaN(a) || Number.isNaN(b)) return bad; const g = (x, y) => (y ? g(y, x % y) : x); return `\ud83d\udd22 LCM = *${(a * b) / g(a, b)}*`; } });
  def({ name: ['sin', 'sine'], category: 'math', desc: '.sin <deg>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udcd0 sin(${a}\u00b0) = *${Math.sin(a * Math.PI / 180).toFixed(6)}*`; } });
  def({ name: ['cos', 'cosine'], category: 'math', desc: '.cos <deg>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udcd0 cos(${a}\u00b0) = *${Math.cos(a * Math.PI / 180).toFixed(6)}*`; } });
  def({ name: ['tan', 'tangent'], category: 'math', desc: '.tan <deg>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udcd0 tan(${a}\u00b0) = *${Math.tan(a * Math.PI / 180).toFixed(6)}*`; } });
  def({ name: ['log10', 'log'], category: 'math', desc: '.log10 <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 log10(${a}) = *${Math.log10(a).toFixed(6)}*`; } });
  def({ name: ['ln', 'naturallog'], category: 'math', desc: '.ln <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 ln(${a}) = *${Math.log(a).toFixed(6)}*`; } });
  def({ name: ['exp', 'exponential'], category: 'math', desc: '.exp <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 e^${a} = *${Math.exp(a).toFixed(6)}*`; } });
  def({ name: ['avg', 'average', 'mean'], category: 'math', desc: '.avg 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); if (!arr.length) return '\u274c Numbers dein: `.avg 1 2 3`'; return `\ud83d\udcca Average = *${(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(4)}*`; } });
  def({ name: ['median'], category: 'math', desc: '.median 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)).sort((a, b) => a - b); if (!arr.length) return '\u274c Numbers dein.'; const m = Math.floor(arr.length / 2); const v = arr.length % 2 ? arr[m] : (arr[m - 1] + arr[m]) / 2; return `\ud83d\udcca Median = *${v}*`; } });
  def({ name: ['mode'], category: 'math', desc: '.mode 1 2 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); if (!arr.length) return '\u274c Numbers dein.'; const m = {}; arr.forEach((x) => (m[x] = (m[x] || 0) + 1)); const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0]; return `\ud83d\udcca Mode = *${top[0]}* (${top[1]}x)`; } });
  def({ name: ['range'], category: 'math', desc: '.range 1 5 9', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); if (!arr.length) return '\u274c Numbers dein.'; return `\ud83d\udcca Range = *${Math.max(...arr) - Math.min(...arr)}*`; } });
  def({ name: ['min', 'minimum'], category: 'math', desc: '.min 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); return arr.length ? `\u2b07\ufe0f Min = *${Math.min(...arr)}*` : '\u274c Numbers dein.'; } });
  def({ name: ['max', 'maximum'], category: 'math', desc: '.max 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); return arr.length ? `\u2b06\ufe0f Max = *${Math.max(...arr)}*` : '\u274c Numbers dein.'; } });
  def({ name: ['sum', 'total_sum'], category: 'math', desc: '.sum 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); return arr.length ? `\u2795 Sum = *${arr.reduce((a, b) => a + b, 0)}*` : '\u274c Numbers dein.'; } });
  def({ name: ['product', 'prod'], category: 'math', desc: '.product 2 3 4', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); return arr.length ? `\u2716\ufe0f Product = *${arr.reduce((a, b) => a * b, 1)}*` : '\u274c Numbers dein.'; } });
  def({ name: ['variance', 'var'], category: 'math', desc: '.variance 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); if (!arr.length) return '\u274c Numbers dein.'; const m = arr.reduce((a, b) => a + b, 0) / arr.length; const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length; return `\ud83d\udcca Variance = *${v.toFixed(4)}*`; } });
  def({ name: ['stddev', 'sd'], category: 'math', desc: '.stddev 1 2 3', run: async (ctx) => { const arr = ctx.args.map(Number).filter((x) => !Number.isNaN(x)); if (!arr.length) return '\u274c Numbers dein.'; const m = arr.reduce((a, b) => a + b, 0) / arr.length; const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length; return `\ud83d\udcca StdDev = *${Math.sqrt(v).toFixed(4)}*`; } });
  def({ name: ['percent2', 'percentage'], category: 'math', desc: '.percent2 <part> <whole>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); if (Number.isNaN(a) || Number.isNaN(b) || b === 0) return '\u274c Misal: `.percent2 25 200`'; return `\ud83d\udcca ${a} / ${b} = *${((a / b) * 100).toFixed(2)}%*`; } });
  def({ name: ['percentof', 'pctof'], category: 'math', desc: '.percentof <pct> <n>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); if (Number.isNaN(a) || Number.isNaN(b)) return '\u274c Misal: `.percentof 20 500`'; return `\ud83d\udcca ${a}% of ${b} = *${(a / 100) * b}*`; } });
  def({ name: ['increase', 'percentincrease'], category: 'math', desc: '.increase <old> <new>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); if (Number.isNaN(a) || Number.isNaN(b) || a === 0) return '\u274c Misal: `.increase 100 150`'; return `\ud83d\udcc8 Increase = *${(((b - a) / a) * 100).toFixed(2)}%*`; } });
  def({ name: ['decrease', 'percentdecrease'], category: 'math', desc: '.decrease <old> <new>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); if (Number.isNaN(a) || Number.isNaN(b) || a === 0) return '\u274c Misal: `.decrease 150 100`'; return `\ud83d\udcc9 Decrease = *${(((a - b) / a) * 100).toFixed(2)}%*`; } });
  def({ name: ['area_rect', 'rectarea'], category: 'math', desc: '.area_rect <l> <w>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\ud83d\udcd0 Area = *${a * b}* sq units`; } });
  def({ name: ['area_circle', 'circlearea'], category: 'math', desc: '.area_circle <r>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u26ab Area = *${(Math.PI * a * a).toFixed(4)}* sq units`; } });
  def({ name: ['circumference', 'circleperimeter'], category: 'math', desc: '.circumference <r>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\u26ab Circumference = *${(2 * Math.PI * a).toFixed(4)}* units`; } });
  def({ name: ['area_triangle', 'trianglearea'], category: 'math', desc: '.area_triangle <b> <h>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\ud83d\udd3a Area = *${(0.5 * a * b).toFixed(4)}* sq units`; } });
  def({ name: ['volume_cube', 'cubevolume'], category: 'math', desc: '.volume_cube <s>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83e\uddca Volume = *${a ** 3}* cubic units`; } });
  def({ name: ['volume_sphere', 'spherevolume'], category: 'math', desc: '.volume_sphere <r>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83c\udf10 Volume = *${((4 / 3) * Math.PI * a ** 3).toFixed(4)}* cubic units`; } });
  def({ name: ['hypotenuse', 'pythagoras'], category: 'math', desc: '.hypotenuse <a> <b>', run: async (ctx) => { const a = n1(ctx), b = n2(ctx); return Number.isNaN(a) || Number.isNaN(b) ? bad : `\ud83d\udcd0 Hypotenuse = *${Math.hypot(a, b).toFixed(4)}*`; } });
  def({ name: ['table', 'multiplytable'], category: 'math', desc: '.table <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); if (Number.isNaN(a)) return '\u274c Misal: `.table 7`'; let out = `\ud83d\udcdd *Table of ${a}*\n`; for (let i = 1; i <= 10; i++) out += `${a} \u00d7 ${i} = ${a * i}\n`; return out; } });
  def({ name: ['square', 'squarenum'], category: 'math', desc: '.square <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 ${a}\u00b2 = *${a * a}*`; } });
  def({ name: ['cube', 'cubenum'], category: 'math', desc: '.cube <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 ${a}\u00b3 = *${a ** 3}*`; } });
  def({ name: ['double', 'doublenum'], category: 'math', desc: '.double <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 2 \u00d7 ${a} = *${a * 2}*`; } });
  def({ name: ['half', 'halfnum'], category: 'math', desc: '.half <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 ${a} / 2 = *${a / 2}*`; } });
  def({ name: ['negate', 'negative'], category: 'math', desc: '.negate <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udd22 -(${a}) = *${-a}*`; } });
  def({ name: ['isEven', 'even'], category: 'math', desc: '.isEven <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); return Number.isNaN(a) ? bad : `${a % 2 === 0 ? '\u2705 Even' : '\u274c Odd'} (${a})`; } });
  def({ name: ['isOdd', 'odd'], category: 'math', desc: '.isOdd <n>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10); return Number.isNaN(a) ? bad : `${a % 2 !== 0 ? '\u2705 Odd' : '\u274c Even'} (${a})`; } });
  def({ name: ['isPositive', 'positive'], category: 'math', desc: '.isPositive <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `${a > 0 ? '\u2705 Positive' : a < 0 ? '\u274c Negative' : '\u26aa Zero'}`; } });
  def({ name: ['isNegative', 'negative2'], category: 'math', desc: '.isNegative <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `${a < 0 ? '\u2705 Negative' : '\u274c Not negative'}`; } });
  def({ name: ['isInteger', 'integer'], category: 'math', desc: '.isInteger <n>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `${Number.isInteger(a) ? '\u2705 Integer' : '\u274c Not integer'}`; } });
  def({ name: ['isNaN', 'nancheck'], category: 'math', desc: '.isNaN <n>', run: async (ctx) => `${Number.isNaN(n1(ctx)) ? '\u2705 NaN' : '\u274c Not NaN'}` });
  def({ name: ['random_math', 'mathrandom'], category: 'math', desc: '.random_math', run: async () => `\ud83c\udfb2 Random: *${Math.random().toFixed(6)}*` });
  def({ name: ['pi', 'pivalue'], category: 'math', desc: '.pi', run: async () => `\ud83d\udcd0 \u03c0 = *${Math.PI}*` });
  def({ name: ['e', 'evalue'], category: 'math', desc: '.e', run: async () => `\ud83d\udcd0 e = *${Math.E}*` });
  def({ name: ['phi', 'goldenratio'], category: 'math', desc: '.phi', run: async () => `\ud83d\udcd0 \u03c6 = *${((1 + Math.sqrt(5)) / 2).toFixed(10)}*` });
  def({ name: ['infinity', 'inf'], category: 'math', desc: '.infinity', run: async () => `\u267e\ufe0f \u221e` });
  def({ name: ['deg2rad', 'degtorad'], category: 'math', desc: '.deg2rad <deg>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udcd0 ${a}\u00b0 = *${(a * Math.PI / 180).toFixed(6)} rad*`; } });
  def({ name: ['rad2deg', 'radtodeg'], category: 'math', desc: '.rad2deg <rad>', run: async (ctx) => { const a = n1(ctx); return Number.isNaN(a) ? bad : `\ud83d\udcd0 ${a} rad = *${(a * 180 / Math.PI).toFixed(4)}\u00b0*`; } });

  bulk(defMany, 'math', [
    { names: ['mathhelp', 'mathmenu'], desc: 'Math help', replies: ['\ud83e\uddee `.add`, `.sub`, `.mul`, `.div`, `.sqrt2`, `.avg`, `.table` \u2014 aur bohot kuch!'] },
    { names: ['calculator', 'calc2'], desc: 'Calculator', replies: ['\ud83e\uddee `.calc 25*4` use karein.'] },
    { names: ['mathconstants', 'constants'], desc: 'Constants', replies: ['\ud83d\udcd0 pi, e, phi \u2014 `.pi`, `.e`, `.phi`'] },
    { names: ['geometry', 'geo'], desc: 'Geometry', replies: ['\ud83d\udcd0 `.area_rect`, `.area_circle`, `.area_triangle`, `.volume_cube`'] },
    { names: ['statistics', 'stats_math'], desc: 'Statistics', replies: ['\ud83d\udcca `.avg`, `.median`, `.mode`, `.variance`, `.stddev`'] },
    { names: ['numbertheory', 'numtheory'], desc: 'Number theory', replies: ['\ud83d\udd22 `.prime`, `.gcd`, `.lcm`, `.fact`, `.fib`'] },
    { names: ['trigonometry', 'trig'], desc: 'Trig', replies: ['\ud83d\udcd0 `.sin`, `.cos`, `.tan`'] },
    { names: ['logarithms', 'logs'], desc: 'Logs', replies: ['\ud83d\udd22 `.log10`, `.ln`, `.exp`'] },
    { names: ['algebra', 'alg'], desc: 'Algebra', replies: ['\ud83e\uddee `.calc` se expressions solve karein.'] },
    { names: ['arithmetic', 'arith'], desc: 'Arithmetic', replies: ['\u2795 `.add`, `.sub`, `.mul`, `.div`'] },
  ]);
};
