# 📋 Aegis AI — Master Problem Register (Areas A through K)

**Date**: November 5, 2026  
**Auditor**: Aegis AI Principal Architect & Autonomous Debugging Engineer  
**Scope**: Complete framework audit covering code generation, design, governance, execution, repair, and editing pipelines.

---

## Severity & Classification Legend

### Severity Levels
- **P0**: Data loss, security issues, corrupted projects, or generation failures halting the entire pipeline.
- **P1**: Required features missing, major runtime errors, broken frontend/backend/database integration, or failed critical workflows.
- **P2**: Inconsistent design, incomplete interactions, responsive defects, or unreliable editing.
- **P3**: Minor visual improvements, maintainability issues, and optimization opportunities.

### Finding Classifications
- **Confirmed Defect**: Reproducible bug confirmed by code inspection or test execution.
- **Reproduced Intermittent Defect**: Flaky or race-condition failure confirmed under specific timings.
- **Architectural Risk**: Structural design hazard that creates future instability or maintenance debt.
- **Missing Capability**: Expected capability required by system vision that is not yet implemented.
- **Performance Issue**: Unnecessary slowdown, duplicate model call, or excessive resource usage.
- **Environment Limitation**: Host OS / external infrastructure dependency (e.g., PostgreSQL offline, Windows junctions).
- **Unverified Hypothesis**: Suspected issue requiring further empirical reproduction.

---

## Summary Matrix

| ID | Area | Title | Severity | Classification | Responsible Files | Status |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **PR-A01** | Requirement | Feature Matrix Not Persisted in Greenfield Generation | **P1** | Confirmed Defect | `packages/ai-core/src/agent/orchestrator.ts` | Open |
| **PR-A02** | Requirement | Prompt Inference JSON Parse Failure Drops Features | **P2** | Confirmed Defect | `packages/ai-core/src/prompts/prompt-inference-engine.ts` | Open |
| **PR-B01** | Design | FastSanitizer Hardcoded Card Theming Overwrites Custom Styling | **P1** | Confirmed Defect | `packages/ai-core/src/governance/fast-sanitizer.ts` | Open |
| **PR-B02** | Design | Cross-Project Similarity Gate Not Invoked in Production Path | **P2** | Architectural Risk | `packages/ai-core/src/agent/orchestrator.ts` | Open |
| **PR-C01** | Frontend | ProjectStartupAgent Injects Domain-Contaminated Service Stubs | **P1** | Confirmed Defect | `packages/ai-core/src/startup/project-startup-agent.ts` | Open |
| **PR-C02** | Frontend | Truncated AI Code Logged as Warning Instead of Regenerated | **P1** | Confirmed Defect | `packages/ai-core/src/startup/project-startup-agent.ts` | Open |
| **PR-C03** | Frontend | Repeated Card Subcomponent Append Causes Duplicate Declarations | **P2** | Confirmed Defect | `packages/ai-core/src/governance/fast-sanitizer.ts` | Open |
| **PR-D01** | Backend | Express Backend Hardcoded Routes Missing in Inferred Contracts | **P1** | Architectural Risk | `packages/ai-core/src/contract/project-contract.ts` | Open |
| **PR-D02** | Backend | ApiWorkflowVerifier Payload Guessing on Uncontracted Routes | **P2** | Confirmed Defect | `packages/ai-core/src/validation/api-workflow-verifier.ts` | Open |
| **PR-E01** | Database | Windows Broken Junctions in Target Dir Cause Clean Failures | **P0** | Confirmed Defect | `packages/project-builder/src/utils/clean-directory.ts` | Open |
| **PR-E02** | Database | Database Blocked Masked as Total Success by ExecutionEngine | **P0** | Confirmed Defect | `packages/agent-runtime/src/execution-engine.ts` | Open |
| **PR-F01** | Integration | In-Project Test Runner Skipped in VITEST / Test Environment | **P1** | Confirmed Defect | `packages/ai-core/src/startup/project-startup-agent.ts` | Open |
| **PR-F02** | Integration | CanonicalContractManager Not Wired to Greenfield Pipeline | **P1** | Confirmed Defect | `packages/ai-core/src/agent/orchestrator.ts` | Open |
| **PR-G01** | Testing | FunctionalCompletenessAuditor Omitted from FinalSuccessGate | **P1** | Confirmed Defect | `packages/ai-core/src/validation/final-success-gate.ts` | Open |
| **PR-G02** | Testing | In-Project Tests Vitest Configuration fileParallelism: false Slowdown | **P2** | Performance Issue | `packages/ai-core/vitest.config.ts` | Open |
| **PR-H01** | Repair | BoundedRepairEngine Not Connected to ExecutionPipeline | **P1** | Architectural Risk | `packages/agent-runtime/src/pipeline/execution-pipeline.ts` | Open |
| **PR-H02** | Repair | FastSanitizer Synthesizes Generic Routes Overwriting Coder Output | **P1** | Confirmed Defect | `packages/ai-core/src/governance/fast-sanitizer.ts` | Open |
| **PR-I01** | Editing | FeatureAdder Missing Feature Matrix Fallback Initialization | **P2** | Confirmed Defect | `packages/ai-core/src/edit/feature-adder.ts` | Open |
| **PR-J01** | Stability | Redundant Dependency Installation Runs in ExecutionEngine | **P2** | Performance Issue | `packages/agent-runtime/src/execution-engine.ts` | Open |
| **PR-K01** | Production | CLI generated output directory default mismatch | **P3** | Architectural Risk | `apps/cli/src/commands/create.ts` | Open |

---

## Detailed Problem Register by Area

### A. Requirement Understanding

#### PR-A01: Feature Matrix Not Persisted in Greenfield Generation
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/agent/orchestrator.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/orchestrator.ts#L368)
- **Evidence**: `FeatureMatrixManager.saveToProject()` is never called in `Orchestrator.generateApplication()`. Running a clean generation produces `.aegis/architecture-contract.json` and `domain-contract.json`, but `.aegis/feature-matrix.json` is completely absent.
- **Root Cause**: `Orchestrator` relies on legacy `ProductDiscoveryAgent.discover()`, storing the resulting object in memory `(this as any)._cachedFeatureMatrix`. It does not transform it into the canonical `FeatureMatrix` with `F01..Fn` IDs or save it via `FeatureMatrixManager`.
- **Impact**: Any subsequent execution of `aegis edit` (`FeatureAdder`, `FeatureRemover`) or `UnifiedVerificationEngine` finds no feature matrix, preventing requirement-linked acceptance verification.

#### PR-A02: Prompt Inference JSON Parse Failure Drops Features
- **Severity**: **P2**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/prompts/prompt-inference-engine.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/prompts/prompt-inference-engine.ts#L80-L100)
- **Evidence**: Lines 78-85: If the model wraps JSON in conversational text or fails JSON syntax, the engine logs a warning and returns `inferredFeatures: []`.
- **Root Cause**: No heuristic fallback or regex extraction of feature bullets is attempted when JSON parsing fails.
- **Impact**: When small or fast models produce malformed JSON, prompt inference silently degenerates to an empty feature list, omitting required domain capabilities.

---

### B. Website Design

#### PR-B01: FastSanitizer Hardcoded Card Theming Overwrites Custom Styling
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/governance/fast-sanitizer.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/governance/fast-sanitizer.ts#L389-L430)
- **Evidence**: Lines 391-430:
  ```ts
  const isBotanicalOrLightCard = ...;
  const canonicalCardContent = isBotanicalOrLightCard ? `... bg-white/85 ...` : `... var(--color-surface, rgba(15, 23, 42, 0.6)) ...`;
  ```
  If `FastSanitizer` detects duplicate declarations or runs on clean cards, it rewrites the file with this hardcoded template.
- **Root Cause**: Compounding reactive fixers from early milestones where card syntax errors were "fixed" by replacing the file with a standardized template.
- **Impact**: Valid bespoke styling generated by `DesignDirector` and `CoderAgent` is overwritten with generic dark slate or cream templates, causing generated sites to look identical.

#### PR-B02: Cross-Project Similarity Gate Not Invoked in Production Path
- **Severity**: **P2**
- **Classification**: Architectural Risk
- **Responsible File**: [`packages/ai-core/src/agent/orchestrator.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/orchestrator.ts)
- **Evidence**: `CrossProjectSimilarityGate` exists in `packages/ai-core/src/validation/cross-project-similarity-gate.ts`, but is not called during `Orchestrator.generateApplication()`.
- **Root Cause**: Gate was implemented in Phase 3 as a standalone component without being wired into the production orchestration pipeline.
- **Impact**: Aegis cannot detect if two successive generations for different prompts produced identical layout or color schemes.

---

### C. Frontend Generation

#### PR-C01: ProjectStartupAgent Injects Domain-Contaminated Service Stubs
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/startup/project-startup-agent.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/startup/project-startup-agent.ts#L3460-L3473)
- **Evidence**: Lines 3460-3473:
  ```ts
  return {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    byDepartment: {},
    bySemester: {},
    recentStudents: [],
  };
  ```
- **Root Cause**: A quick fix authored for a student portal test was hardcoded into the generic missing import resolver.
- **Impact**: Any application (e-commerce, medical, aerospace) that imports an unresolved `*Service` gets student portal metrics injected into its codebase.

#### PR-C02: Truncated AI Code Logged as Warning Instead of Regenerated
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/startup/project-startup-agent.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/startup/project-startup-agent.ts#L223-L225)
- **Evidence**:
  ```ts
  if (truncatedFiles.length > 0) {
    console.warn(`[Startup] ⚠️ Detected truncated AI output (needs regeneration, not patched): ${truncatedFiles.join(", ")}`);
  }
  ```
  The pipeline proceeds directly to compilation without triggering regeneration.
- **Root Cause**: Detection was implemented without linking to an authorized regeneration loop.
- **Impact**: Truncated files produce compiler syntax errors, which trigger downstream fixers to comment out blocks or stub exports.

#### PR-C03: Repeated Card Subcomponent Append Causes Duplicate Declarations
- **Severity**: **P2**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/governance/fast-sanitizer.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/governance/fast-sanitizer.ts#L476-L497)
- **Evidence**: FastSanitizer appends missing subcomponents (`CardHeader`, `CardTitle`) using string concatenation. If the component already uses a different formatting (e.g. `export const CardHeader = function`), the regex fails, the block is appended again, causing TS2393 duplicate identifier errors.
- **Root Cause**: Regex-based append without AST duplicate check.
- **Impact**: Clean components become corrupted after multiple sanitizer passes.

---

### D. Backend Generation

#### PR-D01: Express Backend Hardcoded Routes Missing in Inferred Contracts
- **Severity**: **P1**
- **Classification**: Architectural Risk
- **Responsible File**: [`packages/ai-core/src/contract/project-contract.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/contract/project-contract.ts#L98)
- **Evidence**: Line 98: `routes: ["/", "/login", "/register", "/dashboard"]`. Hardcoded default routes are seeded regardless of application domain.
- **Root Cause**: Contract template fallback was not linked to domain-derived routes.
- **Impact**: Backend router generation prioritizes generic auth/dashboard routes over requested domain workflows.

#### PR-D02: ApiWorkflowVerifier Payload Guessing on Uncontracted Routes
- **Severity**: **P2**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/validation/api-workflow-verifier.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/validation/api-workflow-verifier.ts#L312-L316)
- **Evidence**: Lines 312-316:
  ```ts
  sampleBody.name = `Sample_${ep.operationId || "item"}_${Date.now()}`;
  sampleBody.status = "active";
  sampleBody.description = `Test payload for ${ep.path}`;
  ```
- **Root Cause**: If an endpoint does not have an explicit `requestSchema` in the contract, a generic 3-field body is sent. Endpoints validating strict Zod schemas return HTTP 400.
- **Impact**: Valid backend endpoints fail API workflow verification.

---

### E. Database Generation

#### PR-E01: Windows Broken Junctions in Target Dir Cause Clean Failures
- **Severity**: **P0**
- **Classification**: Confirmed Defect / Environment
- **Responsible File**: [`packages/project-builder/src/utils/clean-directory.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/project-builder/src/utils/clean-directory.ts#L9)
- **Evidence**: When `cleanDirectory()` encounters a broken Windows junction (e.g., `node_modules` pointing to a deleted folder), Node's `existsSync()` returns `false`, causing `cleanDirectory()` to exit immediately without deleting the junction entry. Subsequent `mkdirSync` or `symlinkSync` fails with `EEXIST`.
- **Root Cause**: On Windows, `existsSync()` checks the junction's target existence, not the junction entry itself.
- **Impact**: Subsequent clean generations into `generated/project` fail with unhandled `EEXIST` errors.

#### PR-E02: Database Blocked Masked as Total Success by ExecutionEngine
- **Severity**: **P0**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/agent-runtime/src/execution-engine.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/agent-runtime/src/execution-engine.ts#L167-L169)
- **Evidence**: Lines 167-169:
  ```ts
  const pipeline = await this.pipeline.execute(request, projectPath);
  return pipeline.success;
  ```
- **Root Cause**: When `FinalSuccessGate` records status `BLOCKED` (because PostgreSQL is offline), `Orchestrator.generateApplication()` does not throw. `ExecutionEngine` then runs `pipeline.execute()`, which only tests `pnpm build`. Since build succeeds, it returns `true`.
- **Impact**: The CLI prints `🎉 Project generated successfully` to the user, masking that database persistence was completely unverified.

---

### F. Integration

#### PR-F01: In-Project Test Runner Skipped in VITEST / Test Environment
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/startup/project-startup-agent.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/startup/project-startup-agent.ts#L134-L136)
- **Evidence**:
  ```ts
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    console.log("[Startup] Test environment detected — skipping install.");
  }
  ```
- **Root Cause**: Optimization added to speed up tests prevents `pnpm install` in generated project targets during test runs.
- **Impact**: When tests run `InProjectTestRunner` or `RuntimeAcceptanceRunner`, `generated/project/node_modules` is absent or incomplete, causing `TS2307: Cannot find module 'vitest'` or broken imports.

#### PR-F02: CanonicalContractManager Not Wired to Greenfield Pipeline
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/agent/orchestrator.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/orchestrator.ts)
- **Evidence**: `CanonicalContractManager` methods (`syncToPrismaSchema`, `fromFeatureMatrix`) are never called in `Orchestrator.generateApplication()`.
- **Root Cause**: Implemented in Milestone 2 but left detached from the primary orchestrator call path.
- **Impact**: Backend routes, frontend fetchers, and Prisma schemas can diverge because canonical contracts are not saved to `.aegis/canonical-contract.json`.

---

### G. Testing

#### PR-G01: FunctionalCompletenessAuditor Omitted from FinalSuccessGate
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/validation/final-success-gate.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/validation/final-success-gate.ts)
- **Evidence**: `FunctionalCompletenessAuditor` (which detects inert buttons, dead forms, fake auth, disconnected search/cart) is only run inside `real-project-benchmark-harness.ts`, not in the production `FinalSuccessGate`.
- **Root Cause**: Never wired into `final-success-gate.ts`.
- **Impact**: Generated applications with fake or decorative buttons pass `FinalSuccessGate` and are delivered to the user as complete applications.

#### PR-G02: In-Project Tests Vitest Configuration fileParallelism: false Slowdown
- **Severity**: **P2**
- **Classification**: Performance Issue
- **Responsible File**: [`packages/ai-core/vitest.config.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/vitest.config.ts#L7)
- **Evidence**: Line 7: `fileParallelism: false`. With 958 test files across the repository, running vitest without filters takes hours.
- **Root Cause**: Defensive config added to prevent port collision during browser tests applied globally across all unit tests.
- **Impact**: Development feedback loops are slowed down dramatically.

---

### H. Repair System

#### PR-H01: BoundedRepairEngine Not Connected to ExecutionPipeline
- **Severity**: **P1**
- **Classification**: Architectural Risk
- **Responsible File**: [`packages/agent-runtime/src/pipeline/execution-pipeline.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/agent-runtime/src/pipeline/execution-pipeline.ts#L15)
- **Evidence**: `ExecutionPipeline` still instantiates the legacy `SelfHealer(provider)` instead of `BoundedRepairEngine`.
- **Root Cause**: Bounded repair engine was created in Phase 6 but the runtime execution pipeline was not updated to use it.
- **Impact**: Unbounded repair retries and heuristic code edits can still occur during post-generation build self-healing.

#### PR-H02: FastSanitizer Synthesizes Generic Routes Overwriting Coder Output
- **Severity**: **P1**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/governance/fast-sanitizer.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/governance/fast-sanitizer.ts#L2510-L2516)
- **Evidence**:
  ```ts
  const routesCode = this.generateRoutesFromExistingPages(root, contract);
  if (routesCode && routesCode.trim().length > 0) {
    writeFileSync(routesTsxPath, routesCode, "utf8");
  }
  ```
- **Root Cause**: FastSanitizer attempts to reconstruct `routes.tsx` from directory scanning, overwriting the CoderAgent's deliberate route structure, nested layouts, and lazy-loading wrappers.
- **Impact**: Broken routing or loss of custom route transitions.

---

### I. Project Editing & Cleanup

#### PR-I01: FeatureAdder Missing Feature Matrix Fallback Initialization
- **Severity**: **P2**
- **Classification**: Confirmed Defect
- **Responsible File**: [`packages/ai-core/src/edit/feature-adder.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/edit/feature-adder.ts#L225-L235)
- **Evidence**: If `FeatureMatrixManager.loadFromProject()` returns `null` (because PR-A01 left the file unpersisted), `FeatureAdder` logs a warning and creates an empty stub matrix with only the new feature, losing record of existing features.
- **Root Cause**: Assumed `.aegis/feature-matrix.json` always exists on disk.
- **Impact**: Editing a project strips prior feature definitions from the matrix.

---

### J. Performance and Stability

#### PR-J01: Redundant Dependency Installation Runs in ExecutionEngine
- **Severity**: **P2**
- **Classification**: Performance Issue
- **Responsible File**: [`packages/agent-runtime/src/execution-engine.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/agent-runtime/src/execution-engine.ts#L167)
- **Evidence**: `ProjectStartupAgent` installs dependencies in Stage 13 of `generateApplication()`. Then `ExecutionEngine` immediately runs `this.pipeline.execute()`, which invokes `this.installer.install("pnpm", projectPath)` again from scratch.
- **Root Cause**: Duplicate pipeline execution layers between `Orchestrator` and `agent-runtime`.
- **Impact**: Each generation wastes 30–60 seconds running redundant pnpm dependency checks.

---

### K. CLI and Production Integration

#### PR-K01: CLI Generated Output Directory Default Mismatch
- **Severity**: **P3**
- **Classification**: Architectural Risk
- **Responsible File**: [`apps/cli/src/commands/create.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/apps/cli/src/commands/create.ts#L137)
- **Evidence**: CLI defaults target to `./generated/project`, but tests alternate between `apps/cli/generated/project` and `projects/`.
- **Root Cause**: Relative path resolution variations when run via `pnpm --filter @aegis/cli dev` vs global install.
- **Impact**: Intermediate files can be generated in sibling paths if `INIT_CWD` is not set.
