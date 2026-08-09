require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/market',    require('./routes/market'));
app.use('/api/screener',  require('./routes/screener'));
app.use('/api/risk',      require('./routes/risk'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/watchlist', require('./routes/watchlist'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
