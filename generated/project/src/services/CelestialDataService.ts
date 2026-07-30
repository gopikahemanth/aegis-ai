import { CelestialObject, CelestialWeather } from '../types';

export class CelestialDataService {
  public static getCelestialObjects(): CelestialObject[] {
    return [
      {
        id: 'c-1',
        name: 'Kepler-186f',
        type: 'Exoplanet',
        distanceLightYears: 582,
        discoveredYear: 2114,
        description: 'First Earth-sized exoplanet discovered in the habitable zone of a red dwarf star with vast temperate oceans.',
        coordinates: { ra: '19h 54m 36s', dec: '+43° 57\' 18"' },
        temperature: '14.2 °C',
        dangerIndex: 'Safe',
        atmosphericComposition: ['Nitrogen 76%', 'Oxygen 21%', 'Argon 2.1%'],
        x: 180,
        y: 120
      },
      {
        id: 'c-2',
        name: 'Orion Molecular Cloud',
        type: 'Nebula',
        distanceLightYears: 1344,
        discoveredYear: 2020,
        description: 'Vast star-forming nursery glowing with ionized hydrogen gas and stellar protostar clusters.',
        coordinates: { ra: '05h 35m 17s', dec: '-05° 23\' 28"' },
        temperature: '-210 °C',
        dangerIndex: 'Moderate',
        atmosphericComposition: ['Hydrogen 90%', 'Helium 9%', 'Carbon Monoxide 1%'],
        x: 280,
        y: 240
      },
      {
        id: 'c-3',
        name: 'Gargantua Prime',
        type: 'Black Hole',
        distanceLightYears: 2400,
        discoveredYear: 2128,
        description: 'Supermassive rotating black hole surrounded by an intense accretion disk of superheated plasma.',
        coordinates: { ra: '12h 42m 04s', dec: '+11° 14\' 55"' },
        temperature: '1,200,000 °C',
        dangerIndex: 'Extreme',
        x: 120,
        y: 280
      },
      {
        id: 'c-4',
        name: 'Trappist-1e',
        type: 'Exoplanet',
        distanceLightYears: 39.6,
        discoveredYear: 2108,
        description: 'Rocky terrestrial exoplanet orbiting an ultra-cool dwarf star with high subsurface water ice.',
        coordinates: { ra: '23h 06m 29s', dec: '-05° 02\' 28"' },
        temperature: '-12.5 °C',
        dangerIndex: 'Safe',
        atmosphericComposition: ['Carbon Dioxide 62%', 'Nitrogen 35%', 'Oxygen 3%'],
        x: 220,
        y: 80
      }
    ];
  }

  public static getCelestialWeather(): CelestialWeather {
    return {
      solarWindSpeed: '412 km/s',
      geomagneticIndex: 'Kp 2 (Quiet)',
      flareActivity: 'C-Class Low (Nominal)',
      cosmicRayFlux: '1,420 particles/m²s'
    };
  }
}