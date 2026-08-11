import { useState, useEffect, useRef } from 'react';
import { screenerAPI, aiAPI, watchlistAPI, marketAPI } from '../services/api';
import {
  Search, Filter, Download, Sparkles, Plus, Trash2, Save, Star,
  Play, RotateCcw, Check, ArrowUpRight, ArrowDownRight, Grid, Award, HardDrive
} from 'lucide-react';
import TradingViewChart, { normalizeSymbolForTV } from '../components/TradingViewChart';
import useAuthStore from '../store/authStore';

const MARKETS = [
  { id: 'indian', label: '🇮🇳 Indian Market', type: 'equity', exchanges: ['NSE', 'BSE'] },
  { id: 'american', label: '🇺🇸 American Market', type: 'equity', exchanges: ['NASDAQ', 'NYSE', 'AMEX'] },
  { id: 'crypto', label: '₿ Crypto', type: 'crypto', exchanges: ['BINANCE'] },
  { id: 'forex', label: '💱 Forex', type: 'forex', exchanges: ['FX'] },
  { id: 'commodity', label: '🛢️ Commodities', type: 'commodity', exchanges: ['COMEX', 'NYMEX'] },
  { id: 'indices', label: '📊 Indices', type: 'index', exchanges: ['NSE', 'BSE', 'NASDAQ', 'NYSE'] }
];

const FILTER_FIELDS = [
  { value: 'rsi_14', label: 'RSI (14)', type: 'number' },
  { value: 'price', label: 'Price', type: 'number' },
  { value: 'change', label: 'Price Change %', type: 'number' },
  { value: 'gap_pct', label: 'Gap %', type: 'number' },
  { value: 'volume', label: 'Volume', type: 'number' },
  { value: 'relative_volume', label: 'Relative Volume', type: 'number' },
  { value: 'pe', label: 'P/E Ratio', type: 'number' },
  { value: 'pb', label: 'P/B Ratio', type: 'number' },
  { value: 'roe', label: 'ROE %', type: 'number' },
  { value: 'roce', label: 'ROCE %', type: 'number' },
  { value: 'debt_equity', label: 'Debt/Equity', type: 'number' },
  { value: 'revenue_growth', label: 'Revenue Growth %', type: 'number' },
  { value: 'profit_growth', label: 'Profit Growth %', type: 'number' },
  { value: 'atr', label: 'ATR', type: 'number' },
  { value: 'adx', label: 'ADX', type: 'number' },
  { value: 'vwap', label: 'VWAP', type: 'number' },
  { value: 'golden_cross', label: 'Golden Cross (SMA 20 > 50)', type: 'boolean' },
  { value: 'death_cross', label: 'Death Cross (SMA 20 < 50)', type: 'boolean' },
  { value: 'breakout', label: '20-Day Breakout', type: 'boolean' },
  { value: 'breakdown', label: '20-Day Breakdown', type: 'boolean' },
  { value: 'higher_high', label: 'Higher High', type: 'boolean' },
  { value: 'higher_low', label: 'Higher Low', type: 'boolean' }
];

export default function Screener() {
  const { user } = useAuthStore();
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [selectedExchange, setSelectedExchange] = useState(MARKETS[0].exchanges[0]);
  
  // Dynamic filter state
  const [logicalOperator, setLogicalOperator] = useState('AND');
  const [conditions, setConditions] = useState([]);
  
  // New condition builder state
  const [newField, setNewField] = useState(FILTER_FIELDS[0].value);
  const [newOperator, setNewOperator] = useState('<');
  const [newValue, setNewValue] = useState('');

  // Presets and presets loading
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);

  // Search & Results state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI query state
  const [nlQuery, setNlQuery] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  // Watchlist state
  const [watchlist, setWatchlist] = useState(new Set());

  // Selected details panel state
  const [activeItem, setActiveItem] = useState(null);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'tech' | 'fundamental' | 'ai'
  const [tvInterval, setTvInterval] = useState('D');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // Polling ref
  const pollingRef = useRef(null);

  // Load presets and watchlist
  useEffect(() => {
    fetchPresets();
    fetchWatchlist();
    runScreener();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Run screener when market or exchange changes
  useEffect(() => {
    runScreener();
  }, [selectedMarket, selectedExchange]);

  // Handle polling when active instrument changes
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!activeItem) return;

    // Fetch details immediately, then poll
    fetchActiveItemQuote();
    fetchActiveItemAnalysis();

    pollingRef.current = setInterval(() => {
      fetchActiveItemQuote();
    }, 5000); // 5 seconds polling

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeItem?.symbol]);

  const fetchPresets = async () => {
    try {
      const { data } = await screenerAPI.getPresets();
      setPresets(data);
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  };

  const fetchWatchlist = async () => {
    if (!user) return;
    try {
      const { data } = await watchlistAPI.get();
      setWatchlist(new Set(data.map(item => item.symbol)));
    } catch (e) {
      console.error('Failed to load watchlist:', e);
    }
  };

  const toggleWatchlist = async (symbol) => {
    if (!user) {
      alert('Please login to add assets to your watchlist.');
      return;
    }
    const updated = new Set(watchlist);
    if (updated.has(symbol)) {
      updated.delete(symbol);
      setWatchlist(updated);
      try {
        await watchlistAPI.remove(symbol);
      } catch (e) {
        console.error('Failed to remove from watchlist:', e);
      }
    } else {
      updated.add(symbol);
      setWatchlist(updated);
      try {
        await watchlistAPI.add(symbol);
      } catch (e) {
        console.error('Failed to add to watchlist:', e);
      }
    }
  };

  const runScreener = async (overrideConditions = null) => {
    setLoading(true);
    try {
      const payload = {
        market_type: selectedMarket.type,
        exchange: selectedExchange,
        logical_operator: logicalOperator,
        conditions: overrideConditions !== null ? overrideConditions : conditions
      };
      const { data } = await screenerAPI.run(payload);
      setResults(data.results);
      if (data.results.length > 0) {
        // Set first matching result as active if none selected
        if (!activeItem || !data.results.some(r => r.symbol === activeItem.symbol)) {
          setActiveItem(data.results[0]);
        } else {
          // Keep active but refresh indicators
          const updated = data.results.find(r => r.symbol === activeItem.symbol);
          if (updated) setActiveItem(updated);
        }
      }
    } catch (e) {
      console.error('Screener run failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleNlRun = async () => {
    if (!nlQuery.trim()) return;
    setNlLoading(true);
    try {
      const { data } = await aiAPI.query(nlQuery);
      if (data.filters) {
        const parsed = data.filters;
        if (parsed.conditions) {
          setConditions(parsed.conditions);
          setLogicalOperator(parsed.logical_operator || 'AND');
          
          // Match market & exchange if AI sets them
          const marketCond = parsed.conditions.find(c => c.field === 'market_type');
          if (marketCond && marketCond.operator === '==') {
            const m = MARKETS.find(market => market.type === marketCond.value);
            if (m) {
              setSelectedMarket(m);
              const exchangeCond = parsed.conditions.find(c => c.field === 'exchange');
              if (exchangeCond && exchangeCond.operator === '==') {
                setSelectedExchange(exchangeCond.value);
              } else {
                setSelectedExchange(m.exchanges[0]);
              }
            }
          }
          await runScreener(parsed.conditions);
        }
      }
    } catch (e) {
      console.error('AI filter generation failed:', e);
    } finally {
      setNlLoading(false);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await screenerAPI.savePreset(presetName, {
        logical_operator: logicalOperator,
        conditions
      });
      setPresetName('');
      setSaveOpen(false);
      fetchPresets();
    } catch (e) {
      alert('Could not save preset. Please verify you are logged in.');
    }
  };

  const loadPreset = (preset) => {
    if (preset.filters) {
      setConditions(preset.filters.conditions || []);
      setLogicalOperator(preset.filters.logical_operator || 'AND');
      runScreener(preset.filters.conditions);
    }
  };

  const addCondition = () => {
    const fieldDef = FILTER_FIELDS.find(f => f.value === newField);
    const condValue = fieldDef.type === 'boolean' ? (newValue.toLowerCase() === 'true') : Number(newValue);
    
    if (newValue === '' && fieldDef.type !== 'boolean') return;

    const newCond = {
      field: newField,
      operator: fieldDef.type === 'boolean' ? '==' : newOperator,
      value: condValue
    };
    const nextConds = [...conditions, newCond];
    setConditions(nextConds);
    setNewValue('');
    runScreener(nextConds);
  };

  const removeCondition = (index) => {
    const nextConds = conditions.filter((_, i) => i !== index);
    setConditions(nextConds);
    runScreener(nextConds);
  };

  const clearAllFilters = () => {
    setConditions([]);
    runScreener([]);
  };

  const fetchActiveItemQuote = async () => {
    if (!activeItem) return;
    try {
      const { data } = await marketAPI.getQuote(activeItem.symbol);
      setActiveItem(prev => {
        if (prev && prev.symbol === data.symbol) {
          return { ...prev, price: data.price, change: Number(data.change) };
        }
        return prev;
      });
    } catch (e) {
      console.warn('Live quote polling failed:', e.message);
    }
  };

  const fetchActiveItemAnalysis = async () => {
    if (!activeItem) return;
    setAiAnalysisLoading(true);
    setAiAnalysis('');
    try {
      const { data } = await aiAPI.analyze(activeItem.symbol);
      setAiAnalysis(data.analysis);
    } catch (e) {
      console.error('Failed to fetch AI analysis:', e);
      setAiAnalysis('AI detailed analysis currently unavailable.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const exportCSV = () => {
    const header = 'Symbol,Name,Market,Exchange,Price,Change%,RSI,SMA20,SMA50,Volume,P/E\n';
    const rows = results.map(r => 
      `"${r.symbol}","${r.name}","${r.market_type}","${r.exchange || ''}",${r.price},${r.change},${r.rsi_14 || ''},${r.sma_20 || ''},${r.sma_50 || ''},${r.volume},${r.pe || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `screener_${selectedMarket.id}_results.csv`;
    a.click();
  };

  // Filter results client-side via search query
  const filteredResults = results.filter(r => 
    r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFieldDef = FILTER_FIELDS.find(f => f.value === newField);

  // Theme style shortcuts
  const s = {
    card: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 },
    input: { background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none' },
    btn: { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, padding: 20, height: 'calc(100vh - 56px)', overflow: 'hidden', background: '#020617' }}>
      
      {/* LEFT PANEL - Screener Terminal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 4 }}>
        
        {/* Market selector tabs */}
        <div style={{ ...s.card, padding: 8, display: 'flex', gap: 8, flexWrap: 'wrap', background: '#0b0f19' }}>
          {MARKETS.map(market => {
            const isSelected = selectedMarket.id === market.id;
            return (
              <button
                key={market.id}
                onClick={() => {
                  setSelectedMarket(market);
                  setSelectedExchange(market.exchanges[0]);
                }}
                style={{
                  ...s.btn,
                  background: isSelected ? '#4338ca' : '#0f172a',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: isSelected ? 'none' : '1px solid #1e293b'
                }}
              >
                {market.label}
              </button>
            );
          })}
        </div>

        {/* AI Assistant query panel */}
        <div style={{ ...s.card, border: '1px solid #4f46e544', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6366f1, #3b82f6)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color="#818cf8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Screener Natural Language Assistant</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNlRun()}
              placeholder='Try: "Find tech stocks with RSI under 30" or "bullish crypto breakout"'
              style={{ ...s.input, flex: 1 }}
            />
            <button
              onClick={handleNlRun}
              disabled={nlLoading}
              style={{ ...s.btn, background: '#4338ca', color: '#fff' }}
            >
              {nlLoading ? 'Analyzing...' : <><Sparkles size={14} /> Screen</>}
            </button>
          </div>
        </div>

        {/* Dynamic Filters Builder */}
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} color="#94a3b8" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Screener Filters</span>
            </div>
            
            {/* Logic Toggle */}
            <div style={{ display: 'flex', background: '#090d16', borderRadius: 6, padding: 3, border: '1px solid #1e293b' }}>
              {['AND', 'OR'].map(op => (
                <button
                  key={op}
                  onClick={() => { setLogicalOperator(op); runScreener(); }}
                  style={{
                    border: 'none',
                    background: logicalOperator === op ? '#3b82f6' : 'transparent',
                    color: logicalOperator === op ? '#fff' : '#64748b',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Active condition tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {conditions.map((cond, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 12
                }}
              >
                <span style={{ color: '#94a3b8' }}>{FILTER_FIELDS.find(f => f.value === cond.field)?.label || cond.field}</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>{cond.operator}</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{String(cond.value)}</span>
                <button
                  onClick={() => removeCondition(idx)}
                  style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  <Trash2 size={12} hover={{ color: '#ef4444' }} />
                </button>
              </div>
            ))}
            {conditions.length === 0 && (
              <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>No active filters. Showing all assets in this market.</span>
            )}
          </div>

          {/* New Condition Add Row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={newField}
              onChange={e => {
                setNewField(e.target.value);
                const type = FILTER_FIELDS.find(f => f.value === e.target.value)?.type;
                if (type === 'boolean') {
                  setNewValue('true');
                } else {
                  setNewValue('');
                }
              }}
              style={{ ...s.input, flex: 1, minWidth: 120 }}
            >
              {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            {activeFieldDef?.type !== 'boolean' && (
              <select
                value={newOperator}
                onChange={e => setNewOperator(e.target.value)}
                style={{ ...s.input, minWidth: 60 }}
              >
                {['<', '>', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            )}

            {activeFieldDef?.type === 'boolean' ? (
              <select
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                style={{ ...s.input, minWidth: 80 }}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type="number"
                placeholder="Value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                style={{ ...s.input, minWidth: 80, flex: 1 }}
              />
            )}

            <button onClick={addCondition} style={{ ...s.btn, background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}>
              <Plus size={14} /> Add
            </button>
            
            {conditions.length > 0 && (
              <button onClick={clearAllFilters} style={{ ...s.btn, background: 'transparent', color: '#64748b', border: 'none' }}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets & Controls */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Quick presets buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {presets.slice(0, 3).map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                style={{
                  ...s.btn,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  background: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Save Current Screen */}
            {saveOpen ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  style={{ ...s.input, padding: '5px 8px', fontSize: 12, width: 120 }}
                />
                <button onClick={handleSavePreset} style={{ ...s.btn, padding: '5px 10px', fontSize: 12, background: '#10b981', color: '#fff' }}>
                  <Check size={12} />
                </button>
                <button onClick={() => setSaveOpen(false)} style={{ ...s.btn, padding: '5px 10px', fontSize: 12, background: '#ef4444', color: '#fff' }}>
                  X
                </button>
              </div>
            ) : (
              <button onClick={() => setSaveOpen(true)} style={{ ...s.btn, padding: '6px 12px', background: '#090d16', color: '#94a3b8', border: '1px solid #1e293b' }}>
                <Save size={12} /> Save Preset
              </button>
            )}
            
            <button onClick={exportCSV} style={{ ...s.btn, padding: '6px 12px', background: '#090d16', color: '#94a3b8', border: '1px solid #1e293b' }}>
              <Download size={12} /> CSV
            </button>
          </div>
        </div>

        {/* Results list table */}
        <div style={{ ...s.card, padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
          
          {/* Table controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #1e293b' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
              {filteredResults.length} Instruments Found
            </span>

            {/* Sub exchange filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>Exchange:</span>
              <select
                value={selectedExchange}
                onChange={e => setSelectedExchange(e.target.value)}
                style={{ ...s.input, padding: '4px 8px', fontSize: 12 }}
              >
                {selectedMarket.exchanges.map(ex => <option key={ex} value={ex}>{ex}</option>)}
              </select>
              
              {/* Search results bar */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: 8 }} />
                <input
                  type="text"
                  placeholder="Quick Filter symbol/name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ ...s.input, padding: '4px 8px 4px 28px', fontSize: 12, width: 180 }}
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0, background: '#0b0f19', borderBottom: '1px solid #1e293b', zIndex: 10 }}>
                  <th style={{ padding: '8px 12px', width: 30 }} />
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Symbol</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Chg %</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>RSI (14)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#64748b', fontWeight: 600 }}>Rel Vol</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => {
                  const isActive = activeItem?.symbol === r.symbol;
                  const isChangePositive = r.change >= 0;
                  return (
                    <tr
                      key={r.symbol}
                      onClick={() => setActiveItem(r)}
                      style={{
                        borderBottom: '1px solid #0f172a',
                        background: isActive ? '#1e293b' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(r.symbol);
                        }}
                        style={{ padding: '8px 12px', textAlign: 'center' }}
                      >
                        <Star
                          size={14}
                          fill={watchlist.has(r.symbol) ? '#f59e0b' : 'transparent'}
                          color={watchlist.has(r.symbol) ? '#f59e0b' : '#64748b'}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, color: '#818cf8' }}>
                        {r.symbol}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#e2e8f0', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f1f5f9' }}>
                        {r.price?.toFixed(2)}
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: isChangePositive ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {isChangePositive ? '+' : ''}{r.change?.toFixed(2)}%
                      </td>
                      <td style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        color: r.rsi_14 > 70 ? '#ef4444' : r.rsi_14 < 30 ? '#10b981' : '#94a3b8'
                      }}>
                        {r.rsi_14 ? r.rsi_14.toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: r.relative_volume > 1.5 ? '#10b981' : '#f1f5f9' }}>
                        {r.relative_volume ? `${r.relative_volume.toFixed(1)}x` : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No instruments matched the active filter conditions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Live Chart & Technical Analysis */}
      <div style={{ ...s.card, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {activeItem ? (
          <>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>{activeItem.symbol}</span>
                  <span style={{ background: '#1e293b', color: '#94a3b8', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    {activeItem.market_type}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{activeItem.name}</div>
              </div>

              {/* Price Details */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace' }}>
                  {activeItem.price?.toFixed(2)}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: activeItem.change >= 0 ? '#10b981' : '#ef4444',
                  justifyContent: 'flex-end',
                  marginTop: 2
                }}>
                  {activeItem.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {activeItem.change >= 0 ? '+' : ''}{activeItem.change?.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Quick Watchlist & Metrics Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090d16', padding: '8px 12px', borderRadius: 8, border: '1px solid #1e293b', fontSize: 11 }}>
              <div style={{ display: 'flex', gap: 12, color: '#94a3b8' }}>
                <div><span style={{ color: '#64748b' }}>52W High:</span> <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>{activeItem.high_52w?.toFixed(2)}</span></div>
                <div><span style={{ color: '#64748b' }}>52W Low:</span> <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>{activeItem.low_52w?.toFixed(2)}</span></div>
                <div><span style={{ color: '#64748b' }}>Gap %:</span> <span style={{ fontFamily: 'monospace', color: activeItem.gap_pct >= 0 ? '#10b981' : '#ef4444' }}>{activeItem.gap_pct?.toFixed(2)}%</span></div>
              </div>
              <button
                onClick={() => toggleWatchlist(activeItem.symbol)}
                style={{
                  ...s.btn,
                  padding: '4px 10px',
                  fontSize: 11,
                  background: watchlist.has(activeItem.symbol) ? '#ef4444' : '#1e293b',
                  color: '#fff'
                }}
              >
                <Star size={11} fill={watchlist.has(activeItem.symbol) ? '#fff' : 'transparent'} />
                {watchlist.has(activeItem.symbol) ? 'Remove Watchlist' : 'Add Watchlist'}
              </button>
            </div>

            {/* Tab switchers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
              {[
                { id: 'chart', label: '📈 Chart' },
                { id: 'tech', label: '🔬 Tech Specs' },
                { id: 'fundamental', label: '💼 Fundamentals' },
                { id: 'ai', label: '💡 AI Analysis' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === t.id ? '2px solid #3b82f6' : 'none',
                    color: activeTab === t.id ? '#3b82f6' : '#64748b',
                    fontWeight: activeTab === t.id ? 700 : 500,
                    padding: '8px 16px',
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              
              {/* CHART TAB */}
              {activeTab === 'chart' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['1', '5', '15', '60', 'D', 'W'].map(time => (
                      <button
                        key={time}
                        onClick={() => setTvInterval(time)}
                        style={{
                          border: 'none',
                          background: tvInterval === time ? '#3b82f6' : '#1e293b',
                          color: tvInterval === time ? '#fff' : '#94a3b8',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        {time === '60' ? '1H' : time}
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, minHeight: 350 }}>
                    <TradingViewChart
                      symbol={activeItem.symbol}
                      marketType={activeItem.market_type}
                      interval={tvInterval}
                    />
                  </div>
                </div>
              )}

              {/* TECHNICAL SPECS TAB */}
              {activeTab === 'tech' && (
                <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    
                    {/* Technical values table */}
                    <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Indicators</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>RSI (14):</span><span style={{ fontFamily: 'monospace' }}>{activeItem.rsi_14?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SMA (20):</span><span style={{ fontFamily: 'monospace' }}>{activeItem.sma_20?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SMA (50):</span><span style={{ fontFamily: 'monospace' }}>{activeItem.sma_50?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>EMA (20):</span><span style={{ fontFamily: 'monospace' }}>{activeItem.ema_20?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>VWAP:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.vwap?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ATR:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.atr?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ADX:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.adx?.toFixed(1)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Stochastic:</span>
                          <span style={{ fontFamily: 'monospace' }}>%K: {activeItem.stochastic?.k} | %D: {activeItem.stochastic?.d}</span>
                        </div>
                      </div>
                    </div>

                    {/* Support & Resistance, Bollinger Bands */}
                    <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Bands & Key Levels</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>BB Upper:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.bollinger?.upper?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>BB Middle:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.bollinger?.middle?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>BB Lower:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.bollinger?.lower?.toFixed(2)}</span></div>
                        <div style={{ borderTop: '1px solid #1e293b', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Resistance:</span><span style={{ fontFamily: 'monospace', color: '#ef4444' }}>{activeItem.resistance?.toFixed(2)}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Support:</span><span style={{ fontFamily: 'monospace', color: '#10b981' }}>{activeItem.support?.toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Pattern alerts */}
                  <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Active Patterns</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      {[
                        { label: 'Golden Cross', value: activeItem.golden_cross },
                        { label: 'Death Cross', value: activeItem.death_cross },
                        { label: '20D Breakout', value: activeItem.breakout },
                        { label: '20D Breakdown', value: activeItem.breakdown },
                        { label: 'Higher High', value: activeItem.higher_high },
                        { label: 'Higher Low', value: activeItem.higher_low }
                      ].map(pat => (
                        <div
                          key={pat.label}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: pat.value ? '#1e1b4b' : '#090d16',
                            border: `1px solid ${pat.value ? '#4f46e5' : '#1e293b'}`,
                            padding: '4px 8px',
                            borderRadius: 4
                          }}
                        >
                          <span style={{ color: pat.value ? '#a5b4fc' : '#64748b' }}>{pat.label}</span>
                          <span style={{ fontWeight: 700, color: pat.value ? '#10b981' : '#475569' }}>{pat.value ? 'YES' : 'NO'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* FUNDAMENTALS TAB */}
              {activeTab === 'fundamental' && (
                <div style={{ height: '100%', overflowY: 'auto' }}>
                  {activeItem.marketCap ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Valuation Metrics</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Market Cap:</span><span style={{ fontFamily: 'monospace' }}>{(activeItem.marketCap / 1e9).toFixed(2)}B {activeItem.currency || 'USD'}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>P/E Ratio:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.pe}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>P/B Ratio:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.pb}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>EPS:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.eps}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Debt / Equity:</span><span style={{ fontFamily: 'monospace' }}>{activeItem.debtEquity}</span></div>
                        </div>
                      </div>
                      <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 8, textTransform: 'uppercase' }}>Growth & Returns</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ROE:</span><span style={{ fontFamily: 'monospace', color: '#10b981' }}>{activeItem.roe}%</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ROCE:</span><span style={{ fontFamily: 'monospace', color: '#10b981' }}>{activeItem.roce}%</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Revenue Growth:</span><span style={{ fontFamily: 'monospace', color: activeItem.revenueGrowth >= 0 ? '#10b981' : '#ef4444' }}>{activeItem.revenueGrowth}%</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Profit Growth:</span><span style={{ fontFamily: 'monospace', color: activeItem.profitGrowth >= 0 ? '#10b981' : '#ef4444' }}>{activeItem.profitGrowth}%</span></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13, background: '#090d16', border: '1px solid #1e293b', borderRadius: 8 }}>
                      Fundamental metrics are not applicable for {activeItem.symbol} ({activeItem.market_type}).
                    </div>
                  )}
                </div>
              )}

              {/* AI ANALYSIS TAB */}
              {activeTab === 'ai' && (
                <div style={{ height: '100%', overflowY: 'auto', background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
                  {aiAnalysisLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#64748b' }}>Groq AI conducting quantitative indicators audit...</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {aiAnalysis}
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#64748b' }}>
            <RotateCcw size={32} />
            <span style={{ fontSize: 14 }}>Select an instrument from the screener results to view live chart & analysis terminal.</span>
          </div>
        )}
      </div>
      
      {/* Dynamic Keyframes for simple spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
