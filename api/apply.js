const { getPool } = require('./_db');
const { setCors, handlePreflight } = require('./_cors');

module.exports = async (req, res) => {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { player_name, serial, ic_name, discord, reason } = req.body || {};
  const pname = String(player_name || '').trim();
  const ser   = String(serial || '').trim().toUpperCase();
  const ic    = String(ic_name || '').trim();
  const dc    = String(discord || '').trim();
  const rs    = String(reason || '').trim();

  if (!pname || !ser || !ic) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }
  if (!/^[A-F0-9]{32}$/.test(ser)) {
    return res.status(400).json({ success: false, message: 'Invalid serial format.' });
  }

  try {
    const pool = getPool();
    const [existing] = await pool.query(
      'SELECT id FROM whitelist_applications WHERE serial = ?', [ser]
    );
    if (existing.length) {
      return res.json({ success: false, message: 'This serial has already applied.' });
    }

    await pool.query(
      'INSERT INTO whitelist_applications (player_name, serial, ic_name, discord, reason) VALUES (?, ?, ?, ?, ?)',
      [pname, ser, ic, dc, rs]
    );
    res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};