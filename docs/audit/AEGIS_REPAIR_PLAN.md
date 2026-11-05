# 🛠️ Aegis AI — Master Repair Plan & Architectural Milestones

**Date**: November 5, 2026  
**Auditor**: Aegis AI Principal Architect & Autonomous Debugging Engineer  

---

## 1. Overview & Strategy

This repair plan addresses the root causes of the confirmed defects identified in `docs/audit/AEGIS_PROBLEM_REGISTER.md` and `docs/audit/AEGIS_GENERATION_FAILURES.md`.

In accordance with architectural principles:
- **No Compounding Fixers**: We do not introduce another layer of fixers to patch bugs caused by existing fixers.
- **Single Ownership**:
  - `RequirementsAuthority` owns `.aegis/feature-matrix.json`.
  - `ContractAuthority` owns `.aegis/canonical-contract.json`.
  - `AuthorizedSchemaManager` owns `prisma/schema.prisma`.
  - `AuthorizedFileWriter` owns write permissions at the disk boundary.
  - `FinalSuccessGate` and `ExecutionEngine` honestly report outcomes (`PASS`, `FAIL`, `BLOCKED`).
- **Phased Verification**: P0 and P1 defects are repaired and verified first. Regression tests must pass at every step.

---

## 2. Milestone Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 1 (P0): Isolation & Honest Execution Gating                  │
│   - Fix Windows broken junction handling in cleanDirectory             │
│   - Fix ExecutionEngine status masking (honestly report BLOCKED)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 2 (P1): Production Requirements & Canonical Contracts        │
│   - Wire FeatureMatrixManager to persist .aegis/feature-matrix.json    │
│   - Wire CanonicalContractManager to synchronize contracts & Prisma   │
│   - Wire FunctionalCompletenessAuditor into FinalSuccessGate           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 3 (P1): Sanitizer & Startup Cleanup (Eliminate False Fixers) │
│   - Strip generative card rewrites & generic fallbacks from Sanitizer  │
│   - Replace student portal stubbing in StartupAgent with neutral stub  │
│   - Ensure node_modules synchronization in test environments           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 4 (P2): Pipeline Integration & Bounded Self-Healing          │
│   - Connect BoundedRepairEngine to ExecutionPipeline                   │
│   - Eliminate duplicate dependency installations in ExecutionEngine    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Milestone 5: Greenfield Multi-Domain Benchmark Validation              │
│   - Fresh generation & verification across 6 distinct domains          │
│   - 8 Brownfield editing scenario verification                         │
│   - Final readiness reporting                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Milestones & Implementation Tasks

### Milestone 1 (P0): Isolation & Honest Execution Gating

#### Task 1.1: Fix Windows Broken Junction Resilience in `cleanDirectory`
- **Problem**: When a project directory contains an orphaned or broken junction, Node's `existsSync` returns `false`, causing `cleanDirectory()` to exit without deleting the junction entry, leading to `EEXIST` failures.
- **Target File**: `packages/project-builder/src/utils/clean-directory.ts`
- **Architectural Solution**:
  - Replace `existsSync(targetPath)` with `lstatSync` wrapped in try/catch to detect existing junctions/symlinks even if their target is absent.
  - On Windows, ensure PowerShell / `cmd /c rmdir /s /q` handles junctions with `/force` before directory recreation.
- **Acceptance Criteria**: `cleanDirectory()` successfully wipes directories containing broken or dangling junctions without throwing errors.

#### Task 1.2: Eliminate False Success in `ExecutionEngine` on `BLOCKED` Status
- **Problem**: When `FinalSuccessGate` records status `BLOCKED` (e.g. external database offline), `generateApplication()` does not throw, and `ExecutionEngine` returns `pipeline.success` (`true`), causing the CLI to falsely report `🎉 Project generated successfully`.
- **Target Files**:
  - `packages/agent-runtime/src/execution-engine.ts`
  - `apps/cli/src/commands/create.ts`
- **Architectural Solution**:
  - Update `ExecutionEngine.execute()` to return an execution outcome object `{ success: boolean; status: "SUCCESS" | "FAILED" | "BLOCKED"; blockingReason?: string }` instead of a bare boolean.
  - In `create.ts`, if status is `BLOCKED`, print an explicit `⚠️ Generation Completed with Limitations (BLOCKED)` notice with the exact blocking reason (e.g. database offline), rather than false success.
- **Acceptance Criteria**: Running generation with database offline exits with clear `BLOCKED` status reporting.

---

### Milestone 2 (P1): Production Requirements & Canonical Contracts

#### Task 2.1: Wire `FeatureMatrixManager` into `Orchestrator`
- **Problem**: `.aegis/feature-matrix.json` is not persisted in clean generations, breaking downstream brownfield editing and verification.
- **Target File**: `packages/ai-core/src/agent/orchestrator.ts`
- **Architectural Solution**:
  - When `ProductDiscoveryAgent.discover()` or architect specification runs, convert the discovered features into `FeatureDefinition[]` with stable IDs (`F01..Fn`).
  - Invoke `FeatureMatrixManager.saveToProject(outputDirectory, matrix)` to guarantee `.aegis/feature-matrix.json` is always present on disk.
- **Acceptance Criteria**: Every generated project has a valid `.aegis/feature-matrix.json` that satisfies `FeatureMatrixManager.validate()`.

#### Task 2.2: Wire `CanonicalContractManager` into Generation Pipeline
- **Problem**: `CanonicalContractManager` is detached from `Orchestrator.generateApplication()`.
- **Target File**: `packages/ai-core/src/agent/orchestrator.ts`
- **Architectural Solution**:
  - Derive canonical contract from `FeatureMatrix` and `ArchitectureContract`.
  - Persist `.aegis/canonical-contract.json`.
  - Call `CanonicalContractManager.syncToPrismaSchema(outputDirectory, contract)` to ensure Prisma schema models align non-destructively with canonical data requirements.
- **Acceptance Criteria**: Full alignment between routes, API contracts, and Prisma models.

#### Task 2.3: Wire `FunctionalCompletenessAuditor` into `FinalSuccessGate`
- **Problem**: `FunctionalCompletenessAuditor` was omitted from `FinalSuccessGate`, allowing decorative buttons and dead forms to pass.
- **Target File**: `packages/ai-core/src/validation/final-success-gate.ts`
- **Architectural Solution**:
  - Call `FunctionalCompletenessAuditor.audit(projectRoot)` inside `FinalSuccessGate.verify()`.
  - Add "Functional Completeness" item to the gate evaluation.
  - Fail the gate if inert buttons or dead forms are found in production feature routes.
- **Acceptance Criteria**: Projects with inert buttons or dead forms are flagged as `FAILED`.

---

### Milestone 3 (P1): Sanitizer & Startup Cleanup (Eliminate False Fixers)

#### Task 3.1: Strip Generative Card Overrides from `FastSanitizer`
- **Problem**: `FastSanitizer` rewrites custom `Card.tsx` with generic hardcoded palettes (`bg-white/85` or `rgba(15, 23, 42, 0.6)`), destroying design system originality.
- **Target File**: `packages/ai-core/src/governance/fast-sanitizer.ts`
- **Architectural Solution**:
  - Remove hardcoded card rewriting and template copy from `enforceGenericComponents()`.
  - If subcomponents (`CardHeader`, `CardTitle`) are missing, append them without touching the existing root component styling or classes.
- **Acceptance Criteria**: Bespoke card styles and tokens generated by `CoderAgent` survive multiple sanitizer passes intact.

#### Task 3.2: Eliminate Domain Contamination in `ProjectStartupAgent` Service Stubs
- **Problem**: `ProjectStartupAgent` injects `totalStudents: 0` into missing service files across all domains.
- **Target File**: `packages/ai-core/src/startup/project-startup-agent.ts`
- **Architectural Solution**:
  - Replace the hardcoded student metrics with domain-agnostic generic service methods (`getAll`, `getById`, `create`, `update`, `delete`, `getStats`).
- **Acceptance Criteria**: Service stubs contain zero domain-specific words like "student" or "department".

#### Task 3.3: Ensure Node Modules Synchronization in Test Environments
- **Problem**: Skipping dependency installation during tests causes broken symlinks and missing modules for subsequent in-project test runs.
- **Target File**: `packages/ai-core/src/startup/project-startup-agent.ts`
- **Architectural Solution**:
  - In test environments, instead of skipping install, check if essential packages (`react`, `react-dom`, `vite`, `vitest`) are reachable; if missing, perform a fast offline install or copy rather than leaving broken junctions.
- **Acceptance Criteria**: In-project vitest runs cleanly in test suites.

---

### Milestone 4 (P2): Pipeline Integration & Bounded Self-Healing

#### Task 4.1: Connect `BoundedRepairEngine` to `ExecutionPipeline`
- **Problem**: `ExecutionPipeline` uses legacy `SelfHealer` with heuristic fixes instead of `BoundedRepairEngine`.
- **Target File**: `packages/agent-runtime/src/pipeline/execution-pipeline.ts`
- **Architectural Solution**:
  - Integrate `BoundedRepairEngine` into the build-healing loop.
  - Enforce bounded retries (max 3), invariant protection (never weaken tests), and root-cause classification.
- **Acceptance Criteria**: Self-healing terminates boundedly on repeated failures without loop corruption.

#### Task 4.2: Eliminate Redundant Install Passes in `ExecutionEngine`
- **Problem**: Dependencies are installed twice in succession during clean generation.
- **Target File**: `packages/agent-runtime/src/execution-engine.ts`
- **Architectural Solution**:
  - Pass dependency sync state from `generateApplication` to `pipeline.execute()`. If dependencies were already verified in Stage 13, skip the duplicate `installer.install()` step in Stage 14.
- **Acceptance Criteria**: Generation pipeline execution time reduced by 30+ seconds.

---

### Milestone 5: Greenfield Multi-Domain Benchmark Validation

Generate and verify 6 fresh applications from real prompts:
1. **Student Portfolio** (`portfolio`): Multiple pages, skills showcase, functional contact form, zero inert buttons.
2. **Restaurant Application** (`restaurant`): Categories, cart updates, order & reservation forms, schema relations.
3. **E-Commerce Store** (`ecommerce`): Catalog, search/filter, variants, cart checkout, order persistence.
4. **Education Platform** (`education`): Courses, roles, enrollment workflow, progress contracts.
5. **Analytics Dashboard** (`analytics`): Charts, metric filters, realistic data loading, empty/error states.
6. **Unfamiliar Domain** (`industrial_fleet`): Industrial IoT equipment telematics, vibration thresholds, maintenance work orders.

Verify all 8 brownfield editing workflows:
- EDIT 1: Add new page with navigation.
- EDIT 2: Add data-backed feature (frontend + backend + DB).
- EDIT 3: Redesign hero/visual theme without breaking logic.
- EDIT 4: Remove feature and obsolete code.
- EDIT 5: Evolve database model preserving existing fields.
- EDIT 6: Fix defect without regression.
- EDIT 7: Section edit leaving other pages unchanged.
- EDIT 8: Full application redesign.
