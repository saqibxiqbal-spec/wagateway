/** RANDOM: random generators, choices, picks. */

const crypto = require('crypto');
const { pick, randInt } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({ name: ['random', 'rand'], category: 'random', desc: '.random <min> <max>', run: async (ctx) => { const a = parseInt(ctx.args[0], 10) || 1; const b = parseInt(ctx.args[1], 10) || 100; return `\ud83c\udfb2 Random: *${randInt(Math.min(a, b), Math.max(a, b))}*`; } });
  def({ name: ['randomnumber', 'randnum'], category: 'random', desc: '.randomnumber <max>', run: async (ctx) => `\ud83d\udd22 *${randInt(1, parseInt(ctx.args[0], 10) || 100)}*` });
  def({ name: ['randomletter', 'randletter'], category: 'random', desc: '.randomletter', run: async () => `\ud83d\udd24 *${pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))}*` });
  def({ name: ['randomword', 'randword'], category: 'random', desc: '.randomword', run: async () => `\ud83d\udcdd *${pick(['apple', 'brave', 'cloud', 'dream', 'eagle', 'flame', 'grace', 'heart', 'ideal', 'joy', 'kind', 'light', 'magic', 'noble', 'ocean', 'peace', 'quiet', 'river', 'smile', 'trust'])}*` });
  def({ name: ['randomcolor', 'randcolor'], category: 'random', desc: '.randomcolor', run: async () => { const c = '#' + crypto.randomBytes(3).toString('hex'); return `\ud83c\udfa8 *${c}*`; } });
  def({ name: ['randomemoji2', 'randemoj'], category: 'random', desc: '.randomemoji2', run: async () => `\ud83d\ude00 *${pick(['\ud83d\ude00', '\ud83d\ude04', '\ud83d\ude02', '\ud83d\ude0d', '\ud83d\udd25', '\u2b50', '\ud83c\udf08', '\ud83d\udc51'])}*` });
  def({ name: ['randomdate', 'randdate'], category: 'random', desc: '.randomdate', run: async () => `\ud83d\udcc5 *${new Date(Date.now() - randInt(0, 31536000000)).toISOString().slice(0, 10)}*` });
  def({ name: ['randomtime', 'randtime'], category: 'random', desc: '.randomtime', run: async () => `\u23f0 *${String(randInt(0, 23)).padStart(2, '0')}:${String(randInt(0, 59)).padStart(2, '0')}*` });
  def({ name: ['randomname', 'randname'], category: 'random', desc: '.randomname', run: async () => `\ud83d\udc64 *${pick(['Ali', 'Ahmed', 'Sara', 'Zara', 'Hamza', 'Ayesha', 'Bilal', 'Fatima', 'Usman', 'Maryam'])}*` });
  def({ name: ['randomcountry', 'randcountry'], category: 'random', desc: '.randomcountry', run: async () => `\ud83c\udf0d *${pick(['Pakistan', 'India', 'Turkey', 'Saudi Arabia', 'UAE', 'USA', 'UK', 'Canada', 'Malaysia', 'Indonesia'])}*` });
  def({ name: ['randomcity', 'randcity'], category: 'random', desc: '.randomcity', run: async () => `\ud83c\udfd9\ufe0f *${pick(['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Rawalpindi'])}*` });
  def({ name: ['randomfood', 'randfood'], category: 'random', desc: '.randomfood', run: async () => `\ud83c\udf5d *${pick(['Biryani', 'Karahi', 'Nihari', 'Haleem', 'Pulao', 'Kebab', 'Pizza', 'Burger', 'Pasta'])}*` });
  def({ name: ['randomdrink', 'randdrink'], category: 'random', desc: '.randomdrink', run: async () => `\ud83e\udd64 *${pick(['Chai', 'Coffee', 'Lassi', 'Juice', 'Water', 'Soda', 'Shake'])}*` });
  def({ name: ['randommovie', 'randmovie'], category: 'random', desc: '.randommovie', run: async () => `\ud83c\udfac *${pick(['Inception', 'Interstellar', 'The Dark Knight', '3 Idiots', 'PK', 'Dangal', 'Titanic', 'Avatar'])}*` });
  def({ name: ['randomsong', 'randsong'], category: 'random', desc: '.randomsong', run: async () => `\ud83c\udfb5 *${pick(['Tum Hi Ho', 'Kesariya', 'Tera Ban Jaunga', 'Raabta', 'Channa Mereya'])}*` });
  def({ name: ['randomquote', 'randquote'], category: 'random', desc: '.randomquote', run: async () => `\ud83d\udcdd *${pick(['Stay hungry, stay foolish.', 'Dream big.', 'Never give up.', 'Be the change.', 'Keep smiling.'])}*` });
  def({ name: ['randomfact2', 'randfact'], category: 'random', desc: '.randomfact2', run: async () => `\ud83e\udd14 *${pick(['Honey never spoils.', 'Octopus has 3 hearts.', 'Bananas are berries.', 'Lightning is hot.', 'Sharks are older than trees.'])}*` });
  def({ name: ['randomjoke', 'randjoke'], category: 'random', desc: '.randomjoke', run: async () => `\ud83d\ude02 *${pick(['Why did the chicken cross the road? To get to the other side!', 'What do you call a fake noodle? An impasta!', 'Why did the scarecrow win an award? He was outstanding in his field!'])}*` });
  def({ name: ['randomriddle', 'randriddle'], category: 'random', desc: '.randomriddle', run: async () => `\ud83e\udd14 *${pick(['What has keys but no locks? A piano.', 'What has a face and two hands? A clock.', 'What gets wetter the more it dries? A towel.'])}*` });
  def({ name: ['randomadvice', 'randadvice'], category: 'random', desc: '.randomadvice', run: async () => `\ud83d\udca1 *${pick(['Drink more water.', 'Sleep 8 hours.', 'Read daily.', 'Exercise.', 'Be kind.'])}*` });
  def({ name: ['randomtask', 'randtask'], category: 'random', desc: '.randomtask', run: async () => `\ud83d\udccb *${pick(['Clean your room.', 'Call a friend.', 'Read 10 pages.', 'Take a walk.', 'Drink water.'])}*` });
  def({ name: ['randomhobby', 'randhobby'], category: 'random', desc: '.randomhobby', run: async () => `\ud83c\udfa8 *${pick(['Reading', 'Painting', 'Cooking', 'Gardening', 'Photography', 'Gaming', 'Writing'])}*` });
  def({ name: ['randomanimal', 'randanimal'], category: 'random', desc: '.randomanimal', run: async () => `\ud83d\udc3e *${pick(['Dog', 'Cat', 'Lion', 'Tiger', 'Elephant', 'Horse', 'Rabbit', 'Panda'])}*` });
  def({ name: ['randomflower', 'randflower'], category: 'random', desc: '.randomflower', run: async () => `\ud83c\udf3c *${pick(['Rose', 'Tulip', 'Sunflower', 'Lily', 'Daisy', 'Orchid', 'Jasmine'])}*` });
  def({ name: ['randommonth', 'randmonth'], category: 'random', desc: '.randommonth', run: async () => `\ud83d\udcc5 *${pick(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])}*` });
  def({ name: ['randomday', 'randday'], category: 'random', desc: '.randomday', run: async () => `\ud83d\udcc5 *${pick(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])}*` });
  def({ name: ['randomnum2', 'randnum2'], category: 'random', desc: '.randomnum2', run: async () => `\ud83d\udd22 *${randInt(1000, 9999)}*` });
  def({ name: ['randomid', 'randid'], category: 'random', desc: '.randomid', run: async () => `\ud83c\udd94 *${crypto.randomBytes(6).toString('hex').toUpperCase()}*` });
  def({ name: ['choice', 'choose'], category: 'random', desc: '.choice a | b | c', run: async (ctx) => { const opts = ctx.args.join(' ').split('|').map((s) => s.trim()).filter(Boolean); if (!opts.length) return '\u274c Misal: `.choice chai | coffee`'; return `\ud83c\udfaf Main chunta hoon: *${pick(opts)}*`; } });
  def({ name: ['shuffle', 'randomize'], category: 'random', desc: '.shuffle a | b | c', run: async (ctx) => { const opts = ctx.args.join(' ').split('|').map((s) => s.trim()).filter(Boolean); if (!opts.length) return '\u274c Misal: `.shuffle a | b | c`'; return opts.sort(() => Math.random() - 0.5).join(' \u2192 '); } });

  bulk(defMany, 'random', [
    { names: ['r1', 'rand1'], desc: 'Random 1', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r2', 'rand2'], desc: 'Random 2', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r3', 'rand3'], desc: 'Random 3', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r4', 'rand4'], desc: 'Random 4', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r5', 'rand5'], desc: 'Random 5', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r6', 'rand6'], desc: 'Random 6', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r7', 'rand7'], desc: 'Random 7', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r8', 'rand8'], desc: 'Random 8', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r9', 'rand9'], desc: 'Random 9', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['r10', 'rand10'], desc: 'Random 10', replies: [() => `\ud83c\udfb2 ${randInt(1, 100)}`] },
    { names: ['randombool', 'yesno'], desc: 'Random bool', replies: [() => (Math.random() < 0.5 ? '\u2705 Yes' : '\u274c No')] },
    { names: ['randompick', 'pickone'], desc: 'Random pick', replies: [() => `\ud83c\udfaf ${pick(['Option A', 'Option B', 'Option C', 'Option D'])}`] },
    { names: ['randomteam', 'team'], desc: 'Random team', replies: [() => `\ud83d\udc65 Team: ${pick(['Red', 'Blue', 'Green', 'Yellow'])}`] },
    { names: ['randomprize', 'prize'], desc: 'Random prize', replies: [() => `\ud83c\udf81 ${pick(['Chocolate', 'Coffee', 'Gift card', 'Nothing', 'Surprise!'])}`] },
    { names: ['randomjob', 'randjob'], desc: 'Random job', replies: [() => `\ud83d\udcbc ${pick(['Doctor', 'Engineer', 'Teacher', 'Pilot', 'Chef', 'Artist'])}`] },
    { names: ['randomsport', 'randsport'], desc: 'Random sport', replies: [() => `\u26bd ${pick(['Cricket', 'Football', 'Tennis', 'Hockey', 'Badminton'])}`] },
    { names: ['randomcar', 'randcar'], desc: 'Random car', replies: [() => `\ud83d\ude97 ${pick(['Toyota', 'Honda', 'Suzuki', 'BMW', 'Mercedes', 'Tesla'])}`] },
    { names: ['randomphone', 'randphone'], desc: 'Random phone', replies: [() => `\ud83d\udcf1 ${pick(['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Vivo', 'Oppo'])}`] },
    { names: ['randomapp', 'randapp'], desc: 'Random app', replies: [() => `\ud83d\udcf2 ${pick(['WhatsApp', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter'])}`] },
    { names: ['randomgame', 'randgame'], desc: 'Random game', replies: [() => `\ud83c\udfae ${pick(['PUBG', 'Free Fire', 'Minecraft', 'GTA', 'FIFA', 'Call of Duty'])}`] },
  ]);
};
