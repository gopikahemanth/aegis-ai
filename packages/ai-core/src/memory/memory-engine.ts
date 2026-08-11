import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface TaskCheckpoint {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  stage: string;
  priority: number;
  dependencies: number[];
  estimatedComplexity: number;
}

export interface AegisMemory {
  projectName: string;
  lastRequest: string;
  createdFiles: string[];
  tasks: TaskCheckpoint[];
  history: Array<{
    timestamp: string;
    request: string;
    stage: string;
  }>;
}

export interface AegisArchitecture {
  framework: string;
  language: string;
  packageManager: string;
  folderStructure: Record<string, string[]>;
  namingConventions: string[];
  styling: string;
  additionalRules: string[];
}

export interface AegisPattern {
  name: string;
  description: string;
  files: string[];
  sampleCode: string;
}

export interface AegisPatterns {
  reusablePatterns: AegisPattern[];
}

export interface BuildLog {
  timestamp: string;
  success: boolean;
  durationMs: number;
  errors: string[];
}

export interface AegisMetrics {
  buildHistory: BuildLog[];
  telemetry: {
    totalTokensUsed: number;
    estimatedCostUsd: number;
    healingAttempts: number;
    sandboxRuns: number;
  };
}

export class ProjectMemoryEngine {
  private readonly aegisDir: string;
  private readonly memoryPath: string;
  private readonly architecturePath: string;
  private readonly patternsPath: string;
  private readonly metricsPath: string;

  constructor(private readonly projectPath: string) {
    this.aegisDir = join(projectPath, ".aegis");
    this.memoryPath = join(this.aegisDir, "memory.json");
    this.architecturePath = join(this.aegisDir, "architecture.json");
    this.patternsPath = join(this.aegisDir, "patterns.json");
    this.metricsPath = join(this.aegisDir, "metrics.json");
  }

  ensureAegisDir() {
    if (!existsSync(this.aegisDir)) {
      mkdirSync(this.aegisDir, { recursive: true });
    }
  }

  // --- Memory JSON ---
  loadMemory(): AegisMemory | null {
    if (!existsSync(this.memoryPath)) return null;
    try {
      return JSON.parse(readFileSync(this.memoryPath, "utf-8"));
    } catch {
      return null;
    }
  }

  saveMemory(memory: AegisMemory) {
    this.ensureAegisDir();
    writeFileSync(this.memoryPath, JSON.stringify(memory, null, 2), "utf-8");
  }

  // --- Architecture JSON ---
  loadArchitecture(): AegisArchitecture | null {
    if (!existsSync(this.architecturePath)) return null;
    try {
      return JSON.parse(readFileSync(this.architecturePath, "utf-8"));
    } catch {
      return null;
    }
  }

  saveArchitecture(architecture: AegisArchitecture) {
    this.ensureAegisDir();
    writeFileSync(this.architecturePath, JSON.stringify(architecture, null, 2), "utf-8");
  }

  // --- Patterns JSON ---
  loadPatterns(): AegisPatterns | null {
    if (!existsSync(this.patternsPath)) return null;
    try {
      return JSON.parse(readFileSync(this.patternsPath, "utf-8"));
    } catch {
      return null;
    }
  }

  savePatterns(patterns: AegisPatterns) {
    this.ensureAegisDir();
    writeFileSync(this.patternsPath, JSON.stringify(patterns, null, 2), "utf-8");
  }

  // --- Metrics JSON ---
  loadMetrics(): AegisMetrics | null {
    if (!existsSync(this.metricsPath)) return null;
    try {
      return JSON.parse(readFileSync(this.metricsPath, "utf-8"));
    } catch {
      return null;
    }
  }

  saveMetrics(metrics: AegisMetrics) {
    this.ensureAegisDir();
    writeFileSync(this.metricsPath, JSON.stringify(metrics, null, 2), "utf-8");
  }

  resetMemory(projectName: string, request: string) {
    this.ensureAegisDir();
    this.saveMemory({
      projectName,
      lastRequest: request,
      createdFiles: [],
      tasks: [],
      history: [{
        timestamp: new Date().toISOString(),
        request,
        stage: "Initialization",
      }],
    });
    this.saveArchitecture({
      framework: "react-vite",
      language: "TypeScript",
      packageManager: "npm",
      folderStructure: {
        "src/components": ["UI controls", "Layout panels"],
        "src/hooks": ["State hooks", "Lifecycle listeners"],
        "src/services": ["Storage, styling, utility service blocks"],
      },
      namingConventions: [
        "PascalCase for components and folders",
        "camelCase for utility files, hooks, types",
      ],
      styling: "vanilla-css",
      additionalRules: [],
    });
  }

  // --- Defaults Helper ---
  initDefaults(projectName: string, request: string) {
    this.ensureAegisDir();

    if (!existsSync(this.memoryPath)) {
      this.saveMemory({
        projectName,
        lastRequest: request,
        createdFiles: [],
        tasks: [],
        history: [{
          timestamp: new Date().toISOString(),
          request,
          stage: "Initialization",
        }],
      });
    }

    if (!existsSync(this.architecturePath)) {
      this.saveArchitecture({
        framework: "react-vite",
        language: "TypeScript",
        packageManager: "npm",
        folderStructure: {
          "src/components": ["UI controls", "Layout panels"],
          "src/hooks": ["State hooks", "Lifecycle listeners"],
          "src/services": ["Storage, styling, utility service blocks"],
        },
        namingConventions: [
          "PascalCase for components and folders",
          "camelCase for utility files, hooks, types",
          "Use Tailwind CSS responsive style rules",
        ],
        styling: "tailwind",
        additionalRules: [
          "Preserve type assertions in React TSX components",
          "Do not generate stubs or incomplete code blocks",
        ],
      });
    }

    if (!existsSync(this.patternsPath)) {
      this.savePatterns({
        reusablePatterns: [
          {
            name: "LocalStorageStateHook",
            description: "Persists React state changes to local storage key-value pairs",
            files: ["src/hooks/useLocalStorage.ts"],
            sampleCode: `import { useState, useEffect } from 'react';\nexport function useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(() => {\n    const stored = localStorage.getItem(key);\n    return stored ? JSON.parse(stored) : initialValue;\n  });\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value));\n  }, [key, value]);\n  return [value, setValue] as const;\n}`,
          },
          {
            name: "TailwindGlassmorphism",
            description: "Responsive translucent card container utilizing blur, border dividers, and gradient overlays",
            files: ["src/components/Layout.tsx"],
            sampleCode: `className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10"`,
          },
        ],
      });
    }

    if (!existsSync(this.metricsPath)) {
      this.saveMetrics({
        buildHistory: [],
        telemetry: {
          totalTokensUsed: 0,
          estimatedCostUsd: 0.0,
          healingAttempts: 0,
          sandboxRuns: 0,
        },
      });
    }
  }
}
