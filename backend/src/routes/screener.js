const router = require('express').Router();
const pool = require('../db/pool');
const { computeAndStoreIndicators } = require('../services/marketData');

function evalCondition(indicators, cond) {
  let { field, operator, value } = cond;
  if (!field || !operator) return false;

  let val = indicators[field];
  if (val === undefined) {
    val = indicators[field.toLowerCase()];
  }

  // Handle nested MACD values if specified as macdLine or signalLine
  if (field === 'macdLine') val = indicators.macd?.macdLine;
  if (field === 'signalLine') val = indicators.macd?.signalLine;
  if (field === 'histogram') val = indicators.macd?.histogram;

  if (val === null || val === undefined) return false;

  // Normalize booleans
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') value = true;
    if (value.toLowerCase() === 'false') value = false;
  }

  // Evaluate operator
  switch (operator) {
    case '<':
      return Number(val) < Number(value);
    case '>':
      return Number(val) > Number(value);
    case '<=':
      return Number(val) <= Number(value);
    case '>=':
      return Number(val) >= Number(value);
    case '==':
    case '=':
      return String(val) === String(value);
    case '!=':
      return String(val) !== String(value);
    default:
      return false;
  }
}

// POST /api/screener/run
router.post('/run', async (req, res) => {
  try {
    const { market_type, exchange, logical_operator = 'AND', conditions = [] } = req.body;

    // Get matching assets based on DB properties
    let assetQuery = 'SELECT * FROM assets';
    const params = [];
    const wheres = [];

    if (market_type) {
      wheres.push('market_type = ?');
      params.push(market_type);
    }
    if (exchange) {
      wheres.push('exchange = ?');
      params.push(exchange);
    }

    // Attempt to extract market_type or exchange from conditions
    conditions.forEach(cond => {
      if (cond.field === 'market_type' && cond.operator === '==') {
        if (!market_type) {
          wheres.push('market_type = ?');
          params.push(cond.value);
        }
      }
      if (cond.field === 'exchange' && cond.operator === '==') {
        if (!exchange) {
          wheres.push('exchange = ?');
          params.push(cond.value);
        }
      }
    });

    if (wheres.length) {
      assetQuery += ' WHERE ' + wheres.join(' AND ');
    }

    const [assets] = await pool.query(assetQuery, params);

    const results = [];
    for (const asset of assets) {
      const ind = await computeAndStoreIndicators(asset.symbol);
      if (!ind) continue;

      // Merge asset data with computed indicators
      const item = { ...asset, ...ind };

      // Apply dynamic conditions
      if (conditions.length > 0) {
        let matches = false;
        if (logical_operator === 'OR') {
          matches = conditions.some(c => evalCondition(item, c));
        } else {
          matches = conditions.every(c => evalCondition(item, c));
        }
        if (!matches) continue;
      }

      results.push(item);
    }

    res.json({ count: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/screener/presets
router.get('/presets', async (req, res) => {
  const defaultPresets = [
    {
      id: 'd1',
      name: '🐂 Golden Cross Alignment',
      filters: {
        logical_operator: 'AND',
        conditions: [
          { field: 'golden_cross', operator: '==', value: true }
        ]
      }
    },
    {
      id: 'd2',
      name: '🔥 Oversold Buy Signal (RSI < 35)',
      filters: {
        logical_operator: 'AND',
        conditions: [
          { field: 'rsi_14', operator: '<', value: 35 }
        ]
      }
    },
    {
      id: 'd3',
      name: '📈 High Growth Stocks',
      filters: {
        logical_operator: 'AND',
        conditions: [
          { field: 'revenue_growth', operator: '>', value: 10 },
          { field: 'profit_growth', operator: '>', value: 10 }
        ]
      }
    }
  ];

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json(defaultPresets);
    const jwt = require('jsonwebtoken');
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'marketlens_secret');
    const [rows] = await pool.query('SELECT * FROM filter_presets WHERE user_id = ?', [id]);
    
    // Parse filters JSON if it is returned as string from database
    const parsedRows = rows.map(r => ({
      ...r,
      filters: typeof r.filters === 'string' ? JSON.parse(r.filters) : r.filters
    }));

    res.json([...defaultPresets, ...parsedRows]);
  } catch {
    res.json(defaultPresets);
  }
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
