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
- **Status**: **COMPLETED**
- **Objectives**:
  - Build structured design brief generator per project with 16 pillars (brand hue, palette, font pair, radius, shadow style, density, layout motif, hero composition, page section plans, signature interaction, avoid list, rationale).
  - Implement dynamic theme generator generating 50..950 scales, WCAG AA contrast calculation/auto-tuning (>= 4.5:1 text, >= 3.0:1 focus), component tokens, and CSS custom properties.
  - Curate font library with 30 pairings tailored to specific domains with system fallback stacks and Google Fonts URLs.
  - Curated, theme-aware component system without destructive sanitizer overrides.
  - Cross-project similarity detector comparing against last 5 projects across 8 axes (Hue, Typography, Hero, Section Sequence, Navigation, Density, Interaction, Motif) with bounded regeneration (max 3 retries).
  - Direct pipeline integration into Orchestrator and CLI before code synthesis.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/design/typography-catalog.ts` (30 curated domain font pairings & TypographyManager)
  - `packages/ai-core/src/design/theme-generator.ts` (Dynamic theme generation, WCAG AA auto-contrast, `.aegis/theme.json`)
  - `packages/ai-core/src/design/design-brief-generator.ts` (16-pillar `AegisDesignBriefV2`, validation engine, `.aegis/design-brief.json`)
  - `packages/ai-core/src/design/similarity-detector.ts` (8-axis similarity analysis, signature extraction, `.aegis/project-signatures.json`)
  - `packages/ai-core/src/validation/cross-project-similarity-gate.ts` (Bounded regeneration gate with avoid list)
  - `packages/ai-core/src/agent/orchestrator.ts` (Wired Theme, Brief, and Similarity Gate directly into core pipeline)
- **Acceptance Criteria**:
  1. Theme generator produces valid WCAG AA contrast ratios across all semantic roles.
  2. Projects generated from different domains show distinct palettes, typography, and layout topologies.
  3. Similarity gate detects and rejects near-duplicate layouts from recent project history with bounded retries.
  4. Real Golden Scenarios (Marine, Aerospace, Luxury, Education) pass automated design evaluation.
- **Tests & Evidence Required**:
  - `src/design/__tests__/phase3-original-design.test.ts` (12/12 passed):
    - Requirement 1: Domain-tailored design briefs.
    - Requirement 2: Variance across repeated generations.
    - Requirement 3: Theme tokens and complete CSS custom properties.
    - Requirement 4: Required palette tokens (primary, secondary, accent, neutrals, surfaces, semantic).
    - Requirement 5: Strict WCAG AA contrast enforcement and auto-tuning.
    - Requirement 6: All 30 typography pairings contain complete system fallbacks.
    - Requirement 7: Multi-axis similarity detection across structural layouts.
    - Requirement 8: Bounded regeneration terminating within retry limit.
    - Requirement 9: Unknown domains receive original tailored designs.
    - Requirement 10: Non-destructive sanitizer preserves custom LLM Card/Table styling.
    - Requirement 11: Route coverage in page section plans.
    - Requirement 12: Design brief and theme JSON persistence in `.aegis/`.
  - `src/scenarios/__tests__/phase3-golden-evaluation.test.ts` (5/5 passed):
    - Golden Scenario 1: Thalassa Habitat (Marine Engineering, obsidian abyss, 3D spatial cutaway).
    - Golden Scenario 2: OrbitalSync (Aerospace Operations, dark telemetry console, pass scheduler).
    - Golden Scenario 3: Veloce Atelier (Luxury Automotive, obsidian noir/amber, cinematic aerodynamic configurator).
    - Golden Scenario 4: CodeCraft Academy (Education, light mode accessible, interactive curriculum graph).
    - Differentiation: Pairwise cross-project similarity strictly < 0.70 across all 4 domains.
  - Regression Suites (28/28 passed): Golden Scenarios, Canonical Contracts, Final Success Gate, Template Blocklist. Total 45/45 passing tests.

---

### Phase 4: Learn from Real Sites (Reference Research)
- **Status**: **COMPLETED**
- **Objectives**:
  - Implement Stage 1 reference-site research engine using headless browser (`playwright-core` Chromium/Edge) and resilient HTTP fallback.
  - Select 3 to 5 publicly accessible reference websites tailored to domain, audience, and functional goals (e.g. Sweetgreen/OpenTable/Toast for dining, Coursera/Khan Academy/edX for education, Redfin/StreetEasy/Zillow for real estate, dynamic knowledge synthesis for unfamiliar domains).
  - Inspect public page structures and workflows (navigation, route hierarchies, primary CTAs, forms & validation, filtering & search, user journeys, responsive indicators).
  - Distinctly separate directly observed DOM/CSS facts (`isDirectObservation: true`) from inferred ideas/workflows (`isDirectObservation: false`).
  - Enforce strict copyright safeguards: study structural UX patterns and functional requirements; never copy proprietary code, text, logos, or protected media assets.
  - Persist versioned, machine-readable research artifacts to `.aegis/reference-research.json`.
  - Harmonize research discoveries with explicit user must-haves and standard domain baselines in `.aegis/feature-matrix.json` with deterministic IDs (`F01..Fn`), provenance attribution, confidence scores, and valid acceptance test references.
  - Enforce budget controls (bounded timeout, per-run budget, caching) and honest status reporting (`SUCCESS`, `PARTIAL`, `BLOCKED`, `NOT_PERFORMED`).
  - Wire directly into the core generation pipeline in `Orchestrator.generateProject()`.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/research/reference-research-types.ts` (Artifact schemas, source & pattern interfaces)
  - `packages/ai-core/src/research/reference-source-selector.ts` (Curated domain catalog & dynamic unfamiliar domain selector)
  - `packages/ai-core/src/research/reference-page-inspector.ts` (Playwright headless Chromium / Edge inspector & resilient fetch fallback)
  - `packages/ai-core/src/research/feature-matrix-harmonizer.ts` (Requirements synthesis, deduplication, stable IDs, user priority preservation)
  - `packages/ai-core/src/research/reference-research-engine.ts` (Research coordinator, budget controls, caching, artifact persistence)
  - `packages/ai-core/src/agent/orchestrator.ts` (Direct pipeline integration)
- **Acceptance Criteria**:
  1. Research engine inspects permitted public pages using real browser or network access without fabricating results.
  2. Structured research artifact `.aegis/reference-research.json` generated with honest status and copyright safeguards.
  3. Authoritative `.aegis/feature-matrix.json` harmonizes user must-haves, domain baselines, and research findings with zero dropped user requirements.
  4. Out-of-scope or bloated features are filtered and recorded in `irrelevantFeatures` with clear exclusion rationales.
  5. Representative real domains (Restaurant, Education, Real Estate, Unfamiliar/Novel) verified through end-to-end integration tests.
- **Tests & Evidence Required**:
  - `src/research/__tests__/phase4-reference-research.test.ts` (15/15 passed):
    - Requirement 1: Domain-specific reference selection.
    - Requirement 2: Absolute preservation of explicit user requirements (`must-have`, `source: "user-request"`).
    - Requirement 3: Stable deterministic feature IDs (`F01..Fn`).
    - Requirement 4: Traceable evidence, source URLs, and confidence scores.
    - Requirement 5: Clear separation between observed facts and inferred concepts.
    - Requirement 6: Honest error handling for inaccessible websites (no fake visits).
    - Requirement 7: Graceful handling of malformed URLs.
    - Requirement 8: Bounded browser timeouts and total budget enforcement.
    - Requirement 9: Deduplication enriching overlapping features without clobbering.
    - Requirement 10: Relevance filtering and documented bloat rejection.
    - Requirement 11: Validation compliance with `FeatureMatrixManager.validate()`.
    - Requirement 12: Machine-readable `.aegis/reference-research.json` persistence.
    - Requirement 13: Copyright safeguards and originality attestations.
    - Requirement 14: Honest research status reporting (`SUCCESS`, `PARTIAL`, `BLOCKED`, `NOT_PERFORMED`).
    - Requirement 15: Adaptive reference synthesis for unfamiliar domains.
  - `src/scenarios/__tests__/phase4-cli-integration.test.ts` (4/4 passed):
    - Domain 1: Restaurant ordering & reservations (Trattoria Bella).
    - Domain 2: Education & course management (ByteForge Academy).
    - Domain 3: Real estate property discovery (Skyline Haven).
    - Domain 4: Unfamiliar astrophysics radiotelescope console (PulsarGrid).
  - Regression Suites (45/45 passed): Phase 3 original design, golden scenarios, canonical contracts, final success gate, template phrase blocklist. Total 64/64 passing tests across the active test surface.

---

### Phase 5: Brownfield & AST-Safe Editing Engine
- **Status**: **COMPLETED**
- **Objectives**:
  - Build robust, natural-language editing engine converting instructions into structured, versioned change specifications (`AegisEditPlanV1`).
  - Scan existing projects to build comprehensive dependency graph (`ProjectDependencyGraph`) distinguishing feature-owned files, entry points, and shared components (`Card`, `Button`, `Table`).
  - Implement full-stack additive feature engine (`FeatureAdder`): UI component, router registration, navbar link, persistence model evolution, and acceptance test.
  - Implement safe feature decommissioning (`FeatureRemover`): unregister routes, prune navigation links, remove feature-owned files, cleanly prune dangling imports, and strictly preserve shared components.
  - Implement visual theme modification (`ThemeModifier`): updates `:root` CSS custom properties and `.aegis/theme.json` without modifying routes or logic.
  - Implement strict single-page isolation (e.g. "Only redesign the home page hero section") leaving all other routes and pages untouched.
  - Provide durable multi-run checkpoints and atomic rollback (`UndoManager`, `aegis undo`) without discarding unrelated user modifications.
  - Integrate `BrownfieldGitGuard` to evaluate preflight worktree states (`CLEAN`, `DIRTY_SAFE`, `DIRTY_TARGET_CONFLICT`) and stage only explicitly touched files.
  - Integrate `AuthorizedSchemaManager` for non-destructive Prisma database model evolution.
  - Synchronize project memory: `.aegis/feature-matrix.json`, `.aegis/theme.json`, and `.aegis/edit-history.json`.
  - Provide CLI commands: `aegis edit "<instruction>"` and `aegis undo`.
- **Relevant Implementation Areas**:
  - `packages/ai-core/src/edit/edit-types.ts` (`EditIntentSpecification`, `AegisEditPlanV1`, `EditExecutionResult`, `EditCheckpointData`)
  - `packages/ai-core/src/edit/natural-language-intent-parser.ts` (Classification: add, remove, modify_theme, modify_feature, evolve_model, fix_workflow, undo)
  - `packages/ai-core/src/edit/project-dependency-graph.ts` (Dependency scanner, shared vs feature-owned file isolation)
  - `packages/ai-core/src/edit/feature-adder.ts` (Full-stack additive feature wiring)
  - `packages/ai-core/src/edit/feature-remover.ts` (Safe feature decommissioning, import cleanup, shared component protection)
  - `packages/ai-core/src/edit/theme-modifier.ts` (CSS token & theme.json updates)
  - `packages/ai-core/src/edit/undo-manager.ts` (Durable checkpoints in `.aegis/checkpoints/` and `.aegis/edit-history.json`)
  - `packages/ai-core/src/edit/edit-engine.ts` (Master orchestrator & verification/repair loop)
  - `apps/cli/src/commands/edit.ts` (CLI edit entrypoint with dry-run and full plan output)
  - `apps/cli/src/commands/undo.ts` (CLI undo entrypoint)
  - `apps/cli/src/cli.ts` (Added "undo" to known commands and routed dispatch)
- **Acceptance Criteria**:
  1. Natural-language requests are converted into structured, classified plans with strict scope boundaries.
  2. Adding a page/feature creates component, route entry, navigation link, schema model, and tests cleanly.
  3. Modifying a theme updates `:root` tokens and `.aegis/theme.json` without breaking page contracts.
  4. Targeted single-page redesigns modify only the target page, leaving other pages untouched.
  5. Feature removal cleanly removes route, navigation links, and feature files while strictly preserving shared components.
  6. Uncommitted user modifications in unrelated files are preserved.
  7. Broken edits or syntax errors roll back automatically to the pre-change checkpoint.
  8. `aegis undo` safely reverts the last eligible edit without discarding subsequent unrelated user work.
  9. Project memory (`.aegis/feature-matrix.json`, `.aegis/theme.json`, `.aegis/edit-history.json`) remains synchronized.
- **Tests & Evidence Required**:
  - `src/edit/__tests__/phase5-editing-engine.test.ts` (15/15 passed):
    - Scenario 1: Adds a fully connected page, route, and navbar link.
    - Scenario 2: Adds a backend-backed feature with database model evolution.
    - Scenario 3 & 18: Modifies only the home page hero section without modifying other pages.
    - Scenario 4: Modifies global theme tokens and persists `.aegis/theme.json`.
    - Scenario 5 & 6: Removes a feature cleanly while strictly preserving shared components (`Card.tsx`).
    - Scenario 7: Preserves user modifications in unrelated files.
    - Scenario 8: Updates data model while preserving all prior domain fields.
    - Scenario 9: Prevents unauthorized destructive schema mutations.
    - Scenario 10: Handles missing routes file gracefully without crashing.
    - Scenario 11 & 14: Rejects syntax errors and rolls back cleanly to checkpoint.
    - Scenario 12: Detects imports and distinguishes shared vs feature-owned components.
    - Scenario 13: Stops gracefully on impossible operations.
    - Scenario 15: Undo restores edited files and deletes created files.
    - Scenario 16: Avoids creating duplicate routes if feature already exists.
    - Scenario 17: Updates Feature Matrix on additions and removals.
  - `src/edit/__tests__/cli-brownfield-e2e.test.ts` (2/2 passed):
    - CLI Dry-Run: Validates `--dry-run` outputs full execution plan with zero files modified.
    - CLI Real Workflow: Executes real `aegis edit "Add a wishlist..."`, `aegis edit "Change the theme..."`, `aegis edit "Remove the blog..."`, and `aegis undo` on compiled CLI binary.
  - Regression Suites (47/47 passed): Phase 3 original design, Phase 4 reference research, and AuthorizedSchemaManager governance. Total 64/64 active regression tests passing.

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
