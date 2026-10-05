const API = (window.API_BASE || '') + '/api';

const applyForm = document.getElementById('applyForm');
const formMsg = document.getElementById('formMsg');
const submitBtn = document.getElementById('submitBtn');

applyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.textContent = '';
  formMsg.className = 'msg';

  const serial = document.getElementById('serial').value.trim().toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(serial)) {
    formMsg.textContent = 'Serial must be 32 hex characters.';
    formMsg.className = 'msg err';
    return;
  }

  const payload = {
    player_name: document.getElementById('player_name').value.trim(),
    serial,
    ic_name: document.getElementById('ic_name').value.trim(),
    discord: document.getElementById('discord').value.trim(),
    reason: document.getElementById('reason').value.trim()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const res = await fetch(API + '/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      formMsg.textContent = data.message;
      formMsg.className = 'msg ok';
      applyForm.reset();
    } else {
      formMsg.textContent = data.message || 'Something went wrong.';
      formMsg.className = 'msg err';
    }
  } catch (err) {
    formMsg.textContent = 'Network error.';
    formMsg.className = 'msg err';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
});

document.getElementById('checkBtn').addEventListener('click', async () => {
  const statusMsg = document.getElementById('statusMsg');
  const serial = document.getElementById('checkSerial').value.trim().toUpperCase();
  statusMsg.textContent = '';
  statusMsg.className = 'msg';

  if (!/^[A-F0-9]{32}$/.test(serial)) {
    statusMsg.textContent = 'Invalid serial format.';
    statusMsg.className = 'msg err';
    return;
  }

  try {
    const res = await fetch(API + '/status?serial=' + encodeURIComponent(serial));
    const data = await res.json();
    if (data.success) {
      statusMsg.textContent = 'Status: ' + data.status;
      statusMsg.className = data.status === 'approved' ? 'msg ok' : 'msg';
    } else {
      statusMsg.textContent = data.message || 'Not found.';
      statusMsg.className = 'msg err';
    }
  } catch (err) {
    statusMsg.textContent = 'Network error.';
    statusMsg.className = 'msg err';
  }
});