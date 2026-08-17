import React from "react";
import { GitPullRequest, CheckCircle2, Clock, Zap, Cpu, FileCode } from "lucide-react";

export const TaskDagViewer: React.FC = () => {
  const dagNodes = [
    {
      id: "task_1",
      name: "Prisma Schema & Database Models",
      status: "COMPLETED",
      dependencies: [],
      ownedFiles: ["prisma/schema.prisma"],
      cached: false,
      durationMs: 140,
    },
    {
      id: "task_2",
      name: "API Route Handlers & Express Server",
      status: "COMPLETED",
      dependencies: ["task_1"],
      ownedFiles: ["server/routes/members.ts", "server/index.ts"],
      cached: true,
      durationMs: 95,
    },
    {
      id: "task_3",
      name: "React Member Management Components",
      status: "COMPLETED",
      dependencies: ["task_2"],
      ownedFiles: ["src/features/members/MemberList.tsx"],
      cached: false,
      durationMs: 210,
    },
    {
      id: "task_4",
      name: "App Layout & Navigation Bar",
      status: "COMPLETED",
      dependencies: ["task_3"],
      ownedFiles: ["src/App.tsx"],
      cached: false,
      durationMs: 120,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Task DAG Visualizer</h1>
          <p className="text-xs text-slate-400">
            Dependency-aware parallel execution graph with deterministic task hash caching.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5" />
          <span>PARALLEL CONCURRENCY: 4 WORKERS</span>
        </div>
      </div>

      {/* DAG Graph Flow */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dagNodes.map((node, i) => (
            <div
              key={node.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 relative group hover:border-indigo-500/50 transition-all shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[10px] font-mono text-slate-500">STEP {i + 1}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {node.status}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-200">{node.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {node.cached ? (
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      CACHE HIT
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500">FRESH EXEC</span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {node.durationMs}ms
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                <div className="text-slate-500 uppercase tracking-wider text-[9px]">Owned Files:</div>
                {node.ownedFiles.map((f) => (
                  <div key={f} className="truncate">📁 {f}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
