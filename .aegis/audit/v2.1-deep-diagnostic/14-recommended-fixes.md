# Aegis V2.1 Deep Codebase Diagnostic — 14: Recommended Fixes & Implementation Order

**Audit Date:** August 18, 2026  
**Scope:** Sequenced, high-leverage remediations and validation criteria.

---

## 1. Prioritized Implementation Roadmap

### Fix 1: Wrap Root Entrypoint with `<BrowserRouter>` (High Priority / Quick Win)
- **Target Files:** `packages/ai-core/src/governance/fast-sanitizer.ts`, `packages/ai-core/src/startup/project-startup-agent.ts`
- **Action:** Ensure `main.tsx` or `App.tsx` wraps all route declarations in `<BrowserRouter>`.
- **Validation:** Live browser sandbox mounts `http://localhost:5173` with 0 console errors.

### Fix 2: Fix Prisma Validation Argument in Orchestrator (High Priority / Critical)
- **Target File:** `packages/ai-core/src/agent/orchestrator.ts: Line 1337`
- **Action:** Pass `request` and `this.resolvedContract` to `CanonicalDataModelContract.validateSchema(schemaContent, request, this.resolvedContract)`.
- **Validation:** Generated `schema.prisma` retains `Task`, `BoardColumn`, and `PriorityLevel` models without fallback overwrite.

### Fix 3: Remove Hardcoded ATS Resume Artifacts (High Priority / Cleanliness)
- **Target Files:** `project-startup-agent.ts`, `project-graph-engine.ts`, `canonical-file-graph.ts`
- **Action:** Replace hardcoded Resume/Scan methods (`uploadResume`, `analyzeScan`, `pdf.service.ts`) with domain-neutral generic API clients and dynamic handlers.
- **Validation:** Zero ATS or resume strings present in non-resume generated projects.

### Fix 4: Eliminate Duplicate Architecture Resolution (Medium Priority / Performance)
- **Target Files:** `packages/agent-runtime/src/execution-engine.ts`, `packages/ai-core/src/agent/orchestrator.ts`
- **Action:** Retain `ArchitectureContractV1` from Phase 1 and pass directly to Phase 3 without cache deletion.
- **Validation:** End-to-end generation completes ~40 seconds faster with zero redundant planning logs.

### Fix 5: Output Directory Workspace Normalization (Medium Priority)
- **Target File:** `apps/cli/src/commands/create.ts`
- **Action:** Resolve `./generated/project` relative to git workspace root rather than `process.cwd()`.
- **Validation:** Generated output consistently resides at `<repo-root>/generated/project`.
