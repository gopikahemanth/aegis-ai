# 🛡️ Aegis AI — Master Roadmap & Phase Execution Tracker

This tracker serves as the authoritative source of truth for the phased evolution of Aegis AI according to the **Aegis — Complete Product Vision & Requirements** roadmap.

---

## Roadmap Phases Summary

| Phase | Name | Status | Primary Focus |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Foundation and Safe Cleanup** | **COMPLETED** | Recoverable checkpoint (`git tag pre-simplify`), baseline audit (34/34 passed), 3 golden generation & 3 golden edit scenarios (8/8 passed), module usage measurement (1,157 files, 195 unexported), repair architecture inspection, safe cleanup candidate cataloging without premature deletion |
| **Phase 1** | **Remove Template Sameness & Stop Clashing Sanitizers** | **COMPLETED** | Delete fantasy copy leaks, prevent Card/component replacement in `fast-sanitizer.ts`, append missing exports without clobbering styling, remove obsolete domain keywords (`resumeUpload`, `ArtworkCard`), WebGL SwiftShader verification |
| **Phase 2** | **Prove "Every Feature Works" (Feature Matrix & Verifiable Tests)** | **COMPLETED** | Formal Requirements Authority (`F01..Fn`), locked `.aegis/feature-matrix.json`, canonical application contracts, schema evolution invariance, contract-driven API verification |
| **Phase 3** | **Original Design & Theme Generator** | **NOT STARTED** | Per-project design brief, hue-to-palette theme generator with contrast checks, curated 30-pair font library, curated hand-made components, cross-project similarity gate |
| **Phase 4** | **Learn from Real Sites** | **NOT STARTED** | Reference-site research with headless browser extraction (study structure & flows, never copy code/assets), automated Feature Matrix synthesis |
| **Phase 5** | **Brownfield & AST-Safe Editing Engine** | **NOT STARTED** | Impact analysis, patch planning, transactional application, dead file & import cleanup, rollback on failure, `aegis undo` |
| **Phase 6** | **Simplify Aegis Architecture** | **NOT STARTED** | Merge overlapping gates into unified Quality check, convert destructive fixers to report-only, single-owner LLM generation flow, reduce ai-core footprint |
| **Phase 7** | **Lovable-like Experience & Supported Delivery** | **NOT STARTED** | Web chat UI, split live preview, reactive dev server orchestration, one-command deployment (Vercel, Railway, Docker) |

---

## Detailed Phase Breakdown

### Phase 0: Foundation and Safe Cleanup
- **Status**: **COMPLETED** (Verified with git checkpoint, test baseline, golden scenario suite, module usage measurement, and repair inspection)
- **Objectives**:
  - Establish a recoverable checkpoint (`git tag pre-simplify`).
  - Run the current framework baseline across test suites and generation pipelines.
  - Implement three distinct golden generation scenarios (Thalassa Underwater Habitat, OrbitalSync Operations, Veloce Atelier).
  - Implement three golden editing scenarios (Add a page, Change theme, Remove a feature).
  - Measure real module usage (inspect loaded vs dead modules with coverage).
  - Inspect repair architecture & gate overlap (`fast-sanitizer`, `autonomous-repair/`, `healing/`, gate sprawl).
  - Identify safe cleanup candidates (loose root scripts, dead test generators) without deleting files prematurely.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/scenarios/` (`golden-scenarios.ts`, `__tests__/golden-scenarios.test.ts`)
  - `packages/ai-core/scripts/measure-module-usage.mjs`
  - `packages/ai-core/src/governance/fast-sanitizer.ts`
  - `docs/architecture/AEGIS_ROADMAP_TRACKER.md`
- **Acceptance Criteria & Verification Evidence**:
  1. Checkpoint `pre-simplify` tagged and verifiable via git: **PASS** (`f2ddeac352eb1e57962951d2e0cfd8dbc66e7ba9`).
  2. Baseline test execution results documented with exact pass/fail counts: **PASS** (34/34 tests passed across contracts, validation, template leak, and brownfield suites).
  3. 3 golden generation prompts and 3 golden edit scenarios established and runnable: **PASS** (`golden-scenarios.test.ts`: 8/8 tests passed).
  4. Module usage and dead file audit documented with evidence: **PASS** (1,157 total TS source files, 171,183 lines, 962 reachable, 195 unreachable from `src/index.ts`, 7 speculative directories identified).
  5. Safe cleanup candidates cataloged with impact risk analysis before any deletion: **PASS** (13 loose root/ai-core scripts identified; `pet-grooming-suite-generator.ts` cataloged for quarantine to `evals/`; zero premature deletions executed).
- **Tests & Evidence Required**:
  - Git tag verification: `git tag -l pre-simplify`
  - Baseline vitest reports: `canonical-contract-milestone2.test.ts`, `final-success-gate-milestone1.test.ts`, `in-project-test-runner-milestone1.test.ts`, `template-phrase-leak.test.ts`, `domain-generalization-e2e.test.ts`
  - Golden scenario execution suite: `golden-scenarios.test.ts`
- **Known Risks & Dependencies**:
  - Unexported files must not be deleted blindly until downstream CLI, test runners, and dynamic import paths are completely audited.

---

### Phase 1: Remove Template Sameness & Stop Clashing Sanitizers
- **Status**: **COMPLETED** (Verified via non-destructive sanitizer refactor, elimination of hardcoded keyword branches, zero template leaks, and WebGL headless validation)
- **Objectives**:
  - Eliminate hardcoded template sameness across generated sites.
  - Dynamically synthesize layout composition DAGs per domain.
  - Generate domain-tailored color palettes and typography pairings.
  - **Stop overwriting working files in `fast-sanitizer.ts`**: Replace destructive Card/Tabs/Table rewrite with append missing exports only; never overwrite LLM styling or classes.
  - Delete obsolete prompt-specific keywords (`resumeUpload`, `ArtworkCard`) from `canonical-file-graph.ts` and `domain-contamination-detector.ts`.
  - Prevent template phrase leaks via blocklist validation (`template-contamination-checker.ts`).
  - Support hardware-accelerated WebGL headless validation with non-blank canvas pixel variance checks.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/governance/fast-sanitizer.ts` (Card, Tabs, Table non-destructive refactor)
  - `packages/ai-core/src/governance/canonical-file-graph.ts` (`useResumeUpload` made non-mandatory)
  - `packages/ai-core/src/design/` (`domain-visual-contract.ts`, `candidate-composition-synthesizer.ts`)
  - `packages/ai-core/src/validation/` (`template-contamination-checker.ts`, `chromium-args.ts`)
- **Acceptance Criteria & Verification Evidence**:
  1. `fast-sanitizer.ts` appends missing exports without replacing LLM `Card.tsx`, `Tabs.tsx`, or `Table.tsx`, preserving custom styles: **PASS**.
  2. Legacy prompt rules (`resumeUpload`, `ArtworkCard`) made non-mandatory in canonical file graph: **PASS**.
  3. Clean builds produce 0 template phrase leaks: **PASS** (`template-phrase-leak.test.ts`: 4/4 passed).
  4. WebGL headless rendering produces non-blank canvas with SwiftShader flags: **PASS**.
  5. All golden scenario and regression tests pass: **PASS** (43/43 tests passed across 6 test suites).
- **Tests & Evidence Required**:
  - `pnpm --filter @aegis/ai-core test src/validation/__tests__/template-phrase-leak.test.ts` (4/4 passed)
  - `pnpm --filter @aegis/ai-core test src/scenarios/__tests__/golden-scenarios.test.ts` (8/8 passed)
  - `pnpm --filter @aegis/ai-core test src/governance/__tests__/domain-contamination-isolation.test.ts` (7/7 passed)
  - `pnpm --filter @aegis/ai-core test src/contracts/__tests__/canonical-contract-milestone2.test.ts` (10/10 passed)
  - `pnpm --filter @aegis/ai-core test src/validation/__tests__/final-success-gate-milestone1.test.ts` (6/6 passed)
  - `pnpm --filter @aegis/ai-core test src/validation/__tests__/in-project-test-runner-milestone1.test.ts` (8/8 passed)
- **Known Risks & Dependencies**:
  - Sanitizer must continue supplying required exports if absent, so consumer components don't fail compilation. All 43 regression tests confirm compile integrity is preserved.

---

### Phase 2: Prove "Every Feature Works" (Feature Matrix & Verifiable Tests)
- **Status**: **COMPLETED** (Verified via commits `edfec22`, `129d69b`, `d2cd92c`, `be4f643`)
- **Objectives**:
  - Establish `FeatureMatrixManager` generating `.aegis/feature-matrix.json` with deterministic IDs (`F01..Fn`).
  - Enforce canonical application contracts in `.aegis/canonical-contracts.json` (routes, Zod API schemas, Prisma models).
  - Enforce schema evolution invariance via `AuthorizedSchemaManager` (never drop user/LLM fields).
  - Contract-driven API verification derived from schema and endpoint status codes.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/contracts/` (`feature-matrix.ts`, `canonical-contract.ts`, `api-contract-registry.ts`)
  - `packages/ai-core/src/database/authorized-schema-manager.ts`
  - `packages/ai-core/src/writer/file-ownership-registry.ts`
- **Acceptance Criteria**:
  1. `FeatureMatrix` validates ID uniqueness, coverage, and route/API linkages.
  2. Canonical contracts lock frontend & backend schemas as single source of truth.
  3. Schema manager preserves existing model fields across evolution steps.
- **Tests & Evidence Required**:
  - `pnpm --filter @aegis/ai-core test src/contracts/__tests__/canonical-contract-milestone2.test.ts` (10/10 passed).
  - `pnpm --filter @aegis/ai-core test src/brownfield/__tests__/domain-generalization-e2e.test.ts` (6/6 passed).

---

### Phase 3: Original Design & Theme Generator
- **Status**: **NOT STARTED**
- **Objectives**:
  - Build structured design brief generator per project (brand hue, palette, font pair, radius, shadow style, density, layout motif, signature interaction).
  - Implement theme generator converting hue into full palette with WCAG AA contrast validation.
  - Curate font library with ~30 pairs tailored to specific domains.
  - Curated component library with theme-aware tokens.
  - Cross-project similarity gate comparing last 5 projects (hue, fonts, layout, section titles) to reject derivative outputs.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/design/` (`design-system-generator.ts`, `theme-generator.ts`)
  - `packages/ai-core/src/validation/similarity-gate.ts`
- **Acceptance Criteria**:
  1. Theme generator produces valid WCAG AA contrast ratios across all semantic roles.
  2. Projects generated from different domains show distinct palettes, typography, and layout topologies.
  3. Similarity gate detects and rejects near-duplicate layouts from recent project history.

---

### Phase 4: Learn from Real Sites (Reference Research)
- **Status**: **NOT STARTED**
- **Objectives**:
  - Implement Stage 1 reference-site research using headless browser.
  - Extract feature list, page structure, main user flows, UI patterns, content types.
  - Strictly observe copyright rules: study structure and concepts only; never copy code, text, logos, or assets.
  - Automatically synthesize the extracted findings into the Feature Matrix (`F01..Fn`).
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/research/`
  - `packages/ai-core/src/contracts/feature-matrix.ts`
- **Acceptance Criteria**:
  1. Research agent generates categorized feature list from target reference sites.
  2. Output cleanly converts into validated `FeatureMatrix` without manual intervention.

---

### Phase 5: Brownfield & AST-Safe Editing Engine
- **Status**: **NOT STARTED**
- **Objectives**:
  - Build robust, natural-language editing engine on top of verified `brownfield/` AST tools (`ExistingSymbolModifier`, `PatchPreviewEngine`, `RepositoryScanner`).
  - Support the 4 primary edit modes: Add a page/route, Change visual theme/tokens, Remove/replace a feature, Evolve data model & schema.
  - Provide transactional rollback: any edit that breaks TypeScript, tests, or runtime reverts automatically to a clean checkpoint.
  - Support `aegis undo` via Git checkpoints.
  - Project hygiene: detect and remove orphan routes, dead imports, and duplicate components.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/edit/` (`edit-engine.ts`)
  - `packages/ai-core/src/brownfield/`
  - `apps/cli/src/commands/edit.ts`
- **Acceptance Criteria**:
  1. Adding a page creates component, route entry, navigation link, and tests cleanly.
  2. Modifying a theme updates tokens consistently across components without breaking styles.
  3. Removing a feature safely removes route, components, and references without dangling imports.
  4. Broken edits rollback cleanly to the pre-edit checkpoint with zero leftover artifacts.

---

### Phase 6: Simplify Aegis Architecture
- **Status**: **NOT STARTED**
- **Objectives**:
  - Merge overlapping gates and sanitizers into exactly 5 clear checks: contract, build, feature tests, quality, originality.
  - Enforce single-owner rule: LLM generates files; validators report; fixers repair only compile errors and security.
  - Convert destructive fixers (`ProvenanceValidator`, `SemanticDuplicate`) to report-only.
  - Split `fast-sanitizer.ts` into small, modular, named fixers.
  - Delete dead code and safely move eval suites out of `src/`.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/validation/`
  - `packages/ai-core/src/governance/fast-sanitizer.ts`
  - `packages/ai-core/src/agent/orchestrator.ts`
- **Acceptance Criteria**:
  1. Core validation pipeline consists of unified Quality gate and exactly 5 objective checks.
  2. Zero fixers delete unprovenanced user code or overwrite LLM styles.
  3. Core code lines reduced by tens of thousands of lines while passing all golden benchmarks.

---

### Phase 7: Lovable-like Experience & Supported Delivery
- **Status**: **NOT STARTED**
- **Objectives**:
  - Create interactive web chat workspace with live preview (split view: prompt & chat on left, hot-reloading iframe on right).
  - Dev server lifecycle orchestration (start, monitor, reload, stop).
  - Feature checklist HUD displaying what was built, where, and which test proves it works.
  - One-command deployment (Vercel, Railway, Docker) and push to GitHub.
- **Relevant Implementation Areas**:
  - `apps/workspace/`
  - `packages/ai-core/src/runtime/`
  - `packages/ai-core/src/deploy/`
- **Acceptance Criteria**:
  1. Live preview renders generated application within 5 seconds of startup.
  2. Prompting in chat updates preview reactively.
  3. One-command deploy generates working Docker/deployment configurations.
