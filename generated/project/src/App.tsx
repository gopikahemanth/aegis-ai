import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardOverviewPage } from './components/DashboardOverviewPage';
import { MissionControlPage } from './components/MissionControlPage';
import { TelemetryDeepDivePage } from './components/TelemetryDeepDivePage';
import { StarMapNavigationPage } from './components/StarMapNavigationPage';
import { OrbitalCalculatorPage } from './components/OrbitalCalculatorPage';
import { SystemSettingsPage } from './components/SystemSettingsPage';
import { Mission, TelemetryData, LogEntry, MissionStatus, CelestialObject, CelestialWeather } from './types';
import { MissionRepository } from './services/MissionRepository';
import { CelestialDataService } from './services/CelestialDataService';
import { useTelemetryStream } from './hooks/useTelemetryStream';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [missions, setMissions] = useState<Mission[]>(() => MissionRepository.getMissions());
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    hullTemp: 24.8,
    radiationShield: 99.4,
    warpCoreOutput: 88.2,
    oxygenLevels: 98.9,
    ionEngineThrust: 420,
    solarFlux: 1361,
    fuelReserves: 94.5
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'l-1', timestamp: '14:22:01', system: 'PROPULSION', level: 'SUCCESS', message: 'Subspace ion flux stability at 99.8%. No anomaly detected.' },
    { id: 'l-2', timestamp: '14:21:45', system: 'LIFE_SUPPORT', level: 'SUCCESS', message: 'O2 scrubber efficiency optimal in Sector 4 habitation ring.' },
    { id: 'l-3', timestamp: '14:19:12', system: 'SHIELDING', level: 'WARNING', message: 'Solar flare CME wave grazing Helios-1 exterior thermal matrix.' },
    { id: 'l-4', timestamp: '14:15:30', system: 'NAVIGATION', level: 'SUCCESS', message: 'Autonomous trajectory recalculation completed for Ares Prime.' },
    { id: 'l-5', timestamp: '14:10:05', system: 'QUANTUM_CORE', level: 'SUCCESS', message: 'Harmonic resonance locked at 4.82 GHz.' }
  ]);

  const [celestialObjects] = useState<CelestialObject[]>(CelestialDataService.getCelestialObjects());
  const [celestialWeather] = useState<CelestialWeather>(CelestialDataService.getCelestialWeather());

  // Live Telemetry streaming hook
  useTelemetryStream((newTelemetry) => {
    setTelemetry(newTelemetry);
  });

  const handleAddMission = (newMissionData: Omit<Mission, 'id'>) => {
    const created = MissionRepository.addMission(newMissionData);
    setMissions(MissionRepository.getMissions());
    
    // Add log entry
    const newLog: LogEntry = {
      id: `l-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      system: 'MISSION_CONTROL',
      level: 'SUCCESS',
      message: `Expedition initialized: ${created.name} (${created.codeName}).`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateMissionStatus = (id: string, status: MissionStatus) => {
    const updated = MissionRepository.updateMission(id, { status });
    setMissions(updated);

    const target = updated.find(m => m.id === id);
    if (target) {
      const newLog: LogEntry = {
        id: `l-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        system: 'MISSION_CONTROL',
        level: status === 'Critical' ? 'WARNING' : 'SUCCESS',
        message: `Mission status updated for ${target.name}: ${status}`
      };
      setLogs(prev => [newLog, ...prev]);
    }
  };

  // Render current page based on route
  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return (
          <DashboardOverviewPage 
            missions={missions}
            telemetry={telemetry}
            logs={logs}
            onNavigate={setCurrentRoute}
          />
        );
      case '/missions':
        return (
          <MissionControlPage 
            missions={missions}
            onAddMission={handleAddMission}
            onUpdateStatus={handleUpdateMissionStatus}
          />
        );
      case '/telemetry':
        return (
          <TelemetryDeepDivePage 
            telemetry={telemetry}
            logs={logs}
          />
        );
      case '/starmap':
        return (
          <StarMapNavigationPage 
            celestialObjects={celestialObjects}
            celestialWeather={celestialWeather}
          />
        );
      case '/calculator':
        return <OrbitalCalculatorPage />;
      case '/settings':
        return <SystemSettingsPage />;
      default:
        return (
          <DashboardOverviewPage 
            missions={missions}
            telemetry={telemetry}
            logs={logs}
            onNavigate={setCurrentRoute}
          />
        );
    }
  };

  return (
    <Layout currentRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </Layout>
  );
}

export default App;