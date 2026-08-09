const router = require('express').Router();
const { computeRisk } = require('../services/marketData');
const pool = require('../db/pool');

// GET /api/risk/:symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    // Check recent score first
    const [cached] = await pool.query(
      `SELECT r.* FROM risk_scores r
       JOIN assets a ON a.id = r.asset_id
       WHERE a.symbol = ? ORDER BY r.computed_at DESC LIMIT 1`,
      [symbol]
    );
    if (cached.length && new Date() - new Date(cached[0].computed_at) < 3600000) {
      return res.json(cached[0]);
    }
    const result = await computeRisk(symbol);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
