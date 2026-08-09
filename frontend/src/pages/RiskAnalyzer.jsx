import { useState } from 'react';
import { riskAPI, aiAPI, marketAPI } from '../services/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { Sparkles, Search } from 'lucide-react';

const PRESETS = ['RELIANCE.NS','TCS.NS','INFY.NS','BTC-USD','ETH-USD','GC=F','USDINR=X'];

export default function RiskAnalyzer() {
  const [symbol, setSymbol] = useState('');
  const [risk, setRisk] = useState(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (sym) => {
    const s = sym || symbol;
    if (!s) return;
    setLoading(true); setError(''); setRisk(null); setInsight('');
    try {
      const { data } = await riskAPI.get(s);
      setRisk(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to fetch risk data');
    } finally { setLoading(false); }
  };

  const fetchInsight = async () => {
    const s = symbol;
    if (!s) return;
    setInsightLoading(true);
    try {
      const { data } = await aiAPI.insight(s);
      setInsight(data.insight);
    } catch { setInsight('Could not generate insight.'); }
    finally { setInsightLoading(false); }
  };

  const radarData = risk ? [
    { metric: 'Beta', value: Math.min(Math.abs(risk.beta || 0) * 50, 100) },
    { metric: 'Volatility', value: Math.min(risk.volatility_30d || risk.volatility || 0, 100) },
    { metric: 'Drawdown', value: Math.min(risk.max_drawdown || 0, 100) },
    { metric: 'Idio Risk', value: Math.min((risk.idio_risk || 0) * 100, 100) },
    { metric: 'Stability', value: risk.risk_label === 'Low' ? 80 : risk.risk_label === 'Medium' ? 50 : 20 },
  ] : [];

  const inp = { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', flex: 1 };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Risk Analyzer</h1>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Factor-based risk decomposition — beta, volatility, drawdown, and idiosyncratic risk</p>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="Enter symbol e.g. RELIANCE.NS, BTC-USD, GC=F"
          style={inp} />
        <button onClick={() => analyze()} disabled={loading} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 }}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {PRESETS.map(s => (
          <button key={s} onClick={() => { setSymbol(s); analyze(s); }}
            style={{ padding: '4px 12px', background: '#0a0a0a', border: '1px solid #262626', borderRadius: 20, color: '#94a3b8', fontSize: 12 }}>
            {s}
          </button>
        ))}
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>}

      {risk && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <StatCard label="Market Beta" value={risk.beta?.toFixed(3) ?? risk.beta} sub="vs benchmark" color="#818cf8" />
            <StatCard label="Volatility (Ann.)" value={risk.volatility_30d || risk.volatility ? `${(risk.volatility_30d || risk.volatility)?.toFixed(1)}%` : '—'} sub="30-day window" color="#f59e0b" />
            <StatCard label="Max Drawdown" value={risk.max_drawdown ? `${risk.max_drawdown?.toFixed(1)}%` : '—'} sub="peak-to-trough" color="#ef4444" />
            <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>Risk Label</div>
              <RiskBadge label={risk.risk_label} />
            </div>
          </div>

          {/* Radar Chart + Interpretation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Risk Profile</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#262626" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>What does this mean?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#000000', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>BETA ({risk.beta?.toFixed(3)})</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                    {risk.beta > 1.2 ? 'Moves significantly more than the market. Higher risk, higher potential return.'
                     : risk.beta < 0.8 ? 'More stable than the market. Defensive asset.'
                     : 'Tracks the market closely. Average market risk.'}
                  </div>
                </div>
                <div style={{ background: '#000000', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>VOLATILITY ({(risk.volatility_30d || risk.volatility)?.toFixed(1)}%)</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                    {(risk.volatility_30d || risk.volatility) > 40 ? 'High volatility — large price swings expected.'
                     : (risk.volatility_30d || risk.volatility) > 20 ? 'Moderate volatility — typical for growth assets.'
                     : 'Low volatility — relatively stable price action.'}
                  </div>
                </div>
                <div style={{ background: '#000000', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>MAX DRAWDOWN ({risk.max_drawdown?.toFixed(1)}%)</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                    Largest peak-to-trough decline in the historical window. Indicates worst-case loss scenario.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div style={{ background: '#0a0a0a', border: '1px solid #6366f155', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
                <Sparkles size={14}/> AI Insight
              </div>
              <button onClick={fetchInsight} disabled={insightLoading} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>
                {insightLoading ? 'Generating...' : 'Generate Insight'}
              </button>
            </div>
            {insight ? (
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>{insight}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#475569' }}>Click "Generate Insight" to get an AI-powered plain-language summary of this asset's risk profile.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
