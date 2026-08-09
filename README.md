# MarketLens — Unified Market Screener & Risk Analyzer

> AI-assisted multi-asset financial analysis platform for Nifty equities, forex, crypto, and precious metals.

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MySQL 8.0 (password: `Acpc@2025`)

### 1. Database setup
```bash
mysql -u root -pAcpc@2025 < backend/src/db/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
# Add your GROQ_API_KEY to .env
npm run dev
```

### 3. ML Server
```bash
cd ml
pip install -r requirements.txt
python src/api_server.py
# Optionally train the fraud model:
python src/train_fraud.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Docker (all services at once)
```bash
cd infra
GROQ_API_KEY=your_key docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/market/assets | List all assets |
| GET | /api/market/ohlcv/:symbol | OHLCV history |
| GET | /api/market/indicators/:symbol | RSI, SMA, volume ratio |
| POST | /api/screener/run | Run screener with filters |
| GET | /api/risk/:symbol | Risk score + beta |
| POST | /api/ai/query | NL query → filters |
| GET | /api/ai/insight/:symbol | AI insight summary |
| GET | /api/watchlist | User watchlist |
| POST | /api/watchlist/:symbol | Add to watchlist |

## Team
| Member | Enrollment | Owns |
|--------|------------|------|
| X | X | Frontend (React) |
| X | X | Backend (Node/Express) |
| X | X | ML / AI layer |
| X | X | DB / DevOps |

## Stack
- **Frontend:** React 18 + Vite + Recharts + Zustand
- **Backend:** Node.js + Express + MySQL2
- **ML:** Python + Flask + scikit-learn
- **Database:** MySQL 8.0
- **AI:** Groq (llama3-8b-8192)
- **Data:** yfinance + CoinGecko (free APIs)
- **DevOps:** Docker Compose + GitHub Actions
