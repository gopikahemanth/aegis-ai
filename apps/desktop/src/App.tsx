import React, { useState, useEffect } from "react";
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
  BookOpen
} from "lucide-react";

// Mock codebase files content
const FILES_CONTENT: Record<string, string> = {
  "src/App.tsx": `import React, { useState } from 'react';\nimport { Navbar } from './components/Navbar';\nimport { PomodoroTimer } from './components/PomodoroTimer';\nimport { TaskManager } from './components/TaskManager';\n\nexport const App: React.FC = () => {\n  const [activeTab, setActiveTab] = useState('dashboard');\n  \n  return (\n    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">\n      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />\n      <main className="max-w-7xl mx-auto px-4 py-8">\n        {activeTab === 'pomodoro' && <PomodoroTimer />}\n        {activeTab === 'dashboard' && <TaskManager />}\n      </main>\n    </div>\n  );\n};\n\nexport default App;`,
  "src/main.tsx": `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
  "src/components/PomodoroTimer.tsx": `import React, { useState, useEffect } from 'react';\nimport { Play, Pause, RotateCcw } from 'lucide-react';\n\nexport const PomodoroTimer = () => {\n  const [timeLeft, setTimeLeft] = useState(1500);\n  const [isRunning, setIsRunning] = useState(false);\n\n  useEffect(() => {\n    if (!isRunning) return;\n    const interval = setInterval(() => {\n      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);\n    }, 1000);\n    return () => clearInterval(interval);\n  }, [isRunning]);\n\n  return (\n    <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-md mx-auto">\n      <h2 className="text-xl font-semibold text-slate-400">Focus Mode</h2>\n      <div className="text-6xl font-mono font-bold text-white">\n        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}\n      </div>\n      <div className="flex justify-center gap-4">\n        <button onClick={() => setIsRunning(!isRunning)} className="btn-primary px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold">\n          {isRunning ? 'Pause' : 'Start'}\n        </button>\n      </div>\n    </div>\n  );\n};`,
  "package.json": `{\n  "name": "study-pomodoro-timer",\n  "private": true,\n  "version": "0.0.1",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  },\n  "dependencies": {\n    "react": "^19.1.0",\n    "react-dom": "^19.1.0",\n    "lucide-react": "^0.400.0"\n  }\n}`
};

interface Message {
  id: string;
  sender: "user" | "aegis";
  text: string;
  timestamp: string;
  stages?: string[];
}

export function App() {
  const [activeTab, setActiveTab] = useState<"editor" | "git" | "analytics">("editor");
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputVal, setInputVal] = useState("");
  const [agentStatus, setAgentStatus] = useState<"Idle" | "Planning" | "Coding" | "Healer" | "Complete">("Complete");
  
  // Execution Tasks (DAG Planning tiers)
  const [tasks, setTasks] = useState([
    { id: 1, title: "Project Setup & Boilerplate", stage: "Implementation", status: "success", tier: 1 },
    { id: 2, title: "Pomodoro Timer Engine State Hooks", stage: "Implementation", status: "success", tier: 2 },
    { id: 3, title: "Logger History & Habits Checklist components", stage: "Implementation", status: "success", tier: 3 },
    { id: 4, title: "Analytics Graphs and LocalStorage Persistence Hook", stage: "Implementation", status: "success", tier: 4 },
    { id: 5, title: "Validation Build and CSS Styling Checks", stage: "Validation", status: "success", tier: 5 },
  ]);

  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: "Build a beautiful dark-themed study tracker and Pomodoro dashboard using React.",
      timestamp: "10:31 AM"
    },
    {
      id: "2",
      sender: "aegis",
      text: "Analyzing request...\n• Core framework matching: react-vite\n• Styling system: Tailwind CSS\n• Created 5 implementation tasks inside planning dependency tree (DAG). Starting code generation...",
      timestamp: "10:32 AM"
    },
    {
      id: "3",
      sender: "aegis",
      text: "Code generation completed. Starting validation verification tests...\n❌ Build failed: src/main.tsx(4,8): error TS2613: Module has no default export.\n[Self-Healing] Running compiler auto-repair...\n✓ Applied TS default export resolution patch.\n✅ Validation build succeeded!\n[LearningLoop] Analyzed error and successfully indexed new heuristic rule: 'Always ensure all React Router and context exports default cleanly to main compiler wrapper.'",
      timestamp: "10:34 AM"
    }
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
        }, 1500);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-6 z-20">
        <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4 animate-pulse">
          <Cpu className="w-6 h-6" />
        </div>

        <button
          onClick={() => setActiveTab("editor")}
          className={`p-3 rounded-xl transition-all ${
            activeTab === "editor"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
          title="Code Editor"
        >
          <Code className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab("git")}
          className={`p-3 rounded-xl transition-all ${
            activeTab === "git"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
          title="Git History"
        >
          <GitBranch className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`p-3 rounded-xl transition-all ${
            activeTab === "analytics"
              ? "bg-slate-800 text-white border border-slate-700"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
          title="Engineering Metrics"
        >
          <BarChart3 className="w-5 h-5" />
        </button>

        <div className="mt-auto flex flex-col gap-4">
          <div className="p-3 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer">
            <SettingsIcon className="w-5 h-5" />
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wider bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              AEGIS STUDIO
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400 font-mono">/workspace/study-tracker</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Server status badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-mono">http://localhost:5173</span>
            </div>

            {/* Agent execution Status */}
            <div className="flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-semibold">
              <Cpu className="w-3.5 h-3.5 animate-spin" />
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
                {/* File Explorer (Milestone 2) */}
                <div className="w-52 bg-slate-950/60 border-r border-slate-800 flex flex-col py-4">
                  <div className="px-4 mb-3 flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><FolderTree className="w-3.5 h-3.5" /> FILES</span>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    <div className="text-xs text-slate-300 p-2 font-semibold flex items-center gap-1">
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>study-tracker</span>
                    </div>

                    <div className="pl-3 space-y-0.5">
                      <div className="text-xs text-slate-400 p-2 font-semibold flex items-center gap-1">
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>src</span>
                      </div>

                      <div className="pl-4 space-y-0.5">
                        <button
                          onClick={() => setSelectedFile("src/App.tsx")}
                          className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            selectedFile === "src/App.tsx"
                              ? "bg-slate-800 text-white border border-slate-700"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                          }`}
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate">App.tsx</span>
                        </button>

                        <button
                          onClick={() => setSelectedFile("src/main.tsx")}
                          className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            selectedFile === "src/main.tsx"
                              ? "bg-slate-800 text-white border border-slate-700"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                          }`}
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate">main.tsx</span>
                        </button>

                        <button
                          onClick={() => setSelectedFile("src/components/PomodoroTimer.tsx")}
                          className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                            selectedFile === "src/components/PomodoroTimer.tsx"
                              ? "bg-slate-800 text-white border border-slate-700"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                          }`}
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="truncate">PomodoroTimer.tsx</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setSelectedFile("package.json")}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                          selectedFile === "package.json"
                            ? "bg-slate-800 text-white border border-slate-700"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 text-amber-400" />
                        <span className="truncate">package.json</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Code Editor (Milestone 8) */}
                <div className="flex-1 flex flex-col bg-slate-900/40 min-w-0">
                  <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4">
                    <span className="text-xs font-mono text-slate-300">{selectedFile}</span>
                  </div>

                  <div className="flex-1 p-6 font-mono text-xs overflow-auto select-text leading-relaxed whitespace-pre bg-slate-950/80">
                    {FILES_CONTENT[selectedFile]}
                  </div>
                </div>
              </>
            )}

            {/* Git View (Phase 7 - Git integration) */}
            {activeTab === "git" && (
              <div className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-y-auto">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-indigo-400" /> Version Control History
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm">feat: implement pluggable framework Plugin System (Milestone 17)</span>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">2f29cd3</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Commit by Aegis AI • 2 mins ago</span>
                      <span className="text-slate-500">Branch: main</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm">feat: enforce single-router constraints in coder prompt rules</span>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">6628529</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Commit by Aegis AI • 1 hour ago</span>
                      <span className="text-slate-500">Branch: main</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-sm">chore: initialize workspace and core CLI scaffolding</span>
                      <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">06107c1</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Commit by Developer • 1 day ago</span>
                      <span className="text-slate-500">Branch: main</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics View (Milestone 15) */}
            {activeTab === "analytics" && (
              <div className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-y-auto">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" /> Platform Engineering Metrics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Build Success Rate</span>
                    <div className="text-3xl font-mono font-bold text-emerald-400">94.2%</div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Avg Healing Repair Cycles</span>
                    <div className="text-3xl font-mono font-bold text-indigo-400">1.2 cycles</div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Total Token Cost</span>
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
                      <p className="text-slate-300">"Always ensure all state setters used in interval callbacks or asynchronous effects reference the functional updater form or include all necessary dependencies to prevent stale closures."</p>
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
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Panel: Parallel Execution DAG Tiers (Milestone 4 / 11) */}
        <footer className="h-44 bg-slate-950 border-t border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-2">
            <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> PARALLEL PLANNING DAG EXECUTION GRAPH</span>
            <span className="text-[10px] text-slate-500">Tiers 1 - 5 in concurrent groups</span>
          </div>

          <div className="flex-1 grid grid-cols-5 gap-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">TIER {task.tier}</span>
                    <span className="flex items-center text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-tight">{task.title}</h4>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
                  <span>{task.stage}</span>
                  <span>ID: #{task.id}</span>
                </div>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
