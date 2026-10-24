/**
 * Offline unit test for the command engine.
 * Simulates a linked socket and checks:
 *   1. self-chat commands are answered (the bug that made the bot silent)
 *   2. the bot never answers its own replies (no loop)
 *   3. unknown prefixes are ignored
 *   4. normal (non-self) DMs still work
 *   5. .vv / .calc / .menu behave
 */
const { EventEmitter } = require('events');
const { attachCommands } = require('./server/wa/commands');
const modeStore = require('./server/wa/mode');

function makeSock(number) {
  const ev = new EventEmitter();
  let n = 0;
  const sent = [];
  const sock = {
    ev,
    user: { id: `${number}:12@s.whatsapp.net` },
    groupMetadata: async () => ({ participants: [] }),
    updateMediaMessage: async () => {},
    sendMessage: async (jid, content) => {
      n += 1;
      const key = { id: `BOTMSG${n}`, remoteJid: jid, fromMe: true };
      sent.push({ jid, content, key });
      return { key };
    },
  };
  return { sock, sent };
}

const results = [];
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond, extra });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const number = '923001234567';
  const { sock, sent } = makeSock(number);
  const events = [];
  const detach = attachCommands(sock, {
    sessionId: 'test',
    number,
    logger: { info() {}, warn() {} },
    onEvent: (e) => events.push(e),
  });

  const selfJid = `${number}@s.whatsapp.net`;
  const emit = (id, text, { fromMe = true, jid = selfJid, type = 'notify' } = {}) =>
    sock.ev.emit('messages.upsert', {
      type,
      messages: [
        {
          key: { id, remoteJid: jid, fromMe },
          message: { conversation: text },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: 'Saqib',
        },
      ],
    });

  // 1. self-chat .ping
  emit('M1', '.ping');
  await sleep(150);
  check('self-chat .ping answered', sent.length === 2, `replies=${sent.length}`);
  check('reply is Pong', sent.some((s) => /Pong/.test(s.content.text || '')));

  // 2. bot's own reply must not trigger anything
  const before = sent.length;
  const own = sent[0].key.id;
  emit(own, 'Pong! something', { fromMe: true });
  await sleep(120);
  check('bot ignores its own message (no loop)', sent.length === before);

  // 3. unknown prefix ignored
  const b2 = sent.length;
  emit('M2', 'hello world');
  await sleep(100);
  check('no-prefix text ignored', sent.length === b2);

  // 4. .menu works
  emit('M3', '.menu');
  await sleep(200);
  check(
    '.menu returns list (image + caption)',
    sent.some((s) => /SAQIB MD/.test(s.content.text || s.content.caption || ''))
  );

  // 5. .calc
  emit('M4', '.calc 25*4');
  await sleep(150);
  check('.calc computes 100', sent.some((s) => /100/.test(s.content.text || '')));

  // 6. .alive
  emit('M5', '.alive');
  await sleep(150);
  check('.alive responds', sent.some((s) => /ALIVE/.test(s.content.text || '')));

  // 7. duplicate id processed once
  const b3 = sent.length;
  emit('M6', '.uptime');
  emit('M6', '.uptime');
  await sleep(200);
  check('duplicate message id handled once', sent.length === b3 + 1, `added=${sent.length - b3}`);

  // 8. normal DM from another person
  const b4 = sent.length;
  emit('M7', '.ping', { fromMe: false, jid: '923009999999@s.whatsapp.net' });
  await sleep(200);
  check('DM from another user answered', sent.length > b4);

  // 9. fromMe in someone else's chat must be ignored (own outbound to a friend)
  const b5 = sent.length;
  emit('M8', '.ping', { fromMe: true, jid: '923009999999@s.whatsapp.net' });
  await sleep(150);
  check('own outbound to a friend ignored', sent.length === b5);

  // 10. old append message ignored
  const b6 = sent.length;
  sock.ev.emit('messages.upsert', {
    type: 'append',
    messages: [
      {
        key: { id: 'OLD1', remoteJid: selfJid, fromMe: true },
        message: { conversation: '.ping' },
        messageTimestamp: Math.floor(Date.now() / 1000) - 3600,
      },
    ],
  });
  await sleep(150);
  check('stale history message ignored', sent.length === b6);

  // 11. .mode status shows public by default
  const b7 = sent.length;
  emit('M9', '.mode');
  await sleep(200);
  check('.mode shows PUBLIC by default', sent.slice(b7).some((s) => /PUBLIC/.test(s.content.text || '')));

  // 12. private mode blocks strangers but keeps self-chat working
  await modeStore.setMode('test', 'private');
  const b8 = sent.length;
  emit('M10', '.ping', { fromMe: false, jid: '923009999999@s.whatsapp.net' });
  await sleep(200);
  check('private mode blocks other users', sent.length === b8, `added=${sent.length - b8}`);

  const b9 = sent.length;
  emit('M11', '.ping');
  await sleep(200);
  check('private mode still allows owner (self-chat)', sent.length > b9);

  // 13. non-owner cannot switch mode
  const b10 = sent.length;
  emit('M12', '.mode public', { fromMe: false, jid: '923009999999@s.whatsapp.net' });
  await sleep(200);
  check(
    'non-owner cannot change mode',
    sent.slice(b10).some((s) => /owner/i.test(s.content.text || '')) &&
      (await modeStore.getMode('test')) === 'private'
  );

  // 14. owner can switch back to public
  emit('M13', '.mode public');
  await sleep(200);
  check('owner switches back to PUBLIC', (await modeStore.getMode('test')) === 'public');

  const b11 = sent.length;
  emit('M14', '.ping', { fromMe: false, jid: '923009999999@s.whatsapp.net' });
  await sleep(200);
  check('public mode re-opens for everyone', sent.length > b11);

  detach();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
