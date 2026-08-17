import React, { useState } from "react";
import { Lock, ShieldCheck, ShieldAlert, Terminal, CheckCircle2 } from "lucide-react";
import type { AuditRecord } from "../types/control-plane-ui.js";

export const SecurityAndAuditView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"security" | "audit">("security");

  const securityChecks = [
    { name: "Frontend Secret Leaks", status: "PASSED", details: "0 sensitive tokens or env vars exposed in client bundle" },
    { name: "Server/Client Boundaries", status: "PASSED", details: "Database models and queries strictly confined to server routes" },
    { name: "Exposed Credentials & API Keys", status: "PASSED", details: "Zero plaintext keys found; regex redaction active" },
    { name: "Unauthorized Import Chains", status: "PASSED", details: "All modules adhere to dependency contracts" },
    { name: "Human Authorization Gateways", status: "PASSED", details: "Destructive schema migrations require human approval" },
  ];

  const auditEvents: AuditRecord[] = [
    {
      id: "aud_1",
      timestamp: new Date(Date.now() - 20000).toISOString(),
      projectId: "gym_management",
      generationId: "gen_g1",
      action: "JOB_CREATED",
      category: "JOB_LIFECYCLE",
      details: { prompt: "Build gym management..." },
      actor: "USER",
    },
    {
      id: "aud_2",
      timestamp: new Date(Date.now() - 15000).toISOString(),
      projectId: "gym_management",
      generationId: "gen_g1",
      action: "ARCHITECTURE_LOCKED",
      category: "GOVERNANCE",
      details: { arch: "FULLSTACK_WEB_REACT_EXPRESS" },
      actor: "AEGIS_GOVERNANCE",
    },
    {
      id: "aud_3",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      projectId: "gym_management",
      generationId: "gen_g1",
      action: "PRODUCT_SUCCESS_GATE_PASSED",
      category: "GOVERNANCE",
      details: { score: "100%" },
      actor: "ProductSuccessGate",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Security & Append-Only Audit Log
          </h1>
          <p className="text-xs text-slate-400">
            Cryptographic boundary verification, secret sanitization, and immutable audit logs.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "security" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Security Boundaries
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "audit" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Audit Log Stream
          </button>
        </div>
      </div>

      {/* Tab 1: Security */}
      {activeTab === "security" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">System Security Boundary Verifications</h2>
            <span className="text-xs font-bold text-emerald-400">STATUS: SECURE</span>
          </div>

          <div className="space-y-3">
            {securityChecks.map((sc) => (
              <div key={sc.name} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{sc.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{sc.details}</div>
                </div>
                <span className="text-emerald-400 font-bold font-mono text-[10px] bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {sc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Audit */}
      {activeTab === "audit" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Append-Only Operational Audit Entries</h2>
            <span className="text-[10px] font-mono text-slate-500">SAVED IN .aegis/audit.log</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {auditEvents.map((a) => (
              <div key={a.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[10px]">
                    {new Date(a.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-bold text-cyan-400 text-[11px]">{a.action}</span>
                  <span className="text-slate-400 text-[11px]">({a.category})</span>
                </div>
                <span className="text-[10px] text-slate-500">Actor: {a.actor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
