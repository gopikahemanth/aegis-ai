# Aegis V2.1 Deep Codebase Diagnostic — 03: Contract Flow Audit

**Audit Date:** August 18, 2026  
**Scope:** Architecture Contract, Data Architecture, Plan Gate, Technology Constraint Validator, and Domain Model Guards.

---

## 1. Contract Flow Map

Aegis enforces contract flow through a sequence of formal state objects stored in `.aegis/`:

```
User Prompt
    │
    ▼
[SpecificationNormalizer] ───► Canonical Specification (Domain, Entity Archetypes)
    │
    ▼
[ArchitectureResolver]   ───► ArchitectureContractV1 (.aegis/architecture-contract.json)
    │
    ▼
[CanonicalDataModel]     ───► Data Architecture Contract (.aegis/data-architecture.json + schema.prisma)
    │
    ▼
[PlannerAgent]           ───► Task Plan DAG (Tasks 1..N)
    │
    ▼
[PlanContractGate]       ───► Validates Task Contracts vs ArchitectureContractV1
    │
    ▼
[CoderAgent / PatchEngine] ──► Code Generation conforming to Tier Contracts
```

---

## 2. In-Depth Contract Subsystem Analysis

### 2.1 `ArchitectureContractV1` (`packages/ai-core/src/contracts/architecture-contract.ts`)
Defines the technology stack envelope:
```ts
interface ArchitectureContractV1 {
  framework: "react-vite" | "next" | "express" | "html";
  styling: "tailwind" | "vanilla-css";
  stateManagement: "zustand" | "react-context" | "none";
  database: "postgresql" | "sqlite" | "none";
  orm: "prisma" | "none";
  auth: "jwt" | "session" | "none";
}
```
- **Strengths:** Prevents stack drift across different LLM task calls (e.g. stops one tier from introducing Redux when Zustand was chosen).
- **Vulnerabilities:**
  - `ArchitectureResolver` uses heuristic keyword matching that can misclassify fullstack requests. In our live run, "persistent data" resulted in `backend: "none"`, causing `PlanContractGate` to fail tasks that generated Express/Prisma backends.

### 2.2 `CanonicalDataModelContract` (`packages/ai-core/src/governance/canonical-data-model.ts`)
Derives canonical Prisma models based on domain keywords:
- E-Commerce: `User`, `Product`, `Order`, `OrderItem`
- Social / Feed: `User`, `Post`, `Comment`, `Like`
- Task Management / Kanban: `User`, `Task`, `BoardColumn`, `Project`
- Generic Fallback: `User`, `Item`, `Activity`, `Setting`

**Critical Flaw Discovered (Orchestrator Line 1337):**
In `orchestrator.ts`, line 1337 executes:
```ts
const schemaValidation = CanonicalDataModelContract.validateSchema(schemaContent);
```
Notice that `validateSchema()` is called **without** the prompt or resolved contract argument.
In `canonical-data-model.ts` (line 35):
```ts
public static getRequiredModels(promptOrContract?: string | ArchitectureContractV1): string[] {
  if (!promptOrContract) {
    return ["User", "Item", "Activity"]; // Generic fallback enforced unconditionally!
  }
  ...
}
```
Because the argument was omitted, every specialized schema (such as Kanban `Task`, `BoardColumn`) is declared invalid by `validateSchema()`, triggering an automatic overwrite:
```
[PRISMA] ⚠️ Schema missing canonical models: Item, Activity. Replacing with canonical schema.
[PRISMA] ✓ Replaced schema with canonical contract.
```
This forces generic `Item`/`Activity` models into every generated database, obliterating domain-specific schemas!

### 2.3 `PlanContractGate` (`packages/ai-core/src/governance/plan-contract-gate.ts`)
- Inspects tasks emitted by `PlannerAgent`.
- Validates that task outputs align with the locked stack.
- Rejects plans if forbidden frameworks (e.g. `vue`, `angular`) or mismatched backend layers are introduced.
- In our live generation, this gate successfully rejected conflicting tasks on attempt 1 and forced a clean replan.

### 2.4 `DomainModelGuard` (`packages/ai-core/src/governance/domain-model-guard.ts`)
- Enforces relational consistency across Prisma models (e.g. ensures `onDelete: Cascade` and foreign key fields are well-formed).
