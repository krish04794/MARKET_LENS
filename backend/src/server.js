const app = require('./app');
const { scheduleCronJobs } = require('./jobs/scheduler');

const PORT = process.env.PORT || 5000;

// Start cron jobs
scheduleCronJobs();

app.listen(PORT, () => console.log(`✅ MarketLens backend running on http://localhost:${PORT}`));
