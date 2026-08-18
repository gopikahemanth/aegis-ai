# Aegis V2.1 Deep Codebase Diagnostic — 01: Repository Architecture

**Audit Date:** August 18, 2026  
**Auditor Role:** Senior Software Architect, Autonomous Agent Compiler Specialist, Production Debugging Engineer  
**Scope:** Full repository map, package topology, runtime layers, AI provider hierarchy, and governance subsystems.

---

## 1. Repository Topology

Aegis is architected as a pnpm monorepo containing 1 application and 3 core packages:

```
aegis-ai/
├── apps/
│   └── cli/                       # Main CLI entrypoint (@aegis/cli)
├── packages/
│   ├── ai-core/                   # Primary orchestration, LLM integration, DAG, Governance, Spec Normalizer (@aegis/ai-core)
│   ├── agent-runtime/             # ExecutionEngine, scaffolding coordinator, verification loops (@aegis/agent-runtime)
│   └── project-builder/           # Terminal runner, dependency installer, Vite/Next.js/Express scaffolders (@aegis/project-builder)
├── package.json                   # Root workspace declaration
├── pnpm-workspace.yaml            # Monorepo package boundaries
└── tsconfig.base.json             # Root TypeScript compilation target (NodeNext / ES2022)
```

---

## 2. Package Breakdown & Responsibilities

### 2.1 `apps/cli` (`@aegis/cli`)
- **Entrypoints:** `src/index.ts`, `src/cli.ts`
- **Commands:**
  - `create` (`src/commands/create.ts`): Instantiates `ExecutionEngine` and invokes end-to-end project generation.
  - `dev` (`src/commands/dev.ts`): Spawns project dev server and runtime watchdog.
  - `doctor` (`src/commands/doctor.ts`): Validates local toolchain (Node, pnpm, git, Docker, SQLite/PostgreSQL).
- **Execution Context Flaw Identified:** When invoked via `pnpm cli create "..."` (which triggers `pnpm --filter @aegis/cli dev`), the Node child process executes with `process.cwd()` set to `<repo-root>/apps/cli`. Consequently, `ExecutionEngine` creates the output directory at `<repo-root>/apps/cli/generated/project` rather than the workspace root `<repo-root>/generated/project`.

### 2.2 `packages/ai-core` (`@aegis/ai-core`)
The largest and most critical subsystem (~25,000 lines across 60+ TypeScript modules).
- **Orchestration (`src/agent/`):**
  - `orchestrator.ts` (2,200+ lines): The central generation driver. Manages architecture resolution, data modeling, task DAG creation, coder delegation, inline self-healing, deterministic sanitization, build verification, and Definition-of-Done enforcement.
  - `planner.ts`: Breaks specifications into hierarchical DAG execution tiers.
  - `coder.ts`: Prompt engineering and code generation per task tier.
  - `reviewer.ts`: Static code review and contract conformance checking.
  - `context-manager.ts`: Token budgeting, file history indexing, and prompt assembly.
- **Specification & Contract Governance (`src/spec/`, `src/contracts/`, `src/governance/`):**
  - `canonical-spec.ts`: `SpecificationNormalizer` parses prompts into canonical domain contracts.
  - `architecture-contract.ts`: `ArchitectureResolver` locks stack decisions (e.g. `react-vite` vs `next`, `prisma-postgresql` vs `sqlite`).
  - `canonical-data-model.ts`: Manages Prisma schema creation and static model validation.
  - `fast-sanitizer.ts`: Regex and AST fixups for React router wrappers, CSS imports, and duplicate exports.
  - `ast-safe-transformer.ts`: TypeScript AST-safe repairs to prevent regex corruption.
  - `domain-model-guard.ts` & `plan-contract-gate.ts`: Validates generated plans against locked architecture contracts.
- **Self-Healing & Verification (`src/healing/`, `src/build/`, `src/validation/`):**
  - `build-orchestrator.ts`: Runs typechecking (`tsc`), bundling (`vite build`), linting, and sandbox browser execution.
  - `sandbox-verifier.ts`: Spawns dev servers on ephemeral ports, launches Puppeteer headless browser, captures screenshots, and asserts 0 fatal console errors.
  - `transactional-repair.ts`: Transactional snapshot and rollback manager for AI self-healing iterations.
  - `project-graph-engine.ts`: Scans all generated TS/TSX files for broken imports and missing exports.
- **AI Providers (`src/providers/`):**
  - `factory.ts`: Instantiates model failover chains.
  - Providers supported: `GeminiProvider`, `OpenRouterProvider`, `CerebrasProvider`, `GroqProvider`, `OllamaProvider`.

### 2.3 `packages/agent-runtime` (`@aegis/agent-runtime`)
- **`execution-engine.ts`:** Top-level workflow coordinator connecting CLI commands to `Orchestrator`, `ProjectCreator`, and `ExecutionPipeline`.
- **`pipeline/execution-pipeline.ts`:** Secondary verification pipeline implementing post-generation builds, git commits, and telemetry logs.

### 2.4 `packages/project-builder` (`@aegis/project-builder`)
- **`project-creator.ts`:** Template extraction and baseline scaffolding.
- **`installer.ts`:** Child process wrapper for `pnpm install`, `npm install`, and `yarn install`.
- **`terminal.ts`:** Safe execution runner with timeout guards (120s default).

---

## 3. Environment & Runtime Baseline

The real-world audit environment was recorded as follows:

| Metric | Value |
| :--- | :--- |
| **OS** | Windows 11 Pro (win32 x64) |
| **Node.js** | `v24.13.1` |
| **pnpm** | `10.9.0` |
| **Git Branch** | `main` |
| **Git Status** | Clean (untracked `.aegis/` and `generated/`) |
| **Configured AI Provider** | `gemini` (Google DeepMind) |
| **Active Default Model** | `gemini-3.1-flash-lite` |
| **Fallback Provider Chain** | `gemini -> gemini-2 -> gemini-3 -> openrouter -> cerebras -> groq -> ollama` |
| **Database Engines Present** | Prisma 6.19.3 (PostgreSQL target configured in `.env`, SQLite fallback available) |

---

## 4. Architectural Summary

Aegis is designed as an agentic software generation framework featuring comprehensive architectural gatekeepers, strict schema derivation, AST repair pipelines, and sandbox browser verification. However, deep coupling between subsystems, duplicate planning passes, and hardcoded domain artifacts in recovery routines create systemic vulnerabilities during real-world project creation.
