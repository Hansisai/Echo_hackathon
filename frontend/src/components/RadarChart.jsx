import React from 'react';

export default function RadarChart({ 
  scores, 
  title = "City Balance Radar", 
  subtitle = "How balanced is your city? A wider, even shape is healthier overall.",
  accentColor = "var(--accent)",
  fillColor = "rgba(139, 92, 246, 0.25)"
}) {
  // Center and dimensions
  const cx = 160;
  const cy = 160;
  const r = 100;
  const width = 320;
  const height = 320;

  // Axis definitions
  const axes = [
    { key: 'economy', label: 'Economy', color: 'var(--color-economy)' },
    { key: 'environment', label: 'Environment', color: 'var(--color-environment)' },
    { key: 'mobility', label: 'Mobility', color: 'var(--color-mobility)' },
    { key: 'equity', label: 'Equity', color: 'var(--color-equity)' },
    { key: 'health', label: 'Health', color: 'var(--color-health)' }
  ];

  const totalAxes = axes.length;
  const angleStep = (2 * Math.PI) / totalAxes;

  // Helper to compute (x, y) coordinates for a given value on a specific axis index
  const getCoordinates = (index, value) => {
    const valPercent = Math.min(100, Math.max(0, value)) / 100;
    const distance = valPercent * r;
    const angle = angleStep * index - Math.PI / 2; // Subtract PI/2 to point straight up
    return {
      x: cx + distance * Math.cos(angle),
      y: cy + distance * Math.sin(angle)
    };
  };

  // Generate grid lines coordinates (e.g. at 25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];
  const gridPaths = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < totalAxes; i++) {
      const { x, y } = getCoordinates(i, level);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  // Calculate points for the actual scores polygon
  const scorePoints = axes.map((axis, i) => {
    const val = scores ? (scores[axis.key] || 50) : 50;
    const { x, y } = getCoordinates(i, val);
    return `${x},${y}`;
  }).join(' ');

  // Get labels positioning slightly outer than the max radius
  const getLabelPosition = (index) => {
    const labelDistance = r + 24;
    const angle = angleStep * index - Math.PI / 2;
    return {
      x: cx + labelDistance * Math.cos(angle),
      y: cy + labelDistance * Math.sin(angle)
    };
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height: '100%',
        minHeight: '380px'
      }}
    >
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>{subtitle}</p>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.0)" />
          </radialGradient>
        </defs>

        {/* Concentric Grid lines */}
        {gridPaths.map((path, idx) => (
          <polygon
            key={idx}
            points={path}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Grid Axis Hub Spoke Lines */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          );
        })}

        {/* Outer 100% circle indicator */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Core Values Glowing Overlay Polygon */}
        <polygon
          points={scorePoints}
          fill={fillColor}
          stroke={accentColor}
          strokeWidth="2.5"
          style={{
            filter: `drop-shadow(0 0 8px ${accentColor})`,
            transition: 'all 0.5s ease'
          }}
        />

        {/* Dots on Vertices */}
        {axes.map((axis, i) => {
          const val = scores[axis.key] || 50;
          const { x, y } = getCoordinates(i, val);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill={axis.color}
                style={{ transition: 'all 0.5s ease' }}
              />
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke={axis.color}
                strokeWidth="1"
                style={{ opacity: 0.5, transition: 'all 0.5s ease' }}
              />
            </g>
          );
        })}

        {/* Text Labels */}
        {axes.map((axis, i) => {
          const { x, y } = getLabelPosition(i);
          const scoreVal = scores[axis.key] || 50;
          
          // Determine text anchor alignments
          let textAnchor = 'middle';
          if (x < cx - 10) textAnchor = 'end';
          else if (x > cx + 10) textAnchor = 'start';
          
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill="var(--text-bright)"
              textAnchor={textAnchor}
              dominantBaseline="middle"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {axis.label} <tspan fill={axis.color} fontWeight="bold">{scoreVal}</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
