/**
 * Aegis AI — Frontend Design Planner & Brief Generator
 *
 * Implements Milestone 2 & Part 5 of Autonomous Frontend Intelligence:
 * Synthesizes and persists authoritative, human-readable design briefs
 * (.aegis/design/frontend-design-brief.md) and machine-readable specification contracts
 * (.aegis/design/frontend-design-spec.json) BEFORE CoderAgent implementation begins.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type {
  FrontendDesignSpec,
  ProductIdentitySpec,
  VisualDirectionSpec,
  ColorStrategySpec,
  TypographyStrategySpec,
  SurfaceStrategySpec,
  NavigationStrategySpec,
  RouteDesignSpecification,
  ResponsiveSystemSpec,
  AccessibilitySpec,
  AssetStrategySpec,
  ResearchRationaleSpec,
} from "./frontend-design-spec-schema.js";
import { FrontendDesignSpecValidator } from "./frontend-design-spec-schema.js";
import type { ThemeSpecification } from "./theme-generator.js";
import type { ProductDesignBrief } from "./design-director.js";
import type { PageDesignSpecification } from "./page-design-specification-engine.js";

export interface FrontendDesignPlannerInput {
  prompt: string;
  projectName?: string;
  domain?: string;
  theme: ThemeSpecification;
  designBrief: ProductDesignBrief;
  pageSpecs?: PageDesignSpecification[];
  researchSynthesis?: any;
  referenceResearch?: any;
  seed?: number;
}

export class FrontendDesignPlanner {
  /**
   * Plans the complete frontend experience, generating both JSON spec and Markdown brief.
   */
  public static plan(input: FrontendDesignPlannerInput): {
    spec: FrontendDesignSpec;
    markdownBrief: string;
  } {
    const {
      prompt,
      projectName = "Aegis Studio",
      domain = "general",
      theme,
      designBrief,
      pageSpecs = [],
      researchSynthesis,
      referenceResearch,
      seed = 42,
    } = input;

    const specId = `spec_${createHash("sha256").update(`${prompt}_${seed}`).digest("hex").slice(0, 16)}`;
    const now = new Date().toISOString();

    // 1. Product Identity
    const audienceCtx = designBrief.productCharacteristics?.audienceContext;
    const isProfessional = audienceCtx?.isProfessional ?? true;
    const rawSavviness = audienceCtx?.techSavviness;
    const mappedSavviness: "low" | "medium" | "high" =
      rawSavviness === "expert" ? "high" : rawSavviness === "novice" ? "low" : "medium";

    const projectIdentity: ProductIdentitySpec = {
      productName: projectName,
      businessDomain: domain,
      productCategory: designBrief.productCharacteristics?.experiencePattern || "specialized-application",
      targetAudience: {
        primaryUser: isProfessional ? "Professional Operators & Engineers" : "General Consumers & Enthusiasts",
        techSavviness: mappedSavviness,
        context: isProfessional ? "professional" : "consumer",
      },
      brandPersonality: [
        designBrief.productCharacteristics?.emotionalTone?.primary || "Authoritative",
        designBrief.productCharacteristics?.emotionalTone?.secondary || "Precise",
        "Domain-Authentic",
      ],
      primaryUserObjective: `Accomplish core workflows for ${projectName} with zero cognitive friction and high responsiveness.`,
      primaryConversionOrOperationalObjective: `Maximize operational efficiency, clear telemetry visibility, and rapid task completion.`,
      explicitUserRequirements: [prompt],
      inferredRequirements: [
        "Responsive cross-device layout (Desktop 1440px, Tablet 768px, Mobile 375px)",
        "Zero horizontal viewport overflow and word-clipping prevention",
        "WCAG 2.2 AA accessible color contrast across all routes",
        "Interactive state feedback (loading, error, success toasts)",
        "Unified global navigation shell with responsive mobile toggle",
      ],
    };

    // 2. Visual Direction
    const rawDensity = designBrief.productCharacteristics?.informationDensity;
    const mappedDensity: "compact" | "moderate" | "spacious" =
      rawDensity === "dense" ? "compact" : rawDensity === "minimal" ? "spacious" : "moderate";

    const visualDirection: VisualDirectionSpec = {
      artDirectionName: designBrief.artDirectionName || "Obsidian Precision",
      artDirectionRationale: designBrief.artDirectionRationale || "Derived from product domain requirements and user expectations.",
      emotionalResponse: "Focus, trust, and effortless domain mastery",
      visualPersonality: {
        mood: designBrief.productCharacteristics?.emotionalTone?.primary || "focused",
        formality: isProfessional ? "formal" : "balanced",
        density: mappedDensity,
      },
      compositionStrategy: (designBrief as any).compositionStrategy || "HERO_CANVAS_SPLIT",
      visualDifferentiators: [
        "Domain-bespoke typography pairings with fluid clamp scaling",
        "Mathematical WCAG AA verified color system",
        "Zero generic 3-column marketing card repetition",
        "Bespoke layout structures tailored to each route's functional role",
      ],
    };

    // 3. Color Strategy
    const p = theme.palette;
    const colorStrategy: ColorStrategySpec = {
      paletteMode: theme.mode,
      primaryBrandColor: p.primary,
      primaryHover: p.primaryHover,
      primaryActive: p.primaryActive,
      primarySubtle: p.primarySubtle,
      secondaryBrandColor: p.secondary,
      secondaryHover: p.secondaryHover,
      accentColors: [p.accent, p.semantic.warning, p.semantic.info],
      backgroundColor: p.background,
      secondaryBackground: p.neutralScale[900] || p.surface,
      surfaceColor: p.surface,
      surfaceElevated: p.surfaceRaised,
      surfaceMuted: p.surfaceMuted,
      textHeadingColor: p.textPrimary,
      textPrimaryColor: p.textPrimary,
      textSecondaryColor: p.textSecondary,
      textMutedColor: p.textMuted,
      textOnPrimary: p.textOnPrimary,
      borderColor: p.border,
      borderSubtle: p.borderSubtle,
      focusRingColor: p.focusRing,
      semanticColors: {
        success: p.semantic.success,
        warning: p.semantic.warning,
        danger: p.semantic.error,
        info: p.semantic.info,
      },
      chartPalette: [
        p.primary,
        p.secondary,
        p.accent,
        p.semantic.success,
        p.semantic.warning,
        p.semantic.info,
      ],
      contrastAudit: theme.contrastAudit,
      rationale: `Selected ${theme.mode} palette with brand hue ${theme.brandHue}° satisfying WCAG AA requirements (Normal text ${theme.contrastAudit.textOnSurface.ratio}:1, Button text ${theme.contrastAudit.textOnPrimaryButton.ratio}:1).`,
    };

    // 4. Typography Strategy
    const typo = designBrief.typography;
    const typographyStrategy: TypographyStrategySpec = {
      displayFont: typo?.displayFont || "Inter, system-ui, sans-serif",
      headingFont: typo?.displayFont || "Inter, system-ui, sans-serif",
      bodyFont: typo?.bodyFont || "Inter, system-ui, sans-serif",
      uiFont: typo?.bodyFont || "Inter, system-ui, sans-serif",
      monoFont: "JetBrains Mono, IBM Plex Mono, monospace",
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      headingScale: {
        display: "clamp(2rem, 5vw, 3.5rem)",
        h1: "clamp(1.75rem, 3.5vw, 2.5rem)",
        h2: "clamp(1.35rem, 2.5vw, 1.85rem)",
        h3: "clamp(1.1rem, 1.8vw, 1.4rem)",
      },
      bodyScale: {
        lead: "1.125rem",
        base: "1rem",
        small: "0.875rem",
        micro: "0.75rem",
      },
      lineHeights: {
        headings: 1.15,
        body: 1.6,
      },
      letterSpacing: {
        headings: "-0.025em",
        body: "0em",
        uppercase: "0.06em",
      },
      responsiveTypographyRules: [
        "All headings MUST use fluid clamp sizing to prevent cut-off headings on mobile (360px-375px).",
        "All display text MUST specify break-words and hyphens-auto to eliminate horizontal text clipping.",
        "Line lengths for prose must be capped between 45 and 75 characters (max-w-prose).",
      ],
    };

    // 5. Surface Strategy
    const surfaceStrategy: SurfaceStrategySpec = {
      surfaceTreatment: theme.mode === "obsidian" ? "flat_ruled" : "subtle_elevation",
      cardShadow: theme.componentTokens.card.shadow,
      cardBorder: `1px solid ${p.border}`,
      elevationLevels: {
        base: p.surface,
        raised: p.surfaceRaised,
        floating: p.surfaceRaised,
      },
      radii: {
        sm: "0.25rem",
        md: designBrief.geometry?.radiusMd || "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        full: "9999px",
      },
      borders: {
        subtle: `1px solid ${p.borderSubtle}`,
        standard: `1px solid ${p.border}`,
        accent: `1px solid ${p.primary}`,
      },
    };

    // 6. Navigation Strategy
    const routesList = (designBrief.pageCompositions || []).map((pc) => pc.route);
    const navItems = (routesList.length > 0 ? routesList : ["/"]).map((r) => ({
      label: r === "/" ? "Home" : r.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: r,
    }));
    const rawNav = designBrief.navigation?.strategy;
    const mappedStrategy: NavigationStrategySpec["strategy"] =
      rawNav === "sidebar-rail" ? "SIDEBAR_COLLAPSIBLE" :
      rawNav === "minimal-sidebar" ? "MINIMAL_STICKY" :
      rawNav === "top-flat" ? "TOPBAR_EXPANSIVE" :
      rawNav === "command-console" ? "FLOATING_ISLAND" : "TOPBAR_PILL";

    const navigationStrategy: NavigationStrategySpec = {
      strategy: mappedStrategy,
      maxPrimaryItems: designBrief.navigation?.maxPrimaryItems || 5,
      primaryItems: navItems.slice(0, 5),
      secondaryNav: navItems.length > 5 ? {
        type: "dropdown",
        items: navItems.slice(5),
      } : undefined,
      mobileNavigation: {
        type: "drawer",
        breakpoint: "md (768px)",
      },
    };

    // 7. Route Pages
    const pages: RouteDesignSpecification[] = (pageSpecs.length > 0 ? pageSpecs : (designBrief.pageCompositions || [])).map((spec: any, idx: number) => {
      const route = spec.route || (idx === 0 ? "/" : `/page-${idx}`);
      const pageName = spec.pageName || spec.name || (route === "/" ? "Overview" : route.replace(/^\//, ""));
      return {
        route,
        pageName,
        purpose: spec.purpose || `Primary interactive surface for ${pageName}`,
        userIntent: spec.role || `User inspects and interacts with ${pageName} modules`,
        primaryAction: `Engage with ${pageName}`,
        contentHierarchy: [
          `Page Header with ${pageName} H1 and contextual status badge`,
          "Primary interactive stage / workspace",
          "Supporting data cards, timeline, or parameter controls",
        ],
        sectionOrder: (spec.sections && spec.sections.length > 0)
          ? spec.sections.map((s: any, sIdx: number) => ({
              name: typeof s === "string" ? s : s.name,
              purpose: typeof s === "string" ? `Workflow section for ${s}` : s.purpose,
              focalWeight: (sIdx === 0 ? "primary" : sIdx === 1 ? "secondary" : "supporting") as "primary" | "secondary" | "supporting",
              structure: "RESPONSIVE_CONTAINER",
            }))
          : [
              { name: `${pageName.replace(/[^a-zA-Z0-9]/g, "")}Hero`, purpose: `Introduce ${pageName} scope`, focalWeight: "primary", structure: "RESPONSIVE_SPREAD" },
              { name: `${pageName.replace(/[^a-zA-Z0-9]/g, "")}Workspace`, purpose: `Execute core workflow`, focalWeight: "secondary", structure: "MODULAR_GRID" },
            ],
        layout: {
          desktop: "12-column responsive grid with max content width of 1440px and fluid centering",
          tablet: "2-column modular split with touch-optimized controls",
          mobile: "Single-column fluid stack with zero horizontal overflow",
        },
        visualComposition: spec.topology || "BESPOKE_INTERACTIVE_STAGE",
        components: spec.components || [`${pageName.replace(/[^a-zA-Z0-9]/g, "")}View`],
        imageRequirements: {
          needed: false,
          type: "schematic_svg",
          description: "Technical SVG diagram and time-series telemetry charts rather than stock photography",
        },
        interactionRequirements: [
          { control: "State Trigger Button", type: "button", trigger: "User click", feedback: "Toast confirmation and optimistic UI update" },
          { control: "Filter / Parameter Input", type: "input", trigger: "Value change", feedback: "Instant state update with debounce" },
        ],
        states: {
          loading: "Skeleton shimmer overlay matching exact layout geometry",
          empty: "Domain-authentic empty state with clear call to action",
          error: "High-contrast alert banner with retry capability",
          success: "Accessible toast notification and confirmed status badge",
        },
        mobileBehavior: "Single-column fluid stack, reduced padding (px-4), touch targets >= 44px, hamburger menu toggle.",
      };
    });

    // 8. Responsive System
    const responsiveSystem: ResponsiveSystemSpec = {
      breakpoints: {
        mobile: "360px - 640px",
        tablet: "641px - 1024px",
        desktop: "1025px - 1440px",
        wide: "1441px+",
      },
      containerMaxWidth: "1440px",
      containerPadding: {
        mobile: "1rem (16px)",
        tablet: "1.5rem (24px)",
        desktop: "2rem (32px)",
      },
      columnGrids: {
        mobile: 1,
        tablet: 2,
        desktop: 12,
      },
      overflowProtectionRules: [
        "Root container enforces min-h-screen, w-full, overflow-x-hidden.",
        "Headings enforce break-words and hyphens-auto.",
        "Metric cards enforce truncate on labels and values to prevent protrusion (e.g. 9ms defect).",
        "Grids on mobile default to grid-cols-1 or sm:grid-cols-2 instead of fixed multi-column spans.",
      ],
    };

    // 9. Accessibility
    const accessibility: AccessibilitySpec = {
      wcagTarget: "WCAG_2_2_AA",
      minimumContrastNormalText: 4.5,
      minimumContrastLargeText: 3.0,
      keyboardFocusRingStyle: `2px solid ${p.focusRing} with 2px offset`,
      reducedMotionFallback: true,
      screenReaderAnnouncements: true,
      ariaRequiredAttributes: [
        "aria-label on icon-only buttons",
        "aria-expanded on mobile menu toggle and collapsible dropdowns",
        "role='alert' or aria-live='polite' on dynamic toast notifications",
        "aria-selected on active tabs",
      ],
    };

    // 10. Asset Strategy
    const assetStrategy: AssetStrategySpec = {
      imagesNeeded: false,
      artDirection: "Technical schematic graphics, SVG telemetry indicators, and data charts.",
      manifest: [],
      zeroBrokenImagesGuaranteed: true,
    };

    // 11. Research Rationale
    const liveRefSources = referenceResearch?.sources || [];
    const researchRationale: ResearchRationaleSpec = {
      domain,
      category: projectIdentity.productCategory,
      referencesResearched: liveRefSources.length > 0 ? liveRefSources.map((s: any) => ({
        name: s.domainName || s.title || "Industry Reference",
        urlOrSource: s.url || "Curated Reference Catalog",
        date: new Date().toISOString().split("T")[0],
        insight: s.principlesExtracted?.[0] || "High-density operational clarity and purposeful contrast.",
      })) : [
        {
          name: "Domain Telemetry & Operations Architecture",
          urlOrSource: "Aegis Curated Engineering Intelligence",
          date: new Date().toISOString().split("T")[0],
          insight: "Technical operational platforms demand high contrast, immediate telemetry visibility, and responsive resilience without decorative distractions.",
        },
      ],
      conventionsObserved: [
        "Clear hierarchy separating high-level status from deep telemetry",
        "Persistent navigation with immediate routing between operational views",
        "Immediate user feedback on incident declaration and parameter adjustments",
      ],
      principlesDerived: [
        "Contrast is a safety feature: critical indicators must never fall below 4.5:1 ratio",
        "Mobile layouts must be first-class operational tools, not squeezed desktop screenshots",
        "Design tokens must govern 100% of component surfaces without ad-hoc inline leaks",
      ],
      researchMode: liveRefSources.length > 0 ? "LIVE_NETWORK" : "AUTONOMOUS_GROUNDED_CATALOG",
    };

    const spec: FrontendDesignSpec = {
      version: "1.0.0",
      specId,
      createdAt: now,
      projectIdentity,
      visualDirection,
      colorStrategy,
      typographyStrategy,
      surfaceStrategy,
      navigationStrategy,
      pages,
      responsiveSystem,
      accessibility,
      assetStrategy,
      researchRationale,
    };

    const markdownBrief = this.formatMarkdownBrief(spec);

    return { spec, markdownBrief };
  }

  /**
   * Generates comprehensive GitHub-flavored Markdown brief.
   */
  public static formatMarkdownBrief(spec: FrontendDesignSpec): string {
    const id = spec.projectIdentity;
    const vd = spec.visualDirection;
    const cs = spec.colorStrategy;
    const ty = spec.typographyStrategy;
    const ss = spec.surfaceStrategy;
    const ns = spec.navigationStrategy;
    const rs = spec.responsiveSystem;
    const ac = spec.accessibility;
    const rr = spec.researchRationale;

    return `# Frontend Design Brief: ${id.productName}

> **Document ID:** \`${spec.specId}\`
> **Generated:** ${spec.createdAt}
> **Status:** Authoritative & Binding Implementation Mandate
> **Research Mode:** ${rr.researchMode}

---

## 1. Product Identity

- **Product Name:** ${id.productName}
- **Business Domain:** ${id.businessDomain}
- **Product Category:** ${id.productCategory}
- **Target Audience:** ${id.targetAudience.primaryUser} (${id.targetAudience.context}, ${id.targetAudience.techSavviness} tech savviness)
- **Brand Personality:** ${id.brandPersonality.join(", ")}
- **Primary User Objective:** ${id.primaryUserObjective}
- **Primary Conversion / Operational Objective:** ${id.primaryConversionOrOperationalObjective}

### Explicit User Requirements
${id.explicitUserRequirements.map((r) => `- ${r}`).join("\n")}

### Inferred UX Requirements
${id.inferredRequirements.map((r) => `- [Inferred] ${r}`).join("\n")}

---

## 2. Chosen Visual Direction

- **Art Direction:** **${vd.artDirectionName}**
- **Rationale:** ${vd.artDirectionRationale}
- **Emotional Response:** ${vd.emotionalResponse}
- **Visual Personality:** ${vd.visualPersonality.mood} (Formality: ${vd.visualPersonality.formality}, Density: ${vd.visualPersonality.density})
- **Composition Strategy:** \`${vd.compositionStrategy}\`
- **Key Visual Differentiators:**
${vd.visualDifferentiators.map((d) => `  - ${d}`).join("\n")}

---

## 3. Colour Strategy

The palette is dynamically reasoned from domain semantics and mathematically verified for WCAG 2.2 AA compliance.

| Semantic Token | Value | Role |
|---|---|---|
| \`canvas\` (\`background\`) | \`${cs.backgroundColor}\` | Global page ground |
| \`surface\` | \`${cs.surfaceColor}\` | Primary card and panel surface |
| \`surface-elevated\` | \`${cs.surfaceElevated}\` | Modal, dropdown, and active stages |
| \`brand-primary\` | \`${cs.primaryBrandColor}\` | Primary CTA, key telemetry highlights |
| \`brand-secondary\` | \`${cs.secondaryBrandColor}\` | Secondary badges and supporting indicators |
| \`text-primary\` | \`${cs.textPrimaryColor}\` | Headings and high-emphasis body text |
| \`text-secondary\` | \`${cs.textSecondaryColor}\` | Standard body prose and labels |
| \`text-muted\` | \`${cs.textMutedColor}\` | Minor timestamps, units, metadata |
| \`border-standard\` | \`${cs.borderColor}\` | Container and divider rules |
| \`focus-ring\` | \`${cs.focusRingColor}\` | Accessible keyboard navigation indicator |

### Contrast Verification Audit (WCAG AA)
- **Text on Background:** \`${cs.contrastAudit.textOnBackground.ratio}:1\` (Passes AA: **${cs.contrastAudit.textOnBackground.passesAA}**)
- **Text on Surface:** \`${cs.contrastAudit.textOnSurface.ratio}:1\` (Passes AA: **${cs.contrastAudit.textOnSurface.passesAA}**)
- **Text Secondary on Surface:** \`${cs.contrastAudit.textSecondaryOnSurface.ratio}:1\` (Passes AA: **${cs.contrastAudit.textSecondaryOnSurface.passesAA}**)
- **Button Text on Primary:** \`${cs.contrastAudit.textOnPrimaryButton.ratio}:1\` (Passes AA: **${cs.contrastAudit.textOnPrimaryButton.passesAA}**)
- **Overall Contrast Valid:** **${cs.contrastAudit.overallValid}**

---

## 4. Typography Strategy

Fluid clamp scaling and word-breaking constraints are enforced to eliminate mobile text clipping:

- **Display & Heading Font:** \`${ty.displayFont}\`
- **Body & UI Font:** \`${ty.bodyFont}\`
- **Telemetry & Monospace Font:** \`${ty.monoFont}\`
- **Heading Scale:**
  - Display: \`${ty.headingScale.display}\`
  - H1: \`${ty.headingScale.h1}\`
  - H2: \`${ty.headingScale.h2}\`
  - H3: \`${ty.headingScale.h3}\`
- **Line Heights:** Headings \`${ty.lineHeights.headings}\`, Body \`${ty.lineHeights.body}\`
- **Letter Spacing:** Headings \`${ty.letterSpacing.headings}\`, Uppercase labels \`${ty.letterSpacing.uppercase}\`

---

## 5. Background and Surface Strategy

- **Surface Treatment:** \`${ss.surfaceTreatment}\`
- **Card Shadow:** \`${ss.cardShadow}\`
- **Card Border:** \`${ss.cardBorder}\`
- **Border Radii:** SM: \`${ss.radii.sm}\`, MD: \`${ss.radii.md}\`, LG: \`${ss.radii.lg}\`, XL: \`${ss.radii.xl}\`

---

## 6. Information Architecture & Navigation

- **Navigation Model:** \`${ns.strategy}\`
- **Max Primary Links:** \`${ns.maxPrimaryItems}\` (All additional routes placed in sub-navigation)
- **Primary Routes:**
${ns.primaryItems.map((item) => `  - [${item.label}](${item.href})`).join("\n")}
- **Mobile Navigation:** Responsive hamburger toggle expanding full-width navigation drawer.

---

## 7. Page-by-Page Specifications

${spec.pages.map((p, idx) => `### Route ${idx + 1}: \`${p.route}\` (${p.pageName})

- **Purpose:** ${p.purpose}
- **User Intent:** ${p.userIntent}
- **Visual Composition:** \`${p.visualComposition}\`
- **Primary Action:** ${p.primaryAction}
- **Section Order:**
${p.sectionOrder.map((s) => `  1. **${s.name}** (${s.focalWeight} focus): ${s.purpose}`).join("\n")}
- **Desktop Layout:** ${p.layout.desktop}
- **Mobile Layout:** ${p.layout.mobile}
- **Interactive Controls:**
${p.interactionRequirements.map((i) => `  - *${i.control}* (${i.type}): ${i.trigger} -> ${i.feedback}`).join("\n")}
- **Component Contracts:** \`${p.components.join(", ")}\`
`).join("\n")}

---

## 8. Responsive Specifications & Viewport Hardening

- **Max Container Width:** \`${rs.containerMaxWidth}\` (centered via \`mx-auto\`)
- **Container Padding:** Mobile: \`${rs.containerPadding.mobile}\`, Tablet: \`${rs.containerPadding.tablet}\`, Desktop: \`${rs.containerPadding.desktop}\`
- **Overflow Prevention Rules:**
${rs.overflowProtectionRules.map((rule) => `  - ${rule}`).join("\n")}

---

## 9. Accessibility Specifications

- **Standard Target:** \`${ac.wcagTarget}\`
- **Focus Rings:** \`${ac.keyboardFocusRingStyle}\`
- **Reduced Motion Support:** Required via \`prefers-reduced-motion\`
- **Mandatory ARIA Rules:**
${ac.ariaRequiredAttributes.map((a) => `  - ${a}`).join("\n")}

---

## 10. Research Rationale & Grounding

- **Domain Category:** ${rr.category}
- **Observed Conventions:**
${rr.conventionsObserved.map((c) => `  - ${c}`).join("\n")}
- **Design Principles Derived:**
${rr.principlesDerived.map((p) => `  - ${p}`).join("\n")}
`;
  }

  /**
   * Persists both .aegis/design/frontend-design-spec.json and .aegis/design/frontend-design-brief.md.
   */
  public static saveToProject(outputDirectory: string, planResult: { spec: FrontendDesignSpec; markdownBrief: string }): void {
    const designDir = join(outputDirectory, ".aegis", "design");
    if (!existsSync(designDir)) {
      mkdirSync(designDir, { recursive: true });
    }

    const specPath = join(designDir, "frontend-design-spec.json");
    const briefPath = join(designDir, "frontend-design-brief.md");

    writeFileSync(specPath, JSON.stringify(planResult.spec, null, 2), "utf8");
    writeFileSync(briefPath, planResult.markdownBrief, "utf8");

    // Also mirror to .aegis root for backward compatibility with existing locks
    const rootBriefMd = join(outputDirectory, ".aegis", "frontend-design-brief.md");
    writeFileSync(rootBriefMd, planResult.markdownBrief, "utf8");
  }
}
