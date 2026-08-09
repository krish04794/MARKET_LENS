const colors = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
export default function RiskBadge({ label }) {
  if (!label) return null;
  return (
    <span style={{ background: colors[label] + '22', color: colors[label], border: `1px solid ${colors[label]}55`, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {label} Risk
    </span>
  );
}
