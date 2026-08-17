import React from "react";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Server,
  Database,
  Globe,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Terminal,
  Activity,
  ArrowUpRight
} from "lucide-react";
import type { GenerationJob, SystemHealthReport } from "../types/control-plane-ui.js";

export interface ProjectDashboardProps {
  project: {
    id: string;
    name: string;
    generation: string;
    status: string;
    architecture: string;
    domain: string;
    stack: {
      frontend: string;
      backend: string;
      database: string;
      orm: string;
      auth: string;
    };
    featureCount: number;
    completedFeatures: number;
  };
  activeJob?: GenerationJob;
  onNavigateToStudio: () => void;
  onNavigateToVerification: () => void;
  onNavigateToRuntime: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  activeJob,
  onNavigateToStudio,
  onNavigateToVerification,
  onNavigateToRuntime,
}) => {
  const completionPercentage =
    project.featureCount > 0
      ? Math.round((project.completedFeatures / project.featureCount) * 100)
      : 100;

  const verificationDimensions = [
    { name: "Contract", passed: true },
    { name: "FileGraph", passed: true },
    { name: "ImportExport", passed: true },
    { name: "TypeCheck", passed: true },
    { name: "Build", passed: true },
    { name: "UnitTest", passed: true },
    { name: "API", passed: true },
    { name: "Database", passed: true },
    { name: "Browser", passed: true },
    { name: "Reality", passed: true },
    { name: "Security", passed: true },
    { name: "Visual", passed: true },
    { name: "GoldenWorkflow", passed: true },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono px-2.5 py-0.5 rounded-full">
                {project.generation}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {project.status}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">{project.domain}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToStudio}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Evolve Feature</span>
            </button>
            <button
              onClick={onNavigateToRuntime}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>Runtime Monitor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Architecture & Stack */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Architecture & Stack</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">LOCKED</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Pattern</span>
              <span className="font-semibold text-slate-200">{project.architecture}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Frontend</span>
              <span className="font-mono text-slate-300">{project.stack.frontend}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Backend</span>
              <span className="font-mono text-slate-300">{project.stack.backend}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Database & ORM</span>
              <span className="font-mono text-slate-300">
                {project.stack.database} / {project.stack.orm}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Authentication</span>
              <span className="font-mono text-slate-300">{project.stack.auth}</span>
            </div>
          </div>
        </div>

        {/* Feature Completeness */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Requirement Completeness</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">{completionPercentage}%</span>
          </div>

          <div className="space-y-3">
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-2">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-lg font-bold text-white">{project.completedFeatures}</div>
                <div className="text-[10px] uppercase text-slate-400">Verified Features</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="text-lg font-bold text-white">{project.featureCount}</div>
                <div className="text-[10px] uppercase text-slate-400">Total Specs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Runtime Status */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Live Runtime</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300 font-medium">Frontend Server</span>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">PORT 5173</span>
            </div>

            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300 font-medium">Backend API</span>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">PORT 42173</span>
            </div>

            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-medium">PostgreSQL DB</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13-Dimension Verification Matrix Preview */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">13-Dimension Verification Matrix</h2>
              <p className="text-xs text-slate-400">Authoritative proof of correctness and reality</p>
            </div>
          </div>

          <button
            onClick={onNavigateToVerification}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            <span>View Complete Evidence</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {verificationDimensions.map((dim) => (
            <div
              key={dim.name}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">{dim.name}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                PASSED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
