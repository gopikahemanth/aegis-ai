import { Mission } from '../types';

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm-1',
    name: 'Helios Deep Space Array',
    codeName: 'HEL-01',
    destination: 'Solar Corona Orbit',
    status: 'Active',
    launchDate: '2138-04-12',
    progress: 78,
    crewCount: 4,
    distanceFromEarth: '148.2M km',
    speed: '68,400 km/h',
    description: 'Investigating coronal mass ejections and solar wind harmonics close to perihelion.',
    subsystems: [
      { name: 'Thermal Shielding', status: 'Optimal', value: '99.2%' },
      { name: 'Plasma Injector', status: 'Optimal', value: '1.42 GW' },
      { name: 'Communications Array', status: 'Optimal', value: 'Locked' }
    ]
  },
  {
    id: 'm-2',
    name: 'Ares Prime Outpost',
    codeName: 'ARES-IV',
    destination: 'Mars / Jezero Crater',
    status: 'Orbiting',
    launchDate: '2139-09-01',
    progress: 92,
    crewCount: 12,
    distanceFromEarth: '78.5M km',
    speed: '24,100 km/h',
    description: 'Permanent subterranean human habitat and terraforming atmospheric testing laboratory.',
    subsystems: [
      { name: 'Oxygen Extraction', status: 'Optimal', value: '99.8%' },
      { name: 'Solar Grid Matrix', status: 'Warning', value: '84.1%' },
      { name: 'Hydroponics Bay', status: 'Optimal', value: 'Normal' }
    ]
  },
  {
    id: 'm-3',
    name: 'Titan Atmospheric Probe',
    codeName: 'TTN-09',
    destination: 'Saturn / Titan Moon',
    status: 'En Route',
    launchDate: '2141-01-15',
    progress: 45,
    crewCount: 0,
    distanceFromEarth: '1.24B km',
    speed: '41,800 km/h',
    description: 'Unmanned submersible probe designed to explore hydrocarbon lakes in Kraken Mare.',
    subsystems: [
      { name: 'Ion Propulsion', status: 'Optimal', value: '100%' },
      { name: 'Deep Radar Array', status: 'Optimal', value: 'Standby' },
      { name: 'Cryo-Battery', status: 'Optimal', value: '96.5%' }
    ]
  },
  {
    id: 'm-4',
    name: 'Proxima Centauri Pioneer',
    codeName: 'PX-CENT',
    destination: 'Alpha Centauri System',
    status: 'En Route',
    launchDate: '2142-02-28',
    progress: 14,
    crewCount: 24,
    distanceFromEarth: '4.24 Light Years',
    speed: '0.12 c',
    description: 'First interstellar generational vessel utilizing antimatter catalyzed impulse drive.',
    subsystems: [
      { name: 'Antimatter Containment', status: 'Optimal', value: '99.9%' },
      { name: 'Centrifugal Gravity Ring', status: 'Optimal', value: '1.0 G' },
      { name: 'Stasis Vaults', status: 'Optimal', value: 'Nominal' }
    ]
  }
];

export class MissionRepository {
  private static STORAGE_KEY = 'aetheris_missions_v1';

  public static getMissions(): Mission[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(INITIAL_MISSIONS));
      return INITIAL_MISSIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_MISSIONS;
    }
  }

  public static saveMissions(missions: Mission[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(missions));
  }

  public static addMission(missionData: Omit<Mission, 'id'>): Mission {
    const missions = this.getMissions();
    const newMission: Mission = {
      ...missionData,
      id: `m-${Date.now()}`
    };
    const updated = [newMission, ...missions];
    this.saveMissions(updated);
    return newMission;
  }

  public static updateMission(id: string, updates: Partial<Mission>): Mission[] {
    const missions = this.getMissions();
    const updated = missions.map(m => m.id === id ? { ...m, ...updates } : m);
    this.saveMissions(updated);
    return updated;
  }
}