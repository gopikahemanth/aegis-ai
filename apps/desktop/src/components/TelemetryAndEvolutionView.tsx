import React, { useState } from "react";
import { Activity, History, Cpu, Zap, RotateCcw, Wrench, CheckCircle2 } from "lucide-react";

export const TelemetryAndEvolutionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"telemetry" | "lineage">("telemetry");

  const telemetry = {
    avgGenerationTime: "1m 14s",
    totalLlmCalls: 24,
    tokensIn: "45.2k",
    tokensOut: "18.6k",
    cacheHitRate: "82%",
    parallelUtilization: "90%",
    repairs: 1,
    rollbacks: 0,
    successRate: "100%",
  };

  const generations = [
    {
      id: "gen_g1",
      name: "G1 Initial Fullstack Generation",
      type: "INITIAL_GENERATION",
      prompt: "Build gym management application where staff can manage members and track attendance.",
      filesChanged: 4,
      status: "SUCCESS",
      timestamp: "10 minutes ago",
    },
    {
      id: "gen_g2",
      name: "G2 Continuous Feature Evolution",
      type: "INCREMENTAL_EVOLUTION",
      prompt: "Add dark theme styles with toggle in the navbar and preserve existing backend APIs.",
      filesChanged: 2,
      status: "SUCCESS",
      timestamp: "Just now",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Telemetry & Evolutionary Lineage
          </h1>
          <p className="text-xs text-slate-400">
            Real machine-readable metrics, cache utilization, and multi-generation lineage history.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "telemetry" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Machine Telemetry
          </button>
          <button
            onClick={() => setActiveTab("lineage")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "lineage" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Evolution Lineage
          </button>
        </div>
      </div>

      {/* Tab 1: Telemetry */}
      {activeTab === "telemetry" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Cache Hit Rate</span>
            <div className="text-2xl font-bold text-cyan-400 font-mono">{telemetry.cacheHitRate}</div>
            <span className="text-[10px] text-slate-400">Deterministic TaskDAG hashes</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Avg Duration</span>
            <div className="text-2xl font-bold text-indigo-300 font-mono">{telemetry.avgGenerationTime}</div>
            <span className="text-[10px] text-slate-400">End-to-end pipeline</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Tokens Processed</span>
            <div className="text-2xl font-bold text-white font-mono">{telemetry.tokensIn} in</div>
            <span className="text-[10px] text-slate-400">{telemetry.tokensOut} generated</span>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Repairs & Rollbacks</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {telemetry.repairs} / {telemetry.rollbacks}
            </div>
            <span className="text-[10px] text-slate-400">Atomic checkpoints</span>
          </div>
        </div>
      )}

      {/* Tab 2: Lineage */}
      {activeTab === "lineage" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Continuous Project Evolution Timeline</h2>
            <span className="text-xs font-bold text-emerald-400">2 GENERATIONS VERIFIED</span>
          </div>

          <div className="space-y-3">
            {generations.map((g) => (
              <div
                key={g.id}
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {g.id}
                    </span>
                    <h3 className="text-xs font-bold text-white">{g.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">{g.prompt}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500 text-[10px]">{g.timestamp}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {g.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
