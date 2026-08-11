import React, { useEffect, useRef } from 'react';

export function normalizeSymbolForTV(symbol, marketType = 'equity') {
  if (!symbol) return 'NASDAQ:AAPL';
  const clean = symbol.toUpperCase();

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

export default function TradingViewChart({ symbol, marketType = 'equity', interval = 'D', theme = 'dark' }) {
  const containerId = 'tradingview_widget_container';
  const onLoadScriptRef = useRef();

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!window.TradingView) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-loading-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.onload = () => {
        if (onLoadScriptRef.current) onLoadScriptRef.current();
      };
      document.head.appendChild(script);
    } else {
      createWidget();
    }

    function createWidget() {
      if (document.getElementById(containerId) && window.TradingView) {
        const tvSymbol = normalizeSymbolForTV(symbol, marketType);
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: interval,
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          toolbar_bg: "#0f172a",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: containerId,
          studies: [
            "RSI@tv-basicstudies",
            "MASimple@tv-basicstudies"
          ]
        });
      }
    }

    return () => {
      onLoadScriptRef.current = null;
    };
  }, [symbol, marketType, interval, theme]);

  return (
    <div style={{ height: '100%', width: '100%', background: '#090d16', borderRadius: 8, overflow: 'hidden' }}>
      <div id={containerId} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
