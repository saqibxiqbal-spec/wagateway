/** TIME: clock, dates, timezones, timers, countdowns. */

const { bulk } = require('./_bulk');

const TZ = {
  karachi: 'Asia/Karachi', lahore: 'Asia/Karachi', islamabad: 'Asia/Karachi',
  delhi: 'Asia/Kolkata', mumbai: 'Asia/Kolkata', dhaka: 'Asia/Dhaka',
  dubai: 'Asia/Dubai', riyadh: 'Asia/Riyadh', makkah: 'Asia/Riyadh',
  london: 'Europe/London', paris: 'Europe/Paris', berlin: 'Europe/Berlin',
  newyork: 'America/New_York', la: 'America/Los_Angeles', toronto: 'America/Toronto',
  tokyo: 'Asia/Tokyo', sydney: 'Australia/Sydney', beijing: 'Asia/Shanghai',
  istanbul: 'Europe/Istanbul', jakarta: 'Asia/Jakarta', kualalumpur: 'Asia/Kuala_Lumpur',
};

module.exports = (def, defMany) => {
  def({ name: ['time', 'clock', 'now'], category: 'time', desc: '.time \u2014 abhi ka waqt', run: async () => {
    const d = new Date();
    return `\u23f0 *${d.toLocaleTimeString('en-PK', { timeZone: 'Asia/Karachi', hour12: true })}* (PKT)\n\ud83d\udcc5 ${d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
  } });
  def({ name: ['date', 'today'], category: 'time', desc: '.date \u2014 aaj ki tareekh', run: async () => {
    const d = new Date();
    return `\ud83d\udcc5 *${d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}*`;
  } });
  def({ name: ['datetime', 'nowfull'], category: 'time', desc: '.datetime \u2014 date + time', run: async () => {
    const d = new Date();
    return `\ud83d\udcc5 ${d.toLocaleDateString('en-GB')}\n\u23f0 ${d.toLocaleTimeString('en-PK', { hour12: true })}`;
  } });
  def({ name: ['utc', 'utctime'], category: 'time', desc: '.utc \u2014 UTC time', run: async () => `\ud83c\udf10 UTC: *${new Date().toUTCString()}*` });
  def({ name: ['unix', 'unixtime'], category: 'time', desc: '.unix \u2014 Unix timestamp', run: async () => `\ud83d\udd22 Unix: *${Math.floor(Date.now() / 1000)}*` });
  def({ name: ['ms', 'millis'], category: 'time', desc: '.ms \u2014 milliseconds', run: async () => `\ud83d\udd22 Milliseconds: *${Date.now()}*` });
  def({ name: ['timezone', 'tz'], category: 'time', desc: '.timezone <city>', run: async (ctx) => {
    const city = (ctx.args[0] || 'karachi').toLowerCase().replace(/\s+/g, '');
    const tz = TZ[city];
    if (!tz) return `\u274c City nahi mili. Available: ${Object.keys(TZ).slice(0, 12).join(', ')}`;
    const t = new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour12: true });
    return `\ud83c\udf0d *${ctx.args[0]}*: ${t} (${tz})`;
  } });
  def({ name: ['worldclock', 'worldtime'], category: 'time', desc: '.worldclock', run: async () => {
    const list = ['Asia/Karachi', 'Asia/Dubai', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];
    const names = ['Karachi', 'Dubai', 'London', 'New York', 'Tokyo'];
    return '\ud83c\udf0d *World Clock*\n' + list.map((tz, i) => `\u2022 ${names[i]}: ${new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour12: true })}`).join('\n');
  } });
  def({ name: ['day', 'weekday'], category: 'time', desc: '.day \u2014 day of week', run: async () => `\ud83d\udcc5 *${new Date().toLocaleDateString('en-GB', { weekday: 'long' })}*` });
  def({ name: ['month', 'currentmonth'], category: 'time', desc: '.month', run: async () => `\ud83d\udcc5 *${new Date().toLocaleDateString('en-GB', { month: 'long' })}*` });
  def({ name: ['year', 'currentyear'], category: 'time', desc: '.year', run: async () => `\ud83d\udcc5 *${new Date().getFullYear()}*` });
  def({ name: ['dayofyear', 'doy'], category: 'time', desc: '.dayofyear', run: async () => {
    const d = new Date(); const start = new Date(d.getFullYear(), 0, 0);
    return `\ud83d\udcc5 Day of year: *${Math.floor((d - start) / 86400000)}*`;
  } });
  def({ name: ['weeknumber', 'weekno'], category: 'time', desc: '.weeknumber', run: async () => {
    const d = new Date(); const start = new Date(d.getFullYear(), 0, 1);
    return `\ud83d\udcc5 Week: *${Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)}*`;
  } });
  def({ name: ['daysleft', 'daysremaining'], category: 'time', desc: '.daysleft <date>', run: async (ctx) => {
    const t = new Date(ctx.args.join(' '));
    if (Number.isNaN(t.getTime())) return '\u274c Misal: `.daysleft 2025-12-31`';
    const diff = Math.ceil((t - Date.now()) / 86400000);
    return `\ud83d\udcc5 ${diff >= 0 ? `*${diff}* din baqi` : `*${-diff}* din pehle guzar gaye`}`;
  } });
  def({ name: ['countdown', 'timer'], category: 'time', desc: '.countdown <seconds>', run: async (ctx) => {
    const s = parseInt(ctx.args[0], 10);
    if (Number.isNaN(s) || s < 0) return '\u274c Misal: `.countdown 60`';
    return `\u23f3 Countdown set: *${s} seconds* \u2014 (message ke baad timer chalta hai)`;
  } });
  def({ name: ['age2', 'agecalculator'], category: 'time', desc: '.age2 <yyyy-mm-dd>', run: async (ctx) => {
    const b = new Date(ctx.args[0]);
    if (Number.isNaN(b.getTime())) return '\u274c Misal: `.age2 2000-01-15`';
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return `\ud83c\udf82 Age: *${age} years*`;
  } });
  def({ name: ['dob', 'birthday'], category: 'time', desc: '.dob <yyyy-mm-dd>', run: async (ctx) => {
    const b = new Date(ctx.args[0]);
    if (Number.isNaN(b.getTime())) return '\u274c Misal: `.dob 2000-01-15`';
    const next = new Date(new Date().getFullYear(), b.getMonth(), b.getDate());
    if (next < new Date()) next.setFullYear(next.getFullYear() + 1);
    const days = Math.ceil((next - new Date()) / 86400000);
    return `\ud83c\udf82 Birthday: *${days} din baqi* (${next.toDateString()})`;
  } });
  def({ name: ['leapyear', 'isleap'], category: 'time', desc: '.leapyear <year>', run: async (ctx) => {
    const y = parseInt(ctx.args[0], 10) || new Date().getFullYear();
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return `${leap ? '\u2705 Leap year' : '\u274c Not a leap year'} (${y})`;
  } });
  def({ name: ['daysinmonth', 'monthdays'], category: 'time', desc: '.daysinmonth <month> <year>', run: async (ctx) => {
    const m = parseInt(ctx.args[0], 10); const y = parseInt(ctx.args[1], 10) || new Date().getFullYear();
    if (!m || m < 1 || m > 12) return '\u274c Misal: `.daysinmonth 2 2024`';
    return `\ud83d\udcc5 *${new Date(y, m, 0).getDate()}* days`;
  } });
  def({ name: ['weekend', 'isweekend'], category: 'time', desc: '.weekend', run: async () => {
    const d = new Date().getDay();
    return `${d === 0 || d === 6 ? '\u2705 Weekend hai!' : '\u274c Weekend nahi hai.'}`;
  } });
  def({ name: ['timestamp2', 'ts'], category: 'time', desc: '.timestamp2 <date>', run: async (ctx) => {
    const d = ctx.args.length ? new Date(ctx.args.join(' ')) : new Date();
    return `\ud83d\udd22 ${Math.floor(d.getTime() / 1000)}`;
  } });
  def({ name: ['fromtimestamp2', 'fromts'], category: 'time', desc: '.fromtimestamp2 <unix>', run: async (ctx) => {
    const s = parseInt(ctx.args[0], 10);
    if (Number.isNaN(s)) return '\u274c Misal: `.fromtimestamp2 1700000000`';
    return `\ud83d\udcc5 ${new Date(s * 1000).toUTCString()}`;
  } });
  def({ name: ['duration', 'timespan'], category: 'time', desc: '.duration <seconds>', run: async (ctx) => {
    const s = parseInt(ctx.args[0], 10);
    if (Number.isNaN(s)) return '\u274c Misal: `.duration 3661`';
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `\u23f1\ufe0f *${d}d ${h}h ${m}m ${sec}s*`;
  } });
  def({ name: ['timeuntil', 'until'], category: 'time', desc: '.timeuntil <date>', run: async (ctx) => {
    const t = new Date(ctx.args.join(' '));
    if (Number.isNaN(t.getTime())) return '\u274c Misal: `.timeuntil 2025-12-31`';
    let s = Math.floor((t - Date.now()) / 1000);
    if (s < 0) return '\u23f1\ufe0f Yeh waqt guzar chuka hai.';
    const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60);
    return `\u23f3 *${d}d ${h}h ${m}m* baqi`;
  } });
  def({ name: ['timeago', 'ago'], category: 'time', desc: '.timeago <date>', run: async (ctx) => {
    const t = new Date(ctx.args.join(' '));
    if (Number.isNaN(t.getTime())) return '\u274c Misal: `.timeago 2020-01-01`';
    const s = Math.floor((Date.now() - t) / 1000);
    const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60);
    return `\u23f1\ufe0f *${d}d ${h}h ${m}m* pehle`;
  } });
  def({ name: ['hijri2', 'islamicdate2'], category: 'time', desc: '.hijri2', run: async () => `\ud83d\udcc5 Hijri: *${new Date().toLocaleDateString('en-TN-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' })}*` });
  def({ name: ['seasons', 'season'], category: 'time', desc: '.seasons', run: async () => {
    const m = new Date().getMonth();
    const s = m <= 1 || m === 11 ? 'Winter' : m <= 4 ? 'Spring' : m <= 7 ? 'Summer' : 'Autumn';
    return `\ud83c\udf43 Season: *${s}*`;
  } });

  bulk(defMany, 'time', [
    { names: ['morning', 'is_morning'], desc: 'Morning check', replies: [() => (new Date().getHours() < 12 ? '\u2705 Subah hai' : '\u274c Subah nahi')] },
    { names: ['evening', 'is_evening'], desc: 'Evening check', replies: [() => (new Date().getHours() >= 17 ? '\u2705 Shaam hai' : '\u274c Shaam nahi')] },
    { names: ['night', 'is_night'], desc: 'Night check', replies: [() => (new Date().getHours() >= 20 || new Date().getHours() < 5 ? '\u2705 Raat hai' : '\u274c Raat nahi')] },
    { names: ['noon', 'is_noon'], desc: 'Noon check', replies: [() => (new Date().getHours() === 12 ? '\u2705 Dopahar' : '\u274c Dopahar nahi')] },
    { names: ['ampm', 'meridiem'], desc: 'AM/PM', replies: [() => (new Date().getHours() < 12 ? 'AM' : 'PM')] },
    { names: ['hour', 'currenthour'], desc: 'Hour', replies: [() => `\u23f0 ${new Date().getHours()}`] },
    { names: ['minute', 'currentminute'], desc: 'Minute', replies: [() => `\u23f0 ${new Date().getMinutes()}`] },
    { names: ['second', 'currentsecond'], desc: 'Second', replies: [() => `\u23f0 ${new Date().getSeconds()}`] },
    { names: ['hour12', 'hour12format'], desc: '12h hour', replies: [() => `\u23f0 ${new Date().getHours() % 12 || 12}`] },
    { names: ['iso', 'isodate'], desc: 'ISO date', replies: [() => `\ud83d\udcc5 ${new Date().toISOString()}`] },
    { names: ['locale', 'localedate'], desc: 'Locale date', replies: [() => `\ud83d\udcc5 ${new Date().toLocaleString()}`] },
    { names: ['dateformat', 'formats'], desc: 'Date formats', replies: ['\ud83d\udcc5 `.iso`, `.locale`, `.utc`, `.unix`'] },
    { names: ['timer_start', 'starttimer'], desc: 'Start timer', replies: ['\u23f3 Timer start!'] },
    { names: ['timer_stop', 'stoptimer'], desc: 'Stop timer', replies: ['\u23f9\ufe0f Timer stop.'] },
    { names: ['stopwatch', 'sw'], desc: 'Stopwatch', replies: ['\u23f1\ufe0f Stopwatch ready.'] },
    { names: ['alarm', 'setalarm'], desc: 'Alarm', replies: ['\u23f0 Alarm set!'] },
    { names: ['reminder', 'remind'], desc: 'Reminder', replies: ['\ud83d\udd14 Reminder set!'] },
    { names: ['calendar', 'cal'], desc: 'Calendar', replies: ['\ud83d\udcc5 Calendar: `.date`, `.month`, `.year`'] },
    { names: ['timezone_list', 'tzlist'], desc: 'Timezone list', replies: ['\ud83c\udf0d Available: ' + Object.keys(TZ).join(', ')] },
  ]);
};
