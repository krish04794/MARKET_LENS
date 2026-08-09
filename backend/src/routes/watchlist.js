const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.* FROM watchlists w JOIN assets a ON a.id = w.asset_id WHERE w.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/:symbol', async (req, res) => {
  try {
    const [[asset]] = await pool.query('SELECT id FROM assets WHERE symbol = ?', [req.params.symbol]);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await pool.query('INSERT IGNORE INTO watchlists (user_id, asset_id) VALUES (?, ?)', [req.user.id, asset.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:symbol', async (req, res) => {
  try {
    const [[asset]] = await pool.query('SELECT id FROM assets WHERE symbol = ?', [req.params.symbol]);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    await pool.query('DELETE FROM watchlists WHERE user_id = ? AND asset_id = ?', [req.user.id, asset.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
