import React, { useState } from "react";
import {
  FileCheck,
  GitCompare,
  Plus,
  Minus,
  FileEdit,
  ShieldCheck,
  Database,
  Server,
  Layers,
  ArrowRight
} from "lucide-react";
import type { GenerationDiffReport, ChangePreviewReport } from "../types/control-plane-ui.js";

export interface DryRunAndDiffViewerProps {
  dryRunReport?: {
    jobId: string;
    status: string;
    productSpec?: any;
    architectureContract?: any;
    domainContract?: any;
    fileGraph?: any;
    taskCount?: number;
    diskMutations: number;
  };
  generationDiff?: GenerationDiffReport;
  onStartGeneration?: () => void;
}

export const DryRunAndDiffViewer: React.FC<DryRunAndDiffViewerProps> = ({
  dryRunReport,
  generationDiff,
  onStartGeneration,
}) => {
  const [activeTab, setActiveTab] = useState<"dryrun" | "diff" | "codediff">("dryrun");
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx");

  const mockFileDiff: Record<string, { before: string; after: string }> = {
    "src/App.tsx": {
      before: `import React from 'react';\nimport { MemberList } from './features/members/MemberList';\n\nexport const App = () => (\n  <div>\n    <h1>Gym Dashboard</h1>\n    <MemberList />\n  </div>\n);`,
      after: `import React from 'react';\nimport { MemberList } from './features/members/MemberList';\nimport { ThemeToggle } from './components/ThemeToggle';\n\nexport const App = () => (\n  <div className="dark:bg-slate-950 min-h-screen">\n    <header className="flex justify-between">\n      <h1>Gym Dashboard</h1>\n      <ThemeToggle />\n    </header>\n    <MemberList />\n  </div>\n);`,
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Dry Run & Evolutionary Diff Center
          </h1>
          <p className="text-xs text-slate-400">
            Inspect zero-mutation execution plans and precise generation diffs.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("dryrun")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "dryrun"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dry Run Plan
          </button>
          <button
            onClick={() => setActiveTab("diff")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "diff"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Generation Diff
          </button>
          <button
            onClick={() => setActiveTab("codediff")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "codediff"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Code Diff
          </button>
        </div>
      </div>

      {/* Tab 1: Dry Run Plan */}
      {activeTab === "dryrun" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Non-Mutating Dry Run Analysis</h2>
                  <span className="text-xs text-slate-400">
                    Full contracts & DAG generated with strict zero filesystem mutations
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-xs font-mono font-bold">
                DISK MUTATIONS: {dryRunReport?.diskMutations ?? 0}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                  Architecture
                </span>
                <div className="font-semibold text-slate-200">React + Express + Postgres</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                  Estimated Tasks
                </span>
                <div className="font-semibold text-indigo-400 font-mono text-base">
                  {dryRunReport?.taskCount ?? 8} Tasks
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                  API Endpoints
                </span>
                <div className="font-semibold text-cyan-400 font-mono">4 REST Routes</div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                  Database Models
                </span>
                <div className="font-semibold text-emerald-400 font-mono">2 Prisma Models</div>
              </div>
            </div>

            {onStartGeneration && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onStartGeneration}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <span>Proceed to Autonomous Generation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Generation Diff */}
      {activeTab === "diff" && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Generation Lineage Diff (G1 → G2)
                  </h2>
                  <span className="text-xs text-slate-400">
                    Comparing state between initial generation and user-feedback evolution
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Created */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>Created Files</span>
                  </span>
                  <span className="font-mono">
                    {generationDiff?.filesCreated.length ?? 1}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  {generationDiff?.filesCreated.map((f) => (
                    <div key={f} className="text-emerald-400/90">+ {f}</div>
                  )) || <div>+ src/styles/dark.css</div>}
                </div>
              </div>

              {/* Modified */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <FileEdit className="w-4 h-4" />
                    <span>Modified Files</span>
                  </span>
                  <span className="font-mono">
                    {generationDiff?.filesModified.length ?? 1}
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  {generationDiff?.filesModified.map((f) => (
                    <div key={f} className="text-amber-400/90">~ {f}</div>
                  )) || <div>~ src/App.tsx</div>}
                </div>
              </div>

              {/* Preserved */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Preserved Files</span>
                  </span>
                  <span className="font-mono">
                    {generationDiff?.filesPreserved.length ?? 87}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  100% backend controllers, database schemas, and data rows preserved intact.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Code Diff */}
      {activeTab === "codediff" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-slate-300">
              Diff for: {selectedFile}
            </span>
            <span className="text-[10px] font-mono text-slate-500">READ-ONLY DIFF VIEW</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Before */}
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/20 space-y-2">
              <div className="text-rose-400 font-bold text-[11px] uppercase tracking-wider">
                Before (G1)
              </div>
              <pre className="text-slate-400 whitespace-pre-wrap overflow-x-auto">
                {mockFileDiff[selectedFile]?.before}
              </pre>
            </div>

            {/* After */}
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 space-y-2">
              <div className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                After (G2 Evolution)
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap overflow-x-auto">
                {mockFileDiff[selectedFile]?.after}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
