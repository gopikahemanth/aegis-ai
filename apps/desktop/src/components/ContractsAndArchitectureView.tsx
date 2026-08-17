import React, { useState } from "react";
import {
  FileCode2,
  Lock,
  Layers,
  Database,
  Server,
  FolderTree,
  AlertTriangle,
  CheckCircle2,
  Cpu
} from "lucide-react";

export const ContractsAndArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"arch" | "domain" | "api" | "data" | "files">("arch");

  const contracts = {
    arch: {
      type: "FULLSTACK_WEB_REACT_EXPRESS",
      frontend: "React-Vite [default]",
      backend: "Express [default]",
      database: "PostgreSQL [default]",
      orm: "Prisma [default]",
      auth: "JWT",
      hashes: {
        arch: "e157b4258648",
        tech: "060714627336",
        dep: "8dc09c4ae8fd",
      },
      driftStatus: "LOCKED_CLEAN",
    },
    domain: {
      domainName: "Gym Management System",
      entities: ["User", "Member", "Trainer", "Attendance", "Workout"],
      features: ["auth", "members", "trainers", "attendance", "workouts"],
      hash: "eaf45027e749",
    },
    api: [
      { method: "POST", path: "/api/members", summary: "Create gym member", auth: true },
      { method: "GET", path: "/api/members", summary: "List gym members", auth: true },
      { method: "POST", path: "/api/attendance", summary: "Record attendance check-in", auth: true },
      { method: "GET", path: "/api/attendance", summary: "Get attendance logs", auth: true },
    ],
    data: [
      { model: "User", fields: ["id: Int", "email: String", "role: String", "createdAt: DateTime"] },
      { model: "Member", fields: ["id: Int", "name: String", "status: String", "joinedAt: DateTime"] },
      { model: "Attendance", fields: ["id: Int", "memberId: Int", "checkIn: DateTime"] },
    ],
    files: [
      "src/App.tsx",
      "src/main.tsx",
      "src/features/members/MemberList.tsx",
      "src/features/attendance/AttendanceLog.tsx",
      "server/routes/members.ts",
      "server/routes/attendance.ts",
      "server/index.ts",
      "prisma/schema.prisma",
    ],
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Governance & Contract Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative source of truth contracts governing domain, architecture, data, and APIs.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("arch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "arch" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Architecture
          </button>
          <button
            onClick={() => setActiveTab("domain")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "domain" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Domain
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "api" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            API Contract
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "data" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Data Schema
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "files" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            File Graph
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "arch" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Locked Architecture Contract V1</h2>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DRIFT: ZERO (LOCKED)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Arch Hash</span>
              <div className="font-mono text-indigo-300 font-bold">{contracts.arch.hashes.arch}</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Tech Hash</span>
              <div className="font-mono text-cyan-300 font-bold">{contracts.arch.hashes.tech}</div>
            </div>
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 uppercase tracking-wider text-[10px]">Dependency Hash</span>
              <div className="font-mono text-emerald-300 font-bold">{contracts.arch.hashes.dep}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "domain" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Domain Contract Entities</h2>
            </div>
            <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Hash: {contracts.domain.hash}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {contracts.domain.entities.map((ent) => (
              <div
                key={ent}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center font-semibold text-xs text-slate-200"
              >
                {ent}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Authoritative API Contract Registry</h2>
            </div>
          </div>

          <div className="space-y-2">
            {contracts.api.map((route, i) => (
              <div
                key={i}
                className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                      route.method === "POST"
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    {route.method}
                  </span>
                  <span className="font-mono text-slate-200">{route.path}</span>
                </div>
                <span className="text-slate-400">{route.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "data" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Database Schema Models (Prisma)</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contracts.data.map((m) => (
              <div key={m.model} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-xs text-indigo-300 border-b border-slate-800 pb-1.5">
                  model {m.model}
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-400">
                  {m.fields.map((f, idx) => (
                    <div key={idx}>  {f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "files" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Dynamic Canonical File Graph</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-xs text-slate-300">
            {contracts.files.map((f) => (
              <div key={f} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                📄 {f}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
