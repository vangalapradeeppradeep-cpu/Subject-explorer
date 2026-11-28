/* Student login + Notes Hub + progress for Class 10 Smart Explorer.
 * AUTH: everything goes through `auth` below (localStorage today). To use Firebase later,
 * replace the methods with createUserWithEmailAndPassword / signInWithEmailAndPassword / signOut
 * and keep the same return shapes. localStorage is fine for a school demo, not for real security. */
(() => {
  'use strict';
  const K_USERS = 'sel.users.v1', K_SESSION = 'sel.session.v1', K_PROGRESS = 'sel.progress.v1';
  const rd = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function hashPw(pw, salt) {
    try {
      if (crypto && crypto.subtle) {
        const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw));
        return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
      }
    } catch { /* fall through */ }
    let h = 5381; for (const c of salt + pw) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }
  const normClass = (s) => {
    const raw = s.trim(), m = raw.replace(/^class\s*/i, '').match(/^(\d{1,2})\s*[-\s]?\s*([A-Za-z])?$/);
    return m ? `Class ${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}` : raw;
  };
  const pub = (u) => ({ id: u.id, name: u.name, classLabel: u.classLabel, email: u.email });

  const auth = {
    getSession: () => rd(K_SESSION, null),
    async signUp({ name, classSection, email, password }) {
      const n = name.trim(), e = email.trim().toLowerCase();
      if (n.length < 2) return { ok: false, error: 'Please enter your full name.' };
      if (!classSection.trim()) return { ok: false, error: 'Please enter your class / section, e.g. 10-A.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, error: 'Please enter a valid email address.' };
      if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
      const users = rd(K_USERS, []);
      if (users.some((u) => u.email === e)) return { ok: false, error: 'An account with this email already exists. Try logging in.' };
      const salt = Math.random().toString(36).slice(2);
      const u = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: n, classLabel: normClass(classSection), email: e, salt, hash: await hashPw(password, salt) };
      wr(K_USERS, [...users, u]); wr(K_SESSION, pub(u));
      return { ok: true, student: pub(u) };
    },
    async signIn(email, password) {
      const e = email.trim().toLowerCase(), u = rd(K_USERS, []).find((x) => x.email === e);
      if (!u || u.hash !== (await hashPw(password, u.salt))) return { ok: false, error: 'Email or password is incorrect.' };
      wr(K_SESSION, pub(u)); return { ok: true, student: pub(u) };
    },
    continueAsGuest() { const s = { id: 'guest', name: 'Guest', classLabel: 'Demo', email: '', guest: true }; wr(K_SESSION, s); return s; },
    signOut() {
      const s = rd(K_SESSION, null);
      try { localStorage.removeItem(K_SESSION); } catch { /* ignore */ }
      if (s && s.guest) { const all = rd(K_PROGRESS, {}); delete all.guest; wr(K_PROGRESS, all); }
    },
    loadProgress: (uid) => rd(K_PROGRESS, {})[uid] || { bookmarks: [], revised: [] },
    saveProgress: (uid, p) => wr(K_PROGRESS, { ...rd(K_PROGRESS, {}), [uid]: p }),
  };
  window.SmartAuth = auth;

  const NOTES = window.NOTES_DATA || [];
  let user = auth.getSession(), prog = user ? auth.loadProgress(user.id) : { bookmarks: [], revised: [] };
  const $ = (s) => document.querySelector(s);
  const labId = (st) => `lab:${st.subj}:${st.topic}:${st.variant}`;
  const validIds = () => {
    const ids = new Set(NOTES.flatMap((s) => s.topics.map((t) => t.id))), S = window.SEL_SUBJ;
    if (S) for (const k in S) S[k].topics.forEach((t, ti) => t.variants.forEach((_, vi) => ids.add(`lab:${k}:${ti}:${vi}`)));
    return ids;
  };
  const toggle = (key, id) => {
    const l = prog[key], i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    auth.saveProgress(user.id, prog); refresh();
  };
  const has = (key, id) => prog[key].includes(id);

  // ---------- login gate ----------
  let gate = null;
  function showGate() {
    if (gate) gate.remove();
    let mode = 'login';
    gate = document.createElement('div'); gate.className = 'sel-overlay'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-label', 'Student login');
    document.body.append(gate);
    const draw = (err = '') => {
      gate.innerHTML = `<div class="sel-card"><div class="k">CBSE Class 10</div><h1>Smart Explorer</h1><p class="s">3D labs and quick revision notes for every subject.</p>
      <div class="sel-tabs"><button class="sel-pill" data-m="login" aria-pressed="${mode === 'login'}">Student Login</button><button class="sel-pill" data-m="signup" aria-pressed="${mode === 'signup'}">Create Account</button></div>
      <form novalidate>${mode === 'signup' ? '<label>Student Name<input name="name" autocomplete="name" placeholder="e.g. Sai Varshith"></label><label>Class / Section<input name="cls" placeholder="e.g. 10-A"></label>' : ''}
      <label>Email<input name="email" type="email" autocomplete="email" placeholder="you@school.com"></label>
      <label>Password<input name="pw" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" placeholder="At least 6 characters"></label>
      ${err ? `<div class="sel-err" role="alert">${esc(err)}</div>` : ''}
      <button class="sel-go" type="submit">${mode === 'login' ? 'Log In' : 'Create Account'}</button></form>
      <div class="sel-or">or</div><button class="sel-go alt" id="guestBtn" type="button">Continue as Guest / Demo</button>
      <p class="sel-or">Accounts are stored only in this browser.</p></div>`;
      gate.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.m; draw(); }));
      gate.querySelector('#guestBtn').addEventListener('click', () => start(auth.continueAsGuest()));
      gate.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault(); const f = e.target, btn = f.querySelector('.sel-go'); btn.disabled = true;
        const r = mode === 'login' ? await auth.signIn(f.email.value, f.pw.value)
          : await auth.signUp({ name: f.name.value, classSection: f.cls.value, email: f.email.value, password: f.pw.value });
        if (r.ok) start(r.student); else draw(r.error);
      });
    };
    draw();
  }
  function start(s) {
    user = s; prog = auth.loadProgress(s.id);
    if (gate) { gate.remove(); gate = null; }
    buildUserbar(); refresh();
    window.dispatchEvent(new Event('resize')); // let the 3D layout re-measure the taller header
  }
  function logout() { auth.signOut(); user = null; closeHub(); const ub = $('.userbar'); if (ub) ub.remove(); showGate(); }

  // ---------- user bar ----------
  function buildUserbar() {
    const old = $('.userbar'); if (old) old.remove();
    const ub = document.createElement('div'); ub.className = 'userbar';
    ub.innerHTML = `<span class="badge">Welcome, ${esc(user.name)} (${esc(user.classLabel)})</span><span class="prog" id="prog"></span>
      <button class="btn" id="hubBtn" type="button">Notes Hub</button><button class="btn" id="logoutBtn" type="button">Logout</button>`;
    $('header.top').insertBefore(ub, $('header.top .tools'));
    $('#hubBtn').addEventListener('click', openHub); $('#logoutBtn').addEventListener('click', logout);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  }

  // ---------- per-scene bookmark / revised buttons in the info panel ----------
  function renderActions(st) {
    if (!user || !st) return;
    let box = $('#selActions');
    if (!box) { box = document.createElement('div'); box.id = 'selActions'; const nb = $('#notesBtn'); nb.parentNode.insertBefore(box, nb); }
    const id = labId(st), b = has('bookmarks', id), r = has('revised', id);
    box.innerHTML = `<button class="sel-pill" data-a="bookmarks" aria-pressed="${b}">${b ? '★ Bookmarked' : '☆ Bookmark'}</button><button class="sel-pill" data-a="revised" aria-pressed="${r}">${r ? 'Revised ✓' : 'Mark Topic Revised'}</button>`;
    box.querySelectorAll('button').forEach((x) => x.addEventListener('click', () => toggle(x.dataset.a, id)));
  }
  window.SEL_RENDER = (st) => renderActions(st);

  function refresh() {
    const p = $('#prog'); if (p) { const v = validIds(); p.textContent = `Revised ${prog.revised.filter((x) => v.has(x)).length}/${v.size}`; }
    if (window.SEL_STATE) renderActions(window.SEL_STATE);
    if (hub) drawHub();
  }

  // ---------- Notes Hub ----------
  let hub = null, sid = NOTES[0] && NOTES[0].id, onlyMarked = false;
  const I = '#141413', O = '#CC5500';
  const ruleSvg = (k) => {
    const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`;
    const t = (x, y, s, c = I) => `<text x="${x}" y="${y}" font-size="13" font-weight="700" fill="${c}" font-family="sans-serif">${s}</text>`;
    let body;
    if (k === 'thumb') {
      body = `<line x1="110" y1="165" x2="110" y2="25" stroke="${O}" stroke-width="4" marker-end="url(#ao)"/>${t(118, 22, 'I (thumb)', O)}` +
        [120, 85, 50].map((y, i) => `<path d="M ${60 - i * 8} ${y} A ${50 + i * 8} 14 0 0 0 ${160 + i * 8} ${y}" fill="none" stroke="${I}" stroke-width="2" marker-end="url(#ai)"/>`).join('') + t(10, 172, 'Field (fingers)');
    } else {
      const L = k === 'fleming-l';
      body = `<line x1="40" y1="130" x2="180" y2="130" stroke="${I}" stroke-width="3" marker-end="url(#ai)"/>${t(100, 150, 'Field (forefinger)')}` +
        `<line x1="40" y1="130" x2="40" y2="28" stroke="${I}" stroke-width="3" marker-end="url(#ai)"/>${t(48, 40, L ? 'Current (middle)' : 'Induced I (middle)')}` +
        `<line x1="40" y1="130" x2="100" y2="80" stroke="${O}" stroke-width="4" marker-end="url(#ao)"/>${t(104, 78, L ? 'Force (thumb)' : 'Motion (thumb)', O)}`;
    }
    return `<svg viewBox="0 0 220 180" role="img" aria-label="Rule diagram"><defs>${mk('ai', I)}${mk('ao', O)}</defs>${body}</svg>`;
  };
  const block = (b) => {
    const h = b.h ? `<h4>${esc(b.h)}</h4>` : '';
    if (b.t === 'list') return `<div class="blk">${h}<ul>${b.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    if (b.t === 'flow') return `<div class="blk">${h}<ol class="flow">${b.steps.map((s, i) => `<li><div class="st"><span class="n">${i + 1}</span><span>${esc(s)}</span></div>${i < b.steps.length - 1 ? '<div class="ar">↓</div>' : ''}</li>`).join('')}</ol></div>`;
    if (b.t === 'table') return `<div class="blk">${h}<div class="tw"><table><thead><tr>${b.head.map((x) => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    if (b.t === 'cards') return `<div class="blk">${h}<div class="cg">${b.items.map((c) => `<div class="cd"><b>${esc(c.h)}</b><p>${esc(c.b)}</p>${c.tag ? `<span>${esc(c.tag)}</span>` : ''}</div>`).join('')}</div></div>`;
    if (b.t === 'time') return `<div class="blk"><div class="tl">${b.items.map((x) => `<div class="cd"><span>${esc(x.y)}</span><p>${esc(x.e)}</p></div>`).join('')}</div></div>`;
    if (b.t === 'rule') return `<div class="blk rule">${ruleSvg(b.kind)}<ul>${b.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>`;
    return '';
  };
  function drawHub() {
    if (!hub) return;
    const sub = NOTES.find((s) => s.id === sid) || NOTES[0];
    const topics = onlyMarked ? sub.topics.filter((t) => has('bookmarks', t.id)) : sub.topics;
    const keepRow = hub.querySelector('.hub-row'), sx = keepRow ? keepRow.scrollLeft : 0, sy = hub.scrollTop;
    hub.innerHTML = `<div class="hub-in"><div class="hub-top"><h2>Study Notes Hub</h2><button class="btn" id="hubClose" type="button">Close</button></div>
      <div class="hub-row">${NOTES.map((s) => `<button class="sel-pill" data-s="${s.id}" aria-pressed="${s.id === sub.id}">${esc(s.label)}</button>`).join('')}</div>
      <div class="hub-row"><button class="sel-pill" id="onlyMarked" aria-pressed="${onlyMarked}">★ Bookmarked only</button></div>
      ${sub.intro ? `<p class="hub-intro">${esc(sub.intro)}</p>` : ''}
      ${topics.length ? '' : `<div class="topic">No bookmarked topics in ${esc(sub.label)} yet.</div>`}
      ${topics.map((t) => `<article class="topic${has('revised', t.id) ? ' done' : ''}"><h3>${esc(t.title)}</h3>${t.blocks.map(block).join('')}
        <div class="acts"><button class="sel-pill" data-a="bookmarks" data-id="${t.id}" aria-pressed="${has('bookmarks', t.id)}">${has('bookmarks', t.id) ? '★ Bookmarked' : '☆ Bookmark'}</button>
        <button class="sel-pill" data-a="revised" data-id="${t.id}" aria-pressed="${has('revised', t.id)}">${has('revised', t.id) ? 'Revised ✓' : 'Mark Topic Revised'}</button></div></article>`).join('')}</div>`;
    hub.querySelector('#hubClose').addEventListener('click', closeHub);
    hub.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => { sid = b.dataset.s; drawHub(); hub.scrollTop = 0; }));
    hub.querySelector('#onlyMarked').addEventListener('click', () => { onlyMarked = !onlyMarked; drawHub(); });
    hub.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.a, b.dataset.id)));
    const row = hub.querySelector('.hub-row'); if (row) row.scrollLeft = sx; hub.scrollTop = sy;
  }
  function openHub() { if (hub) return; hub = document.createElement('div'); hub.className = 'sel-overlay hub'; hub.setAttribute('role', 'dialog'); hub.setAttribute('aria-label', 'Study Notes Hub'); document.body.append(hub); drawHub(); }
  function closeHub() { if (hub) { hub.remove(); hub = null; } }
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeHub(); });

  if (user) { buildUserbar(); refresh(); } else showGate();
})();
