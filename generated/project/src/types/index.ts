export type MissionStatus = 'Active' | 'En Route' | 'Orbiting' | 'Completed' | 'Critical' | 'Standby';

export interface Subsystem {
  name: string;
  status: 'Optimal' | 'Warning' | 'Critical';
  value: string;
}

export interface Mission {
  id: string;
  name: string;
  codeName: string;
  destination: string;
  status: MissionStatus;
  launchDate: string;
  progress: number;
  crewCount: number;
  distanceFromEarth: string;
  speed: string;
  description: string;
  subsystems: Subsystem[];
}

export interface TelemetryData {
  hullTemp: number;
  radiationShield: number;
  warpCoreOutput: number;
  oxygenLevels: number;
  ionEngineThrust: number;
  solarFlux: number;
  fuelReserves: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  system: 'PROPULSION' | 'LIFE_SUPPORT' | 'SHIELDING' | 'NAVIGATION' | 'QUANTUM_CORE' | 'MISSION_CONTROL';
  level: 'SUCCESS' | 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
}

export interface CelestialObject {
  id: string;
  name: string;
  type: 'Exoplanet' | 'Nebula' | 'Black Hole' | 'Star System';
  distanceLightYears: number;
  discoveredYear: number;
  description: string;
  coordinates: {
    ra: string;
    dec: string;
  };
  temperature: string;
  dangerIndex: 'Safe' | 'Moderate' | 'Extreme';
  atmosphericComposition?: string[];
  x: number;
  y: number;
}

export interface CelestialWeather {
  solarWindSpeed: string;
  geomagneticIndex: string;
  flareActivity: string;
  cosmicRayFlux: string;
}