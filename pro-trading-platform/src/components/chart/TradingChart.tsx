"use client";

import React, { useEffect, useState, useRef } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { createChart, ColorType } from 'lightweight-charts';
import { marketAPI } from '@/lib/api';

export function normalizeSymbolForTV(symbol: string, marketType: string = 'equity'): string {
  if (!symbol) return 'NASDAQ:AAPL';
  const clean = symbol.toUpperCase();

  // If already contains exchange prefix (e.g. BINANCE:BTCUSDT or BSE:RELIANCE), return as is
  if (clean.includes(':')) {
    return clean;
  }

  // Handle slash-separated symbols (e.g. BTC/USD, EUR/USD)
  if (clean.includes('/')) {
    const parts = clean.split('/');
    const first = parts[0];
    const second = parts[1];
    
    // Crypto check
    if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE'].includes(first)) {
      return `BINANCE:${first}USDT`;
    }
    
    // Forex check
    if (first.length === 3 && second.length === 3) {
      return `FX:${first}${second}`;
    }
    
    // Fallback if it contains slash but not recognized
    return clean.replace('/', '');
  }

  // Indian equities
  if (clean.endsWith('.NS')) {
    return `NSE:${clean.slice(0, -3)}`;
  }
  if (clean.endsWith('.BO')) {
    return `BSE:${clean.slice(0, -3)}`;
  }

  // Indices
  if (clean === '^NSEI') return 'NSE:NIFTY';
  if (clean === '^BSESN') return 'BSE:SENSEX';
  if (clean === '^GSPC') return 'SP:SPX';
  if (clean === '^IXIC') return 'NASDAQ:IXIC';
  if (clean === '^DJI') return 'DJ:DJI';

  // Forex
  if (clean.endsWith('=X')) {
    return `FX:${clean.slice(0, -2)}`;
  }

  // Cryptocurrencies
  if (clean.endsWith('-USD')) {
    const sym = clean.split('-')[0];
    if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE'].includes(sym)) {
      return `BINANCE:${sym}USDT`;
    }
    return `COINBASE:${sym}USD`;
  }

  // Commodities
  if (clean === 'GC=F') return 'COMEX:GC1!';
  if (clean === 'SI=F') return 'COMEX:SI1!';
  if (clean === 'CL=F') return 'NYMEX:CL1!';
  if (clean === 'NG=F') return 'NYMEX:NG1!';

  // US equities
  const nyseStocks = ['JPM', 'KO', 'DIS'];
  if (nyseStocks.includes(clean)) {
    return `NYSE:${clean}`;
  }
  const amexEtfs = ['SPY', 'IVV'];
  if (amexEtfs.includes(clean)) {
    return `AMEX:${clean}`;
  }

  // Fallback
  if (marketType === 'equity') {
    return `NASDAQ:${clean}`;
  }
  return clean;
}

interface TradingChartProps {
  symbol?: string;
  marketType?: string;
  theme?: "light" | "dark";
  interval?: string;
}

function LocalTradingChart({ symbol, theme = "dark" }: { symbol: string; theme?: "light" | "dark" }) {
  const [ohlcv, setOhlcv] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    
    marketAPI.getOHLCV(symbol)
      .then(res => {
        if (!active) return;
        if (Array.isArray(res.data) && res.data.length > 0) {
          setOhlcv(res.data);
        } else {
          setError('No historical data available for this symbol.');
        }
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err.message || 'Failed to fetch historical data.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (loading || error || ohlcv.length === 0 || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const isDark = theme === 'dark';

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1C1C1E' : '#FFFFFF' },
        textColor: isDark ? '#D9D9D9' : '#1C1C1E',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      width: container.clientWidth,
      height: 450,
      timeScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Map and format data
    const chartData = ohlcv.map(item => {
      const o = parseFloat(item.open_price ?? item.open ?? item.close_price ?? item.close ?? 0);
      const h = parseFloat(item.high_price ?? item.high ?? item.close_price ?? item.close ?? 0);
      const l = parseFloat(item.low_price ?? item.low ?? item.close_price ?? item.close ?? 0);
      const c = parseFloat(item.close_price ?? item.close ?? 0);
      
      return {
        time: item.date, // 'YYYY-MM-DD'
        open: o,
        high: h,
        low: l,
        close: c,
      };
    });

    const volumeData = ohlcv.map(item => {
      const o = parseFloat(item.open_price ?? item.open ?? item.close_price ?? item.close ?? 0);
      const c = parseFloat(item.close_price ?? item.close ?? 0);
      return {
        time: item.date,
        value: parseFloat(item.volume || 0),
        color: c >= o ? 'rgba(38, 166, 154, 0.35)' : 'rgba(239, 83, 80, 0.35)',
      };
    });

    // Sort to guarantee ascending order
    chartData.sort((a, b) => a.time.localeCompare(b.time));
    volumeData.sort((a, b) => a.time.localeCompare(b.time));

    candlestickSeries.setData(chartData);
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [ohlcv, loading, error, theme]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3 min-h-[400px] bg-card/10 rounded-xl border border-border">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-muted-foreground/80">Fetching historical charts from local DB...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-negative p-6 text-center border border-dashed border-border rounded-lg bg-card/25 min-h-[400px]">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative p-4 bg-[#1C1C1E] rounded-xl border border-border flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-background/80 px-2 py-0.5 rounded text-xs font-semibold text-primary border border-primary/20 backdrop-blur-sm">
        LOCAL DB CHART
      </div>
      <div ref={chartContainerRef} className="w-full h-full flex-1" />
    </div>
  );
}

export function TradingChart({ symbol = "BINANCE:BTCUSD", marketType = "equity", theme = "dark", interval = "D" }: TradingChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse">Loading Chart...</div>;

  const isIndianOrIndex = symbol.toUpperCase().endsWith('.NS') ||
                          symbol.toUpperCase().endsWith('.BO') ||
                          symbol.toUpperCase().startsWith('^');

  if (isIndianOrIndex) {
    return <LocalTradingChart symbol={symbol} theme={theme} />;
  }

  const tvSymbol = normalizeSymbolForTV(symbol, marketType);

  return (
    <div className="w-full h-full min-h-[400px]">
      <AdvancedRealTimeChart 
        symbol={tvSymbol}
        theme={theme}
        interval={interval as any}
        autosize
        timezone="Etc/UTC"
        style="1"
        locale="en"
        enable_publishing={false}
        backgroundColor="#2F2F2F"
        gridColor="rgba(255, 255, 255, 0.05)"
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={false}
        container_id={`tradingview_chart_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`}
      />
    </div>
  );
}
