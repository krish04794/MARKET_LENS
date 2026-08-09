import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, LogOut, Star } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const s = {
    nav: { background: '#0a0a0a', borderBottom: '1px solid #262626', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
    logo: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, color: '#818cf8' },
    links: { display: 'flex', gap: 4 },
    link: { padding: '6px 14px', borderRadius: 6, fontSize: 14, color: '#94a3b8', transition: 'all .15s' },
    right: { display: 'flex', alignItems: 'center', gap: 12 },
    btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer' },
  };
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.logo}><TrendingUp size={22}/> MarketLens</Link>
      <div style={s.links}>
        {['/', '/screener', '/risk', '/watchlist'].map((path, i) => (
          <Link key={path} to={path} style={{...s.link, color: location.pathname === path ? '#818cf8' : '#94a3b8'}}>
            {['Dashboard','Screener','Risk Analyzer','Watchlist'][i]}
          </Link>
        ))}
      </div>
      <div style={s.right}>
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{user.email}</span>
            <button onClick={() => { logout(); nav('/login'); }} style={{...s.btn, background: '#262626', color: '#e2e8f0'}}>
              <LogOut size={14}/> Logout
            </button>
          </>
        ) : (
          <button onClick={() => nav('/login')} style={{...s.btn, background: '#6366f1', color: '#fff'}}>Login</button>
        )}
      </div>
    </nav>
  );
}
