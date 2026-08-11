CREATE DATABASE IF NOT EXISTS marketlens;
USE marketlens;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symbol VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  market_type ENUM('equity','forex','crypto','metal','index','commodity') NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  exchange VARCHAR(50) DEFAULT NULL,
  subcategory VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS ohlcv (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  fetched_at DATETIME NOT NULL,
  open_price DECIMAL(20,6),
  high_price DECIMAL(20,6),
  low_price DECIMAL(20,6),
  close_price DECIMAL(20,6),
  volume BIGINT,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE KEY unique_asset_time (asset_id, fetched_at)
);

CREATE TABLE IF NOT EXISTS indicators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  date DATE NOT NULL,
  rsi_14 DECIMAL(10,4),
  sma_20 DECIMAL(20,6),
  sma_50 DECIMAL(20,6),
  volume_ratio DECIMAL(10,4),
  pe_ratio DECIMAL(10,4),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE KEY unique_asset_date (asset_id, date)
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  computed_at DATETIME NOT NULL,
  beta DECIMAL(10,4),
  idio_risk DECIMAL(10,4),
  volatility_30d DECIMAL(10,4),
  max_drawdown DECIMAL(10,4),
  risk_label ENUM('Low','Medium','High'),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE TABLE IF NOT EXISTS watchlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  asset_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE KEY unique_watch (user_id, asset_id)
);

CREATE TABLE IF NOT EXISTS filter_presets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255),
  filters JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS nl_query_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  raw_query TEXT,
  parsed_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed assets
INSERT IGNORE INTO assets (symbol, name, market_type, currency, exchange, subcategory) VALUES
('RELIANCE.NS','Reliance Industries','equity','INR','NSE','NSE Stocks'),
('TCS.NS','Tata Consultancy Services','equity','INR','NSE','NSE Stocks'),
('INFY.NS','Infosys','equity','INR','NSE','NSE Stocks'),
('HDFCBANK.NS','HDFC Bank','equity','INR','NSE','NSE Stocks'),
('ICICIBANK.NS','ICICI Bank','equity','INR','NSE','NSE Stocks'),
('WIPRO.NS','Wipro','equity','INR','NSE','NSE Stocks'),
('BAJFINANCE.NS','Bajaj Finance','equity','INR','NSE','NSE Stocks'),
('SBIN.NS','State Bank of India','equity','INR','NSE','NSE Stocks'),
('ADANIENT.NS','Adani Enterprises','equity','INR','NSE','NSE Stocks'),
('HINDUNILVR.NS','Hindustan Unilever','equity','INR','NSE','NSE Stocks'),
('EURINR=X','EUR/INR','forex','INR','FX','Minor pairs'),
('USDINR=X','USD/INR','forex','INR','FX','Minor pairs'),
('GBPINR=X','GBP/INR','forex','INR','FX','Minor pairs'),
('JPYINR=X','JPY/INR','forex','INR','FX','Minor pairs'),
('BTC-USD','Bitcoin','crypto','USD','BINANCE','Crypto pairs'),
('ETH-USD','Ethereum','crypto','USD','BINANCE','Crypto pairs'),
('SOL-USD','Solana','crypto','USD','BINANCE','Crypto pairs'),
('BNB-USD','BNB','crypto','USD','BINANCE','Crypto pairs'),
('GC=F','Gold Futures','commodity','USD','COMEX','Gold'),
('SI=F','Silver Futures','commodity','USD','COMEX','Silver'),
('RELIANCE.BO', 'Reliance Industries (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),
('TCS.BO', 'Tata Consultancy Services (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),
('INFY.BO', 'Infosys (BSE)', 'equity', 'INR', 'BSE', 'BSE Stocks'),
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
('ADA-USD', 'Cardano', 'crypto', 'USD', 'BINANCE', 'Altcoins'),
('DOGE-USD', 'Dogecoin', 'crypto', 'USD', 'BINANCE', 'Altcoins'),
('EURUSD=X', 'EUR/USD', 'forex', 'USD', 'FX', 'Major pairs'),
('GBPUSD=X', 'GBP/USD', 'forex', 'USD', 'FX', 'Major pairs'),
('USDJPY=X', 'USD/JPY', 'forex', 'JPY', 'FX', 'Major pairs'),
('AUDUSD=X', 'AUD/USD', 'forex', 'USD', 'FX', 'Minor pairs'),
('USDCAD=X', 'USD/CAD', 'forex', 'USD', 'FX', 'Minor pairs'),
('CL=F', 'Crude Oil Futures', 'commodity', 'USD', 'NYMEX', 'Crude Oil'),
('NG=F', 'Natural Gas Futures', 'commodity', 'USD', 'NYMEX', 'Natural Gas'),
('^NSEI', 'NIFTY 50', 'index', 'INR', 'NSE', 'Indices'),
('^BSESN', 'SENSEX', 'index', 'INR', 'BSE', 'Indices'),
('^GSPC', 'S&P 500', 'index', 'USD', 'NYSE', 'Indices'),
('^IXIC', 'NASDAQ Composite', 'index', 'USD', 'NASDAQ', 'Indices'),
('^DJI', 'Dow Jones Industrial Average', 'index', 'USD', 'NYSE', 'Indices');
