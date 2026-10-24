/** FUN: jokes, quotes, roasts, riddles, truth/dare, 8ball, rates. */

const { pick, randInt } = require('./_util');
const { bulk } = require('./_bulk');

const JOKES = [
  'Teacher: "Tumhein sabse zyada kya pasand hai?" Student: "Homework!" Teacher: "Sach?" Student: "Nahi, sirf aapko khush karne ke liye."',
  'Doctor: "Aapko roz subah 5 km chalna chahiye." Patient: "Main to 10 km chalta hoon." Doctor: "Phir to aap bilkul theek hain!"',
  'Wife: "Aap mujhe kitna pyaar karte ho?" Husband: "Tumhare jitna." Wife: "Matlab?" Husband: "Matlab bahut zyada!"',
  'Ek aadmi ne bank se poocha: "Mera account khaali kyun hai?" Bank: "Kyunki aapne paisa kharch kar diya."',
  'Programmer ki shaadi kyun nahi hoti? Kyunki uski life mein sirf "bugs" hote hain, "hugs" nahi.',
  'Ek pathan ne mobile kharida. Dukandaar: "Sir, ismein 4G hai." Pathan: "Phir 4G ka kya karun? Main to 2G pe hi khush hoon."',
  'Teacher: "Beta, 2 aur 2 kitne hote hain?" Student: "4." Teacher: "Shabash!" Student: "Aur 2 aur 2 bhi 4 hote hain."',
  'Ek banda doctor ke paas gaya: "Doctor sahab, mujhe bhoolne ki bimari hai." Doctor: "Kab se?" Banda: "Kya kab se?"',
  'Mummy: "Beta, padhai karo warna zindagi bhar pachhtaoge." Beta: "Mummy, main to abhi se pachhta raha hoon."',
  'Ek sardar ne poocha: "Train late kyun hai?" Station master: "Kyunki aage train hai." Sardar: "To aage wali train late kyun hai?"',
  'Interview: "Aapki sabse badi kamzori kya hai?" Candidate: "Main sach bolta hoon." Interviewer: "Mujhe nahi lagta." Candidate: "Mujhe bhi nahi."',
  'Ek aadmi ne apni biwi se kaha: "Tum bahut khoobsurat ho." Biwi: "Aur tum?" Aadmi: "Main tumhara shauhar hoon, khoobsurat to nahi."',
];

const QUOTES = [
  'Kamyabi ka raasta mehnat se guzarta hai, aaram se nahi. \u2014 Unknown',
  'Jo aaj karta hai, wahi kal ka malik hota hai. \u2014 Unknown',
  'Girna zaroori hai, uthna zaroori hai, par rukna nahi. \u2014 Unknown',
  'Zindagi ek kitab hai, har din ek naya safha. \u2014 Unknown',
  'Khudi ko kar buland itna ke har taqdeer se pehle, Khuda bande se khud poochhe, bata teri raza kya hai. \u2014 Allama Iqbal',
  'Sitaron se aage jahan aur bhi hain. \u2014 Allama Iqbal',
  'Ilm ek aisa khazana hai jo kabhi khatam nahi hota. \u2014 Unknown',
  'Waqt se pehle aur naseeb se zyada kuch nahi milta. \u2014 Unknown',
  'Himmat-e-mardaan madad-e-khuda. \u2014 Unknown',
  'Jo dil se chaho, poori koshish karo, manzil zaroor milegi. \u2014 Unknown',
];

const ROASTS = [
  'Tumhari shakal dekh kar mirror bhi rota hai. \ud83d\ude02',
  'Tum itne slow ho ke kachwa bhi tumse race jeet jaye. \ud83d\udc22',
  'Tumhari IQ level room temperature se bhi neeche hai. \ud83e\udd14',
  'Tumse zyada smart to mera calculator hai. \ud83e\uddee',
  'Tumhari smile dekh kar WiFi signal bhi weak ho jata hai. \ud83d\udcf6',
  'Tum itne boring ho ke tumhari shadow bhi bore ho jati hai. \ud83d\ude34',
  'Tumhari personality se zyada interesting to traffic jam hai. \ud83d\ude97',
  'Tum wo insaan ho jo Google par bhi "kaise jeena hai" search karta hai. \ud83d\udd0d',
];

const RIDDLES = [
  ['Jis ke paas hai, wo bech deta hai. Jis ke paas nahi, wo kharidta hai. Batao kya?', 'Tasveer (photo)'],
  ['Subah 4 pair, dopahar 2 pair, shaam 3 pair. Kaun?', 'Insaan (bachpan, jawani, budhapa)'],
  ['Jitna zyada lo, utna zyada bacha. Kya?', 'Qadam (steps)'],
  ['Ek cheez hai jo jitni baar kaato, utni badi ho jati hai. Kya?', 'Gaddha (hole)'],
  ['Aisa kya hai jo bina munh ke bolta hai?', 'Echo (goonj)'],
  ['Jis ka ghar hai, wo bahar hai. Jis ka ghar nahi, wo andar hai. Kya?', 'Machhli aur paani'],
  ['Do bhai hamesha saath, par kabhi milte nahi. Kaun?', 'Aankhein (eyes)'],
];

const TRUTHS = [
  'Tumhari sabse badi secret kya hai?',
  'Tumne aakhri baar kab jhoot bola tha?',
  'Tumhein sabse zyada kis se jealousy hoti hai?',
  'Tumhara crush kaun hai?',
  'Tumne kabhi kisi ka dil dukhaya hai?',
  'Tumhari sabse embarrassing moment kya hai?',
  'Tumne kabhi exam mein cheating ki hai?',
];

const DARES = [
  'Apne dost ko "I love you" message bhejo.',
  'Apni last photo bina filter ke share karo.',
  '1 minute tak mirror mein khud ko dekh kar muskurao.',
  'Apne crush ka naam bolo.',
  'Ek funny voice note bhejo.',
  'Apne sabse purane contact ko "Hi" bhejo.',
  'Apni favourite cheez kisi ko gift karo.',
];

const WOULD = [
  ['Ameer hona ya mashhoor hona?', 'Ameer'],
  ['Umar bhar akela rehna ya bina paise ke rehna?', 'Akela'],
  ['Past badalna ya future dekhna?', 'Future'],
  ['Hamesha sach bolna ya kabhi kuch na bolna?', 'Sach'],
  ['Pizza ya burger?', 'Pizza'],
  ['Beach ya mountain?', 'Beach'],
  ['Night owl ya early bird?', 'Night owl'],
];

module.exports = (def, defMany) => {
  def({ name: ['joke', 'jokes', 'funny', 'hasao'], category: 'fun', desc: '.joke \u2014 mazedaar joke', run: async () => `\ud83d\ude02 ${pick(JOKES)}` });
  def({ name: ['quote', 'quotes', 'saying'], category: 'fun', desc: '.quote \u2014 motivational quote', run: async () => `\ud83d\udcdd ${pick(QUOTES)}` });
  def({ name: ['roast', 'burn', 'jhagda'], category: 'fun', desc: '.roast \u2014 roast', run: async (ctx) => `\ud83d\udd25 *${ctx.pushName || 'Bhai'}*, ${pick(ROASTS)}` });
  def({ name: ['compliment', 'tareef', 'praise'], category: 'fun', desc: '.compliment \u2014 tareef', run: async (ctx) => `\u2728 *${ctx.pushName || 'Bhai'}*, tum bahut achhe ho! Tumhari smile sabko khush kar deti hai. \ud83d\ude0a` });
  def({ name: ['riddle', 'paheli', 'puzzle'], category: 'fun', desc: '.riddle \u2014 paheli', run: async () => { const r = pick(RIDDLES); return `\ud83e\udd14 *Paheli:* ${r[0]}\n\n_Jawab: ${r[1]}_`; } });
  def({ name: ['truth', 'sach'], category: 'fun', desc: '.truth \u2014 truth question', run: async () => `\ud83d\udcac *Truth:* ${pick(TRUTHS)}` });
  def({ name: ['dare', 'himmat'], category: 'fun', desc: '.dare \u2014 dare challenge', run: async () => `\ud83c\udfaf *Dare:* ${pick(DARES)}` });
  def({ name: ['wouldyourather', 'wyr'], category: 'fun', desc: '.wouldyourather', run: async () => { const w = pick(WOULD); return `\ud83e\udd14 *Would you rather:*\n${w[0]}\n\n_Meri choice: ${w[1]}_`; } });
  def({ name: ['8ball', 'eightball', 'magic8'], category: 'fun', desc: '.8ball <question>', run: async (ctx) => { const a = ['Bilkul haan! \u2705', 'Nahi, bilkul nahi. \u274c', 'Ho sakta hai. \ud83e\udd14', 'Pakka nahi. \ud83d\ude10', 'Zaroor! \ud83d\ude0a', 'Abhi nahi. \u23f3', 'Kismat par chhod do. \ud83c\udfb2']; return `\ud83c\udfb1 *Q:* ${ctx.args.join(' ') || '...'}\n*A:* ${pick(a)}`; } });
  def({ name: ['coinflip', 'coin', 'flip_coin'], category: 'fun', desc: '.coinflip \u2014 coin toss', run: async () => `\ud83e\ude99 *${pick(['Heads', 'Tails'])}*` });
  def({ name: ['dice', 'roll', 'ludo'], category: 'fun', desc: '.dice \u2014 dice roll', run: async () => `\ud83c\udfb2 Dice: *${randInt(1, 6)}*` });
  def({ name: ['dice2', 'roll2'], category: 'fun', desc: '.dice2 \u2014 do dice', run: async () => `\ud83c\udfb2 Dice: *${randInt(1, 6)}* + *${randInt(1, 6)}* = *${randInt(2, 12)}*` });
  def({ name: ['rps', 'rockpaperscissors'], category: 'fun', desc: '.rps <rock|paper|scissors>', run: async (ctx) => { const opts = ['rock', 'paper', 'scissors']; const u = (ctx.args[0] || '').toLowerCase(); if (!opts.includes(u)) return '\u274c Misal: `.rps rock`'; const b = pick(opts); const win = (u === 'rock' && b === 'scissors') || (u === 'paper' && b === 'rock') || (u === 'scissors' && b === 'paper'); return `\ud83c\udfb1 Tum: *${u}*\n\ud83e\udd16 Bot: *${b}*\n${u === b ? '\ud83e\udd1d Draw!' : win ? '\ud83c\udf89 Tum jeete!' : '\ud83d\ude22 Bot jeeta!'}`; } });
  def({ name: ['rate', 'rating'], category: 'fun', desc: '.rate <thing>', run: async (ctx) => `\u2b50 *${ctx.args.join(' ') || 'yeh'}* ko rating: *${randInt(1, 10)}/10*` });
  def({ name: ['howgay', 'gayrate'], category: 'fun', desc: '.howgay', run: async (ctx) => `\ud83c\udf08 *${ctx.pushName || 'Tum'}*: *${randInt(0, 100)}%* gay` });
  def({ name: ['howcute', 'cuteness'], category: 'fun', desc: '.howcute', run: async (ctx) => `\ud83e\udd70 *${ctx.pushName || 'Tum'}*: *${randInt(0, 100)}%* cute` });
  def({ name: ['howsmart', 'smartness'], category: 'fun', desc: '.howsmart', run: async (ctx) => `\ud83e\udde0 *${ctx.pushName || 'Tum'}*: *${randInt(0, 100)}%* smart` });
  def({ name: ['howrich', 'richness'], category: 'fun', desc: '.howrich', run: async (ctx) => `\ud83d\udcb0 *${ctx.pushName || 'Tum'}*: *${randInt(0, 100)}%* rich` });
  def({ name: ['howold', 'age'], category: 'fun', desc: '.howold', run: async (ctx) => `\ud83c\udf82 *${ctx.pushName || 'Tum'}* ki age: *${randInt(16, 60)}* saal` });
  def({ name: ['lucky', 'luckynumber'], category: 'fun', desc: '.lucky \u2014 lucky number', run: async () => `\ud83c\udf40 Lucky number: *${randInt(1, 99)}*` });
  def({ name: ['luckycolor', 'luckcolor'], category: 'fun', desc: '.luckycolor', run: async () => `\ud83c\udfa8 Lucky color: *${pick(['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White'])}*` });
  def({ name: ['zodiac', 'rashi'], category: 'fun', desc: '.zodiac <date>', run: async (ctx) => `\u2648 Zodiac: *${pick(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'])}*` });
  def({ name: ['horoscope', 'bhavishyavani'], category: 'fun', desc: '.horoscope \u2014 aaj ka rashifal', run: async () => `\ud83d\udd2e *Aaj ka rashifal:* ${pick(['Din shubh hai.', 'Naya mauka milega.', 'Dost ki madad milegi.', 'Paisa aayega.', 'Safar shubh hai.', 'Dhyan rakhein.'])}` });
  def({ name: ['mood', 'moodcheck'], category: 'fun', desc: '.mood', run: async () => `\ud83d\ude0a Aaj ka mood: *${pick(['Happy', 'Sad', 'Excited', 'Bored', 'Angry', 'Chill', 'Sleepy'])}*` });
  def({ name: ['pickup', 'flirt', 'line'], category: 'fun', desc: '.pickup \u2014 pickup line', run: async () => `\ud83d\udc98 ${pick(['Tumhari smile ne mera din bana diya.', 'Tumse milne ke baad lagta hai duniya khoobsurat hai.', 'Kya tum Google ho? Kyunki tum mein sab kuch dhoondhna chahta hoon.'])}` });
  def({ name: ['shayari', 'poetry', 'sher'], category: 'fun', desc: '.shayari \u2014 shayari', run: async () => `\ud83d\udcdd ${pick(['Dil ki baat labon par laana aasan nahi, Har kisi ko apna banana aasan nahi.', 'Tumse milne ki khushi itni hai, Ke har gham bhool jata hoon.', 'Mohabbat mein haar jeet ka koi hisaab nahi, Dil jo chaahe wahi sahi.'])}` });
  def({ name: ['pun', 'puns'], category: 'fun', desc: '.pun \u2014 pun', run: async () => `\ud83d\ude04 ${pick(['Main maths teacher se darta hoon kyunki wo bahut "problematic" hai.', 'Mujhe pizza bahut pasand hai, wo "cheesy" hai.', 'Mera WiFi weak hai, isliye main "disconnected" feel karta hoon.'])}` });
  def({ name: ['fact', 'randomfact', 'didyouknow'], category: 'fun', desc: '.fact \u2014 random fact', run: async () => `\ud83e\udd14 ${pick(['Shahad kabhi kharab nahi hota.', 'Octopus ke 3 dil hote hain.', 'Lightning sun se 5 guna garam hoti hai.', 'Bananas berries hain.', 'Earth par 8.7 million species hain.'])}` });
  def({ name: ['advice', 'tip', 'salah'], category: 'fun', desc: '.advice \u2014 advice', run: async () => `\ud83d\udca1 ${pick(['Roz subah 10 minute walk karein.', 'Paani zyada piyein.', 'Har din kuch naya seekhein.', 'Apne kaam ko kal par na chhodein.', 'Muskurayein, yeh free hai.'])}` });

  bulk(defMany, 'fun', [
    { names: ['lol2', 'haha'], desc: 'Laugh', replies: ['\ud83d\ude02\ud83d\ude02\ud83d\ude02'] },
    { names: ['xd', 'xdxd'], desc: 'XD', replies: ['XD \ud83d\ude06'] },
    { names: ['bruh', 'bruh2'], desc: 'Bruh', replies: ['\ud83d\ude10 bruh'] },
    { names: ['nice', 'nice2'], desc: 'Nice', replies: ['\ud83d\udc4c Nice!'] },
    { names: ['wow', 'wow2'], desc: 'Wow', replies: ['\ud83d\ude2e Wow!'] },
    { names: ['cool2', 'coolstory'], desc: 'Cool', replies: ['\ud83d\ude0e Cool story bro.'] },
    { names: ['ok2', 'okay'], desc: 'Okay', replies: ['\ud83d\udc4d Okay.'] },
    { names: ['yes', 'haan'], desc: 'Yes', replies: ['\u2705 Haan.'] },
    { names: ['no', 'nahi'], desc: 'No', replies: ['\u274c Nahi.'] },
    { names: ['maybe', 'shayad'], desc: 'Maybe', replies: ['\ud83e\udd14 Shayad.'] },
    { names: ['idk', 'pata_nahi'], desc: 'IDK', replies: ['\ud83e\udd37 Mujhe nahi pata.'] },
    { names: ['brb', 'abhi_aata'], desc: 'BRB', replies: ['\ud83d\udc4b Abhi aata hoon.'] },
    { names: ['gtg', 'chalta_hoon'], desc: 'GTG', replies: ['\ud83d\udc4b Chalta hoon, phir milte hain.'] },
    { names: ['omg', 'ya_allah'], desc: 'OMG', replies: ['\ud83d\ude31 OMG!'] },
    { names: ['lmao', 'lmaoo'], desc: 'LMAO', replies: ['\ud83e\udd23 LMAO!'] },
    { names: ['sus', 'suspicious'], desc: 'Sus', replies: ['\ud83d\udc40 Sus...'] },
    { names: ['cap', 'nocap'], desc: 'Cap', replies: ['\ud83e\udde2 No cap!'] },
    { names: ['slay', 'slay2'], desc: 'Slay', replies: ['\ud83d\udc85 Slay!'] },
    { names: ['vibe', 'vibes'], desc: 'Vibes', replies: ['\u2728 Good vibes only.'] },
    { names: ['mood2', 'moodkind'], desc: 'Mood', replies: ['\ud83d\ude0e Mood.'] },
    { names: ['bet', 'bet2'], desc: 'Bet', replies: ['\ud83d\udc4c Bet.'] },
    { names: ['facts', 'facts2'], desc: 'Facts', replies: ['\ud83d\udcaf Facts!'] },
    { names: ['goat', 'goat2'], desc: 'GOAT', replies: ['\ud83d\udc10 GOAT!'] },
    { names: ['sheesh', 'sheesh2'], desc: 'Sheesh', replies: ['\ud83d\udd25 Sheesh!'] },
    { names: ['yikes', 'yikes2'], desc: 'Yikes', replies: ['\ud83d\ude2c Yikes.'] },
    { names: ['oof', 'oof2'], desc: 'Oof', replies: ['\ud83d\ude14 Oof.'] },
    { names: ['rip', 'rip2'], desc: 'RIP', replies: ['\ud83e\udea6 RIP.'] },
    { names: ['gg', 'gg2'], desc: 'GG', replies: ['\ud83c\udfae GG!'] },
    { names: ['ez', 'ez2'], desc: 'EZ', replies: ['\ud83d\ude0e EZ.'] },
    { names: ['pog', 'poggers'], desc: 'Pog', replies: ['\ud83d\ude2e Pog!'] },
  ]);
};
