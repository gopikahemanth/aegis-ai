import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Sparkles,
  PlayCircle,
  ShieldCheck,
  FileCode2,
  GitPullRequest,
  TerminalSquare,
  CheckCircle2,
  Wrench,
  Lock,
  Activity,
  History,
  Search,
  Command,
  AlertTriangle,
  Pause,
  Play,
  XCircle,
  Check,
  Server,
  Radio,
  BrainCircuit,
  Compass,
  Cpu,
  Building2,
  Users2,
  Target,
  TrendingUp,

  Scale,
  Coins,
  HeartPulse,
  Zap,
  Network,
  Lightbulb,
  HeartHandshake,
  BookOpen
} from "lucide-react";

















import type { JobStatus, SystemHealthReport, GenerationJob } from "../types/control-plane-ui.js";

export interface ShellProps {
  currentView: string;
  onNavigate: (view: string) => void;
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  availableProjects: Array<{ id: string; name: string; generation: string; status: string }>;
  activeJob?: GenerationJob;
  health?: SystemHealthReport;
  onPauseJob?: (jobId: string) => void;
  onResumeJob?: (jobId: string) => void;
  onCancelJob?: (jobId: string) => void;
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({
  currentView,
  onNavigate,
  selectedProjectId,
  onSelectProject,
  availableProjects,
  activeJob,
  health,
  onPauseJob,
  onResumeJob,
  onCancelJob,
  children,
}) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "studio", label: "Generation Studio", icon: Sparkles },
    { id: "progress", label: "Active Jobs", icon: PlayCircle },
    { id: "contracts", label: "Contracts & Arch", icon: FileCode2 },
    { id: "dag", label: "Task DAG", icon: GitPullRequest },
    { id: "preview-diff", label: "Changes & Diff", icon: GitPullRequest },
    { id: "runtime-api", label: "Runtime & API", icon: Server },
    { id: "verification", label: "Verification Matrix", icon: ShieldCheck },
    { id: "gate", label: "Product Success Gate", icon: CheckCircle2 },
    { id: "repairs", label: "Self-Healing", icon: Wrench },
    { id: "security-audit", label: "Security & Audit", icon: Lock },
    { id: "telemetry-evolution", label: "Telemetry & Lineage", icon: Activity },
    { id: "production-release", label: "Production & Release", icon: ShieldCheck },
    { id: "operations", label: "Continuous Operations", icon: Radio },
    { id: "intelligence", label: "Fleet Intelligence", icon: BrainCircuit },
    { id: "command-center", label: "Command Center", icon: Compass },
    { id: "self-management", label: "Self-Management", icon: Cpu },
    { id: "enterprise", label: "Enterprise & Tenancy", icon: Building2 },
    { id: "collaboration", label: "Collaboration & Workflows", icon: Users2 },
    { id: "strategy", label: "Strategic Roadmap", icon: Sparkles },
    { id: "outcomes", label: "Outcome Governance", icon: Target },
    { id: "optimization", label: "Adaptive Optimization", icon: Scale },
    { id: "economics", label: "Value & Economics", icon: Coins },
    { id: "resilience", label: "Risk & Resilience", icon: HeartPulse },
    { id: "continuity", label: "Continuity & Recovery", icon: Zap },
    { id: "predictive-resilience", label: "Predictive Recovery", icon: BrainCircuit },
    { id: "reliability-orchestration", label: "Reliability Orchestration", icon: Network },
    { id: "decision-intelligence", label: "Decision Intelligence", icon: Compass },
    { id: "predictive-planning", label: "Predictive Planning", icon: TrendingUp },
    { id: "autonomous-execution", label: "Autonomous Execution", icon: PlayCircle },
    { id: "change-governance", label: "Change Governance", icon: GitPullRequest },
    { id: "evolution-governance", label: "Enterprise Evolution", icon: Sparkles },
    { id: "innovation-governance", label: "Innovation Governance", icon: Lightbulb },
    { id: "product-intelligence", label: "Product Intelligence", icon: Users2 },
    { id: "customer-lifecycle", label: "Customer Lifecycle", icon: HeartHandshake },
    { id: "institutional-knowledge", label: "Institutional Knowledge", icon: BookOpen },
    { id: "knowledge-synthesis", label: "Knowledge Synthesis", icon: BrainCircuit },
    { id: "knowledge-action", label: "Knowledge Action", icon: Zap },
  ];



























  const getStatusBadge = (status?: JobStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "GENERATING":
      case "BUILDING":
      case "RUNNING":
      case "VALIDATING":
      case "VERIFYING":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse";
      case "WAITING_FOR_AUTHORIZATION":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "PAUSED":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "FAILED":
      case "BLOCKED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              Æ
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide text-white">AEGIS</div>
              <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Control Plane</div>
            </div>
          </div>

          {/* Project Selector */}
          <div className="p-4 border-b border-slate-800/60">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-1.5 block">
              Active Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.generation})
                </option>
              ))}
            </select>
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Health Status Indicator */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.overall === "HEALTHY"
                    ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                    : health?.overall === "DEGRADED"
                    ? "bg-amber-400 shadow-sm shadow-amber-400"
                    : "bg-red-400 shadow-sm shadow-red-400"
                }`}
              />
              <span className="text-xs font-medium text-slate-300">
                {health?.overall === "HEALTHY" ? "System Healthy" : "System Degraded"}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          {/* Active Job Controls & Pill */}
          <div className="flex items-center gap-4">
            {activeJob ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-full pl-3 pr-4 py-1.5 shadow-inner">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(activeJob.status)}`}>
                  {activeJob.status}
                </span>
                <span className="text-xs font-mono text-slate-300 truncate max-w-xs">
                  {activeJob.prompt}
                </span>

                {/* Pause / Resume / Cancel Controls */}
                <div className="flex items-center gap-1 border-l border-slate-800 pl-2 ml-1">
                  {activeJob.status === "PAUSED" ? (
                    <button
                      onClick={() => onResumeJob?.(activeJob.jobId)}
                      title="Resume Generation"
                      className="p-1 hover:bg-slate-800 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  ) : activeJob.status !== "COMPLETED" && activeJob.status !== "FAILED" && activeJob.status !== "CANCELLED" ? (
                    <button
                      onClick={() => onPauseJob?.(activeJob.jobId)}
                      title="Pause Generation"
                      className="p-1 hover:bg-slate-800 rounded text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  {activeJob.status !== "COMPLETED" && activeJob.status !== "FAILED" && activeJob.status !== "CANCELLED" && (
                    <button
                      onClick={() => onCancelJob?.(activeJob.jobId)}
                      title="Cancel Generation"
                      className="p-1 hover:bg-slate-800 rounded text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                No Active Generation
              </div>
            )}

            {/* Authorization Alert Pill */}
            {activeJob?.status === "WAITING_FOR_AUTHORIZATION" && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                Authorization Required
              </div>
            )}
          </div>

          {/* Quick Search / Command Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search & Commands...</span>
              <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
              <Command className="w-4 h-4 text-indigo-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to view..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button
                onClick={() => setCommandOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {navItems
                .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setCommandOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300 transition-colors text-left"
                  >
                    <span>Jump to {item.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">View</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
