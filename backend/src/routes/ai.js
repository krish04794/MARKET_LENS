const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { nlToFilters, generateInsight } = require('../services/aiService');
const { computeAndStoreIndicators, computeRisk } = require('../services/marketData');
const pool = require('../db/pool');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

router.use(aiLimiter);

// POST /api/ai/query — NL to filters
router.post('/query', async (req, res) => {

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });
    const filters = await nlToFilters(query);
    await pool.query(
      'INSERT INTO nl_query_log (raw_query, parsed_json) VALUES (?, ?)',
      [query, JSON.stringify(filters)]
    );
    res.json({ query, filters });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ai/insight/:symbol
router.get('/insight/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const [[asset]] = await pool.query('SELECT * FROM assets WHERE symbol = ?', [symbol]);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    const [indicators, risk] = await Promise.all([
      computeAndStoreIndicators(symbol),
      computeRisk(symbol),
    ]);
    const insight = await generateInsight(asset, indicators, risk);
    res.json({ symbol, insight });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
