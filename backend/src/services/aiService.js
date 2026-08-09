const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function nlToFilters(query) {
  const prompt = `You are a financial screener assistant. Convert the user's natural language query into a JSON filter object.
Available filter fields: rsi_min, rsi_max, pe_min, pe_max, volume_ratio_min, market_type (equity/forex/crypto/metal), sma_signal (golden_cross/death_cross).
User query: "${query}"
Respond ONLY with valid JSON, no explanation. Example: {"market_type":"equity","rsi_max":30,"pe_max":20}`;

  const chat = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  try {
    const text = chat.choices[0].message.content.trim();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function generateInsight(asset, indicators, risk) {
  const prompt = `You are a concise financial analyst. Given this market data, write a 2-3 sentence plain-language insight for a retail investor. Be factual, not advisory.
Asset: ${asset.name} (${asset.symbol}) — ${asset.market_type}
RSI(14): ${indicators?.rsi_14 ?? 'N/A'}
SMA20: ${indicators?.sma_20 ?? 'N/A'}, SMA50: ${indicators?.sma_50 ?? 'N/A'}
Volume ratio vs 20-day avg: ${indicators?.volume_ratio ?? 'N/A'}x
Beta: ${risk?.beta ?? 'N/A'}, Volatility(annualised): ${risk?.volatility ?? 'N/A'}%
Risk label: ${risk?.risk_label ?? 'N/A'}
Write 2-3 sentences only. No bullet points.`;

  try {
    const chat = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
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


module.exports = { nlToFilters, generateInsight };
