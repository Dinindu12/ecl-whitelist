const { getPool } = require('./_db');
const { setCors, handlePreflight } = require('./_cors');
const { checkAuth } = require('./_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!checkAuth(req)) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id, action } = req.body || {};
  const numId = parseInt(id);
  if (!numId || !['approve', 'reject', 'delete'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid request.' });
  }

  try {
    const pool = getPool();
    if (action === 'approve') {
      await pool.query("UPDATE whitelist_applications SET status='approved' WHERE id=?", [numId]);
    } else if (action === 'reject') {
      await pool.query("UPDATE whitelist_applications SET status='rejected' WHERE id=?", [numId]);
    } else if (action === 'delete') {
      await pool.query("DELETE FROM whitelist_applications WHERE id=?", [numId]);
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};