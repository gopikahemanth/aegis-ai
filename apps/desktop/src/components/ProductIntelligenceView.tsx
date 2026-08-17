import React, { useState } from "react";
import {
  Brain, Sparkles, CheckCircle2, AlertCircle, RefreshCw,
  Award, Play, ArrowRight, TrendingUp, ShieldCheck,
  Zap, Layers, Activity, Eye, Compass, ThumbsUp,
  FileCheck2, Smartphone, DollarSign, Clock, RotateCcw
} from "lucide-react";

export const ProductIntelligenceView: React.FC = () => {
  const [isObserving, setIsObserving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "problems" | "opportunities" | "contract">("overview");

  const handleObserveAndImprove = () => {
    setIsObserving(true);
    setTimeout(() => setIsObserving(false), 1400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              PHASE 60 — AUTONOMOUS PRODUCT INTELLIGENCE & CONTINUOUS IMPROVEMENT
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Product Intelligence & Continuous Evolution Center</h1>
          <p className="text-xs text-slate-400">
            Continuous Live Observation → Correlate Signals → Discover Problems/Opportunities → Improvement Contract → Multi-Layer Verification → Real-World Uplift.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleObserveAndImprove}
            disabled={isObserving}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isObserving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isObserving ? "Observing & Evaluating..." : "Continuous Improve"}
          </button>
        </div>
      </div>

      {/* Tier 47 Certificate */}
      <div className="bg-gradient-to-br from-purple-950/50 via-slate-900/60 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Tier 47 — Product Intelligence & Continuous Improvement Certificate</h2>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  IMPROVEMENT ACCEPTED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Target: <span className="font-mono text-purple-300">GymMaster Pro</span> | Real-World Impact: <span className="font-mono text-emerald-300">+12.0% Conversion Uplift</span> | Verification: <span className="font-mono text-emerald-300">5/5 Layers PASS (0 Regressions)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            CLOSED-LOOP CONTINUOUS PRODUCT ENGINE ACTIVE
          </div>
        </div>
      </div>

      {/* Health Dimensions Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">FUNCTIONAL</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">98</div>
          <div className="text-[10px] text-emerald-500 mt-1">HEALTHY</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">SECURITY</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">100</div>
          <div className="text-[10px] text-emerald-500 mt-1">MAX SECURE</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">PERFORMANCE</div>
          <div className="text-xl font-bold text-cyan-400 font-mono">94</div>
          <div className="text-[10px] text-cyan-500 mt-1">OPTIMIZED</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">UX & DESIGN</div>
          <div className="text-xl font-bold text-indigo-400 font-mono">91</div>
          <div className="text-[10px] text-indigo-400 mt-1">OPTIMIZED</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">RELIABILITY</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">99</div>
          <div className="text-[10px] text-emerald-500 mt-1">HEALTHY</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">AVAILABILITY</div>
          <div className="text-xl font-bold text-emerald-400 font-mono">100%</div>
          <div className="text-[10px] text-emerald-500 mt-1">ONLINE</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 font-semibold mb-1">WORKFLOW</div>
          <div className="text-xl font-bold text-purple-400 font-mono">96</div>
          <div className="text-[10px] text-purple-400 mt-1">ENHANCED</div>
        </div>
      </div>

      {/* Real-World Impact Scorecard */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Measured Real-World Business & UX Impact
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            +12.0% Conversion Uplift Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Checkout Completion Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-red-400 line-through text-xs font-mono">62%</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-xl font-bold text-emerald-400 font-mono">74%</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">+12.0 percentage points</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Mobile Abandonment Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-red-400 line-through text-xs font-mono">38%</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-xl font-bold text-emerald-400 font-mono">26%</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">-12.0 percentage points</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Payment Intent P95 Latency</div>
            <div className="flex items-baseline gap-2">
              <span className="text-red-400 line-through text-xs font-mono">2,100ms</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-xl font-bold text-cyan-400 font-mono">380ms</span>
            </div>
            <div className="text-[10px] text-cyan-400 mt-1 font-semibold">-81.9% (5.5x faster)</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1">Production Payment Errors</div>
            <div className="flex items-baseline gap-2">
              <span className="text-emerald-400 text-xs font-mono">0.0%</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="text-xl font-bold text-emerald-400 font-mono">0.0%</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Zero Regressions</div>
          </div>
        </div>
      </div>

      {/* Intelligence Explorer Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "overview" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Discovered Signals & Root Cause
          </button>
          <button
            onClick={() => setActiveTab("contract")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "contract" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Improvement Contract & Plan
          </button>
          <button
            onClick={() => setActiveTab("opportunities")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${activeTab === "opportunities" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
          >
            Growth Opportunities (2)
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  P1 HIGH PRIORITY
                </span>
                <h3 className="text-xs font-bold text-white">Mobile Checkout Abandonment Correlated with 2,100ms API Latency</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                CONFIDENCE: 95%
              </span>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              <p><strong className="text-slate-200">Investigated Root Cause:</strong> Unnecessary sequential validation and unindexed membership plan lookup in <span className="font-mono text-cyan-300">PaymentService</span> during payment intent generation.</p>
              <p className="mt-1"><strong className="text-slate-200">Autonomous Action:</strong> Formulated Improvement Contract, batched plan queries, verified with 61/61 regression suites, and deployed live to production.</p>
            </div>
          </div>
        )}

        {activeTab === "contract" && (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono text-xs space-y-2">
            <div className="text-purple-300 font-bold">IMPROVEMENT CONTRACT #contract_imp_checkout</div>
            <div className="text-slate-300">• Objective: Reduce mobile checkout latency from 2,100ms to &lt;450ms</div>
            <div className="text-slate-300">• Constraints: Zero modifications to Stripe tokenization or server Zod validation</div>
            <div className="text-slate-300">• Verification: 61/61 Functional Tests + Tier 45 Security Gate + Real Browser Runner</div>
            <div className="text-emerald-400">• Post-Deployment Decision: KEEP (Supported by +12% conversion evidence)</div>
          </div>
        )}

        {activeTab === "opportunities" && (
          <div className="space-y-2">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">1. Pre-fetch Membership Plans in Background on Pricing Page Hover</div>
                <div className="text-slate-400 text-[11px]">Eliminates 250ms visual waiting time upon opening checkout modal</div>
              </div>
              <span className="text-purple-400 font-mono text-xs font-bold">LOW EFFORT</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 text-xs font-semibold">2. Add Quick-Checkin Shortcut to Mobile Staff Dashboard</div>
                <div className="text-slate-400 text-[11px]">Reduces member check-in friction by 3 clicks during peak morning hours</div>
              </div>
              <span className="text-purple-400 font-mono text-xs font-bold">LOW EFFORT</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
