import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

export default function RippleGraph({ graphData }) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes || !graphData.links) return;

    const rawNodes = graphData.nodes;
    const rawLinks = graphData.links;

    // 1. Calculate Level of each node by traversing connections starting from origin
    const nodeLevels = {};
    const originNode = rawNodes.find(n => n.type === 'origin') || rawNodes[0];
    
    if (originNode) {
      nodeLevels[originNode.id] = 0;
    }

    // Step-by-step level assignment
    let changed = true;
    let attempts = 0;
    while (changed && attempts < 10) {
      changed = false;
      attempts++;
      rawLinks.forEach(link => {
        const sourceLvl = nodeLevels[link.source];
        if (sourceLvl !== undefined) {
          const newLvl = sourceLvl + 1;
          if (nodeLevels[link.target] === undefined || nodeLevels[link.target] < newLvl) {
            nodeLevels[link.target] = newLvl;
            changed = true;
          }
        }
      });
    }

    // Assign any remaining unmapped nodes to level 1 or 2
    rawNodes.forEach(node => {
      if (nodeLevels[node.id] === undefined) {
        nodeLevels[node.id] = 1;
      }
    });

    // 2. Compute coordinates (x, y) based on levels
    const width = 850;
    const height = 450;
    const paddingX = 80;
    const paddingY = 40;

    // Group nodes by level
    const levelGroups = {};
    rawNodes.forEach(node => {
      const lvl = nodeLevels[node.id];
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(node);
    });

    const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
    const colWidth = (width - paddingX * 2) / (maxLevel || 1);

    const positionedNodes = [];
    Object.keys(levelGroups).forEach(lvlStr => {
      const lvl = Number(lvlStr);
      const group = levelGroups[lvl];
      const count = group.length;
      
      const x = paddingX + lvl * colWidth;

      group.forEach((node, idx) => {
        // Distribute y evenly
        const y = paddingY + ((idx + 0.5) / count) * (height - paddingY * 2);
        positionedNodes.push({
          ...node,
          x,
          y
        });
      });
    });

    setNodes(positionedNodes);
    setLinks(rawLinks);
  }, [graphData]);

  // Find coordinates for link source and target
  const getCoordinates = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const getNodeColorClass = (type) => {
    if (type === 'origin') return 'var(--accent)';
    if (type === 'positive') return 'var(--color-environment)';
    if (type === 'negative') return 'var(--color-equity)';
    if (type === 'synergy') return '#10b981';
    if (type === 'conflict') return '#f43f5e';
    return 'var(--text-muted)';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '520px'
      }}
    >
      {/* Title & Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Cause & Effect Causal Graph</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Visualize direct effects, cascading impacts, and multi-policy synergy/conflict nodes.</p>
        </div>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: 500, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }}></span>
            <span>Origin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-environment)' }}></span>
            <span>Positive Impact</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-equity)' }}></span>
            <span>Risk / Negative</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></span>
            <span>Synergy Interaction</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.5)' }}></span>
            <span>Conflict Trade-off</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '450px', background: 'rgba(5, 5, 10, 0.4)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <svg width="100%" height="100%" viewBox="0 0 850 450" style={{ overflow: 'visible' }}>
          <defs>
            {/* Gradients */}
            <linearGradient id="grad-origin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="grad-pos" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-environment)" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="grad-neg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-equity)" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            
            {/* Marker definitions */}
            <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 255, 255, 0.15)" />
            </marker>
          </defs>

          {/* Render Link Connection Lines */}
          {links.map((link, idx) => {
            const start = getCoordinates(link.source);
            const end = getCoordinates(link.target);
            
            // Draw a smooth bezier curve
            const controlPointX = (start.x + end.x) / 2;
            const pathD = `M ${start.x} ${start.y} C ${controlPointX} ${start.y}, ${controlPointX} ${end.y}, ${end.x} ${end.y}`;
            
            const targetNode = nodes.find(n => n.id === link.target);
            const lineGlowColor = targetNode ? getNodeColorClass(targetNode.type) : 'var(--text-muted)';
            
            return (
              <g key={idx}>
                {/* Background static link */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow)"
                />
                {/* Glowing Flowing Particles */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={lineGlowColor}
                  strokeWidth="1.5"
                  className="flowing-line"
                  style={{
                    opacity: 0.75,
                    filter: `drop-shadow(0 0 3px ${lineGlowColor})`
                  }}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isOrigin = node.type === 'origin';
            const nodeColor = getNodeColorClass(node.type);
            const isHovered = hoveredNode === node.id;
            
            // Render text length calculations roughly for bubble bounding box
            const textWidth = Math.max(130, node.label.length * 7.5 + 24);
            const heightBox = 34;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Glowing background on hover */}
                {isHovered && (
                  <rect
                    x={-textWidth / 2}
                    y={-heightBox / 2}
                    width={textWidth}
                    height={heightBox}
                    rx="17"
                    fill="transparent"
                    stroke={nodeColor}
                    strokeWidth="3.5"
                    style={{
                      opacity: 0.35,
                      filter: `blur(4px)`
                    }}
                  />
                )}

                {/* Capsule Box */}
                <rect
                  x={-textWidth / 2}
                  y={-heightBox / 2}
                  width={textWidth}
                  height={heightBox}
                  rx="17"
                  fill={isOrigin ? 'url(#grad-origin)' : 'var(--bg-panel-solid)'}
                  stroke={nodeColor}
                  strokeWidth="1.5"
                  style={{
                    filter: isOrigin ? 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))' : 'none',
                    transition: 'all 0.2s'
                  }}
                />

                {/* Label text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill={isOrigin ? '#ffffff' : 'var(--text-bright)'}
                  style={{
                    fontSize: '11px',
                    fontWeight: isOrigin ? 700 : 500,
                    pointerEvents: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Explainer Tooltip */}
        {hoveredNode && (
          <div
            className="glass-panel"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 18px',
              maxWidth: '480px',
              fontSize: '12px',
              lineHeight: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              background: 'rgba(10, 11, 20, 0.95)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}
          >
            <HelpCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
                {nodes.find(n => n.id === hoveredNode)?.label}
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                {hoveredNode.startsWith('p_') && "This represents the applied policy parameter acting as the primary catalyst."}
                {hoveredNode === 'n_traffic' && "Congestion pricing directly discourages private vehicle commutes, prompting commuters to seek alternatives or pool resources."}
                {hoveredNode === 'n_transit' && "Increased public transit uptake occurs as private driving fees exceed standard bus or metro fare structures."}
                {hoveredNode === 'n_revenue' && "Tolls collect additional municipal cash flows, generating a ring-fenced balance sheet dedicated to micro-transit investments."}
                {hoveredNode === 'n_cost' && "Private drivers bear higher daily expenses, increasing economic pressure on individuals reliant on outer highway corridors."}
                {hoveredNode === 'n_aqi' && "Fewer combustion cars directly result in lower emissions of carbon monoxide, carbon dioxide, and fine particulate matters (PM2.5)."}
                {hoveredNode === 'n_respiratory' && "Reduction in heavy airborne particulates leads to a marked drop in pulmonary emergency calls and pediatric asthma clinic demands."}
                {hoveredNode === 'n_disposable' && "Low-income drivers face high cost impacts. Lower quintiles spend a larger share of net income on transportation."}
                {hoveredNode === 'n_retail' && "Restricting car access may lead to an initial decrease in city-center shopping frequency, which must be offset by high pedestrianization benefits."}
                
                {/* Metro Subsidy tooltips */}
                {hoveredNode === 'n_ridership' && "Cheap tickets combined with brand-new lines significantly increase subway and bus passenger volume across all zones."}
                {hoveredNode === 'n_savings' && "Subsidized tickets yield immediate monthly savings, providing financial breathing room for transit-dependent workers."}
                {hoveredNode === 'n_budget' && "Higher subsidies increase municipal operational deficits, requiring long-term fiscal support from alternative revenues."}
                {hoveredNode === 'n_congestion' && "Fewer vehicles on expressways result in reduced travel times for freight logistics, logistics, and emergency services."}
                {hoveredNode === 'n_equity' && "Extending rails to outer rings connects peripheral neighborhoods to key jobs, reducing spatial segregation."}
                {hoveredNode === 'n_steps' && "Commuting via public transit naturally forces walking to stations, raising the average metabolic output of residents."}
                
                {/* WFH tooltips */}
                {hoveredNode === 'n_commutes' && "Allowing remote work permanently clears vehicles from highways during morning and evening rush hours."}
                {hoveredNode === 'n_office' && "Companies scale back commercial office space leases, resulting in lower power use but shifting overhead to homes."}
                {hoveredNode === 'n_stress' && "Avoiding hours of heavy highway traffic directly correlates to lower employee cortisol levels and improved productivity."}
                {hoveredNode === 'n_rent' && "A drop in demand for corporate headquarters lowers real estate rates, forcing land use conversions to residential apartments."}
                
                {/* Carbon tax tooltips */}
                {hoveredNode === 'n_renewables' && "Subsidies stimulate rapid deployment of solar, wind, and industrial batteries across industrial zones."}
                {hoveredNode === 'n_co2' && "High carbon tax rates penalize burning fossil fuels, forcing factories to capture carbon or switch to electricity."}
                {hoveredNode === 'n_energy_cost' && "Short-term electricity costs may increase during grid restructuring, but decline once clean renewables stabilize."}
                
                {/* Green canopy tooltips */}
                {hoveredNode === 'n_temp' && "Dense tree leaves absorb sunlight and block heat reflection, cooling surrounding air temperatures by up to 2 degrees."}
                {hoveredNode === 'n_shade' && "Shaded sidewalks encourage pedestrian foot traffic, supporting physical active walking and healthy shopping hubs."}
                {hoveredNode === 'n_mental' && "Green visual fields are clinically proven to suppress stress hormones, supporting overall public psychological indices."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
