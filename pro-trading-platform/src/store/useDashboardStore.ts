import { create } from 'zustand';

type Timeframe = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W';
type AppTab = 'Dashboard' | 'Stocks' | 'Crypto' | 'Forex' | 'Watchlist' | 'Portfolio' | 'Alerts' | 'News' | 'Economic Calendar' | 'Settings';

interface DashboardState {
  activeSymbol: string;
  activeTimeframe: Timeframe;
  activeTab: AppTab;
  setActiveSymbol: (symbol: string) => void;
  setActiveTimeframe: (tf: Timeframe) => void;
  setActiveTab: (tab: AppTab) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeSymbol: 'BTC/USD',
  activeTimeframe: '1D',
  activeTab: 'Dashboard',
  setActiveSymbol: (symbol) => set({ activeSymbol: symbol }),
  setActiveTimeframe: (tf) => set({ activeTimeframe: tf }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
