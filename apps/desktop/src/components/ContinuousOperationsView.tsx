import React, { useState } from "react";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Server,
  Database,
  Globe,
  Radio,
  Layers,
  Award,
  RefreshCw,
  Clock,
  ShieldAlert,
  GitBranch
} from "lucide-react";

export const ContinuousOperationsView: React.FC = () => {
  const [selectedEnv, setSelectedEnv] = useState<"production" | "canary" | "staging" | "test">("production");
  const [activeTab, setActiveTab] = useState<"health" | "incidents" | "rca" | "lineage">("health");
  const [resolvedIncident, setResolvedIncident] = useState(false);

  const healthProbes = [
    { name: "Application Process", component: "PROCESS", status: "HEALTHY", detail: "PID 4192 listening on port 42173", icon: Server },
    { name: "HTTP Gateway", component: "HTTP_GATEWAY", status: "HEALTHY", detail: "200 OK • 18ms latency • 0% drop", icon: Globe },
    { name: "Database Pool", component: "DATABASE", status: "HEALTHY", detail: "PostgreSQL 16 • 12 active pools • 6ms query", icon: Database },
    { name: "API Route Registry", component: "API_ROUTES", status: "HEALTHY", detail: "4/4 endpoints matching locked contract", icon: Radio },
    { name: "Browser Interaction", component: "BROWSER_RUNTIME", status: "HEALTHY", detail: "DOM assertions nominal • 0 JS errors", icon: Globe },
    { name: "Host Resources", component: "RESOURCES", status: "HEALTHY", detail: "Memory: 42MB • CPU: 2.1% nominal", icon: Activity },
  ];

  const lineageNodes = [
    { gen: "G1", release: "rel_101", status: "SUPERSEDED", arch: "FULLSTACK_WEB_REACT_EXPRESS", date: "10 mins ago" },
    { gen: "G2", release: "rel_102", status: "ACTIVE", arch: "FULLSTACK_WEB_REACT_EXPRESS", date: "Just now" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Environment Selector */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PHASE 15 CONTINUOUS OPERATIONS
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Production Operations & Reliability Center
          </h1>
          <p className="text-xs text-slate-400">
            Autonomous observation, real-time health monitoring, incident intelligence, and governed remediation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Environment Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
            {(["production", "canary", "staging", "test"] as const).map((env) => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                className={`px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-all uppercase ${
                  selectedEnv === env ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operations Certificate Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Production Operations Certificate Active</h2>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_ops_prod_202 • Release: rel_102 (G2) • Target: {selectedEnv.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
            HEALTH: HEALTHY
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab("health")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "health" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Live Health Probes
        </button>
        <button
          onClick={() => setActiveTab("incidents")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "incidents" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Incident Center {resolvedIncident ? "(0)" : "(1)"}
        </button>
        <button
          onClick={() => setActiveTab("rca")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "rca" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Root-Cause Analysis (RCA)
        </button>
        <button
          onClick={() => setActiveTab("lineage")}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "lineage" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Release Lineage Tree
        </button>
      </div>

      {/* Tab Content 1: Live Health */}
      {activeTab === "health" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {healthProbes.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-800/80 text-cyan-400 rounded-xl">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {p.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{p.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content 2: Incident Center */}
      {activeTab === "incidents" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Incident Log
            </h2>
            <span className="text-xs font-mono text-slate-400">Environment: {selectedEnv.toUpperCase()}</span>
          </div>

          {!resolvedIncident ? (
            <div className="bg-slate-950/60 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded">
                    HIGH SEVERITY
                  </span>
                  <span className="text-xs font-bold text-slate-200">inc_1786786500_api_failure</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">2 mins ago</span>
              </div>

              <p className="text-xs text-slate-300">
                Classification: <span className="font-mono text-amber-300">API_FAILURE</span> — POST /api/members latency exceeded 2000ms threshold during peak test.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setResolvedIncident(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  Acknowledge & Resolve Incident
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-mono">
              ✓ All incidents resolved. 0 active incidents in {selectedEnv.toUpperCase()}.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Root-Cause Analysis */}
      {activeTab === "rca" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Automated Root-Cause Correlation (RCA)
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">Confidence: 95%</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono">
            <div className="text-cyan-300 font-bold">Hypothesis: Database Connection Pool Starvation</div>
            <p className="text-slate-400 text-[11px]">
              Connection pool exhausted during concurrent load test. Database health probe latency spiked from 6ms to 2400ms.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-400 text-[11px]">
              <div>• Supporting Evidence: Server error log `P2024: Timed out fetching a new connection from the pool`</div>
              <div>• Recommended Action: Scale Prisma connection pool size or restart process pool.</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Release Lineage */}
      {activeTab === "lineage" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              Multi-Generation Release Lineage Tree
            </h2>
          </div>

          <div className="space-y-3">
            {lineageNodes.map((node, idx) => (
              <div
                key={node.gen}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-500/10 text-indigo-300 rounded-lg font-bold">{node.gen}</span>
                  <div>
                    <div className="text-slate-200 font-bold">Release {node.release}</div>
                    <div className="text-[10px] text-slate-500">{node.arch}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    node.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {node.status}
                  </span>
                  <span className="text-[10px] text-slate-500">{node.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
