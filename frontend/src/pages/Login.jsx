import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const nav = useNavigate();

  const handle = async () => {
    setError(''); setLoading(true);
    try {
      const fn = mode === 'login' ? authAPI.login : authAPI.register;
      const { data } = await fn(form);
      login(data.user, data.token);
      nav('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inp = { width: '100%', background: '#0a0a0a', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
      <div style={{ width: 380, background: '#0a0a0a', borderRadius: 16, padding: 32, border: '1px solid #262626' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <TrendingUp size={32} color="#818cf8" style={{ marginBottom: 8 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>MarketLens</h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Unified Market Screener & Risk Analyzer</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: mode === m ? '#6366f1' : '#262626', color: mode === m ? '#fff' : '#94a3b8', fontWeight: 600, fontSize: 13 }}>
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && <input style={inp} placeholder="Full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />}
          <input style={inp} placeholder="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input style={inp} placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} onKeyDown={e => e.key === 'Enter' && handle()} />
          {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <button onClick={handle} disabled={loading} style={{ padding: '11px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
