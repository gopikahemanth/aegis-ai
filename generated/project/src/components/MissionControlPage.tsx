import React, { useState } from 'react';
import { Mission, MissionStatus } from '../types';
import { Rocket, Plus, Search, Filter, AlertCircle, CheckCircle, Shield, Globe, Users, Gauge, Calendar } from 'lucide-react';

interface MissionControlPageProps {
  missions: Mission[];
  onAddMission: (mission: Omit<Mission, 'id'>) => void;
  onUpdateStatus: (id: string, status: MissionStatus) => void;
}

export const MissionControlPage: React.FC<MissionControlPageProps> = ({
  missions,
  onAddMission,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New mission form state
  const [newName, setNewName] = useState('');
  const [newCodeName, setNewCodeName] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newStatus, setNewStatus] = useState<MissionStatus>('Active');
  const [newCrewCount, setNewCrewCount] = useState(2);
  const [newDescription, setNewDescription] = useState('');

  const filteredMissions = missions.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.codeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDestination) return;

    onAddMission({
      name: newName,
      codeName: newCodeName || `EXP-${Math.floor(Math.random() * 8999 + 1000)}`,
      destination: newDestination,
      status: newStatus,
      launchDate: new Date().toISOString().split('T')[0],
      progress: 5,
      crewCount: Number(newCrewCount),
      distanceFromEarth: '1.4M km',
      speed: '34,200 km/h',
      description: newDescription || 'Standard deep space exploration and telemetry gathering protocol.',
      subsystems: [
        { name: 'Primary Propulsion', status: 'Optimal', value: '100%' },
        { name: 'Life Support', status: 'Optimal', value: 'Normal' },
        { name: 'Telemetry Array', status: 'Optimal', value: 'Connected' }
      ]
    });

    setIsModalOpen(false);
    setNewName('');
    setNewCodeName('');
    setNewDestination('');
    setNewDescription('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Mission Control</h1>
          <p className="text-xs sm:text-sm text-slate-400">Manage interstellar expeditions, telemetry parameters, and launch schedules</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nebula-600 to-stellar-600 hover:from-nebula-500 hover:to-stellar-500 text-white font-medium text-sm shadow-lg shadow-nebula-500/20 transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Mission</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search missions by name, code or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-space-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-nebula-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Active', 'En Route', 'Orbiting', 'Critical'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                statusFilter === status
                  ? 'bg-stellar-500/20 border border-stellar-500/40 text-stellar-400'
                  : 'bg-space-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMissions.map((mission) => (
          <div key={mission.id} className="glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-6 hover:border-slate-700 transition-all group">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stellar-400">{mission.codeName}</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 group-hover:text-stellar-300 transition-colors">{mission.name}</h3>
                </div>
                <select
                  value={mission.status}
                  onChange={(e) => onUpdateStatus(mission.id, e.target.value as MissionStatus)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono border bg-space-950 focus:outline-none cursor-pointer ${
                    mission.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    mission.status === 'En Route' ? 'bg-stellar-500/10 text-stellar-400 border-stellar-500/30' :
                    mission.status === 'Orbiting' ? 'bg-nebula-500/10 text-nebula-400 border-nebula-500/30' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="En Route">En Route</option>
                  <option value="Orbiting">Orbiting</option>
                  <option value="Completed">Completed</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{mission.description}</p>

              <div className="p-3 rounded-xl bg-space-950/60 border border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Destination:</span>
                  <span className="text-slate-200 truncate max-w-[160px]">{mission.destination}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distance:</span>
                  <span className="text-slate-200">{mission.distanceFromEarth}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Crew Complement:</span>
                  <span className="text-slate-200 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-stellar-400" /> {mission.crewCount} Personnel
                  </span>
                </div>
              </div>

              {/* Subsystems */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Subsystem Diagnostics</span>
                <div className="grid grid-cols-2 gap-2">
                  {mission.subsystems.map((sub, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-space-950/40 border border-slate-800/50 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate">{sub.name}</span>
                      <span className={`font-mono ${sub.status === 'Optimal' ? 'text-emerald-400' : sub.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {sub.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Mission Progress</span>
                <span className="text-slate-200">{mission.progress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-nebula-500 to-stellar-400 h-full rounded-full" style={{ width: `${mission.progress}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Mission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-700 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Initialize New Expedition</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Mission Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Titan Outpost Alpha"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Code Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TITAN-01"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as MissionStatus)}
                    className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500"
                  >
                    <option value="Active">Active</option>
                    <option value="En Route">En Route</option>
                    <option value="Orbiting">Orbiting</option>
                    <option value="Standby">Standby</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saturn System / Titan"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Crew Complement</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newCrewCount}
                    onChange={(e) => setNewCrewCount(Number(e.target.value))}
                    className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-1">Mission Briefing</label>
                <textarea
                  rows={3}
                  placeholder="Describe primary mission objectives and payload requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-space-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-nebula-500 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-nebula-600 to-stellar-600 hover:from-nebula-500 hover:to-stellar-500 text-white text-sm font-medium shadow-lg transition-all"
                >
                  Authorize Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};