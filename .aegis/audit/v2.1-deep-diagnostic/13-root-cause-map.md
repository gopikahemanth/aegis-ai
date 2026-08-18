# Aegis V2.1 Deep Codebase Diagnostic — 13: Root Cause Map

**Audit Date:** August 18, 2026  
**Scope:** Direct mapping of symptoms, failed components, root causes, and blast radius.

---

## 1. Comprehensive Defect Mapping

| # | Symptom / Failure | Responsible File & Lines | Root Cause | Blast Radius |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `useRoutes() may be used only in the context of a <Router>` browser crash | `fast-sanitizer.ts:450-490`, `main.tsx`, `App.tsx` | Sanitizer wraps `AppRoutes` in `QueryClientProvider` but omits `<BrowserRouter>` wrapper. | 100% of React Router v6 projects fail live sandbox browser verification. |
| **2** | Prisma schema overwritten with generic `Item`/`Activity` models | `orchestrator.ts:1337`, `canonical-data-model.ts:35` | `validateSchema(schemaContent)` called without prompt or contract argument, triggering unconditional fallback. | 100% of projects with custom Prisma data models lose their domain models. |
| **3** | ATS Resume Scanner files injected into non-resume projects | `project-startup-agent.ts:215-410`, `project-graph-engine.ts:611-640` | Hardcoded Resume/ATS controller, service, route, and type fallbacks in missing-file recovery routines. | Contaminates generated codebases with dead, irrelevant ATS code. |
| **4** | Duplicate AI inference & double latency | `execution-engine.ts:75-95`, `orchestrator.ts:475-500` | `generateApplication()` clears `.aegis/` cache and repeats Phase 1 inference from scratch. | Adds 30–60s redundant delay and doubles AI token cost per run. |
| **5** | Output directory created in `apps/cli/generated` instead of root | `apps/cli/package.json`, `execution-engine.ts:25` | `pnpm cli create` runs with cwd in `apps/cli`, resolving `./generated/project` locally. | Distorts workspace paths and git status. |
| **6** | Valid Kanban status lines flagged as unfinished stubs | `orchestrator.ts`, `GeneratedFileValidator` | Case-insensitive regex `/\/\/\s*TODO/i` matched comments like `// todo, in-progress, done`. | Unnecessary file regenerations during task execution. |
| **7** | `useTaskStore.tsx` import regression during self-healing | `transactional-repair.ts`, `healer-agent.ts` | Healer created a new file in `src/state/` without updating or removing old re-export shim in `src/features/kanban-board/hooks/`. | Causes self-healing loop to trigger TS2304 build failures. |
