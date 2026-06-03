const zones = [
  { label: "8+ hours: full sun", color: "#d9480f" },
  { label: "6-8 hours: strong sun", color: "#f08c00" },
  { label: "4-6 hours: part sun", color: "#ffd43b" },
  { label: "2-4 hours: part shade", color: "#74b816" },
  { label: "<2 hours: shade", color: "#2b8a3e" }
];

export function HeatmapLegend() {
  return (
    <aside className="panel">
      <h2>Sun Zones</h2>
      <ul className="legend-list">
        {zones.map((zone) => (
          <li className="legend-item" key={zone.label}>
            <span className="swatch" style={{ backgroundColor: zone.color }} />
            <span>{zone.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
