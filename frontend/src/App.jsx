import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Screener from './pages/Screener';
import RiskAnalyzer from './pages/RiskAnalyzer';
import Watchlist from './pages/Watchlist';
import Login from './pages/Login';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/screener" element={<Screener />} />
              <Route path="/risk" element={<RiskAnalyzer />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        } />
      </Routes>
    </div>
  );
}
