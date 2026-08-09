"use client";

import React, { useState } from 'react';
import { Search, Star, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

const MOCK_DATA = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: '94,230.00', change: '+4.2%', isUp: true, vol: '45,231 BTC', cap: '$1.8T', category: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: '3,450.20', change: '+2.1%', isUp: true, vol: '320K ETH', cap: '$410B', category: 'Crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: '142.80', change: '-1.5%', isUp: false, vol: '5.2M SOL', cap: '$65B', category: 'Crypto' },
  { symbol: 'NVDA', name: 'Nvidia Corp', price: '140.50', change: '+2.8%', isUp: true, vol: '45.2M', cap: '$3.1T', category: 'Stocks' },
  { symbol: 'TSLA', name: 'Tesla Inc', price: '215.00', change: '-3.4%', isUp: false, vol: '110.5M', cap: '$650B', category: 'Stocks' },
  { symbol: 'AAPL', name: 'Apple Inc', price: '189.20', change: '+0.5%', isUp: true, vol: '35M', cap: '$2.9T', category: 'Stocks' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: '1.0905', change: '-0.1%', isUp: false, vol: '12M', cap: 'N/A', category: 'Forex' },
  { symbol: 'GBP/USD', name: 'British Pound', price: '1.2750', change: '+0.3%', isUp: true, vol: '8.5M', cap: 'N/A', category: 'Forex' },
  { symbol: 'USD/JPY', name: 'US Dollar / Yen', price: '149.30', change: '+0.4%', isUp: true, vol: '15M', cap: 'N/A', category: 'Forex' },
];

export function WatchlistModule({ category = 'All' }: { category?: 'All' | 'Stocks' | 'Crypto' | 'Forex' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { setActiveSymbol, setActiveTab } = useDashboardStore();

  const filteredData = MOCK_DATA.filter(item => 
    (category === 'All' || item.category === category) &&
    (item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRowClick = (symbol: string) => {
    setActiveSymbol(symbol);
    setActiveTab('Dashboard');
  };

  const getTitle = () => {
    if (category === 'All') return 'Watchlist';
    return `${category} Markets`;
  };

  return (
    <div className="flex flex-col h-full gap-4 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{getTitle()}</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search symbols or names..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Symbol</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Price</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">24h Change</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Volume</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Market Cap</th>
                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(item.symbol)}
                  className="border-b border-border/50 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <button className="text-muted-foreground hover:text-warning transition-colors">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-bold group-hover:text-primary transition-colors">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.name}</div>
                  </td>
                  <td className="p-4 text-right font-mono font-medium">
                    {item.price}
                  </td>
                  <td className="p-4 text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${item.isUp ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}`}>
                      {item.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {item.change}
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground">
                    {item.vol}
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground">
                    {item.cap}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No {category !== 'All' ? category : ''} symbols found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
