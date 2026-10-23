# AEGIS AI — TARGET ARCHITECTURE & SUBSYSTEM OWNERSHIP MAP

## 1. Executive Summary

Phase 6 establishes a clear, modular, single-owner architecture for Aegis AI. Every decision, file modification, repair, and verification task is assigned to an authoritative subsystem. Overlapping fixers and competing agent writes are eliminated at the physical write boundary.

---

## 2. Core Subsystems & Authorities

```
                              ┌──────────────────────────────────┐
                              │       Generation Orchestrator    │
                              │         (Orchestrator.ts)        │
                              └────────────────┬─────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│    Requirements Authority    │ │      Contract Authority      │ │  Design & Research Systems   │
│   (FeatureMatrixManager)     │ │   (CanonicalContractManager) │ │ (Theme & Research Engines)   │
└──────────────┬───────────────┘ └─────────────┬────────────────┘ └──────────────┬───────────────┘
               │                               │                                 │
               └───────────────────────────────┼─────────────────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │      Authorized File Writer      │
                              │     (AuthorizedFileWriter.ts)    │
                              │  - Content hash verification     │
                              │  - Concurrent lock tracking      │
                              │  - Single-owner boundary check   │
                              └────────────────┬─────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌──────────────────────────────┐                              ┌──────────────────────────────────┐
│    Brownfield Edit Engine    │                              │     Independent Verification     │
│   (EditEngine & UndoMgr)     │                              │    (UnifiedVerificationEngine)   │
└──────────────┬───────────────┘                              └────────────────┬─────────────────┘
               │                                                               │
               ▼                                                               ▼
┌──────────────────────────────┐                              ┌──────────────────────────────────┐
│    Bounded Repair Engine     │                              │        Final Success Gate        │
│   (BoundedRepairEngine.ts)   │                              │      (FinalSuccessGate.ts)       │
│  - Max bounded retries       │                              │  - PASS / FAIL / BLOCKED         │
│  - No test weakening         │                              │  - Honest evidence reporting     │
│  - Ineffective loop stop     │                              └──────────────────────────────────┘
└──────────────────────────────┘
```

---

## 3. The 9 Core Authorities

### 1. Requirements Authority (`FeatureMatrixManager`)
- **Responsibility**: Owns user requirements, priority levels (`must-have`, `should-have`, `optional`), stable IDs (`F01..Fn`), and acceptance test mapping.
- **Inviolable Invariant**: No fixer or optimizer may delete an explicit user-requested feature.

### 2. Contract Authority (`CanonicalContractManager` / `DynamicDataModelContract`)
- **Responsibility**: Owns alignment between routes, API request/response contracts, Prisma models, and Zod validation rules.
- **Inviolable Invariant**: Preserves domain models (e.g. `CartItem.customizations`, `Reservation.status`) and prevents crude stubbing.

### 3. Generation Orchestrator (`Orchestrator`)
- **Responsibility**: Coordinates end-to-end greenfield planning, assigning role ownership to generated files.

### 4. Design & Research Systems (`ThemeGenerator`, `DesignBriefGenerator`, `ReferenceResearchEngine`)
- **Responsibility**: Generates original visual themes with WCAG AA compliance and discovers domain features from reference websites without copying proprietary code or text.

### 5. Authorized File-Writing Layer (`AuthorizedFileWriter`, `FileOwnershipRegistry`)
- **Responsibility**: Single authoritative gatekeeper for all disk mutations.
  - Verifies writer role ownership before writing.
  - Compares SHA-256 base hashes to detect unexpected external modifications.
  - Prevents concurrent competing writes via active mutex locks.
  - Enforces change scope boundaries.

### 6. Brownfield Edit Engine (`EditEngine`, `NaturalLanguageIntentParser`, `ProjectDependencyGraph`, `FeatureAdder`, `FeatureRemover`, `ThemeModifier`, `UndoManager`)
- **Responsibility**: Natural-language modification of existing applications.
  - Preserves shared components (`Card`, `Button`, `Table`).
  - Creates atomic checkpoints (`.aegis/checkpoints/<id>.json`).
  - Supports multi-run rollback via `aegis undo`.

### 7. Verification Engine (`UnifiedVerificationEngine`)
- **Responsibility**: Independent quality evaluation decoupled from generation.
  - Audits syntax, brace balance, relative import resolution, schema validity, and theme tokens.

### 8. Repair Engine (`BoundedRepairEngine`)
- **Responsibility**: Diagnoses root causes and applies targeted, authorized repairs.
  - Distinguishes code failures (`APPLICATION_FAILURE`) from environment issues (`INFRASTRUCTURE_BLOCKED`).
  - Detects ineffective repeated repairs and halts boundedly (max 3 retries).
  - Never drops domain fields, silences errors, or weakens tests.

### 9. Final Success Gate (`FinalSuccessGate`)
- **Responsibility**: Reports true outcome (`PASS`, `FAIL`, `BLOCKED`, `CRASHED`, `TIMED_OUT`, `SKIPPED`) without fabricating success.

---

## 4. Subsystem Ownership Map

| Role | Owned Paths / Artifacts | Permitted Mutation |
| :--- | :--- | :--- |
| **`RequirementsAuthority`** | `.aegis/feature-matrix.json` | Adds/updates feature definitions and test criteria. |
| **`ContractAuthority`** | `.aegis/canonical-contract.json`, `.aegis/architecture-contract.json` | Harmonizes route, API, and model contracts. |
| **`AuthorizedSchemaManager`** | `prisma/schema.prisma` | Single owner of database schemas; non-destructive reconciliation. |
| **`DesignSystem`** | `src/index.css`, `.aegis/theme.json`, `.aegis/design-brief.json`, `src/shared/components/` | CSS design tokens, typography, shared UI primitives. |
| **`BackendAgent`** | `server/**`, `src/server/**` | Express routes, middleware, controllers, business logic. |
| **`FrontendAgent`** | `src/pages/**`, `src/components/**`, `src/routes.tsx`, `index.html` | Page components, routing, client state. |
| **`DevOps`** | `package.json`, `tsconfig.json`, `vite.config.ts`, Dockerfiles | Tooling, dependencies, build configurations. |
| **`SafeRepairCoordinator`** | Authorized target of active repair ticket | Targeted bug repair applied through authorized owner. |
| **`System`** | Root scaffold files | Initial bootstrap only. |

---

## 5. Inviolable Governance Rules

1. **No Test Weakening**: Passing tests must never be manufactured by deleting assertions or replacing tests with dummy stubs.
2. **No Field Dropping**: Schema fixers must never drop domain fields (`customizations`, `partySize`, `status`) to silence compiler warnings.
3. **No Unprovenanced Overwrites**: Validators and sanitizers report issues; they do not independently overwrite user-authored code or designs.
4. **Scope Isolation**: Single-page edits (e.g. "Only redesign the home page hero") must never modify unrelated routes or backend code.
5. **Durable Rollback**: Every destructive or brownfield operation preserves a recoverable pre-change checkpoint.
