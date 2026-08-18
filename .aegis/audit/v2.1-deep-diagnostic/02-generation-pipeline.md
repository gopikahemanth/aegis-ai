# Aegis V2.1 Deep Codebase Diagnostic — 02: Generation Pipeline

**Audit Date:** August 18, 2026  
**Scope:** Complete generation lifecycle tracing from CLI invocation to build verification and failure halting.

---

## 1. Complete Invocation Trace

When a user runs `aegis create "..."` or `pnpm cli create "..."`, the call stack progresses through four major phases:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant CLI as apps/cli
    participant EE as ExecutionEngine
    participant Orch as Orchestrator
    participant Creator as ProjectCreator
    participant Startup as ProjectStartupAgent
    participant Verifier as BuildOrchestrator / Sandbox
    participant Healer as TransactionalRepair / SelfHealer

    User->>CLI: pnpm cli create "<prompt>"
    CLI->>EE: execute(prompt, "./generated/project")
    
    Note over EE,Orch: Phase 1: Pre-generation Planning
    EE->>Orch: generateProject(prompt, projectPath)
    Orch->>Orch: ArchitectAgent + Normalizer + Resolver (Pass 1)
    
    Note over EE,Creator: Phase 2: Template Scaffolding
    EE->>Creator: create(normalizedFramework, projectPath)
    
    Note over EE,Orch: Phase 3: Application Code Generation
    EE->>Orch: generateApplication(prompt, projectPath)
    Orch->>Orch: ArchitectAgent + Resolver + DataModel (Pass 2 - Duplicate!)
    Orch->>Orch: Planner DAG (Tiers 1-4)
    Orch->>Orch: CoderAgent (Tiered execution)
    Orch->>Orch: ReviewerAgent & PatchEngine
    Orch->>Startup: prepare(projectPath)
    Startup->>Startup: Inject missing files + pnpm install + Prisma client
    Orch->>Verifier: verify(projectPath)
    
    alt Verification Failure
        Verifier-->>Orch: Failure (Browser runtime error / TS error)
        Orch->>Healer: Attempt repair 1/3, 2/3, 3/3
        Healer-->>Orch: Checkpoint & Rollback on regression
    end
```

---

## 2. Granular Stage-by-Stage Breakdown

### Stage 1: CLI Entry & Path Resolution
- **File:** `apps/cli/src/commands/create.ts`
- Instantiates `ExecutionEngine` with default output directory `./generated/project`.
- **Finding:** Under `pnpm --filter @aegis/cli dev`, child `process.cwd()` is `apps/cli`, resolving output to `apps/cli/generated/project`.

### Stage 2: Phase 1 — `Orchestrator.generateProject()`
- **File:** `packages/ai-core/src/agent/orchestrator.ts` (`lines 380–470`)
- Calls `SpecificationNormalizer.normalize(request)` and `ArchitectureResolver.resolve(normalizedSpec)`.
- Derives `ArchitectureContractV1` and writes `.aegis/architecture-contract.json`.

### Stage 3: Phase 2 — `ProjectCreator.create()`
- **File:** `packages/project-builder/src/project-creator.ts`
- Extracts template files matching `normalizedFramework` (e.g. `react-vite`).

### Stage 4: Phase 3 — `Orchestrator.generateApplication()` (Duplicate Inference Flaw)
- **File:** `packages/ai-core/src/agent/orchestrator.ts` (`lines 475–510`)
- **Flaw:** Unlinks `.aegis/architecture-contract.json` and `.aegis/data-architecture.json` in a cache wipe, and **re-runs all AI architecture and specification calls from scratch**, doubling token consumption and adding 40–70s of redundant latency.

### Stage 5: Architecture & Data Modeling Lock
- **File:** `packages/ai-core/src/agent/orchestrator.ts` (`lines 700–780`)
- Calls `CanonicalDataModelContract.generatePrismaSchema(request, resolvedContract)`.
- Writes `prisma/schema.prisma` and `.env` (`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/..."`).

### Stage 6: Planner DAG & Task Contract Validation
- **File:** `packages/ai-core/src/agent/planner.ts` & `plan-contract-gate.ts`
- Breaks application into sequential tiers (Tier 1: Design Tokens/Types, Tier 2: State/Store, Tier 3: Feature Components, Tier 4: App Entry/Routes).
- `PlanContractGate` inspects generated tasks against locked contract. In our live run, `PlanContractGate` caught a backend mismatch on Attempt 1 and successfully triggered regeneration.

### Stage 7: Coder Implementation & Inline Self-Healing
- **File:** `packages/ai-core/src/agent/orchestrator.ts` (`lines 950–1200`)
- Executes coder LLM calls tier-by-tier.
- Inspects generated code for truncation (`isLikelySyntacticallyComplete`). In our live run, it detected truncated files (`KanbanBoard.tsx`, `store.tsx`) and automatically repaired them before proceeding.

### Stage 8: Post-Generation Sanitization & Project Graph Validation
- **Files:** `packages/ai-core/src/governance/fast-sanitizer.ts`, `packages/ai-core/src/validation/project-graph-engine.ts`
- Cleans up casing collisions, fixes duplicate exports, and reconciles relative imports across the project graph.

### Stage 9: Project Startup Agent
- **File:** `packages/ai-core/src/startup/project-startup-agent.ts`
- Injects missing configuration files (`vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `.npmrc`).
- Generates Prisma client using `prisma generate`.
- Handles `P1000` database connection failures gracefully by falling back to static schema validation.

### Stage 10: Build Verification & Live Sandbox Browser Test
- **Files:** `packages/ai-core/src/build/build-orchestrator.ts`, `packages/ai-core/src/build/sandbox-verifier.ts`
- Step 1: Executes `tsc && vite build`.
- Step 2: Spawns Vite dev server on port 5173.
- Step 3: Launches Puppeteer headless browser, navigates to `http://localhost:5173`, takes `screenshot.png`, and monitors console logs for runtime exceptions.

### Stage 11: Transactional Repair & Rollback Loop
- **File:** `packages/ai-core/src/healing/transactional-repair.ts`
- When browser verification fails (e.g. missing `<BrowserRouter>` wrapper), invokes `HealerAgent`.
- Takes a transactional checkpoint of modified files. If the healer's patch introduces compilation regressions (e.g. `TS2820` / `TS2304`), `TransactionalRepair` rolls back disk state.
- Halts after 3 failed repair attempts with `Maximum self-healing attempts reached`.
