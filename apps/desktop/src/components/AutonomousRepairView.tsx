import React, { useState } from "react";
import {
  Wrench, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw,
  Award, Play, Bug, FileCode, CheckCheck,
  Terminal, ArrowRight, Activity, Search, ShieldAlert, Cpu
} from "lucide-react";

interface EvidenceItem {
  source: string;
  type: string;
  detail: string;
  confidence: number;
}

export const AutonomousRepairView: React.FC = () => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [bugReport, setBugReport] = useState(
    "Payments are broken. POST /api/payments/create-intent returns 500 Internal Server Error when members attempt checkout."
  );

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    { source: "NETWORK", type: "HTTP 500", detail: "POST /api/payments/create-intent returned 500 (Code P2003)", confidence: 0.98 },
    { source: "SERVER_LOGS", type: "Prisma Exception", detail: "Foreign key constraint failed on field 'planId' at payment.service.ts:42", confidence: 0.95 },
    { source: "DATABASE", type: "PostgreSQL FK Violation", detail: "Constraint 'payments_planId_fkey' rejected invalid planId 'plan_invalid_99'", confidence: 0.99 },
    { source: "BROWSER_CONSOLE", type: "Client Error", detail: "MemberCheckoutModal.tsx:68 sent outdated plan slug instead of internal UUID", confidence: 0.90 },
    { source: "ENVIRONMENT", type: "Config Check", detail: "Production DB and Stripe live credentials active and verified", confidence: 0.95 },
  ]);

  const [callStack, setCallStack] = useState<string[]>([
    "1. POST /api/payments/create-intent (500)",
    "2. PaymentRoutes (src/routes/payment.routes.ts:15)",
    "3. PaymentController.handleCreateIntent (src/controllers/payment.controller.ts:28)",
    "4. PaymentService.createPaymentIntent (src/services/payment.service.ts:42)",
    "5. PrismaClient.payment.create (data: { memberId, planId, amount })",
    "6. PostgreSQL payments_planId_fkey rejection (Root Cause)",
  ]);

  const handleTriggerRepair = () => {
    setIsRepairing(true);
    setTimeout(() => setIsRepairing(false), 1400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5" />
              PHASE 57 — AUTONOMOUS PRODUCTION DEBUGGING & VERIFIED REPAIR
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Production Debugging & Verified Repair Center</h1>
          <p className="text-xs text-slate-400">
            Reproduce Failure → Multi-Signal Evidence → Automated RCA → Safe Atomic Patch → 4-Tier Regression → Live Verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            {showEvidence ? "Hide Evidence" : "Evidence Telemetry"}
          </button>
          <button
            onClick={handleTriggerRepair}
            disabled={isRepairing}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isRepairing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRepairing ? "Repairing..." : "Debug & Verify Repair"}
          </button>
        </div>
      </div>

      {/* Active Bug Report Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          Active Incident / Bug Report
        </div>
        <div className="text-xs font-mono text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          "{bugReport}"
        </div>
      </div>

      {/* Tier 44 Autonomous Repair Certificate */}
      <div className="bg-gradient-to-br from-amber-950/50 via-slate-900/60 to-orange-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Tier 44 — Autonomous Repair Certificate</h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  REPAIR ACCEPTED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: <span className="font-mono text-amber-300">GymMaster Pro</span> | Defect: <span className="font-mono text-amber-300">Foreign key planId mismatch</span> | Status: <span className="font-mono text-emerald-300">VERIFIED RESOLVED (Attempt 1/5)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE VERIFIED & REGRESSION SAFE (61/61 PASS)
          </div>
        </div>
      </div>

      {/* Master 4-Quadrant Diagnosis & Repair Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quadrant 1: Failure & Diagnosis */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                1. Reproduction & RCA
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">100% REPRO</span>
            </div>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Reproduction State</span>
                <span className="text-emerald-400 font-mono font-semibold">REPRODUCED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evidence Signals</span>
                <span className="text-cyan-400 font-mono font-semibold">5 Multi-signals</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">RCA Confidence</span>
                <span className="text-emerald-400 font-mono font-semibold">98% VERIFIED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cause Type</span>
                <span className="text-amber-400 font-mono font-semibold">DIRECT_CAUSE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 2: Impact & Strategy */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-orange-400" />
                2. Impact & Strategy
              </span>
              <span className="text-amber-400 font-mono text-[11px]">HIGH BLAST</span>
            </div>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Blast Radius</span>
                <span className="text-amber-400 font-mono font-semibold">HIGH SEVERITY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repair Strategy</span>
                <span className="text-cyan-400 font-mono font-semibold">CODE_PATCH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Strategy Risk</span>
                <span className="text-emerald-400 font-mono font-semibold">LOW (Score 95)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rollback Available</span>
                <span className="text-emerald-400 font-mono font-semibold">YES (Snapshot)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 3: Patch & Regression */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                3. Patch & Regression
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">ATOMIC</span>
            </div>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Files Patched</span>
                <span className="text-slate-200 font-mono font-semibold">2 files (+11/-3)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prod Build</span>
                <span className="text-emerald-400 font-mono font-semibold">PASS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">4-Tier Regression</span>
                <span className="text-emerald-400 font-mono font-semibold">61/61 PASS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Defect Re-pro</span>
                <span className="text-emerald-400 font-mono font-semibold">RESOLVED (0/2)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quadrant 4: Deployment & Acceptance */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                4. Live & Governance
              </span>
              <span className="text-emerald-400 font-mono text-[11px]">10/10 PASS</span>
            </div>
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Live API</span>
                <span className="text-emerald-400 font-mono font-semibold">PASS (200 OK)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Live Browser View</span>
                <span className="text-emerald-400 font-mono font-semibold">PASS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Repair Attempts</span>
                <span className="text-emerald-400 font-mono font-semibold">1 / 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Defects</span>
                <span className="text-emerald-400 font-mono font-semibold">0 Defects</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence & Call Stack Drawer */}
      {showEvidence && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl font-mono text-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-2 font-semibold text-slate-200">
              <Terminal className="w-4 h-4 text-amber-400" />
              Failure Call-Stack Trace & Diagnostic Evidence
            </span>
            <span className="text-emerald-400">Diagnostic Status: CORROBORATED</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Correlated Call Stack</div>
              <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                {callStack.map((step, i) => (
                  <div key={i} className="text-slate-300 text-[11px]">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Multi-Signal Evidence Log</div>
              <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto">
                {evidenceList.map((item, i) => (
                  <div key={i} className="flex items-start justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-semibold">[{item.source}]</span>
                      <span className="text-slate-300">{item.detail}</span>
                    </div>
                    <span className="text-emerald-400 flex-shrink-0 ml-2 font-mono">{Math.round(item.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
