import React, { useState } from "react";
import {
  Sparkles,
  Play,
  Eye,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Terminal
} from "lucide-react";
import type { ChangePreviewReport } from "../types/control-plane-ui.js";

export interface GenerationStudioProps {
  projectId: string;
  isIncremental: boolean;
  onRunDryRun: (prompt: string) => void;
  onPreviewChange: (prompt: string) => void;
  onStartGeneration: (prompt: string) => void;
  changePreview?: ChangePreviewReport;
  isExecuting?: boolean;
}

export const GenerationStudio: React.FC<GenerationStudioProps> = ({
  projectId,
  isIncremental,
  onRunDryRun,
  onPreviewChange,
  onStartGeneration,
  changePreview,
  isExecuting = false,
}) => {
  const [prompt, setPrompt] = useState(
    isIncremental
      ? "Add dark theme styles with toggle in the navbar and preserve existing backend APIs."
      : "Build a gym management application where staff can manage members, trainers, attendance and workouts."
  );

  const samplePrompts = isIncremental
    ? [
        "Add attendance export to CSV in the members dashboard.",
        "Add dark theme toggle to navbar and persist preference.",
        "Add trainer rating and review system to workout logs.",
      ]
    : [
        "Build a gym management application where staff can manage members, trainers, attendance and workouts.",
        "Build a recipe management system with meal planning, shopping list generation, and ingredients tracking.",
        "Build a developer portfolio and resume builder with live preview and PDF export.",
      ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isIncremental ? "Continuous Evolution Studio" : "Autonomous Generation Studio"}
            </h1>
            <p className="text-xs text-slate-400">
              {isIncremental
                ? "Evolve your existing verified project with minimal blast radius and zero data loss."
                : "Transform natural-language product specs into a real, verified fullstack application."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Requirement Input */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Product Requirement Prompt
        </label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the application or feature evolution you want AEGIS to engineer..."
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
        />

        {/* Quick Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sample Requirements:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(sp)}
                className="text-xs bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors text-left"
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPreviewChange(prompt)}
              disabled={isExecuting || !prompt.trim()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Preview Blast Radius</span>
            </button>

            <button
              onClick={() => onRunDryRun(prompt)}
              disabled={isExecuting || !prompt.trim()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all shadow-sm"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Execute Dry Run (0 Disk Mutations)</span>
            </button>
          </div>

          <button
            onClick={() => onStartGeneration(prompt)}
            disabled={isExecuting || !prompt.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isIncremental ? "Start Evolution (G2)" : "Start Autonomous Generation"}</span>
          </button>
        </div>
      </div>

      {/* Change Preview Box if Available */}
      {changePreview && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Change Impact & Blast Radius Preview</h2>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                changePreview.risk === "LOW"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : changePreview.risk === "MEDIUM"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              RISK: {changePreview.risk}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Change Type
              </span>
              <span className="font-semibold text-slate-200">{changePreview.changeType}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Blast Radius
              </span>
              <span className="font-semibold text-indigo-300">{changePreview.blastRadius}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Preserved Untouched Files
              </span>
              <span className="font-semibold text-emerald-400">
                {changePreview.filesPreserved.length} files
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
            {changePreview.summary}
          </div>
        </div>
      )}
    </div>
  );
};
