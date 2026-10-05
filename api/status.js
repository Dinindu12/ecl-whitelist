const { getPool } = require('./_db');
const { setCors, handlePreflight } = require('./_cors');

module.exports = async (req, res) => {
  setCors(res);
  if (handlePreflight(req, res)) return;

  const serial = String(req.query.serial || '').trim().toUpperCase();
  if (!serial) return res.status(400).json({ success: false, message: 'Serial required.' });

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT status FROM whitelist_applications WHERE serial = ?', [serial]
    );
    if (rows.length) res.json({ success: true, status: rows[0].status });
    else res.json({ success: false, message: 'No application found.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};