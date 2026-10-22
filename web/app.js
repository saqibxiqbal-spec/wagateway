/* =========================================================================
   WA Gateway — single-page frontend (vanilla JS, no build step).
   Routes:  #/  landing   #/login   #/register   #/app  dashboard
   ========================================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  const modalBack = $('#modalBack');
  const modal = $('#modal');

  const store = {
    get token() { return localStorage.getItem('wag_token') || ''; },
    set token(v) { v ? localStorage.setItem('wag_token', v) : localStorage.removeItem('wag_token'); },
    get user() { try { return JSON.parse(localStorage.getItem('wag_user') || 'null'); } catch { return null; } },
    set user(u) { u ? localStorage.setItem('wag_user', JSON.stringify(u)) : localStorage.removeItem('wag_user'); },
  };

  const state = {
    sessions: [],
    limits: { used: 0, max: 10 },
    socket: null,
    poll: null,
    activeSession: null,
    pairMode: 'code',
  };

  // ------------------------------------------------------------------ utils
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'err' ? ' err' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, 3800);
  }

  async function api(method, path, body) {
    const res = await fetch(path, {
      method,
      headers: { 'content-type': 'application/json', ...(store.token ? { authorization: 'Bearer ' + store.token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch { /* ignore */ }
    if (res.status === 401 && store.token && !path.includes('/auth/login')) {
      logout(true);
    }
    if (!res.ok || (json && json.ok === false)) {
      throw new Error((json && json.error) || `Request failed (${res.status})`);
    }
    return json;
  }

  const statusMeta = (s) => ({
    connected: { cls: 'on', label: 'Connected' },
    pairing: { cls: 'warn', label: 'Pairing…' },
    connecting: { cls: 'warn', label: 'Connecting…' },
    idle: { cls: 'off', label: 'Not linked' },
    disconnected: { cls: 'off', label: 'Disconnected' },
    logged_out: { cls: 'err', label: 'Logged out' },
    error: { cls: 'err', label: 'Error' },
  }[s] || { cls: 'off', label: s || 'Unknown' });

  const fmtPhone = (n) => {
    if (!n) return '';
    if (n.length === 12) return `+${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
    if (n.length === 13) return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
    return '+' + n;
  };

  function logout(silent) {
    store.token = '';
    store.user = null;
    if (state.socket) { state.socket.disconnect(); state.socket = null; }
    if (!silent) toast('Signed out.');
    location.hash = '#/';
    render();
  }

  // ------------------------------------------------------------------ router
  window.addEventListener('hashchange', render);

  function render() {
    const hash = location.hash || '#/';
    $('#footer').style.display = hash.startsWith('#/app') ? 'none' : '';
    $('#navLinks').style.display = hash.startsWith('#/app') ? 'none' : '';

    if (hash.startsWith('#/app')) {
      if (!store.token) { location.hash = '#/login'; return; }
      return renderDashboard();
    }
    if (hash.startsWith('#/login')) return renderAuth('login');
    if (hash.startsWith('#/register')) return renderAuth('register');
    return renderLanding();
  }

  // ------------------------------------------------------------------ landing
  function renderLanding() {
    view.innerHTML = `
      <section class="wrap hero">
        <div>
          <span class="eyebrow">● Baileys v7 · Multi-device</span>
          <h1 class="hero-title">Link any WhatsApp number <span>in 30 seconds</span></h1>
          <p class="hero-sub">Generate an 8-digit pairing code or a live QR, watch the session connect in real time, and manage every linked number from one dashboard. No phone farm, no browser automation.</p>
          <div class="hero-cta">
            <a href="#/register" class="btn btn-primary">Create free account</a>
            <a href="#features" class="btn btn-ghost">See features</a>
          </div>
          <div class="hero-stats">
            <div class="stat"><b>~2 min</b><span>Pairing window</span></div>
            <div class="stat"><b>8-digit</b><span>Pairing code</span></div>
            <div class="stat"><b>0 disk</b><span>Mongo-backed creds</span></div>
          </div>
        </div>
        <div class="mock">
          <div class="mock-card">
            <div class="mock-head">
              <b style="font-size:13px">Connected devices</b>
              <span class="dot"></span>
            </div>
            <div class="mock-row">
              <div class="avatar">SA</div>
              <div class="meta"><b>Sales · +92 300 1234567</b><span>registered · 3d uptime</span></div>
              <span class="pill on">Connected</span>
            </div>
            <div class="mock-row">
              <div class="avatar" style="background:linear-gradient(140deg,#f5a524,#f2555a);color:#1a0b0b">SU</div>
              <div class="meta"><b>Support · +92 311 7654321</b><span>pairing code 4K9P-2XQ7</span></div>
              <span class="pill warn">Pairing…</span>
            </div>
            <div class="mock-row" style="margin-bottom:0">
              <div class="avatar" style="background:linear-gradient(140deg,#4f8cff,#a78bfa);color:#0a0f1c">OP</div>
              <div class="meta"><b>Ops · +92 345 0001122</b><span>logged out from phone</span></div>
              <span class="pill err">Logged out</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section wrap" id="features">
        <div class="section-head">
          <h2>Everything a pairing layer needs</h2>
          <p>Auth, sessions, live status and a generator UI — the boring parts, already built.</p>
        </div>
        <div class="features">
          <div class="feature"><div class="ico">🔐</div><h3>Secure accounts</h3><p>Email + password with bcrypt hashing and JWT sessions. Each tenant only ever sees their own numbers.</p></div>
          <div class="feature"><div class="ico">📱</div><h3>8-digit pairing</h3><p>Enter a number, get a code. Type it on the phone under “Link with phone number” and the device links.</p></div>
          <div class="feature"><div class="ico">🔳</div><h3>Live QR</h3><p>Prefer scanning? A fresh QR is streamed over Socket.io the moment WhatsApp rotates it.</p></div>
          <div class="feature"><div class="ico">🔄</div><h3>Auto-reconnect</h3><p>515 restart, transient drops and redeploys are handled. Creds live in Mongo, so nothing is lost.</p></div>
          <div class="feature"><div class="ico">📊</div><h3>Session manager</h3><p>See every number, its status, push name and last error. Disconnect or delete in one click.</p></div>
          <div class="feature"><div class="ico">⚡</div><h3>Real-time events</h3><p>Status changes, codes and QR rotations are pushed instantly — no refresh, no polling storm.</p></div>
        </div>
      </section>

      <section class="section wrap" id="how">
        <div class="section-head">
          <h2>How it works</h2>
          <p>Four steps from zero to a linked device.</p>
        </div>
        <div class="steps">
          <div class="step"><h4>Create account</h4><p>Sign up with email and a password of 8+ characters.</p></div>
          <div class="step"><h4>Add a number</h4><p>Enter the phone number with country code, e.g. 923001234567.</p></div>
          <div class="step"><h4>Get your code</h4><p>An 8-digit code appears. On the phone: Settings → Linked devices → Link with phone number.</p></div>
          <div class="step"><h4>Connected</h4><p>The dashboard flips to Connected and the session stays alive with auto-reconnect.</p></div>
        </div>
      </section>

      <section class="section wrap" style="text-align:center">
        <div class="panel" style="padding:38px 24px">
          <h2 style="margin:0 0 8px;font-size:26px;letter-spacing:-.02em">Ready to link your first number?</h2>
          <p style="color:var(--muted);margin:0 0 20px">Free to start. No credit card.</p>
          <a href="#/register" class="btn btn-primary">Create free account</a>
        </div>
      </section>
    `;
  }

  // ------------------------------------------------------------------ auth
  function renderAuth(mode) {
    const isLogin = mode === 'login';
    view.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <h2>${isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p class="sub">${isLogin ? 'Sign in to manage your linked numbers.' : 'Start linking WhatsApp numbers in under a minute.'}</p>
          <div class="tabs">
            <button data-tab="login" class="${isLogin ? 'active' : ''}">Sign in</button>
            <button data-tab="register" class="${!isLogin ? 'active' : ''}">Sign up</button>
          </div>
          <div class="alert" id="authAlert"></div>
          <form id="authForm" autocomplete="on">
            ${!isLogin ? `
            <div class="field"><label for="name">Name</label><input class="input" id="name" name="name" placeholder="Saquib" autocomplete="name" /></div>` : ''}
            <div class="field"><label for="email">Email</label><input class="input" id="email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required /></div>
            <div class="field"><label for="password">Password</label><input class="input" id="password" name="password" type="password" placeholder="${isLogin ? 'Your password' : 'At least 8 characters'}" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required /></div>
            <button class="btn btn-primary btn-block" id="authSubmit" type="submit">${isLogin ? 'Sign in' : 'Create account'}</button>
          </form>
          <p class="hint" style="margin-top:16px;text-align:center">${isLogin ? "Don't have an account? <a href='#/register' style='color:var(--green)'>Sign up</a>" : "Already registered? <a href='#/login' style='color:var(--green)'>Sign in</a>"}</p>
        </div>
      </div>
    `;

    view.querySelectorAll('[data-tab]').forEach((b) => {
      b.onclick = () => { location.hash = '#/' + b.dataset.tab; };
    });

    const alertBox = $('#authAlert');
    const showAlert = (msg, ok) => {
      alertBox.className = 'alert show ' + (ok ? 'ok' : 'error');
      alertBox.textContent = msg;
    };

    $('#authForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('#authSubmit');
      const email = $('#email').value.trim();
      const password = $('#password').value;
      const name = isLogin ? undefined : ($('#name')?.value || '').trim();

      if (!email || !password) return showAlert('Email aur password dono daalein.', false);
      if (!isLogin && password.length < 8) return showAlert('Password kam az kam 8 characters ka ho.', false);

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Please wait…';
      try {
        const out = await api('POST', isLogin ? '/api/auth/login' : '/api/auth/register', { email, password, name });
        store.token = out.token;
        store.user = out.user;
        toast(isLogin ? 'Welcome back!' : 'Account created!');
        location.hash = '#/app';
        render();
      } catch (err) {
        showAlert(err.message, false);
        btn.disabled = false;
        btn.textContent = isLogin ? 'Sign in' : 'Create account';
      }
    };
  }

  // ------------------------------------------------------------------ dashboard
  async function renderDashboard() {
    view.innerHTML = `
      <div class="app">
        <aside class="side">
          <div class="user">
            <div class="avatar" id="userAvatar">?</div>
            <div class="meta"><b id="userName">—</b><span id="userEmail">—</span></div>
          </div>
          <nav>
            <a class="active" href="#/app">◉ Dashboard</a>
            <a href="#" id="navFeatures">✦ Features</a>
            <a href="#" id="navLogout">⎋ Sign out</a>
          </nav>
          <div class="spacer"></div>
          <div class="hint" style="padding:0 12px">
            <b>Tip:</b> keep the pairing window open — codes expire in about 2 minutes.
          </div>
        </aside>
        <section class="main">
          <div class="page-head">
            <div>
              <h1>Dashboard</h1>
              <p>Link WhatsApp numbers and watch them connect live.</p>
            </div>
            <button class="btn btn-primary" id="btnConnect">+ Connect a number</button>
          </div>

          <div class="stat-grid">
            <div class="stat-card"><div class="k">Linked</div><div class="v" id="stTotal">0</div></div>
            <div class="stat-card"><div class="k">Connected</div><div class="v" id="stOnline" style="color:#7ef0b0">0</div></div>
            <div class="stat-card"><div class="k">Pairing</div><div class="v" id="stPairing" style="color:#ffd08a">0</div></div>
            <div class="stat-card"><div class="k">Plan</div><div class="v" id="stPlan">0<small id="stPlanMax">/10</small></div></div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2>Your sessions</h2>
              <button class="btn btn-ghost btn-sm" id="btnRefresh">↻ Refresh</button>
            </div>
            <div id="sessBody"><div class="panel-body"><div class="hint">Loading…</div></div></div>
          </div>
        </section>
      </div>
    `;

    const u = store.user || {};
    $('#userName').textContent = u.name || 'User';
    $('#userEmail').textContent = u.email || '';
    $('#userAvatar').textContent = (u.name || u.email || 'U').slice(0, 2).toUpperCase();
    $('#navLogout').onclick = (e) => { e.preventDefault(); logout(); };
    $('#navFeatures').onclick = (e) => { e.preventDefault(); location.hash = '#/'; setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 50); };
    $('#btnConnect').onclick = openConnectModal;
    $('#btnRefresh').onclick = () => loadSessions(true);

    await loadSessions();
    connectSocket();
  }

  async function loadSessions(showToast) {
    try {
      const [list, limits] = await Promise.all([
        api('GET', '/api/sessions'),
        api('GET', '/api/sessions/meta/limits'),
      ]);
      state.sessions = list.sessions || [];
      state.limits = { used: limits.used || 0, max: limits.max || 10 };
      renderSessions();
      if (showToast) toast('Sessions refreshed.');
    } catch (err) {
      $('#sessBody').innerHTML = `<div class="panel-body"><div class="alert error show">${esc(err.message)}</div></div>`;
    }
  }

  function renderSessions() {
    const s = state.sessions;
    $('#stTotal').textContent = s.length;
    $('#stOnline').textContent = s.filter((x) => x.status === 'connected').length;
    $('#stPairing').textContent = s.filter((x) => x.status === 'pairing' || x.status === 'connecting').length;
    $('#stPlan').innerHTML = `${state.limits.used}<small id="stPlanMax">/${state.limits.max}</small>`;

    if (!s.length) {
      $('#sessBody').innerHTML = `
        <div class="empty">
          <div class="big">📱</div>
          <h3>No numbers linked yet</h3>
          <p>Add your first WhatsApp number to generate a pairing code.</p>
          <button class="btn btn-primary" id="emptyConnect">+ Connect a number</button>
        </div>`;
      $('#emptyConnect').onclick = openConnectModal;
      return;
    }

    $('#sessBody').innerHTML = `<div class="sess-list">${s.map((x) => {
      const m = statusMeta(x.status);
      const initials = (x.label || x.pushName || x.number || '?').slice(0, 2).toUpperCase();
      const sub = x.me?.id ? x.me.id.split('@')[0] : fmtPhone(x.number);
      const canPair = ['idle', 'disconnected', 'logged_out', 'error'].includes(x.status);
      return `
        <div class="sess" data-id="${esc(x.id)}">
          <div class="avatar">${esc(initials)}</div>
          <div class="info">
            <b>${esc(x.label || x.pushName || 'WhatsApp device')}</b>
            <span>${esc(sub)}${x.lastError ? ' · ' + esc(x.lastError) : ''}</span>
          </div>
          <span class="pill ${m.cls}">${m.label}</span>
          <div class="actions">
            ${canPair ? `<button class="btn btn-ghost btn-sm" data-act="pair">Pair</button>` : ''}
            ${x.status === 'pairing' || x.status === 'connecting' ? `<button class="btn btn-ghost btn-sm" data-act="view">View code</button>` : ''}
            ${x.status === 'connected' ? `<button class="btn btn-ghost btn-sm" data-act="disconnect">Disconnect</button>` : ''}
            <button class="btn btn-danger btn-sm" data-act="delete">Delete</button>
          </div>
        </div>`;
    }).join('')}</div>`;

    $('#sessBody').querySelectorAll('.sess').forEach((row) => {
      const id = row.dataset.id;
      const sess = state.sessions.find((x) => x.id === id);
      row.querySelectorAll('[data-act]').forEach((btn) => {
        btn.onclick = () => {
          const act = btn.dataset.act;
          if (act === 'pair') return startPairing(sess);
          if (act === 'view') return openPairModal(sess);
          if (act === 'disconnect') return doDisconnect(sess);
          if (act === 'delete') return doDelete(sess);
        };
      });
    });
  }

  // ------------------------------------------------------------------ modal
  function closeModal() {
    modalBack.classList.remove('show');
    if (state.poll) { clearInterval(state.poll); state.poll = null; }
    state.activeSession = null;
  }
  modalBack.onclick = (e) => { if (e.target === modalBack) closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function openConnectModal() {
    if (state.limits.used >= state.limits.max) {
      toast(`Plan limit reached (${state.limits.max} numbers). Delete one first.`, 'err');
      return;
    }
    modal.innerHTML = `
      <div class="modal-head"><h3>Connect a WhatsApp number</h3><button class="x" id="mClose">×</button></div>
      <div class="modal-body">
        <div class="alert" id="mAlert"></div>
        <div class="field">
          <label for="mNumber">Phone number (with country code)</label>
          <input class="input" id="mNumber" placeholder="923001234567" inputmode="tel" />
        </div>
        <div class="field">
          <label for="mLabel">Label (optional)</label>
          <input class="input" id="mLabel" placeholder="Sales line" maxlength="60" />
        </div>
        <p class="hint">Use the full international format without <b>+</b> or spaces, e.g. <b>923001234567</b>. Local numbers like <b>03001234567</b> are auto-converted.</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" id="mCancel">Cancel</button>
        <button class="btn btn-primary" id="mGo">Generate pairing code</button>
      </div>`;
    modalBack.classList.add('show');
    $('#mClose').onclick = closeModal;
    $('#mCancel').onclick = closeModal;
    $('#mGo').onclick = async () => {
      const number = $('#mNumber').value.trim();
      const label = $('#mLabel').value.trim();
      const alertBox = $('#mAlert');
      const fail = (m) => { alertBox.className = 'alert show error'; alertBox.textContent = m; };
      if (!number) return fail('Phone number daalein.');
      const btn = $('#mGo');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating…';
      try {
        const out = await api('POST', '/api/sessions', { number, label });
        await loadSessions();
        startPairing(out.session);
      } catch (err) {
        fail(err.message);
        btn.disabled = false;
        btn.textContent = 'Generate pairing code';
      }
    };
    setTimeout(() => $('#mNumber').focus(), 60);
  }

  async function startPairing(sess) {
    openPairModal(sess, { starting: true });
    try {
      const out = await api('POST', `/api/sessions/${sess.id}/pair`);
      if (out.code) updatePairCode(out.code);
      await loadSessions();
      beginPolling(sess.id);
    } catch (err) {
      const a = $('#mAlert');
      if (a) { a.className = 'alert show error'; a.textContent = err.message; }
    }
  }

  function openPairModal(sess, opts = {}) {
    state.activeSession = sess;
    state.pairMode = 'code';
    modal.innerHTML = `
      <div class="modal-head">
        <h3>Pair ${esc(sess.label || fmtPhone(sess.number))}</h3>
        <button class="x" id="mClose">×</button>
      </div>
      <div class="modal-body">
        <div class="alert" id="mAlert"></div>
        <div class="seg">
          <button data-mode="code" class="active">8-digit code</button>
          <button data-mode="qr">QR code</button>
        </div>

        <div id="paneCode">
          <div class="code-box" id="codeBox">
            ${'<div class="ch">–</div>'.repeat(4)}<div class="ch dash">–</div>${'<div class="ch">–</div>'.repeat(4)}
          </div>
          <p class="hint" style="text-align:center">
            On the phone: <b>WhatsApp → Settings → Linked devices → Link a device → Link with phone number</b>, then type this code.
          </p>
        </div>

        <div id="paneQr" style="display:none">
          <div class="qr-box"><div class="qr-empty" id="qrSlot">Waiting for WhatsApp to issue a QR…</div></div>
          <p class="hint" style="text-align:center;margin-top:12px">Or scan with <b>WhatsApp → Linked devices → Link a device</b>.</p>
        </div>

        <div id="pairStatus" class="hint" style="text-align:center;margin-top:14px">${opts.starting ? '<span class="spinner"></span> Starting session…' : ''}</div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" id="mCancel">Close</button>
        <button class="btn btn-primary" id="mRetry">Restart pairing</button>
      </div>`;
    modalBack.classList.add('show');

    $('#mClose').onclick = closeModal;
    $('#mCancel').onclick = closeModal;
    $('#mRetry').onclick = () => startPairing(sess);

    modal.querySelectorAll('[data-mode]').forEach((b) => {
      b.onclick = () => {
        state.pairMode = b.dataset.mode;
        modal.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('active', x === b));
        $('#paneCode').style.display = state.pairMode === 'code' ? '' : 'none';
        $('#paneQr').style.display = state.pairMode === 'qr' ? '' : 'none';
        if (state.pairMode === 'qr') fetchQr(sess.id);
      };
    });

    if (!opts.starting && sess.pairingCode) updatePairCode(sess.pairingCode);
    beginPolling(sess.id);
  }

  function updatePairCode(code) {
    if (!code) return;
    const clean = String(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const box = $('#codeBox');
    if (!box) return;
    box.innerHTML = clean.split('').map((c, i) => `${i === 4 ? '<div class="ch dash">–</div>' : ''}<div class="ch">${esc(c)}</div>`).join('');
  }

  async function fetchQr(sessionId) {
    try {
      const out = await api('GET', `/api/sessions/${sessionId}/qr`);
      const slot = $('#qrSlot');
      if (!slot) return;
      if (out.qr) slot.outerHTML = `<img id="qrSlot" src="${out.qr}" alt="WhatsApp QR" />`;
    } catch { /* ignore */ }
  }

  function beginPolling(sessionId) {
    if (state.poll) clearInterval(state.poll);
    let ticks = 0;
    state.poll = setInterval(async () => {
      ticks += 1;
      if (ticks > 150) { clearInterval(state.poll); state.poll = null; return; }
      try {
        const list = await api('GET', '/api/sessions');
        state.sessions = list.sessions || [];
        const cur = state.sessions.find((x) => x.id === sessionId);
        if (!cur) return;
        renderSessions();
        if (cur.pairingCode) updatePairCode(cur.pairingCode);
        if (state.pairMode === 'qr') fetchQr(sessionId);
        const st = $('#pairStatus');
        if (st) {
          if (cur.status === 'connected') {
            st.innerHTML = '<span style="color:#7ef0b0">✓ Connected! This window will close.</span>';
            clearInterval(state.poll); state.poll = null;
            setTimeout(closeModal, 1400);
          } else if (cur.status === 'logged_out') {
            st.innerHTML = '<span style="color:#ffb3b5">Logged out. Restart pairing to try again.</span>';
          } else if (cur.status === 'pairing' || cur.status === 'connecting') {
            st.innerHTML = '<span class="spinner"></span> Waiting for the phone to confirm…';
          }
        }
      } catch { /* keep polling */ }
    }, 2500);
  }

  async function doDisconnect(sess) {
    try {
      await api('POST', `/api/sessions/${sess.id}/disconnect`);
      toast('Disconnected.');
      await loadSessions();
    } catch (err) { toast(err.message, 'err'); }
  }

  async function doDelete(sess) {
    if (!confirm(`Delete ${sess.label || fmtPhone(sess.number)}? This unlinks the device and wipes its credentials.`)) return;
    try {
      await api('DELETE', `/api/sessions/${sess.id}`);
      toast('Session deleted.');
      await loadSessions();
    } catch (err) { toast(err.message, 'err'); }
  }

  // ------------------------------------------------------------------ socket
  function connectSocket() {
    if (state.socket || !store.token || typeof io !== 'function') return;
    const socket = io({ auth: { token: store.token }, transports: ['websocket', 'polling'] });
    state.socket = socket;

    socket.on('connect_error', (err) => {
      if (String(err.message).includes('unauthorized')) logout(true);
    });

    socket.on('session', (s) => {
      if (!s) return;
      const i = state.sessions.findIndex((x) => x.id === s.id);
      if (s.deleted) state.sessions = state.sessions.filter((x) => x.id !== s.id);
      else if (i >= 0) state.sessions[i] = { ...state.sessions[i], ...s };
      else state.sessions.unshift(s);
      if (location.hash.startsWith('#/app')) renderSessions();
    });

    socket.on('pair-code', ({ sessionId, code }) => {
      if (state.activeSession && state.activeSession.id === sessionId) updatePairCode(code);
      toast('Pairing code ready: ' + code);
    });

    socket.on('connected', ({ sessionId }) => {
      toast('Device connected ✓');
      loadSessions();
      if (state.activeSession && state.activeSession.id === sessionId) {
        const st = $('#pairStatus');
        if (st) st.innerHTML = '<span style="color:#7ef0b0">✓ Connected!</span>';
      }
    });

    socket.on('logged-out', () => { toast('Device logged out from phone.', 'err'); loadSessions(); });
    socket.on('disconnected', () => { loadSessions(); });
  }

  // ------------------------------------------------------------------ offline banner
  // When the static build is hosted without the API (e.g. a preview deploy),
  // say so plainly instead of letting buttons fail silently.
  async function checkBackend() {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('down');
      const json = await res.json();
      if (!json.ok) throw new Error('down');
    } catch {
      const bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:200;background:#2a1a06;border-top:1px solid rgba(245,165,36,.45);color:#ffd08a;font-size:13px;padding:10px 16px;text-align:center;font-family:inherit';
      bar.innerHTML = '⚠️ <b>Preview mode</b> — backend not connected on this host. Run <code>npm start</code> locally or deploy the server to pair a real number.';
      document.body.appendChild(bar);
    }
  }

  // ------------------------------------------------------------------ boot
  $('#year').textContent = new Date().getFullYear();
  checkBackend();
  if (store.token && (!location.hash || location.hash === '#/' || location.hash === '')) {
    location.hash = '#/app';
  }
  render();
})();
