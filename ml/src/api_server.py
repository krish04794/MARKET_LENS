from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle, os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models')

def load_model(name):
    path = os.path.join(MODEL_PATH, f'{name}.pkl')
    if os.path.exists(path):
        with open(path, 'rb') as f:
            return pickle.load(f)
    return None

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/predict/fraud', methods=['POST'])
def fraud_score():
    """
    Input: { "features": [volume_ratio, price_change_pct, rsi, ...] }
    Output: { "score": 0-100, "label": "normal"|"suspicious"|"anomaly" }
    """
    data = request.json or {}
    features = data.get('features', [])
    model = load_model('fraud_detector')
    if model and features:
        arr = np.array(features).reshape(1, -1)
        score = float(model.decision_function(arr)[0])
        # Normalise to 0-100 (higher = more anomalous)
        normalised = max(0, min(100, int((1 - (score + 1) / 2) * 100)))
        label = 'anomaly' if normalised > 70 else 'suspicious' if normalised > 40 else 'normal'
        return jsonify({'score': normalised, 'label': label})
    # Fallback: simple rule-based score
    vr = features[0] if len(features) > 0 else 1
    rsi = features[2] if len(features) > 2 else 50
    score = 0
    if vr > 3: score += 40
    if rsi > 80 or rsi < 15: score += 30
    label = 'anomaly' if score > 60 else 'suspicious' if score > 30 else 'normal'
    return jsonify({'score': score, 'label': label})

@app.route('/predict/risk', methods=['POST'])
def risk_score():
    """
    Input: { "asset_returns": [...], "benchmark_returns": [...] }
    Output: { "beta": float, "idio_risk": float, "volatility": float, "risk_label": str }
    """
    data = request.json or {}
    ar = np.array(data.get('asset_returns', []))
    br = np.array(data.get('benchmark_returns', []))
    if len(ar) < 10 or len(br) < 10:
        return jsonify({'error': 'Need at least 10 return data points'}), 400
    n = min(len(ar), len(br))
    ar, br = ar[-n:], br[-n:]
    # OLS beta
    cov = np.cov(ar, br)
    beta_val = float(cov[0, 1] / cov[1, 1]) if cov[1, 1] != 0 else 1.0
    # Idiosyncratic risk (residual std)
    predicted = beta_val * br
    residuals = ar - predicted
    idio_risk = float(np.std(residuals))
    # Annualised volatility
    vol = float(np.std(ar) * np.sqrt(252) * 100)
    # Max drawdown
    cum = np.cumprod(1 + ar)
    peak = np.maximum.accumulate(cum)
    dd = float(np.max((peak - cum) / peak) * 100)
    label = 'High' if vol > 40 else 'Medium' if vol > 20 else 'Low'
    return jsonify({'beta': round(beta_val, 4), 'idio_risk': round(idio_risk, 4), 'volatility': round(vol, 2), 'max_drawdown': round(dd, 2), 'risk_label': label})

@app.route('/train/fraud', methods=['POST'])
def train_fraud():
    """Train Isolation Forest on provided feature data"""
    from sklearn.ensemble import IsolationForest
    data = request.json or {}
    X = np.array(data.get('X', []))
    if len(X) < 10:
        return jsonify({'error': 'Need at least 10 samples'}), 400
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X)
    os.makedirs(MODEL_PATH, exist_ok=True)
    with open(os.path.join(MODEL_PATH, 'fraud_detector.pkl'), 'wb') as f:
        pickle.dump(model, f)
    return jsonify({'status': 'trained', 'samples': len(X)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
