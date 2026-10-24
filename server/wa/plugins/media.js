/** MEDIA: stickers, images, view-once, profile pictures, media utilities. */

const { anyMediaBuffer, quotedMediaBuffer, ownMediaBuffer, requireMedia } = require('./_util');
const { bulk } = require('./_bulk');

module.exports = (def, defMany) => {
  def({
    name: ['sticker', 's', 'makesticker'],
    category: 'media',
    desc: '.sticker \u2014 image ko sticker banayein (reply)',
    run: async (ctx) => {
      const buf = await anyMediaBuffer(ctx);
      if (!buf) return '\u274c ' + requireMedia(ctx);
      try {
        await ctx.sock.sendMessage(ctx.chat, { sticker: buf }, { quoted: ctx.raw });
        return null;
      } catch {
        return '\u274c Sticker banane mein masla hua (server par image convert support nahi).';
      }
    },
  });

  def({
    name: ['toimg', 'toimage', 'sticker2img'],
    category: 'media',
    desc: '.toimg \u2014 sticker ko image banayein (reply)',
    run: async (ctx) => {
      const buf = await quotedMediaBuffer(ctx);
      if (!buf) return '\u274c Sticker par reply karein.';
      try {
        await ctx.sock.sendMessage(ctx.chat, { image: buf, caption: '\ud83d\uddbc\ufe0f Converted' }, { quoted: ctx.raw });
        return null;
      } catch {
        return '\u274c Convert nahi ho saka.';
      }
    },
  });

  def({
    name: ['vv', 'viewonce', 'reveal'],
    category: 'media',
    desc: '.vv \u2014 view-once media dobara bhejein (reply)',
    run: async (ctx) => {
      const q = ctx.quoted;
      if (!q) return '\u274c View-once message par reply karein.';
      const m = q.message || {};
      const kind = m.imageMessage ? 'image' : m.videoMessage ? 'video' : m.audioMessage ? 'audio' : null;
      if (!kind) return '\u274c Yeh view-once media nahi hai.';
      const buf = await quotedMediaBuffer(ctx);
      if (!buf) return '\u274c Media download nahi hui.';
      await ctx.sock.sendMessage(ctx.chat, { [kind]: buf, caption: m[kind + 'Message']?.caption || '' }, { quoted: ctx.raw });
      return null;
    },
  });

  def({
    name: ['getpp', 'profilepic', 'pp'],
    category: 'media',
    desc: '.getpp \u2014 profile picture dekhein',
    run: async (ctx) => {
      const target = ctx.quoted?.key?.participant || ctx.sender || ctx.chat;
      try {
        const url = await ctx.sock.profilePictureUrl(target, 'image');
        if (!url) return '\u274c Profile picture nahi mili (privacy settings).';
        await ctx.sock.sendMessage(ctx.chat, { image: { url }, caption: '\ud83d\uddbc\ufe0f Profile picture' }, { quoted: ctx.raw });
        return null;
      } catch {
        return '\u274c Profile picture nahi mili (privacy settings).';
      }
    },
  });

  def({
    name: ['save', 'savemedia', 'download'],
    category: 'media',
    desc: '.save \u2014 media save/re-send (reply)',
    run: async (ctx) => {
      const buf = await anyMediaBuffer(ctx);
      if (!buf) return '\u274c ' + requireMedia(ctx);
      const m = (ctx.quoted && ctx.quoted.message) || ctx.raw.message || {};
      const kind = m.imageMessage ? 'image' : m.videoMessage ? 'video' : m.audioMessage ? 'audio' : m.documentMessage ? 'document' : null;
      if (!kind) return '\u274c Media type support nahi.';
      await ctx.sock.sendMessage(ctx.chat, { [kind]: buf }, { quoted: ctx.raw });
      return null;
    },
  });

  def({
    name: ['mediainfo', 'fileinfo'],
    category: 'media',
    desc: '.mediainfo \u2014 media details',
    run: async (ctx) => {
      const m = (ctx.quoted && ctx.quoted.message) || ctx.raw.message || {};
      const kind = m.imageMessage ? 'Image' : m.videoMessage ? 'Video' : m.audioMessage ? 'Audio' : m.documentMessage ? 'Document' : m.stickerMessage ? 'Sticker' : null;
      if (!kind) return '\u274c Kisi media par reply karein.';
      const info = m[kind.toLowerCase() + 'Message'] || {};
      return `\ud83d\udcc1 *${kind}*\n\u2022 MIME: ${info.mimetype || '-'}\n\u2022 Size: ${info.fileLength || '-'} bytes\n\u2022 Caption: ${info.caption || '-'}`;
    },
  });

  def({ name: ['imageinfo', 'imginfo'], category: 'media', desc: '.imageinfo', run: async () => '\ud83d\uddbc\ufe0f Image par reply karein aur `.mediainfo` likhein.' });
  def({ name: ['videoinfo', 'vidinfo'], category: 'media', desc: '.videoinfo', run: async () => '\ud83c\udfa5 Video par reply karein aur `.mediainfo` likhein.' });
  def({ name: ['audioinfo', 'audinfo'], category: 'media', desc: '.audioinfo', run: async () => '\ud83c\udfa7 Audio par reply karein aur `.mediainfo` likhein.' });
  def({ name: ['docinfo', 'documentinfo'], category: 'media', desc: '.docinfo', run: async () => '\ud83d\udcc4 Document par reply karein aur `.mediainfo` likhein.' });

  def({ name: ['resize', 'imageresize'], category: 'media', desc: '.resize \u2014 image resize', run: async (ctx) => '\ud83d\uddbc\ufe0f Resize ke liye image par reply karein. (Server-side resize support limited hai.)' });
  def({ name: ['compress', 'imgcompress'], category: 'media', desc: '.compress \u2014 image compress', run: async () => '\ud83d\uddc4\ufe0f Compression server-side available nahi. Original bhejein.' });
  def({ name: ['rotate', 'imgrotate'], category: 'media', desc: '.rotate \u2014 image rotate', run: async () => '\ud83d\udd04 Rotation support limited hai.' });
  def({ name: ['crop', 'imgcrop'], category: 'media', desc: '.crop \u2014 image crop', run: async () => '\u2702\ufe0f Crop support limited hai.' });
  def({ name: ['blur', 'imgblur'], category: 'media', desc: '.blur \u2014 image blur', run: async () => '\ud83c\udf2b\ufe0f Blur support limited hai.' });
  def({ name: ['grayscale', 'gray'], category: 'media', desc: '.grayscale', run: async () => '\u26ab Grayscale support limited hai.' });
  def({ name: ['invert', 'imginvert'], category: 'media', desc: '.invert', run: async () => '\ud83c\udf13 Invert support limited hai.' });
  def({ name: ['meme', 'mememaker'], category: 'media', desc: '.meme \u2014 meme banayein', run: async (ctx) => { const t = ctx.args.join(' '); return t ? `\ud83d\ude02 Meme text: *${t}* \u2014 image par reply karein.` : '\u274c Misal: `.meme top text | bottom text`'; } });
  def({ name: ['caption', 'setcaption'], category: 'media', desc: '.caption <text>', run: async (ctx) => { const t = ctx.args.join(' '); return t ? `\ud83d\udcdd Caption ready: _${t}_` : '\u274c Caption text dein.'; } });

  bulk(defMany, 'media', [
    { names: ['media', 'mediamenu'], desc: 'Media menu', replies: ['\ud83d\udcf8 `.sticker`, `.toimg`, `.vv`, `.getpp`, `.save`, `.mediainfo`'] },
    { names: ['photo', 'pic'], desc: 'Photo', replies: ['\ud83d\uddbc\ufe0f Photo bhejein aur command likhein.'] },
    { names: ['video', 'vid'], desc: 'Video', replies: ['\ud83c\udfa5 Video bhejein aur command likhein.'] },
    { names: ['audio', 'voice'], desc: 'Audio', replies: ['\ud83c\udfa7 Audio bhejein aur command likhein.'] },
    { names: ['document', 'doc'], desc: 'Document', replies: ['\ud83d\udcc4 Document bhejein aur command likhein.'] },
    { names: ['gif', 'giphy'], desc: 'GIF', replies: ['\ud83c\udfac GIF: `.gif <query>`'] },
    { names: ['stickerpack', 'stickers'], desc: 'Sticker pack', replies: ['\ud83d\udcf8 Sticker pack coming soon.'] },
    { names: ['emojisticker', 'esticker'], desc: 'Emoji sticker', replies: ['\ud83d\ude00 Emoji sticker: `.sticker` on emoji image.'] },
    { names: ['attp', 'textsticker'], desc: 'Text sticker', replies: ['\ud83d\udcf8 Text sticker: image par reply karein.'] },
    { names: ['take', 'stealsticker'], desc: 'Steal sticker', replies: ['\ud83d\udcf8 Sticker steal: reply karein.'] },
    { names: ['togif', 'tovideo'], desc: 'To GIF', replies: ['\ud83c\udfac Convert support limited.'] },
    { names: ['toaudio', 'tomp3'], desc: 'To audio', replies: ['\ud83c\udfa7 Audio convert support limited.'] },
    { names: ['tovn', 'toviewonce'], desc: 'To view-once', replies: ['\ud83d\udc40 View-once convert support limited.'] },
    { names: ['wallpaper', 'wp'], desc: 'Wallpaper', replies: ['\ud83d\uddbc\ufe0f Wallpaper: `.image wallpaper`'] },
    { names: ['avatar', 'av'], desc: 'Avatar', replies: ['\ud83d\udc64 Avatar: `.getpp`'] },
    { names: ['thumbnail', 'thumb'], desc: 'Thumbnail', replies: ['\ud83d\uddbc\ufe0f Thumbnail support limited.'] },
  ]);
};
