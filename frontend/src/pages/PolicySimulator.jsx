import React, { useState, useEffect } from 'react';
import { Sliders, Play, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function PolicySimulator({ selectedCityId, onSimulationStart, onSimulationSuccess }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [parameters, setParameters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const data = await api.getPolicies();
        setPolicies(data);
        if (data.length > 0) {
          setSelectedPolicyId(data[0].id);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch policies configuration.');
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  // Initialize parameters when policy changes
  useEffect(() => {
    if (!selectedPolicyId || policies.length === 0) return;
    const policy = policies.find(p => p.id === selectedPolicyId);
    if (!policy) return;

    // Load defaults
    if (selectedPolicyId === 'congestion_pricing') {
      setParameters({ fee: policy.default_value });
    } else if (selectedPolicyId === 'metro_fare_subsidy') {
      setParameters({ subsidy_level: policy.default_value, expansion_budget_m: 15 });
    } else if (selectedPolicyId === 'carbon_tax') {
      setParameters({ tax_rate: policy.default_value, green_subsidy: 25.0 });
    } else if (selectedPolicyId === 'wfh_mandate') {
      setParameters({ wfh_days: policy.default_value, incentive_pct: 10.0 });
    } else if (selectedPolicyId === 'green_canopy') {
      setParameters({ canopy_target: policy.default_value, maint_budget_m: 5.0 });
    }
  }, [selectedPolicyId, policies]);

  const handleSliderChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  const activePolicy = policies.find(p => p.id === selectedPolicyId);

  const handleSubmit = async () => {
    onSimulationStart(); // open console loader
    try {
      const results = await api.runSimulation(selectedCityId, selectedPolicyId, parameters);
      // Wait for ConsoleLoader sequence to finish (we trigger success after the fake terminal typing logs finish)
      setTimeout(() => {
        onSimulationSuccess(results);
      }, 7000);
    } catch (err) {
      console.error(err);
      alert('Simulation call failed. Please make sure the FastAPI server is online.');
    }
  };

  const handleApplyPreset = (presetName) => {
    if (presetName === 'traffic_nightmare') {
      setSelectedPolicyId('congestion_pricing');
      setParameters({ fee: 25.0 });
    } else if (presetName === 'eco_utopia') {
      setSelectedPolicyId('carbon_tax');
      setParameters({ tax_rate: 150.0, green_subsidy: 80.0 });
    } else if (presetName === 'balanced') {
      setSelectedPolicyId('metro_fare_subsidy');
      setParameters({ subsidy_level: 50.0, expansion_budget_m: 30.0 });
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading policy configurations...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-equity)' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Quick Judge Presets */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '16px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '16px', 
          background: 'rgba(139, 92, 246, 0.04)', 
          border: '1px dashed var(--accent)' 
        }}
      >
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-bright)' }}>
            <Sparkles size={16} style={{ color: 'var(--accent)' }} /> Quick Demo Presets
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>One-click scenarios showcasing balanced vs. extreme policy outcomes for judges.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleApplyPreset('traffic_nightmare')} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '12px', borderColor: 'var(--color-equity-glow)' }}
          >
            🚗 Traffic Nightmare
          </button>
          <button 
            onClick={() => handleApplyPreset('eco_utopia')} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '12px', borderColor: 'var(--color-environment-glow)' }}
          >
            🌲 Eco-Utopia
          </button>
          <button 
            onClick={() => handleApplyPreset('balanced')} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '12px', borderColor: 'var(--color-mobility-glow)' }}
          >
            ⚖️ The Sweet Spot
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', width: '100%' }}>
      
      {/* Left Column: Select Scenario */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} style={{ color: 'var(--accent)' }} /> 1. Select Policy Scenario
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Choose which municipal policy intervention to simulate.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {policies.map((p) => {
            const isSelected = selectedPolicyId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPolicyId(p.id)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >
                <div style={{ paddingRight: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: isSelected ? 'var(--text-bright)' : 'var(--text-main)' }}>{p.name}</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    {p.description.substring(0, 80)}...
                  </p>
                </div>
                {isSelected && <CheckCircle size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Configure Parameters */}
      {activePolicy && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600 }}>2. Fine-tune Policy Parameters</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {activePolicy.description}
            </p>
          </div>

          {/* Sliders Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
            
            {/* Primary Slider */}
            {selectedPolicyId === 'congestion_pricing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                  <label style={{ color: 'var(--text-bright)' }}>Congestion Entry Fee</label>
                  <span style={{ color: 'var(--color-economy)' }}>${parameters.fee} / day</span>
                </div>
                <input
                  type="range"
                  min={activePolicy.min_value}
                  max={activePolicy.max_value}
                  step="0.5"
                  value={parameters.fee || activePolicy.default_value}
                  onChange={(e) => handleSliderChange('fee', e.target.value)}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: $0.0 to $25.0 entry toll charge.</span>
              </div>
            )}

            {selectedPolicyId === 'metro_fare_subsidy' && (
              <>
                {/* Slider 1: Subsidy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Ticket Subsidy Level</label>
                    <span style={{ color: 'var(--color-mobility)' }}>{parameters.subsidy_level}% discount</span>
                  </div>
                  <input
                    type="range"
                    min={activePolicy.min_value}
                    max={activePolicy.max_value}
                    step="1"
                    value={parameters.subsidy_level || activePolicy.default_value}
                    onChange={(e) => handleSliderChange('subsidy_level', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: 0% to 100% fare reduction.</span>
                </div>

                {/* Slider 2: Expansion Budget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Annual Track Construction Budget</label>
                    <span style={{ color: 'var(--color-mobility)' }}>${parameters.expansion_budget_m} Million</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={parameters.expansion_budget_m || 15}
                    onChange={(e) => handleSliderChange('expansion_budget_m', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: $5M to $50M for new lines infrastructure.</span>
                </div>
              </>
            )}

            {selectedPolicyId === 'carbon_tax' && (
              <>
                {/* Slider 1: Tax Rate */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Carbon Tax Rate</label>
                    <span style={{ color: 'var(--color-environment)' }}>${parameters.tax_rate} / ton CO2e</span>
                  </div>
                  <input
                    type="range"
                    min={activePolicy.min_value}
                    max={activePolicy.max_value}
                    step="5"
                    value={parameters.tax_rate || activePolicy.default_value}
                    onChange={(e) => handleSliderChange('tax_rate', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: $0 to $150 per metric ton carbon emissions.</span>
                </div>

                {/* Slider 2: Green Subsidy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Renewable Energy Subsidy Rate</label>
                    <span style={{ color: 'var(--color-environment)' }}>{parameters.green_subsidy}% subsidy</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={parameters.green_subsidy || 25}
                    onChange={(e) => handleSliderChange('green_subsidy', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: 0% to 80% coverage for rooftop solar projects.</span>
                </div>
              </>
            )}

            {selectedPolicyId === 'wfh_mandate' && (
              <>
                {/* Slider 1: Days */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Recommended WFH Days</label>
                    <span style={{ color: 'var(--color-infrastructure)' }}>{parameters.wfh_days} days / week</span>
                  </div>
                  <input
                    type="range"
                    min={activePolicy.min_value}
                    max={activePolicy.max_value}
                    step="0.5"
                    value={parameters.wfh_days || activePolicy.default_value}
                    onChange={(e) => handleSliderChange('wfh_days', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: 0 to 5 days weekly remote flexibility.</span>
                </div>

                {/* Slider 2: Corporate tax incentive */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Corporate Tax Relief rate</label>
                    <span style={{ color: 'var(--color-infrastructure)' }}>{parameters.incentive_pct}% rebate</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={parameters.incentive_pct || 10.0}
                    onChange={(e) => handleSliderChange('incentive_pct', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: 0% to 25% tax credits for remote operations alignment.</span>
                </div>
              </>
            )}

            {selectedPolicyId === 'green_canopy' && (
              <>
                {/* Slider 1: Canopy Expansion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Target Canopy Coverage Addition</label>
                    <span style={{ color: 'var(--color-health)' }}>+{parameters.canopy_target}% coverage</span>
                  </div>
                  <input
                    type="range"
                    min={activePolicy.min_value}
                    max={activePolicy.max_value}
                    step="1"
                    value={parameters.canopy_target || activePolicy.default_value}
                    onChange={(e) => handleSliderChange('canopy_target', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: +0% to +50% street tree coverage.</span>
                </div>

                {/* Slider 2: Maintenance Budget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                    <label style={{ color: 'var(--text-bright)' }}>Annual Tree Care/Maintenance Budget</label>
                    <span style={{ color: 'var(--color-health)' }}>${parameters.maint_budget_m} Million</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={parameters.maint_budget_m || 5}
                    onChange={(e) => handleSliderChange('maint_budget_m', e.target.value)}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Range: $1M to $15M for irrigation, pruning, and health care.</span>
                </div>
              </>
            )}

          </div>

          {/* Trigger Button */}
          <button
            onClick={handleSubmit}
            className="btn-primary"
            style={{
              padding: '14px',
              fontSize: '15px',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <Play size={18} fill="white" /> RUN MULTI-AGENT SIMULATION
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
