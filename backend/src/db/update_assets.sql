USE marketlens;

-- Update existing assets
UPDATE assets SET exchange = 'NSE', subcategory = 'NSE Stocks' WHERE symbol IN ('RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'WIPRO.NS', 'BAJFINANCE.NS', 'SBIN.NS', 'ADANIENT.NS', 'HINDUNILVR.NS');
UPDATE assets SET exchange = 'FX', subcategory = 'Minor pairs' WHERE symbol IN ('EURINR=X', 'USDINR=X', 'GBPINR=X', 'JPYINR=X');
UPDATE assets SET exchange = 'BINANCE', subcategory = 'Crypto pairs' WHERE symbol IN ('BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD');
UPDATE assets SET exchange = 'COMEX', subcategory = 'Gold', market_type = 'commodity' WHERE symbol = 'GC=F';
UPDATE assets SET exchange = 'COMEX', subcategory = 'Silver', market_type = 'commodity' WHERE symbol = 'SI=F';

-- Insert new assets across categories
INSERT IGNORE INTO assets (symbol, name, market_type, currency, exchange, subcategory) VALUES
-- Indian BSE stocks
('RELIANCE.BO', 'Reliance Industries (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),
('TCS.BO', 'Tata Consultancy Services (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),
('INFY.BO', 'Infosys (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),

-- US Stocks (NASDAQ, NYSE, AMEX)
('AAPL', 'Apple Inc.', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('MSFT', 'Microsoft Corporation', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('GOOGL', 'Alphabet Inc.', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('AMZN', 'Amazon.com, Inc.', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('TSLA', 'Tesla, Inc.', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('NVDA', 'NVIDIA Corporation', 'equity', 'USD', 'NASDAQ', 'NASDAQ Stocks'),
('JPM', 'JPMorgan Chase & Co.', 'equity', 'USD', 'NYSE', 'NYSE Stocks'),
('KO', 'The Coca-Cola Company', 'equity', 'USD', 'NYSE', 'NYSE Stocks'),
('DIS', 'The Walt Disney Company', 'equity', 'USD', 'NYSE', 'NYSE Stocks'),
('SPY', 'SPDR S&P 500 ETF Trust', 'equity', 'USD', 'AMEX', 'AMEX ETFs'),
('IVV', 'iShares Core S&P 500 ETF', 'equity', 'USD', 'AMEX', 'AMEX ETFs'),

-- Crypto Altcoins
('ADA-USD', 'Cardano', 'crypto', 'USD', 'BINANCE', 'Altcoins'),
('DOGE-USD', 'Dogecoin', 'crypto', 'USD', 'BINANCE', 'Altcoins'),

-- Forex Major pairs
('EURUSD=X', 'EUR/USD', 'forex', 'USD', 'FX', 'Major pairs'),
('GBPUSD=X', 'GBP/USD', 'forex', 'USD', 'FX', 'Major pairs'),
('USDJPY=X', 'USD/JPY', 'forex', 'JPY', 'FX', 'Major pairs'),
('AUDUSD=X', 'AUD/USD', 'forex', 'USD', 'FX', 'Minor pairs'),
('USDCAD=X', 'USD/CAD', 'forex', 'USD', 'FX', 'Minor pairs'),

-- Commodities
('CL=F', 'Crude Oil Futures', 'commodity', 'USD', 'NYMEX', 'Crude Oil'),
('NG=F', 'Natural Gas Futures', 'commodity', 'USD', 'NYMEX', 'Natural Gas'),

-- Indices
('^NSEI', 'NIFTY 50', 'index', 'INR', 'NSE', 'Indices'),
('^BSESN', 'SENSEX', 'index', 'INR', 'BSE', 'Indices'),
('^GSPC', 'S&P 500', 'index', 'USD', 'NYSE', 'Indices'),
('^IXIC', 'NASDAQ Composite', 'index', 'USD', 'NASDAQ', 'Indices'),
('^DJI', 'Dow Jones Industrial Average', 'index', 'USD', 'NYSE', 'Indices');
