"use client";

import React, { useState, useEffect, useRef } from 'react';
import { screenerAPI, aiAPI, watchlistAPI, marketAPI } from '@/lib/api';
import {
  Search, Filter, Download, Sparkles, Plus, Trash2, Save, Star,
  Play, RotateCcw, Check, ArrowUpRight, ArrowDownRight, Grid, Award, HardDrive
} from 'lucide-react';
import { TradingChart } from '@/components/chart/TradingChart';
import { useAuthStore } from '@/store/useAuthStore';

interface MarketDef {
  id: string;
  label: string;
  type: string;
  exchanges: string[];
}

const MARKETS: MarketDef[] = [
  { id: 'indian', label: '🇮🇳 Indian Market', type: 'equity', exchanges: ['NSE', 'BSE'] },
  { id: 'american', label: '🇺🇸 American Market', type: 'equity', exchanges: ['NASDAQ', 'NYSE', 'AMEX'] },
  { id: 'crypto', label: '₿ Crypto', type: 'crypto', exchanges: ['BINANCE'] },
  { id: 'forex', label: '💱 Forex', type: 'forex', exchanges: ['FX'] },
  { id: 'commodity', label: '🛢️ Commodities', type: 'commodity', exchanges: ['COMEX', 'NYMEX'] },
  { id: 'indices', label: '📊 Indices', type: 'index', exchanges: ['NSE', 'BSE', 'NASDAQ', 'NYSE'] }
];

interface FieldDef {
  value: string;
  label: string;
  type: 'number' | 'boolean';
}

const FILTER_FIELDS: FieldDef[] = [
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

interface Condition {
  field: string;
  operator: string;
  value: any;
}

function formatNumber(val: any, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(Number(val))) return '—';
  return Number(val).toFixed(decimals);
}

export function ScreenerModule() {
  const { user, token, initialize } = useAuthStore();
  const [selectedMarket, setSelectedMarket] = useState<MarketDef>(MARKETS[0]);
  const [selectedExchange, setSelectedExchange] = useState<string>(MARKETS[0].exchanges[0]);
  
  // Dynamic filter state
  const [logicalOperator, setLogicalOperator] = useState<string>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);
  
  // New condition builder state
  const [newField, setNewField] = useState<string>(FILTER_FIELDS[0].value);
  const [newOperator, setNewOperator] = useState<string>('<');
  const [newValue, setNewValue] = useState<string>('');

  // Presets and presets loading
  const [presets, setPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [saveOpen, setSaveOpen] = useState<boolean>(false);

  // Search & Results state
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // AI query state
  const [nlQuery, setNlQuery] = useState<string>('');
  const [nlLoading, setNlLoading] = useState<boolean>(false);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Selected details panel state
  const [activeItem, setActiveItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('chart'); // 'chart' | 'tech' | 'fundamental' | 'ai'
  const [tvInterval, setTvInterval] = useState<string>('D');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState<boolean>(false);

  // Polling ref
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth & fetch data
  useEffect(() => {
    initialize();
    fetchPresets();
    fetchWatchlist();
    runScreener();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token]);

  // Run screener when market or exchange changes
  useEffect(() => {
    runScreener();
  }, [selectedMarket, selectedExchange]);

  // Handle polling when active instrument changes
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!activeItem) return;

    fetchActiveItemQuote();
    fetchActiveItemAnalysis();

    pollingRef.current = setInterval(() => {
      fetchActiveItemQuote();
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeItem?.symbol]);

  const fetchPresets = async () => {
    if (!token) return;
    try {
      const { data } = await screenerAPI.getPresets();
      setPresets(data);
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
  };

  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      const { data } = await watchlistAPI.get();
      setWatchlist(new Set(data.map((item: any) => item.symbol)));
    } catch (e) {
      console.error('Failed to load watchlist:', e);
    }
  };

  const toggleWatchlist = async (symbol: string) => {
    if (!token) {
      alert("Please log in to manage your watchlist.");
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

  const runScreener = async (overrideConditions: Condition[] | null = null) => {
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
        if (!activeItem || !data.results.some((r: any) => r.symbol === activeItem.symbol)) {
          setActiveItem(data.results[0]);
        } else {
          // Keep active but refresh indicators
          const updated = data.results.find((r: any) => r.symbol === activeItem.symbol);
          if (updated) setActiveItem(updated);
        }
      } else {
        setActiveItem(null);
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
          
          const marketCond = parsed.conditions.find((c: any) => c.field === 'market_type');
          if (marketCond && marketCond.operator === '==') {
            const m = MARKETS.find(market => market.type === marketCond.value);
            if (m) {
              setSelectedMarket(m);
              const exchangeCond = parsed.conditions.find((c: any) => c.field === 'exchange');
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

  const loadPreset = (preset: any) => {
    if (preset.filters) {
      setConditions(preset.filters.conditions || []);
      setLogicalOperator(preset.filters.logical_operator || 'AND');
      runScreener(preset.filters.conditions);
    }
  };

  const addCondition = () => {
    const fieldDef = FILTER_FIELDS.find(f => f.value === newField);
    if (!fieldDef) return;
    const condValue = fieldDef.type === 'boolean' ? (newValue.toLowerCase() === 'true') : Number(newValue);
    
    if (newValue === '' && fieldDef.type !== 'boolean') return;

    const newCond: Condition = {
      field: newField,
      operator: fieldDef.type === 'boolean' ? '==' : newOperator,
      value: condValue
    };
    const nextConds = [...conditions, newCond];
    setConditions(nextConds);
    setNewValue('');
    runScreener(nextConds);
  };

  const removeCondition = (index: number) => {
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
      setActiveItem((prev: any) => {
        if (prev && prev.symbol === data.symbol) {
          return { ...prev, price: data.price, change: Number(data.change) };
        }
        return prev;
      });
    } catch (e: any) {
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

  const filteredResults = results.filter(r => 
    r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeFieldDef = FILTER_FIELDS.find(f => f.value === newField);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)] overflow-hidden w-full text-foreground">
      
      {/* LEFT TERMINAL - 7 Columns */}
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto pr-1 h-full">
        
        {/* Market selector tabs */}
        <div className="bg-card rounded-xl border border-border p-2 flex flex-wrap gap-2 shrink-0">
          {MARKETS.map(market => {
            const isSelected = selectedMarket.id === market.id;
            return (
              <button
                key={market.id}
                onClick={() => {
                  setSelectedMarket(market);
                  setSelectedExchange(market.exchanges[0]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(62,166,255,0.25)]' 
                    : 'bg-transparent text-muted-foreground border-border hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {market.label}
              </button>
            );
          })}
        </div>

        {/* AI Assistant query panel */}
        <div className="bg-card rounded-xl border border-primary/20 p-4 shrink-0 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent" />
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">AI Screener Assistant (Groq Llama 3)</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNlRun()}
              placeholder='Try: "Find NASDAQ stocks with P/E less than 25 and RSI below 60"'
              className="flex-1 bg-background/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={handleNlRun}
              disabled={nlLoading}
              className="bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {nlLoading ? 'Analyzing...' : <><Sparkles className="w-4 h-4" /> Screen</>}
            </button>
          </div>
        </div>

        {/* Dynamic Filters Builder */}
        <div className="bg-card rounded-xl border border-border p-4 shrink-0 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Active Filter Logic</span>
            </div>
            
            {/* Logic Toggle */}
            <div className="flex bg-background border border-border rounded-lg p-1">
              {['AND', 'OR'].map(op => (
                <button
                  key={op}
                  onClick={() => { setLogicalOperator(op); runScreener(); }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    logicalOperator === op 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Active condition tags */}
          <div className="flex flex-wrap gap-2 min-h-[30px] items-center">
            {conditions.map((cond, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1 text-xs"
              >
                <span className="text-muted-foreground">
                  {FILTER_FIELDS.find(f => f.value === cond.field)?.label || cond.field}
                </span>
                <span className="text-negative font-bold font-mono">{cond.operator}</span>
                <span className="text-primary font-mono font-semibold">{String(cond.value)}</span>
                <button
                  onClick={() => removeCondition(idx)}
                  className="text-muted-foreground hover:text-negative transition-colors ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {conditions.length === 0 && (
              <span className="text-xs text-muted-foreground font-medium italic">No active filters. Showing all assets in this market.</span>
            )}
          </div>

          {/* New Condition Add Row */}
          <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-border">
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
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
            >
              {FILTER_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            {activeFieldDef?.type !== 'boolean' && (
              <select
                value={newOperator}
                onChange={e => setNewOperator(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              >
                {['<', '>', '==', '!=', '>=', '<='].map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            )}

            {activeFieldDef?.type === 'boolean' ? (
              <select
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
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
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground w-20"
              />
            )}

            <button 
              onClick={addCondition} 
              className="bg-secondary hover:bg-secondary/80 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Condition
            </button>
            
            {conditions.length > 0 && (
              <button 
                onClick={clearAllFilters} 
                className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Quick Presets & Controls */}
        <div className="flex gap-4 items-center justify-between shrink-0">
          <div className="flex gap-2 flex-wrap">
            {presets.slice(0, 3).map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold bg-card border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {saveOpen ? (
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none w-28"
                />
                <button 
                  onClick={handleSavePreset} 
                  className="bg-positive hover:bg-positive/90 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setSaveOpen(false)} 
                  className="bg-negative hover:bg-negative/90 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setSaveOpen(true)} 
                className="bg-card hover:bg-card/85 text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save Preset
              </button>
            )}
            
            <button 
              onClick={exportCSV} 
              className="bg-card hover:bg-card/85 text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>

        {/* Results list table */}
        <div className="bg-card rounded-xl border border-border flex-1 flex flex-col min-h-[250px] overflow-hidden">
          
          {/* Table Header controls */}
          <div className="flex justify-between items-center p-3 border-b border-border bg-background/50 flex-wrap gap-2">
            <span className="text-xs font-bold text-foreground">
              {filteredResults.length} Instruments Found
            </span>

            {/* Sub exchange filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Exchange:</span>
                <select
                  value={selectedExchange}
                  onChange={e => setSelectedExchange(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                >
                  {selectedMarket.exchanges.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              </div>
              
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5" />
                <input
                  type="text"
                  placeholder="Quick Filter..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-background border border-border rounded-lg pl-8 pr-3 py-1 text-xs text-foreground focus:outline-none w-36"
                />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="sticky top-0 bg-card border-b border-border z-10">
                  <th className="p-3 w-10 text-center" />
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Price</th>
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Chg %</th>
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">RSI (14)</th>
                  <th className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Rel Vol</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, index) => {
                  const isActive = activeItem?.symbol === r.symbol;
                  const isChangePositive = Number(r.change) >= 0;
                  return (
                    <tr
                      key={r.symbol || index}
                      onClick={() => setActiveItem(r)}
                      className={`border-b border-border/40 hover:bg-white/5 cursor-pointer transition-colors ${
                        isActive ? 'bg-primary/10 hover:bg-primary/15' : ''
                      }`}
                    >
                      <td
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(r.symbol);
                        }}
                        className="p-3 text-center"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            watchlist.has(r.symbol) 
                              ? 'fill-warning text-warning' 
                              : 'text-muted-foreground hover:text-warning'
                          }`}
                        />
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-primary">
                        {r.symbol}
                      </td>
                      <td className="p-3 text-xs text-foreground max-w-[120px] truncate">
                        {r.name}
                      </td>
                      <td className="p-3 text-right font-mono text-xs font-medium">
                        {formatNumber(r.price, 2)}
                      </td>
                      <td className={`p-3 text-right font-mono text-xs font-bold ${
                        isChangePositive ? 'text-positive' : 'text-negative'
                      }`}>
                        {isChangePositive ? '+' : ''}{formatNumber(r.change, 2)}%
                      </td>
                      <td className={`p-3 text-right font-mono text-xs font-semibold ${
                        Number(r.rsi_14) > 70 ? 'text-negative' : Number(r.rsi_14) < 30 ? 'text-positive' : 'text-muted-foreground'
                      }`}>
                        {formatNumber(r.rsi_14, 1)}
                      </td>
                      <td className="p-3 text-right font-mono text-xs text-muted-foreground">
                        {r.relative_volume ? `${formatNumber(r.relative_volume, 1)}x` : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs italic">
                      No instruments matched the active filter conditions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT DETAIL PANEL - 5 Columns */}
      <div className="lg:col-span-5 bg-card rounded-xl border border-border p-4 flex flex-col gap-4 overflow-hidden h-full shadow-lg">
        {activeItem ? (
          <>
            {/* Header info */}
            <div className="flex justify-between items-start shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono text-foreground">{activeItem.symbol}</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    {activeItem.market_type}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{activeItem.name}</div>
              </div>

              {/* Price Details */}
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-foreground">
                  {formatNumber(activeItem.price, 2)}
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-bold justify-end mt-0.5 ${
                  Number(activeItem.change) >= 0 ? 'text-positive' : 'text-negative'
                }`}>
                  {Number(activeItem.change) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Number(activeItem.change) >= 0 ? '+' : ''}{formatNumber(activeItem.change, 2)}%
                </div>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="flex justify-between items-center bg-background border border-border p-2.5 rounded-lg text-[11px] shrink-0">
              <div className="flex gap-3 text-muted-foreground font-medium">
                <div><span>52W H:</span> <span className="font-mono text-foreground ml-0.5">{formatNumber(activeItem.high_52w, 2)}</span></div>
                <div><span>52W L:</span> <span className="font-mono text-foreground ml-0.5">{formatNumber(activeItem.low_52w, 2)}</span></div>
                <div><span>Gap %:</span> <span className={`font-mono ml-0.5 font-bold ${Number(activeItem.gap_pct) >= 0 ? 'text-positive' : 'text-negative'}`}>{formatNumber(activeItem.gap_pct, 2)}%</span></div>
              </div>
              <button
                onClick={() => toggleWatchlist(activeItem.symbol)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                  watchlist.has(activeItem.symbol) 
                    ? 'bg-negative text-white hover:bg-negative/90' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-[0_0_8px_rgba(62,166,255,0.2)]'
                }`}
              >
                <Star className={`w-3 h-3 ${watchlist.has(activeItem.symbol) ? 'fill-white' : ''}`} />
                {watchlist.has(activeItem.symbol) ? 'Remove Watchlist' : 'Add Watchlist'}
              </button>
            </div>

            {/* Tab switchers */}
            <div className="flex border-b border-border shrink-0">
              {[
                { id: 'chart', label: '📈 Chart' },
                { id: 'tech', label: '🔬 Tech Specs' },
                { id: 'fundamental', label: '💼 Fundamentals' },
                { id: 'ai', label: '💡 AI Analysis' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 text-xs font-bold transition-all border-b-2 bg-transparent ${
                    activeTab === t.id 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden relative min-h-0">
              
              {/* CHART TAB */}
              {activeTab === 'chart' && (
                <div className="h-full flex flex-col gap-2">
                  <div className="flex gap-1.5 shrink-0">
                    {['1', '5', '15', '60', 'D', 'W'].map(time => (
                      <button
                        key={time}
                        onClick={() => setTvInterval(time)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          tvInterval === time 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {time === '60' ? '1H' : time}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 bg-background/50 rounded-lg overflow-hidden border border-border">
                    <TradingChart 
                      key={`${activeItem.symbol}-${tvInterval}`}
                      symbol={activeItem.symbol} 
                      marketType={activeItem.market_type}
                      interval={tvInterval} 
                    />
                  </div>
                </div>
              )}

              {/* TECH SPECS TAB */}
              {activeTab === 'tech' && (
                <div className="h-full overflow-y-auto pr-1 space-y-4">
                  {/* Pattern Badges */}
                  <div className="bg-background/40 border border-border rounded-xl p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-warning" /> Pattern Signal & Alerts
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <SignalBadge active={activeItem.golden_cross} label="Golden Cross (Bullish)" positive />
                      <SignalBadge active={activeItem.death_cross} label="Death Cross (Bearish)" positive={false} />
                      <SignalBadge active={activeItem.breakout} label="20D High Breakout" positive />
                      <SignalBadge active={activeItem.breakdown} label="20D Low Breakdown" positive={false} />
                      <SignalBadge active={activeItem.higher_high} label="Higher High" positive />
                      <SignalBadge active={activeItem.higher_low} label="Higher Low" positive />
                    </div>
                  </div>

                  {/* Indicators Grid */}
                  <div className="bg-background/40 border border-border rounded-xl p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                      <Grid className="w-3.5 h-3.5 text-primary" /> Key Indicators
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <IndicatorRow label="RSI (14)" value={formatNumber(activeItem.rsi_14, 1)} />
                      <IndicatorRow label="SMA (20)" value={formatNumber(activeItem.sma_20, 2)} />
                      <IndicatorRow label="SMA (50)" value={formatNumber(activeItem.sma_50, 2)} />
                      <IndicatorRow label="EMA (20)" value={formatNumber(activeItem.ema_20, 2)} />
                      <IndicatorRow label="ATR" value={formatNumber(activeItem.atr, 3)} />
                      <IndicatorRow label="ADX" value={formatNumber(activeItem.adx, 1)} />
                      <IndicatorRow label="VWAP" value={formatNumber(activeItem.vwap, 2)} />
                      <IndicatorRow label="Support" value={formatNumber(activeItem.support, 2)} />
                      <IndicatorRow label="Resistance" value={formatNumber(activeItem.resistance, 2)} />
                      <IndicatorRow label="Stochastic %K" value={formatNumber(activeItem.stochastic?.k, 1)} />
                    </div>
                  </div>

                  {/* MACD Spec */}
                  {activeItem.macd && (
                    <div className="bg-background/40 border border-border rounded-xl p-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">MACD Detail</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                        <IndicatorRow label="MACD Line" value={formatNumber(activeItem.macd.macdLine, 4)} />
                        <IndicatorRow label="Signal Line" value={formatNumber(activeItem.macd.signalLine, 4)} />
                        <IndicatorRow label="Histogram" value={formatNumber(activeItem.macd.histogram, 4)} />
                        <IndicatorRow label="Signal" value={activeItem.macd.signal} className={activeItem.macd.signal === 'Bullish' ? 'text-positive' : 'text-negative'} />
                      </div>
                    </div>
                  )}

                  {/* Bollinger Spec */}
                  {activeItem.bollinger && (
                    <div className="bg-background/40 border border-border rounded-xl p-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Bollinger Bands</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                        <div className="bg-background border border-border rounded p-2">
                          <div className="text-[10px] text-muted-foreground">Upper</div>
                          <div className="font-semibold mt-1">{formatNumber(activeItem.bollinger.upper, 2)}</div>
                        </div>
                        <div className="bg-background border border-border rounded p-2">
                          <div className="text-[10px] text-muted-foreground">Basis</div>
                          <div className="font-semibold mt-1">{formatNumber(activeItem.bollinger.middle, 2)}</div>
                        </div>
                        <div className="bg-background border border-border rounded p-2">
                          <div className="text-[10px] text-muted-foreground">Lower</div>
                          <div className="font-semibold mt-1">{formatNumber(activeItem.bollinger.lower, 2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FUNDAMENTALS TAB */}
              {activeTab === 'fundamental' && (
                <div className="h-full overflow-y-auto pr-1">
                  <div className="bg-background/40 border border-border rounded-xl p-3.5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-primary" /> Key Ratios & Valuations
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <RatioBox label="P/E Ratio" value={formatNumber(activeItem.pe, 1)} />
                      <RatioBox label="P/B Ratio" value={formatNumber(activeItem.pb, 1)} />
                      <RatioBox label="EPS" value={formatNumber(activeItem.eps, 2)} />
                      <RatioBox label="ROE %" value={activeItem.roe ? `${formatNumber(activeItem.roe, 1)}%` : '—'} />
                      <RatioBox label="ROCE %" value={activeItem.roce ? `${formatNumber(activeItem.roce, 1)}%` : '—'} />
                      <RatioBox label="Debt to Equity" value={formatNumber(activeItem.debtEquity, 2)} />
                      <RatioBox label="Revenue Growth %" value={activeItem.revenueGrowth ? `+${formatNumber(activeItem.revenueGrowth, 1)}%` : '—'} />
                      <RatioBox label="Profit Growth %" value={activeItem.profitGrowth ? `+${formatNumber(activeItem.profitGrowth, 1)}%` : '—'} />
                    </div>
                  </div>
                </div>
              )}

              {/* AI ANALYSIS TAB */}
              {activeTab === 'ai' && (
                <div className="h-full overflow-y-auto pr-1">
                  {aiAnalysisLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground text-xs gap-3">
                      <Sparkles className="w-6 h-6 animate-pulse text-primary" />
                      <span>Requesting Llama 3.1 Quantitative Model...</span>
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed space-y-3 p-3 bg-primary/5 rounded-xl border border-primary/10 text-foreground font-medium">
                      <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider text-[10px] mb-2">
                        <Sparkles className="w-3.5 h-3.5" /> AI Real-Time Report
                      </div>
                      <div className="whitespace-pre-line text-muted-foreground">
                        {aiAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs">
            Select an instrument from the screener list to view deep-dive analytics.
          </div>
        )}
      </div>

    </div>
  );
}

function SignalBadge({ active, label, positive }: { active: boolean; label: string; positive: boolean }) {
  if (!active) return null;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
      positive 
        ? 'bg-positive/10 border-positive/30 text-positive shadow-[0_0_8px_rgba(0,200,83,0.15)]' 
        : 'bg-negative/10 border-negative/30 text-negative shadow-[0_0_8px_rgba(255,82,82,0.15)]'
    }`}>
      {label}
    </span>
  );
}

function IndicatorRow({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/30 pb-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold text-foreground ${className}`}>{value}</span>
    </div>
  );
}

function RatioBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background border border-border p-3 rounded-lg flex flex-col justify-center">
      <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
      <div className="font-mono text-sm font-bold text-foreground mt-1">{value}</div>
    </div>
  );
}
