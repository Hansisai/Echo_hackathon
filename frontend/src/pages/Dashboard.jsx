import React from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  TreePine, 
  Zap, 
  Users, 
  Heart,
  FileDown
} from 'lucide-react';
import RadarChart from '../components/RadarChart';
import LineChart from '../components/LineChart';
import RippleGraph from '../components/RippleGraph';
import AgentReport from '../components/AgentReport';
import { api } from '../services/api';

export default function Dashboard({ runData, activeCity }) {
  
  if (!runData) {
    if (!activeCity) return null;
    
    // Calculate baseline scores for the radar chart based on the balanced formulas
    const baseEconomy = Math.round(Math.min(100.0, Math.max(10.0, (activeCity.median_income / 80000.0) * 50 + (activeCity.municipal_budget / 5000.0) * 30)));
    const baseEnvironment = Math.round(Math.min(100.0, Math.max(10.0, (1 - (activeCity.co2_baseline / 20.0)) * 40 + (1 - (activeCity.aqi_baseline / 300.0)) * 40)));
    const baseMobility = Math.round(Math.min(100.0, Math.max(10.0, activeCity.transit_share * 0.8 + (1 - (activeCity.avg_commute_dist / 30.0)) * 30)));
    const baseEquity = Math.round(Math.min(100.0, Math.max(10.0, (activeCity.median_income / 80000.0) * 30 + activeCity.transit_share * 0.5 + activeCity.satisfaction_baseline * 0.2)));
    const baseHealth = activeCity.health_index;
    
    const baseScores = {
      economy: baseEconomy,
      environment: baseEnvironment,
      mobility: baseMobility,
      equity: baseEquity,
      health: baseHealth
    };
    
    const averageScore = Math.round((baseEconomy + baseEnvironment + baseMobility + baseEquity + baseHealth) / 5);
    
    const scoreDetails = [
      { label: 'Economy', val: baseEconomy, details: `Income: $${activeCity.median_income.toLocaleString()}/yr`, icon: Coins, color: 'var(--color-economy)', glow: 'var(--color-economy-glow)' },
      { label: 'Environment', val: baseEnvironment, details: `AQI: ${activeCity.aqi_baseline} | CO2: ${activeCity.co2_baseline}t`, icon: TreePine, color: 'var(--color-environment)', glow: 'var(--color-environment-glow)' },
      { label: 'Mobility', val: baseMobility, details: `Transit: ${activeCity.transit_share}% | Commute: ${activeCity.avg_commute_dist}km`, icon: Zap, color: 'var(--color-mobility)', glow: 'var(--color-mobility-glow)' },
      { label: 'Equity', val: baseEquity, details: `Satisfaction: ${activeCity.satisfaction_baseline}%`, icon: Users, color: 'var(--color-equity)', glow: 'var(--color-equity-glow)' },
      { label: 'Health', val: baseHealth, details: `Index: ${activeCity.health_index}%`, icon: Heart, color: 'var(--color-health)', glow: 'var(--color-health-glow)' }
    ];

    return (
      <div className="page-wrapper">
        {/* City Info Header */}
        <div 
          className="glass-panel"
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(139, 92, 246, 0.04)',
            borderLeft: '4px solid var(--accent)'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Baseline Census Profile</span>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
              {activeCity.name} Baseline Metrics
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Population: {activeCity.population.toLocaleString()} • Showing starting parameters prior to policy simulations.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--border-light)', paddingLeft: '24px' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Baseline Score</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                {averageScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Index Scorecards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {scoreDetails.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                  <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: item.glow, color: item.color, display: 'flex', alignItems: 'center' }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-bright)' }}>
                    {item.val}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.details}</span>
              </div>
            );
          })}
        </div>

        {/* Radar and Prompt */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <div 
            className="glass-panel"
            style={{
              padding: '40px 30px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px'
            }}
          >
            <div style={{ background: 'var(--accent-glow)', padding: '16px', borderRadius: '50%', color: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}>
              <Sparkles size={36} className="pulse-glow" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Ready for Intervention</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.5 }}>
              This city is currently in its default baseline state. Navigate to the <strong>Policy Simulator</strong> in the sidebar to configure and launch a policy intervention!
            </p>
          </div>
          <RadarChart scores={baseScores} />
        </div>
      </div>
    );
  }

  const { final_scores, projections, ripple_graph, agent_reports, parameters, simulation_id } = runData;

  const averageScore = Math.round(
    (final_scores.economy + 
     final_scores.environment + 
     final_scores.mobility + 
     final_scores.equity + 
     final_scores.health) / 5
  );

  let letterGrade = 'C';
  if (averageScore >= 95) letterGrade = 'A+';
  else if (averageScore >= 90) letterGrade = 'A';
  else if (averageScore >= 85) letterGrade = 'A-';
  else if (averageScore >= 80) letterGrade = 'B+';
  else if (averageScore >= 75) letterGrade = 'B';
  else if (averageScore >= 70) letterGrade = 'B-';
  else if (averageScore >= 65) letterGrade = 'C+';
  else if (averageScore >= 60) letterGrade = 'C';
  else if (averageScore >= 50) letterGrade = 'D';
  else letterGrade = 'F';

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'var(--color-environment)';
    if (grade.startsWith('B')) return 'var(--color-mobility)';
    if (grade.startsWith('C')) return 'var(--color-economy)';
    return 'var(--color-equity)';
  };

  const scoreDetails = [
    { key: 'economy', label: 'Economy', val: final_scores.economy, icon: Coins, color: 'var(--color-economy)', glow: 'var(--color-economy-glow)' },
    { key: 'environment', label: 'Environment', val: final_scores.environment, icon: TreePine, color: 'var(--color-environment)', glow: 'var(--color-environment-glow)' },
    { key: 'mobility', label: 'Mobility', val: final_scores.mobility, icon: Zap, color: 'var(--color-mobility)', glow: 'var(--color-mobility-glow)' },
    { key: 'equity', label: 'Equity', val: final_scores.equity, icon: Users, color: 'var(--color-equity)', glow: 'var(--color-equity-glow)' },
    { key: 'health', label: 'Health', val: final_scores.health, icon: Heart, color: 'var(--color-health)', glow: 'var(--color-health-glow)' }
  ];

  const handleDownload = () => {
    window.open(api.getExportUrl(simulation_id), '_blank');
  };

  return (
    <div className="page-wrapper">
      
      {/* Simulation Info & Export */}
      <div 
        className="glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(139, 92, 246, 0.04)',
          borderLeft: '4px solid var(--accent)'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Simulation Report</span>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
            {runData.policy_name || 'Joint Policy Bundle'} applied to {runData.city_name}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Parameters: {typeof parameters === 'object' && parameters !== null ? Object.entries(parameters).map(([k, v]) => typeof v === 'object' ? `${k.replace('_', ' ')}: ${JSON.stringify(v)}` : `${k.replace('_', ' ')}: ${v}`).join(' | ') : ''}
          </p>
        </div>

        {/* City Performance Grade */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid var(--border-light)', paddingLeft: '24px', marginRight: 'auto', marginLeft: '32px' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Balance Score</span>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-bright)', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
              {averageScore}%
            </div>
          </div>
          <div 
            style={{ 
              background: getGradeColor(letterGrade), 
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '14px',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 0 15px ${getGradeColor(letterGrade)}44`
            }}
          >
            Grade: {letterGrade}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => window.open(api.getExportUrl(simulation_id) + '?format=html', '_blank')}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download beautifully styled print report"
          >
            <FileDown size={12} /> HTML REPORT
          </button>
          <button 
            onClick={() => window.open(api.getExportUrl(simulation_id) + '?format=csv', '_blank')}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download CSV spreadsheet dataset"
          >
            <FileDown size={12} /> CSV DATA
          </button>
          <button 
            onClick={() => window.open(api.getExportUrl(simulation_id) + '?format=json', '_blank')}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Download JSON structured raw data"
          >
            <FileDown size={12} /> JSON DATA
          </button>
        </div>
      </div>

      {/* Index Scorecards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        {scoreDetails.map((item) => {
          const Icon = item.icon;
          // Calculate delta from year 0 (baseline)
          const baseVal = projections[0][item.key];
          const finalVal = item.val;
          const delta = Number((finalVal - baseVal).toFixed(1));
          
          return (
            <div 
              key={item.key} 
              className="glass-panel" 
              style={{ 
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                <div 
                  style={{ 
                    padding: '6px', 
                    borderRadius: '8px', 
                    backgroundColor: item.glow, 
                    color: item.color 
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-bright)' }}>
                  {finalVal}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</span>
              </div>

              {/* Delta Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                {delta > 0 ? (
                  <>
                    <TrendingUp size={14} style={{ color: 'var(--color-environment)' }} />
                    <span style={{ color: 'var(--color-environment)' }}>+{delta} vs Base</span>
                  </>
                ) : delta < 0 ? (
                  <>
                    <TrendingDown size={14} style={{ color: 'var(--color-equity)' }} />
                    <span style={{ color: 'var(--color-equity)' }}>{delta} vs Base</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No Change</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ripple Effects Graph and Radar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px' }}>
        <RippleGraph graphData={ripple_graph} />
        <RadarChart scores={final_scores} />
      </div>

      {/* Trajectory Timeline and Advisors critiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <LineChart projections={projections} />
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Policy Impact Synthesis</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Consolidated summary of agent negotiations.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'center' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>Consensus Verdict</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '4px' }}>
                  {final_scores.environment > 70 && final_scores.economy > 50 
                    ? "This policy demonstrates a viable sustainable path. The environmental gains are successfully captured without triggering a critical economic contraction."
                    : final_scores.environment > 75 
                    ? "Excellent environmental gains are forecasted, but high low-income financial stress (lower Equity) indicates supplementary target credits are required."
                    : final_scores.economy > 75
                    ? "The policy exhibits strong growth and tax revenues, but fails to trigger a meaningful shift in carbon reduction or public transport usage."
                    : "The simulation reveals heavy friction across sectors. The city council should reconsider parameter rates or expand transport lines before enacting tolls."}
                </p>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
              <ShieldAlert size={20} style={{ color: 'var(--color-equity)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>Critical Action Required</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '4px' }}>
                  {final_scores.equity < 50 
                    ? "Low-income household expenses are projected to expand by over 8%. Immediate budget allocations must subsidize local peripheral bus tickets."
                    : final_scores.mobility < 50
                    ? "High road congestion remains unresolved. Transit lines require capital investments to expand carriage volumes."
                    : "Orchestration reports indicate high readiness. Standard operations can commence once monitoring cameras are calibrated."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Critiques */}
      <AgentReport reports={agent_reports} />

    </div>
  );
}
