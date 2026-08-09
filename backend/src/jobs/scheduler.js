const cron = require('node-cron');
const pool = require('../db/pool');
const { getOrFetchOHLCV, computeAndStoreIndicators } = require('../services/marketData');

// Poll market data every 5 minutes
const scheduleCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Scheduler] Running market data polling job...');
    try {
      const [assets] = await pool.query('SELECT symbol, market_type FROM assets');
      
      for (const asset of assets) {
        let retries = 3;
        let success = false;
        
        while (retries > 0 && !success) {
          try {
            console.log(`[Scheduler] Fetching data for ${asset.symbol} (${asset.market_type})...`);
            await getOrFetchOHLCV(asset.symbol, asset.market_type);
            await computeAndStoreIndicators(asset.symbol);
            success = true;
          } catch (e) {
            retries--;
            console.warn(`[Scheduler] Failed to fetch data for ${asset.symbol}. Retries left: ${retries}`);
            if (retries === 0) {
              console.error(`[Scheduler] Fetch failed for ${asset.symbol} after 3 retries: ${e.message}`);
            } else {
              // Wait 2 seconds before retrying
              await new Promise(res => setTimeout(res, 2000));
            }
          }
        }
      }
      console.log('[Scheduler] Market data polling job completed successfully.');
    } catch (e) {
      console.error('[Scheduler] Error running polling job:', e.message);
    }
  });
};

module.exports = { scheduleCronJobs };
