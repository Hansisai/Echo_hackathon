import React, { useState, useEffect } from 'react';
import { GitCompare, Award, Compass, Scale, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import RadarChart from '../components/RadarChart';
import LineChart from '../components/LineChart';

export default function Comparison() {
  const [history, setHistory] = useState([]);
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [runA, setRunA] = useState(null);
  const [runB, setRunB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.getHistory();
        setHistory(data || []);
        if (data && data.length >= 2) {
          setRunAId(data[0].id);
          setRunBId(data[1].id);
        } else if (data && data.length === 1) {
          setRunAId(data[0].id);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Fetch Run A details when selection changes
  useEffect(() => {
    if (!runAId) return;
    async function fetchA() {
      setLoadingA(true);
      try {
        const data = await api.getSimulationRun(runAId);
        setRunA(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingA(false);
      }
    }
    fetchA();
  }, [runAId]);

  // Fetch Run B details when selection changes
  useEffect(() => {
    if (!runBId) return;
    async function fetchB() {
      setLoadingB(true);
      try {
        const data = await api.getSimulationRun(runBId);
        setRunB(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingB(false);
      }
    }
    fetchB();
  }, [runBId]);

  const formatParamValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(', ');
    }
    return String(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading comparative logs...</div>;
  }

  if (history.length < 2) {
    return (
      <div 
        className="glass-panel" 
        style={{ 
          padding: '60px 40px', 
          textAlign: 'center', 
          maxWidth: '620px', 
          margin: '40px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px' 
        }}
      >
        <GitCompare size={48} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Insufficient Simulation Logs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>
          You need at least <strong>two saved simulation runs</strong> in history to perform scenario comparisons. Please navigate to the <strong>Policy Simulator</strong> or <strong>Policy Bundles</strong> playground and execute another simulation scenario!
        </p>
      </div>
    );
  }

  const indexes = [
    { key: 'economy', label: 'Economy' },
    { key: 'environment', label: 'Environment' },
    { key: 'mobility', label: 'Mobility' },
    { key: 'equity', label: 'Equity' },
    { key: 'health', label: 'Health' }
  ];

  const calcAvg = (scores) => {
    if (!scores) return 0;
    const vals = Object.values(scores);
    if (!vals.length) return 0;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  };

  const avgA = runA ? calcAvg(runA.final_scores) : 0;
  const avgB = runB ? calcAvg(runB.final_scores) : 0;
  const avgDiff = Number((avgB - avgA).toFixed(1));

  const getMetaReport = (runData) => {
    if (!runData || !runData.agent_reports) return null;
    return runData.agent_reports.find(r => r.agent_name === 'meta_decision' || r.agent_name === 'athena');
  };

  const metaA = getMetaReport(runA);
  const metaB = getMetaReport(runB);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Select runs panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '20px' }}>
        
        {/* Dropdown A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Scenario A (Baseline)
          </label>
          <select
            value={runAId}
            onChange={(e) => setRunAId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-bright)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {history.map(run => (
              <option key={run.id} value={run.id} style={{ background: 'var(--bg-panel-solid)' }}>
                {run.policy_name} ({run.city_name}) — {formatDate(run.run_date)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <GitCompare size={24} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>VS</span>
        </div>

        {/* Dropdown B */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--color-mobility)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
            Scenario B (Comparative)
          </label>
          <select
            value={runBId}
            onChange={(e) => setRunBId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-bright)',
              border: '1px solid var(--color-mobility)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {history.map(run => (
              <option key={run.id} value={run.id} style={{ background: 'var(--bg-panel-solid)' }} disabled={run.id === runAId}>
                {run.policy_name} ({run.city_name}) — {formatDate(run.run_date)}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Loading state indicator */}
      {(loadingA || loadingB) && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Fetching scenario metrics...
        </div>
      )}

      {runA && runB && !loadingA && !loadingB && (
        <>
          {/* Executive Comparative Summary Banner */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: avgDiff > 0 ? 'rgba(6, 182, 212, 0.2)' : avgDiff < 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: avgDiff > 0 ? 'var(--color-mobility)' : avgDiff < 0 ? 'var(--accent)' : 'var(--text-bright)'
                }}
              >
                <Award size={24} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Comparative Synthesis Verdict
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '2px' }}>
                  {avgDiff > 0 ? (
                    <span style={{ color: 'var(--color-mobility)' }}>Scenario B leads overall (+{avgDiff} avg index pts)</span>
                  ) : avgDiff < 0 ? (
                    <span style={{ color: 'var(--accent)' }}>Scenario A leads overall (+{Math.abs(avgDiff)} avg index pts)</span>
                  ) : (
                    <span>Equal Overall Impact Across Both Scenarios</span>
                  )}
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>SCENARIO A AVG</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{avgA} / 100</div>
              </div>
              <div style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: 700 }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--color-mobility)', fontWeight: 700 }}>SCENARIO B AVG</div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{avgB} / 100</div>
              </div>
            </div>
          </div>

          {/* Parameter Details Compare Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Run A card */}
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.5px' }}>SCENARIO A</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{runA.policy_name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied to {runA.city_name} • Run ID: {runA.simulation_id}</p>
              
              <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(runA.parameters || {}).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    {k.replace(/_/g, ' ')}: <strong>{formatParamValue(v)}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Run B card */}
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-mobility)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-mobility)', fontWeight: 700, letterSpacing: '0.5px' }}>SCENARIO B</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{runB.policy_name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied to {runB.city_name} • Run ID: {runB.simulation_id}</p>
              
              <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(runB.parameters || {}).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    {k.replace(/_/g, ' ')}: <strong>{formatParamValue(v)}</strong>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Scores Comparison Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Indices Comparison Matrix</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Sector Index</th>
                    <th style={{ padding: '12px 16px' }}>Scenario A Score</th>
                    <th style={{ padding: '12px 16px' }}>Scenario B Score</th>
                    <th style={{ padding: '12px 16px' }}>Margin Delta</th>
                    <th style={{ padding: '12px 16px' }}>Efficiency Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {indexes.map((idx) => {
                    const scoreA = runA.final_scores ? (runA.final_scores[idx.key] || 0) : 0;
                    const scoreB = runB.final_scores ? (runB.final_scores[idx.key] || 0) : 0;
                    const diff = Number((scoreB - scoreA).toFixed(1));
                    
                    let leadText = 'Equal Impact';
                    let leadColor = 'var(--text-muted)';
                    if (diff > 0) {
                      leadText = `Scenario B (+${diff} pts)`;
                      leadColor = 'var(--color-mobility)';
                    } else if (diff < 0) {
                      leadText = `Scenario A (+${Math.abs(diff)} pts)`;
                      leadColor = 'var(--accent)';
                    }

                    return (
                      <tr key={idx.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-bright)' }}>{idx.label}</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)' }}>{scoreA} / 100</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)' }}>{scoreB} / 100</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', color: diff > 0 ? 'var(--color-environment)' : diff < 0 ? 'var(--accent)' : 'inherit' }}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: leadColor }}>{leadText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Athena / Meta-Decision Advisor Comparison (if available) */}
          {(metaA || metaB) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>ATHENA SYNTHESIS — SCENARIO A</span>
                  {metaA?.decision && (
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        background: metaA.decision === 'approve' ? 'rgba(16, 185, 129, 0.2)' : metaA.decision === 'reject' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: metaA.decision === 'approve' ? '#10b981' : metaA.decision === 'reject' ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {metaA.decision} ({metaA.confidence_score ? Math.round(metaA.confidence_score * (metaA.confidence_score <= 1.0 ? 100 : 1)) : 85}% Conf.)
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-bright)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{metaA?.transcript || 'Meta-decision evaluation logged.'}"
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-mobility)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-mobility)', fontWeight: 700 }}>ATHENA SYNTHESIS — SCENARIO B</span>
                  {metaB?.decision && (
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        background: metaB.decision === 'approve' ? 'rgba(16, 185, 129, 0.2)' : metaB.decision === 'reject' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: metaB.decision === 'approve' ? '#10b981' : metaB.decision === 'reject' ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {metaB.decision} ({metaB.confidence_score ? Math.round(metaB.confidence_score * (metaB.confidence_score <= 1.0 ? 100 : 1)) : 85}% Conf.)
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-bright)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{metaB?.transcript || 'Meta-decision evaluation logged.'}"
                </p>
              </div>

            </div>
          )}

          {/* Radar Charts comparison side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <RadarChart 
              scores={runA.final_scores} 
              title={`Scenario A: ${runA.policy_name}`} 
              subtitle="5-Sector Multi-Dimensional Balance"
              accentColor="var(--accent)"
              fillColor="rgba(139, 92, 246, 0.25)"
            />
            <RadarChart 
              scores={runB.final_scores} 
              title={`Scenario B: ${runB.policy_name}`} 
              subtitle="5-Sector Multi-Dimensional Balance"
              accentColor="var(--color-mobility)"
              fillColor="rgba(6, 182, 212, 0.25)"
            />
          </div>

          {/* 5-Year Trend Outlook Comparison */}
          {runA.projections && runB.projections && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '8px' }}>
                  Scenario A: 5-Year Trend Forecast
                </h4>
                <LineChart projections={runA.projections} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-mobility)', marginBottom: '8px' }}>
                  Scenario B: 5-Year Trend Forecast
                </h4>
                <LineChart projections={runB.projections} />
              </div>
            </div>
          )}

        </>
      )}

    </div>
  );
}
