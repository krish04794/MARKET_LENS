import { useState, useEffect } from 'react';
import { watchlistAPI, marketAPI, aiAPI } from '../services/api';
import { Star, Trash2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';

export default function Watchlist() {
  const { user } = useAuthStore();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadWatchlist();
  }, [user]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const { data } = await watchlistAPI.get();
      setItems(data);
      // Fetch quotes for each
      const qMap = {};
      await Promise.all(data.map(async a => {
        try {
          const { data: q } = await marketAPI.getQuote(a.symbol);
          qMap[a.symbol] = q;
        } catch {}
      }));
      setQuotes(qMap);
    } finally { setLoading(false); }
  };

  const remove = async (symbol) => {
    await watchlistAPI.remove(symbol);
    setItems(items.filter(i => i.symbol !== symbol));
  };

  const add = async () => {
    if (!addSymbol) return;
    try {
      await watchlistAPI.add(addSymbol.toUpperCase());
      setAddSymbol('');
      loadWatchlist();
    } catch (e) { alert(e.response?.data?.error || 'Failed to add'); }
  };

  const fetchInsight = async (symbol) => {
    setInsights(prev => ({ ...prev, [symbol]: 'loading' }));
    try {
      const { data } = await aiAPI.insight(symbol);
      setInsights(prev => ({ ...prev, [symbol]: data.insight }));
    } catch {
      setInsights(prev => ({ ...prev, [symbol]: 'Could not generate insight.' }));
    }
  };

  const inp = { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8, padding: '9px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none', flex: 1 };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Star size={20} color="#f59e0b" fill="#f59e0b" />
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Watchlist</h1>
      </div>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Track your favourite assets across all markets</p>

      {/* Add symbol */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <input value={addSymbol} onChange={e => setAddSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Add symbol e.g. WIPRO.NS, SOL-USD, SI=F"
          style={inp} />
        <button onClick={add} style={{ padding: '9px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
          + Add
        </button>
      </div>

      {loading && <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</div>}

      {!loading && items.length === 0 && (
        <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 40, textAlign: 'center', color: '#475569' }}>
          <Star size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No assets in your watchlist yet.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Add symbols above to start tracking.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(asset => {
          const q = quotes[asset.symbol];
          const up = q?.change > 0;
          return (
            <div key={asset.symbol} style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#818cf8', fontSize: 15 }}>{asset.symbol}</span>
                    <span style={{ background: '#262626', borderRadius: 4, padding: '1px 8px', fontSize: 11, color: '#94a3b8' }}>{asset.market_type}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{asset.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {q && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                        {parseFloat(q.price).toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: up ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        {up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        {up ? '+' : ''}{q.change}%
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => fetchInsight(asset.symbol)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#6366f122', color: '#818cf8', border: '1px solid #6366f144', borderRadius: 7, fontSize: 12 }}>
                      <Sparkles size={12}/> AI Insight
                    </button>
                    <button onClick={() => remove(asset.symbol)}
                      style={{ padding: '6px 10px', background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: 7 }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
              {insights[asset.symbol] && insights[asset.symbol] !== 'loading' && (
                <div style={{ marginTop: 14, background: '#000000', borderRadius: 8, padding: 12, fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, borderLeft: '3px solid #6366f1' }}>
                  {insights[asset.symbol]}
                </div>
              )}
              {insights[asset.symbol] === 'loading' && (
                <div style={{ marginTop: 14, color: '#475569', fontSize: 12 }}>Generating insight...</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
