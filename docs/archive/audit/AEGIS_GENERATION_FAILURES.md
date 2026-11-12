# 💥 Aegis AI — Reproduced Generation Failures & Root Cause Analysis

**Date**: November 5, 2026  
**Auditor**: Aegis AI Principal Architect & Autonomous Debugging Engineer  

---

## Failure 1: Windows Broken Junctions Halt Clean Generation

### 1. Responsible Code
- [`packages/project-builder/src/utils/clean-directory.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/project-builder/src/utils/clean-directory.ts#L9)

### 2. Suspected Root Cause
`cleanDirectory(targetPath)` checks `if (!existsSync(targetPath)) return;`. On Windows, when `targetPath` or any directory inside it contains a junction/symlink whose destination has been moved or deleted (e.g. `node_modules [\??\...\projects\fresh-restaurant-ordering-20261015\node_modules]`), Node's `existsSync()` evaluates the target and returns `false`. However, the directory entry still physically exists in NTFS. When `cleanDirectory()` returns early, subsequent calls to `mkdirSync` or `symlinkSync` fail with:
`EEXIST: file already exists, mkdir ...`

### 3. Reproducible Scenario
1. Create a junction inside a temporary folder pointing to a non-existent path:
   ```cmd
   mklink /J test_dir\broken_link C:\non_existent_folder_xyz
   ```
2. Call `cleanDirectory("test_dir")`.
3. Attempt to recreate `test_dir`.

### 4. Captured Result
`existsSync("test_dir\\broken_link")` returns `false`. `cleanDirectory` exits without calling `rmSync` or PowerShell cleanup. On recreation, `EEXIST` error is thrown, halting project creation.

### 5. Confirmation
**Confirmed Defect (P0)**. Directly observed in `generated/project/node_modules`, which was an orphaned junction pointing to `C:\Users\vishn\OneDrive\Desktop\Projects\aegis-ai\projects\fresh-restaurant-ordering-20261015\node_modules`.

### 6. Smallest Correct Architectural Fix
Use `lstatSync` rather than `existsSync` to check for junction/symlink existence, and on Windows execute `cmd /c rmdir /s /q` or PowerShell `Remove-Item -Force -Recurse` to cleanly unlink junctions before recreation.

---

## Failure 2: Database Blocked Masked as Total Success by ExecutionEngine

### 1. Responsible Code
- [`packages/agent-runtime/src/execution-engine.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/agent-runtime/src/execution-engine.ts#L163-L170)
- [`packages/ai-core/src/agent/orchestrator.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/orchestrator.ts#L3562)

### 2. Suspected Root Cause
In `orchestrator.ts`:
```ts
if (!finalGateResult.success && finalGateResult.status !== "BLOCKED") {
  throw new Error(`Project generation failed: ${finalGateResult.blockingReason}`);
}
```
When `finalGateResult.status === "BLOCKED"` (e.g. PostgreSQL port 5432 is offline), `generateApplication()` does not throw an error. It proceeds to return `{ filesCreated: ... }`.
Then, in `ExecutionEngine.execute()`:
```ts
const generated = await this.orchestrator.generateApplication(...);
const pipeline = await this.pipeline.execute(request, projectPath);
return pipeline.success;
```
`pipeline.execute()` only executes `this.builder.build("pnpm", projectPath)` (`tsc` + `vite build`). Since the frontend and TypeScript code compile cleanly, `pipeline.success` is `true`.
The CLI receives `true` and prints:
`🎉 Project generated successfully.`

### 3. Reproducible Scenario
1. Stop local PostgreSQL service.
2. Run `aegis create "Build a Coffee Roastery Store with customer orders and inventory"`.
3. Observe CLI output upon completion.

### 4. Captured Result
`FinalSuccessGate` accurately logs:
`[FINAL STATUS]: BLOCKED (14/17 checks passed). Code: PASS, Runtime: PARTIALLY_VERIFIED`
`DATABASE_BLOCKED: External database connection unavailable (P1000/ECONNREFUSED).`
Yet the CLI exits with code 0 and announces:
`🎉 Project generated successfully.`

### 5. Confirmation
**Confirmed Defect (P0)**. This violates Section 9 of the mandate: *"Never count blocked, skipped, or crashed checks as passed. If an external credential is missing, report exactly what is blocked. Do not pretend the integration was verified."*

### 6. Smallest Correct Architectural Fix
Make `generateApplication` return the complete `finalGateResult`. In `ExecutionEngine.execute()`, check `gateResult.status`. If `BLOCKED`, return an explicit status object `{ success: false, status: "BLOCKED", reason: gateResult.blockingReason }` and have the CLI print:
`⚠️ Project generated with limitations: Database verification is BLOCKED (PostgreSQL unavailable). Code is PASS.`

---

## Failure 3: Feature Matrix Not Persisted on Greenfield Generations

### 1. Responsible Code
- [`packages/ai-core/src/agent/orchestrator.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/agent/orchestrator.ts#L932)
- [`packages/ai-core/src/contracts/feature-matrix.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/contracts/feature-matrix.ts)

### 2. Suspected Root Cause
`ProductDiscoveryAgent.discover()` returns a matrix object with features and models. However, `Orchestrator` never converts this discovered matrix into the versioned `FeatureMatrixManager` format or calls `FeatureMatrixManager.saveToProject(outputDirectory, matrix)`.
As a result, `.aegis/feature-matrix.json` is never written to disk during greenfield generations.

### 3. Reproducible Scenario
1. Run a greenfield generation for any prompt.
2. Inspect the output `.aegis/` folder:
   `Get-ChildItem generated/project/.aegis`
3. Call `FeatureAdder.addFeature("generated/project", { featureName: "User Reviews" })`.

### 4. Captured Result
`.aegis/feature-matrix.json` is missing.
`FeatureMatrixManager.loadFromProject()` logs:
`[FeatureMatrixManager] Failed to load feature matrix from .../feature-matrix.json: ENOENT`
`FeatureAdder` falls back to initializing a blank matrix, deleting the record of all original features.

### 5. Confirmation
**Confirmed Defect (P1)**. Confirmed by inspecting `generated/project/.aegis` where `.aegis/feature-matrix.json` is missing.

### 6. Smallest Correct Architectural Fix
In `Orchestrator.generateApplication()`, immediately after `ProductDiscoveryAgent.discover()`, convert the discovered features into `FeatureDefinition[]` with assigned IDs (`F01..Fn`), generate the canonical `FeatureMatrix`, and call `FeatureMatrixManager.saveToProject(outputDirectory, canonicalMatrix)`.

---

## Failure 4: Domain Contamination via Generic Service Stubbing

### 1. Responsible Code
- [`packages/ai-core/src/startup/project-startup-agent.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/startup/project-startup-agent.ts#L3460-L3473)

### 2. Suspected Root Cause
In `resolveMissingLocalImports()`:
```ts
if (componentName.toLowerCase().includes("service") || relUnresolved.includes("service")) {
  writeFileSync(fullStubPath, `export const ${validExportName} = {
    async getDashboardStats() {
      return {
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        byDepartment: {},
        bySemester: {},
        recentStudents: [],
      };
    },
    async getStudents(filters?: any) { return []; },
  };
  export default ${validExportName};
  `, "utf8");
}
```
If any generated code imports an unresolved service file (e.g. `import inventoryService from "@/services/inventoryService"`), `ProjectStartupAgent` writes student metrics (`totalStudents`, `byDepartment`, `bySemester`) into the project!

### 3. Reproducible Scenario
1. Generate an industrial equipment or e-commerce application that imports `equipmentService`.
2. If `equipmentService.ts` is omitted or delayed, `resolveMissingLocalImports` creates the stub.
3. Read the generated service stub file.

### 4. Captured Result
`src/services/equipmentService.ts` contains `totalStudents: 0` and `getStudents()`.
Downstream `DomainContaminationValidator` then flags the project as contaminated with student portal vocabulary.

### 5. Confirmation
**Confirmed Defect (P1)**. Confirmed in source code at line 3460 of `project-startup-agent.ts`.

### 6. Smallest Correct Architectural Fix
Replace hardcoded student fields with a neutral, domain-agnostic generic service stub:
```ts
export const ${validExportName} = {
  async getAll() { return []; },
  async getById(id: any) { return { id }; },
  async create(data: any) { return { id: Date.now(), ...data }; },
  async update(id: any, data: any) { return { id, ...data }; },
  async delete(id: any) { return true; },
  async getStats() { return { total: 0, active: 0, recent: [] }; },
};
```

---

## Failure 5: FastSanitizer Card Overrides & Duplicate Export Collisions

### 1. Responsible Code
- [`packages/ai-core/src/governance/fast-sanitizer.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/governance/fast-sanitizer.ts#L389-L498)

### 2. Suspected Root Cause
`FastSanitizer.enforceGenericComponents()` attempts to ensure subcomponents (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) exist.
If the component is formatted with non-standard whitespace or const functions, FastSanitizer:
1. Appends duplicate subcomponents to the bottom of `src/shared/components/Card.tsx`.
2. On subsequent runs, detects multiple `export default` or `export const Card` declarations (`cardDeclCount > 1`).
3. Declares the file corrupted and completely replaces it with a hardcoded template (`bg-white/85` or `rgba(15, 23, 42, 0.6)`).

### 3. Reproducible Scenario
1. Create a custom-designed `Card.tsx` with theme tokens (e.g., `#2b4c3f` border, serif fonts).
2. Invoke `FastSanitizer.sanitizeProject(projectRoot)`.
3. Check `Card.tsx` content.

### 4. Captured Result
Custom styling is deleted and replaced with generic fallback slate/cream styling.

### 5. Confirmation
**Confirmed Defect (P1)**. Confirmed in `fast-sanitizer.ts` lines 468-475.

### 6. Smallest Correct Architectural Fix
Strip generative card rewriting from `FastSanitizer`. If subcomponents are missing, use AST verification to inject only non-conflicting exports, and never overwrite the root `<Card>` container styling generated by `DesignDirector` / `CoderAgent`.

---

## Failure 6: Functional Completeness Check Omitted from Final Gate

### 1. Responsible Code
- [`packages/ai-core/src/validation/final-success-gate.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/validation/final-success-gate.ts)
- [`packages/ai-core/src/benchmark/functional-completeness-auditor.ts`](file:///c:/Users/vishn/OneDrive/Desktop/Projects/aegis-ai/packages/ai-core/src/benchmark/functional-completeness-auditor.ts)

### 2. Suspected Root Cause
`FunctionalCompletenessAuditor` (which checks for inert buttons, dead forms, disconnected search, and fake auth) was implemented in `packages/ai-core/src/benchmark/functional-completeness-auditor.ts` for benchmarking, but never added as a mandatory verification check in `FinalSuccessGate.verify()`.

### 3. Reproducible Scenario
1. Create a component with `<button onClick={() => {}}>Submit</button>` and `<form onSubmit={(e) => e.preventDefault()}><input /><button type="submit">Go</button></form>`.
2. Run `FinalSuccessGate.verify()`.

### 4. Captured Result
`FinalSuccessGate` reports `[FINAL STATUS]: SUCCESS (17/17 checks passed)` because `RealityChecker` only checks AST component exports, missing the inert button and dead form.

### 5. Confirmation
**Confirmed Defect (P1)**. Confirmed in `final-success-gate.ts` where `FunctionalCompletenessAuditor` is absent from items.

### 6. Smallest Correct Architectural Fix
Add `FunctionalCompletenessAuditor.audit(projectRoot)` to `FinalSuccessGate.verify()`. If inert buttons or dead forms are detected in mandatory feature routes, fail or warn the gate accordingly.
