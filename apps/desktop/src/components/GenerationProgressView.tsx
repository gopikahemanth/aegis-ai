import React from "react";
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pause,
  Play,
  XCircle,
  ShieldAlert,
  Layers,
  Terminal,
  Activity
} from "lucide-react";
import type { GenerationJob, ProgressEvent, StageEvidence } from "../types/control-plane-ui.js";

export interface GenerationProgressViewProps {
  job?: GenerationJob;
  events?: ProgressEvent[];
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  onOpenAuthorizationModal?: () => void;
}

export const GenerationProgressView: React.FC<GenerationProgressViewProps> = ({
  job,
  events = [],
  onPause,
  onResume,
  onCancel,
  onOpenAuthorizationModal,
}) => {
  const canonicalStages = [
    { id: "REQUIREMENT_ANALYSIS", label: "Requirement Analysis" },
    { id: "CLARIFICATION", label: "Clarification" },
    { id: "PRODUCT_SPECIFICATION", label: "Product Specification" },
    { id: "ARCHITECTURE_RESOLUTION", label: "Architecture Resolution" },
    { id: "DOMAIN_CONTRACT", label: "Domain Contract" },
    { id: "DATA_CONTRACT", label: "Data Contract" },
    { id: "API_CONTRACT", label: "API Contract" },
    { id: "FILE_GRAPH", label: "File Graph" },
    { id: "TASK_DAG", label: "Task DAG Planning" },
    { id: "TASK_EXECUTION", label: "Parallel Code Generation" },
    { id: "MODULE_CLOSURE", label: "Module & Import Validation" },
    { id: "COMPILATION_BUILD", label: "TypeScript Compilation & Build" },
    { id: "RUNTIME_EXECUTION", label: "Live Server & DB Startup" },
    { id: "FINAL_VERIFICATION", label: "Verification Matrix & Product Gate" },
  ];

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center max-w-md mx-auto space-y-3">
        <Activity className="w-12 h-12 text-slate-700" />
        <h2 className="text-base font-bold text-slate-300">No Active Generation</h2>
        <p className="text-xs text-slate-500">
          Start a new generation in the Generation Studio to monitor real-time execution.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                {job.generationId}
              </span>
              <h1 className="text-lg font-bold text-white">Active Generation Pipeline</h1>
              <span className="text-xs font-mono text-slate-400">({job.type})</span>
            </div>
            <p className="text-xs text-slate-400 font-mono max-w-3xl truncate">
              {job.prompt}
            </p>
          </div>

          {/* Operational Controls */}
          <div className="flex items-center gap-2">
            {job.status === "WAITING_FOR_AUTHORIZATION" && (
              <button
                onClick={onOpenAuthorizationModal}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Review Authorization</span>
              </button>
            )}

            {job.status === "PAUSED" ? (
              <button
                onClick={() => onResume?.(job.jobId)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            ) : job.status !== "COMPLETED" && job.status !== "FAILED" && job.status !== "CANCELLED" ? (
              <button
                onClick={() => onPause?.(job.jobId)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : null}

            {job.status !== "COMPLETED" && job.status !== "FAILED" && job.status !== "CANCELLED" && (
              <button
                onClick={() => onCancel?.(job.jobId)}
                className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Pipeline Stage: {job.currentStage}</span>
            <span className="text-indigo-400 font-mono">{job.progress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${job.progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid: Stages Timeline (Left) & Real-time Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages Timeline */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Pipeline Execution Stages</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">14 CANONICAL STAGES</span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {canonicalStages.map((stage, idx) => {
              const evidence: StageEvidence | undefined = job.pipelineState?.[stage.id];
              const isPassed = evidence?.status === "PASSED" || job.status === "COMPLETED";
              const isFailed = evidence?.status === "FAILED";
              const isCurrent = job.currentStage === stage.id || (!isPassed && !isFailed && idx === 0);

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isPassed
                      ? "bg-slate-950/40 border-slate-800/60 text-slate-200"
                      : isCurrent
                      ? "bg-indigo-950/20 border-indigo-500/40 text-indigo-200 shadow-sm"
                      : isFailed
                      ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                      : "bg-slate-950/20 border-slate-800/40 text-slate-500 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <span className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0"></span>
                    ) : isFailed ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-semibold">{stage.label}</div>
                      {evidence?.summary && (
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                          {evidence.summary}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isPassed
                        ? "text-emerald-400 bg-emerald-500/10"
                        : isCurrent
                        ? "text-indigo-400 bg-indigo-500/10"
                        : isFailed
                        ? "text-rose-400 bg-rose-500/10"
                        : "text-slate-500"
                    }`}
                  >
                    {isPassed ? "PASSED" : isCurrent ? "RUNNING" : isFailed ? "FAILED" : "QUEUED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Progress Events Stream */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Event Stream</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto font-mono text-[11px]">
              {events.length === 0 ? (
                <div className="text-slate-500 text-xs py-8 text-center">
                  Awaiting progress events...
                </div>
              ) : (
                events.map((ev, i) => (
                  <div
                    key={ev.eventId || i}
                    className="p-2 rounded bg-slate-950/60 border border-slate-800/60 space-y-1 text-slate-300"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="text-cyan-400">{ev.type}</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">Stage: {ev.stage}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono">
            Guaranteed Zero Secret Redaction Active
          </div>
        </div>
      </div>
    </div>
  );
};
