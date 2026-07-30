import React, { useState } from 'react';
import { Calculator, Rocket, Compass, ArrowRight, Gauge, RefreshCw, Zap } from 'lucide-react';

export const OrbitalCalculatorPage: React.FC = () => {
  const [velocity, setVelocity] = useState<number>(7.8);
  const [altitude, setAltitude] = useState<number>(400);
  const [mass, setMass] = useState<number>(45000);
  const [celestialBody, setCelestialBody] = useState<string>('Earth');

  // Calculation formulas
  const calculateOrbitalPeriod = () => {
    // T = 2 * pi * sqrt((R + h)^3 / GM)
    const GM = celestialBody === 'Earth' ? 398600 : celestialBody === 'Mars' ? 42828 : 126712;
    const radius = celestialBody === 'Earth' ? 6371 : celestialBody === 'Mars' ? 33895 : 71492;
    const r = radius + Number(altitude);
    const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / GM);
    const minutes = Math.round(periodSeconds / 60);
    return `${minutes} mins (${(minutes / 60).toFixed(2)} hrs)`;
  };

  const calculateEscapeVelocity = () => {
    // ve = sqrt(2GM / r)
    const GM = celestialBody === 'Earth' ? 398600 : celestialBody === 'Mars' ? 42828 : 126712;
    const radius = celestialBody === 'Earth' ? 6371 : celestialBody === 'Mars' ? 33895 : 71492;
    const r = radius + Number(altitude);
    const ve = Math.sqrt((2 * GM) / r);
    return `${ve.toFixed(2)} km/s`;
  };

  const calculateDeltaVRequired = () => {
    const baseDeltaV = celestialBody === 'Earth' ? 9.5 : celestialBody === 'Mars' ? 5.0 : 42.5;
    return `${(baseDeltaV + (altitude / 200)).toFixed(1)} km/s`;
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Orbital Mechanics Calculator</h1>
        <p className="text-xs sm:text-sm text-slate-400">Compute orbital velocity, escape velocity, and delta-v transfer trajectories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Parameters Panel */}
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-stellar-400" />
            <span>Mission Parameters</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1.5">Target Celestial Body</label>
              <select
                value={celestialBody}
                onChange={(e) => setCelestialBody(e.target.value)}
                className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-stellar-500 font-mono"
              >
                <option value="Earth">Earth (Sol III)</option>
                <option value="Mars">Mars (Ares IV)</option>
                <option value="Jupiter">Jupiter (Jovian System)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 uppercase tracking-widest">Orbital Altitude</span>
                <span className="text-stellar-400 font-bold">{altitude} km</span>
              </div>
              <input
                type="range"
                min="150"
                max="36000"
                step="50"
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
                className="w-full accent-stellar-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 uppercase tracking-widest">Spacecraft Mass</span>
                <span className="text-nebula-400 font-bold">{mass.toLocaleString()} kg</span>
              </div>
              <input
                type="range"
                min="5000"
                max="250000"
                step="2500"
                value={mass}
                onChange={(e) => setMass(Number(e.target.value))}
                className="w-full accent-nebula-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400 uppercase tracking-widest">Insertion Velocity</span>
                <span className="text-emerald-400 font-bold">{velocity} km/s</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="15.0"
                step="0.1"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
            <span className="font-mono text-stellar-400 block uppercase">Calculation Mode: Keplerian 2-Body</span>
            <p>Calculations account for gravitational parameters and centripetal acceleration in low-decay vacuum orbits.</p>
          </div>
        </div>

        {/* Results Analysis */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Calculated Orbital Vector Metrics</h3>
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Stable Orbit Profile
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-space-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Orbital Period</span>
                <p className="text-2xl font-bold font-mono text-white">{calculateOrbitalPeriod()}</p>
                <span className="text-[10px] text-slate-500 font-mono">Time for 1 full revolution</span>
              </div>

              <div className="p-5 rounded-2xl bg-space-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Escape Velocity</span>
                <p className="text-2xl font-bold font-mono text-stellar-400">{calculateEscapeVelocity()}</p>
                <span className="text-[10px] text-slate-500 font-mono">Velocity to break gravity well</span>
              </div>

              <div className="p-5 rounded-2xl bg-space-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Required Delta-V</span>
                <p className="text-2xl font-bold font-mono text-nebula-400">{calculateDeltaVRequired()}</p>
                <span className="text-[10px] text-slate-500 font-mono">Total propulsion budget</span>
              </div>
            </div>

            {/* Orbit Simulation Visualizer */}
            <div className="p-6 rounded-2xl bg-space-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden h-64">
              <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>

              {/* Orbit Ellipse */}
              <div className="absolute w-48 h-48 rounded-full border border-dashed border-stellar-500/40 animate-spin-slow"></div>

              {/* Central Planet */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stellar-500 to-nebula-600 glow-cyan flex items-center justify-center font-bold text-xs text-white z-10">
                {celestialBody[0]}
              </div>

              {/* Satellite Node */}
              <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-emerald-400 glow-cyan animate-pulse z-20">
                <div className="absolute -left-12 -top-6 bg-space-900 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-mono text-white whitespace-nowrap">
                  ALT: {altitude} km
                </div>
              </div>

              <span className="absolute bottom-3 text-[10px] font-mono text-slate-500">
                Simulated Orbital Trajectory around {celestialBody}
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Orbital insertion trajectory successfully synchronized with Deep Space Guidance computer.')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-nebula-600 to-stellar-600 hover:from-nebula-500 hover:to-stellar-500 text-white font-medium text-sm shadow-lg shadow-nebula-500/25 transition-all flex items-center justify-center space-x-2"
          >
            <Rocket className="w-4 h-4" />
            <span>Upload Trajectory to Guidance Computer</span>
          </button>
        </div>
      </div>
    </div>
  );
};