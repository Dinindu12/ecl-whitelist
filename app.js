import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---- Apply Form ----
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

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const ref = doc(db, 'whitelist_applications', serial);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      formMsg.textContent = 'This serial has already applied.';
      formMsg.className = 'msg err';
      return;
    }

    await setDoc(ref, {
      player_name: document.getElementById('player_name').value.trim(),
      serial: serial,
      ic_name: document.getElementById('ic_name').value.trim(),
      discord: document.getElementById('discord').value.trim(),
      reason: document.getElementById('reason').value.trim(),
      status: 'pending',
      created_at: serverTimestamp()
    });

    formMsg.textContent = 'Application submitted successfully.';
    formMsg.className = 'msg ok';
    applyForm.reset();
  } catch (err) {
    console.error(err);
    formMsg.textContent = 'Error: ' + err.message;
    formMsg.className = 'msg err';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
});

// ---- Status Check ----
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
    const ref = doc(db, 'whitelist_applications', serial);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const s = snap.data().status;
      statusMsg.textContent = 'Status: ' + s;
      statusMsg.className = s === 'approved' ? 'msg ok' : 'msg';
    } else {
      statusMsg.textContent = 'No application found.';
      statusMsg.className = 'msg err';
    }
  } catch (err) {
    console.error(err);
    statusMsg.textContent = 'Error: ' + err.message;
    statusMsg.className = 'msg err';
  }
});