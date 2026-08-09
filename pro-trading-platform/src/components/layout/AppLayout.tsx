"use client";

import React from 'react';
import { 
  LineChart, 
  Wallet, 
  Bell, 
  Newspaper, 
  Calendar, 
  Settings,
  Search,
  User,
  Activity,
  BarChart2,
  TrendingUp,
  Globe
} from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Activity className="w-6 h-6" />
            <span>MarketLens Pro</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            <NavItem 
              icon={<BarChart2 />} 
              label="Dashboard" 
              active={activeTab === 'Dashboard'} 
              onClick={() => setActiveTab('Dashboard')} 
            />
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Markets
            </div>
            <NavItem icon={<TrendingUp />} label="Stocks" active={activeTab === 'Stocks'} onClick={() => setActiveTab('Stocks')} />
            <NavItem icon={<Globe />} label="Crypto" active={activeTab === 'Crypto'} onClick={() => setActiveTab('Crypto')} />
            <NavItem icon={<LineChart />} label="Forex" active={activeTab === 'Forex'} onClick={() => setActiveTab('Forex')} />
            
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tools
            </div>
            <NavItem icon={<LineChart />} label="Watchlist" active={activeTab === 'Watchlist'} onClick={() => setActiveTab('Watchlist')} />
            <NavItem icon={<Wallet />} label="Portfolio" active={activeTab === 'Portfolio'} onClick={() => setActiveTab('Portfolio')} />
            <NavItem icon={<Bell />} label="Alerts" active={activeTab === 'Alerts'} onClick={() => setActiveTab('Alerts')} />
            <NavItem icon={<Newspaper />} label="News" active={activeTab === 'News'} onClick={() => setActiveTab('News')} />
            <NavItem icon={<Calendar />} label="Economic Calendar" active={activeTab === 'Economic Calendar'} onClick={() => setActiveTab('Economic Calendar')} />
          </nav>
        </div>
        <div className="p-4 border-t border-border">
          <NavItem icon={<Settings />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP NAVIGATION */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center flex-1">
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search markets, symbols, or news..." 
                className="w-full bg-background/50 border border-border rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/30 transition-colors">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* CONTENT ROW */}
        <div className="flex-1 flex overflow-hidden">
          {/* CENTER CHART / MAIN AREA */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
            {children}
          </main>

          {/* RIGHT PANEL */}
          <aside className="w-80 border-l border-border bg-card/30 hidden lg:flex flex-col">
            <div className="p-4 border-b border-border font-semibold">
              Market Overview
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Gainers</h3>
                <div className="space-y-3">
                  <MiniTicker symbol="BTC/USD" price="94,230.00" change="+4.2%" up />
                  <MiniTicker symbol="NVDA" price="135.40" change="+2.8%" up />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Top Losers</h3>
                <div className="space-y-3">
                  <MiniTicker symbol="TSLA" price="210.50" change="-1.5%" up={false} />
                  <MiniTicker symbol="EUR/USD" price="1.0850" change="-0.3%" up={false} />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function MiniTicker({ symbol, price, change, up }: { symbol: string, price: string, change: string, up: boolean }) {
  const { setActiveSymbol } = useDashboardStore();
  
  return (
    <div 
      onClick={() => setActiveSymbol(symbol)}
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer group"
    >
      <div>
        <div className="font-semibold text-sm group-hover:text-primary transition-colors">{symbol}</div>
        <div className="text-xs text-muted-foreground mt-0.5">Vol: 1.2B</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm">{price}</div>
        <div className={`text-xs font-medium mt-0.5 ${up ? 'text-positive' : 'text-negative'}`}>
          {change}
        </div>
      </div>
    </div>
  );
}
