export function HbbDiagram() {
  return (
    <svg viewBox="0 0 260 200" width="100%" height="200">
      <rect x="20" y="20" width="220" height="160" fill="var(--bg-panel)" rx="8" />
      {/* loose axis-aligned box around a rotated truck shape */}
      <rect x="60" y="55" width="140" height="90" fill="none" stroke="#ff6666" strokeWidth="2" strokeDasharray="6 4" />
      <g transform="translate(130,100) rotate(-35)">
        <rect x="-55" y="-14" width="110" height="28" rx="4" fill="var(--purple)" opacity="0.85" />
      </g>
      <text x="130" y="175" textAnchor="middle" fontSize="11" fill="#ff8080">68% background</text>
    </svg>
  );
}

export function ObbDiagram() {
  return (
    <svg viewBox="0 0 260 200" width="100%" height="200">
      <rect x="20" y="20" width="220" height="160" fill="var(--bg-panel)" rx="8" />
      <g transform="translate(130,100) rotate(-35)">
        <rect x="-58" y="-17" width="116" height="34" fill="none" stroke="var(--cyan)" strokeWidth="2" />
        <circle cx="-58" cy="-17" r="3" fill="var(--cyan)" />
        <circle cx="58" cy="-17" r="3" fill="var(--cyan)" />
        <circle cx="-58" cy="17" r="3" fill="var(--cyan)" />
        <circle cx="58" cy="17" r="3" fill="var(--cyan)" />
        <rect x="-55" y="-14" width="110" height="28" rx="4" fill="var(--purple)" opacity="0.85" />
      </g>
      <text x="130" y="175" textAnchor="middle" fontSize="11" fill="var(--cyan)">θ = -35°, 8% background</text>
    </svg>
  );
}
