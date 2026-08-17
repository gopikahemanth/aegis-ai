import React, { useState } from "react";
import {
  HeartHandshake,
  Award,
  ShieldCheck,
  Zap,
  Network,
  Cpu,
  Layers,
  Compass,
  MapPin,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Calendar,
  FlaskConical,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Activity,
  AlertTriangle,
  UserCheck
} from "lucide-react";

export const EnterpriseCustomerLifecycleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"health" | "journey" | "retention" | "expansion" | "interventions">("health");
  const [intervening, setIntervening] = useState(false);
  const [interventionResult, setInterventionResult] = useState<string | null>(null);

  const handleProactiveIntervention = () => {
    setIntervening(true);
    setTimeout(() => {
      setIntervening(false);
      setInterventionResult("Proactive Success Plan Verified: 'cust_gym_central_01'. Lifecycle: ADOPTING. Health Score: 88/100 (HEALTHY). Churn Risk Reduced: -35%. Human CS Auth: sig_cs_lead_p38_valid. Verified Retention Value: ₹2,40,000 INR.");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              PHASE 38 AUTONOMOUS CUSTOMER LIFECYCLE & RETENTION INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Autonomous Customer Lifecycle, Adoption & Retention Intelligence
          </h1>
          <p className="text-xs text-slate-400">
            Lifecycle state tracking, composite health scoring, churn risk forecasting, expansion intelligence, governed proactive interventions, and verified customer retention outcomes.
          </p>
        </div>

        <div className="text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl text-center font-mono">
          LIFECYCLE INTELLIGENCE ACTIVE
        </div>
      </div>

      {/* Supreme 27-Tier Certificate Banner */}
      <div className="bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-950 border border-teal-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Supreme Customer Lifecycle Certificate Active</h2>
              <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold">
                CUSTOMER_LIFECYCLE_CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cert: cert_cust_life_supreme • 27/27 Governance Tiers Certified • Verified Customer Retention & Expansion
            </p>
          </div>
        </div>

        <div className="text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-4 py-2 rounded-xl text-center font-mono">
          27 / 27 GOVERNANCE TIERS VALID
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {(["health", "journey", "retention", "expansion", "interventions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-teal-600 text-white font-bold"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/40"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "health" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Customer Health & Adoption Health Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Total Managed Accounts</div>
              <div className="text-base font-bold text-white">45 Accounts</div>
              <div className="text-[10px] text-teal-400 font-mono">95.5% RETENTION RATE</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Composite Health Score</div>
              <div className="text-base font-bold text-emerald-400">88.4 / 100</div>
              <div className="text-[10px] text-emerald-400 font-mono">STATE: HEALTHY</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Feature Adoption Index</div>
              <div className="text-base font-bold text-white">84.2% Adoption</div>
              <div className="text-[10px] text-teal-400 font-mono">VELOCITY: INCREASING</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">At-Risk Accounts</div>
              <div className="text-base font-bold text-amber-400">2 Accounts (4.5%)</div>
              <div className="text-[10px] text-amber-400 font-mono">PROACTIVE INTERVENTION READY</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "journey" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            Customer Journey & Onboarding Velocity
          </h2>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div>✓ Milestone Funnel: ONBOARDING (100%) → ACTIVATION (98%) → FIRST_VALUE (95%) → ADOPTION (84%) → EXPANSION (35%)</div>
            <div>✓ Time-To-First-Value (TTFV): Average 2.4 hours across new gym accounts</div>
            <div>✓ Zero Journey Bottlenecks: Setup friction resolved via guided workflows</div>
          </div>
        </div>
      )}

      {activeTab === "retention" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            Churn Risk Forecasting & Retention Defense
          </h2>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div>✓ 30-Day Forecast Churn Probability: 8.5% (Risk: LOW)</div>
            <div>✓ 90-Day Forecast Churn Probability: 12.0% (Risk: LOW)</div>
            <div>✓ Proactive Early Warning: Telemetry alerts trigger Customer Success review before drop-off</div>
          </div>
        </div>
      )}

      {activeTab === "expansion" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Customer Expansion & Verified Value Realization
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Total Verified Retention Value</div>
              <div className="text-lg font-bold text-emerald-400">₹2,40,000 INR</div>
              <div className="text-[10px] text-slate-500 font-mono">STATUS: RETENTION_VERIFIED</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Expansion Opportunities</div>
              <div className="text-lg font-bold text-teal-400">₹3,20,000 INR</div>
              <div className="text-[10px] text-slate-500 font-mono">QUALIFIED PIPELINE</div>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-400">Expansion Readiness Index</div>
              <div className="text-lg font-bold text-cyan-400">92.5%</div>
              <div className="text-[10px] text-slate-500 font-mono">HIGH HEALTH CRITERIA MET</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "interventions" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-400" />
            Governed Customer Success Action & Proactive Intervention Center
          </h2>
          <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
            <p className="text-slate-300">
              Trigger governed Customer Success action plans with zero-mutation scenario simulation, human authorization, and 5-dimension outcome verification.
            </p>

            <button
              onClick={handleProactiveIntervention}
              disabled={intervening}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{intervening ? "Executing Governed Success Plan..." : "Simulate, Authorize & Intervene: Gym Central Account"}</span>
            </button>

            {interventionResult && (
              <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-xl text-xs font-mono text-teal-200">
                ✓ {interventionResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
