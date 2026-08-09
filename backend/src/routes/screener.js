const router = require('express').Router();
const pool = require('../db/pool');
const { computeAndStoreIndicators } = require('../services/marketData');

// POST /api/screener/run
router.post('/run', async (req, res) => {
  try {
    const { market_type, rsi_min, rsi_max, pe_min, pe_max, volume_ratio_min, sma_signal } = req.body;

    // Get matching assets
    let assetQuery = 'SELECT * FROM assets';
    const assetParams = [];
    if (market_type) { assetQuery += ' WHERE market_type = ?'; assetParams.push(market_type); }
    const [assets] = await pool.query(assetQuery, assetParams);

    const results = [];
    for (const asset of assets) {
      // Ensure indicators are fresh
      const ind = await computeAndStoreIndicators(asset.symbol);
      if (!ind) continue;

      // Apply filters
      if (rsi_min !== undefined && ind.rsi_14 < rsi_min) continue;
      if (rsi_max !== undefined && ind.rsi_14 > rsi_max) continue;
      if (pe_min !== undefined && ind.pe_ratio < pe_min) continue;
      if (pe_max !== undefined && ind.pe_ratio > pe_max) continue;
      if (volume_ratio_min !== undefined && ind.volume_ratio < volume_ratio_min) continue;
      if (sma_signal === 'golden_cross' && ind.sma_20 <= ind.sma_50) continue;
      if (sma_signal === 'death_cross' && ind.sma_20 >= ind.sma_50) continue;

      results.push({ ...asset, ...ind });
    }

    res.json({ count: results.length, results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/screener/presets — user saved presets (auth optional)
router.get('/presets', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json([]);
    const jwt = require('jsonwebtoken');
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'marketlens_secret');
    const [rows] = await pool.query('SELECT * FROM filter_presets WHERE user_id = ?', [id]);
    res.json(rows);
  } catch { res.json([]); }
});

// POST /api/screener/presets
router.post('/presets', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, filters } = req.body;
    await pool.query(
      'INSERT INTO filter_presets (user_id, name, filters) VALUES (?, ?, ?)',
      [req.user.id, name, JSON.stringify(filters)]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
