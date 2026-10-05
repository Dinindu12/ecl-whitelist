import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginPanel = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const logoutBtn = document.getElementById('logoutBtn');

let currentFilter = 'all';
let allRows = [];

function showLogin() {
  loginPanel.style.display = 'block';
  dashboardPanel.style.display = 'none';
  logoutBtn.style.display = 'none';
}
function showDashboard() {
  loginPanel.style.display = 'none';
  dashboardPanel.style.display = 'block';
  logoutBtn.style.display = 'inline-flex';
  loadApplications();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  const btn = e.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');

  msg.textContent = '';
  msg.className = 'msg';
  btn.disabled = true;
  btnText.textContent = 'Logging in...';

  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('email').value,
      document.getElementById('password').value
    );
  } catch (err) {
    msg.textContent = '✗ Login failed: ' + err.message.replace('Firebase: ', '');
    msg.className = 'msg err';
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Login';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function timeAgo(ts) {
  if (!ts) return '—';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function statusIcon(s) {
  return { approved: '✓', pending: '⏳', rejected: '✗' }[s] || '•';
}

async function loadApplications() {
  const container = document.getElementById('applications');
  container.innerHTML = '<div class="apps-loading">Loading applications...</div>';

  try {
    const snap = await getDocs(collection(db, 'whitelist_applications'));
    allRows = [];
    snap.forEach(d => allRows.push({ id: d.id, ...d.data() }));

    document.getElementById('statTotal').textContent = allRows.length;
    document.getElementById('statPending').textContent = allRows.filter(r => r.status === 'pending').length;
    document.getElementById('statApproved').textContent = allRows.filter(r => r.status === 'approved').length;
    document.getElementById('statRejected').textContent = allRows.filter(r => r.status === 'rejected').length;

    renderRows();
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="apps-empty">✗ Error: ' + esc(err.message) + '</div>';
  }
}

function renderRows() {
  const container = document.getElementById('applications');
  let rows = allRows;
  if (currentFilter !== 'all') rows = rows.filter(r => r.status === currentFilter);
  rows.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

  if (!rows.length) {
    container.innerHTML = '<div class="apps-empty">No ' + (currentFilter !== 'all' ? currentFilter : '') + ' applications found.</div>';
    return;
  }

  container.innerHTML = rows.map(r => `
    <div class="app-card">
      <div class="app-card-top">
        <div class="app-avatar">${esc((r.player_name || '?').charAt(0).toUpperCase())}</div>
        <div class="app-info">
          <h3 class="app-name">${esc(r.player_name)}</h3>
          <div class="app-status-badge status-${r.status}">
            <span>${statusIcon(r.status)}</span>
            <span>${r.status}</span>
          </div>
        </div>
        <div class="app-time">${timeAgo(r.created_at)}</div>
      </div>

      <div class="app-details">
        <div class="app-detail">
          <span class="app-detail-label">Serial</span>
          <span class="app-detail-value mono">${esc(r.serial)}</span>
        </div>
        <div class="app-detail">
          <span class="app-detail-label">IC Name</span>
          <span class="app-detail-value">${esc(r.ic_name)}</span>
        </div>
        <div class="app-detail">
          <span class="app-detail-label">Discord</span>
          <span class="app-detail-value">${esc(r.discord || '—')}</span>
        </div>
        ${r.reason ? `
        <div class="app-detail full">
          <span class="app-detail-label">Reason</span>
          <span class="app-detail-value">${esc(r.reason)}</span>
        </div>` : ''}
      </div>

      <div class="app-actions">
        ${r.status !== 'approved' ? `<button class="btn-action approve" data-id="${r.id}" data-action="approve">✓ Approve</button>` : ''}
        ${r.status !== 'rejected' ? `<button class="btn-action reject" data-id="${r.id}" data-action="reject">✗ Reject</button>` : ''}
        <button class="btn-action delete" data-id="${r.id}" data-action="delete">🗑 Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => doAction(btn.dataset.id, btn.dataset.action, btn));
  });
}

async function doAction(id, action, btn) {
  if (action === 'delete' && !confirm('Delete this application permanently?')) return;

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '...';

  try {
    if (action === 'approve') await updateDoc(doc(db, 'whitelist_applications', id), { status: 'approved' });
    if (action === 'reject')  await updateDoc(doc(db, 'whitelist_applications', id), { status: 'rejected' });
    if (action === 'delete')  await deleteDoc(doc(db, 'whitelist_applications', id));
    await loadApplications();
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filters a').forEach(a => {
    a.classList.toggle('active', a.dataset.filter === f);
  });
  renderRows();
}

document.querySelectorAll('.filters a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    setFilter(a.dataset.filter);
  });
});

document.querySelectorAll('.admin-stat').forEach(s => {
  s.addEventListener('click', () => setFilter(s.dataset.filter));
});

onAuthStateChanged(auth, user => {
  if (user) showDashboard();
  else showLogin();
});