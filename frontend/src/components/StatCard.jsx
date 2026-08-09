export default function StatCard({ label, value, sub, color = '#818cf8' }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
