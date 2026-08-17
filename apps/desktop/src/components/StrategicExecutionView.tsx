import React, { useState } from "react";
import {
  Target,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers
} from "lucide-react";

export const StrategicExecutionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"outcomes" | "milestones" | "governance">("outcomes");

  const outcomes = [
    { id: "out_1", name: "Reduce Production API Incidents", metric: "Incident Count", baseline: 25, target: 5, actual: 8, progress: "85%", status: "ON_TRACK" },
    { id: "out_2", name: "Improve Backend API Availability", metric: "Uptime %", baseline: 99.1, target: 99.95, actual: 99.92, progress: "96%", status: "ON_TRACK" },
    { id: "out_3", name: "Reduce Monthly LLM Token Consumption", metric: "Monthly Tokens", baseline: 500000, target: 200000, actual: 230000, progress: "90%", status: "ON_TRACK" },
  ];

  const milestones = [
    { id: "ms_1", title: "API v2 Standardization Deployed", status: "ACHIEVED", due: "Completed", evidence: "Production release cert #889" },
    { id: "ms_2", title: "Global Connection Pool Scaling", status: "IN_PROGRESS", due: "14 days remaining", evidence: "Telemetry validated at 99.92%" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              PHASE 24 OUTCOME GOVERNANCE & EXECUTION
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Autonomous Strategic Execution & Outcome Governance
          </h1>
          <p className="text-xs text-slate-400">
            Measuring real-world business KPIs against targets, outcome-based authorization, and continuous strategic replanning.
          </p>
        </div>

        <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-center font-mono">
          OUTCOMES VERIFIED ACTIVE
        </div>
      </div>

      {/* Supreme 13-Tier Certificate Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Supreme Strategic Execution Certificate Active</h2>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                STRATEGIC_EXECUTION_CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_strat_exec_supreme • 13/13 Governance Tiers Certified • Telemetry Evidence Bound
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl text-center font-mono">
          13 / 13 GOVERNANCE TIERS VALID
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {(["outcomes", "milestones", "governance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-amber-600 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "outcomes" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Measured Strategic Business Outcomes
          </h2>
          <div className="space-y-4">
            {outcomes.map((out) => (
              <div key={out.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">{out.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Baseline: {out.baseline} • Target: {out.target} • Actual: {out.actual}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded">
                    {out.status}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: out.progress }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Strategic Milestones & Evidence Status
          </h2>
          <div className="space-y-3">
            {milestones.map((ms) => (
              <div key={ms.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{ms.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Evidence: {ms.evidence}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    {ms.status}
                  </span>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">{ms.due}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "governance" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Outcome-Based Authorization & Scope Boundaries
          </h2>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div>✓ Scope: Initiative #init_gym_core locked to Project #gym_p24_proj</div>
            <div>✓ Expected Outcome: 99.95% API Availability</div>
            <div>✓ Rollback Readiness: 100% verified snapshot ready</div>
            <div>✓ Replanning Invariant: Decision history remains append-only and immutable</div>
          </div>
        </div>
      )}
    </div>
  );
};
