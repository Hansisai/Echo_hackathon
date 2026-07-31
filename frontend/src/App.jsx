import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ConsoleLoader from './components/ConsoleLoader';

// Pages
import PolicySimulator from './pages/PolicySimulator';
import Dashboard from './pages/Dashboard';
import Comparison from './pages/Comparison';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [currentRun, setCurrentRun] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial city baselines and latest simulation history
  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await api.getCities();
        setCities(data);
        if (data.length > 0) {
          setSelectedCityId(data[0].id);
        }
        
        // Load latest run from history if available
        const history = await api.getHistory();
        if (history && history.length > 0) {
          const latestRun = await api.getSimulationRun(history[0].id);
          setCurrentRun(latestRun);
          
          // Match selected city with latest run city
          const matchingCity = data.find(c => c.name === latestRun.city_name);
          if (matchingCity) {
            setSelectedCityId(matchingCity.id);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Vite frontend failed to connect to FastAPI server. Retrying in 3s...", err);
        const timer = setTimeout(loadInitialData, 3000);
        return () => clearTimeout(timer);
      }
    }
    loadInitialData();
  }, []);

  const handleCityChange = (id) => {
    setSelectedCityId(id);
  };

  const handleCityCreated = (newCity) => {
    setCities(prev => [...prev, newCity]);
    setSelectedCityId(newCity.id);
    setActiveTab('simulator'); // redirect to playground to try the new city
  };

  const handleSimulationStart = () => {
    setIsSimulating(true);
  };

  const handleSimulationSuccess = (runResult) => {
    setCurrentRun(runResult);
    setIsSimulating(false);
    setActiveTab('dashboard'); // redirect to dashboard to see results
  };

  const handleViewHistoricRun = async (runId) => {
    try {
      const details = await api.getSimulationRun(runId);
      setCurrentRun(details);
      
      // Update header indicators
      const matchingCity = cities.find(c => c.name === details.city_name);
      if (matchingCity) {
        setSelectedCityId(matchingCity.id);
      }
      
      setActiveTab('dashboard');
    } catch (err) {
      alert("Failed to fetch simulation logs details.");
    }
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'simulator':
        return (
          <PolicySimulator
            selectedCityId={selectedCityId}
            onSimulationStart={handleSimulationStart}
            onSimulationSuccess={handleSimulationSuccess}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            runData={currentRun}
            activeCity={cities.find(c => c.id === selectedCityId)}
          />
        );
      case 'comparison':
        return <Comparison />;
      case 'reports':
        return <Reports onViewRun={handleViewHistoricRun} />;
      case 'settings':
        return (
          <Settings
            cities={cities}
            onCityCreated={handleCityCreated}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'simulator':
        return 'Policy Simulation Lab';
      case 'dashboard':
        return 'Multi-Sector Insights Dashboard';
      case 'comparison':
        return 'Scenario Comparison Center';
      case 'reports':
        return 'Simulation Report Registry';
      case 'settings':
        return 'Baseline Dataset Explorer';
      default:
        return 'Living Policy Simulator';
    }
  };

  if (loading) {
    return (
      <div 
        style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '16px',
          background: 'var(--bg-dark)',
          color: 'white',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'flowParticle 1s linear infinite' }}></div>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Connecting to FastAPI Decision Engine...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main viewport */}
      <div className="main-content">
        {/* Global header bar */}
        <Header 
          pageTitle={getPageTitle()} 
          cities={cities} 
          selectedCityId={selectedCityId} 
          onCityChange={handleCityChange} 
        />

        {/* Dynamic page contents */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {renderActivePage()}
        </div>
      </div>

      {/* Console log simulation overlay */}
      <ConsoleLoader isRunning={isSimulating} onComplete={() => setIsSimulating(false)} />
    </div>
  );
}
