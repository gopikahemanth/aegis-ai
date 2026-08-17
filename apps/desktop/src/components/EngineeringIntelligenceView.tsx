import React, { useState } from "react";
import {
  BrainCircuit,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Shield,
  Layers,
  Search,
  Package,
  Wrench,
  Award,
  ArrowUpRight
} from "lucide-react";

export const EngineeringIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"fleet" | "slo" | "anomalies" | "remediation" | "debt">("fleet");
  const [remediationApproved, setRemediationApproved] = useState(false);

  const fleetProjects = [
    { id: "gym_management", name: "Gym Management App", health: "HEALTHY", release: "rel_102", slo: "99.9%" },
    { id: "ecommerce_store", name: "E-Commerce Platform", health: "HEALTHY", release: "rel_405", slo: "99.8%" },
    { id: "analytics_dash", name: "Realtime Analytics", health: "HEALTHY", release: "rel_201", slo: "99.95%" },
  ];

  const slos = [
    { name: "Service Availability", target: ">= 99.9%", current: "99.95%", budget: "100%", status: "HEALTHY" },
    { name: "API Request Success Rate", target: ">= 99.5%", current: "99.8%", budget: "90%", status: "HEALTHY" },
    { name: "P95 Latency", target: "< 500ms", current: "180ms", budget: "95%", status: "HEALTHY" },
    { name: "Database Pool Availability", target: ">= 99.9%", current: "100%", budget: "100%", status: "HEALTHY" },
  ];

  const anomalies = [
    { type: "PERFORMANCE_ANOMALY", metric: "API Latency", baseline: "25ms", current: "75ms (+200%)", severity: "MEDIUM" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" />
              PHASE 16 AUTONOMOUS ENGINEERING INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Fleet Management & Predictive Reliability
          </h1>
          <p className="text-xs text-slate-400">
            Multi-project fleet governance, SLO error budgets, predictive anomaly detection, and governed remediation.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "fleet" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Fleet Hub
          </button>
          <button
            onClick={() => setActiveTab("slo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "slo" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            SLO Budgets
          </button>
          <button
            onClick={() => setActiveTab("anomalies")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "anomalies" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Anomalies
          </button>
          <button
            onClick={() => setActiveTab("remediation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "remediation" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Remediation Center
          </button>
          <button
            onClick={() => setActiveTab("debt")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "debt" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Technical Debt
          </button>
        </div>
      </div>

      {/* Fleet Certificate Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Fleet Operations Certificate Active</h2>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                FLEET_OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_fleet_org_99 • Total Projects: 3 • Fleet Compliance: 99.8%
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-center font-mono">
          3 / 3 PROJECTS HEALTHY
        </div>
      </div>

      {/* Tab 1: Fleet */}
      {activeTab === "fleet" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Autonomous Fleet Registry
            </h2>
            <span className="text-xs font-mono text-slate-400">Strict Multi-Project Isolation Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fleetProjects.map((p) => (
              <div key={p.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{p.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {p.health}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Release: {p.release}</span>
                  <span className="text-purple-300">SLO: {p.slo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: SLOs */}
      {activeTab === "slo" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Reliability Governance & Error Budgets
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">ALL SLOS HEALTHY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slos.map((s) => (
              <div key={s.name} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300">{s.name}</div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xl font-bold text-white">{s.current}</span>
                  <span className="text-xs text-slate-500">Target: {s.target}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>Error Budget Left: {s.budget}</span>
                  <span className="text-emerald-400 font-bold">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Anomalies */}
      {activeTab === "anomalies" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Predictive Telemetry Anomaly Detection
            </h2>
          </div>

          {anomalies.map((a) => (
            <div key={a.metric} className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{a.metric} Shift</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  {a.severity}
                </span>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">
                Measured: {a.current} (Baseline: {a.baseline}). Early indicator of query backlog.
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Remediation */}
      {activeTab === "remediation" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Governed Autonomous Remediation Center
            </h2>
          </div>

          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Proposal prop_1786786600_db_pool</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded">
                DRY RUN VALIDATED
              </span>
            </div>
            <p className="text-slate-400 font-mono text-[11px]">
              Remediation Action: Scale Prisma PostgreSQL pool parameters to resolve connection starvation.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRemediationApproved(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                {remediationApproved ? "Remediation Executed ✓" : "Authorize & Execute Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Technical Debt */}
      {activeTab === "debt" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              Technical Debt & Dependency Intelligence
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">DEBT SCORE: 0/100 (PRISTINE)</span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono text-center">
            ✓ 0 accumulated TODOs, 0 dead files, 0 stale contracts across fleet workspaces.
          </div>
        </div>
      )}
    </div>
  );
};
