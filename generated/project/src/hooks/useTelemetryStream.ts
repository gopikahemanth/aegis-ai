import { useState, useEffect } from 'react';
import { TelemetryData } from '../types';

export function useTelemetryStream(onUpdate?: (data: TelemetryData) => void) {
  useEffect(() => {
    const interval = setInterval(() => {
      const randomized: TelemetryData = {
        hullTemp: Number((24 + Math.random() * 2).toFixed(1)),
        radiationShield: Number((99 + Math.random() * 0.9).toFixed(1)),
        warpCoreOutput: Number((88 + Math.random() * 4).toFixed(1)),
        oxygenLevels: Number((98.5 + Math.random() * 1.2).toFixed(1)),
        ionEngineThrust: Math.floor(410 + Math.random() * 30),
        solarFlux: Math.floor(1355 + Math.random() * 15),
        fuelReserves: Number((94 - Math.random() * 0.2).toFixed(1))
      };
      if (onUpdate) {
        onUpdate(randomized);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [onUpdate]);
}