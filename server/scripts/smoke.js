/**
 * End-to-end smoke test against a running server.
 *   npm start            # in another terminal
 *   npm run smoke        # or: BASE=http://localhost:3000 npm run smoke
 *
 * Exercises: health -> register -> login -> me -> create session -> list ->
 * limits -> disconnect -> delete. Uses a throwaway email each run.
 */
const BASE = process.env.BASE || `http://127.0.0.1:${process.env.PORT || 3000}`;

let pass = 0;
let fail = 0;
const ok = (name, cond, extra) => {
  if (cond) {
    pass += 1;
    console.log('  PASS', name);
  } else {
    fail += 1;
    console.log('  FAIL', name, extra !== undefined ? extra : '');
  }
};

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-json */
  }
  return { status: res.status, json };
}

(async () => {
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'smoke12345';

  console.log('BASE =', BASE);

  const health = await call('GET', '/api/health');
  ok('health 200', health.status === 200, health);
  ok('health mongo up', health.json?.mongo === 'up', health.json);

  const reg = await call('POST', '/api/auth/register', { body: { email, password, name: 'Smoke' } });
  ok('register 201', reg.status === 201, reg);
  const token = reg.json?.token;
  ok('register returns token', Boolean(token));

  const dup = await call('POST', '/api/auth/register', { body: { email, password } });
  ok('duplicate register 409', dup.status === 409, dup);

  const badLogin = await call('POST', '/api/auth/login', { body: { email, password: 'wrongpass' } });
  ok('bad login 401', badLogin.status === 401, badLogin);

  const login = await call('POST', '/api/auth/login', { body: { email, password } });
  ok('login 200', login.status === 200, login);

  const me = await call('GET', '/api/auth/me', { token });
  ok('me 200', me.status === 200 && me.json?.user?.email === email, me);

  const noAuth = await call('GET', '/api/sessions');
  ok('sessions without token 401', noAuth.status === 401, noAuth);

  const create = await call('POST', '/api/sessions', { token, body: { number: '03001234567', label: 'Smoke' } });
  ok('create session 201', create.status === 201, create);
  ok('number normalized to 92...', create.json?.session?.number === '923001234567', create.json);
  const sid = create.json?.session?.id;

  const badNumber = await call('POST', '/api/sessions', { token, body: { number: '12' } });
  ok('invalid number 400', badNumber.status === 400, badNumber);

  const list = await call('GET', '/api/sessions', { token });
  ok('list has 1 session', list.status === 200 && list.json?.sessions?.length === 1, list.json);

  const limits = await call('GET', '/api/sessions/meta/limits', { token });
  ok('limits used=1', limits.status === 200 && limits.json?.used === 1, limits.json);

  const qr = await call('GET', `/api/sessions/${sid}/qr`, { token });
  ok('qr endpoint 200', qr.status === 200, qr);

  const disc = await call('POST', `/api/sessions/${sid}/disconnect`, { token });
  ok('disconnect 200', disc.status === 200, disc);

  const del = await call('DELETE', `/api/sessions/${sid}`, { token });
  ok('delete 200', del.status === 200, del);

  const list2 = await call('GET', '/api/sessions', { token });
  ok('list empty after delete', list2.json?.sessions?.length === 0, list2.json);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error('smoke crashed:', err);
  process.exit(1);
});
