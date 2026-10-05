const { getPool } = require('./_db');
const { setCors, handlePreflight } = require('./_cors');
const { checkAuth } = require('./_auth');

module.exports = async (req, res) => {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!checkAuth(req)) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const filter = req.query.filter || 'all';
  let where = '';
  if (filter === 'pending')  where = "WHERE status='pending'";
  if (filter === 'approved') where = "WHERE status='approved'";
  if (filter === 'rejected') where = "WHERE status='rejected'";

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM whitelist_applications ${where} ORDER BY created_at DESC`
    );
    res.json({ success: true, applications: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};