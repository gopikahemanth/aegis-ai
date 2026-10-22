# 🛡️ Aegis AI — System Vision, Architecture & Strategic Roadmap

> **Core Product Goal**: The user enters an ordinary-language prompt. Aegis understands what an excellent website in that category should contain, and autonomously delivers a complete, professional, working website with as little manual correction as possible.
>
> Aegis does not aim for the unattainable guarantee of "100% taste perfection with zero changes for every possible human." Rather, Aegis guarantees **all specified requirements working on first delivery, zero known critical defects, professional domain-appropriate design, and zero manual code repair for ordinary use cases.**

---

## 1. The Core Pillars

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AEGIS AI PLATFORM                                    │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────────┤
│ 1. Simple Input    │ 2. Research & Intel│ 3. Original Design │ 4. Autonomous QA        │
│ Natural prompt     │ Real-site reference│ Domain design sys, │ Verification of actual  │
│ without forcing    │ patterns (never    │ complete code & DB,│ user journeys, honest   │
│ template selection │ copying branding)  │ single file owners │ reporting, root-cause fix│
└────────────────────┴────────────────────┴────────────────────┴─────────────────────────┘
```

### A. One Simple Input
The user describes what they want in everyday language. Aegis extracts audience, business intent, required features, preferred aesthetics, and constraints without demanding template selection upfront.

### B. Research & Product Intelligence
When research is available, Aegis inspects 3–5 real websites in the category to identify user journeys, information hierarchy, and expected capabilities. Reference research informs the **Feature Matrix** and pattern selection—never copying code, text, images, or branding.

### C. Original Design & Complete Implementation
Aegis synthesizes a unique, site-specific design system (tokens, typography, layout, signature interaction) and implements the complete application: interactive frontend, backend endpoints, relational schema, and state workflows.

### D. Autonomous Quality Control & Honest Delivery
Aegis verifies actual functionality, not just whether a page mounts. When issues occur, Aegis diagnoses the root cause, repairs the responsible component, and retests. Aegis **never reports success when a required check was skipped or failed.**

---

## 2. The Architectural Mandate: Single-Owner System

### The Problem in Legacy Frameworks: "Too Many Fixers"
Past iterations accumulated ~20 overlapping gates, sanitizers, and heuristics to patch individual historical test failures. When a defect occurred:
- One fixer deleted a field.
- Another injected an alias.
- A sanitizer replaced card styles with hardcoded fallbacks.
- A gate flagged the generator's own valid outputs as contamination.
- The run was declared a "success" while the site was broken.

### The Single-Owner Architecture
Every concern has exactly **one authoritative owner**:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Requirements & Feature Specification                 │
│    Single source of truth: Feature Matrix (F01..Fn)     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Canonical Application Contracts                      │
│    Routes, API schemas, Prisma models, entity types     │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Generation Orchestrator                              │
│    Single file ownership (one agent/generator per file) │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Independent Verification Engine                      │
│    Build, types, acceptance tests per feature ID        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Targeted Root-Cause Repair & Revalidation            │
│    Reconcile schema & code; re-run affected tests       │
└─────────────────────────────────────────────────────────┘
```

---

## 3. The Feature Matrix Standard

For every generated application, Aegis maintains an explicit **Feature Matrix**:

| ID | Required Feature | Route / Component | Data Contract / API | Acceptance Test (Browser) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `F01` | *e.g. Subsystem Inspection* | `/inspect/:id` | `GET /api/systems/:id` | System cutaway renders; selecting node updates telemetry | `PASS` |
| `F02` | *e.g. Environmental Lighting*| `/lighting` | `PUT /api/lighting/mode` | Toggling night mode mutates WebGL ambient shader | `PASS` |
| `F03` | *e.g. Sensor Telemetry Export*| `/reports` | `POST /api/telemetry/export`| Triggering export generates timestamped download | `PASS` |

**Traceability Rule**: Aegis cannot declare generation complete unless every must-have feature ID has verified evidence of implementation and a passing acceptance test.

---

## 4. Definition of a "Good Site" (Acceptance Standard)

Every generated site must satisfy all objective acceptance criteria on first delivery:

1. **Feature Completeness**: 100% of must-have features in the Feature Matrix exist and pass their linked acceptance tests.
2. **Build & Type Cleanliness**: Production build (`vite build` / `tsc --noEmit`) passes with 0 errors and 0 unhandled runtime exceptions.
3. **Functional Journeys**: Realistic user workflows complete end-to-end with active application state and database persistence (no dummy no-op buttons).
4. **Visual & Responsive Integrity**: Verified across Mobile (375px), Tablet (768px), and Desktop (1440px) without horizontal scrollbar leaks or element clipping.
5. **Originality & Domain Coherence**: Color palette, typography, and layout match the domain context and are measurably distinct from the last 5 generated projects.
6. **Zero Contamination**: Zero lorem ipsum, placeholder stubs, unhandled debug toasts, or cross-domain copy leaks.
7. **Accessibility & Performance Baselines**: WCAG 2.2 AA contrast compliance, Lighthouse Accessibility $\ge 90$, Performance $\ge 80$.
8. **Honest Delivery**: Full deployment instructions, Docker configuration, and verified test evidence delivered to the user.

---

## 5. Development Roadmap (Sequential Phases)

### Phase 1 — Framework Audit & Stabilization (Current Priority)
- Perform an evidence-based audit of all existing fixers (`fast-sanitizer`, `project-startup-agent`, `repair-coordinator`, `final-success-gate`).
- Remove conflicting repair actions (e.g. fixers overwriting LLM components, gates flagging legitimate generator outputs).
- Establish reliable builds, type checks, and honest exit codes across standard reference test prompts.

### Phase 2 — Feature Matrix Pipeline
- Implement the formal `FeatureMatrix` data structure (`.aegis/feature-matrix.json`).
- Map prompt features to discrete IDs (`F01..Fn`).
- Enforce that each feature ID links to an explicit route, component, API endpoint, and browser test.

### Phase 3 — Reference Site Intelligence
- Build headless pattern extractor to research 3–5 live peer sites when available.
- Extract page hierarchy, navigation topologies, and user flows into a structured comparison table.
- Inform feature planning and layout selection while strictly isolating reference data from generation copy.

### Phase 4 — Domain Design System Engine
- Synthesize site-specific tokens (colors, typography, spacing, surface treatments) based on the domain brief.
- Compute a similarity distance against recent projects to guarantee visual distinctiveness.
- Curate a cohesive set of styled base primitives for LLM composition.

### Phase 5 — Single-Owner Application Generation
- Implement strict file-ownership rules: one generator/agent per file.
- Prevent subsequent passes from silently mutating or reverting earlier generated code.
- Harmonize Prisma schema, backend API routes, and frontend data fetchers upfront.

### Phase 6 — Requirement-Linked Verification
- Generate 1 functional browser test per feature ID.
- Execute automated end-to-end journey tests with real state mutations.
- Check responsive viewports (375px, 768px, 1440px), network traffic, and console logs.

### Phase 7 — Visual Critique & Targeted Repair
- Capture full-page and viewport screenshots.
- Score against an objective design & usability rubric.
- Execute bounded visual repair (up to 2 targeted rounds) targeting the highest-impact visual defects.

### Phase 8 — Delivery, Packaging & Learning
- Generate production-ready artifacts: Dockerfile, docker-compose, README with setup instructions, and the Feature Coverage Report.
- Feed failure learnings back into the core framework and regression test suite—never as one-off hardcoded prompt hacks.
