import React from 'react';

export default function LineChart({ projections }) {
  // SVG Boundaries
  const width = 580;
  const height = 240;
  const paddingLeft = 35;
  const paddingTop = 15;
  const paddingBottom = 30;
  const paddingRight = 140;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const sectors = [
    { key: 'economy', label: 'Economy', color: 'var(--color-economy)' },
    { key: 'environment', label: 'Environment', color: 'var(--color-environment)' },
    { key: 'mobility', label: 'Mobility', color: 'var(--color-mobility)' },
    { key: 'equity', label: 'Equity', color: 'var(--color-equity)' },
    { key: 'health', label: 'Health', color: 'var(--color-health)' }
  ];

  if (!projections || projections.length === 0) return null;

  // Helper to resolve coordinates
  const getCoordinates = (yearIndex, score) => {
    // yearIndex is 0 to 5. score is 0 to 100
    const x = paddingLeft + (yearIndex / 5.0) * chartWidth;
    const y = (paddingTop + chartHeight) - (score / 100.0) * chartHeight;
    return { x, y };
  };

  // Build grid lines
  const horizontalGrid = [25, 50, 75, 100];
  const verticalGrid = [0, 1, 2, 3, 4, 5];

  // Draw lines path
  const getPath = (sectorKey) => {
    return projections.map((point, i) => {
      const score = point[sectorKey] || 50;
      const { x, y } = getCoordinates(i, score);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        height: '100%',
        minHeight: '300px'
      }}
    >
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600 }}>5-Year Trend Forecast</h3>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Future outlook of city indices over the next 5 years.</p>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Horizontal Grid lines */}
          {horizontalGrid.map((level, idx) => {
            const y = (paddingTop + chartHeight) - (level / 100.0) * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="var(--text-muted)"
                  style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Vertical Year Grid lines */}
          {verticalGrid.map((year, idx) => {
            const x = paddingLeft + (year / 5.0) * chartWidth;
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={paddingTop + chartHeight}
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}
                >
                  Y{year}
                </text>
              </g>
            );
          })}

          {/* Render Lines */}
          {sectors.map((sector) => (
            <path
              key={sector.key}
              d={getPath(sector.key)}
              fill="none"
              stroke={sector.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'all 0.5s ease',
                filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
              }}
            />
          ))}

          {/* Dots on Year 5 points */}
          {sectors.map((sector) => {
            const finalScore = projections[5][sector.key] || 50;
            const { x, y } = getCoordinates(5, finalScore);
            return (
              <circle
                key={sector.key}
                cx={x}
                cy={y}
                r="3.5"
                fill={sector.color}
                stroke="var(--bg-dark)"
                strokeWidth="1"
                style={{ transition: 'all 0.5s ease' }}
              />
            );
          })}

          {/* Legend Labels on Right Side */}
          <g transform={`translate(${width - paddingRight + 20}, ${paddingTop})`}>
            {sectors.map((sector, index) => {
              const currentScore = projections[5][sector.key] || 50;
              return (
                <g key={sector.key} transform={`translate(0, ${index * 28})`}>
                  {/* Color dot */}
                  <rect
                    width="12"
                    height="12"
                    rx="3"
                    fill={sector.color}
                  />
                  {/* Label */}
                  <text
                    x="20"
                    y="10"
                    fill="var(--text-bright)"
                    style={{ fontSize: '11px', fontWeight: 600 }}
                  >
                    {sector.label}
                  </text>
                  {/* score badge */}
                  <text
                    x="100"
                    y="10"
                    fill={sector.color}
                    fontWeight="bold"
                    style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                  >
                    {currentScore}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
