/** GAME: games, challenges, quizzes. */

const { pick, randInt } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({ name: ['guess', 'guessnumber'], category: 'game', desc: '.guess <1-100> \u2014 number guess',
    run: async (ctx) => {
      const n = parseInt(ctx.args[0], 10);
      if (Number.isNaN(n)) return '\u274c Misal: `.guess 50`';
      const target = randInt(1, 100);
      if (n === target) return `\ud83c\udf89 Bilkul sahi! Number *${target}* tha.`;
      return `\u274c Nahi. Number *${target}* tha. (Tumne ${n} kaha)`;
    } });

  def({ name: ['trivia', 'quiz'], category: 'game', desc: '.trivia \u2014 sawal',
    run: async () => {
      const q = pick([
        ['Pakistan ka capital kya hai?', 'Islamabad'],
        ['Sabse bada planet kaunsa hai?', 'Jupiter'],
        ['Paani ka chemical formula?', 'H2O'],
        ['Sabse lambi nadi?', 'Nile'],
        ['Quran mein kitne surah hain?', '114'],
        ['Duniya ka sabse bada ocean?', 'Pacific'],
      ]);
      return `\u2753 *Trivia:* ${q[0]}\n\n_Jawab: ${q[1]}_`;
    } });

  def({ name: ['truthordare', 'tod'], category: 'game', desc: '.truthordare',
    run: async () => `\ud83c\udfb2 *${pick(['TRUTH', 'DARE'])}* \u2014 `.truth` ya `.dare` likhein!` });

  def({ name: ['tictactoe', 'ttt'], category: 'game', desc: '.tictactoe \u2014 game start',
    run: async () => '\u274c\u2b55\u274c\n\u2b55\u274c\u2b55\n\u2b55\u274c\u2b55\n\n_Tic-tac-toe board ready. (Multiplayer coming soon!)_' });

  def({ name: ['hangman', 'wordgame'], category: 'game', desc: '.hangman \u2014 game',
    run: async () => `\ud83d\udd24 Hangman word: _ _ _ _ _\n_Guess karein: \`.letter a\`` });

  def({ name: ['scramble', 'wordscramble'], category: 'game', desc: '.scramble \u2014 word scramble',
    run: async () => { const w = pick(['PAKISTAN', 'WHATSAPP', 'COMPUTER', 'BIRYANI', 'CRICKET']); const s = w.split('').sort(() => Math.random() - 0.5).join(''); return `\ud83d\udd24 Scrambled: *${s}*\n_Jawab: ${w}_`; } });

  def({ name: ['mathquiz', 'mathgame'], category: 'game', desc: '.mathquiz',
    run: async () => { const a = randInt(2, 20); const b = randInt(2, 20); return `\ud83e\uddee *${a} + ${b} = ?*\n_Jawab: ${a + b}_`; } });

  def({ name: ['emojiquiz', 'guessthemoji'], category: 'game', desc: '.emojiquiz',
    run: async () => { const q = pick([['\ud83d\udd25\ud83d\udc36', 'Hot dog'], ['\ud83c\udf34\ud83c\udf34', 'Palm tree'], ['\u2b50\ud83d\udc1f', 'Starfish'], ['\ud83d\udc51\ud83e\udd81', 'Lion king']]); return `\ud83e\udd14 Emoji quiz: ${q[0]}\n_Jawab: ${q[1]}_`; } });

  def({ name: ['riddlequiz', 'riddlegame'], category: 'game', desc: '.riddlequiz',
    run: async () => `\ud83e\udd14 ${pick(['Jitna zyada lo utna bacha \u2014 Qadam', 'Bina munh ke bolta hai \u2014 Echo', 'Do bhai kabhi milte nahi \u2014 Aankhein'])}` });

  def({ name: ['numberguess2', 'higherlower'], category: 'game', desc: '.higherlower',
    run: async () => `\ud83d\udd22 Number: *${randInt(1, 100)}* \u2014 higher ya lower?` });

  def({ name: ['spin', 'spinwheel'], category: 'game', desc: '.spin \u2014 wheel',
    run: async () => `\ud83c\udfaf Wheel result: *${pick(['Prize 1', 'Prize 2', 'Try again', 'Jackpot!', 'Better luck next time'])}*` });

  def({ name: ['lottery', 'lucky_draw'], category: 'game', desc: '.lottery',
    run: async () => `\ud83c\udf9f\ufe0f Lottery numbers: *${Array.from({ length: 6 }, () => randInt(1, 45)).join(', ')}*` });

  def({ name: ['bingo', 'bingocard'], category: 'game', desc: '.bingo',
    run: async () => `\ud83c\udfb1 Bingo: *${Array.from({ length: 5 }, () => randInt(1, 75)).join(' - ')}*` });

  bulk(defMany, 'game', [
    { names: ['game1', 'g1'], desc: 'Game 1', replies: ['\ud83c\udfae Game mode on!'] },
    { names: ['game2', 'g2'], desc: 'Game 2', replies: ['\ud83c\udfae Game mode on!'] },
    { names: ['game3', 'g3'], desc: 'Game 3', replies: ['\ud83c\udfae Game mode on!'] },
    { names: ['game4', 'g4'], desc: 'Game 4', replies: ['\ud83c\udfae Game mode on!'] },
    { names: ['game5', 'g5'], desc: 'Game 5', replies: ['\ud83c\udfae Game mode on!'] },
    { names: ['play', 'startgame'], desc: 'Play', replies: ['\ud83c\udfae Kaunsa game? `.trivia`, `.riddle`, `.guess`'] },
    { names: ['score', 'myscore'], desc: 'Score', replies: ['\ud83c\udfc6 Score: 0'] },
    { names: ['leaderboard', 'top'], desc: 'Leaderboard', replies: ['\ud83c\udfc6 Leaderboard khali hai.'] },
    { names: ['resetgame', 'newgame'], desc: 'Reset game', replies: ['\u267b\ufe0f Game reset.'] },
    { names: ['quitgame', 'endgame'], desc: 'Quit game', replies: ['\ud83d\udc4b Game khatam.'] },
    { names: ['hint', 'gamehint'], desc: 'Hint', replies: ['\ud83d\udca1 Hint: pehla letter vowel hai.'] },
    { names: ['skip', 'skipquestion'], desc: 'Skip', replies: ['\u23ed\ufe0f Skip.'] },
    { names: ['answer', 'myanswer'], desc: 'Answer', replies: ['\u270d\ufe0f Answer note kar liya.'] },
    { names: ['challenge', 'challenge2'], desc: 'Challenge', replies: ['\ud83d\udd25 Challenge accept?'] },
    { names: ['duel', '1v1'], desc: 'Duel', replies: ['\u2694\ufe0f Duel ready!'] },
    { names: ['vs', 'versus'], desc: 'VS', replies: ['\u2694\ufe0f A vs B'] },
    { names: ['streak', 'winningstreak'], desc: 'Streak', replies: ['\ud83d\udd25 Streak: 0'] },
    { names: ['level', 'mylevel'], desc: 'Level', replies: ['\ud83c\udf96\ufe0f Level: 1'] },
    { names: ['xp', 'myxp'], desc: 'XP', replies: ['\u2b50 XP: 0'] },
    { names: ['badge', 'badges'], desc: 'Badges', replies: ['\ud83c\udf96\ufe0f Badges: none yet'] },
  ]);
};
