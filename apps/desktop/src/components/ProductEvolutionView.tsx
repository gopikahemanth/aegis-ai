import React, { useState } from "react";
import {
  GitPullRequest, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw,
  Award, Play, Database, Server, Monitor, Palette,
  PlugZap, Wrench, ExternalLink, Terminal, ArrowRight, Layers
} from "lucide-react";

interface PipelineStage {
  label: string;
  category: "planning" | "layers" | "verification" | "governance";
  status: "passed" | "running" | "failed" | "pending";
  detail: string;
}

export const ProductEvolutionView: React.FC = () => {
  const [isEvolving, setIsEvolving] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [changePrompt, setChangePrompt] = useState(
    "Add online payments to my existing gym management website. Members should be able to pay for memberships, admins should see payment history, and membership status should update after successful payment."
  );

  const [stages, setStages] = useState<PipelineStage[]>([
    { label: "Existing Product Analysis", category: "planning", status: "passed", detail: "React 18 + Express + PostgreSQL + Prisma scanned" },
    { label: "Change Request Understanding", category: "planning", status: "passed", detail: "7 requirements (4 explicit, 2 inferred, 1 assumed)" },
    { label: "Impact & Dependency Graph", category: "planning", status: "passed", detail: "5 critical transaction paths mapped (High Impact)" },
    { label: "Ordered Modification Plan", category: "planning", status: "passed", detail: "10-step plan approved with rollback" },

    { label: "Database Evolution", category: "layers", status: "passed", detail: "Payment model + 3 foreign keys + 3 indexes (0 data loss)" },
    { label: "Backend API Evolution", category: "layers", status: "passed", detail: "3 new payment endpoints + 5 existing preserved" },
    { label: "Frontend Incremental Evolution", category: "layers", status: "passed", detail: "CheckoutModal & PaymentHistoryTable integrated" },
    { label: "UI / UX Consistency", category: "layers", status: "passed", detail: "Existing Design System tokens & WCAG 2.1 AA verified" },
    { label: "External Integrations", category: "layers", status: "passed", detail: "Stripe Payment Intents & Resend receipts active" },

    { label: "New Feature Tests", category: "verification", status: "passed", detail: "12 / 12 tests passed ✓" },
    { label: "Regression Test Matrix", category: "verification", status: "passed", detail: "28 / 28 existing core tests passed ✓" },
    { label: "Live E2E Round-trip Workflows", category: "verification", status: "passed", detail: "8 / 8 journeys verified (Pay -> Active -> Attendance)" },

    { label: "Autonomous Defect Repairs", category: "governance", status: "passed", detail: "1 defect diagnosed & patched on attempt 1" },
    { label: "Critical Defects", category: "governance", status: "passed", detail: "0 critical defects" },
  ]);

  const [planSteps, setPlanSteps] = useState<string[]>([
    "1. [DATABASE] Evolve Prisma Schema: Add Payment model with foreign keys to Member & Plan",
    "2. [DATABASE] Execute non-destructive additive migration: `prisma migrate deploy`",
    "3. [INTEGRATION] Configure Stripe SDK client and raw-body webhook signature validator",
    "4. [BACKEND] Implement PaymentService with intent creation and idempotency handler",
    "5. [BACKEND] Register POST /api/payments/create-intent, POST /api/payments/webhook, GET /api/payments/history",
    "6. [FRONTEND] Build MemberCheckoutModal.tsx reusing existing Design System Card/Modal components",
    "7. [FRONTEND] Build PaymentHistoryTable.tsx with search and status badges for Admin view",
    "8. [TESTS] Execute 3-tier test suite: 12 new feature + 8 affected feature + 28 regression tests",
    "9. [REPAIR] Detect regression in webhook handler -> Apply patch to update Member.isActive = true",
    "10. [VERIFY] Rebuild and run live round-trip verification across all 7 layers",
  ]);

  const handleEvolve = () => {
    setIsEvolving(true);
    setTimeout(() => setIsEvolving(false), 1400);
  };

  const statusBadge = (status: PipelineStage["status"]) => {
    if (status === "passed") return <span className="text-emerald-400 font-mono text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> PASS</span>;
    if (status === "failed") return <span className="text-red-400 font-mono text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> FAIL</span>;
    if (status === "running") return <span className="text-yellow-400 font-mono text-xs flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> RUNNING</span>;
    return <span className="text-slate-500 font-mono text-xs">PENDING</span>;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5" />
              PHASE 56 — AUTONOMOUS EXISTING PRODUCT MODIFICATION & EVOLUTION
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Product Modification & Evolution Center</h1>
          <p className="text-xs text-slate-400">
            Existing Codebase → Understand Architecture → Plan Change → Safe Multi-Layer Mutation → Autonomous Repair → Live Verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPlan(!showPlan)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            {showPlan ? "Hide Plan" : "View Modification Plan"}
          </button>
          <button
            onClick={handleEvolve}
            disabled={isEvolving}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 via-rose-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-pink-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isEvolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isEvolving ? "Evolving Product..." : "Evolve Existing Product"}
          </button>
        </div>
      </div>

      {/* Change Request Input Display */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-pink-400" />
          Active Natural Language Change Request
        </div>
        <div className="text-xs font-mono text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          "{changePrompt}"
        </div>
      </div>

      {/* Tier 43 Product Evolution Certificate Card */}
      <div className="bg-gradient-to-br from-pink-950/50 via-slate-900/60 to-purple-950/40 border border-pink-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Tier 43 — Product Evolution Certificate</h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  EVOLUTION ACCEPTED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: <span className="font-mono text-pink-300">GymMaster Pro</span> | Capability: <span className="font-mono text-pink-300">Online Payments & Membership Billing</span> | Live URL: <span className="font-mono text-pink-300">https://aegisgym.com</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://aegisgym.com"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Updated Product
            </a>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Product Evolution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Understanding & Planning */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <Layers className="w-4 h-4 text-pink-400" />
              Analysis & Contract
            </div>
            <div className="space-y-3 mt-3">
              {stages.filter(s => s.category === "planning").map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    {statusBadge(item.status)}
                  </div>
                  <span className="text-[11px] text-slate-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 2: Multi-Layer Mutations */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <Server className="w-4 h-4 text-purple-400" />
              Evolved Layers
            </div>
            <div className="space-y-3 mt-3">
              {stages.filter(s => s.category === "layers").map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    {statusBadge(item.status)}
                  </div>
                  <span className="text-[11px] text-slate-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 3: Test Matrix & Workflows */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Tests & Verification
            </div>
            <div className="space-y-3 mt-3">
              {stages.filter(s => s.category === "verification").map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    {statusBadge(item.status)}
                  </div>
                  <span className="text-[11px] text-slate-500">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pillar 4: Autonomous Repairs & Governance */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-200">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Repair & Acceptance
            </div>
            <div className="space-y-3 mt-3">
              {stages.filter(s => s.category === "governance").map((item, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    {statusBadge(item.status)}
                  </div>
                  <span className="text-[11px] text-slate-500">{item.detail}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Acceptance Score</span>
                  <span className="text-emerald-400 font-mono font-bold">13/13 (100%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Regression Safety</span>
                  <span className="text-emerald-400 font-mono font-bold">VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Modification Plan Drawer */}
      {showPlan && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 mb-3">
            <span className="flex items-center gap-2 font-semibold text-slate-200">
              <Terminal className="w-4 h-4 text-pink-400" />
              Ordered Product Modification Plan (10/10 Stages Executed Cleanly)
            </span>
            <span className="text-[11px] text-emerald-400">Status: ACCEPTED & DEPLOYED</span>
          </div>
          <div className="space-y-1 text-slate-300 max-h-60 overflow-y-auto">
            {planSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600 select-none">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-slate-300">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
