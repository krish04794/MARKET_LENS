"""
Run this once to train the Isolation Forest fraud detector
on synthetic transaction-like data. In production, replace
with real OHLCV feature vectors.
"""
import numpy as np, requests, json

np.random.seed(42)
n = 500
# Normal samples: volume_ratio ~1, price_change ~0, rsi ~50
normal = np.column_stack([
    np.random.normal(1.0, 0.3, n),   # volume_ratio
    np.random.normal(0.0, 0.02, n),  # price_change_pct
    np.random.normal(50, 10, n),     # rsi
])
# Anomalous: volume spike, extreme price, extreme rsi
anomalies = np.column_stack([
    np.random.uniform(4, 10, 50),
    np.random.uniform(0.05, 0.15, 50),
    np.random.uniform(85, 100, 50),
])
X = np.vstack([normal, anomalies]).tolist()

resp = requests.post('http://localhost:8000/train/fraud', json={'X': X})
print(resp.json())
