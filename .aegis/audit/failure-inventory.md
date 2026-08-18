# AEGIS Real-World Generation Audit: Failure Inventory

## Summary of Failures Discovered

During the real-world generation audit using the prompt:
> *"Build a complete production-ready gym management website..."*

The system encountered 5 distinct, critical architectural and runtime failures.

---

### Failure 1: Hardcoded Domain Fallback & Data Model Hijacking

- **Component**: `packages/ai-core/src/governance/canonical-data-model.ts` & `packages/ai-core/src/governance/fast-sanitizer.ts`
- **Location**: `CanonicalDataModelContract.getPrismaSchema()` lines 27–31; `FastDeterministicSanitizer.enforceCanonicalFiles()` lines 572–615
- **Symptom**: 
  - Although `ArchitectureContract` correctly inferred 5 gym models (`User`, `Membership`, `Attendance`, `Payment`, `WorkoutPlan`), `CanonicalDataModelContract` evaluated:
    ```typescript
    const isResume = pLower.includes("resume") || pLower.includes("jobdescription") || pLower.includes("ats") || pLower.includes("keyword");
    const isSecurity = !isResume;
    ```
    Since the prompt does not contain "resume", `isSecurity` was forced to `true`.
  - The generated `prisma/schema.prisma` was replaced with `User`, `Repository`, `Scan`, `Vulnerability`, `Remediation`, `AnalysisResult`.
  - `FastDeterministicSanitizer` replaced the generated gym UI with `AnalyzePage.tsx` ("Code & Resume AST Analyzer") and `DashboardPage.tsx` ("Code Security Scanner & Static Analysis").
- **Root Cause**: The governance layers contain brittle, binary hardcoding that assumes any prompt is either a resume ATS matcher or a static security scanner.

---

### Failure 2: Deterministic TypeScript Compilation Breakage from Sanitizer Regex

- **Component**: `packages/ai-core/src/governance/fast-sanitizer.ts`
- **Location**: Line 465–468
- **Error Trace**:
  ```text
  src/features/analyzer/AnalyzePage.tsx(20,19): error TS2345: Argument of type 'string' is not assignable to parameter of type 'SetStateAction<{ id: string; userEmail: string; userName: string; }>'.
  src/features/analyzer/AnalyzePage.tsx(33,9): error TS2353: Object literal may only specify known properties, and 'score' does not exist in type 'SetStateAction<{ id: string; userEmail: string; userName: string; }>'.
  src/features/analyzer/AnalyzePage.tsx(99,73): error TS2339: Property 'score' does not exist on type '{ id: string; userEmail: string; userName: string; }'.
  ```
- **Symptom**: Running `npm run build` in the generated project exits with code 1.
- **Root Cause**: The sanitizer applies a global regex across all `.tsx` files:
  ```typescript
  content = content.replace(/useState(?:<[^>]+>)?\(null\)/g, 'useState({ id: "demo-user-id", userEmail: "demo@aegis.dev", userName: "Demo User" })');
  ```
  This unconditionally turns *every* state variable initialized with `useState(null)` (including `fileName` and `result`) into an object typed `{ id: string, userEmail: string, userName: string }`, immediately causing TypeScript compilation failures when string or score values are assigned or read.

---

### Failure 3: PNPM Supply-Chain / Minimum-Release-Age Policy Lock Violation

- **Component**: Project Startup & Dependency Installation (`pnpm install`)
- **Error Trace**:
  ```text
  ✗ Lockfile failed supply-chain policy check (454 entries in 6.4s)
  [ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION] 2 lockfile entries failed verification:
    baseline-browser-mapping@2.11.15 was published at 2026-08-17T14:30:35.000Z, within the minimumReleaseAge cutoff (2026-08-16T17:48:01.568Z)
    electron-to-chromium@1.5.408 was published at 2026-08-17T02:02:48.000Z, within the minimumReleaseAge cutoff (2026-08-16T17:48:01.568Z)
  ```
- **Symptom**: `pnpm install` in `generated/project` exited with code 1 during project generation and verification.
- **Root Cause**: The workspace or local environment enforces a strict `minimumReleaseAge` supply-chain verification policy that rejects packages published within the last 24–48 hours unless explicitly allowed in configuration.

---

### Failure 4: Database Authentication Failure During Startup Push

- **Component**: Project Startup Agent (`StartupAgent.runPrismaMigration()`)
- **Error Trace**:
  ```text
  Error: P1000: Authentication failed against database server, the provided database credentials for `postgres` are not valid.
  Please make sure to provide valid database credentials for the database server at the configured address.
  ```
- **Symptom**: Live database migration via `prisma db push` could not run.
- **Root Cause**: The default `.env` generated with `postgresql://postgres:postgres@localhost:5432/gym_db` attempts to connect to a local PostgreSQL instance that is either unconfigured or running with different authentication credentials.

---

### Failure 5: Self-Healing Attempt Loop Exhaustion & Pipeline Abort

- **Component**: `packages/ai-core/src/agent/orchestrator.ts` & `TransactionalRepair`
- **Error Trace**:
  ```text
  ❌ Self-Healing: Build is still failing after maximum repair attempts. Halting pipeline execution.
  Error: Project generation failed: Maximum self-healing attempts reached. Build error: Build failed
      at Orchestrator.generateApplication (packages/ai-core/dist/agent/orchestrator.js:1387:19)
  ```
- **Symptom**: The generation pipeline terminated with an overall execution error and failed the generation run.
- **Root Cause**: The self-healing loop attempted repairs against `server/controllers/auth.controller.ts`, but the underlying failures were the TypeScript type conflicts injected by `FastDeterministicSanitizer` in `src/features/analyzer/AnalyzePage.tsx` and the `pnpm install` release-age policy error. When the build failed again, checkpoints were rolled back, maximum repair attempts (3/3) were exhausted, and orchestrator aborted.
