# Changelog

All notable changes to the Aegis AI Autonomous Software Engineering Platform are documented in this file.

## [2.2.0] — 2026-08-21

### Overview
Aegis V2.2.0 is the major release introducing authoritative dual-mode software engineering: **Autonomous Greenfield Generation** and **Safe Brownfield Incremental Evolution**, governed end-to-end by the authoritative `FinalSuccessGate`.

---

### Key Capabilities

#### 1. Autonomous Greenfield Generation
- **Canonical Architecture Normalization:** Specification normalizer and architecture resolver establish immutable project contracts (`planHash`) with zero duplicate planning passes.
- **Coder DAG Parallelism:** Independent file generation tasks execute concurrently across frontend and backend boundaries.
- **Dependency Installation Optimization:** Deterministic dependency resolution and preflight caching.
- **Transactional Self-Healing:** Monotonic diagnostic error reduction with automatic checkpoint rollback on repair regression.
- **Multimodal Visual Review:** Visual design review and layout verification.

#### 2. Automated In-Project Testing
- **TestGeneratorAgent:** Synthesizes non-trivial, contract-tested Vitest/Jest suites for generated components and backend APIs.
- **Anti-Triviality Validation:** Scans for and rejects trivial assertions (`expect(true).toBe(true)`), mock-only tests, and empty bodies.
- **InProjectTestRunner:** Subprocess execution of in-project tests emitting structured test execution reports directly into `FinalSuccessGate`.

#### 3. Safe Brownfield Incremental Evolution
- **RepositoryScanner & BrownfieldProjectContract:** Structural analysis of existing codebases, dependency closures, and frameworks.
- **ImpactClosureEngine:** AST-level caller and reference traversal deriving closed impact sets across fullstack layers.
- **ASTSymbolPatchPlanner:** Autonomous derivation of multi-layer propagation plans covering Prisma schema, TypeScript types/DTOs, service layer, controller, API routes, hooks, and React UI components.
- **BrownfieldGitGuard & WriteGuard:** Safe staging of explicitly touched files only (`git add -- file1 file2...`), never staging unrelated user files (`git add .` strictly prohibited).
- **BrownfieldTransactionManager:** Atomic multi-file checkpoint creation with bit-for-bit rollback equality on failure.
- **BaselineRegressionValidator:** Pre-change test suite execution verifying no pre-existing regressions before patch application.

#### 4. Unified FinalSuccessGate Authority
- Authoritative dual-mode gate evaluating runtime evidence:
  - **GREENFIELD Mode:** 10 fullstack criteria (Architecture, Domain, Schema, Closure, Build, Server, Browser Runtime, API Workflows, Feature Reality, Database).
  - **BROWNFIELD Mode:** 10 evidence criteria (Baseline Regression, Impact Closure, Patch Convergence, Git Cleanliness, Build & Types, Test Execution, Runtime & API, Feature Reality, Domain Isolation, Transaction State).
- Rejects fabricated success booleans in favor of structured reports from underlying compilers, runners, and HTTP callers.

---

### Verification Summary
- **Monorepo Test Suite:** 743/743 test files, 1332/1332 tests passing (100%).
- **Brownfield Test Suite:** 21/21 test files, 117/117 tests passing (100%).
- **FinalSuccessGate Suite:** 12/12 tests passing (100%).
- **Workspace Build:** 6/6 packages clean (0 errors).

---

### Release Lineage
- `v2.1.0-stabilized` (989e2b9)
- `v2.2.0-test-generator` (baadb59)
- `v2.2.1-brownfield-safe-additive` (04192ed)
- `v2.2.2-brownfield-symbol-modification` (a762222)
- `v2.2.3-brownfield-react-state` (e826c2f)
- `v2.2.4-brownfield-fullstack-propagation` (4ad9d69)
- `v2.2.5-brownfield-fully-verified` (b250903) — *Internal Engineering Milestone*
- **`v2.2.0`** — *Official Product Release*
