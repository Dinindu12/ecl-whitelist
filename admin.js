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

function showLogin() {
  loginPanel.style.display = 'block';
  dashboardPanel.style.display = 'none';
  logoutBtn.style.display = 'none';
}
function showDashboard() {
  loginPanel.style.display = 'none';
  dashboardPanel.style.display = 'block';
  logoutBtn.style.display = 'block';
  loadApplications();
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('email').value,
      document.getElementById('password').value
    );
  } catch (err) {
    msg.textContent = 'Login failed: ' + err.message;
    msg.className = 'msg err';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function loadApplications() {
  const container = document.getElementById('applications');
  container.innerHTML = 'Loading...';
  try {
    const snap = await getDocs(collection(db, 'whitelist_applications'));
    let rows = [];
    snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
    if (currentFilter !== 'all') rows = rows.filter(r => r.status === currentFilter);
    rows.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

    if (!rows.length) {
      container.innerHTML = '<p class="msg">No applications found.</p>';
      return;
    }

    container.innerHTML = rows.map(r => `
      <div class="app">
        <h3>${esc(r.player_name)}</h3>
        <p>Serial: ${esc(r.serial)}</p>
        <p>IC: ${esc(r.ic_name)}</p>
        <p>Discord: ${esc(r.discord || '-')}</p>
        <p>Reason: ${esc(r.reason || '-')}</p>
        <p>Status: <span class="status ${r.status}">${r.status}</span></p>
        <div class="actions">
          ${r.status !== 'approved' ? `<button class="approve" data-id="${r.id}" data-action="approve">Approve</button>` : ''}
          ${r.status !== 'rejected' ? `<button class="reject" data-id="${r.id}" data-action="reject">Reject</button>` : ''}
          <button class="delete" data-id="${r.id}" data-action="delete">Delete</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => doAction(btn.dataset.id, btn.dataset.action));
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="msg err">Error: ' + err.message + '</p>';
  }
}

async function doAction(id, action) {
  if (action === 'delete' && !confirm('Delete this application?')) return;
  try {
    if (action === 'approve') await updateDoc(doc(db, 'whitelist_applications', id), { status: 'approved' });
    if (action === 'reject')  await updateDoc(doc(db, 'whitelist_applications', id), { status: 'rejected' });
    if (action === 'delete')  await deleteDoc(doc(db, 'whitelist_applications', id));
    loadApplications();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

document.querySelectorAll('.filters a').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.filters a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    currentFilter = a.dataset.filter;
    loadApplications();
  });
});

onAuthStateChanged(auth, user => {
  if (user) showDashboard();
  else showLogin();
});