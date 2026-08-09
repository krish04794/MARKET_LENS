const router = require('express').Router();
const pool = require('../db/pool');
const { getOrFetchOHLCV, computeAndStoreIndicators, getAllAssets } = require('../services/marketData');

// GET /api/market/assets?type=equity
router.get('/assets', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM assets';
    const params = [];
    if (type) { query += ' WHERE market_type = ?'; params.push(type); }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/market/ohlcv/:symbol
router.get('/ohlcv/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const [[asset]] = await pool.query('SELECT * FROM assets WHERE symbol = ?', [symbol]);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const data = await getOrFetchOHLCV(symbol, asset.market_type);
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/market/indicators/:symbol
router.get('/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const ind = await computeAndStoreIndicators(symbol);
    res.json(ind);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/market/quote/:symbol — live price from DB
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const [rows] = await pool.query(
      `SELECT o.close_price, o.fetched_at, a.name, a.market_type
       FROM ohlcv o JOIN assets a ON a.id = o.asset_id
       WHERE a.symbol = ? ORDER BY o.fetched_at DESC LIMIT 2`,
      [symbol]
    );
    if (!rows.length) return res.status(404).json({ error: 'No data' });
    const latest = rows[0];
    const prev = rows[1];
    const change = prev ? ((latest.close_price - prev.close_price) / prev.close_price * 100).toFixed(2) : 0;
    res.json({ symbol, price: latest.close_price, change, name: latest.name, market_type: latest.market_type, as_of: latest.fetched_at });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
