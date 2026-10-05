const API = (window.API_BASE || '') + '/api';
let currentFilter = 'all';
let token = localStorage.getItem('admin_token') || '';

const loginPanel = document.getElementById('loginPanel');
const dashboardPanel = document.getElementById('dashboardPanel');
const logoutBtn = document.getElementById('logoutBtn');

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
    const res = await fetch(API + '/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      })
    });
    const data = await res.json();
    if (data.success) {
      token = data.token;
      localStorage.setItem('admin_token', token);
      showDashboard();
    } else {
      msg.textContent = data.message || 'Login failed';
      msg.className = 'msg err';
    }
  } catch (err) {
    msg.textContent = 'Network error';
    msg.className = 'msg err';
  }
});

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function loadApplications() {
  const container = document.getElementById('applications');
  container.innerHTML = 'Loading...';
  try {
    const res = await fetch(API + '/admin-list?filter=' + currentFilter, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
      token = ''; localStorage.removeItem('admin_token'); showLogin(); return;
    }
    const data = await res.json();
    if (!data.success || !data.applications.length) {
      container.innerHTML = '<p class="msg">No applications found.</p>';
      return;
    }
    container.innerHTML = data.applications.map(app => `
      <div class="app">
        <h3>${esc(app.player_name)}</h3>
        <p>Serial: ${esc(app.serial)}</p>
        <p>IC: ${esc(app.ic_name)}</p>
        <p>Discord: ${esc(app.discord || '-')}</p>
        <p>Reason: ${esc(app.reason || '-')}</p>
        <p>Status: <span class="status ${app.status}">${app.status}</span></p>
        <p>Applied: ${app.created_at}</p>
        <div class="actions">
          ${app.status !== 'approved' ? `<button class="approve" onclick="doAction(${app.id}, 'approve')">Approve</button>` : ''}
          ${app.status !== 'rejected' ? `<button class="reject"  onclick="doAction(${app.id}, 'reject')">Reject</button>` : ''}
          <button class="delete" onclick="doAction(${app.id}, 'delete')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="msg err">Network error</p>';
  }
}

async function doAction(id, action) {
  if (action === 'delete' && !confirm('Delete this application?')) return;
  try {
    const res = await fetch(API + '/admin-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ id, action })
    });
    const data = await res.json();
    if (data.success) loadApplications();
    else alert(data.message || 'Failed');
  } catch (e) { alert('Network error'); }
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

logoutBtn.addEventListener('click', () => {
  token = '';
  localStorage.removeItem('admin_token');
  showLogin();
});

if (token) showDashboard();
else showLogin();