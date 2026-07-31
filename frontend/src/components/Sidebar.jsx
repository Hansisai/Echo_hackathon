import React from 'react';
import { 
  Sliders, 
  LayoutDashboard, 
  GitCompare, 
  ClipboardList, 
  Database,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'simulator', label: 'Policy Simulator', icon: Sliders },
    { id: 'bundling', label: 'Policy Bundles', icon: Layers },
    { id: 'digest', label: 'Civic Digest', icon: BookOpen },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comparison', label: 'Comparison', icon: GitCompare },
    { id: 'reports', label: 'Reports & History', icon: ClipboardList },
    { id: 'settings', label: 'City Datasets', icon: Database },
  ];

  return (
    <aside 
      className="glass-panel" 
      style={{
        width: '260px',
        height: 'calc(100vh - 32px)',
        margin: '16px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {/* Header Logo */}
      <div 
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div 
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #6d28d9 100%)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--accent-glow)',
            color: 'white'
          }}
        >
          <Sparkles size={20} className="pulse-glow" style={{ color: 'white' }} />
        </div>
        <div>
          <h2 
            style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.5px',
              color: 'var(--text-bright)'
            }}
          >
            Living Policy
          </h2>
          <span 
            style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 500
            }}
          >
            Agentic Simulator
          </span>
        </div>
      </div>

      {/* Menu Navigation */}
      <nav 
        style={{ 
          flex: 1, 
          padding: '24px 12px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px' 
        }}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                color: isActive ? 'var(--text-bright)' : 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.color = 'var(--text-bright)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'inherit' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div 
        style={{
          padding: '20px',
          borderTop: '1px solid var(--border-light)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <p>Operational Environment</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span 
            style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981',
              display: 'inline-block'
            }}
          ></span>
          <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>FastAPI + SQLite Active</span>
        </div>
      </div>
    </aside>
  );
}
