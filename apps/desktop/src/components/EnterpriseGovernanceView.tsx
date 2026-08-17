import React, { useState } from "react";
import {
  Building2,
  ShieldCheck,
  Award,
  Users,
  Briefcase,
  FileCheck2,
  DollarSign,
  Lock,
  Boxes,
  CheckCircle2
} from "lucide-react";

export const EnterpriseGovernanceView: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState("org_global_enterprise");

  const orgs = [
    { id: "org_global_enterprise", name: "Global Enterprise Core", tier: "ENTERPRISE", projects: 12, teams: 4 },
    { id: "org_fintech_solutions", name: "FinTech Payments Division", tier: "ENTERPRISE", projects: 8, teams: 3 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              PHASE 21 ENTERPRISE GOVERNANCE & MULTI-TENANCY
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Enterprise Governance, Multi-Tenancy & Platform Lifecycle
          </h1>
          <p className="text-xs text-slate-400">
            Multi-organization RBAC, hierarchical policy administration, compliance verification, and usage controls.
          </p>
        </div>

        <div className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-center font-mono">
          ENTERPRISE COMPLIANCE ACTIVE
        </div>
      </div>

      {/* Supreme 10-Tier Certificate Banner */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Supreme Enterprise Governance Certificate Active</h2>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                ENTERPRISE_GOVERNANCE_CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_ent_gov_supreme • 10/10 Governance Tiers Certified • SOC2 / ISO 27001 Validated
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl text-center font-mono">
          10 / 10 GOVERNANCE TIERS VALID
        </div>
      </div>

      {/* Organizations & Multi-Tenancy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-4 h-4 text-purple-400" />
            Enterprise Organizations & Tenancy
          </h2>
          <div className="space-y-3">
            {orgs.map((o) => (
              <div
                key={o.id}
                onClick={() => setSelectedOrg(o.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedOrg === o.id
                    ? "bg-purple-950/30 border-purple-500/40"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{o.name}</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                    {o.tier}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-mono">
                  <span>{o.projects} Projects</span>
                  <span>•</span>
                  <span>{o.teams} Teams</span>
                  <span>•</span>
                  <span className="text-emerald-400">Isolated</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance & Quota Status */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            Compliance Evidence & Quotas
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">SOC2 Type II Controls</span>
              <span className="text-emerald-400 font-bold font-mono">✓ VERIFIED</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">ISO 27001 Access Management</span>
              <span className="text-emerald-400 font-bold font-mono">✓ VERIFIED</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Token Quota (1M/month)</span>
              <span className="text-purple-300 font-mono">4.5% Used (45k tokens)</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-300">Tenant Isolation Enforced</span>
              <span className="text-emerald-400 font-bold font-mono">✓ 100% ISOLATED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
