import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function ConsoleLoader({ isRunning, onComplete }) {
  const [logs, setLogs] = useState([]);
  const consoleEndRef = useRef(null);

  const logSequence = [
    { text: "> SYSTEM INITIALIZATION IN PROGRESS...", color: "#8b5cf6", delay: 300 },
    { text: "> LOAD BASELINE DATASET: Querying SQLite for city parameters...", color: "#9ca3af", delay: 600 },
    { text: "> PARSING SLIDER INPUTS: Extracting policy parameters and weights...", color: "#9ca3af", delay: 900 },
    { text: "> CALIBRATING SIMULATION ENGINE: Solving multi-sector differential multipliers...", color: "#9ca3af", delay: 1200 },
    { text: "> CALCULATING DELTAS: Economy, Environment, Health, Mobility, Equity...", color: "#10b981", delay: 1500 },
    { text: "> AGENT ORCHESTRATION: Initializing parallel virtual agent threads...", color: "#8b5cf6", delay: 1800 },
    { text: "> INVOKING AGENTS: economy, environment, transport, healthcare, citizen, infrastructure...", color: "#8b5cf6", delay: 2100 },
    { text: "> QUERYING GEMINI API: Dispatching LLM requests with context parameters...", color: "#06b6d4", delay: 2400 },
    { text: "   [Eva - Economic Agent] Deliberation logged: Evaluating budget impact...", color: "#f59e0b", delay: 2900 },
    { text: "   [Gaia - Environment Agent] Deliberation logged: Calculating carbon sinks...", color: "#10b981", delay: 3300 },
    { text: "   [Atlas - Transport Agent] Deliberation logged: Analyzing modal shifts...", color: "#06b6d4", delay: 3700 },
    { text: "   [Sophia - Citizen Agent] Deliberation logged: Gauging income burden...", color: "#f43f5e", delay: 4100 },
    { text: "   [Hygeia - Health Agent] Deliberation logged: Estimating AQI savings...", color: "#14b8a6", delay: 4500 },
    { text: "   [Prometheus - Infrastructure Agent] Deliberation logged: Assessing grid spikes...", color: "#a78bfa", delay: 4900 },
    { text: "> COMPILING TRANSCRIPTS: Building risk lists and mitigation suggestions...", color: "#9ca3af", delay: 5300 },
    { text: "> DATABASE UPDATE: Writing results to sqlite:///database.db...", color: "#10b981", delay: 5700 },
    { text: "> TRANSACTION COMMITTED: Save successful. Generated Report ID: sim_" + Math.random().toString(36).substring(2, 10), color: "#10b981", delay: 6100 },
    { text: "> Consensus achieved. Visualizing dashboard matrices...", color: "#8b5cf6", delay: 6500 }
  ];

  useEffect(() => {
    if (!isRunning) {
      setLogs([]);
      return;
    }

    setLogs([logSequence[0]]);
    const timers = [];

    // Trigger sequential logs
    logSequence.forEach((item, index) => {
      if (index === 0) return;
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, item]);
      }, item.delay);
      timers.push(timer);
    });

    // Complete loader
    const completionTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 7000);
    timers.push(completionTimer);

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [isRunning]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isRunning) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '800px',
          height: '450px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderColor: 'var(--border-glow)',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)', letterSpacing: '0.5px' }}>AGENT_WORKSPACE_CONSOLE // RUNNING...</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }}></span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
          </div>
        </div>

        {/* Terminal Screen */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            lineHeight: 1.6,
            background: '#040508',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {logs.map((log, index) => (
            <div key={index} style={{ color: log.color, whiteSpace: 'pre-wrap' }}>
              {log.text}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#8b5cf6' }}>&gt;</span>
            <span 
              style={{
                width: '8px',
                height: '14px',
                backgroundColor: '#8b5cf6',
                display: 'inline-block',
                animation: 'flowParticle 0.8s infinite step-start'
              }}
            ></span>
          </div>
          <div ref={consoleEndRef} />
        </div>

        {/* Terminal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-light)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.02)'
          }}
        >
          <span>DELIBERATION_THREADS_COUNT: 6</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-glow" style={{ color: 'var(--accent)' }}>●</span> GEMINI ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
