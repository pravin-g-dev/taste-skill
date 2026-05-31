/* Taste Review Dashboard */

const state = {
  pending: [],
  profile: {},
  rejected: '',
  view: 'pending', // pending | accepted | rejected
};

// ── API ──────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadPending()  { state.pending = await api('GET', '/api/pending'); }
async function loadProfile()  {
  const data = await api('GET', '/api/profile');
  state.profile = data.sections || {};
}
async function loadRejected() {
  const data = await api('GET', '/api/rejected');
  state.rejected = data.raw || '';
}

async function accept(id) {
  await api('POST', `/api/accept/${id}`);
  toast('Rule added to your taste profile ✓', 'success');
  await Promise.all([loadPending(), loadProfile()]);
  render();
  updateStats();
}

async function discard(id) {
  await api('POST', `/api/discard/${id}`);
  toast('Suggestion discarded', 'error');
  await Promise.all([loadPending(), loadRejected()]);
  render();
  updateStats();
}

async function skip(id) {
  state.pending = state.pending.filter(s => s.id !== id);
  render();
  toast('Skipped for this session', 'info');
}

// ── Render ───────────────────────────────────────────────────

function render() {
  renderFeed();
  renderProfile();
}

function renderFeed() {
  const feed = document.getElementById('feed');
  const { view, pending, profile, rejected } = state;

  if (view === 'pending') {
    if (!pending.length) {
      feed.innerHTML = `
        <div class="empty-state">
          <div class="icon">✦</div>
          <p>No pending suggestions.<br>Claude will send rules here as it works with you.</p>
        </div>`;
      return;
    }
    feed.innerHTML = pending.map(s => cardHTML(s)).join('');
  } else if (view === 'accepted') {
    const sections = Object.entries(profile);
    if (!sections.length) {
      feed.innerHTML = `<div class="empty-state"><div class="icon">✓</div><p>No accepted rules yet.</p></div>`;
      return;
    }
    feed.innerHTML = sections.map(([sec, rules]) => `
      <div class="section-group">
        <div class="section-name">${sec}</div>
        ${rules.map(r => `<div class="rule-item">• ${r}</div>`).join('')}
      </div>`).join('');
  } else if (view === 'rejected') {
    if (!rejected.trim()) {
      feed.innerHTML = `<div class="empty-state"><div class="icon">✗</div><p>No rejected rules.</p></div>`;
      return;
    }
    feed.innerHTML = `<div class="rejected-list">${rejected.replace(/\n/g, '<br>')}</div>`;
  }
}

function cardHTML(s) {
  const triggerLabel = {
    'passive': 'passive',
    'explicit-correction': 'correction',
    'training-session': 'training',
  }[s.trigger] || s.trigger;

  return `
    <div class="card" id="card-${s.id}">
      <div class="card-meta">
        <span class="section-badge">${s.section}${s.subsection ? ' / ' + s.subsection : ''}</span>
        <span class="trigger-badge">${triggerLabel}</span>
      </div>
      <div class="card-rule">${escHtml(s.rule)}</div>
      ${s.example ? `<div class="card-example">${escHtml(s.example)}</div>` : ''}
      ${s.source  ? `<div class="card-source">"${escHtml(s.source)}"</div>` : ''}
      <div class="card-actions">
        <button class="btn btn-accept" onclick="handleAccept('${s.id}')">✓ Accept</button>
        <button class="btn btn-discard" onclick="handleDiscard('${s.id}')">✗ Discard</button>
        <button class="btn btn-skip" onclick="handleSkip('${s.id}')">Skip</button>
      </div>
    </div>`;
}

function renderProfile() {
  const panel = document.getElementById('profile-content');
  const { profile } = state;
  const sections = Object.entries(profile);
  if (!sections.length) {
    panel.innerHTML = `
      <div class="no-profile">
        No profile yet. Accept suggestions to build your taste profile,
        or run <code>npx taste-skill init</code> to auto-generate one from your codebase.
      </div>`;
    return;
  }
  panel.innerHTML = sections.map(([sec, rules]) => `
    <div class="section-group">
      <div class="section-name">${sec}</div>
      ${rules.map(r => `<div class="rule-item">• ${r}</div>`).join('')}
    </div>`).join('');
}

function updateStats() {
  document.getElementById('stat-pending').textContent  = state.pending.length;
  const accepted = Object.values(state.profile).flat().length;
  document.getElementById('stat-accepted').textContent = accepted;
}

// ── Actions with animation ───────────────────────────────────

async function handleAccept(id) {
  fadeCard(id, () => accept(id));
}
async function handleDiscard(id) {
  fadeCard(id, () => discard(id));
}
async function handleSkip(id) {
  fadeCard(id, () => skip(id));
}

function fadeCard(id, fn) {
  const el = document.getElementById(`card-${id}`);
  if (el) {
    el.classList.add('fading');
    setTimeout(fn, 200);
  } else {
    fn();
  }
}

// ── Tabs ─────────────────────────────────────────────────────

function setView(v) {
  state.view = v;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === v));
  renderFeed();
}

// ── SSE ──────────────────────────────────────────────────────

function connectSSE() {
  const es = new EventSource('/api/events');
  es.addEventListener('suggestion', e => {
    const s = JSON.parse(e.data);
    state.pending.push(s);
    updateStats();
    if (state.view === 'pending') renderFeed();
    toast('New taste suggestion from Claude', 'info');
  });
  es.addEventListener('accepted',  () => refresh());
  es.addEventListener('discarded', () => refresh());
  es.addEventListener('removed',   () => refresh());
  es.onerror = () => setTimeout(connectSSE, 3000);
}

async function refresh() {
  await Promise.all([loadPending(), loadProfile(), loadRejected()]);
  render();
  updateStats();
}

// ── Utils ─────────────────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Boot ─────────────────────────────────────────────────────

(async function init() {
  await Promise.all([loadPending(), loadProfile(), loadRejected()]);
  render();
  updateStats();
  connectSSE();

  // Tab listeners
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => setView(t.dataset.view));
  });
})();
