"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { TradingChart } from '@/components/chart/TradingChart';
import { WatchlistModule } from '@/components/modules/WatchlistModule';
import { useDashboardStore } from '@/store/useDashboardStore';
import { Clock, TrendingUp } from 'lucide-react';

export default function Home() {
  const { activeSymbol, activeTimeframe, setActiveTimeframe, activeTab } = useDashboardStore();

  const timeframes = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'] as const;

  // Map our display symbol to TradingView symbol
  const getTvSymbol = (sym: string) => {
    if (sym === 'BTC/USD') return 'BINANCE:BTCUSD';
    if (sym === 'EUR/USD') return 'FX:EURUSD';
    if (sym === 'NVDA') return 'NASDAQ:NVDA';
    if (sym === 'TSLA') return 'NASDAQ:TSLA';
    return sym;
  };

  // Map our display timeframe to TradingView interval
  const getTvInterval = (tf: string) => {
    const map: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1H': '60',
      '4H': '240',
      '1D': 'D',
      '1W': 'W',
    };
    return map[tf] || 'D';
  };

  // Mock data for bottom metrics based on active symbol
  const getMetrics = (sym: string) => {
    const data: Record<string, any> = {
      'BTC/USD': { high: '95,100.00', low: '90,400.00', vol: '45,231 BTC', cap: '$1.8T' },
      'NVDA': { high: '140.50', low: '132.10', vol: '45.2M', cap: '$3.1T' },
      'TSLA': { high: '215.00', low: '205.50', vol: '110.5M', cap: '$650B' },
      'EUR/USD': { high: '1.0905', low: '1.0810', vol: '12M', cap: 'N/A' },
    };
    return data[sym] || { high: '--', low: '--', vol: '--', cap: '--' };
  };

  const metrics = getMetrics(activeSymbol);

  const renderDashboard = () => (
    <div className="flex flex-col h-full gap-4">
      {/* CHART AREA HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{activeSymbol}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-positive font-mono text-lg">Live Data Connected</span>
            <span className="text-positive bg-positive/10 px-2 py-0.5 rounded text-xs">TV API</span>
          </div>
        </div>
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button 
              key={tf} 
              onClick={() => setActiveTimeframe(tf as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTimeframe === tf 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ACTUAL CHART */}
      <div className="flex-1 bg-card rounded-xl border border-border flex items-center justify-center relative overflow-hidden p-0.5">
        <TradingChart 
          key={`${activeSymbol}-${activeTimeframe}`} 
          symbol={getTvSymbol(activeSymbol)} 
          interval={getTvInterval(activeTimeframe)} 
        />
      </div>

      {/* BOTTOM METRICS */}
      <div className="grid grid-cols-4 gap-4 h-24 shrink-0">
        {[
          { label: '24h High', val: metrics.high },
          { label: '24h Low', val: metrics.low },
          { label: '24h Volume', val: metrics.vol },
          { label: 'Market Cap', val: metrics.cap },
        ].map((metric) => (
          <div key={metric.label} className="bg-card rounded-xl border border-border p-4 flex flex-col justify-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{metric.label}</div>
            <div className="font-mono text-lg mt-1">{metric.val}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
        <Clock className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{activeTab} Module</h2>
      <p className="text-muted-foreground max-w-md">
        The {activeTab} view is currently under development. It will be fully integrated with real-time data in the next phase.
      </p>
      <button 
        onClick={() => useDashboardStore.getState().setActiveTab('Dashboard')}
        className="mt-8 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
      >
        Return to Dashboard
      </button>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'Dashboard') return renderDashboard();
    if (activeTab === 'Watchlist') return <WatchlistModule category="All" />;
    if (activeTab === 'Stocks') return <WatchlistModule category="Stocks" />;
    if (activeTab === 'Crypto') return <WatchlistModule category="Crypto" />;
    if (activeTab === 'Forex') return <WatchlistModule category="Forex" />;
    return renderPlaceholder();
  };

  return (
    <AppLayout>
      {renderContent()}
    </AppLayout>
  );
}
