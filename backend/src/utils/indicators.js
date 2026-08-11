// Technical indicator calculations

function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
}

function sma(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return parseFloat((slice.reduce((a, b) => a + b, 0) / period).toFixed(4));
}

function volumeRatio(volumes, period = 20) {
  if (volumes.length < period + 1) return null;
  const avgVol = volumes.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period;
  return avgVol === 0 ? null : parseFloat((volumes[volumes.length - 1] / avgVol).toFixed(2));
}

function maxDrawdown(closes) {
  let peak = closes[0], maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (peak - c) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return parseFloat((maxDD * 100).toFixed(2));
}

function beta(assetReturns, benchmarkReturns) {
  const n = Math.min(assetReturns.length, benchmarkReturns.length);
  if (n < 2) return null;
  const ar = assetReturns.slice(-n);
  const br = benchmarkReturns.slice(-n);
  const meanA = ar.reduce((a, b) => a + b, 0) / n;
  const meanB = br.reduce((a, b) => a + b, 0) / n;
  let cov = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (ar[i] - meanA) * (br[i] - meanB);
    varB += (br[i] - meanB) ** 2;
  }
  return varB === 0 ? null : parseFloat((cov / varB).toFixed(4));
}

function dailyReturns(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  return returns;
}

function volatility(closes, period = 30) {
  const returns = dailyReturns(closes.slice(-period - 1));
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return parseFloat((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
}

function ema(closes, period = 20) {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    emaVal = closes[i] * k + emaVal * (1 - k);
  }
  return parseFloat(emaVal.toFixed(4));
}

function macd(closes, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (closes.length < longPeriod + signalPeriod) return null;
  
  const shortEMA = [];
  const longEMA = [];
  const kShort = 2 / (shortPeriod + 1);
  const kLong = 2 / (longPeriod + 1);
  
  let currentShort = closes.slice(0, shortPeriod).reduce((a, b) => a + b, 0) / shortPeriod;
  let currentLong = closes.slice(0, longPeriod).reduce((a, b) => a + b, 0) / longPeriod;
  
  for (let i = 0; i < closes.length; i++) {
    if (i >= shortPeriod) {
      currentShort = closes[i] * kShort + currentShort * (1 - kShort);
    }
    if (i >= longPeriod) {
      currentLong = closes[i] * kLong + currentLong * (1 - kLong);
    }
    shortEMA.push(currentShort);
    longEMA.push(currentLong);
  }
  
  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(shortEMA[i] - longEMA[i]);
  }
  
  const kSignal = 2 / (signalPeriod + 1);
  const macdSliceForSignalStart = macdLine.slice(longPeriod, longPeriod + signalPeriod);
  let currentSignal = macdSliceForSignalStart.reduce((a, b) => a + b, 0) / signalPeriod;
  
  const signalLine = Array(longPeriod + signalPeriod - 1).fill(null);
  signalLine.push(currentSignal);
  
  for (let i = longPeriod + signalPeriod; i < closes.length; i++) {
    currentSignal = macdLine[i] * kSignal + currentSignal * (1 - kSignal);
    signalLine.push(currentSignal);
  }
  
  const latestMacd = macdLine[macdLine.length - 1];
  const latestSignal = signalLine[signalLine.length - 1];
  const hist = latestMacd - latestSignal;
  
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSignal = signalLine[signalLine.length - 2];
  
  let signal = 'Neutral';
  if (prevMacd <= prevSignal && latestMacd > latestSignal) {
    signal = 'Bullish Crossover';
  } else if (prevMacd >= prevSignal && latestMacd < latestSignal) {
    signal = 'Bearish Crossover';
  } else if (latestMacd > latestSignal) {
    signal = 'Bullish';
  } else if (latestMacd < latestSignal) {
    signal = 'Bearish';
  }
  
  return {
    macdLine: parseFloat(latestMacd.toFixed(4)),
    signalLine: parseFloat(latestSignal.toFixed(4)),
    histogram: parseFloat(hist.toFixed(4)),
    signal
  };
}

function bollingerBands(closes, period = 20, stdDevs = 2) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const ma = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - ma, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: parseFloat((ma + stdDevs * std).toFixed(4)),
    middle: parseFloat(ma.toFixed(4)),
    lower: parseFloat((ma - stdDevs * std).toFixed(4))
  };
}

function atr(highs, lows, closes, period = 14) {
  if (highs.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < highs.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  let atrVal = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atrVal = (atrVal * (period - 1) + trs[i]) / period;
  }
  return parseFloat(atrVal.toFixed(4));
}

function adx(highs, lows, closes, period = 14) {
  if (highs.length < period * 2) return null;
  const plusDM = [];
  const minusDM = [];
  const trs = [];
  
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    let pDM = 0;
    let mDM = 0;
    if (upMove > downMove && upMove > 0) pDM = upMove;
    if (downMove > upMove && downMove > 0) mDM = downMove;
    
    plusDM.push(pDM);
    minusDM.push(mDM);
    
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  
  let trSmooth = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let plusDMSmooth = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let minusDMSmooth = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  
  const dxs = [];
  for (let i = period; i < trs.length; i++) {
    trSmooth = trSmooth - trSmooth / period + trs[i];
    plusDMSmooth = plusDMSmooth - plusDMSmooth / period + plusDM[i];
    minusDMSmooth = minusDMSmooth - minusDMSmooth / period + minusDM[i];
    
    const plusDI = trSmooth === 0 ? 0 : (plusDMSmooth / trSmooth) * 100;
    const minusDI = trSmooth === 0 ? 0 : (minusDMSmooth / trSmooth) * 100;
    
    const sum = plusDI + minusDI;
    const diff = Math.abs(plusDI - minusDI);
    const dx = sum === 0 ? 0 : (diff / sum) * 100;
    dxs.push(dx);
  }
  
  let adxVal = dxs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxs.length; i++) {
    adxVal = (adxVal * (period - 1) + dxs[i]) / period;
  }
  return parseFloat(adxVal.toFixed(2));
}

function stochastic(highs, lows, closes, period = 14, smoothK = 3, smoothD = 3) {
  if (closes.length < period + smoothK + smoothD) return null;
  const rawKs = [];
  for (let i = period - 1; i < closes.length; i++) {
    const lowSlice = lows.slice(i - period + 1, i + 1);
    const highSlice = highs.slice(i - period + 1, i + 1);
    const minLow = Math.min(...lowSlice);
    const maxHigh = Math.max(...highSlice);
    const close = closes[i];
    const k = maxHigh === minLow ? 50 : ((close - minLow) / (maxHigh - minLow)) * 100;
    rawKs.push(k);
  }
  
  const ks = [];
  for (let i = smoothK - 1; i < rawKs.length; i++) {
    const kSmooth = rawKs.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0) / smoothK;
    ks.push(kSmooth);
  }
  
  const ds = [];
  for (let i = smoothD - 1; i < ks.length; i++) {
    const dSmooth = ks.slice(i - smoothD + 1, i + 1).reduce((a, b) => a + b, 0) / smoothD;
    ds.push(dSmooth);
  }
  
  return {
    k: parseFloat(ks[ks.length - 1].toFixed(2)),
    d: parseFloat(ds[ds.length - 1].toFixed(2))
  };
}

function vwap(highs, lows, closes, volumes) {
  const period = Math.min(closes.length, 14);
  let sumPV = 0;
  let sumV = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    sumPV += typicalPrice * (volumes[i] || 0);
    sumV += (volumes[i] || 0);
  }
  return sumV === 0 ? closes[closes.length - 1] : parseFloat((sumPV / sumV).toFixed(4));
}

module.exports = {
  rsi,
  sma,
  volumeRatio,
  maxDrawdown,
  beta,
  dailyReturns,
  volatility,
  ema,
  macd,
  bollingerBands,
  atr,
  adx,
  stochastic,
  vwap
};
