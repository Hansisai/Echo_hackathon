import React, { useState, useEffect } from 'react';
import { ClipboardList, Eye, FileDown, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function Reports({ onViewRun }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadHistory() {
    try {
      const data = await api.getHistory();
      setHistory(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch historical database entries.');
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this simulation run from SQLite database?")) return;
    
    try {
      await api.deleteSimulationRun(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete the run.");
    }
  };

  const handleDownload = (id, e) => {
    e.stopPropagation();
    window.open(api.getExportUrl(id), '_blank');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading simulation logs...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-equity)' }}>{error}</div>;

  return (
    <div className="page-wrapper">
      
      {/* Overview stats */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '10px', color: 'var(--accent)' }}>
          <ClipboardList size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Simulation Registry</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            SQLite holds <strong>{history.length} records</strong>. Select a report to review agent critiques or download a backup copy.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
          No simulation runs saved in the registry yet. Select a city and configure a policy under the Policy Simulator tab to get started!
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '16px' }}>Run Date</th>
                <th style={{ padding: '16px' }}>Policy Applied</th>
                <th style={{ padding: '16px' }}>City Profile</th>
                <th style={{ padding: '16px' }}>Consensus Scores</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((run) => {
                const scores = run.final_scores;
                return (
                  <tr 
                    key={run.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s', cursor: 'pointer' }}
                    onClick={() => onViewRun(run.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px', color: 'var(--text-bright)', fontWeight: 500 }}>
                      {formatDate(run.run_date)}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent)' }}>
                      {run.policy_name}
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-main)' }}>
                      {run.city_name}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--color-economy)' }}>ECO: {scores.economy}</span>
                        <span style={{ color: 'var(--color-environment)' }}>ENV: {scores.environment}</span>
                        <span style={{ color: 'var(--color-mobility)' }}>MOB: {scores.mobility}</span>
                        <span style={{ color: 'var(--color-equity)' }}>EQU: {scores.equity}</span>
                        <span style={{ color: 'var(--color-health)' }}>HLT: {scores.health}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      
                      {/* View Button */}
                      <button
                        onClick={() => onViewRun(run.id)}
                        title="View Dashboard"
                        style={{
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.2)',
                          color: 'var(--accent)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <Eye size={14} /> Review
                      </button>

                      {/* Download JSON */}
                      <button
                        onClick={(e) => handleDownload(run.id, e)}
                        title="Download JSON Report"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-bright)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <FileDown size={14} /> Export
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => handleDelete(run.id, e)}
                        title="Delete Run"
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          color: 'var(--color-equity)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
