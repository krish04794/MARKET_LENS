import { useState, useEffect } from 'react';
import { marketAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';

const MARKETS = [
  { key: 'equity', label: 'Nifty Equities', color: '#6366f1' },
  { key: 'crypto', label: 'Crypto', color: '#f59e0b' },
  { key: 'forex', label: 'Forex', color: '#10b981' },
  { key: 'metal', label: 'Metals', color: '#e879f9' },
];

const SYMBOLS = ['RELIANCE.NS','TCS.NS','BTC-USD','ETH-USD','USDINR=X','GC=F'];

export default function Dashboard() {
  const [selected, setSelected] = useState('RELIANCE.NS');
  const [ohlcv, setOhlcv] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    marketAPI.getAssets().then(r => setAssets(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      marketAPI.getOHLCV(selected),
      marketAPI.getIndicators(selected),
    ]).then(([o, i]) => {
      setOhlcv(o.data.slice(-60));
      setIndicators(i.data);
    }).finally(() => setLoading(false));
  }, [selected]);

  const chartData = ohlcv.map(r => ({
    date: (r.fetched_at || r.date || '').toString().slice(0, 10),
    price: parseFloat(r.close_price || r.close || 0),
  }));

  const latest = ohlcv[ohlcv.length - 1];
  const prev = ohlcv[ohlcv.length - 2];
  const change = latest && prev
    ? (((latest.close_price || latest.close) - (prev.close_price || prev.close)) / (prev.close_price || prev.close) * 100).toFixed(2)
    : null;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Dashboard</h1>

      {/* Market quick filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SYMBOLS.map(sym => (
          <button key={sym} onClick={() => setSelected(sym)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid',
            borderColor: selected === sym ? '#6366f1' : '#262626',
            background: selected === sym ? '#6366f1' : 'transparent',
            color: selected === sym ? '#fff' : '#94a3b8', fontSize: 13,
          }}>{sym}</button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Price" value={latest ? parseFloat(latest.close_price || latest.close).toFixed(2) : '—'} sub={selected} />
        <StatCard label="Change" value={change ? `${change}%` : '—'} color={change > 0 ? '#10b981' : '#ef4444'} sub="vs prev close" />
        <StatCard label="RSI (14)" value={indicators?.rsi_14} color={indicators?.rsi_14 > 70 ? '#ef4444' : indicators?.rsi_14 < 30 ? '#10b981' : '#f59e0b'} sub="overbought > 70" />
        <StatCard label="Vol. Ratio" value={indicators?.volume_ratio ? `${indicators.volume_ratio}x` : '—'} color="#06b6d4" sub="vs 20-day avg" />
      </div>

      {/* Chart */}
      <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>{selected} — Price (60 days)</h2>
        {loading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#818cf8' }} />
              <Line type="monotone" dataKey="price" stroke="#6366f1" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* SMA info */}
      {indicators && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatCard label="SMA 20" value={indicators.sma_20?.toFixed(2)} color="#818cf8" />
          <StatCard label="SMA 50" value={indicators.sma_50?.toFixed(2)} color="#a78bfa" />
        </div>
      )}
    </div>
  );
}
