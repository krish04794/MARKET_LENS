import { useState } from 'react';
import { screenerAPI, aiAPI } from '../services/api';
import { Search, Filter, Download, Sparkles } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';

const MARKET_TYPES = ['', 'equity', 'forex', 'crypto', 'metal'];

export default function Screener() {
  const [filters, setFilters] = useState({ market_type: '', rsi_min: '', rsi_max: '', volume_ratio_min: '', pe_max: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  const run = async (f = filters) => {
    setLoading(true);
    try {
      const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== undefined));
      if (clean.rsi_min) clean.rsi_min = Number(clean.rsi_min);
      if (clean.rsi_max) clean.rsi_max = Number(clean.rsi_max);
      if (clean.volume_ratio_min) clean.volume_ratio_min = Number(clean.volume_ratio_min);
      if (clean.pe_max) clean.pe_max = Number(clean.pe_max);
      const { data } = await screenerAPI.run(clean);
      setResults(data.results);
    } finally { setLoading(false); }
  };

  const nlRun = async () => {
    if (!nlQuery) return;
    setNlLoading(true);
    try {
      const { data } = await aiAPI.query(nlQuery);
      const f = { ...filters, ...data.filters };
      setFilters(f);
      await run(f);
    } finally { setNlLoading(false); }
  };

  const exportCSV = () => {
    const header = 'Symbol,Name,Market,RSI,SMA20,SMA50,Volume Ratio,P/E\n';
    const rows = results.map(r => `${r.symbol},${r.name},${r.market_type},${r.rsi_14},${r.sma_20},${r.sma_50},${r.volume_ratio},${r.pe_ratio || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'screener_results.csv'; a.click();
  };

  const inp = { background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, width: '100%', outline: 'none' };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Screener</h1>

      {/* NL Query */}
      <div style={{ background: '#0a0a0a', border: '1px solid #6366f155', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} /> AI Natural Language Query
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={nlQuery} onChange={e => setNlQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && nlRun()}
            placeholder='Try: "show me oversold IT stocks" or "high volume crypto"'
            style={{ ...inp, flex: 1 }} />
          <button onClick={nlRun} disabled={nlLoading} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {nlLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
      </div>

      {/* Manual Filters */}
      <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
          <Filter size={14} /> Manual Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Market</label>
            <select value={filters.market_type} onChange={e => setFilters({...filters, market_type: e.target.value})} style={inp}>
              {MARKET_TYPES.map(t => <option key={t} value={t}>{t || 'All'}</option>)}
            </select>
          </div>
          {[['rsi_min','RSI Min'],['rsi_max','RSI Max'],['volume_ratio_min','Min Vol Ratio'],['pe_max','Max P/E']].map(([k, l]) => (
            <div key={k}>
              <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>{l}</label>
              <input type="number" value={filters[k]} onChange={e => setFilters({...filters, [k]: e.target.value})} placeholder="—" style={inp} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={() => run()} disabled={loading} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
            {loading ? 'Scanning...' : 'Run Screener'}
          </button>
          <button onClick={() => setFilters({ market_type: '', rsi_min: '', rsi_max: '', volume_ratio_min: '', pe_max: '' })}
            style={{ padding: '8px 16px', background: '#262626', color: '#e2e8f0', border: 'none', borderRadius: 8, fontSize: 13 }}>
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262626' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{results.length} results</span>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#262626', color: '#e2e8f0', border: 'none', borderRadius: 8, fontSize: 12 }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#000000' }}>
                  {['Symbol','Name','Market','RSI','SMA20','SMA50','Vol Ratio','P/E'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.symbol} style={{ borderTop: '1px solid #0a0a0a', background: i % 2 === 0 ? '#0a0a0a' : '#172033' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#818cf8', fontWeight: 600 }}>{r.symbol}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{r.name}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ background: '#262626', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#94a3b8' }}>{r.market_type}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: r.rsi_14 > 70 ? '#ef4444' : r.rsi_14 < 30 ? '#10b981' : '#e2e8f0' }}>{r.rsi_14 ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.sma_20?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.sma_50?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: r.volume_ratio > 2 ? '#10b981' : '#e2e8f0' }}>{r.volume_ratio ?? '—'}x</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13 }}>{r.pe_ratio ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
