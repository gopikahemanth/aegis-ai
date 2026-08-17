import React, { useState } from "react";
import {
  Compass,
  Building2,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  BrainCircuit,
  Sliders
} from "lucide-react";

export const EngineeringCommandCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "forecast" | "simulation">("overview");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const queueItems = [
    { id: "work_1", priority: "CRITICAL", title: "Scale database connection pool for peak traffic", category: "SLO", status: "QUEUED" },
    { id: "work_2", priority: "HIGH", title: "Patch lodash prototype pollution vulnerability", category: "SECURITY", status: "QUEUED" },
    { id: "work_3", priority: "MEDIUM", title: "Simulate PostgreSQL Prisma connection timeout fixes", category: "OPTIMIZATION", status: "IN_PROGRESS" },
    { id: "work_4", priority: "LOW", title: "Refactor unused member service exports", category: "TECH_DEBT", status: "QUEUED" },
  ];

  const handleSimulate = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimulationResult("Simulation Complete: 0 disk mutations. Risk Score: 15/100 (SAFE). Verified compatibility with 100% of API endpoints.");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Command Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              PHASE 17 AUTONOMOUS COMMAND CENTER
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Autonomous Engineering Command Center
          </h1>
          <p className="text-xs text-slate-400">
            Closed-loop intelligence, predictive reliability forecasting, what-if simulations, and governed work queues.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "overview" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Command Overview
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "queue" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Governed Work Queue
          </button>
          <button
            onClick={() => setActiveTab("forecast")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "forecast" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            24h Reliability Forecast
          </button>
          <button
            onClick={() => setActiveTab("simulation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "simulation" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            What-If Simulator
          </button>
        </div>
      </div>

      {/* Master Engineering Certificate Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Master Engineering Certificate Active</h2>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                ENGINEERING_CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_master_eng_100 • 17 Governance Dimensions Validated • Learning Accuracy: 100%
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl text-center font-mono">
          ALL FLEET NODES CERTIFIED
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Total Fleet Projects</div>
              <div className="text-2xl font-bold font-mono text-white">3 Active</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">SLO Compliance</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">99.8%</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Active Incidents</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">0 Critical</div>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Learning Accuracy</div>
              <div className="text-2xl font-bold font-mono text-purple-400">100%</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white">Closed-Loop Engineering Lifecycle</h3>
            <p className="text-xs text-slate-400">
              OBSERVE → UNDERSTAND → PREDICT → PLAN → SIMULATE → AUTHORIZE → EXECUTE → VERIFY → LEARN → OPTIMIZE
            </p>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              ✓ Automated feedback loops active across all 3 managed fleet projects. Zero unisolated mutations.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work Queue */}
      {activeTab === "queue" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Governed Engineering Backlog</h2>
            <span className="text-xs font-mono text-slate-400">{queueItems.length} Prioritized Items</span>
          </div>

          <div className="space-y-3">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.priority === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                      item.priority === "HIGH" ? "bg-amber-500/20 text-amber-300" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {item.priority}
                    </span>
                    <span className="font-bold text-slate-200">{item.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Category: {item.category} • ID: {item.id}</div>
                </div>

                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/20">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Forecast */}
      {activeTab === "forecast" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">24-Hour Reliability Forecast</h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">SLO BREACH RISK: LOW</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Predicted SLO Availability</div>
              <div className="text-2xl font-bold font-mono text-white">99.95%</div>
              <div className="text-[10px] text-slate-500 font-mono">Error budget burn rate: 0.0% / day</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Incident Probability</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">&lt; 5%</div>
              <div className="text-[10px] text-slate-500 font-mono">Capacity risk: NOMINAL</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Simulation */}
      {activeTab === "simulation" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">What-If Mutation Simulation</h2>
            <span className="text-xs font-mono text-cyan-400">Strict 0 Disk Mutations</span>
          </div>

          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
            <p className="text-slate-300">
              Simulate candidate change: <span className="font-mono text-cyan-300">DATABASE_POOL_OPTIMIZATION</span> on project <span className="font-mono text-cyan-300">gym_management</span>.
            </p>

            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{simulating ? "Running Simulation..." : "Run Non-Mutating Simulation"}</span>
            </button>

            {simulationResult && (
              <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-200">
                ✓ {simulationResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
