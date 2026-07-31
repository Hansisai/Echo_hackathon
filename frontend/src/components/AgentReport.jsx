import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AgentReport({ reports }) {
  const [expandedAgent, setExpandedAgent] = useState(null);

  const agentDetails = {
    economy: { title: 'Chief Economic Analyst', avatar: 'Eva', color: 'var(--color-economy)', bg: 'var(--color-economy-glow)' },
    transport: { title: 'Transit & Infrastructure', avatar: 'Atlas', color: 'var(--color-mobility)', bg: 'var(--color-mobility-glow)' },
    environment: { title: 'Environmental Commissioner', avatar: 'Gaia', color: 'var(--color-environment)', bg: 'var(--color-environment-glow)' },
    healthcare: { title: 'Public Health Director', avatar: 'Hygeia', color: 'var(--color-health)', bg: 'var(--color-health-glow)' },
    citizen: { title: 'Social Equity Advocate', avatar: 'Sophia', color: 'var(--color-equity)', bg: 'var(--color-equity-glow)' },
    infrastructure: { title: 'Smart Utilities Architect', avatar: 'Prometheus', color: 'var(--color-infrastructure)', bg: 'var(--color-infrastructure-glow)' }
  };

  const getSentimentPill = (sentiment) => {
    let bg = 'rgba(255, 255, 255, 0.05)';
    let border = 'rgba(255, 255, 255, 0.1)';
    let text = 'var(--text-muted)';

    if (sentiment === 'positive') {
      bg = 'rgba(16, 185, 129, 0.1)';
      border = 'rgba(16, 185, 129, 0.3)';
      text = 'var(--color-environment)';
    } else if (sentiment === 'negative') {
      bg = 'rgba(244, 63, 94, 0.1)';
      border = 'rgba(244, 63, 94, 0.3)';
      text = 'var(--color-equity)';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color: text
        }}
      >
        {sentiment}
      </span>
    );
  };

  const toggleExpand = (agentName) => {
    if (expandedAgent === agentName) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentName);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-display)' }}>Specialized Virtual AI Advisors</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Qualitative transcripts, risk logs, and policy adjustments submitted by agents.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {reports.map((report) => {
          const detail = agentDetails[report.agent_name] || { title: 'Specialist', avatar: 'AI', color: 'var(--accent)', bg: 'var(--accent-glow)' };
          const isExpanded = expandedAgent === report.agent_name;

          return (
            <div
              key={report.agent_name}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: `4px solid ${detail.color}`
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Avatar */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: detail.bg,
                      color: detail.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '15px',
                      fontFamily: 'var(--font-display)',
                      border: `1px solid ${detail.color}33`
                    }}
                  >
                    {detail.avatar[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{detail.avatar}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{detail.title}</p>
                  </div>
                </div>

                {/* Score & Sentiment */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                    {report.score} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>/100</span>
                  </div>
                  {getSentimentPill(report.sentiment)}
                </div>
              </div>

              {/* Transcript Speech */}
              <div
                style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'var(--text-main)',
                  fontStyle: 'italic',
                  paddingLeft: '12px',
                  borderLeft: '2px dashed rgba(255, 255, 255, 0.1)'
                }}
              >
                "{report.transcript}"
              </div>

              {/* Collapsible Action Items */}
              <div>
                <button
                  onClick={() => toggleExpand(report.agent_name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '8px 0',
                    borderTop: '1px solid var(--border-light)'
                  }}
                >
                  <span>RISKS & RECOMMENDATIONS</span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div
                    style={{
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      animation: 'flowParticle 0.3s ease-out'
                    }}
                  >
                    {/* Risks Section */}
                    <div>
                      <h4
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-equity)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          fontWeight: 700
                        }}
                      >
                        <ShieldAlert size={12} /> Identified Risks
                      </h4>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {report.risks.map((risk, index) => (
                          <li key={index}>{risk}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Mitigations Section */}
                    <div>
                      <h4
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-environment)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '6px',
                          textTransform: 'uppercase',
                          fontWeight: 700
                        }}
                      >
                        <CheckCircle2 size={12} /> Recommended Mitigations
                      </h4>
                      <ul style={{ paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {report.mitigations.map((mit, index) => (
                          <li key={index}>{mit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
