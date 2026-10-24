/** CONVERTER: unit / currency / number-base conversions. */

const { fetchJson } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  const num = (ctx) => parseFloat(ctx.args[0]);

  const unit = (name, aliases, desc, factor, unitLabel) =>
    def({ name: [name, ...aliases], category: 'converter', desc, run: async (ctx) => {
      const v = num(ctx);
      if (Number.isNaN(v)) return `\u274c Misal: \`.${name} 10\``;
      return `\ud83d\udd04 ${v} \u2192 *${(v * factor).toFixed(4).replace(/\.?0+$/, '')} ${unitLabel}*`;
    } });

  unit('km2m', ['kmtom'], '.km2m <km> \u2014 km to meter', 1000, 'm');
  unit('m2km', ['mtokm'], '.m2km <m> \u2014 meter to km', 0.001, 'km');
  unit('cm2m', ['cmtom'], '.cm2m <cm> \u2014 cm to meter', 0.01, 'm');
  unit('m2cm', ['mtocm'], '.m2cm <m> \u2014 meter to cm', 100, 'cm');
  unit('mm2cm', ['mmtocm'], '.mm2cm <mm> \u2014 mm to cm', 0.1, 'cm');
  unit('cm2mm', ['cmtomm'], '.cm2mm <cm> \u2014 cm to mm', 10, 'mm');
  unit('km2mi', ['kmtomi'], '.km2mi <km> \u2014 km to miles', 0.621371, 'mi');
  unit('mi2km', ['mitokm'], '.mi2km <mi> \u2014 miles to km', 1.60934, 'km');
  unit('m2ft', ['mtoft'], '.m2ft <m> \u2014 meter to feet', 3.28084, 'ft');
  unit('ft2m', ['fttom'], '.ft2m <ft> \u2014 feet to meter', 0.3048, 'm');
  unit('in2cm', ['intocm'], '.in2cm <in> \u2014 inch to cm', 2.54, 'cm');
  unit('cm2in', ['cmtoin'], '.cm2in <cm> \u2014 cm to inch', 0.393701, 'in');
  unit('ft2in', ['fttoin'], '.ft2in <ft> \u2014 feet to inch', 12, 'in');
  unit('in2ft', ['intoft'], '.in2ft <in> \u2014 inch to feet', 0.0833333, 'ft');
  unit('yd2m', ['ydtom'], '.yd2m <yd> \u2014 yard to meter', 0.9144, 'm');
  unit('m2yd', ['mtoyd'], '.m2yd <m> \u2014 meter to yard', 1.09361, 'yd');
  unit('kg2g', ['kgtog'], '.kg2g <kg> \u2014 kg to gram', 1000, 'g');
  unit('g2kg', ['gtokg'], '.g2kg <g> \u2014 gram to kg', 0.001, 'kg');
  unit('kg2lb', ['kgtolb'], '.kg2lb <kg> \u2014 kg to pound', 2.20462, 'lb');
  unit('lb2kg', ['lbtokg'], '.lb2kg <lb> \u2014 pound to kg', 0.453592, 'kg');
  unit('g2mg', ['gtomg'], '.g2mg <g> \u2014 gram to mg', 1000, 'mg');
  unit('mg2g', ['mgtog'], '.mg2g <mg> \u2014 mg to gram', 0.001, 'g');
  unit('ton2kg', ['tontokg'], '.ton2kg <ton> \u2014 ton to kg', 1000, 'kg');
  unit('oz2g', ['oztog'], '.oz2g <oz> \u2014 ounce to gram', 28.3495, 'g');
  unit('l2ml', ['ltoml'], '.l2ml <l> \u2014 liter to ml', 1000, 'ml');
  unit('ml2l', ['mltol'], '.ml2l <ml> \u2014 ml to liter', 0.001, 'l');
  unit('gal2l', ['galtol'], '.gal2l <gal> \u2014 gallon to liter', 3.78541, 'l');
  unit('l2gal', ['ltogal'], '.l2gal <l> \u2014 liter to gallon', 0.264172, 'gal');
  unit('cup2ml', ['cuptoml'], '.cup2ml <cup> \u2014 cup to ml', 236.588, 'ml');
  unit('c2f', ['ctof'], '.c2f <c> \u2014 Celsius to Fahrenheit', 1, '');
  unit('f2c', ['ftoc'], '.f2c <f> \u2014 Fahrenheit to Celsius', 1, '');
  unit('kmh2mph', ['kmhtomph'], '.kmh2mph <km/h> \u2014 speed', 0.621371, 'mph');
  unit('mph2kmh', ['mphtokmh'], '.mph2kmh <mph> \u2014 speed', 1.60934, 'km/h');
  unit('mb2gb', ['mbtogb'], '.mb2gb <mb> \u2014 MB to GB', 0.001, 'GB');
  unit('gb2mb', ['gbtomb'], '.gb2mb <gb> \u2014 GB to MB', 1000, 'MB');
  unit('kb2mb', ['kbtomb'], '.kb2mb <kb> \u2014 KB to MB', 0.001, 'MB');
  unit('mb2kb', ['mbtokb'], '.mb2kb <mb> \u2014 MB to KB', 1000, 'KB');
  unit('tb2gb', ['tbtogb'], '.tb2gb <tb> \u2014 TB to GB', 1000, 'GB');
  unit('gb2tb', ['gbtotb'], '.gb2tb <gb> \u2014 GB to TB', 0.001, 'TB');
  unit('bytes2kb', ['bytestokb'], '.bytes2kb <bytes>', 0.001, 'KB');
  unit('kb2bytes', ['kbtobytes'], '.kb2bytes <kb>', 1000, 'bytes');
  unit('sec2min', ['sectomin'], '.sec2min <sec>', 1 / 60, 'min');
  unit('min2sec', ['mintosec'], '.min2sec <min>', 60, 'sec');
  unit('min2hr', ['mintohr'], '.min2hr <min>', 1 / 60, 'hr');
  unit('hr2min', ['hrtomin'], '.hr2min <hr>', 60, 'min');
  unit('hr2day', ['hrtoday'], '.hr2day <hr>', 1 / 24, 'day');
  unit('day2hr', ['daytohr'], '.day2hr <day>', 24, 'hr');
  unit('day2week', ['daytoweek'], '.day2week <day>', 1 / 7, 'week');
  unit('week2day', ['weektoday'], '.week2day <week>', 7, 'day');
  unit('year2day', ['yeartoday'], '.year2day <year>', 365, 'day');
  unit('day2year', ['daytoyear'], '.day2year <day>', 1 / 365, 'year');
  unit('month2day', ['monthtoday'], '.month2day <month>', 30, 'day');
  unit('day2month', ['daytomonth'], '.day2month <day>', 1 / 30, 'month');
  unit('acre2sqm', ['acretosqm'], '.acre2sqm <acre>', 4046.86, 'm\u00b2');
  unit('sqm2acre', ['sqmtoacre'], '.sqm2acre <m\u00b2>', 0.000247105, 'acre');
  unit('hectare2acre', ['hectaretoacre'], '.hectare2acre <ha>', 2.47105, 'acre');
  unit('sqft2sqm', ['sqfttosqm'], '.sqft2sqm <ft\u00b2>', 0.092903, 'm\u00b2');
  unit('sqm2sqft', ['sqmtosqft'], '.sqm2sqft <m\u00b2>', 10.7639, 'ft\u00b2');
  unit('knot2kmh', ['knottokmh'], '.knot2kmh <knot>', 1.852, 'km/h');
  unit('hp2kw', ['hptokw'], '.hp2kw <hp>', 0.7457, 'kW');
  unit('kw2hp', ['kwtohp'], '.kw2hp <kW>', 1.34102, 'hp');

  // Temperature (special formulas)
  def({ name: ['celsius2fahrenheit', 'c2f2'], category: 'converter', desc: '.celsius2fahrenheit <c>', run: async (ctx) => { const v = num(ctx); if (Number.isNaN(v)) return '\u274c Misal: `.celsius2fahrenheit 30`'; return `\ud83c\udf21\ufe0f ${v}\u00b0C = *${(v * 9 / 5 + 32).toFixed(2)}\u00b0F*`; } });
  def({ name: ['fahrenheit2celsius', 'f2c2'], category: 'converter', desc: '.fahrenheit2celsius <f>', run: async (ctx) => { const v = num(ctx); if (Number.isNaN(v)) return '\u274c Misal: `.fahrenheit2celsius 86`'; return `\ud83c\udf21\ufe0f ${v}\u00b0F = *${((v - 32) * 5 / 9).toFixed(2)}\u00b0C*`; } });
  def({ name: ['c2k', 'celsiustokelvin'], category: 'converter', desc: '.c2k <c>', run: async (ctx) => { const v = num(ctx); return `\ud83c\udf21\ufe0f ${v}\u00b0C = *${(v + 273.15).toFixed(2)}K*`; } });
  def({ name: ['k2c', 'kelvintocelsius'], category: 'converter', desc: '.k2c <k>', run: async (ctx) => { const v = num(ctx); return `\ud83c\udf21\ufe0f ${v}K = *${(v - 273.15).toFixed(2)}\u00b0C*`; } });

  // Number bases
  def({ name: ['dec2bin', 'dectobin'], category: 'converter', desc: '.dec2bin <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 10); if (Number.isNaN(v)) return '\u274c Misal: `.dec2bin 10`'; return `\ud83d\udd22 ${v} \u2192 *${v.toString(2)}*`; } });
  def({ name: ['bin2dec', 'bintodec'], category: 'converter', desc: '.bin2dec <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 2); if (Number.isNaN(v)) return '\u274c Misal: `.bin2dec 1010`'; return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${v}*`; } });
  def({ name: ['dec2hex', 'dectohex'], category: 'converter', desc: '.dec2hex <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 10); if (Number.isNaN(v)) return '\u274c Misal: `.dec2hex 255`'; return `\ud83d\udd22 ${v} \u2192 *${v.toString(16).toUpperCase()}*`; } });
  def({ name: ['hex2dec', 'hextodec'], category: 'converter', desc: '.hex2dec <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 16); if (Number.isNaN(v)) return '\u274c Misal: `.hex2dec FF`'; return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${v}*`; } });
  def({ name: ['dec2oct', 'dectooct'], category: 'converter', desc: '.dec2oct <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 10); if (Number.isNaN(v)) return '\u274c Misal: `.dec2oct 64`'; return `\ud83d\udd22 ${v} \u2192 *${v.toString(8)}*`; } });
  def({ name: ['oct2dec', 'octtodec'], category: 'converter', desc: '.oct2dec <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 8); if (Number.isNaN(v)) return '\u274c Misal: `.oct2dec 100`'; return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${v}*`; } });
  def({ name: ['bin2hex', 'bintohex'], category: 'converter', desc: '.bin2hex <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 2); if (Number.isNaN(v)) return '\u274c Misal: `.bin2hex 1111`'; return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${v.toString(16).toUpperCase()}*`; } });
  def({ name: ['hex2bin', 'hextobin'], category: 'converter', desc: '.hex2bin <n>', run: async (ctx) => { const v = parseInt(ctx.args[0], 16); if (Number.isNaN(v)) return '\u274c Misal: `.hex2bin FF`'; return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${v.toString(2)}*`; } });
  def({ name: ['roman2num', 'romantodec'], category: 'converter', desc: '.roman2num <roman>', run: async (ctx) => { const s = (ctx.args[0] || '').toUpperCase(); const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let total = 0; for (let i = 0; i < s.length; i++) { const cur = map[s[i]]; const next = map[s[i + 1]]; if (!cur) return '\u274c Invalid Roman numeral.'; total += cur < next ? -cur : cur; } return `\ud83d\udd22 ${s} \u2192 *${total}*`; } });
  def({ name: ['num2roman', 'dectoroman'], category: 'converter', desc: '.num2roman <n>', run: async (ctx) => { let n = parseInt(ctx.args[0], 10); if (!n || n < 1 || n > 3999) return '\u274c 1 se 3999 ke darmiyan number dein.'; const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let out = ''; for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } } return `\ud83d\udd22 ${ctx.args[0]} \u2192 *${out}*`; } });

  // Currency (live)
  def({ name: ['currency', 'exchangerate', 'rate_currency'], category: 'converter', desc: '.currency <amount> <from> <to>', run: async (ctx) => {
    const amt = parseFloat(ctx.args[0]);
    const from = (ctx.args[1] || 'USD').toUpperCase();
    const to = (ctx.args[2] || 'PKR').toUpperCase();
    if (Number.isNaN(amt)) return '\u274c Misal: `.currency 100 USD PKR`';
    try {
      const d = await fetchJson(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const rate = d.rates[to];
      if (!rate) return `\u274c Currency ${to} nahi mili.`;
      return `\ud83d\udcb1 ${amt} ${from} = *${(amt * rate).toFixed(2)} ${to}*`;
    } catch { return '\u274c Currency rates abhi available nahi.'; }
  } });

  def({ name: ['usd2pkr', 'dollartorupee'], category: 'converter', desc: '.usd2pkr <amount>', run: async (ctx) => {
    const amt = parseFloat(ctx.args[0]) || 1;
    try { const d = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD'); return `\ud83d\udcb5 ${amt} USD = *${(amt * d.rates.PKR).toFixed(2)} PKR*`; } catch { return '\u274c Rate abhi available nahi.'; }
  } });
  def({ name: ['pkr2usd', 'rupeetodollar'], category: 'converter', desc: '.pkr2usd <amount>', run: async (ctx) => {
    const amt = parseFloat(ctx.args[0]) || 1;
    try { const d = await fetchJson('https://api.exchangerate-api.com/v4/latest/USD'); return `\ud83d\udcb0 ${amt} PKR = *${(amt / d.rates.PKR).toFixed(2)} USD*`; } catch { return '\u274c Rate abhi available nahi.'; }
  } });

  bulk(defMany, 'converter', [
    { names: ['convert', 'unitconvert'], desc: 'Convert', replies: ['\ud83d\udd04 Misal: `.km2m 5`, `.kg2lb 10`, `.c2f 30`'] },
    { names: ['units', 'unitlist'], desc: 'Unit list', replies: ['\ud83d\udccf Length, weight, volume, time, data, temperature, currency \u2014 sab supported.'] },
    { names: ['length', 'lengthunits'], desc: 'Length units', replies: ['\ud83d\udccf km, m, cm, mm, mi, ft, in, yd'] },
    { names: ['weight', 'weightunits'], desc: 'Weight units', replies: ['\u2696\ufe0f kg, g, mg, lb, oz, ton'] },
    { names: ['volume', 'volumeunits'], desc: 'Volume units', replies: ['\ud83e\udd64 l, ml, gal, cup'] },
    { names: ['timeunits', 'timeconv'], desc: 'Time units', replies: ['\u23f1\ufe0f sec, min, hr, day, week, month, year'] },
    { names: ['dataunits', 'dataconv'], desc: 'Data units', replies: ['\ud83d\udcbe bytes, KB, MB, GB, TB'] },
    { names: ['temp', 'temperature'], desc: 'Temperature', replies: ['\ud83c\udf21\ufe0f `.c2f`, `.f2c`, `.c2k`, `.k2c`'] },
    { names: ['speed', 'speedconv'], desc: 'Speed', replies: ['\ud83c\udfc1 `.kmh2mph`, `.mph2kmh`, `.knot2kmh`'] },
    { names: ['area', 'areaconv'], desc: 'Area', replies: ['\ud83d\udcd0 `.acre2sqm`, `.sqft2sqm`'] },
    { names: ['energy', 'energyconv'], desc: 'Energy', replies: ['\u26a1 `.hp2kw`, `.kw2hp`'] },
    { names: ['converters', 'allconverters'], desc: 'All converters', replies: ['\ud83d\udd04 70+ converters available. `.menu converter` dekhein.'] },
  ]);
};
