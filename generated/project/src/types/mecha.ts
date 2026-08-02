export interface TelemetryData {
  coreTemp: string;
  hydraulicPressure: string;
  servoVoltage: string;
  stabilityIndex: string;
  reactorStatus: string;
  ammoCapacity: string;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  telemetry: TelemetryData;
  activeRange: [number, number];
  keyFeatures: string[];
}

export interface CustomizationState {
  primaryColor: string;
  accentColor: string;
  visorGlow: string;
  armorCoating: 'matte' | 'glossy' | 'titanium' | 'carbon';
  weaponryLoadout: 'standard' | 'heavy' | 'plasma' | 'stealth';
}