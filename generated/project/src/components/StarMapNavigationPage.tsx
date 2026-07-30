import React, { useState } from 'react';
import { CelestialObject, CelestialWeather } from '../types';
import { Compass, Search, Globe2, AlertTriangle, Thermometer, ShieldAlert, Sparkles, Navigation } from 'lucide-react';

interface StarMapNavigationPageProps {
  celestialObjects: CelestialObject[];
  celestialWeather: CelestialWeather;
}

export const StarMapNavigationPage: React.FC<StarMapNavigationPageProps> = ({
  celestialObjects,
  celestialWeather
}) => {
  const [selectedObject, setSelectedObject] = useState<CelestialObject>(celestialObjects[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredObjects = celestialObjects.filter(obj => 
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obj.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Star Map & Celestial Weather</h1>
        <p className="text-xs sm:text-sm text-slate-400">Interactive sector map, exoplanet archives, and space weather indices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Star Map Visualizer */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-stellar-400 animate-spin-slow" />
              <span>Sector 01-Alpha Celestial Radar</span>
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search celestial bodies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-space-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-stellar-500"
              />
            </div>
          </div>

          {/* Interactive Radar Canvas Simulation */}
          <div className="relative h-96 rounded-2xl bg-space-950 border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* Background grid circles */}
            <div className="absolute w-64 h-64 rounded-full border border-slate-800/80 pointer-events-none"></div>
            <div className="absolute w-48 h-48 rounded-full border border-slate-800/60 pointer-events-none"></div>
            <div className="absolute w-24 h-24 rounded-full border border-slate-800/40 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>

            {/* Radar sweep line */}
            <div className="absolute inset-0 radar-sweep animate-spin-slow pointer-events-none opacity-40"></div>

            {/* Center Earth node */}
            <div className="absolute flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-stellar-500 glow-cyan animate-pulse"></div>
              <span className="text-[10px] font-mono text-stellar-400 mt-1">SOL (Earth)</span>
            </div>

            {/* Celestial Object Nodes */}
            {filteredObjects.map(obj => {
              const isSelected = selectedObject.id === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObject(obj)}
                  style={{ left: `${obj.x}px`, top: `${obj.y}px` }}
                  className={`absolute p-2 rounded-full transition-all group z-20 transform -translate-x-1/2 -translate-y-1/2 ${
                    isSelected ? 'scale-125 bg-nebula-500/30 ring-2 ring-nebula-400 glow-indigo' : 'bg-slate-800/60 hover:bg-slate-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    obj.type === 'Exoplanet' ? 'bg-cyan-400 glow-cyan' :
                    obj.type === 'Nebula' ? 'bg-purple-400 glow-indigo' :
                    obj.type === 'Black Hole' ? 'bg-rose-500' :
                    'bg-amber-400'
                  }`}></div>
                  <div className="absolute left-6 top-0 hidden group-hover:block bg-space-900 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-xl z-30">
                    {obj.name} ({obj.distanceLightYears} ly)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Celestial Weather Indices */}
          <div className="p-4 rounded-2xl bg-space-950/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">Deep Space Weather & Solar Indices</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Solar Wind</span>
                <span className="text-slate-200 font-bold">{celestialWeather.solarWindSpeed}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Geomagnetic</span>
                <span className="text-amber-400 font-bold">{celestialWeather.geomagneticIndex}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Flare Activity</span>
                <span className="text-stellar-400 font-bold">{celestialWeather.flareActivity}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cosmic Ray Flux</span>
                <span className="text-slate-200 font-bold">{celestialWeather.cosmicRayFlux}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Selected Object Detail Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stellar-500/10 text-stellar-400 border border-stellar-500/30">
                {selectedObject.type}
              </span>
              <span className="text-xs font-mono text-slate-400">Discovered {selectedObject.discoveredYear}</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">{selectedObject.name}</h3>
              <p className="text-xs font-mono text-stellar-400 mt-1">{selectedObject.distanceLightYears} Light Years from Sol</p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedObject.description}</p>

            <div className="p-4 rounded-2xl bg-space-950/80 border border-slate-800 space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Coordinates (RA/DEC):</span>
                <span className="text-slate-200">{selectedObject.coordinates.ra} / {selectedObject.coordinates.dec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Surface Temperature:</span>
                <span className="text-slate-200">{selectedObject.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Danger Index:</span>
                <span className={`font-bold ${selectedObject.dangerIndex === 'Extreme' ? 'text-rose-400' : selectedObject.dangerIndex === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedObject.dangerIndex}
                </span>
              </div>
            </div>

            {selectedObject.atmosphericComposition && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Atmospheric Composition</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedObject.atmosphericComposition.map((gas, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-space-950/60 border border-slate-800 text-[11px] font-mono text-slate-300">
                      {gas}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => alert(`Locked navigation trajectory toward ${selectedObject.name}. Subspace autopilot engaged.`)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-stellar-600 to-nebula-600 text-white font-medium text-xs shadow-lg shadow-stellar-500/20 hover:from-stellar-500 hover:to-nebula-500 transition-all flex items-center justify-center space-x-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Calculate Interstellar Trajectory</span>
          </button>
        </div>
      </div>
    </div>
  );
};