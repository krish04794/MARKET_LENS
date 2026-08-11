const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function nlToFilters(query) {
  const prompt = `You are an expert financial screener assistant. Convert the user's natural language query into a JSON object containing a logical operator and an array of structured filter conditions.
Available fields:
- market_type: 'equity', 'forex', 'crypto', 'metal', 'index', 'commodity'
- exchange: 'NSE', 'BSE', 'NASDAQ', 'NYSE', 'AMEX', 'BINANCE', 'FX', 'COMEX', 'NYMEX'
- price, change, gap_pct, volume, relative_volume, rsi_14, sma_20, sma_50, ema_20, atr, adx, vwap, pe, pb, eps, roe, roce, debt_equity, revenue_growth, profit_growth, support, resistance
- golden_cross, death_cross, breakout, breakdown, higher_high, higher_low (these are boolean fields, value must be true or false)

Available operators: '<', '>', '==', '!=', '>=', '<='

Output JSON structure:
{
  "logical_operator": "AND" | "OR",
  "conditions": [
    { "field": "field_name", "operator": "<" | ">" | "==" | "!=" | ">=" | "<=", "value": number | string | boolean }
  ]
}

Example user query: "Find NSE stocks with RSI under 40 and P/E ratio less than 20"
Output:
{
  "logical_operator": "AND",
  "conditions": [
    { "field": "exchange", "operator": "==", "value": "NSE" },
    { "field": "market_type", "operator": "==", "value": "equity" },
    { "field": "rsi_14", "operator": "<", "value": 40 },
    { "field": "pe", "operator": "<", "value": 20 }
  ]
}

User query: "${query}"
Respond ONLY with valid JSON, no markdown code block, no explanation, no comments.`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    });
    const text = chat.choices[0].message.content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(text);
  } catch (e) {
    console.error('[AI Service] Parsing failed:', e.message);
    return { logical_operator: 'AND', conditions: [] };
  }
}

async function generateInsight(asset, indicators, risk) {
  const prompt = `You are a concise financial analyst. Given this market data, write a 2-3 sentence plain-language insight for a retail investor. Be factual, not advisory.
Asset: ${asset.name} (${asset.symbol}) — ${asset.market_type}
RSI(14): ${indicators?.rsi_14 ?? 'N/A'}
SMA20: ${indicators?.sma_20 ?? 'N/A'}, SMA50: ${indicators?.sma_50 ?? 'N/A'}
Volume ratio vs 20-day avg: ${indicators?.relative_volume ?? indicators?.volume_ratio ?? 'N/A'}x
Beta: ${risk?.beta ?? 'N/A'}, Volatility(annualised): ${risk?.volatility ?? 'N/A'}%
Risk label: ${risk?.risk_label ?? 'N/A'}
Write 2-3 sentences only. No bullet points.`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150,
    });

    return chat.choices[0].message.content.trim();
  } catch (e) {
    console.error('[AI Service] Insight generation failed:', e.message);
    return `Analysis unavailable for ${asset.symbol}. This asset shows a ${risk?.risk_label || 'typical'} risk profile with a 30-day volatility of ${risk?.volatility || 'N/A'}%.`;
  }
}

async function generateDetailedAnalysis(symbol, indicators) {
  const prompt = `You are a professional quantitative analyst. Provide a detailed, premium analysis of ${symbol} based on the following indicators:
Price: ${indicators?.price} (Change: ${indicators?.change}%, Gap: ${indicators?.gap_pct}%)
RSI(14): ${indicators?.rsi_14}
SMA20: ${indicators?.sma_20}, SMA50: ${indicators?.sma_50}, EMA20: ${indicators?.ema_20}
Bollinger Bands: Upper: ${indicators?.bollinger?.upper}, Middle: ${indicators?.bollinger?.middle}, Lower: ${indicators?.bollinger?.lower}
MACD: Line: ${indicators?.macd?.macdLine}, Signal: ${indicators?.macd?.signalLine}, Histogram: ${indicators?.macd?.histogram}, Trend Signal: ${indicators?.macd?.signal}
ADX: ${indicators?.adx}, ATR: ${indicators?.atr}, Stochastic %K: ${indicators?.stochastic?.k}, %D: ${indicators?.stochastic?.d}
VWAP: ${indicators?.vwap}
Patterns: Golden Cross: ${indicators?.golden_cross}, Death Cross: ${indicators?.death_cross}, Breakout: ${indicators?.breakout}, Breakdown: ${indicators?.breakdown}, Higher High: ${indicators?.higher_high}, Higher Low: ${indicators?.higher_low}
Support: ${indicators?.support}, Resistance: ${indicators?.resistance}
Fundamentals (if applicable): Market Cap: ${indicators?.marketCap}, P/E: ${indicators?.pe}, P/B: ${indicators?.pb}, EPS: ${indicators?.eps}, ROE: ${indicators?.roe}%, ROCE: ${indicators?.roce}%, Debt/Equity: ${indicators?.debtEquity}, Revenue Growth: ${indicators?.revenueGrowth}%, Profit Growth: ${indicators?.profitGrowth}%

Format your output into 4 distinct markdown sections:
### 📈 Trend & Momentum Analysis
(Evaluate trend using SMA, EMA, MACD, Bollinger Bands, and ADX)

### 🔑 Key Support & Resistance Levels
(Analyze support/resistance, breakouts, breakdowns, ATR)

### 📊 Fundamental Health & Valuation
(Evaluate valuation metrics, growth, and leverage)

### 💡 AI Verdict & Trading Outlook
(Clear outlook, key trigger points, overall sentiment)

Do not use headers other than these four. Be precise, detailed, and professional.`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    });
    return chat.choices[0].message.content.trim();
  } catch (e) {
    console.error('[AI Service] Detailed analysis failed:', e.message);
    return `### 📈 Trend & Momentum Analysis\nTrend is stable with standard trading volatility.\n\n### 🔑 Key Support & Resistance Levels\nSupport at ${indicators?.support || 'N/A'}, resistance at ${indicators?.resistance || 'N/A'}.\n\n### 📊 Fundamental Health & Valuation\nValuation is inline with historical averages.\n\n### 💡 AI Verdict & Trading Outlook\nNeutral outlook based on available technical levels.`;
  }
}

module.exports = { nlToFilters, generateInsight, generateDetailedAnalysis };
