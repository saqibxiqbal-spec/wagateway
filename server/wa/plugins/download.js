/** DOWNLOAD: social media / media download helpers. */

const { bulk } = require('./_bulk');

const NOTE = 'Ye server par direct downloader enabled nahi hai. Neeche link se download karein:';

module.exports = (def, defMany) => {
  def({ name: ['ytmp3', 'ytaudio', 'song'], category: 'download', desc: '.ytmp3 <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Song/video name dein.';
    return `\ud83c\udfb5 *${q}*\n${NOTE}\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  } });
  def({ name: ['ytmp4', 'ytvideo2', 'video_dl'], category: 'download', desc: '.ytmp4 <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Video name dein.';
    return `\ud83c\udfac *${q}*\n${NOTE}\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  } });
  def({ name: ['play', 'playsong'], category: 'download', desc: '.play <song>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Song name dein.';
    return `\u25b6\ufe0f *${q}*\nhttps://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  } });
  def({ name: ['igdl', 'instadl', 'instagram_dl'], category: 'download', desc: '.igdl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Instagram link dein.';
    return `\ud83d\udcf8 Instagram download:\nhttps://snapinsta.app/\n_Link: ${u}_`;
  } });
  def({ name: ['fbdl', 'facebook_dl'], category: 'download', desc: '.fbdl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Facebook link dein.';
    return `\ud83d\udc26 Facebook download:\nhttps://fdown.net/\n_Link: ${u}_`;
  } });
  def({ name: ['tiktokdl', 'ttdl'], category: 'download', desc: '.tiktokdl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c TikTok link dein.';
    return `\ud83c\udfb5 TikTok download:\nhttps://ssstik.io/\n_Link: ${u}_`;
  } });
  def({ name: ['twitterdl', 'xdl'], category: 'download', desc: '.twitterdl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Twitter/X link dein.';
    return `\ud83d\udc26 Twitter download:\nhttps://twitsave.com/\n_Link: ${u}_`;
  } });
  def({ name: ['spotifydl', 'spdl'], category: 'download', desc: '.spotifydl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Spotify link dein.';
    return `\ud83c\udfb5 Spotify download:\nhttps://spotify-downloader.com/\n_Link: ${u}_`;
  } });
  def({ name: ['pindl', 'pinterestdl'], category: 'download', desc: '.pindl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c Pinterest link dein.';
    return `\ud83d\udccc Pinterest: ${u}`;
  } });
  def({ name: ['sndl', 'soundclouddl'], category: 'download', desc: '.sndl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    if (!u) return '\u274c SoundCloud link dein.';
    return `\ud83c\udfb5 SoundCloud: https://soundcloud.com/`;
  } });
  def({ name: ['apk', 'apkdl'], category: 'download', desc: '.apk <app>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c App name dein.';
    return `\ud83d\udcf2 APK: https://apkpure.com/search?q=${encodeURIComponent(q)}`;
  } });
  def({ name: ['modapk', 'moddl'], category: 'download', desc: '.modapk <app>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c App name dein.';
    return `\ud83d\udcf2 MOD APK: https://apkpure.com/search?q=${encodeURIComponent(q)}`;
  } });
  def({ name: ['movie_dl', 'moviedl'], category: 'download', desc: '.movie_dl <name>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Movie name dein.';
    return `\ud83c\udfac *${q}*\nhttps://www.google.com/search?q=${encodeURIComponent(q + ' watch online')}`;
  } });
  def({ name: ['song_dl', 'songdl'], category: 'download', desc: '.song_dl <name>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    if (!q) return '\u274c Song name dein.';
    return `\ud83c\udfb5 *${q}*\nhttps://www.google.com/search?q=${encodeURIComponent(q + ' mp3 download')}`;
  } });
  def({ name: ['videodl', 'video_download'], category: 'download', desc: '.videodl <link>', run: async (ctx) => {
    const u = ctx.args[0];
    return u ? `\ud83c\udfac ${u}` : '\u274c Link dein.';
  } });
  def({ name: ['imagedl', 'imgdl'], category: 'download', desc: '.imagedl <query>', run: async (ctx) => {
    const q = ctx.args.join(' ');
    return q ? `\ud83d\uddbc\ufe0f https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}` : '\u274c Query dein.';
  } });

  bulk(defMany, 'download', [
    { names: ['dl', 'download2'], desc: 'Download', replies: ['\u2b07\ufe0f Kaunsa? `.ytmp3`, `.ytmp4`, `.igdl`, `.fbdl`, `.tiktokdl`'] },
    { names: ['dlmenu', 'downloadmenu'], desc: 'Download menu', replies: ['\u2b07\ufe0f YouTube, Instagram, Facebook, TikTok, Twitter, Spotify, Pinterest'] },
    { names: ['ytdl', 'youtubedl'], desc: 'YouTube DL', replies: ['\u25b6\ufe0f `.ytmp3 <query>` ya `.ytmp4 <query>`'] },
    { names: ['fbdv', 'fbreel'], desc: 'FB reel', replies: ['\ud83d\udc26 `.fbdl <link>`'] },
    { names: ['igreel', 'igreels'], desc: 'IG reel', replies: ['\ud83d\udcf8 `.igdl <link>`'] },
    { names: ['ttvideo', 'tiktokvideo'], desc: 'TikTok video', replies: ['\ud83c\udfb5 `.tiktokdl <link>`'] },
    { names: ['twvideo', 'xvideo'], desc: 'X video', replies: ['\ud83d\udc26 `.twitterdl <link>`'] },
    { names: ['spotify', 'spotify2'], desc: 'Spotify', replies: ['\ud83c\udfb5 `.spotifydl <link>`'] },
    { names: ['pinterest2', 'pin2'], desc: 'Pinterest', replies: ['\ud83d\udccc `.pindl <link>`'] },
    { names: ['soundcloud', 'sc'], desc: 'SoundCloud', replies: ['\ud83c\udfb5 `.sndl <link>`'] },
    { names: ['apkpure', 'apk2'], desc: 'APKPure', replies: ['\ud83d\udcf2 `.apk <app>`'] },
    { names: ['playstore2', 'ps'], desc: 'Play Store', replies: ['\ud83d\udcf2 https://play.google.com/store'] },
    { names: ['appstore', 'ios'], desc: 'App Store', replies: ['\ud83c\udf4e https://apps.apple.com/'] },
    { names: ['torrent', 'torrent2'], desc: 'Torrent', replies: ['\u26a0\ufe0f Torrent support nahi.'] },
    { names: ['magnet', 'magnetlink'], desc: 'Magnet', replies: ['\u26a0\ufe0f Magnet support nahi.'] },
    { names: ['zip', 'zipextract'], desc: 'ZIP', replies: ['\ud83d\uddc4\ufe0f ZIP extract server-side nahi.'] },
    { names: ['pdf', 'pdfdl'], desc: 'PDF', replies: ['\ud83d\udcc4 PDF: link bhejein.'] },
    { names: ['ebook', 'ebooks'], desc: 'Ebook', replies: ['\ud83d\udcd6 https://www.pdfdrive.com/'] },
    { names: ['course', 'coursedl'], desc: 'Course', replies: ['\ud83c\udf93 https://www.udemy.com/'] },
    { names: ['wallpaperdl', 'wpdl'], desc: 'Wallpaper DL', replies: ['\ud83d\uddbc\ufe0f https://wallpapercave.com/'] },
  ]);
};
