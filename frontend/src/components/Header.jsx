import React from 'react';
import { Users, Bus, Leaf, DollarSign } from 'lucide-react';

export default function Header({ pageTitle, cities, selectedCityId, onCityChange }) {
  const activeCity = cities.find(c => c.id === Number(selectedCityId)) || cities[0];

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
  };

  return (
    <header
      className="glass-panel"
      style={{
        margin: '16px 16px 0 16px',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        zIndex: 5
      }}
    >
      {/* Page Title */}
      <div>
        <h1 
          style={{ 
            fontSize: '22px', 
            fontWeight: 700, 
            fontFamily: 'var(--font-display)',
            margin: 0,
            color: 'var(--text-bright)',
            letterSpacing: '-0.5px'
          }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* City Baseline Quick Stats & Selector */}
      {activeCity && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          
          {/* Quick Metrics */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '20px',
              paddingRight: '20px',
              borderRight: '1px solid var(--border-light)'
            }}
          >
            {/* Stat: Population */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Population</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>{formatNumber(activeCity.population)}</p>
              </div>
            </div>

            {/* Stat: Transit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bus size={16} style={{ color: 'var(--color-mobility)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Transit Share</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>{activeCity.transit_share}%</p>
              </div>
            </div>

            {/* Stat: Environment (AQI) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Leaf size={16} style={{ color: 'var(--color-environment)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AQI Baseline</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>{activeCity.aqi_baseline}</p>
              </div>
            </div>

            {/* Stat: Budget */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={16} style={{ color: 'var(--color-economy)' }} />
              <div>
                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Muni Budget</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>${formatNumber(activeCity.municipal_budget * 1000000)}</p>
              </div>
            </div>
          </div>

          {/* City Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Active Baseline City</label>
            <select
              value={selectedCityId}
              onChange={(e) => onCityChange(Number(e.target.value))}
              className="glow-border-purple"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-bright)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cities.map((city) => (
                <option 
                  key={city.id} 
                  value={city.id}
                  style={{ background: 'var(--bg-panel-solid)', color: 'var(--text-bright)' }}
                >
                  {city.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      )}
    </header>
  );
}
