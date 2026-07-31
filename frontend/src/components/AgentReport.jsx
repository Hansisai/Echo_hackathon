import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, CheckCircle2, Award, Compass, Scale } from 'lucide-react';

export default function AgentReport({ reports }) {
  const [expandedAgent, setExpandedAgent] = useState(null);

  if (!reports || reports.length === 0) return null;

  const agentDetails = {
    athena: { title: 'Chief Meta-Decision & Synthesis Executive', avatar: 'Athena', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
    meta_decision: { title: 'Chief Meta-Decision & Synthesis Executive', avatar: 'Athena', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
    economy: { title: 'Chief Economic Analyst', avatar: 'Eva', color: 'var(--color-economy)', bg: 'var(--color-economy-glow)' },
    transport: { title: 'Transit & Infrastructure Director', avatar: 'Atlas', color: 'var(--color-mobility)', bg: 'var(--color-mobility-glow)' },
    environment: { title: 'Environmental Safeguard Commissioner', avatar: 'Gaia', color: 'var(--color-environment)', bg: 'var(--color-environment-glow)' },
    healthcare: { title: 'Public Health Commissioner', avatar: 'Hygeia', color: 'var(--color-health)', bg: 'var(--color-health-glow)' },
    citizen: { title: 'Social Equity & Citizen Welfare Advocate', avatar: 'Sophia', color: 'var(--color-equity)', bg: 'var(--color-equity-glow)' },
    infrastructure: { title: 'Smart Grid & Utilities Architect', avatar: 'Prometheus', color: 'var(--color-infrastructure)', bg: 'var(--color-infrastructure-glow)' }
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

  const getDecisionBadge = (decision) => {
    if (!decision) return null;
    let bg = 'rgba(139, 92, 246, 0.15)';
    let border = 'rgba(139, 92, 246, 0.4)';
    let text = 'var(--accent)';

    if (decision === 'approve') {
      bg = 'rgba(16, 185, 129, 0.15)';
      border = 'rgba(16, 185, 129, 0.4)';
      text = '#10b981';
    } else if (decision === 'reject') {
      bg = 'rgba(239, 68, 68, 0.15)';
      border = 'rgba(239, 68, 68, 0.4)';
      text = '#ef4444';
    } else if (decision === 'modify') {
      bg = 'rgba(245, 158, 11, 0.15)';
      border = 'rgba(245, 158, 11, 0.4)';
      text = '#f59e0b';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color: text
        }}
      >
        <Award size={13} /> Decision: {decision}
      </span>
    );
  };

  const toggleExpand = (agentName) => {
    setExpandedAgent(prev => prev === agentName ? null : agentName);
  };

  // Separate Meta-Decision Agent (Athena) from sector advisors
  const metaReport = reports.find(r => r.agent_name === 'athena' || r.agent_name === 'meta_decision');
  const sectorReports = reports.filter(r => r.agent_name !== 'athena' && r.agent_name !== 'meta_decision');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Athena Meta-Decision Synthesis Feature Panel */}
      {metaReport && (
        <div 
          className="glass-panel"
          style={{
            padding: '24px',
            borderLeft: '5px solid #ec4899',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  color: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  fontFamily: 'var(--font-display)',
                  border: '1px solid rgba(236, 72, 153, 0.3)'
                }}
              >
                A
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)' }}>Athena</h3>
                  <span style={{ fontSize: '10px', background: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    7TH META-DECISION AGENT
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chief Executive Multi-Agent Deliberation Synthesis</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {metaReport.decision && getDecisionBadge(metaReport.decision)}
              {metaReport.confidence_score !== undefined && metaReport.confidence_score !== null && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Confidence Index</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ec4899' }}>
                    {metaReport.confidence_score <= 1.0 ? Math.round(metaReport.confidence_score * 100) : metaReport.confidence_score}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Executive Summary Statement */}
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-bright)', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', borderLeft: '3px solid #ec4899' }}>
            <strong>Executive Decision Summary:</strong> {metaReport.transcript}
          </div>

          {/* Justification & Alternative Pathways Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Multi-Advisor Justification */}
            {metaReport.justification && (
              <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h4 style={{ fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Scale size={13} /> Advisor Synthesis Justification
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {metaReport.justification}
                </p>
              </div>
            )}

            {/* Alternative Pathways */}
            {metaReport.alternative_pathways && metaReport.alternative_pathways.length > 0 && (
              <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h4 style={{ fontSize: '11px', color: 'var(--color-mobility)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Compass size={13} /> Alternative Strategic Pathways
                </h4>
                <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {metaReport.alternative_pathways.map((path, idx) => (
                    <li key={idx}>{path}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 6 Specialized Sector Advisors Section */}
      <div>
        <h2 style={{ fontSize: '17px', fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          Specialized Sector AI Advisors
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Domain evaluations across Economy, Mobility, Environment, Healthcare, Social Equity, and Infrastructure.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
          {sectorReports.map((report) => {
            const detail = agentDetails[report.agent_name] || { title: 'Specialist Advisor', avatar: 'AI', color: 'var(--accent)', bg: 'var(--accent-glow)' };
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
                        gap: '12px'
                      }}
                    >
                      {/* Risks Section */}
                      {report.risks && report.risks.length > 0 && (
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
                      )}

                      {/* Mitigations Section */}
                      {report.mitigations && report.mitigations.length > 0 && (
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
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
