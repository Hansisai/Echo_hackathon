import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Sparkles, 
  Zap, 
  AlertTriangle, 
  Sliders, 
  TrendingUp, 
  CheckSquare, 
  Square, 
  FileText,
  Download,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import RadarChart from '../components/RadarChart';
import LineChart from '../components/LineChart';
import RippleGraph from '../components/RippleGraph';
import AgentReport from '../components/AgentReport';

export default function PolicyBundling({ selectedCityId, onSimulationStart, onSimulationSuccess }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState(['congestion_pricing', 'metro_fare_subsidy']);
  const [policyParams, setPolicyParams] = useState({});
  const [bundledResult, setBundledResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-calculated live interaction detector mapping
  const knownSynergies = [
    {
      pair: ['congestion_pricing', 'metro_fare_subsidy'],
      title: 'Modal Shift Transit Multiplier',
      type: 'synergy',
      desc: 'Car tolls + transit fare subsidies incentivize rapid commuter switching to public transport.',
      boost: '+15% Mobility & Equity'
    },
    {
      pair: ['carbon_tax', 'green_canopy'],
      title: 'Ecological Microclimate Catalyst',
      type: 'synergy',
      desc: 'Industrial carbon tax + urban tree planting creates dual carbon sinks and clean air zones.',
      boost: '+18% Environment & Health'
    },
    {
      pair: ['congestion_pricing', 'wfh_mandate'],
      title: 'Peak Gridlock Elimination',
      type: 'synergy',
      desc: 'Remote work flexibility eliminates peak commute volumes, enhancing toll effectiveness.',
      boost: '+12% Traffic Speed'
    },
    {
      pair: ['congestion_pricing', 'carbon_tax'],
      title: 'Regressive Cost Strain Conflict',
      type: 'conflict',
      desc: 'Driving fees + fuel tax increases overlap to burden low-income suburban commuters.',
      boost: '-10% Equity Strain'
    },
    {
      pair: ['metro_fare_subsidy', 'green_canopy'],
      title: 'Municipal Budget Outlay Friction',
      type: 'conflict',
      desc: 'Concurrent rail extension and tree planting place high demands on municipal capital reserves.',
      boost: '-8% Fiscal Reserve'
    }
  ];

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await api.getPolicies();
        // Filter active policies only for bundling
        const active = data.filter(p => p.status === 'active' || !p.status);
        setPolicies(active);

        // Initialize default parameters per policy
        const initialParams = {};
        active.forEach(p => {
          if (p.id === 'congestion_pricing') initialParams[p.id] = { fee: p.default_value || 8.0 };
          else if (p.id === 'metro_fare_subsidy') initialParams[p.id] = { subsidy_level: p.default_value || 30.0, expansion_budget_m: 15.0 };
          else if (p.id === 'carbon_tax') initialParams[p.id] = { tax_rate: p.default_value || 40.0, green_subsidy: 25.0 };
          else if (p.id === 'wfh_mandate') initialParams[p.id] = { wfh_days: p.default_value || 2.0, incentive_pct: 10.0 };
          else if (p.id === 'green_canopy') initialParams[p.id] = { canopy_target: p.default_value || 15.0, maint_budget_m: 5.0 };
          else initialParams[p.id] = { param_value: p.default_value || 10.0 };
        });
        setPolicyParams(initialParams);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load policies for bundling', err);
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  const handleTogglePolicy = (id) => {
    setSelectedPolicyIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 2) {
          setErrorMsg('Minimum 2 policies are required to create a Joint Policy Bundle.');
          return prev;
        }
        setErrorMsg('');
        return prev.filter(pId => pId !== id);
      } else {
        setErrorMsg('');
        return [...prev, id];
      }
    });
  };

  const handleParamChange = (policyId, paramKey, value) => {
    setPolicyParams(prev => ({
      ...prev,
      [policyId]: {
        ...prev[policyId],
        [paramKey]: parseFloat(value)
      }
    }));
  };

  const activeDetectedInteractions = knownSynergies.filter(item => 
    item.pair.every(pid => selectedPolicyIds.includes(pid))
  );

  const handleRunBundle = async () => {
    if (selectedPolicyIds.length < 2) {
      setErrorMsg('Please select at least 2 policies to evaluate joint interactions.');
      return;
    }

    setSimulating(true);
    setErrorMsg('');
    if (onSimulationStart) onSimulationStart();

    try {
      const bundles = selectedPolicyIds.map(pid => ({
        policy_id: pid,
        parameters: policyParams[pid] || {}
      }));

      const res = await api.runBundledSimulation(selectedCityId, bundles);
      setBundledResult(res);
      setSimulating(false);
      // Wait for ConsoleLoader sequence to finish smoothly
      setTimeout(() => {
        if (onSimulationSuccess) {
          // Pass result to parent without redirecting away from bundling page
          // (Parent App.jsx will be updated to support optional redirect)
          onSimulationSuccess(res, false);
        }
      }, 7000);
    } catch (err) {
      console.error('Failed to run bundled simulation', err);
      setErrorMsg(err.message || 'Simulation execution failed.');
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Multi-Policy Modules...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Header Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(10, 11, 20, 0.6) 100%)',
          borderLeft: '4px solid var(--accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Layers size={22} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-bright)' }}>
              Policy Bundling & Synergy Engine
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '700px' }}>
            Combine multiple policies into a unified strategic package. The simulation engine calculates linear delta combinations plus dynamic synergy multipliers and trade-off conflicts.
          </p>
        </div>

        <button
          onClick={handleRunBundle}
          disabled={simulating || selectedPolicyIds.length < 2}
          className="glow-border-purple"
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #6d28d9 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: simulating || selectedPolicyIds.length < 2 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: selectedPolicyIds.length < 2 ? 0.6 : 1,
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          <Zap size={18} />
          {simulating ? 'Simulating Package...' : `Simulate Package (${selectedPolicyIds.length} Policies)`}
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--color-equity)', borderRadius: '8px', color: '#f43f5e', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* Main Grid: Policy Selection & Parameters vs Live Interaction Detector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Left Column: Select Policies & Control Sliders */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} style={{ color: 'var(--accent)' }} />
              1. Select Bundle Policies (Min 2)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {selectedPolicyIds.length} of {policies.length} Active Policies
            </span>
          </div>

          {/* Checkbox grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {policies.map(p => {
              const isSelected = selectedPolicyIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleTogglePolicy(p.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSelected ? (
                    <CheckSquare size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  ) : (
                    <Square size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)', margin: 0 }}>
                      {p.name}
                    </p>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {p.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slider controls grouped by selected policy */}
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <Sliders size={16} style={{ color: 'var(--color-mobility)' }} />
              2. Tune Individual Policy Sliders
            </h3>

            {selectedPolicyIds.map(pid => {
              const pol = policies.find(p => p.id === pid);
              if (!pol) return null;
              const params = policyParams[pid] || {};

              return (
                <div 
                  key={pid} 
                  style={{ 
                    padding: '14px', 
                    borderRadius: '8px', 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                      {pol.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {pol.unit}
                    </span>
                  </div>

                  {pid === 'congestion_pricing' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Peak Daily Charge:</span>
                        <strong style={{ color: 'var(--text-bright)' }}>${params.fee || 8.0} / day</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="25" 
                        step="1"
                        value={params.fee || 8.0} 
                        onChange={(e) => handleParamChange(pid, 'fee', e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--accent)' }}
                      />
                    </div>
                  )}

                  {pid === 'metro_fare_subsidy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span>Fare Subsidy Discount:</span>
                          <strong style={{ color: 'var(--text-bright)' }}>{params.subsidy_level || 30.0}%</strong>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          step="5"
                          value={params.subsidy_level || 30.0} 
                          onChange={(e) => handleParamChange(pid, 'subsidy_level', e.target.value)}
                          style={{ width: '100%', accentColor: 'var(--color-mobility)' }}
                        />
                      </div>
                    </div>
                  )}

                  {pid === 'carbon_tax' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Industrial Carbon Tax Rate:</span>
                        <strong style={{ color: 'var(--text-bright)' }}>${params.tax_rate || 40.0} / ton</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="150" 
                        step="5"
                        value={params.tax_rate || 40.0} 
                        onChange={(e) => handleParamChange(pid, 'tax_rate', e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--color-environment)' }}
                      />
                    </div>
                  )}

                  {pid === 'wfh_mandate' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Remote Days Target:</span>
                        <strong style={{ color: 'var(--text-bright)' }}>{params.wfh_days || 2.0} days / wk</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="5" 
                        step="0.5"
                        value={params.wfh_days || 2.0} 
                        onChange={(e) => handleParamChange(pid, 'wfh_days', e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--color-economy)' }}
                      />
                    </div>
                  )}

                  {pid === 'green_canopy' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span>Canopy Expansion Target:</span>
                        <strong style={{ color: 'var(--text-bright)' }}>+{params.canopy_target || 15.0}%</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        step="1"
                        value={params.canopy_target || 15.0} 
                        onChange={(e) => handleParamChange(pid, 'canopy_target', e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--color-health)' }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Synergy & Conflict Detector Preview */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: '#10b981' }} />
            Live Interaction Detector
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Anticipated cross-policy interaction effects for current checkbox combination:
          </p>

          {activeDetectedInteractions.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px border-dashed var(--border-light)' }}>
              <Info size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                No direct synergy/conflict pair detected yet. Try selecting <strong>Congestion Pricing + Metro Subsidy</strong> or <strong>Carbon Tax + Green Canopy</strong>.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeDetectedInteractions.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: item.type === 'synergy' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    border: item.type === 'synergy' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      background: item.type === 'synergy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                      color: item.type === 'synergy' ? '#10b981' : '#f43f5e'
                    }}>
                      {item.type}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: item.type === 'synergy' ? '#10b981' : '#f43f5e' }}>
                      {item.boost}
                    </span>
                  </div>

                  <strong style={{ fontSize: '13px', color: 'var(--text-bright)' }}>
                    {item.title}
                  </strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulation Results View */}
      {bundledResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          
          {/* Executive Summary Bar */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700 }}>
                Joint Simulation Output
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0', color: 'var(--text-bright)' }}>
                {bundledResult.bundled_policies.join(' + ')} on {bundledResult.city_name}
              </h3>
            </div>

            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={api.getExportUrl(bundledResult.simulation_id) + '?format=html'}
                target="_blank"
                rel="noreferrer"
                className="glow-border-purple"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Export Executive HTML
              </a>
              <a
                href={api.getExportUrl(bundledResult.simulation_id) + '?format=csv'}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={14} /> CSV Projections
              </a>
            </div>
          </div>

          {/* Charts Row: Radar comparison & Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <RadarChart scores={bundledResult.final_scores} baselineScores={bundledResult.baseline_scores} />
            <LineChart projections={bundledResult.projections} />
          </div>

          {/* Combined Ripple Graph DAG */}
          <RippleGraph graphData={bundledResult.ripple_graph} />

          {/* AI Advisor Deliberation Transcripts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent)' }} />
              Multi-Agent Joint Deliberations
            </h3>

            <AgentReport reports={bundledResult.agent_reports} />
          </div>

        </div>
      )}
    </div>
  );
}
