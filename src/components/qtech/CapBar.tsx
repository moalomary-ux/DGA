export function CapBar({ enrolled, capacity }: { enrolled: number; capacity: number }) {
  const pct = Math.min(100, Math.round((enrolled / Math.max(1, capacity || 1)) * 100));
  return (
    <div className="qt-cap-bar">
      <div className="b"><div className="f" style={{ width: `${pct}%` }} /></div>
      <span className="t">{enrolled}/{capacity || '∞'}</span>
    </div>
  );
}
