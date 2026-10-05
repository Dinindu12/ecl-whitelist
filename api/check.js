const { getPool } = require('./_db');
const { setCors, handlePreflight } = require('./_cors');

module.exports = async (req, res) => {
  setCors(res);
  if (handlePreflight(req, res)) return;

  const key = String(req.query.key || '');
  const serial = String(req.query.serial || '').trim().toUpperCase();

  if (key !== process.env.API_KEY) return res.json({ approved: false, error: 'invalid_key' });
  if (!serial) return res.json({ approved: false, error: 'missing_serial' });

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT status FROM whitelist_applications WHERE serial = ?', [serial]
    );
    res.json({ approved: rows.length > 0 && rows[0].status === 'approved' });
  } catch (e) {
    console.error(e);
    res.json({ approved: false, error: 'server_error' });
  }
};