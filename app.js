import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- Serial input live feedback ----
const serialInput = document.getElementById('serial');
const serialCount = document.getElementById('serialCount');
const serialStatus = document.getElementById('serialStatus');

serialInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^A-F0-9]/g, '');
  const len = e.target.value.length;
  serialCount.textContent = `${len} / 32`;

  serialStatus.textContent = '';
  serialStatus.className = '';
  e.target.classList.remove('valid', 'invalid');

  if (len === 0) return;
  if (len === 32 && /^[A-F0-9]{32}$/.test(e.target.value)) {
    serialStatus.textContent = '✓ Valid';
    serialStatus.className = 'ok';
    e.target.classList.add('valid');
  } else if (len === 32) {
    serialStatus.textContent = '✗ Invalid characters';
    serialStatus.className = 'err';
    e.target.classList.add('invalid');
  }
});

// ---- Reason char counter ----
const reasonInput = document.getElementById('reason');
const reasonCount = document.getElementById('reasonCount');
reasonInput.addEventListener('input', (e) => {
  reasonCount.textContent = `${e.target.value.length} / 500`;
});

// ---- Apply Form ----
const applyForm = document.getElementById('applyForm');
const formMsg = document.getElementById('formMsg');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');

function setMsg(el, text, type = '') {
  el.textContent = text;
  el.className = 'msg' + (type ? ' ' + type : '');
}

applyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg(formMsg, '');

  const serial = serialInput.value.trim().toUpperCase();
  if (!/^[A-F0-9]{32}$/.test(serial)) {
    setMsg(formMsg, '✗ Serial must be 32 hex characters.', 'err');
    serialInput.focus();
    return;
  }

  submitBtn.disabled = true;
  btnText.textContent = 'Submitting...';

  try {
    const ref = doc(db, 'whitelist_applications', serial);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      setMsg(formMsg, '✗ This serial has already applied.', 'err');
      return;
    }

    await setDoc(ref, {
      player_name: document.getElementById('player_name').value.trim(),
      serial: serial,
      ic_name: document.getElementById('ic_name').value.trim(),
      discord: document.getElementById('discord').value.trim(),
      reason: reasonInput.value.trim(),
      status: 'pending',
      created_at: serverTimestamp()
    });

    setMsg(formMsg, '✓ Application submitted! We will review it shortly.', 'ok');
    applyForm.reset();
    serialCount.textContent = '0 / 32';
    reasonCount.textContent = '0 / 500';
    serialStatus.textContent = '';
    serialInput.classList.remove('valid', 'invalid');
  } catch (err) {
    console.error(err);
    setMsg(formMsg, '✗ Error: ' + err.message, 'err');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Submit Application';
  }
});

// ---- Status Check ----
document.getElementById('checkBtn').addEventListener('click', async () => {
  const statusMsg = document.getElementById('statusMsg');
  const serial = document.getElementById('checkSerial').value.trim().toUpperCase();
  setMsg(statusMsg, '');

  if (!/^[A-F0-9]{32}$/.test(serial)) {
    setMsg(statusMsg, '✗ Invalid serial format.', 'err');
    return;
  }

  try {
    const ref = doc(db, 'whitelist_applications', serial);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const s = snap.data().status;
      const icons = { approved: '✓', pending: '⏳', rejected: '✗' };
      const label = s.charAt(0).toUpperCase() + s.slice(1);
      setMsg(statusMsg, `${icons[s] || ''} Status: ${label}`, s === 'approved' ? 'ok' : s === 'rejected' ? 'err' : 'info');
    } else {
      setMsg(statusMsg, '✗ No application found for this serial.', 'err');
    }
  } catch (err) {
    console.error(err);
    setMsg(statusMsg, '✗ Error: ' + err.message, 'err');
  }
});