import React, { useState } from "react";
import {
  Users2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Send,
  GitBranch,
  History
} from "lucide-react";

export const EnterpriseCollaborationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"workflows" | "approvals" | "dependencies" | "decisions">("workflows");

  const workflows = [
    { id: "wf_api_v2", title: "Gym API v2 Multi-Team Rollout", team: "Core Backend", state: "EXECUTING", progress: "80%" },
    { id: "wf_sec_patch", title: "Enterprise Token Redaction Upgrade", team: "Security & Compliance", state: "COMPLETED", progress: "100%" },
  ];

  const pendingApprovals = [
    { id: "appr_prod_db", op: "DEPLOY_PRODUCTION", project: "Gym Enterprise Node", requester: "lead_arch_1", roleReq: "RELEASE_MANAGER", risk: "LOW" },
  ];

  const decisions = [
    { id: "dec_1", op: "DEPLOY_PRODUCTION", actor: "lead_arch_1", decision: "APPROVED", reason: "All 11 governance gates certified.", time: "10m ago" },
    { id: "dec_2", op: "AUTO_REPAIR", actor: "AEGIS_AI", decision: "EXECUTED", reason: "Worker node lease failover executed cleanly.", time: "45m ago" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5" />
              PHASE 22 ENTERPRISE COLLABORATION & WORKFLOWS
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Enterprise Collaboration, Workflow Automation & Governance Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Coordinating multi-team engineering workflows, human approvals, cross-project dependencies, and decision ledgers.
          </p>
        </div>

        <div className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-center font-mono">
          ENTERPRISE WORKFLOWS ACTIVE
        </div>
      </div>

      {/* Supreme 11-Tier Certificate Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Supreme Enterprise Collaboration Certificate Active</h2>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">
                COLLABORATION_CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_collab_supreme • 11/11 Governance Tiers Certified • Immutable Decision Ledger Locked
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl text-center font-mono">
          11 / 11 GOVERNANCE TIERS VALID
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {(["workflows", "approvals", "dependencies", "decisions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-indigo-600 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "workflows" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            Active Enterprise Engineering Workflows
          </h2>
          <div className="space-y-3">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{wf.title}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Team: {wf.team} • Progress: {wf.progress}</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded">
                  {wf.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Human Approval & Governance Requests
          </h2>
          <div className="space-y-3">
            {pendingApprovals.map((appr) => (
              <div key={appr.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{appr.op}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Project: {appr.project} • Requester: {appr.requester} • Role: {appr.roleReq}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs">
                    Approve
                  </button>
                  <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-xs">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "decisions" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Immutable Enterprise Decision Ledger
          </h2>
          <div className="space-y-3">
            {decisions.map((dec) => (
              <div key={dec.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{dec.op} → {dec.decision}</span>
                  <span className="text-[10px] font-mono text-slate-400">{dec.time}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono">{dec.reason}</p>
                <div className="text-[10px] text-slate-500 font-mono">Actor: {dec.actor}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "dependencies" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Cross-Project & Cross-Team Dependency Map
          </h2>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            Project A (Core API) → Project B (React Frontend) [API Contract Bound • 0 Cycles Detected]
          </div>
        </div>
      )}
    </div>
  );
};
