# Autonomous Frontend Generation Architecture

> **Aegis AI System Specification**
> **Status:** Active Standard
> **Classification:** Core Engine Architecture
> **Target Subsystems:** `packages/ai-core/src/design`, `packages/ai-core/src/agents`, `packages/ai-core/src/validation`

---

## Table of Contents

1. [Vision and Design Principles](#1-vision-and-design-principles)
2. [Existing Frontend Architecture Audit](#2-existing-frontend-architecture-audit)
3. [Current Limitations and Root Causes](#3-current-limitations-and-root-causes)
4. [Proposed Frontend Generation Lifecycle](#4-proposed-frontend-generation-lifecycle)
5. [Autonomous Research Architecture](#5-autonomous-research-architecture)
6. [Product Understanding and Requirement Extraction](#6-product-understanding-and-requirement-extraction)
7. [Visual Research and Reference Intelligence](#7-visual-research-and-reference-intelligence)
8. [Design Direction Selection](#8-design-direction-selection)
9. [Dynamic Colour and Background Intelligence](#9-dynamic-colour-and-background-intelligence)
10. [Typography and Multilingual Text Handling](#10-typography-and-multilingual-text-handling)
11. [Image and Asset Intelligence](#11-image-and-asset-intelligence)
12. [UX Architecture and User Journey Planning](#12-ux-architecture-and-user-journey-planning)
13. [Page-by-Page Composition Planning](#13-page-by-page-composition-planning)
14. [Dynamic Design System Generation](#14-dynamic-design-system-generation)
15. [Component and Interaction Generation](#15-component-and-interaction-generation)
16. [Responsive and Adaptive Layout Generation](#16-responsive-and-adaptive-layout-generation)
17. [Accessibility](#17-accessibility)
18. [Frontend Performance](#18-frontend-performance)
19. [Browser and Visual QA](#19-browser-and-visual-qa)
20. [Bounded Repair and Visual Regression](#20-bounded-repair-and-visual-regression)
21. [Research and Design Document Schemas](#21-research-and-design-document-schemas)
22. [Integration with Existing Aegis Modules](#22-integration-with-existing-aegis-modules)
23. [Implementation Milestones](#23-implementation-milestones)
24. [Test Strategy](#24-test-strategy)
25. [Acceptance Criteria](#25-acceptance-criteria)
26. [Known Limitations and Future Extensions](#26-known-limitations-and-future-extensions)

---

## 1. Vision and Design Principles

Aegis AI is an autonomous end-to-end software engineering engine. To date, software generation systems have treated frontend engineering as either the mechanical filling of fixed templates or the unconstrained emission of ad-hoc HTML/CSS by language models. Both approaches fail:
- **Template engines** produce sterile, repetitive clones that share identical 3-column feature grids, metric cards, and hero sections regardless of whether the business is a veterinary clinic, a dental surgery, a high-fashion atelier, or a cloud operations dashboard.
- **Unconstrained LLMs** produce fragmented, inconsistent layouts suffering from severe visual regressions: white headings on near-white surfaces, mobile text clipping, overflowing metrics, mismatched routes, and broken accessibility contrast.

Aegis Autonomous Frontend Intelligence transforms Aegis into an **autonomous researcher, art director, UX architect, design systems engineer, and frontend developer**. It operates under five non-negotiable architectural tenets:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CORE ARCHITECTURAL TENETS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. RESEARCH PRECEDES DESIGN                                                 │
│    Aegis never synthesizes a layout without first understanding the domain, │
│    target user persona, content density, and genuine visual conventions.     │
│                                                                             │
│ 2. DESIGN SPECIFICATIONS ARE BINDING CONTRACTS                              │
│    Every project generates an authoritative brief and specification before  │
│    code generation. Downstream agents (CoderAgent, Repair) MUST obey them.  │
│                                                                             │
│ 3. TECHNICAL CONSISTENCY ≠ VISUAL UNIFORMITY                               │
│    Reusing robust component contracts (Button, Modal, Input, Layout) does   │
│    NOT mean every website shares the same layout, palette, or mood.         │
│                                                                             │
│ 4. RESPONSIVE INTENTIONALITY FROM INCEPTION                                 │
│    Mobile, tablet, and desktop views are distinct architectural plans, not  │
│    hasty media queries added to desktop layouts.                            │
│                                                                             │
│ 5. VISUAL AND ACCESSIBILITY VERIFICATION AT THE RUNTIME LEVEL               │
│    Compilation is not quality. Quality requires headless Chromium rendering,│
│    computed contrast audits, overflow bounds checking, and screenshot QA.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Existing Frontend Architecture Audit

Before modifying code, we audited the active generation pipeline within `packages/ai-core/src/` to identify active execution paths, passive dead code, and consumer relationships:

| Module / Component | File Location | Status | Inputs | Outputs | Actual Consumer |
|---|---|---|---|---|---|
| **ProductDiscoveryAgent** | `src/agents/product-discovery-agent.ts` | **Active** | Raw Prompt, seed | Discovered Features, Category | `Orchestrator`, `FeatureMatrixManager` |
| **ReferenceResearchEngine** | `src/research/reference-research-engine.ts` | **Active** | Prompt, Domain, Features | Research findings, observed patterns | `Orchestrator`, `ProductExperiencePlan` |
| **DesignReferenceIntelligence** | `src/design/design-reference-intelligence.ts` | **Active** | Prompt, Domain | Visual thesis, principles, palette hints | `Orchestrator._designResearchSynthesis` |
| **ExperienceArchitect** | `src/design/experience-architect.ts` | **Active** | Characteristics, Contract, Seed | `CompositionGraph`, Layout Archetype | `CapabilityPlanner`, `Orchestrator` |
| **DesignDirector** | `src/design/design-director.ts` | **Active** | Characteristics, FeaturePriority, Spec | `ProductDesignBrief` | `DesignBriefLock`, `ThemeGenerator` |
| **ThemeGenerator** | `src/design/theme-generator.ts` | **Active** | Domain, ColorSystem, Seed | `.aegis/theme.json`, contrast audit | `DesignSystemGenerator`, Coder Context |
| **DesignBriefGenerator** | `src/design/design-brief-generator.ts` | **Active** | Theme, Prompt, Routes | `.aegis/design-brief.json` (v2.0) | `CrossProjectSimilarityGate` |
| **PageDesignSpecificationEngine** | `src/design/page-design-specification-engine.ts` | **Partially Active** | Routes, Features, Research | `.aegis/page-design-specifications.json` | Saved to disk; **weakly consumed by CoderAgent** |
| **DesignDecisionDocumentEngine** | `src/design/design-decision-document.ts` | **Active** | Prompt, Brand, Routes, PagePlans | `.aegis/design-decision-document.json` | CoderAgent (DDD blueprint context) |
| **AssetDirector** | `src/design/asset-director.ts` | **Active** | AssetManifest, OutputDirectory | `.aegis/asset-manifest.json`, local SVGs | CoderAgent (`buildCoderContext`) |
| **CandidateCompositionSynthesizer** | `src/design/candidate-composition-synthesizer.ts` | **Active** | Domain, Prompt, Seed | 3 Diverse Compositions | `ExperienceArchitect` |
| **InteractiveComponentGenerator** | `src/design/interactive-component-generator.ts` | **Active** | Spec, Components list | Custom component source code | `ProjectBuilder` |
| **DesignSystemGenerator** | `src/design/design-system-generator.ts` | **Active** | Spec, Brief, Contract | `tokens.ts`, `index.css`, UI primitives | `CoderAgent`, Build Pipeline |
| **CoderAgent** | `src/agents/coder-agent.ts` | **Active** | Tasks, Brief Context, DDD Context | Generated React/Vite source files | Build loop, Validator |
| **ReadOnlyBrowserValidator** | `src/validation/read-only-browser-validator.ts` | **Active** | Server URL, Output Directory | `FrontendBrowserReview`, screenshots | `FinalSuccessGate`, Stage Repair |
| **VisualReviewerAgent** | `src/agents/visual-reviewer-agent.ts` | **Active** | Screenshot path, Request | `VisualReviewResult` (PASS/FAIL) | Bounded Stage Repair |
| **FinalSuccessGate** | `src/validation/final-success-gate.ts` | **Active** | Test results, Browser review | Final deployment certification | Pipeline completion |

---

## 3. Current Limitations and Root Causes

A systematic autopsy of the `cloudpulse-ops` benchmark and recent runs revealed the fundamental root causes of frontend failure:

### Root Cause 1: Decoupling of Page Specifications from Coder Implementation
While `PageDesignSpecificationEngine` synthesized individual route blueprints, `CoderAgent` prompt construction only passed high-level route lists and global tokens. As a result, the CoderAgent independently hallucinated section structures, heading hierarchies, and inline styles on every page.

### Root Cause 2: Unscoped CSS and Hardcoded Dark/Light Values in Components
`src/index.css` set global CSS custom properties (`--color-background`, `--color-surface`), but individual generated pages (`StatusBoard.tsx`, `MetricWorkspace.tsx`) injected inline hardcoded classes (`bg-[#121620]`, `bg-[#0c0c0e]`, `text-slate-400`, `text-white`). When a route or component lacked an explicit background, it inherited `transparent`, causing dark-mode text (`#ffffff`) to render on default white backgrounds when parent containers failed to enforce background tokens.

### Root Cause 3: Brittle Layouts and Viewport Overflow
Metric cards like `{systemLoad * 2.8}ms` were rendered with unformatted floating-point numbers inside fixed `grid-cols-4` or narrow containers. Headings like `text-4xl uppercase tracking-tighter` with 14-character words ("INFRASTRUCTURE", "TELEMETRY") inside `p-8` containers inevitably overflowed mobile (360px–375px) viewports because no word-breaking (`break-words`), fluid clamp scaling (`clamp(1.5rem, 4vw, 2.5rem)`), or responsive padding was enforced.

### Root Cause 4: Missing Shell and Global Navigation Consistency
In `cloudpulse-ops`, `Navbar` was generated in `src/design-system/components/Navbar.tsx` but was **never instantiated** in `Layout.tsx` or `App.tsx`. Each route functioned as a standalone disconnected screen with different paddings, different header styles, and no unified global navigation bar.

### Root Cause 5: Inadequate Runtime Visual QA
`ReadOnlyBrowserValidator` captured screenshots (`desktop.png`, `mobile.png`, `tablet.png`) and checked element count, console errors, and exceptions. However, it **never measured layout metrics**:
- Did `document.documentElement.scrollWidth > window.innerWidth`? (Horizontal overflow)
- Did headings have `scrollWidth > clientWidth`? (Text clipping)
- Did computed text colors against computed background colors meet WCAG AA 4.5:1?
- Did different routes have radically different background colors?

---

## 4. Proposed Frontend Generation Lifecycle

The enhanced Aegis Autonomous Frontend Intelligence lifecycle establishes strict causality:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER REQUIREMENTS                                                           │
│ "Build a specialized cloud infrastructure monitoring platform (CloudPulse)" │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PRODUCT UNDERSTANDING & DOMAIN EXTRACTION                                │
│    Analyze category, audience context, interaction density, & operational goals│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. RESEARCH & REFERENCE INTELLIGENCE                                        │
│    Extract domain patterns, visual conventions, layout archetypes, & assets │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. DESIGN DIRECTION & PROJECT-SPECIFIC DESIGN BRIEF                         │
│    Select art direction, palette, typography, geometry, & vocabulary        │
│    Persist `.aegis/design/frontend-design-brief.md` & `.json`               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. PAGE-BY-PAGE DESIGN SPECIFICATION ENGINE                                 │
│    Generate bespoke blueprints for every route: sections, hierarchy,        │
│    components, interactive states, responsive behavior                      │
│    Persist `.aegis/page-design-specifications.json`                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. DYNAMIC DESIGN SYSTEM & RESILIENT COMPONENT TOKENS                       │
│    Generate semantic CSS custom properties, WCAG-certified tokens,          │
│    resilient Navbar, Layout, Button, GlassCard, and Metric containers        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. ASSET DIRECTOR & VISUAL MANIFEST                                         │
│    Select photography, icons, charts, and illustrations; zero broken images │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. CONTRACT-BOUNDED CODERAGENT EXECUTION                                    │
│    Implement routes strictly adhering to brief, layout blueprints & tokens  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 8. RUNTIME CHROMIUM & VISUAL QUALITY ASSURANCE                              │
│    Headless Chromium launches all routes:                                   │
│    - Compute contrast on all text nodes (WCAG AA 4.5:1)                     │
│    - Detect horizontal overflow (`scrollWidth > clientWidth`)               │
│    - Detect text clipping & line breaks                                     │
│    - Validate route-to-route background and typography consistency          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 9. BOUNDED VISUAL REPAIR & ACCEPTANCE GATE                                  │
│    Targeted CSS repairs applied if visual bugs detected; re-audit in browser│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Autonomous Research Architecture

Research informs design; it does not invent unwanted features or copy competitor templates. When network access is available, Aegis queries curated design and domain indexes (Awwwards, industry registries, accessibility standards). When network access is offline or provider quota is constrained, Aegis operates in **Autonomous Grounded Research Mode**:
1. It queries internal domain intelligence embeddings and heuristic catalogs.
2. It explicitly logs the research source and limitation mode in `.aegis/reference-research.json`.
3. It derives domain-authentic vocabulary, metric names, workflow stages, and layout structures.

```typescript
export interface AutonomousResearchPlan {
  domain: string;
  category: "b2b_saas" | "consumer_store" | "editorial" | "operational_console" | "creative_portfolio" | "booking_service" | "healthcare";
  audienceArchetype: "operator" | "executive" | "creative" | "consumer" | "patient" | "student";
  observedPatterns: Array<{
    feature: string;
    description: string;
    layoutConvention: string;
    density: "compact" | "balanced" | "spacious";
  }>;
  visualReferences: Array<{
    source: string;
    rationale: string;
    colorMood: string;
    compositionInsight: string;
  }>;
}
```

---

## 6. Product Understanding and Requirement Extraction

Product understanding separates explicit user requirements from inferred UX necessities:
- **Explicit Requirements:** User explicitly requested features ("Add a turbine vibration telemetry spectrogram"). These are immutable must-haves.
- **Inferred Requirements:** UX scaffolding needed to make the explicit features usable (e.g. date range selector, severity badge, responsive menu toggle).
- **Forbidden Inferences:** Unjustified features (e.g. adding an e-commerce shopping cart to a devops monitoring tool, or a generic marketing hero banner to a high-density operator workspace).

The output is locked into `ProductCharacteristics` with deterministic fingerprinting:
```typescript
export interface ProductCharacteristics {
  experiencePattern: "operations-dashboard" | "creative-portfolio" | "editorial-showcase" | "commercial-storefront" | "appointment-service" | "analytics-workbench";
  informationDensity: "compact" | "moderate" | "spacious";
  audienceContext: {
    isProfessional: boolean;
    isPersonal: boolean;
    techSavviness: "low" | "medium" | "high";
  };
  emotionalTone: {
    primary: string;
    secondary?: string;
  };
}
```

---

## 7. Visual Research and Reference Intelligence

Aegis analyzes visual references across five core design dimensions:
1. **Compositional Balance:** Asymmetrical split-screens, masthead-led editorial spreads, multi-column modular data boards, or focused card galleries.
2. **Surface Depth & Elevation:** Flat ruled borders with high-contrast rules vs. multi-layered obsidian panels with subtle specular highlights vs. light ceramic cards with soft diffusion shadows.
3. **Typography Cadence:** Bold geometric sans-serif headings with high tracking contrast vs. high-contrast editorial modern serifs with proportional tabular lining numbers.
4. **Data Visualization Formats:** Time-series area charts, radial gauge clusters, matrix tables, or interactive stage canvases.
5. **Brand Personality Signals:** High-density command center, serene clinical trust, opulent luxury craftsmanship, or energetic consumer vibrancy.

---

## 8. Design Direction Selection

Aegis selects an art direction derived from the domain, never applying generic "indigo/cyan corporate SaaS" defaults. Available art directions span the entire aesthetic spectrum:

| Art Direction | Target Domains | Palette Characteristics | Typography | Surface Philosophy |
|---|---|---|---|---|
| **Obsidian Telemetry** | Devops, Aviation, Infrastructure, Defense | Deep obsidian (`#090a0f`), electric status hues, laser borders | Monospace metrics, stark sans headings | Ruled surfaces, micro-borders, zero blur |
| **Editorial Monograph** | Architecture, Fine Art, Fashion, Publishing | Bone/Ivory (`#fcfbf9`), warm slate text, terracotta or ochre accents | High-contrast serif headlines, humanist body | Generous white space, hairline borders |
| **Nordic Minimalist** | Modern SaaS, Productivity, Design Tools | Crisp neutral light (`#f8fafc`), cobalt/indigo accent, zinc text | Geometric sans-serif, tight tracking | Flat cards, subtle shadow elevation |
| **Botanical Earth** | Horticulture, Ecology, Natural Goods | Sage/Forest (`#1a2f23`), ivory canvas, golden harvest accents | Warm transitional serif + sans | Soft organic radii, tactile paper textures |
| **Clinical Precision** | Healthcare, Medical Labs, Bio-analytics | Pure surgical white/ice (`#f4f8fb`), cyan/sky accents, navy text | Highly legible clean grotesk sans | Sterile high-contrast panels, crisp badges |
| **Midnight Luxe** | Haute Horlogerie, Luxury Automotives, VIP | Jet black (`#000000`), champagne/bronze accents, silver muted | Elegant modern serif or geometric display | Subtle specular gleam, dark translucent glass |

---

## 9. Dynamic Colour and Background Intelligence

### 9.1 Unrestricted Palette Generation
Aegis does not choose from a hardcoded list of 5 colors. It calculates harmonious color spaces mathematically across the full 360° hue spectrum using OKLCH / HSL color science:
- **Brand Primary:** Derived from domain semantics (e.g. 25° Amber for telemetry alerts, 145° Sage for botanical, 215° Electric Azure for aerospace).
- **Secondary & Accent:** Derived via triadic, split-complementary, or analogous color harmonies with programmatic jitter to prevent identical shades across runs.
- **Neutrals:** Color-tinted neutrals (chroma = 0.015) that absorb the brand hue, eliminating cold disconnected grays.

### 9.2 Semantic Design Token Contract
Components never use raw hex values; they reference semantic tokens:
```css
:root {
  --color-background: #090a0f;
  --color-surface: #12151e;
  --color-surface-elevated: #1a1e2b;
  --color-primary: #dc2626;
  --color-primary-hover: #b91c1c;
  --color-primary-subtle: rgba(220, 38, 38, 0.12);
  --color-secondary: #71717a;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a1a1aa;
  --color-text-muted: #71717a;
  --color-border: rgba(255, 255, 255, 0.12);
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #06b6d4;
}
```

### 9.3 Contrast Certification Engine (WCAG 2.2 AA)
Before a theme is locked, every foreground/background combination is mathematically evaluated against relative luminance equations:
$$L = 0.2126 \cdot R + 0.7152 \cdot G + 0.0722 \cdot B$$
$$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
- Normal text: **$\ge 4.5:1$**
- Large text ($\ge 18\text{pt}$ or bold $\ge 14\text{pt}$) & interactive controls: **$\ge 3.0:1$**
- Auto-tuning algorithm iteratively steps lightness up or down until compliance is achieved. White text on near-white surfaces or dark text on dark surfaces is mathematically impossible.

---

## 10. Typography and Multilingual Text Handling

### 10.1 Typography Hierarchy & Fluid Scaling
Typography must not clip on mobile or balloon on ultra-wide screens. Aegis enforces fluid clamp typography:
```css
--font-display-size: clamp(1.85rem, 4vw + 0.5rem, 3.25rem);
--font-h1-size: clamp(1.6rem, 3vw + 0.5rem, 2.5rem);
--font-h2-size: clamp(1.3rem, 2vw + 0.5rem, 1.85rem);
--font-body-size: 1rem;
--font-body-line-height: 1.6;
```
All heading classes enforce `break-words` and `hyphens-auto` to prevent long words like "Infrastructure" from overflowing viewports.

### 10.2 Script and Language Awareness
When user requirements demand non-Latin scripts (e.g. Malayalam, Hindi, Arabic, Japanese), Aegis specifies font stacks with native Unicode coverage (Noto Sans Malayalam, Noto Serif Devanagari, IBM Plex Sans Arabic) and adjusts line heights ($\ge 1.7$ for complex Indic ligatures).

---

## 11. Image and Asset Intelligence

### 11.1 Intentional Asset Allocation
Images are not decoration inserted at random. Aegis evaluates whether the product benefits from imagery:
- **E-Commerce & Hospitality:** High visual necessity (product galleries, destination photography).
- **Engineering & Infrastructure Tools:** Zero decorative stock photography. Visual interest is delivered through charts, topological diagrams, telemetry spectrograms, and schematic SVGs.
- **Editorial & Portfolios:** Large-scale hero imagery, full-bleed photography, and responsive picture tags.

### 11.2 Asset Manifest & Local Storage
All planned assets are recorded in `.aegis/asset-manifest.json` and saved locally. If an external image fails to resolve, Aegis generates a crisp inline SVG with domain-authentic geometric schematics, guaranteeing zero 404 image errors.

---

## 12. UX Architecture and User Journey Planning

Information architecture dictates how routes interconnect. Aegis designs:
1. **Primary Navigation Shell:** Sticky or static header with brand mark, primary route links (maximum 5), search or filter controls, and a responsive mobile hamburger drawer.
2. **Contextual Secondary Rails:** Sub-navigation for high-density tools (e.g. incident filters, timeline steps).
3. **State Mutation Feedback:** Every user action (declaring an incident, adjusting a threshold, submitting a form) immediately updates UI state and emits an accessible toast notification.

---

## 13. Page-by-Page Composition Planning

Every route in the sitemap is given an independent, binding blueprint in `.aegis/page-design-specifications.json`:
- **Page Purpose & Role:** Specific user task (e.g. "Real-Time Telemetry & Metric Workspace").
- **Visual Topology:** `METRIC_CONSOLE`, `EDITORIAL_SPREAD`, `SPLIT_PANE_INSPECTOR`, or `SHOWCASE_GALLERY`.
- **Above-The-Fold Composition:** The primary focal element visible without scrolling.
- **Section Order & Hierarchy:** Explicit section sequences with focal weights (`primary`, `secondary`, `supporting`).
- **Required Component Contracts:** Specific components to mount.

---

## 14. Dynamic Design System Generation

`DesignSystemGenerator` produces a cohesive set of reusable, accessible UI primitives in `src/design-system/`:
- `tokens.ts`: Exported color, spacing, radius, and typography constants.
- `index.css`: CSS reset, `:root` custom properties, utility classes, and media queries.
- `tailwind.config.js`: Tailwind configuration bound to CSS custom properties.
- `Button.tsx`, `Badge.tsx`, `GlassCard.tsx`, `Input.tsx`, `Select.tsx`, `Modal.tsx`, `Tabs.tsx`, `Alert.tsx`, `Toast.tsx`, `Navbar.tsx`, `MetricCard.tsx`, `PageHeader.tsx`, `Skeleton.tsx`, `EmptyState.tsx`.

---

## 15. Component and Interaction Generation

### 15.1 Real Functional Workflows
All interactive elements must possess real working event handlers and state:
- Buttons trigger modal flows or update local state.
- Sliders dynamically filter data or adjust simulated telemetry.
- Tabs switch visible content panes with accessible keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- Forms validate inputs, display inline error messages, and provide success feedback via toasts.

### 15.2 Resilient MetricCard & Telemetry Primitives
To prevent defects like the `9ms` metric overflowing its container:
```tsx
export const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, icon, className = '' }) => (
  <div className={`metric-card overflow-hidden w-full p-4 md:p-6 flex flex-col justify-between ${className}`}>
    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] truncate">
      <span className="truncate">{label}</span>
      {icon && <span className="text-[var(--color-primary)] flex-shrink-0 ml-2">{icon}</span>}
    </div>
    <div className="metric-value mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-[var(--color-text-primary)] truncate break-all">
      {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
    </div>
    {trend && (
      <div className="text-xs font-mono text-[var(--color-primary)] mt-1 truncate">
        {trend}
      </div>
    )}
  </div>
);
```

---

## 16. Responsive and Adaptive Layout Generation

Aegis mandates mobile-first responsive architecture:
- **Mobile Viewport (360px–375px):** Single-column fluid stack, collapsed hamburger navigation, touch targets $\ge 44\text{px} \times 44\text{px}$, reduced horizontal container padding (`px-4`), and full word-breaking on display headings.
- **Tablet Viewport (768px):** 2-column adaptive grid, side-by-side metric tiles, visible tab strips.
- **Desktop Viewport (1440px+):** 12-column modular grid, split-pane inspectors, sticky secondary rails, max content width capped at `1440px` with automatic margin centering (`mx-auto`).

---

## 17. Accessibility

Target standard: **WCAG 2.2 Level AA Compliance**:
- Semantic HTML (`<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, `<h1>`–`<h6>`).
- Exactly one `<h1>` per primary page.
- Keyboard navigability with visible focus indicators (`outline: 2px solid var(--color-primary); outline-offset: 2px`).
- Form inputs have associated `<label>` elements or `aria-label`.
- Modal dialogues trap focus, support `Escape` dismissal, and return focus to the trigger on close.
- Motion respect: `@media (prefers-reduced-motion: reduce)` disables non-essential animations.

---

## 18. Frontend Performance

- Zero oversized uncompressed imagery; all SVGs and modern formats optimized.
- Minimal bundle bloat: No unvetted UI libraries; standard Tailwind CSS utility generation with dead code elimination.
- No layout shifts (CLS): Explicit aspect ratios and skeleton loading placeholders.
- Font performance: System font fallbacks to prevent invisible text during font loading (FOIT).

---

## 19. Browser and Visual QA

The runtime verification engine in `ReadOnlyBrowserValidator` executes automated headless Chromium audits across every route and viewport:
1. **Computed Contrast Audit:** Traverses DOM text nodes and evaluates computed `color` against computed `backgroundColor` (taking parent background inheritance into account).
2. **Horizontal Overflow Audit:** Evaluates `document.documentElement.scrollWidth > window.innerWidth` across desktop (1440px), tablet (768px), and mobile (375px).
3. **Text Clipping Audit:** Evaluates `element.scrollWidth > element.clientWidth` on headings, badges, and metric values.
4. **Route Consistency Audit:** Verifies that all routes share the same global background family and typography stack.

---

## 20. Bounded Repair and Visual Regression

When visual or layout bugs are detected:
- The defects are formatted into structured `VisualIssue` objects (`element`, `bug`, `severity`, `suggestedCssFix`).
- The existing bounded repair loop applies targeted CSS/class modifications (capped at 2 repair cycles).
- The Chromium browser re-renders the repaired page and captures fresh screenshots for confirmation.

---

## 21. Research and Design Document Schemas

Every newly generated project must persist two standardized artifacts:
1. `.aegis/design/frontend-design-brief.md`: Human-readable creative brief detailing brand identity, art direction, color strategy, typography pairing, information architecture, and design rationale.
2. `.aegis/design/frontend-design-spec.json`: Machine-readable contract consumed by CoderAgent, containing exact tokens, route specifications, and component contracts.

---

## 22. Integration with Existing Aegis Modules

The enhanced architecture integrates seamlessly with the existing Aegis codebase:
- `Orchestrator` invokes `FrontendDesignBriefGenerator` right after `DesignDirector`.
- `PageDesignSpecificationEngine` results are passed directly into `CoderAgent` context.
- `DesignSystemGenerator` outputs resilient tokens and components consumed by the CoderAgent.
- `ReadOnlyBrowserValidator` inspects rendered Chromium DOM for contrast, overflow, and layout defects.

---

## 23. Implementation Milestones

- **Milestone 1:** Architecture Audit & Master Engineering Specification (Complete).
- **Milestone 2:** Machine-Readable Schema & Project Design Brief Generation.
- **Milestone 3:** Dynamic Color, Background, and Typography Engine Hardening.
- **Milestone 4:** Resilient Component & Layout Generation (Layout/Navbar consistency, MetricCard overflow fix).
- **Milestone 5:** Headless Chromium Layout, Overflow, and Contrast QA Upgrades.
- **Milestone 6:** Deterministic Multi-Domain Regression Test Suite & Verification Report.

---

## 24. Test Strategy

Due to cloud AI provider quota exhaustion, all verification is executed via **deterministic unit and integration test fixtures**:
- Fixture test suite verifying 10 diverse domains (E-commerce, Photography portfolio, Enterprise SaaS, Restaurant, Travel, Healthcare, Education, Corporate, Creative agency, Cloud ops).
- Asserting domain-specific palettes, typography scales, layout topologies, and asset strategies.
- Verifying WCAG AA contrast compliance and zero horizontal overflow on simulated viewports.

---

## 25. Acceptance Criteria

A generated frontend achieves acceptance if and only if:
1. Clean production build (`npm run build` succeeds with zero errors).
2. Zero horizontal overflow across Desktop (1440px), Tablet (768px), and Mobile (375px).
3. WCAG 2.2 AA contrast compliance across all text nodes and interactive controls.
4. Cohesive global layout with persistent, functioning navigation bar.
5. All buttons, tabs, modals, and interactive workflows react to user events.
6. Zero broken images; all assets have meaningful alt attributes.
7. Both `.aegis/design/frontend-design-brief.md` and `.aegis/design/frontend-design-spec.json` exist and validate against schema.

---

## 26. Known Limitations and Future Extensions

- **Current Limitation:** Cloud AI generation is temporarily quota-exhausted; deterministic rules and saved fixtures are utilized for rigorous local verification.
- **Future Extension:** Multi-lingual automatic RTL layout flipping for Arabic and Hebrew locales.
- **Future Extension:** Integrated WebGL shader compilation verifier for immersive 3D canvas experiences.
