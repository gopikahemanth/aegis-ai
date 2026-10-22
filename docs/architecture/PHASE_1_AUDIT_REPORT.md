# 🔍 Aegis AI — Phase 1: Evidence-Based Framework Audit Report

**Date**: October 22, 2026  
**Auditor**: Antigravity (Advanced Agentic Architecture Auditor)  
**Target Repository**: `C:\Users\vishn\OneDrive\Desktop\Projects\aegis-ai`  
**Current Baseline Commit**: `eddfe51 docs: formalize Aegis AI system vision, architecture, and roadmap specification`  
**Reference Document**: [`docs/architecture/AEGIS_VISION_AND_ROADMAP.md`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/docs/architecture/AEGIS_VISION_AND_ROADMAP.md)  

---

## 1. Executive Summary

This audit evaluates the generation, governance, validation, and repair subsystems of the Aegis AI framework. 

### The Core Diagnosis
Aegis currently suffers from an architectural pattern of **"compounding reactive fixers"**:
1. Over historical iterations, when an end-to-end generation failed due to model non-determinism, missing fields, or compiler diagnostics, a dedicated heuristic fixer or sanitizer was added.
2. Currently, **over 60 validator, sanitizer, and repair components across 90 subdirectories** independently read, mutate, and reconcile the same project files (`src/App.tsx`, `src/routes.tsx`, `prisma/schema.prisma`, `src/content/site-content.ts`, `src/design-system/components/Card.tsx`, `server/index.ts`).
3. These components have **no single authoritative owner**: `FastSanitizer` (6,686 lines), `ProjectStartupAgent` (3,756 lines), `DeterministicProjectFixer` (1,910 lines), and `ProjectGraphEngine` (78 KB) compete to rewrite, rename, and stub code.
4. Gates have been systematically weakened with `critical: false` or bypassed with empty stubs to make pipelines appear green, leading to **false-success reporting** where test suites fail completely, yet `FinalSuccessGate` declares `[FINAL STATUS]: SUCCESS`.

---

## 2. Repository Baseline & Test Results

### 2.1 Git Status & Workspace Verification
- **Branch**: `main` (synchronized with `origin/main` at commit `eddfe51`).
- **Working Tree**: Clean, zero uncommitted or untracked changes.
- **Vision Document**: Confirmed present at `docs/architecture/AEGIS_VISION_AND_ROADMAP.md`.

### 2.2 Compilation Baseline
```bash
pnpm --filter @aegis/ai-core exec tsc --noEmit
# Exit Code: 0 (0 compilation errors in packages/ai-core)
```

### 2.3 Automated Test Suite Execution Baseline
Execution of `pnpm --filter @aegis/ai-core test` revealed immediate, reproducible failure modes in the existing test suite:
- **`src/brownfield/__tests__/project-generation-tests-e2e.test.ts`**:
  - `TEST EXECUTION: Generated test suite passes all tests with 0 failures and 0 skips` $\to$ **FAILED** (5152ms).
  - Yet `FINAL SUCCESS GATE: Verifies complete greenfield acceptance gate with test pass` $\to$ **PASSED** (6110ms) reporting `[FINAL STATUS]: SUCCESS (15/16 checks passed)`.
- **`src/brownfield/__tests__/domain-generalization-e2e.test.ts`**:
  - `DOMAIN 1 (CRUD Business): Inventory Management` $\to$ **FAILED**.
  - `DOMAIN 2 (Productivity / Content): Task & Project Management` $\to$ **FAILED**.
  - `DOMAIN 3 (Analytics Dashboard): Sales & Revenue` $\to$ **FAILED**.
  - `DOMAIN 4 (Relational Application): Course & Student Management` $\to$ **FAILED**.
  - **Direct Evidence**: All four domains failed with `[InProjectTestRunner] Status: FAIL (4/4 passed)`. The runner parses exit codes and output streams in an inverted manner, causing 4/4 passing tests to register as a hard failure, which is then masked by downstream gates marking in-project tests as non-critical.

---

## 3. End-to-End Generation Call Flow

The pipeline executes through the following sequence from user prompt to final exit:

```
[CLI: create.ts]
      │
      ▼
[AgentRuntime: ExecutionEngine.execute()]
      │
      ▼
[Orchestrator.generateApplication()]
      ├─► Step 0: PromptInferenceEngine.expand() (Feature expansion)
      ├─► Step 1: ArchitectAgent.execute() (Technical specification)
      ├─► Step 2: ArchitectureResolver.resolve() + ContractGate.verify()
      ├─► Step 3: PlannerAgent.execute() (Task DAG generation)
      ├─► Step 4: CoderAgent.execute() (LLM code generation)
      ├─► Step 5: FileWriter.write() (Disk writing with hardcoded overwrite guards)
      │
      ▼
[ProjectStartupAgent.verifyRunnable()]
      ├─► Step 6: FastDeterministicSanitizer.sanitizeProject() (6,686 lines of ad-hoc mutations)
      ├─► Step 7: applyDeterministicTsFixes() (Regex code replacements)
      ├─► Step 8: resolveMissingLocalImports() (Creates placeholder stubs for missing components)
      ├─► Step 9: AppServerRunner.startDevServer() (Spins up dev server on port 5173)
      │
      ▼
[Validation & Verification Pipeline]
      ├─► Step 10: ReadOnlyBrowserValidator.validateProject() (Headless Chromium render check)
      ├─► Step 11: ApiWorkflowVerifier.verifyWorkflows() (Discovers endpoints, sends guessed payloads)
      ├─► Step 12: TestGeneratorAgent + InProjectTestRunner.run() (Vitest execution)
      ├─► Step 13: ProjectGraphValidator.validate() (AST import closure & graph check)
      │
      ▼
[FinalSuccessGate.evaluate()]
      └─► Evaluates 16 gates; treats In-Project Tests & Runtime Scenarios as critical: false
```

---

## 4. Component Inventory & Responsibility Map

| Component | File Path | Primary Callers | Mutation Scope | Overlap / Conflict | Failure Behavior | Evidence / Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`FastDeterministicSanitizer`** | `src/governance/fast-sanitizer.ts` | `ProjectStartupAgent` | Overwrites `Card.tsx`, `Tabs.tsx`, `Table.tsx`, `routes.tsx`, `App.tsx`, `site-content.ts`, `LoginPage.tsx`, `useAuth.tsx`, `WorldStage.tsx` | Conflicts with `CoderAgent` design, overrides theme tokens, fights `CandidateCompositionSynthesizer` | Warns on error; swallows sub-mutations | Confirmed 6,686 lines; mutates 28 distinct file types |
| **`ProjectStartupAgent`** | `src/startup/project-startup-agent.ts` | `Orchestrator` | Installs npm dependencies, rewrites TS syntax, injects stubs for missing imports | Overlaps with `FastSanitizer` and `DeterministicProjectFixer` | Swallows errors with `/* non-fatal */`, injects empty stubs | Lines 213, 230: creates stubs for missing `@/` imports |
| **`DeterministicProjectFixer`** | `src/validation/deterministic-project-fixer.ts` | `ProjectStartupAgent`, `BuildOrchestrator` | Injects fallback `prisma/schema.prisma`, stubs `server/lib/prisma.ts`, injects generic `App.tsx` | Overwrites LLM Prisma models with stripped 7-field generic stubs | Silently injects missing models without business fields | Line 367: injects `model { id, userId, name, ... }` missing domain fields |
| **`FileWriter`** | `src/writer/writer.ts` | `Orchestrator`, `CoderAgent` | Writes generated files to disk; silently drops writes to `prisma/schema.prisma` if model exists | Conflicts with Coder updating schema; prevents business fields from persisting | Logs `[PRISMA-SCHEMA-WRITE] 🔒 Blocked unauthorized LLM overwrite` and skips write | Lines 20-31: drops legitimate LLM updates to schema |
| **`SemanticDuplicateDetector`** | `src/governance/semantic-duplicate-detector.ts` | `Orchestrator` | Blocks proposed writes not in `CanonicalFileGraph` | Hardcoded to 39-file Resume Keyword Scanner graph; rejects valid novel domain files | Rejects file write, logs `[SemanticDuplicate] ⛔ REJECTED` | Lines 48-75: hard-blocks files outside canonical graph |
| **`ApiWorkflowVerifier`** | `src/validation/api-workflow-verifier.ts` | `FinalSuccessGate`, `Orchestrator` | Synthesizes synthetic HTTP requests against running Express server | Guesses payloads with hardcoded fields (`"123 Spice Route Way, Kochi"`); expects 201 for all POSTs | Fails with 400 Bad Request or 200 vs 201 mismatch | Lines 315-380: hardcoded payload fields and rigid status 201 expectation |
| **`InProjectTestRunner`** | `src/validation/in-project-test-runner.ts` | `FinalSuccessGate` | Executes `node vitest.mjs run` inside generated project | Inverts status: exitCode !== 0 triggers FAIL even when 4/4 tests pass | Reports `FAIL (4/4 passed)` | Lines 107-150: `status = (exitCode === 0 && failedTests === 0)` |
| **`FinalSuccessGate`** | `src/validation/final-success-gate.ts` | `Orchestrator`, `create.ts` | Final gatekeeper evaluating 16 validation categories | Masks test failures; marks in-project tests & runtime scenarios as `critical: false` | Reports `[FINAL STATUS]: SUCCESS` when 15/16 checks pass | Lines 560, 576, 706-724: `critical: false` allows failed tests to pass |

---

## 5. Evidence for Overlapping or Conflicting Mutations

### Conflict 1: The Three-Way Card Rewrite War
- **CoderAgent**: Generates custom, domain-styled `Card.tsx` with tailwind classes (e.g. `border-cyan-500/30 bg-ocean-900/40`).
- **FastSanitizer (lines 470-530)**: Scans `Card.tsx`. If it perceives duplicate exports, it overwrites the file with a standardized template. In earlier versions, it forced `bg-slate-900/60` across all domains.
- **DeterministicProjectFixer (line 410)**: Scans design system components; if `Card.tsx` does not match its expected subcomponent interface (`CardHeader`, `CardTitle`, `CardContent`), it appends fallback stubs.

### Conflict 2: The Router & Navigation Loop
- **CoderAgent**: Emits route definitions in `src/routes.tsx` and wraps the layout in `src/App.tsx`.
- **FastSanitizer (lines 1236-1510)**: AST-parses `App.tsx` and `routes.tsx`. It removes `<BrowserRouter>` if it detects one in both files, replaces `<Navbar />` with `<Layout />`, and regenerates `routes.tsx` from directory file scanning if imports fail.
- **ProjectStartupAgent (line 230)**: Detects that an import in `routes.tsx` points to a missing page $\to$ creates a placeholder component stub (`Placeholder Component Stub`).
- **TemplateContaminationChecker (line 360)**: Scans generated files for `Placeholder Component Stub` and flags it as a `PLACEHOLDER_STUB` violation, failing the build!
  > **Proof**: `ProjectStartupAgent` injects a stub to fix a compile error, and `TemplateContaminationChecker` immediately fails the project because the stub exists.

---

## 6. Known Failure Analysis & Reproduction Status

### A. Destructive Schema Reconciliation (`CartItem.customizations`, `Reservation.status`)
- **Verified Mechanism**:
  1. `FileWriter.ts` (lines 19-31) explicitly blocks LLM updates to `prisma/schema.prisma` if the file already contains any `model [A-Z]`.
  2. `DeterministicProjectFixer.ts` (lines 356-370) scans models declared in the contract. For any model not in `schema.prisma`, it appends a fixed 7-field template:
     ```prisma
     model CartItem {
       id          String   @id @default(uuid())
       userId      String?  @map("user_id")
       name        String   @default("CartItem")
       description String?  @default("")
       category    String?  @default("Standard")
       status      String   @default("Active")
       data        Json?    @default("{}")
       createdAt   DateTime @default(now())
       updatedAt   DateTime @updatedAt
     }
     ```
  3. Domain-specific fields required by the prompt (e.g., `customizations`, `quantity`, `unitPrice`, `partySize`, `reservationTime`) are never written to `schema.prisma`.
  4. Backend code written by `CoderAgent` attempts to query `prisma.cartItem.create({ data: { customizations } })`.
  5. The compiler throws: `Unknown argument 'customizations'`.
  6. Downstream fixers then delete or strip the query argument from the controller rather than adding the field to the schema, resulting in silent data loss!

### B. False-Success Reporting (15/16 Checks Passed)
- **Verified Mechanism**:
  1. In `final-success-gate.ts`, items 10 (`In-Project Test Suite`) and 11 (`Runtime Acceptance & Scenarios`) are hardcoded with `critical: false` (lines 560, 590).
  2. The evaluation function (lines 706-724) filters only `criticalItems.filter(i => !i.passed)`.
  3. If the entire test suite fails, `failedCritical` is empty.
  4. `FinalSuccessGate` prints: `[FINAL STATUS]: SUCCESS` and returns `success: true`.
  5. The CLI exits with code 0, reporting complete success to the user when the application test suite is failing.

### C. Incomplete Code Generation (Truncated Outputs)
- **Verified Mechanism**:
  1. `ProjectStartupAgent.ts` (lines 219-225) detects truncated AI output using regex checks (unclosed braces, trailing tokens).
  2. Instead of triggering regeneration of the truncated file, it logs:
     `console.warn('[Startup] ⚠️ Detected truncated AI output (needs regeneration, not patched): ...')`
  3. It allows the pipeline to proceed directly to compilation!
  4. The truncated file causes a syntax error in `tsc`, which triggers `BuildHealer` or `FastSanitizer` to comment out the truncated block or stub the exports.

### D. Conflicting TypeScript & Import Repairs
- **Verified Mechanism**:
  1. When an import fails, `FastSanitizer` replaces the import with `/* [FastSanitizer] Removed invalid route import */` (line 1092).
  2. If the imported symbol was a React component used in JSX (`<Dashboard />`), JSX compilation fails with `Cannot find name 'Dashboard'`.
  3. `FastSanitizer` then attempts to inject an empty function declaration `function Dashboard() { return null; }`.
  4. This produces a hollow, non-functional component that renders a blank screen while passing `tsc`.

### E. Duplicate Path and Ownership Conflicts
- **Verified Mechanism**:
  - `CanonicalFileGraph.ts` (lines 84-140) contains a hardcoded 39-file graph authored specifically for a "Resume Keyword Scanner" application.
  - When generating an e-commerce, restaurant, or marine engineering project, `SemanticDuplicateDetector.checkBeforeWrite()` evaluates the new paths against this static graph.
  - If a file name resembles one of the aliases (e.g. `scan.controller.ts` vs `inspection.controller.ts`), it triggers `SEMANTIC_DUPLICATE_ERROR` or flags the file as an unauthorized orphan and deletes it.

### F. API Workflow Verification Failures (`POST /api/contacts` 400 vs 201)
- **Verified Mechanism**:
  1. `ApiWorkflowVerifier.ts` (lines 315-349) synthesizes request bodies using a hardcoded catch-all dictionary (`"123 Spice Route Way, Kochi"`, `partySize: 2`, `message: "Test..."`).
  2. For endpoints requiring structured JSON payloads (e.g. `POST /api/contacts` requiring `{ firstName, lastName, email, inquiryType }`), the guessed payload violates the endpoint's Zod schema validation.
  3. The server responds with `HTTP 400 Bad Request`.
  4. Line 378 of `ApiWorkflowVerifier.ts` hardcodes:
     ```ts
     const expectedStatus = ep.method === "POST" ? (ep.path.endsWith("/login") ? 200 : 201) : 200;
     ```
  5. The verifier expects 201, receives 400, and fails the test.
  6. Because no canonical API contract exists between the backend router generator and the test verifier, the test fails on valid endpoints.

---

## 7. False-Success Pathways Summary

The audit identified three distinct structural pathways where Aegis reports success despite catastrophic underlying failures:

```
Pathway 1: Non-Critical Test Gate
In-Project Tests Fail (4/4) ──► final-success-gate.ts (critical: false) ──► [FINAL STATUS]: SUCCESS

Pathway 2: Inverted Test Status
vitest exits with code 1 ──► in-project-test-runner.ts parses 4/4 passed ──► Status: FAIL (4/4 passed)

Pathway 3: Stubbed Failure Masking
Missing component ──► ProjectStartupAgent injects Empty Stub ──► tsc passes ──► Deployed site is blank
```

---

## 8. Proposed Single-Owner Architecture

To fulfill the mandate in `docs/architecture/AEGIS_VISION_AND_ROADMAP.md`, Aegis must transition from multi-fixer mutation to **5 Single-Owner Boundaries**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. REQUIREMENTS & FEATURE MATRIX OWNER                                   │
│    Owner: RequirementsAuthority (.aegis/feature-matrix.json)             │
│    Responsibility: Prompt expansion -> Feature IDs (F01..Fn) with tests  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. CANONICAL CONTRACTS OWNER                                             │
│    Owner: ContractAuthority (.aegis/canonical-contracts.json)            │
│    Responsibility: Authoritative routes, Prisma schema, API Zod schemas  │
│    Rule: No file can be written that violates these locked contracts     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. GENERATION ORCHESTRATOR (ONE OWNER PER FILE)                          │
│    Frontend: CoderAgent (UI & Routes)                                    │
│    Backend: CoderAgent (Controllers & Services)                          │
│    Database: SchemaEngine (Prisma schema derived from ContractAuthority) │
│    Rule: Sanitizers are FORBIDDEN from rewriting UI components or schema │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. INDEPENDENT VERIFICATION ENGINE                                       │
│    Owner: QualityVerificationEngine                                      │
│    Responsibility: Build -> Types -> 1 Test per Feature ID -> Journeys   │
│    Rule: ZERO non-critical gates. If any feature test fails, run FAILS.  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. TARGETED REPAIR & REVALIDATION                                        │
│    Owner: RootCauseRepairEngine                                          │
│    Responsibility: Reconcile code with ContractAuthority; never stub     │
│    Rule: If code is truncated or missing, REGENERATE the file; do not    │
│          inject hollow stubs.                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Prioritized Findings

### Critical Priority (Immediate Architectural Hazards)
1. **Destructive Schema Rewrites**: `DeterministicProjectFixer` stripping domain fields and replacing them with a 7-field generic stub, combined with `writer.ts` blocking LLM schema updates.
2. **False-Success in `FinalSuccessGate`**: Marking `In-Project Test Suite` and `Runtime Acceptance` as `critical: false`, allowing broken test suites to exit 0.
3. **Inverted Exit Code in `InProjectTestRunner`**: Reporting `FAIL (4/4 passed)` due to process exit code misinterpretation.
4. **Hardcoded Monolithic Template Graph**: `CanonicalFileGraph.ts` enforcing a 39-file Resume Keyword Scanner topology on unrelated applications.

### High Priority (Stability & Workflow Hazards)
5. **Contract-Free API Verification**: `ApiWorkflowVerifier` guessing payloads with hardcoded strings and blindly demanding HTTP 201 for all POST routes.
6. **Self-Defeating Stub Injection**: `ProjectStartupAgent` injecting stubs that `TemplateContaminationChecker` immediately flags as fatal violations.
7. **`FastSanitizer` Scope Creep**: 6,686 lines of reactive fixers rewriting UI cards, routers, and styles, overwriting valid CoderAgent implementations.

### Medium Priority (Code Quality & Maintainability)
8. **Fragmented Repair Subsystems**: 16 engines in `autonomous-repair/` and 12 files in `healing/` operating with overlapping, uncoordinated scopes.
9. **Detached File Ownership Registries**: `FileOwnershipRegistry` exists in `file-ownership.ts` but is ignored by `FileWriter` and `FastSanitizer`.

---

## 10. Phased Implementation Plan with Regression Gates

```
Phase 1 (Complete)  ──► Phase 2 (Feature Matrix) ──► Phase 3 (Contracts) ──► Phase 4 (Consolidation)
Audit & Baseline        Traceable F01..Fn IDs        Prisma & Zod locks        Retire FastSanitizer
```

### Milestone 1: Correctness & False-Success Elimination
1. **Fix `InProjectTestRunner`**: Accurately parse Vitest JSON/exit status so `4/4 passed` produces `status: "PASS"`.
2. **Make Gates Strict in `FinalSuccessGate`**: Change `In-Project Test Suite` to `critical: true`. A project with failing unit tests must NEVER be marked `SUCCESS`.
3. **Unblock Schema Evolution in `FileWriter`**: Remove line 26 in `writer.ts` blocking schema updates. Allow the schema authority to write the true canonical model.
4. **Regression Gate**: Run `pnpm --filter @aegis/ai-core test src/brownfield/__tests__/domain-generalization-e2e.test.ts`. All 4 domain tests must pass without inverted status.

### Milestone 2: Feature Matrix & Contract Alignment
1. **Implement `FeatureMatrix`**: Output `.aegis/feature-matrix.json` with explicit IDs (`F01..Fn`).
2. **Harmonize API Verification**: Generate API test cases directly from the contract's Zod request schemas and declared expected status codes instead of guessed catch-all payloads.
3. **Regression Gate**: Execute `POST /api/contacts` in an end-to-end project run; verify payload validation matches contract and returns passing status.

### Milestone 3: Sanitizer Consolidation & Single Ownership
1. **Strip Generative Actions from `FastSanitizer`**: Remove component rewrites, page synthesis, and 3D stage injection from `fast-sanitizer.ts`. Restrict it purely to syntax cleanup (e.g. invalid double extensions).
2. **Enforce `FileWriter` Ownership**: Wire `FileOwnershipRegistry` directly into `FileWriter.write()` so unauthorized components cannot overwrite Coder outputs.
3. **Eliminate Placeholder Stubbing**: Replace `resolveMissingLocalImports` stubbing with a targeted prompt to `CoderAgent` to implement the missing component.

---

## 11. Risks, Unknowns & Required Decisions

1. **Prisma DB Migration In Test Environments**:
   - *Risk*: If PostgreSQL is not running locally during tests, Prisma migrations fail (`P1000`).
   - *Decision*: Standardize on an in-memory SQLite fallback or Docker container check for offline test runs, clearly reported as `DATABASE_OFFLINE` rather than an application code defect.
2. **Coder Token Budgets**:
   - *Risk*: Generating full business models with all fields in a single prompt can exceed context windows.
   - *Decision*: Partition generation strictly by feature ID so the model produces complete, non-truncated files.
3. **Removal of Legacy Tests**:
   - *Risk*: Legacy tests written around the 39-file Resume Scanner graph may fail when `CanonicalFileGraph` is generalized.
   - *Decision*: Update legacy test fixtures to supply their own project graph rather than relying on global hardcoded constants.

---
*End of Phase 1 Audit Report. Awaiting architectural review before executing code refactoring.*
