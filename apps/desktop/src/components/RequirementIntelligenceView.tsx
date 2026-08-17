import React, { useState } from "react";
import {
  Compass, MapPin, Sparkles, CheckCircle2, AlertCircle, RefreshCw,
  Award, Play, ArrowRight, TrendingUp, ShieldAlert,
  Zap, Layers, Activity, FileText, CheckCheck, Lock,
  FileCode2, Users, Download, Clock, BarChart3, AlertTriangle
} from "lucide-react";

export const RequirementIntelligenceView: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"signals" | "requirements" | "roadmap" | "contracts" | "conflicts">("roadmap");
  const [isAuthorized, setIsAuthorized] = useState(true);

  const handleRunRequirementCycle = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 1400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              PHASE 61 — AUTONOMOUS REQUIREMENT EVOLUTION & ROADMAP INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Requirement Evolution & Product Roadmap Center</h1>
          <p className="text-xs text-slate-400">
            Multi-Source Signals → Requirement Discovery → Validation & De-duplication → Impact & Provenance → Prioritized Roadmap → Feature Contract → Verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunRequirementCycle}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isAnalyzing ? "Discovering Requirements..." : "Analyze & Plan"}
          </button>
        </div>
      </div>

      {/* Tier 48 Certificate */}
      <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-purple-950/40 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Tier 48 — Requirement Intelligence & Roadmap Evolution Certificate</h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  REQUIREMENT ACCEPTED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: <span className="font-mono text-indigo-300">GymMaster Pro</span> | Requirement: <span className="font-mono text-cyan-300">REQ-061 (Member Data Bulk Export)</span> | Outcome: <span className="font-mono text-emerald-300">85% Support Ticket Drop (4.7h saved/wk)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ROADMAP INTELLIGENCE ACTIVE
          </div>
        </div>
      </div>

      {/* Requirement Metrics & Pipeline Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">SIGNALS</div>
          <div className="text-xl font-bold text-indigo-400 font-mono">42</div>
          <div className="text-[10px] text-slate-500 mt-1">Multi-Source</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">CANDIDATES</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">12</div>
          <div className="text-[10px] text-cyan-500 mt-1">Discovered</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">VALIDATED</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">7</div>
          <div className="text-[10px] text-emerald-500 mt-1">Evidence-Backed</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">DUPLICATES</div>
          <div className="text-xl font-bold text-amber-400 font-mono">2</div>
          <div className="text-[10px] text-amber-500 mt-1">Extensions</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">CONFLICTS</div>
          <div className="text-xl font-bold text-red-400 font-mono">1</div>
          <div className="text-[10px] text-red-400 mt-1">Policy Blocked</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">VERIFIED</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">10/10</div>
          <div className="text-[10px] text-emerald-500 mt-1">Layers PASS</div>
        </div>
      </div>

      {/* Priority Distribution Bar & Active Requirement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Priority Tiers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Priority Distribution</span>
            <span className="text-[10px] font-mono text-slate-400">19 Total Roadmap Items</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span className="text-red-400 font-bold">P0 Critical</span>
                <span>2 Items</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full w-[25%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span className="text-amber-400 font-bold">P1 High</span>
                <span>4 Items</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[50%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span className="text-indigo-400 font-bold">P2 Medium</span>
                <span>8 Items</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full w-[80%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                <span className="text-slate-400 font-bold">P3 Low</span>
                <span>5 Items</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full w-[40%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Primary Feature in Evolution */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                P1 HIGH PRIORITY
              </span>
              <h3 className="text-xs font-bold text-white">REQ-061: Authorized Member Data Bulk Export</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              EVIDENCE CONFIDENCE: 94%
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1.5">
            <p><strong className="text-slate-200">Discovered Need:</strong> 18 monthly support tickets &amp; 240+ daily table navigations requesting spreadsheet exports.</p>
            <p><strong className="text-slate-200">Lineage:</strong> Explicit Need (User Feedback) + Derived Constraint (RBAC Manager Authorization) + Assumption (.xlsx &amp; .csv formats).</p>
            <p><strong className="text-slate-200">Blast Radius:</strong> MODERATE (Frontend Toolbar Button + GET /api/members/export + RBAC Middleware; 0 Schema Locks).</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              STATUS: COMPLETED &amp; VERIFIED IN PRODUCTION
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Authorized by: <span className="text-indigo-300">Product Owner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "roadmap" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Product Roadmap (Q1 - Q2)
          </button>
          <button
            onClick={() => setActiveTab("contracts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "contracts" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Feature Contract
          </button>
          <button
            onClick={() => setActiveTab("conflicts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "conflicts" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Conflict &amp; Duplicate Detector
          </button>
          <button
            onClick={() => setActiveTab("signals")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "signals" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Evidence &amp; Signals (3)
          </button>
        </div>

        {activeTab === "roadmap" && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Q1 · COMPLETED
                  </span>
                  <span className="text-xs font-bold text-white">REQ-061: Member Data Bulk Export (Excel / CSV)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Enables managers to filter and export member rosters; saves 4.7 hrs/wk.</p>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-bold">P1 HIGH</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                    Q2 · PLANNED
                  </span>
                  <span className="text-xs font-bold text-white">REQ-062: Automated Membership Expiration Reminders</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Sends renewal SMS/Email notices 7 days before membership expiration.</p>
              </div>
              <span className="text-indigo-400 font-mono text-xs font-bold">P2 MEDIUM</span>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                    Q2 · PLANNED
                  </span>
                  <span className="text-xs font-bold text-white">REQ-063: Monthly Revenue Analytics &amp; MRR Dashboard</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Aggregated financial visibility and downloadable P&amp;L summary for gym owners.</p>
              </div>
              <span className="text-amber-400 font-mono text-xs font-bold">P1 HIGH</span>
            </div>
          </div>
        )}

        {activeTab === "contracts" && (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono text-xs space-y-2">
            <div className="text-indigo-300 font-bold">FEATURE CONTRACT #fcontract_req-061</div>
            <div className="text-slate-300">• Target Roles: MANAGER, ADMIN (RBAC Enforced)</div>
            <div className="text-slate-300">• Capabilities: Filtered Roster Query, .xlsx / .csv Generation, Stream Cursor Batching</div>
            <div className="text-slate-300">• Security Constraint: Exclude sensitive card tokens, password hashes, and SSN</div>
            <div className="text-emerald-400">• Acceptance Status: 10/10 Verification Layers PASS (0 Regressions)</div>
          </div>
        )}

        {activeTab === "conflicts" && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-red-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-300">Policy Conflict Guard: Unrestricted Export Blocked</span>
              </div>
              <p className="text-xs text-slate-300">
                A candidate signal requested exporting raw payment tokens. AEGIS detected a <span className="font-mono text-red-300">SECURITY_CONFLICT</span> with PCI-DSS guidelines and blocked automatic implementation.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">Duplicate Check: Extend Existing CSV vs Build New</span>
              </div>
              <p className="text-xs text-slate-300">
                When an existing CSV export feature was detected, AEGIS correctly recommended <span className="font-mono text-amber-300">EXTEND_EXISTING_FEATURE</span> rather than creating redundant export engines.
              </p>
            </div>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="space-y-2">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">1. User Feedback Ticket Stream (18 Support Tickets)</div>
                <div className="text-slate-400 text-[11px]">&quot;I keep downloading member information manually; need bulk Excel export&quot;</div>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-bold">CONFIDENCE: 94%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">2. Usage Analytics (240 navigations/day)</div>
                <div className="text-slate-400 text-[11px]">Managers repeatedly navigate to member roster table without bulk extraction</div>
              </div>
              <span className="text-indigo-400 font-mono text-xs font-bold">CONFIDENCE: 91%</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">3. Q3 Business Milestone OKR-2</div>
                <div className="text-slate-400 text-[11px]">Objective: Reduce administrative staff time spent on bookkeeping reconciliations</div>
              </div>
              <span className="text-purple-400 font-mono text-xs font-bold">CONFIDENCE: 98%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
