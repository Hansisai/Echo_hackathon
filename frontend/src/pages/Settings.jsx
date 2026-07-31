import React, { useState } from 'react';
import { Database, Plus, Check } from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ cities, onCityCreated }) {
  const [name, setName] = useState('');
  const [population, setPopulation] = useState('1500000');
  const [transitShare, setTransitShare] = useState('30');
  const [avgCommute, setAvgCommute] = useState('12');
  const [co2, setCo2] = useState('5.5');
  const [aqi, setAqi] = useState('80');
  const [income, setIncome] = useState('45000');
  const [health, setHealth] = useState('65');
  const [budget, setBudget] = useState('1200');
  const [satisfaction, setSatisfaction] = useState('60');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a name for the custom city baseline.');

    const cityPayload = {
      name: name.trim(),
      population: Number(population),
      transit_share: Number(transitShare),
      avg_commute_dist: Number(avgCommute),
      co2_baseline: Number(co2),
      aqi_baseline: Number(aqi),
      median_income: Number(income),
      health_index: Number(health),
      municipal_budget: Number(budget),
      satisfaction_baseline: Number(satisfaction)
    };

    setSaving(true);
    try {
      const createdCity = await api.createCity(cityPayload);
      onCityCreated(createdCity);
      // Reset form
      setName('');
      alert('Custom city baseline successfully registered in SQLite database!');
    } catch (err) {
      alert('Failed to register custom city baseline: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      
      {/* Left Column: Explorer */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} style={{ color: 'var(--accent)' }} /> City Baseline Explorer
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Inspect baseline datasets registered inside the database.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '600px' }}>
          {cities.map((city) => (
            <div 
              key={city.id} 
              className="glass-card" 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-bright)' }}>{city.name}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {city.id}</span>
              </div>

              {/* Grid of parameters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Population</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>
                    {city.population >= 1000000 ? (city.population / 1000000).toFixed(1) + 'M' : city.population.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Transit Share</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.transit_share}%</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Avg Commute</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.avg_commute_dist} km</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>CO2 Per Capita</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.co2_baseline} t/yr</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>AQI Index</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.aqi_baseline}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Median Income</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>${city.median_income.toLocaleString()}/yr</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Muni Budget</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>${city.municipal_budget} Million</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Satisfaction</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.satisfaction_baseline}%</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '9px' }}>Health Index</p>
                  <p style={{ color: 'var(--text-bright)', fontWeight: 600, marginTop: '2px' }}>{city.health_index}/100</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Create custom */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} style={{ color: 'var(--accent)' }} /> 2. Register Custom Baseline
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Calibrate a new municipal baseline scenario to run custom simulations against.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: 'var(--text-bright)' }}>City Name</label>
            <input
              type="text"
              placeholder="e.g. Eco-Haven, Sprawl-Ville"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glow-border-purple"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Population</label>
              <input
                type="number"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Transit Share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={transitShare}
                onChange={(e) => setTransitShare(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Avg Commute (km)</label>
              <input
                type="number"
                value={avgCommute}
                onChange={(e) => setAvgCommute(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>CO2 (t/capita/yr)</label>
              <input
                type="number"
                step="0.1"
                value={co2}
                onChange={(e) => setCo2(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>AQI (0-500)</label>
              <input
                type="number"
                value={aqi}
                onChange={(e) => setAqi(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Median Income ($)</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Muni Budget ($M)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: 600 }}>Satisfaction (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={satisfaction}
                onChange={(e) => setSatisfaction(e.target.value)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: 600 }}>Health Index (0-100)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={health}
              onChange={(e) => setHealth(e.target.value)}
              style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.03)', color: 'white' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{
              padding: '12px',
              justifyContent: 'center',
              marginTop: '10px'
            }}
          >
            {saving ? 'Saving...' : 'Register New Baseline Dataset'}
          </button>

        </form>
      </div>

    </div>
  );
}
