import React, { useState, useEffect } from 'react';
import { GitCompare, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import RadarChart from '../components/RadarChart';

export default function Comparison() {
  const [history, setHistory] = useState([]);
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [runA, setRunA] = useState(null);
  const [runB, setRunB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.getHistory();
        setHistory(data);
        if (data.length >= 2) {
          setRunAId(data[0].id);
          setRunBId(data[1].id);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load simulation history.');
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Fetch Run A details when selection changes
  useEffect(() => {
    if (!runAId) return;
    async function fetchA() {
      try {
        const data = await api.getSimulationRun(runAId);
        setRunA(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchA();
  }, [runAId]);

  // Fetch Run B details when selection changes
  useEffect(() => {
    if (!runBId) return;
    async function fetchB() {
      try {
        const data = await api.getSimulationRun(runBId);
        setRunB(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchB();
  }, [runBId]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading comparative logs...</div>;

  if (history.length < 2) {
    return (
      <div 
        className="glass-panel" 
        style={{ 
          padding: '60px 40px', 
          textAlign: 'center', 
          maxWidth: '600px', 
          margin: '40px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px' 
        }}
      >
        <GitCompare size={40} style={{ color: 'var(--accent)' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Insufficient Simulation Logs</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
          You need at least <strong>two saved simulation runs</strong> in history to compare scenarios. Navigate to the Policy Simulator and run a few scenarios with different slider configurations!
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

  return (
    <div className="page-wrapper">
      
      {/* Select runs panel */}
      <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '20px' }}>
        
        {/* Dropdown A */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Simulation Run A</label>
          <select
            value={runAId}
            onChange={(e) => setRunAId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-bright)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {history.map(run => (
              <option key={run.id} value={run.id} style={{ background: 'var(--bg-panel-solid)' }}>
                {run.policy_name} ({run.city_name}) - Y{new Date(run.run_date).getFullYear()}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <GitCompare size={20} />
        </div>

        {/* Dropdown B */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Simulation Run B</label>
          <select
            value={runBId}
            onChange={(e) => setRunBId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-bright)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {history.map(run => (
              <option key={run.id} value={run.id} style={{ background: 'var(--bg-panel-solid)' }} disabled={run.id === runAId}>
                {run.policy_name} ({run.city_name}) - Y{new Date(run.run_date).getFullYear()}
              </option>
            ))}
          </select>
        </div>

      </div>

      {runA && runB && (
        <>
          {/* Parameter Details Compare */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Run A card */}
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent)' }}>
              <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>SCENARIO A</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{runA.policy_name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied to {runA.city_name}</p>
              
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(runA.parameters).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                    {k.replace('_', ' ')}: <strong>{v}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Run B card */}
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-mobility)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-mobility)', fontWeight: 700 }}>SCENARIO B</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>{runB.policy_name}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied to {runB.city_name}</p>
              
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(runB.parameters).map(([k, v]) => (
                  <span key={k} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                    {k.replace('_', ' ')}: <strong>{v}</strong>
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
                    <th style={{ padding: '12px 16px' }}>Scenario A</th>
                    <th style={{ padding: '12px 16px' }}>Scenario B</th>
                    <th style={{ padding: '12px 16px' }}>Margin Delta</th>
                    <th style={{ padding: '12px 16px' }}>Efficiency Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {indexes.map((idx) => {
                    const scoreA = runA.final_scores[idx.key] || 0;
                    const scoreB = runB.final_scores[idx.key] || 0;
                    const diff = Number((scoreB - scoreA).toFixed(1));
                    
                    let leadText = 'Neutral';
                    let leadColor = 'var(--text-muted)';
                    if (diff > 0) {
                      leadText = 'Scenario B (+ ' + diff + ')';
                      leadColor = 'var(--color-mobility)';
                    } else if (diff < 0) {
                      leadText = 'Scenario A (+ ' + Math.abs(diff) + ')';
                      leadColor = 'var(--accent)';
                    }

                    return (
                      <tr key={idx.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-bright)' }}>{idx.label}</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)' }}>{scoreA} / 100</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)' }}>{scoreB} / 100</td>
                        <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', color: diff > 0 ? 'var(--color-environment)' : diff < 0 ? 'var(--color-equity)' : 'inherit' }}>
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

          {/* Radar Charts comparison side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <RadarChart scores={runA.final_scores} />
            <RadarChart scores={runB.final_scores} />
          </div>
        </>
      )}

    </div>
  );
}
