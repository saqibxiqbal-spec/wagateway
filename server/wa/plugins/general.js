/** GENERAL: greetings, small talk, everyday helpers. */

const { BOT_NAME } = require('../registry');
const { pick, humanUptime, jidToNumber } = require('./_util');

module.exports = (def, defMany) => {
  defMany(['hi', 'hello', 'salam', 'salaam', 'hey', 'hy', 'assalam'], {
    category: 'general',
    desc: 'Greeting',
    run: async (ctx) =>
      `\ud83d\udc4b Salam *${ctx.pushName || 'friend'}*!\n\nMain *${BOT_NAME}* hoon. \`.menu\` likhein poori list ke liye.`,
  });

  defMany(['bye', 'goodbye', 'khudahafiz', 'see ya'], {
    category: 'general',
    desc: 'Alvida',
    run: async (ctx) => `\ud83d\udc4b Allah hafiz *${ctx.pushName || 'friend'}*! Phir milenge.`,
  });

  defMany(['thanks', 'thankyou', 'shukriya', 'thx', 'ty'], {
    category: 'general',
    desc: 'Shukriya',
    run: async () => `\ud83d\ude4f Koi baat nahi! Khushi hui madad karke.`,
  });

  defMany(['sorry', 'maaf'], {
    category: 'general',
    desc: 'Maafi',
    run: async () => `\ud83e\udd17 Koi masla nahi. Chalta hai!`,
  });

  defMany(['gm', 'goodmorning', 'subahbakhair'], {
    category: 'general',
    desc: 'Good morning',
    run: async (ctx) => `\ud83c\udf05 Good morning *${ctx.pushName || 'friend'}*! Din mubarak ho.`,
  });

  defMany(['gn', 'goodnight', 'shab_bakhair', 'shabbakhair'], {
    category: 'general',
    desc: 'Good night',
    run: async (ctx) => `\ud83c\udf19 Good night *${ctx.pushName || 'friend'}*! Allah hafiz.`,
  });

  defMany(['ge', 'goodevening'], {
    category: 'general',
    desc: 'Good evening',
    run: async () => `\ud83c\udf07 Good evening!`,
  });

  defMany(['love', 'iloveyou', 'ily'], {
    category: 'general',
    desc: 'Pyaar bhejein',
    run: async (ctx) => `\u2764\ufe0f *${ctx.pushName || 'friend'}* ke liye dher saara pyaar! \ud83d\udc95`,
  });

  defMany(['hug', 'jaffi'], {
    category: 'general',
    desc: 'Virtual hug',
    run: async (ctx) => `\ud83e\udd17 *${ctx.pushName || 'friend'}* ko jaffi! \ud83d\udc9b`,
  });

  defMany(['kiss', 'bosa'], {
    category: 'general',
    desc: 'Virtual kiss',
    run: async () => `\ud83d\ude18 \ud83d\udc8b`,
  });

  defMany(['slap', 'thappar'], {
    category: 'general',
    desc: 'Thappar',
    run: async (ctx) => `\ud83d\udc4b *${ctx.pushName || 'friend'}* ko thappar! \ud83d\ude02`,
  });

  defMany(['punch', 'mukka'], {
    category: 'general',
    desc: 'Mukka',
    run: async () => `\ud83d\udca5 \ud83e\udd4a Boom!`,
  });

  defMany(['dance', 'nach'], {
    category: 'general',
    desc: 'Dance',
    run: async () => `\ud83d\udd7a\ud83d\udc83 \ud83c\udfb6 Nacho!`,
  });

  defMany(['sing', 'gaana'], {
    category: 'general',
    desc: 'Gaana',
    run: async () => `\ud83c\udfa4 \ud83c\udfb5 La la la\u2026`,
  });

  defMany(['cry', 'rona'], {
    category: 'general',
    desc: 'Rona',
    run: async () => `\ud83d\ude2d \ud83d\udca7`,
  });

  defMany(['laugh', 'haha', 'lol', 'hansi'], {
    category: 'general',
    desc: 'Hansi',
    run: async () => `\ud83d\ude02\ud83e\udd23 \ud83d\ude06`,
  });

  defMany(['angry', 'ghussa'], {
    category: 'general',
    desc: 'Ghussa',
    run: async () => `\ud83d\ude21 \ud83d\udd25`,
  });

  defMany(['clap', 'tali'], {
    category: 'general',
    desc: 'Tali',
    run: async () => `\ud83d\udc4f\ud83d\udc4f\ud83d\udc4f`,
  });

  defMany(['ok', 'okay', 'theek'], {
    category: 'general',
    desc: 'OK',
    run: async () => `\ud83d\udc4d Theek hai!`,
  });

  defMany(['no', 'nahi'], {
    category: 'general',
    desc: 'Nahi',
    run: async () => `\ud83d\udc4e Nahi.`,
  });

  defMany(['yes', 'haan', 'ji'], {
    category: 'general',
    desc: 'Haan',
    run: async () => `\ud83d\udc4d Haan bilkul.`,
  });

  defMany(['maybe', 'shayad'], {
    category: 'general',
    desc: 'Shayad',
    run: async () => `\ud83e\udd14 Shayad\u2026`,
  });

  defMany(['welcome', 'khushamdeed'], {
    category: 'general',
    desc: 'Khushamdeed',
    run: async (ctx) => `\ud83c\udf89 Khushamdeed *${ctx.pushName || 'friend'}*!`,
  });

  defMany(['congrats', 'congratulations', 'mubarak'], {
    category: 'general',
    desc: 'Mubarakbad',
    run: async () => `\ud83c\udf8a Mubarak ho! \ud83e\udd73`,
  });

  defMany(['goodluck', 'luck'], {
    category: 'general',
    desc: 'Good luck',
    run: async () => `\ud83c\udf40 Good luck!`,
  });

  defMany(['respect', 'adab'], {
    category: 'general',
    desc: 'Adab',
    run: async () => `\ud83d\ude4f Adab!`,
  });

  defMany(['facepalm', 'palm'], {
    category: 'general',
    desc: 'Facepalm',
    run: async () => `\ud83e\udd26 \ud83d\ude05`,
  });

  defMany(['shrug', 'pata_nahi'], {
    category: 'general',
    desc: 'Shrug',
    run: async () => `\ud83e\udd37 Pata nahi.`,
  });

  defMany(['think', 'sochna'], {
    category: 'general',
    desc: 'Sochna',
    run: async () => `\ud83e\udd14 \ud83d\udcad`,
  });

  defMany(['wink', 'ankh'], {
    category: 'general',
    desc: 'Wink',
    run: async () => `\ud83d\ude09`,
  });

  defMany(['cool', 'zabardast'], {
    category: 'general',
    desc: 'Cool',
    run: async () => `\ud83d\ude0e \ud83c\udfc6`,
  });

  defMany(['wow', 'amazing'], {
    category: 'general',
    desc: 'Wow',
    run: async () => `\ud83e\udd29 \ud83c\udf1f`,
  });

  defMany(['sad', 'dukhi'], {
    category: 'general',
    desc: 'Sad',
    run: async () => `\ud83d\ude14 \ud83d\udc94`,
  });

  defMany(['tired', 'thaka'], {
    category: 'general',
    desc: 'Tired',
    run: async () => `\ud83d\ude29 \ud83d\udca4`,
  });

  defMany(['sleep', 'sona'], {
    category: 'general',
    desc: 'Sleep',
    run: async () => `\ud83d\ude34 \ud83d\udecf\ufe0f`,
  });

  defMany(['hungry', 'bhook'], {
    category: 'general',
    desc: 'Hungry',
    run: async () => `\ud83c\udf55 \ud83c\udf54 \ud83e\udd24`,
  });

  defMany(['coffee', 'chai'], {
    category: 'general',
    desc: 'Chai/coffee',
    run: async () => `\u2615 \ud83e\udd16`,
  });

  defMany(['water', 'pani'], {
    category: 'general',
    desc: 'Pani',
    run: async () => `\ud83d\udca7 Pani peeyein!`,
  });

  defMany(['smile', 'muskaan'], {
    category: 'general',
    desc: 'Smile',
    run: async () => `\ud83d\ude0a`,
  });

  defMany(['blush', 'sharam'], {
    category: 'general',
    desc: 'Blush',
    run: async () => `\ud83d\ude0a\ud83d\ude48`,
  });

  defMany(['party', 'jashn'], {
    category: 'general',
    desc: 'Party',
    run: async () => `\ud83c\udf89\ud83c\udf8a\ud83e\udd73`,
  });

  defMany(['fire', 'aag'], {
    category: 'general',
    desc: 'Fire',
    run: async () => `\ud83d\udd25\ud83d\udd25\ud83d\udd25`,
  });

  defMany(['star', 'sitara'], {
    category: 'general',
    desc: 'Star',
    run: async () => `\u2b50\ud83c\udf1f\u2728`,
  });

  defMany(['heart', 'dil'], {
    category: 'general',
    desc: 'Heart',
    run: async () => `\u2764\ufe0f\ud83d\udc96\ud83d\udc95`,
  });

  defMany(['rose', 'gulab'], {
    category: 'general',
    desc: 'Rose',
    run: async () => `\ud83c\udf39\ud83c\udf37\ud83c\udf3a`,
  });

  defMany(['flower', 'phool'], {
    category: 'general',
    desc: 'Flower',
    run: async () => `\ud83c\udf3c\ud83c\udf3b\ud83c\udf37`,
  });

  defMany(['sun', 'suraj'], {
    category: 'general',
    desc: 'Sun',
    run: async () => `\u2600\ufe0f\ud83c\udf1e`,
  });

  defMany(['moon', 'chand'], {
    category: 'general',
    desc: 'Moon',
    run: async () => `\ud83c\udf19\ud83c\udf1c`,
  });

  defMany(['rain', 'barish'], {
    category: 'general',
    desc: 'Rain',
    run: async () => `\ud83c\udf27\ufe0f\u2614`,
  });

  defMany(['snow', 'baraf'], {
    category: 'general',
    desc: 'Snow',
    run: async () => `\u2744\ufe0f\ud83c\udf28\ufe0f`,
  });

  defMany(['storm', 'toofan'], {
    category: 'general',
    desc: 'Storm',
    run: async () => `\ud83c\udf2a\ufe0f\u26c8\ufe0f`,
  });

  defMany(['rainbow', 'indradhanush'], {
    category: 'general',
    desc: 'Rainbow',
    run: async () => `\ud83c\udf08`,
  });

  defMany(['ghost', 'bhoot'], {
    category: 'general',
    desc: 'Ghost',
    run: async () => `\ud83d\udc7b`,
  });

  defMany(['alien', 'paraya'], {
    category: 'general',
    desc: 'Alien',
    run: async () => `\ud83d\udc7d`,
  });

  defMany(['robot', 'bot_face'], {
    category: 'general',
    desc: 'Robot',
    run: async () => `\ud83e\udd16`,
  });

  defMany(['cat', 'billi'], {
    category: 'general',
    desc: 'Cat',
    run: async () => `\ud83d\udc31`,
  });

  defMany(['dog', 'kutta'], {
    category: 'general',
    desc: 'Dog',
    run: async () => `\ud83d\udc36`,
  });

  defMany(['lion', 'sher'], {
    category: 'general',
    desc: 'Lion',
    run: async () => `\ud83e\udd81`,
  });

  defMany(['tiger', 'bagh'], {
    category: 'general',
    desc: 'Tiger',
    run: async () => `\ud83d\udc2f`,
  });

  defMany(['elephant', 'hathi'], {
    category: 'general',
    desc: 'Elephant',
    run: async () => `\ud83d\udc18`,
  });

  defMany(['horse', 'ghora'], {
    category: 'general',
    desc: 'Horse',
    run: async () => `\ud83d\udc0e`,
  });

  defMany(['bird', 'parinda'], {
    category: 'general',
    desc: 'Bird',
    run: async () => `\ud83d\udc26`,
  });

  defMany(['fish', 'machli'], {
    category: 'general',
    desc: 'Fish',
    run: async () => `\ud83d\udc1f`,
  });

  defMany(['butterfly', 'titli'], {
    category: 'general',
    desc: 'Butterfly',
    run: async () => `\ud83e\udd8b`,
  });

  defMany(['bee', 'madhumakhi'], {
    category: 'general',
    desc: 'Bee',
    run: async () => `\ud83d\udc1d`,
  });

  defMany(['ant', 'cheenti'], {
    category: 'general',
    desc: 'Ant',
    run: async () => `\ud83d\udc1c`,
  });

  defMany(['spider', 'makri'], {
    category: 'general',
    desc: 'Spider',
    run: async () => `\ud83d\udd77\ufe0f`,
  });

  defMany(['snake', 'saanp'], {
    category: 'general',
    desc: 'Snake',
    run: async () => `\ud83d\udc0d`,
  });

  defMany(['crocodile', 'magarmach'], {
    category: 'general',
    desc: 'Crocodile',
    run: async () => `\ud83d\udc0a`,
  });

  defMany(['whale', 'whael'], {
    category: 'general',
    desc: 'Whale',
    run: async () => `\ud83d\udc33`,
  });

  defMany(['dolphin'], {
    category: 'general',
    desc: 'Dolphin',
    run: async () => `\ud83d\udc2c`,
  });

  defMany(['penguin'], {
    category: 'general',
    desc: 'Penguin',
    run: async () => `\ud83d\udc27`,
  });

  defMany(['monkey', 'bandar'], {
    category: 'general',
    desc: 'Monkey',
    run: async () => `\ud83d\udc35`,
  });

  defMany(['panda'], {
    category: 'general',
    desc: 'Panda',
    run: async () => `\ud83d\udc3c`,
  });

  defMany(['bear', 'bhalu'], {
    category: 'general',
    desc: 'Bear',
    run: async () => `\ud83d\udc3b`,
  });

  defMany(['wolf', 'bhediya'], {
    category: 'general',
    desc: 'Wolf',
    run: async () => `\ud83d\udc3a`,
  });

  defMany(['fox', 'lomri'], {
    category: 'general',
    desc: 'Fox',
    run: async () => `\ud83e\udd8a`,
  });

  defMany(['rabbit', 'khargosh'], {
    category: 'general',
    desc: 'Rabbit',
    run: async () => `\ud83d\udc30`,
  });

  defMany(['turtle', 'kachwa'], {
    category: 'general',
    desc: 'Turtle',
    run: async () => `\ud83d\udc22`,
  });

  defMany(['frog', 'mendhak'], {
    category: 'general',
    desc: 'Frog',
    run: async () => `\ud83d\udc38`,
  });

  defMany(['owl', 'ullu'], {
    category: 'general',
    desc: 'Owl',
    run: async () => `\ud83e\udd89`,
  });

  defMany(['eagle', 'baaz'], {
    category: 'general',
    desc: 'Eagle',
    run: async () => `\ud83e\udd85`,
  });

  defMany(['parrot', 'tota'], {
    category: 'general',
    desc: 'Parrot',
    run: async () => `\ud83e\udd9c`,
  });

  defMany(['peacock', 'mor'], {
    category: 'general',
    desc: 'Peacock',
    run: async () => `\ud83e\udd9a`,
  });

  defMany(['camel', 'oont'], {
    category: 'general',
    desc: 'Camel',
    run: async () => `\ud83d\udc2b`,
  });

  defMany(['goat', 'bakri'], {
    category: 'general',
    desc: 'Goat',
    run: async () => `\ud83d\udc10`,
  });

  defMany(['cow', 'gaay'], {
    category: 'general',
    desc: 'Cow',
    run: async () => `\ud83d\udc04`,
  });

  defMany(['chicken', 'murgi'], {
    category: 'general',
    desc: 'Chicken',
    run: async () => `\ud83d\udc14`,
  });

  defMany(['duck', 'batakh'], {
    category: 'general',
    desc: 'Duck',
    run: async () => `\ud83e\udd86`,
  });

  defMany(['pig', 'suar'], {
    category: 'general',
    desc: 'Pig',
    run: async () => `\ud83d\udc37`,
  });

  defMany(['sheep', 'bhed'], {
    category: 'general',
    desc: 'Sheep',
    run: async () => `\ud83d\udc11`,
  });

  defMany(['mouse', 'chuha'], {
    category: 'general',
    desc: 'Mouse',
    run: async () => `\ud83d\udc2d`,
  });

  defMany(['squirrel', 'gulhari'], {
    category: 'general',
    desc: 'Squirrel',
    run: async () => `\ud83d\udc3f\ufe0f`,
  });

  defMany(['hedgehog'], {
    category: 'general',
    desc: 'Hedgehog',
    run: async () => `\ud83e\udd94`,
  });

  defMany(['bat', 'chamgadar'], {
    category: 'general',
    desc: 'Bat',
    run: async () => `\ud83e\udd87`,
  });

  defMany(['shark'], {
    category: 'general',
    desc: 'Shark',
    run: async () => `\ud83e\udd88`,
  });

  defMany(['octopus', 'octapus'], {
    category: 'general',
    desc: 'Octopus',
    run: async () => `\ud83d\udc19`,
  });

  defMany(['crab', 'keekra'], {
    category: 'general',
    desc: 'Crab',
    run: async () => `\ud83e\udd80`,
  });

  defMany(['lobster'], {
    category: 'general',
    desc: 'Lobster',
    run: async () => `\ud83e\udd9e`,
  });

  defMany(['shrimp', 'jhinga'], {
    category: 'general',
    desc: 'Shrimp',
    run: async () => `\ud83e\udd90`,
  });

  defMany(['squid'], {
    category: 'general',
    desc: 'Squid',
    run: async () => `\ud83e\udd91`,
  });

  defMany(['dinosaur', 'dinasaur'], {
    category: 'general',
    desc: 'Dinosaur',
    run: async () => `\ud83e\udd95`,
  });

  defMany(['dragon', 'azhdaha'], {
    category: 'general',
    desc: 'Dragon',
    run: async () => `\ud83d\udc09`,
  });

  defMany(['unicorn'], {
    category: 'general',
    desc: 'Unicorn',
    run: async () => `\ud83e\udd84`,
  });

  defMany(['zombie'], {
    category: 'general',
    desc: 'Zombie',
    run: async () => `\ud83e\udddf`,
  });

  defMany(['skull', 'khopri'], {
    category: 'general',
    desc: 'Skull',
    run: async () => `\ud83d\udc80`,
  });

  defMany(['angel', 'farishta'], {
    category: 'general',
    desc: 'Angel',
    run: async () => `\ud83d\udc7c`,
  });

  defMany(['devil', 'shaitan'], {
    category: 'general',
    desc: 'Devil',
    run: async () => `\ud83d\ude08`,
  });

  defMany(['clown', 'joker'], {
    category: 'general',
    desc: 'Clown',
    run: async () => `\ud83e\udd21`,
  });

  defMany(['ninja'], {
    category: 'general',
    desc: 'Ninja',
    run: async () => `\ud83e\udd77`,
  });

  defMany(['superhero', 'hero'], {
    category: 'general',
    desc: 'Superhero',
    run: async () => `\ud83e\uddb8`,
  });

  defMany(['wizard', 'jadugar'], {
    category: 'general',
    desc: 'Wizard',
    run: async () => `\ud83e\uddD9`,
  });

  defMany(['pirate'], {
    category: 'general',
    desc: 'Pirate',
    run: async () => `\ud83c\udff4\u200d\u2620\ufe0f`,
  });

  defMany(['crown', 'taj'], {
    category: 'general',
    desc: 'Crown',
    run: async () => `\ud83d\udc51`,
  });

  defMany(['gem', 'heera'], {
    category: 'general',
    desc: 'Gem',
    run: async () => `\ud83d\udc8e`,
  });

  defMany(['gift', 'tohfa'], {
    category: 'general',
    desc: 'Gift',
    run: async () => `\ud83c\udf81`,
  });

  defMany(['balloon', 'gubbara'], {
    category: 'general',
    desc: 'Balloon',
    run: async () => `\ud83c\udf88`,
  });

  defMany(['cake'], {
    category: 'general',
    desc: 'Cake',
    run: async () => `\ud83c\udf82`,
  });

  defMany(['candy'], {
    category: 'general',
    desc: 'Candy',
    run: async () => `\ud83c\udf6c`,
  });

  defMany(['pizza'], {
    category: 'general',
    desc: 'Pizza',
    run: async () => `\ud83c\udf55`,
  });

  defMany(['burger'], {
    category: 'general',
    desc: 'Burger',
    run: async () => `\ud83c\udf54`,
  });

  defMany(['fries'], {
    category: 'general',
    desc: 'Fries',
    run: async () => `\ud83c\udf5f`,
  });

  defMany(['icecream', 'ice_cream'], {
    category: 'general',
    desc: 'Ice cream',
    run: async () => `\ud83c\udf66`,
  });

  defMany(['chocolate'], {
    category: 'general',
    desc: 'Chocolate',
    run: async () => `\ud83c\udf6b`,
  });

  defMany(['apple'], {
    category: 'general',
    desc: 'Apple',
    run: async () => `\ud83c\udf4e`,
  });

  defMany(['mango', 'aam'], {
    category: 'general',
    desc: 'Mango',
    run: async () => `\ud83e\udd6d`,
  });

  defMany(['banana', 'kela'], {
    category: 'general',
    desc: 'Banana',
    run: async () => `\ud83c\udf4c`,
  });

  defMany(['grapes', 'angoor'], {
    category: 'general',
    desc: 'Grapes',
    run: async () => `\ud83c\udf47`,
  });

  defMany(['watermelon', 'tarbooz'], {
    category: 'general',
    desc: 'Watermelon',
    run: async () => `\ud83c\udf49`,
  });

  defMany(['strawberry'], {
    category: 'general',
    desc: 'Strawberry',
    run: async () => `\ud83c\udf53`,
  });

  defMany(['cherry'], {
    category: 'general',
    desc: 'Cherry',
    run: async () => `\ud83c\udf52`,
  });

  defMany(['lemon', 'nimbu'], {
    category: 'general',
    desc: 'Lemon',
    run: async () => `\ud83c\udf4b`,
  });

  defMany(['orange', 'santra'], {
    category: 'general',
    desc: 'Orange',
    run: async () => `\ud83c\udf4a`,
  });

  defMany(['peach', 'aroo'], {
    category: 'general',
    desc: 'Peach',
    run: async () => `\ud83c\udf51`,
  });

  defMany(['pineapple', 'annanas'], {
    category: 'general',
    desc: 'Pineapple',
    run: async () => `\ud83c\udf4d`,
  });

  defMany(['coconut', 'nariyal'], {
    category: 'general',
    desc: 'Coconut',
    run: async () => `\ud83e\udd65`,
  });

  defMany(['avocado'], {
    category: 'general',
    desc: 'Avocado',
    run: async () => `\ud83e\udd51`,
  });

  defMany(['tomato', 'tamatar'], {
    category: 'general',
    desc: 'Tomato',
    run: async () => `\ud83c\udf45`,
  });

  defMany(['potato', 'aaloo'], {
    category: 'general',
    desc: 'Potato',
    run: async () => `\ud83e\udd54`,
  });

  defMany(['carrot', 'gajar'], {
    category: 'general',
    desc: 'Carrot',
    run: async () => `\ud83e\udd55`,
  });

  defMany(['corn', 'makai'], {
    category: 'general',
    desc: 'Corn',
    run: async () => `\ud83c\udf3d`,
  });

  defMany(['bread'], {
    category: 'general',
    desc: 'Bread',
    run: async () => `\ud83c\udf5e`,
  });

  defMany(['cheese'], {
    category: 'general',
    desc: 'Cheese',
    run: async () => `\ud83e\uddc0`,
  });

  defMany(['egg', 'anda'], {
    category: 'general',
    desc: 'Egg',
    run: async () => `\ud83e\udd5a`,
  });

  defMany(['milk', 'doodh'], {
    category: 'general',
    desc: 'Milk',
    run: async () => `\ud83e\udd5b`,
  });

  defMany(['rice', 'chawal'], {
    category: 'general',
    desc: 'Rice',
    run: async () => `\ud83c\udf5a`,
  });

  defMany(['noodles'], {
    category: 'general',
    desc: 'Noodles',
    run: async () => `\ud83c\udf5c`,
  });

  defMany(['sushi'], {
    category: 'general',
    desc: 'Sushi',
    run: async () => `\ud83c\udf63`,
  });

  defMany(['taco'], {
    category: 'general',
    desc: 'Taco',
    run: async () => `\ud83c\udf2e`,
  });

  defMany(['donut', 'doughnut'], {
    category: 'general',
    desc: 'Donut',
    run: async () => `\ud83c\udf69`,
  });

  defMany(['cookie', 'biscuit'], {
    category: 'general',
    desc: 'Cookie',
    run: async () => `\ud83c\udf6a`,
  });

  defMany(['popcorn'], {
    category: 'general',
    desc: 'Popcorn',
    run: async () => `\ud83c\udf7f`,
  });

  defMany(['beer'], {
    category: 'general',
    desc: 'Beer',
    run: async () => `\ud83c\udf7a`,
  });

  defMany(['wine'], {
    category: 'general',
    desc: 'Wine',
    run: async () => `\ud83c\udf77`,
  });

  defMany(['juice', 'ras'], {
    category: 'general',
    desc: 'Juice',
    run: async () => `\ud83e\uddc3`,
  });

  defMany(['random_fact', 'fact'], {
    category: 'general',
    desc: 'Random fact',
    run: async () =>
      '\ud83e\uddd0 ' +
      pick([
        'Shahad kabhi kharab nahi hota \u2014 3000 saal purana shahad bhi khaya ja sakta hai.',
        'Octopus ke 3 dil hote hain.',
        'Duniya ka sabse bara desert Antarctica hai.',
        'Insaan ka dil din mein ~100,000 baar dhadakta hai.',
        'Bijli ki speed 299,792 km/s hai.',
        'Aam ke ped 300 saal tak phal dete hain.',
        'Machhliyan bhi dard mehsoos karti hain.',
        'Neend mein insaan 4-6 sapne dekhta hai.',
        'Cheetah 0 se 100 km/h sirf 3 second mein jata hai.',
        'Banana asal mein berry hai.',
      ]),
  });

  defMany(['advice', 'tip'], {
    category: 'general',
    desc: 'Random advice',
    run: async () =>
      '\ud83d\udca1 ' +
      pick([
        'Aaj ka kaam kal par na chhorein.',
        'Roz 10 minute padhein \u2014 saal mein 60 ghante.',
        'Paani peete rahein, dimagh tez chalta hai.',
        'Sone se 1 ghanta pehle phone chhor dein.',
        'Har din kisi ki madad karein.',
        'Naye logon se baat karein, seekhne ko milta hai.',
        'Bachat pehle, kharch baad mein.',
        'Subah uth kar 5 minute shukr ada karein.',
      ]),
  });

  defMany(['compliment', 'tareef'], {
    category: 'general',
    desc: 'Tareef',
    run: async (ctx) =>
      `\ud83d\udc96 *${ctx.pushName || 'Aap'}* \u2014 ` +
      pick([
        'aap ka dil bohat bara hai.',
        'aap ki hansi din bana deti hai.',
        'aap bohat mehnati hain.',
        'aap ki soch sab se alag hai.',
        'aap bohat acha kaam karte hain.',
        'aap sach mein zabardast hain.',
      ]),
  });

  defMany(['roast', 'burn'], {
    category: 'general',
    desc: 'Halka phulka roast',
    run: async (ctx) =>
      `\ud83d\udd25 *${ctx.pushName || 'Aap'}*: ` +
      pick([
        'aap ka WiFi signal aur aap ki mehnat \u2014 dono kamzor hain. \ud83d\ude02',
        'aap ki speed dekh kar kachwa bhi has raha hai. \ud83d\udc22',
        'aap ko "kal karta hoon" ka world record milna chahiye. \ud83c\udfc6',
        'aap ki battery 1% hai aur aap phir bhi online hain. \ud83d\udd0b',
      ]),
  });

  defMany(['pickup', 'flirt'], {
    category: 'general',
    desc: 'Pickup line',
    run: async () =>
      '\ud83d\ude0f ' +
      pick([
        'Aap ka naam kya hai? Mujhe apni dua mein shamil karna hai.',
        'Aap chaand ho? Kyunke aap raat ko bhi roshan karte ho.',
        'Mera phone kharab hai \u2014 aap ka number save nahi ho raha. \ud83d\ude05',
        'Aap ko dekh kar lagta hai ke mera data pack khatam ho gaya. \ud83d\udcf6',
      ]),
  });

  defMany(['shayari', 'poetry'], {
    category: 'general',
    desc: 'Urdu shayari',
    run: async () =>
      '\ud83d\udcdd ' +
      pick([
        'Mohabbat mein koi hisaab nahi hota,\nDil ka koi jawab nahi hota.',
        'Zindagi ek safar hai suhana,\nYahan kal kya ho kisne jaana.',
        'Chand ko dekh kar yaad tumhari aayi,\nAur raat bhar neend na aayi.',
        'Dil dhoondta hai phir wohi fursat ke raat din,\nBaithe rahein tasavvur-e-jaana kiye hue.',
      ]),
  });

  defMany(['quote', 'quotes'], {
    category: 'general',
    desc: 'Random quote',
    run: async () =>
      '\u2728 ' +
      pick([
        'Mehnat itni khamoshi se karo ke kamyabi shor macha de.',
        'Jo aaj taklif uthata hai, woh kal rahat paata hai.',
        'Sabr ka phal meetha hota hai.',
        'Ilm hasil karo, kyunke ilm roshni hai.',
        'Haar ke baad hi jeet ki qadr hoti hai.',
        'Khud par yaqeen rakho, baqi sab ho jayega.',
      ]),
  });

  defMany(['joke', 'jokes', 'fun'], {
    category: 'general',
    desc: 'Random joke',
    run: async () =>
      '\ud83d\ude04 ' +
      pick([
        'Teacher: Tumhein sabse zyada kya pasand hai?\nStudent: Homework nahi karna. \ud83d\ude04',
        'Doctor: Aapko din mein 3 baar dawa lena hai.\nPatient: Subah, dopahar, shaam?\nDoctor: Nahi, breakfast, lunch, dinner. \ud83d\ude02',
        'WiFi aur rishtedar dono ek jaise hote hain \u2014 signal kamzor, demand zyada. \ud83d\udcf6',
        'Mera phone 100% charged hai, bas meri himmat 2% reh gayi hai. \ud83d\udd0b',
        'Shaadi ke baad: "Tum badal gaye ho."\nPehle bhi wohi tha, bas ab dikh raha hai. \ud83d\ude05',
      ]),
  });

  defMany(['pun', 'puns'], {
    category: 'general',
    desc: 'Random pun',
    run: async () =>
      '\ud83d\ude06 ' +
      pick([
        'Maine ek kitab likhi "How to solve 50% of your problems" \u2014 aadha adhoora reh gaya.',
        'Bijli wale ne mujhe shock diya \u2014 ab main us se "current" rakhta hoon.',
        'Aam wale ne kaha: "Aam khao, gufa mein jao." \ud83e\udd6d',
      ]),
  });

  defMany(['riddle', 'paheli'], {
    category: 'general',
    desc: 'Paheli',
    run: async () =>
      '\ud83e\udd14 *Paheli:* ' +
      pick([
        'Aisi kya cheez hai jo jitni bar bar lein, utni kam hoti hai? \u2014 *Saans*',
        'Aisa kya hai jo bina pairon ke chalta hai? \u2014 *Waqt*',
        'Aisa kya hai jo tootta hai magar awaaz nahi aati? \u2014 *Wada*',
        'Jitna do, utna barhta hai \u2014 *Ilm*',
      ]),
  });

  defMany(['truth', 'dare'], {
    category: 'general',
    desc: 'Truth ya dare',
    run: async () =>
      '\ud83c\udfb2 ' +
      pick([
        'Truth: Aap ne aakhri baar jhoot kab bola?',
        'Dare: Apni purani tasveer status par lagayein.',
        'Truth: Aap ka sabse bara raaz kya hai?',
        'Dare: Kisi dost ko 5 compliment bhejein.',
      ]),
  });

  defMany(['wouldyourather', 'wyr'], {
    category: 'general',
    desc: 'Would you rather',
    run: async () =>
      '\ud83e\udd14 ' +
      pick([
        'Ameer hona ya mashhoor hona?',
        'Hamesha late sona ya hamesha jaldi uthna?',
        'Samundar kinare rehna ya pahadon mein?',
        'Past dekho ya future?',
      ]),
  });

  defMany(['neverhaveiever', 'nhie'], {
    category: 'general',
    desc: 'Never have I ever',
    run: async () =>
      '\ud83d\ude05 ' +
      pick([
        'Never have I ever \u2014 raat ko 3 baje tak phone chalaya.',
        'Never have I ever \u2014 kisi ko jhoot bol kar bachaya.',
        'Never have I ever \u2014 exam se pehle raat bhar padha.',
      ]),
  });

  defMany(['8ball', 'eightball', 'magic8'], {
    category: 'general',
    desc: 'Magic 8 ball',
    run: async (ctx) => {
      if (!ctx.args.length) return '\u274c Sawal likhein: `.8ball Kya main pass ho jaunga?`';
      return (
        '\ud83c\udfb1 *Magic 8 Ball*\n\n' +
        pick([
          'Haan, bilkul! \u2705',
          'Nahi, aisa nahi hoga. \u274c',
          'Shayad\u2026 \ud83e\udd14',
          'Abhi nahi, baad mein. \u23f3',
          'Yaqeenan! \ud83c\udf1f',
          'Umeed mat rakhein. \ud83d\ude14',
          'Poochhne ki zaroorat nahi \u2014 haan. \ud83d\ude0e',
        ])
      );
    },
  });

  defMany(['coinflip', 'coin', 'flip'], {
    category: 'general',
    desc: 'Coin toss',
    run: async () => `\ud83e\ude99 *${pick(['Heads', 'Tails'])}*`,
  });

  defMany(['dice', 'roll', 'ludo'], {
    category: 'general',
    desc: 'Dice roll',
    run: async () => `\ud83c\udfb2 *${Math.floor(Math.random() * 6) + 1}*`,
  });

  defMany(['dice2', 'roll2'], {
    category: 'general',
    desc: 'Do dice',
    run: async () => {
      const a = Math.floor(Math.random() * 6) + 1;
      const b = Math.floor(Math.random() * 6) + 1;
      return `\ud83c\udfb2 \ud83c\udfb2\n\n*${a}* + *${b}* = *${a + b}*`;
    },
  });

  defMany(['rps'], {
    category: 'general',
    desc: 'Rock paper scissors',
    run: async (ctx) => {
      const mine = pick(['Rock \ud83e\udea8', 'Paper \ud83d\udcc4', 'Scissors \u2702\ufe0f']);
      const yours = ctx.args.join(' ') || '?';
      return `\ud83c\udfb1 *Rock Paper Scissors*\n\nAap: ${yours}\nBot: ${mine}`;
    },
  });

  defMany(['rate', 'rating'], {
    category: 'general',
    desc: '.rate <cheez> \u2014 rating',
    run: async (ctx) => {
      const what = ctx.args.join(' ') || 'aap';
      return `\u2b50 *${what}* ki rating: *${Math.floor(Math.random() * 11)}/10*`;
    },
  });

  defMany(['howgay', 'gayrate'], {
    category: 'general',
    desc: 'Mazaq rating',
    run: async (ctx) =>
      `\ud83c\udf08 *${ctx.pushName || 'Aap'}*: *${Math.floor(Math.random() * 101)}%*`,
  });

  defMany(['howcute', 'cuteness'], {
    category: 'general',
    desc: 'Cuteness rating',
    run: async (ctx) =>
      `\ud83e\udd70 *${ctx.pushName || 'Aap'}*: *${Math.floor(Math.random() * 101)}%* cute`,
  });

  defMany(['howsmart', 'smartness'], {
    category: 'general',
    desc: 'Smartness rating',
    run: async (ctx) =>
      `\ud83e\udde0 *${ctx.pushName || 'Aap'}*: *${Math.floor(Math.random() * 101)}%* smart`,
  });

  defMany(['howrich', 'richness'], {
    category: 'general',
    desc: 'Richness rating',
    run: async (ctx) =>
      `\ud83d\udcb0 *${ctx.pushName || 'Aap'}*: *${Math.floor(Math.random() * 101)}%* rich`,
  });

  defMany(['howold', 'age'], {
    category: 'general',
    desc: 'Age guess',
    run: async (ctx) =>
      `\ud83c\udf82 *${ctx.pushName || 'Aap'}* ki umar: *${Math.floor(Math.random() * 50) + 15}* saal`,
  });

  defMany(['lucky', 'luckynumber'], {
    category: 'general',
    desc: 'Lucky number',
    run: async () => `\ud83c\udf40 Lucky number: *${Math.floor(Math.random() * 100) + 1}*`,
  });

  defMany(['luckycolor', 'color'], {
    category: 'general',
    desc: 'Lucky color',
    run: async () => `\ud83c\udfa8 Lucky color: *${pick(['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White'])}*`,
  });

  defMany(['zodiac', 'rashi'], {
    category: 'general',
    desc: 'Zodiac sign',
    run: async () =>
      `\u2648 Aaj ka rashi: *${pick(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'])}*`,
  });

  defMany(['horoscope', 'bhavishyavani'], {
    category: 'general',
    desc: 'Aaj ka horoscope',
    run: async () =>
      `\ud83d\udd2e *Aaj ka horoscope*\n\n${pick([
        'Din acha guzrega. Naya kaam shuru kar sakte hain.',
        'Kisi purane dost se mulaqat ho sakti hai.',
        'Paisi ki taraf se achi khabar milegi.',
        'Thora sabr rakhein, natija acha hoga.',
        'Aaj kisi ki madad karein, barkat milegi.',
      ])}`,
  });

  defMany(['mood'], {
    category: 'general',
    desc: 'Random mood',
    run: async () => `\ud83d\ude0c Mood: *${pick(['Happy \ud83d\ude0a', 'Chill \ud83d\ude0e', 'Sleepy \ud83d\ude34', 'Energetic \u26a1', 'Focused \ud83c\udfaf'])}*`,
  });

  defMany(['name', 'myname'], {
    category: 'general',
    desc: 'Aap ka naam',
    run: async (ctx) => `\ud83d\udc64 Aap ka naam: *${ctx.pushName || 'Unknown'}*`,
  });

  defMany(['number', 'mynumber'], {
    category: 'general',
    desc: 'Aap ka number',
    run: async (ctx) => `\ud83d\udcf1 Aap ka number: *${jidToNumber(ctx.sender)}*`,
  });

  defMany(['timezone', 'tz'], {
    category: 'general',
    desc: 'Aap ka timezone',
    run: async () => `\ud83c\udf10 Server timezone: *${Intl.DateTimeFormat().resolvedOptions().timeZone}*`,
  });

  defMany(['version', 'ver'], {
    category: 'general',
    desc: 'Bot version',
    run: async () => `\ud83d\udce6 Version: *1.0.0*`,
  });

  defMany(['botname'], {
    category: 'general',
    desc: 'Bot ka naam',
    run: async () => `\ud83e\udd16 Bot: *${BOT_NAME}*`,
  });

  defMany(['prefix', 'prefixes'], {
    category: 'general',
    desc: 'Command prefix',
    run: async () => `\u2702\ufe0f Prefixes: ${['.', '/', '!', '#'].join('  ')}`,
  });
};
