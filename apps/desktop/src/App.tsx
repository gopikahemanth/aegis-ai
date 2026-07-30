import React, { useState, useEffect, useRef } from "react";
import {
  Code,
  Terminal,
  FolderTree,
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Cpu,
  BarChart3,
  Settings as SettingsIcon,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Command,
  X,
  Sliders,
  Moon,
  Sun,
  Info,
  Layout,
  PlusCircle,
  Check,
  PlayCircle,
  Eye,
  Globe,
  Trash2,
  Edit2,
  FileText,
  FileCode,
  Plus,
  ArrowRight,
  Monitor,
  Folder,
  Database
} from "lucide-react";

// Mock codebase files content for different templates
const PROJECTS_DATA: Record<string, { files: Record<string, string>; activeFile: string }> = {
  "study-tracker": {
    activeFile: "src/App.tsx",
    files: {
      "src/App.tsx": `import React, { useState } from 'react';\nimport { Navbar } from './components/Navbar';\nimport { PomodoroTimer } from './components/PomodoroTimer';\nimport { TaskManager } from './components/TaskManager';\n\nexport const App: React.FC = () => {\n  const [activeTab, setActiveTab] = useState('dashboard');\n  \n  return (\n    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">\n      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />\n      <main className="max-w-7xl mx-auto px-4 py-8">\n        {activeTab === 'pomodoro' && <PomodoroTimer />}\n        {activeTab === 'dashboard' && <TaskManager />}\n      </main>\n    </div>\n  );\n};\n\nexport default App;`,
      "src/main.tsx": `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
      "src/components/PomodoroTimer.tsx": `import React, { useState, useEffect } from 'react';\nimport { Play, Pause, RotateCcw } from 'lucide-react';\n\nexport const PomodoroTimer = () => {\n  const [timeLeft, setTimeLeft] = useState(1500);\n  const [isRunning, setIsRunning] = useState(false);\n\n  useEffect(() => {\n    if (!isRunning) return;\n    const interval = setInterval(() => {\n      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);\n    }, 1000);\n    return () => clearInterval(interval);\n  }, [isRunning]);\n\n  return (\n    <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-md mx-auto">\n      <h2 className="text-xl font-semibold text-slate-400">Focus Mode</h2>\n      <div className="text-6xl font-mono font-bold text-white">\n        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}\n      </div>\n    </div>\n  );\n};`,
      "package.json": `{\n  "name": "study-pomodoro-timer",\n  "private": true,\n  "version": "0.0.1",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  },\n  "dependencies": {\n    "react": "^19.1.0",\n    "react-dom": "^19.1.0",\n    "lucide-react": "^0.400.0"\n  }\n}`
    }
  },
  "nextjs-saas": {
    activeFile: "app/page.tsx",
    files: {
      "app/page.tsx": `import { Hero } from "@/components/Hero";\nimport { Features } from "@/components/Features";\nimport { Pricing } from "@/components/Pricing";\n\nexport default function Home() {\n  return (\n    <main className="min-h-screen bg-black text-white selection:bg-indigo-500/30">\n      <Hero />\n      <Features />\n      <Pricing />\n    </main>\n  );\n}`,
      "app/layout.tsx": `import "@/styles/globals.css";\nimport { Inter } from "next/font/google";\n\nconst inter = Inter({ subsets: ["latin"] });\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en" className={inter.className}>\n      <body>{children}</body>\n    </html>\n  );\n}`,
      "components/Pricing.tsx": `export const Pricing = () => {\n  return (\n    <section className="py-20 border-t border-zinc-800 bg-zinc-950/20">\n      <div className="max-w-5xl mx-auto text-center space-y-4">\n        <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>\n        <p className="text-zinc-400">Unlock complete engineering autonomy today.</p>\n      </div>\n    </section>\n  );\n};`,
      "package.json": `{\n  "name": "nextjs-saas-dashboard",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "next": "^15.1.0",\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0"\n  }\n}`
    }
  },
  "fastapi-server": {
    activeFile: "main.py",
    files: {
      "main.py": `from fastapi import FastAPI, Depends, HTTPException\nfrom pydantic import BaseModel\nfrom typing import List\n\napp = FastAPI(title="Aegis Task Backend", version="1.0.0")\n\nclass Task(BaseModel):\n    id: int\n    title: str\n    completed: bool\n\n@app.get("/api/tasks", response_model=List[Task])\ndef get_tasks():\n    return [\n        {"id": 1, "title": "Setup distributed queues", "completed": True},\n        {"id": 2, "title": "Compile graph models", "completed": False}\n    ]`,
      "requirements.txt": "fastapi==0.111.0\nuvicorn==0.30.1\npydantic==2.7.4"
    }
  }
};

interface Message {
  id: string;
  sender: "user" | "aegis";
  text: string;
  timestamp: string;
}

interface GitChange {
  path: string;
  status: "staged" | "modified" | "deleted" | "added";
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  enabled: boolean;
  installed: boolean;
}

export function App() {
  // Navigation View: "welcome" | "loading" | "ide"
  const [currentView, setCurrentView] = useState<"welcome" | "loading" | "ide">("welcome");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("study-tracker");
  const [loadingStep, setLoadingStep] = useState(0);

  const [activeTab, setActiveTab] = useState<"editor" | "git" | "analytics" | "plugins" | "settings">("editor");
  const [files, setFiles] = useState<Record<string, string>>(PROJECTS_DATA["study-tracker"].files);
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx");
  const [openFiles, setOpenFiles] = useState<string[]>(["src/App.tsx", "src/components/PomodoroTimer.tsx"]);
  const [inputVal, setInputVal] = useState("");
  const [agentStatus, setAgentStatus] = useState<"Idle" | "Planning" | "Coding" | "Healer" | "Complete">("Complete");

  // Custom states
  const [showBrowserPreview, setShowBrowserPreview] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"dark" | "light" | "high-contrast">("dark");
  const [aiProvider, setAiProvider] = useState("Gemini Pro 1.5");
  const [commitMessage, setCommitMessage] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Aegis Shell v2.0.0-alpha Initialized.",
    "Ready for compilation checks."
  ]);
  const [gitChanges, setGitChanges] = useState<GitChange[]>([
    { path: "src/App.tsx", status: "modified" },
    { path: "src/components/PomodoroTimer.tsx", status: "added" },
    { path: "package.json", status: "modified" }
  ]);

  const [plugins, setPlugins] = useState<Plugin[]>([
    { id: "1", name: "CSS Auto-Formatter", description: "Performs layout alignment and micro-spacing corrections", author: "Aegis Team", enabled: true, installed: true },
    { id: "2", name: "Postgres Database Helper", description: "Generates prisma schemas and index triggers automatically", author: "DB Specialist", enabled: false, installed: true },
    { id: "3", name: "ESLint Strict Mode Rules", description: "Injects strict null checks and type rules before audits", author: "Security Lead", enabled: false, installed: false }
  ]);

  // Dynamic documentation selection
  const [selectedDocPillar, setSelectedDocPillar] = useState<number>(0);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const docPillars = [
    {
      title: "1. Distributed Runtime Queue",
      description: "Allocates agent operations to isolated background queue processes. Features automatic task retries with exponential backoffs and broker message-passing channels to prevent main-loop blocking and ensure high availability."
    },
    {
      title: "2. Memory Knowledge Graph",
      description: "Structures decisions, feature dependencies, components, and commits into a semantic relational graph index database. Enables queries like 'Why PostgreSQL?' or 'What depends on auth?' dynamically."
    },
    {
      title: "3. PR & Regression Auditor",
      description: "Triggers dynamic Git patch review loops post-build. Checks modified code blocks for OWASP validation exceptions, logical flaws, layout shifts, or stale state closures before outputting commit PR summaries."
    },
    {
      title: "4. Compliance Audit Logging",
      description: "Enterprise compliance reporting database that records timeline events (Architect enlisting, Planning DAG, self-healing cycles) with immutable security sign-off signatures inside audit-trail log structures."
    },
    {
      title: "5. Specialist Extensions",
      description: "Third-party marketplace plugin system loading modules dynamically from '.aegis/plugins/'. Allows injecting custom formatting hooks, build compilers, healers, and agent specialists."
    }
  ];

  const loadingSequence = [
    "CEO Agent: Initializing requirements specifications...",
    "Architect: Selecting React/Tailwind framework guidelines...",
    "Coordinator: Enlisting dynamic specialists (Frontend Lead, DevOps, Security Lead)...",
    "Planner: Building execution DAG hierarchy (5 Parallel Tiers scheduled)...",
    "Coder: Writing code files onto workspace context folder...",
    "BuildOrchestrator: Compiling package assets...",
    "Self-Healing: Build succeeded! Healed 1 type warning.",
    "PR Auditor: Committing patch and auditing regression risks..."
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLines]);

  const startLoadingSequence = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setCurrentView("loading");
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= loadingSequence.length - 1) {
          clearInterval(interval);
          // Set workspace files corresponding to selected template
          const proj = PROJECTS_DATA[templateKey];
          setFiles(proj.files);
          setSelectedFile(proj.activeFile);
          setOpenFiles(Object.keys(proj.files));
          setCurrentView("ide");
          return prev;
        }
        return prev + 1;
      });
    }, 450);
  };

  const triggerTerminalStream = (cmd: string) => {
    setTerminalLines(prev => [...prev, `\n$ ${cmd}`]);
    setTimeout(() => {
      setTerminalLines(prev => [...prev, "  • Resolving workspace file hooks..."]);
      setTimeout(() => {
        setTerminalLines(prev => [...prev, "  ✓ Verification completed successfully. Status: COMPLIANT."]);
      }, 800);
    }, 400);
  };

  const [chatHistory, setChatHistory] = useState<Message[]>([
    { id: "1", sender: "user", text: "Build a beautiful dark-themed study tracker and Pomodoro dashboard using React.", timestamp: "10:31 AM" },
    { id: "2", sender: "aegis", text: "Analyzing request...\n• Core framework matching: react-vite\n• Styling system: Tailwind CSS\n• Created 5 implementation tasks inside planning dependency tree (DAG). Starting code generation...", timestamp: "10:32 AM" },
    { id: "3", sender: "aegis", text: "Code generation completed. Starting validation verification tests...\n❌ Build failed: src/main.tsx(4,8): error TS2613: Module has no default export.\n[Self-Healing] Running compiler auto-repair...\n✓ Applied TS default export resolution patch.\n✅ Validation build succeeded!", timestamp: "10:34 AM" }
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInputVal("");
    setAgentStatus("Planning");
    triggerTerminalStream("aegis run plan-dag");

    setTimeout(() => {
      setAgentStatus("Coding");
      setTimeout(() => {
        setAgentStatus("Healer");
        setTimeout(() => {
          setAgentStatus("Complete");
          const aegisResponse: Message = {
            id: (Date.now() + 1).toString(),
            sender: "aegis",
            text: "✓ Target feature generation successfully finished!\n✓ Dynamic code checker resolved all warnings.\n✓ Headless browser screenshots captured with zero layout shifts detected.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatHistory(prev => [...prev, aegisResponse]);
          triggerTerminalStream("npm run build");
        }, 1500);
      }, 1500);
    }, 1000);
  };

  const handleCreateFile = () => {
    const filename = prompt("Enter file name (e.g., src/utils/helper.ts):");
    if (filename) {
      setFiles(prev => ({ ...prev, [filename]: `// File: ${filename}\nexport const helper = () => {};` }));
      setSelectedFile(filename);
      if (!openFiles.includes(filename)) {
        setOpenFiles(prev => [...prev, filename]);
      }
    }
  };

  const handleDeleteFile = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      const updatedFiles = { ...files };
      delete updatedFiles[filename];
      setFiles(updatedFiles);
      setOpenFiles(prev => prev.filter(f => f !== filename));
      if (selectedFile === filename) {
        setSelectedFile(Object.keys(updatedFiles)[0] || "");
      }
    }
  };

  const handleCloseTab = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter(f => f !== filename));
    if (selectedFile === filename) {
      const remaining = openFiles.filter(f => f !== filename);
      if (remaining.length > 0) {
        setSelectedFile(remaining[0]);
      }
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${
      theme === "light" ? "bg-slate-50 text-slate-800" : "bg-slate-950 text-slate-100 font-sans"
    }`}>
      {/* 1. Welcome Onboarding & Documentation Screen */}
      {currentView === "welcome" && (
        <div className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 mb-12">
            <span className="text-md font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              AEGIS SOFTWARE OS
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> v2.0.0-alpha</span>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto w-full">
            {/* Left Onboarding and Project Launcher */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  The Autonomous <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Software Engineering
                  </span> <br />
                  Operating System.
                </h1>
                <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
                  Design specifications, enlist specialist agent crews, compile, heal code, and deploy application workloads securely inside isolated sandboxes.
                </p>
              </div>

              {/* Launcher Actions */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono">Launch a Workspace</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => startLoadingSequence("study-tracker")}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 text-left transition-all group space-y-2"
                  >
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg w-fit">
                      <Code className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-200 text-sm">Study Tracker App</div>
                    <p className="text-xs text-slate-400">React + Vite Pomodoro workspace demo.</p>
                  </button>

                  <button
                    onClick={() => startLoadingSequence("nextjs-saas")}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 text-left transition-all group space-y-2"
                  >
                    <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg w-fit">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-200 text-sm">Next.js SaaS Landing Page</div>
                    <p className="text-xs text-slate-400">Full-stack layout specs mapping.</p>
                  </button>

                  <button
                    onClick={() => startLoadingSequence("fastapi-server")}
                    className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 text-left transition-all group space-y-2"
                  >
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg w-fit">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-slate-200 text-sm">FastAPI Endpoint API</div>
                    <p className="text-xs text-slate-400">JSON schema database handlers.</p>
                  </button>

                  <button
                    onClick={() => startLoadingSequence("study-tracker")}
                    className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/10 hover:bg-indigo-950/20 text-left transition-all group space-y-2"
                  >
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg w-fit">
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                      Recent: study-tracker <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-xs text-indigo-300/85">Reload mock study timer IDE workspace.</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Architectural Pillars & Verification Log */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/30 backdrop-blur-xl space-y-6">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-indigo-400" /> Aegis 2.0 Operating System Pillars
                </h3>

                {/* Left side selector tabs */}
                <div className="grid grid-cols-5 gap-2">
                  {docPillars.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDocPillar(idx)}
                      className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all ${
                        selectedDocPillar === idx
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                          : "border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Pillar {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 min-h-36">
                  <h4 className="text-xs font-bold text-indigo-400 font-mono">{docPillars[selectedDocPillar].title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{docPillars[selectedDocPillar].description}</p>
                </div>

                {/* Verification Matric checklist */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 font-mono">Engine Verification Matrix Checkpoints</h4>
                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-slate-300">Planning DAG concurrent loops</span>
                      <span className="text-emerald-400 font-bold">✓ Verified Green</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-slate-300">Security SAST scans & Traversal Blocks</span>
                      <span className="text-emerald-400 font-bold">✓ Verified Green</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                      <span className="text-slate-300">Headless Browser Review validations</span>
                      <span className="text-emerald-400 font-bold">✓ Verified Green</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Generation Loading Timeline Simulation */}
      {currentView === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 space-y-8">
          <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-full animate-bounce text-indigo-400">
            <Cpu className="w-10 h-10 animate-spin" />
          </div>
          
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold text-white">Aegis autonomous compilation in progress...</h2>
            <p className="text-xs text-slate-400 font-mono">Generating template: {selectedTemplate}</p>
          </div>

          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-indigo-300 space-y-2 select-none shadow-2xl">
            {loadingSequence.map((step, idx) => {
              const isActive = loadingStep === idx;
              const isPast = loadingStep > idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 transition-opacity ${
                    isActive ? "opacity-100 text-white font-bold" : isPast ? "opacity-45 text-slate-400" : "opacity-10"
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : isActive ? <Clock className="w-4 h-4 text-indigo-400 animate-pulse" /> : "○"}
                  </span>
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. The Interactive IDE Workspace Screen */}
      {currentView === "ide" && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header Bar */}
          <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wider bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                AEGIS STUDIO
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-xs text-slate-400 font-mono">/workspace/{selectedTemplate}</span>
              <button
                onClick={() => setCurrentView("welcome")}
                className="ml-4 px-2 py-0.5 bg-slate-850 hover:bg-slate-800 text-[10px] rounded text-slate-300 border border-slate-700"
              >
                Close Project
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs text-slate-400"
              >
                <Command className="w-3.5 h-3.5" />
                <span>Search everywhere (Ctrl+K)</span>
              </button>

              {/* Server status badge */}
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-300 font-mono">http://localhost:5173</span>
              </div>

              {/* Agent execution Status */}
              <div className="flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold font-mono">
                <Cpu className={`w-3.5 h-3.5 ${agentStatus !== "Complete" && "animate-spin"}`} />
                <span>Aegis: {agentStatus}</span>
              </div>
            </div>
          </header>

          {/* Workspace Body */}
          <div className="flex-1 flex min-h-0">
            {/* File explorer & code viewer pane */}
            <div className="flex-1 flex min-w-0">
              {activeTab === "editor" && (
                <>
                  {/* File Explorer */}
                  <div className="w-60 bg-slate-950/60 border-r border-slate-800 flex flex-col py-4">
                    <div className="px-4 mb-3 flex items-center justify-between text-slate-500 text-xs font-semibold">
                      <span className="flex items-center gap-1.5"><FolderTree className="w-3.5 h-3.5" /> FILES</span>
                      <button
                        onClick={handleCreateFile}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                        title="New File"
                      >
                        <Plus className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-1">
                      <div className="text-xs text-slate-300 p-2 font-semibold flex items-center gap-1">
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>{selectedTemplate}</span>
                      </div>

                      <div className="pl-3 space-y-0.5">
                        {Object.keys(files).map(file => (
                          <button
                            key={file}
                            onClick={() => {
                              setSelectedFile(file);
                              if (!openFiles.includes(file)) setOpenFiles(prev => [...prev, file]);
                            }}
                            className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all group ${
                              selectedFile === file
                                ? "bg-slate-800 text-white border border-slate-700"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Code className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate">{file}</span>
                            </span>
                            <Trash2
                              onClick={(e) => handleDeleteFile(file, e)}
                              className="w-3.5 h-3.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Editor Tabs & Code Viewer */}
                  <div className="flex-1 flex flex-col bg-slate-900/40 min-w-0">
                    {/* Editor Tabs */}
                    <div className="h-11 bg-slate-950 border-b border-slate-800 flex items-center px-4 overflow-x-auto gap-2">
                      {openFiles.map(file => (
                        <div
                          key={file}
                          onClick={() => setSelectedFile(file)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs cursor-pointer transition-all border-t-2 ${
                            selectedFile === file
                              ? "bg-slate-900 text-white border-indigo-500"
                              : "bg-slate-950 text-slate-400 border-transparent hover:bg-slate-900/50"
                          }`}
                        >
                          <Code className="w-3 h-3 text-indigo-400" />
                          <span>{file.split("/").pop()}</span>
                          <X
                            onClick={(e) => handleCloseTab(file, e)}
                            className="w-3 h-3 text-slate-500 hover:text-slate-300"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => setShowBrowserPreview(prev => !prev)}
                        className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-[10px] rounded border border-slate-700 text-slate-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showBrowserPreview ? "Hide Preview" : "Show Preview"}</span>
                      </button>
                    </div>

                    <div className="flex-1 flex min-h-0">
                      <div className="flex-1 p-6 font-mono text-xs overflow-auto select-text leading-relaxed whitespace-pre bg-slate-950/85">
                        {files[selectedFile] || "// Select or create a file to get started"}
                      </div>

                      {/* Embedded Browser Preview */}
                      {showBrowserPreview && (
                        <div className="w-[450px] border-l border-slate-800 bg-slate-950 flex flex-col">
                          <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <div className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-300 font-mono truncate">
                              http://localhost:5173/preview
                            </div>
                          </div>

                          {/* Interactive Simulated Preview */}
                          <div className="flex-1 p-6 flex flex-col justify-center items-center bg-slate-900/30">
                            <div className="w-full max-w-sm p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-xl">
                              <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">Focus Timer</span>
                              <div className="text-5xl font-mono font-bold text-white tracking-widest">
                                25:00
                              </div>
                              <div className="flex justify-center gap-2">
                                <button onClick={() => triggerTerminalStream("npm run dev")} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg text-white">
                                  Start
                                </button>
                                <button className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300">
                                  Reset
                                </button>
                              </div>
                            </div>
                            
                            {/* DevTools Console simulation */}
                            <div className="w-full mt-6 bg-slate-950 border border-slate-800 rounded-lg p-3 text-[10px] font-mono text-emerald-400 space-y-1">
                              <div className="text-slate-500">[Console Console.log]</div>
                              <div>[HMR] update app.tsx hot-reload active...</div>
                              <div>Pomodoro timer initialized with default 1500 seconds.</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Git Panel */}
              {activeTab === "git" && (
                <div className="flex-1 flex bg-slate-950">
                  {/* Left Git panel files list */}
                  <div className="w-72 border-r border-slate-800 p-4 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Source Control</h3>
                    <div className="space-y-1">
                      {gitChanges.map(change => (
                        <div key={change.path} className="flex items-center justify-between p-2 hover:bg-slate-900 rounded-lg text-xs">
                          <span className="flex items-center gap-2 text-slate-300 truncate">
                            <Code className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{change.path}</span>
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded capitalize ${
                            change.status === "modified" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>{change.status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <input
                        type="text"
                        placeholder="Commit message..."
                        value={commitMessage}
                        onChange={e => setCommitMessage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (!commitMessage) return;
                          setGitChanges([]);
                          setCommitMessage("");
                          triggerTerminalStream(`git commit -m "${commitMessage}"`);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold py-2 rounded-lg text-white"
                      >
                        Commit & Push
                      </button>
                    </div>
                  </div>

                  {/* Simulated Git Diff viewer */}
                  <div className="flex-1 p-6 flex flex-col min-w-0">
                    <h4 className="text-xs font-bold text-slate-400 mb-4 font-mono">ACTIVE GIT DIFF</h4>
                    <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl p-4 font-mono text-xs overflow-auto">
                      <div className="text-slate-500">diff --git a/src/App.tsx b/src/App.tsx</div>
                      <div className="text-indigo-400">@@ -11,4 +11,6 @@</div>
                      <div className="text-red-400 bg-red-950/20">-       {"{activeTab === 'pomodoro' && <PomodoroTimer />}"}</div>
                      <div className="text-emerald-400 bg-emerald-950/20">+       {"{activeTab === 'pomodoro' && <PomodoroTimer timeLeft={1500} />}"}</div>
                      <div className="text-emerald-400 bg-emerald-950/20">+       {"<div className=\"console-logger\" />"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics View */}
              {activeTab === "analytics" && (
                <div className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-y-auto">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" /> Platform Engineering Metrics
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">Build Success Rate</span>
                      <div className="text-3xl font-mono font-bold text-emerald-400">94.2%</div>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">Avg Healing Repair Cycles</span>
                      <div className="text-3xl font-mono font-bold text-indigo-400">1.2 cycles</div>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                      <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase font-mono">Total Token Cost</span>
                      <div className="text-3xl font-mono font-bold text-white">$0.13 USD</div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-4">
                    <h3 className="text-sm font-bold text-slate-300">Continuous Learning Heuristics Log</h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                        <span className="text-indigo-400 font-bold">[RULE #1 INDEXED]</span>
                        <p className="text-slate-300">"When importing icons from lucide-react, import them directly like {`{ Settings }`} rather than importing full libraries."</p>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-1">
                        <span className="text-indigo-400 font-bold">[RULE #2 INDEXED]</span>
                        <p className="text-slate-300">"Ensure state variables referenced in intervals or effects represent updater functions."</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plugin Store */}
              {activeTab === "plugins" && (
                <div className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-y-auto">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-indigo-400" /> Specialist Extensions Marketplace
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plugins.map(plugin => (
                      <div key={plugin.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between h-48">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-200">{plugin.name}</h3>
                            <span className="text-[10px] text-slate-500 font-mono">By {plugin.author}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{plugin.description}</p>
                        </div>

                        <div className="flex justify-end gap-2">
                          {plugin.installed ? (
                            <button
                              onClick={() => {
                                setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, enabled: !p.enabled } : p));
                              }}
                              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all ${
                                plugin.enabled ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {plugin.enabled ? "Enabled" : "Disabled"}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, installed: true, enabled: true } : p));
                              }}
                              className="px-3 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold rounded-lg text-white"
                            >
                              Install Extension
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings Pane */}
              {activeTab === "settings" && (
                <div className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-y-auto">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-indigo-400" /> Workspace Configurations
                  </h2>

                  <div className="max-w-xl space-y-6">
                    {/* AI Provider option */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-900/50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-200 font-sans">AI Model Provider</div>
                        <div className="text-xs text-slate-500">Choose backend LLM model mapping settings.</div>
                      </div>
                      <select
                        value={aiProvider}
                        onChange={e => setAiProvider(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                      >
                        <option>Gemini Pro 1.5</option>
                        <option>Gemini 2.5 Flash</option>
                        <option>Claude 3.5 Sonnet</option>
                        <option>GPT-4o</option>
                      </select>
                    </div>

                    {/* Themes option */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-900/50">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-200 font-sans">Aesthetics Theme</div>
                        <div className="text-xs text-slate-500">Pick light, dark, or high contrast mode.</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTheme("dark")}
                          className={`p-2 rounded-lg border text-xs ${
                            theme === "dark" ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-800 text-slate-400"
                          }`}
                        >
                          <Moon className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => setTheme("light")}
                          className={`p-2 rounded-lg border text-xs ${
                            theme === "light" ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-800 text-slate-400"
                          }`}
                        >
                          <Sun className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sandboxing info */}
                    <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex gap-3">
                      <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">Sandboxed Shell Verification</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Security sandboxing is active. Path traversals outside the workspace context folder are blocked by default.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Chat Assistant Panel */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" /> AI DEVELOPER CHAT
                </span>
              </div>

              {/* Chat message threads */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === "user" ? "ml-auto" : "mr-auto"}`}>
                    <span className="text-[10px] text-slate-500 font-semibold">{msg.sender === "user" ? "You" : "Aegis AI"} • {msg.timestamp}</span>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === "user" 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-slate-800 text-slate-300 rounded-tl-none border border-slate-700/60"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input form */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask Aegis to add or modify..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-805 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Panel: Terminal and Parallel execution DAG */}
          <footer className="h-56 bg-slate-950 border-t border-slate-800 flex min-w-0">
            {/* Real logs Terminal */}
            <div className="flex-1 border-r border-slate-800 flex flex-col p-4 min-w-0">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 px-1">
                <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> AEGIS LOG STREAM TERMINAL</span>
                <button
                  onClick={() => triggerTerminalStream("pnpm test")}
                  className="px-2 py-0.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[10px] rounded text-slate-300 font-mono"
                >
                  Run Verification Test
                </button>
              </div>
              <div className="flex-1 bg-slate-900/60 border border-slate-850 rounded-xl p-3 font-mono text-[10px] text-indigo-400 overflow-y-auto space-y-1 select-text">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{line}</div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Planning DAG graph */}
            <div className="w-[450px] flex flex-col p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2 px-1">
                <span className="flex items-center gap-1.5"><Sliders className="w-4 h-4" /> PLANNING DAG PROCESS TIERS</span>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="text-[9px] font-mono text-indigo-400 font-bold">TIER 1 (Setup)</div>
                  <h4 className="text-[10px] font-semibold text-slate-200 truncate">Workspace setup & folders</h4>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="text-[9px] font-mono text-indigo-400 font-bold">TIER 2 (Core logic)</div>
                  <h4 className="text-[10px] font-semibold text-slate-200 truncate">Timer state hooks</h4>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="text-[9px] font-mono text-indigo-400 font-bold">TIER 3 (Components)</div>
                  <h4 className="text-[10px] font-semibold text-slate-200 truncate">Pomodoro UI buttons</h4>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  <div className="text-[9px] font-mono text-indigo-400 font-bold">TIER 4 (Validation)</div>
                  <h4 className="text-[10px] font-semibold text-slate-200 truncate">Final layout tests</h4>
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* Command Palette Modal (Ctrl+K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 font-mono">
                <Command className="w-4 h-4 text-indigo-400" /> Command Palette
              </span>
              <button onClick={() => setCommandPaletteOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-3 border-b border-slate-850 flex items-center gap-2 bg-slate-950/50">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search files, logs, settings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto p-2 space-y-1 font-mono text-xs">
              <div
                onClick={() => {
                  setActiveTab("editor");
                  setCommandPaletteOpen(false);
                }}
                className="p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-slate-300"
              >
                <span>&gt; Open Code Editor</span>
                <span className="text-[10px] text-slate-500">Go to editor tab</span>
              </div>
              <div
                onClick={() => {
                  setActiveTab("git");
                  setCommandPaletteOpen(false);
                }}
                className="p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-slate-300"
              >
                <span>&gt; Open Git version control</span>
                <span className="text-[10px] text-slate-500">Go to git control</span>
              </div>
              <div
                onClick={() => {
                  setActiveTab("settings");
                  setCommandPaletteOpen(false);
                }}
                className="p-2.5 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-slate-300"
              >
                <span>&gt; Edit settings & themes</span>
                <span className="text-[10px] text-slate-500">Go to settings panel</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
