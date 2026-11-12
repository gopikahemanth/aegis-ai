/**
 * Aegis AI — Design Decision Document (DDD) Engine
 *
 * Implements the authoritative pre-implementation design specification (Sections A–G).
 * Generates and persists `.aegis/design-decision-document.json` and
 * `.aegis/design-decision-document.md`.
 *
 * Serves as the single immutable design authority consumed by:
 * - Architecture planning
 * - Page-by-page experience planning
 * - Frontend coding (CoderAgent)
 * - Anti-convergence verification (TemplateConvergenceGate)
 * - Browser visual review
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  DesignReferenceIntelligence,
  type DesignResearchSynthesis,
} from "./design-reference-intelligence.js";
import { DomainVisualContractGenerator } from "./domain-visual-contract.js";
import type { PageExperiencePlan } from "./page-experience-plan.js";
import { AssetDirector } from "./asset-director.js";
import type { AssetManifest } from "./asset-types.js";

export interface PageBlueprint {
  pageName: string;
  route: string;
  primaryUser: string;
  primaryPurpose: string;
  userGoal: string;
  informationHierarchy: string[];
  aboveTheFoldStructure: string;
  overallComposition: string;
  sectionOrder: string[];
  mainVisualElement: string;
  uniqueFunctionalModules: string[];
  controlsAndActions: string[];
  interactionBehavior: string;
  contentRequirements: string[];
  dataRequirements: string[];
  loadingState: string;
  emptyState: string;
  errorState: string;
  successState: string;
  mobileLayout: string;
  tabletLayout: string;
  desktopLayout: string;
  accessibility: string;
  acceptanceCriteria: string[];
}

export interface PageDifferentiationRow {
  route: string;
  pageName: string;
  mainComposition: string;
  mainInteraction: string;
  primaryVisualElement: string;
  uniqueSignatureKey: string;
}

export interface DesignDecisionDocument {
  version: "1.0";
  documentId: string;
  generatedAt: string;

  // Section A: Project Identity
  projectIdentity: {
    productName: string;
    productPurpose: string;
    targetUsers: string;
    userTypes: string[];
    primaryGoals: string[];
    secondaryGoals: string[];
    brandPersonality: string;
    visualThesis: string;
  };

  // Section B: Reference Research
  referenceResearch: {
    selectedReferences: Array<{
      name: string;
      url: string;
      pagesStudied: string[];
      principlesExtracted: string[];
      patternsRejected: string[];
    }>;
    originalityDecisions: string[];
  };

  // Section C: Visual System
  visualSystem: {
    colorPalette: {
      background: string;
      secondaryBackground: string;
      surface: string;
      surfaceRaised: string;
      primaryText: string;
      secondaryText: string;
      mutedText: string;
      primaryAccent: string;
      secondaryAccent: string;
      border: string;
      success: string;
      warning: string;
      error: string;
      rationale: string;
    };
    typography: {
      displayFont: string;
      headingFont: string;
      bodyFont: string;
      monoFont: string;
      displayScale: string;
      lineHeights: string;
      letterSpacing: string;
    };
    spatialSystem: {
      contentWidthMax: string;
      pageMargins: string;
      gridColumns: number;
      sectionSpacing: string;
      componentSpacing: string;
      density: "spacious" | "balanced" | "compact";
      borderTreatment: string;
      borderRadius: string;
      shadowTreatment: string;
      imageProportions: string;
    };
    imageDirection: {
      style: string;
      curationRules: string[];
    };
    motionDirection: {
      pageTransitions: string;
      hoverBehavior: string;
      scrollEffects: string;
      feedbackAnimations: string;
    };
  };

  // Section D: Complete Sitemap
  sitemap: Array<{
    route: string;
    pageName: string;
    role: string;
    purpose: string;
    isPrimaryLanding: boolean;
  }>;

  // Section E: Individual Page Blueprints (24 points per route)
  pageBlueprints: PageBlueprint[];

  // Section F: Cross-Page Differentiation Matrix
  differentiationMatrix: PageDifferentiationRow[];
  differentiationAudit: {
    totalRoutes: number;
    distinctTopologies: number;
    distinctInteractions: number;
    convergenceDetected: boolean;
    auditSummary: string;
  };

  // Section G: Quality Criteria
  qualityCriteria: {
    visualQuality: string[];
    experienceQuality: string[];
    functionalQuality: string[];
  };

  // Section H: Authoritative Visual Asset Plan
  assetManifest: AssetManifest;
}

export class DesignDecisionDocumentEngine {
  /**
   * Synthesizes the complete Design Decision Document before coding begins.
   */
  public static generateDocument(options: {
    prompt: string;
    brandName: string;
    routes: string[];
    pagePlans: PageExperiencePlan[];
    domainHint?: string;
    researchSynthesis?: DesignResearchSynthesis;
    userTypes?: string[];
    secondaryGoals?: string[];
    brandPersonality?: string;
  }): DesignDecisionDocument {
    const { prompt, brandName, routes, pagePlans, domainHint } = options;

    // 1. Conduct Dynamic Reference Research
    const research: DesignResearchSynthesis = (options as any).researchSynthesis || DesignReferenceIntelligence.research(prompt, domainHint);

    // 2. Build Section A: Project Identity
    const userTypes = (options as any).userTypes && (options as any).userTypes.length > 0
      ? (options as any).userTypes
      : /pet|sanctuary|animal/i.test(`${domainHint || ""} ${prompt}`)
      ? [
          "Pet Guardian / Pet Parent",
          "Sanctuary Caretaker / Veterinarian Specialist",
          "Volunteer Coordinator & Shelter Administrator",
        ]
      : /architect|interior|building|atelier/i.test(`${domainHint || ""} ${prompt}`)
      ? [
          "Commissioning Client / Patron",
          "Professional Architect / Specialist",
          "Studio Director & Atelier Project Manager",
        ]
      : [
          `Primary Patron / Client of ${brandName}`,
          `Domain Specialist / Practitioner`,
          `Operations & Platform Administrator`,
        ];

    // Primary goals extracted directly from page plans / blueprints
    const primaryGoals: string[] = [];
    for (const r of routes) {
      const plan = pagePlans.find((p) => p.route === r || p.route === r.replace(/^\//, ""));
      const cleanName = r === "/" ? "Home" : r.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      if (plan?.purpose && plan.purpose.length > 10) {
        primaryGoals.push(plan.purpose);
      } else if (plan?.experienceIntent) {
        primaryGoals.push(plan.experienceIntent);
      } else {
        primaryGoals.push(`Accomplish ${cleanName} user journey with dedicated interactive controls`);
      }
    }
    for (const wf of (research.primaryWorkflows || [])) {
      if (primaryGoals.length < 6 && !primaryGoals.includes(wf)) {
        primaryGoals.push(wf);
      }
    }

    const secondaryGoals = (options as any).secondaryGoals || [
      `Export or download personalized summaries and specification documents`,
      `Filter and inspect items using authentic domain criteria and tags`,
      `Preserve configuration states with instant visual feedback and persistent updates`,
    ];

    const brandPersonality = (options as any).brandPersonality || (
      research.visualThesis ? research.visualThesis.split(":")[0] : "Bespoke, authentic, and purpose-driven"
    );

    const projectIdentity = {
      productName: brandName,
      productPurpose: research.visualThesis,
      targetUsers: research.targetAudience || "Domain clients and practitioners",
      userTypes,
      primaryGoals,
      secondaryGoals,
      brandPersonality,
      visualThesis: research.visualThesis,
    };

    // 3. Build Section B: Reference Research
    const referenceResearch = {
      selectedReferences: research.selectedReferences.map((r) => ({
        name: r.reference.name,
        url: r.reference.url,
        pagesStudied: r.reference.studiedPages,
        principlesExtracted: r.extractedPrinciples,
        patternsRejected: r.rejectedAntiPatterns,
      })),
      originalityDecisions: research.originalityDecisions,
    };

    // 4. Build Section C: Visual System
    const colors = research.sharedDesignLanguage.colorPaletteDirection;
    const bgLum = DomainVisualContractGenerator.getLuminance(colors.background);
    const isDark = bgLum < 0.5;

    const surface = isDark
      ? (colors.surface && DomainVisualContractGenerator.getLuminance(colors.surface) < 0.5 ? colors.surface : "#111622")
      : (colors.surface && DomainVisualContractGenerator.getLuminance(colors.surface) >= 0.5 ? colors.surface : "#FFFFFF");

    const surfaceRaised = isDark ? "#1a2234" : "#FAF8F5";

    let primaryText = colors.text;
    const bgContrast = DomainVisualContractGenerator.getContrastRatio(primaryText, colors.background);
    const surfaceContrast = DomainVisualContractGenerator.getContrastRatio(primaryText, surface);
    if (bgContrast < 4.5 || surfaceContrast < 4.5) {
      primaryText = isDark ? "#F8FAFC" : "#0F172A";
    }

    const secondaryText = isDark ? "#A1A1AA" : "#57534E";
    const mutedText = isDark ? "#71717A" : "#78716C";
    const border = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(70, 83, 66, 0.15)";
    const textOnPrimary = DomainVisualContractGenerator.getContrastRatio("#FFFFFF", colors.primary) >= 4.5 ? "#FFFFFF" : "#0F172A";
    const textOnAccent = DomainVisualContractGenerator.getContrastRatio("#FFFFFF", colors.accent) >= 4.5 ? "#FFFFFF" : "#0F172A";

    const visualSystem = {
      colorPalette: {
        background: colors.background,
        secondaryBackground: surface,
        surface,
        surfaceRaised,
        primaryText,
        secondaryText,
        mutedText,
        primaryAccent: colors.primary,
        secondaryAccent: colors.accent,
        textOnPrimary,
        textOnAccent,
        border,
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        rationale: colors.rationale,
      },
      typography: {
        displayFont: research.sharedDesignLanguage.typographyPairing.display,
        headingFont: research.sharedDesignLanguage.typographyPairing.display,
        bodyFont: research.sharedDesignLanguage.typographyPairing.body,
        monoFont: research.sharedDesignLanguage.typographyPairing.mono,
        displayScale: "clamp(2.5rem, 5vw, 4.5rem)",
        lineHeights: "1.15 for headings, 1.6 for prose, 1.4 for UI",
        letterSpacing: "-0.02em for headings, normal for body, 0.05em for metadata",
      },
      spatialSystem: {
        contentWidthMax: "1440px",
        pageMargins: "clamp(1.5rem, 4vw, 4rem)",
        gridColumns: 12,
        sectionSpacing: "clamp(4rem, 8vw, 8rem)",
        componentSpacing: "clamp(1.5rem, 3vw, 2.5rem)",
        density: research.sharedDesignLanguage.spatialDensity,
        borderTreatment: `1px solid ${colors.text}18`,
        borderRadius: research.sharedDesignLanguage.spatialDensity === "compact"
          ? "2px-4px (compact, precision, operational)"
          : research.sharedDesignLanguage.spatialDensity === "spacious"
          ? "8px-12px (friendly, organic, rounded)"
          : "4px (refined, balanced)",
        shadowTreatment: "soft-floating ambient shadows without harsh outlines",
        imageProportions: research.sharedDesignLanguage.spatialDensity === "compact"
          ? "16:9 for geospatial overview, 3:2 for telemetry and analytical charts"
          : "16:9 for primary showcases, 4:3 for feature showcases, 1:1 for tactile details",
      },
      imageDirection: {
        style: research.sharedDesignLanguage.imageryTreatment,
        curationRules: [
          `Every image must be high-resolution, professionally composed, and authentic to ${research.productCategory}`,
          "Never insert generic stock photos of unrelated subjects",
          `Pair visual assets harmoniously with ${colors.background} ground and ${colors.primary} accent tone`,
        ],
      },
      motionDirection: {
        pageTransitions: "Graceful opacity and subtle 8px Y-axis settle",
        hoverBehavior: "Subtle scale (1.01) with smooth shadow elevation",
        scrollEffects: "Parallax image drift and pinned section headers",
        feedbackAnimations: research.sharedDesignLanguage.motionPhilosophy,
      },
    };

    // 5. Build Section D: Complete Sitemap
    const sitemap = routes.map((r) => {
      const plan = pagePlans.find((p) => p.route === r || p.route === r.replace(/^\//, ""));
      const cleanName = r === "/" ? "Home" : r.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      return {
        route: r,
        pageName: cleanName,
        role: plan?.pageRole || `${cleanName} Dedicated Stage`,
        purpose: plan?.purpose || `Provide purposeful workflow for ${cleanName}`,
        isPrimaryLanding: r === "/",
      };
    });

    // 6. Build Section E: Individual Page Blueprints (24 points per route)
    const pageBlueprints: PageBlueprint[] = routes.map((r) => {
      const plan = pagePlans.find((p) => p.route === r || p.route === r.replace(/^\//, ""));
      const cleanName = r === "/" ? "Home" : r.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const topology = plan?.composition?.topology || "BESPOKE_STAGE";
      const sections = plan?.composition?.sections || [`${cleanName} Header`, `${cleanName} Content`, `${cleanName} Actions`];
      const primaryInteractions = plan?.interaction?.primary || [`Explore and interact with ${cleanName} features`];

      return {
        pageName: cleanName,
        route: r,
        primaryUser: projectIdentity.targetUsers,
        primaryPurpose: plan?.purpose || `Dedicated interactive workflow for ${cleanName}`,
        userGoal: `Accomplish ${cleanName.toLowerCase()} tasks efficiently with clear visual feedback`,
        informationHierarchy: [
          `1. ${plan?.focalElement || `${cleanName} Primary Anchor`}`,
          `2. Section: ${sections[0] || "Overview"}`,
          `3. Controls: ${primaryInteractions[0] || "Primary Action"}`,
          `4. Contextual Details & Secondary Actions`
        ],
        aboveTheFoldStructure: `Prominent headline with ${plan?.focalElement || cleanName} stage immediately visible on initial load.`,
        overallComposition: topology,
        sectionOrder: sections,
        mainVisualElement: plan?.focalElement || `${cleanName} Visual Stage`,
        uniqueFunctionalModules: [`${cleanName.replace(/\s+/g, "")}PrimaryStage`, `${cleanName.replace(/\s+/g, "")}Controls`],
        controlsAndActions: primaryInteractions,
        interactionBehavior: plan?.motion?.scroll || "Fluid interactive response with immediate visual feedback",
        contentRequirements: [
          `Authoritative domain-specific content for ${cleanName}`,
          "Zero placeholder text or lorem ipsum",
          "Rich technical and descriptive specifications"
        ],
        dataRequirements: [
          `Dynamic dataset supporting ${cleanName} interactions`,
          "Validated types and persistent state synchronization"
        ],
        loadingState: "Polished skeleton layout matching exact section heights with subtle shimmer",
        emptyState: "Thoughtful guidance message with clear call-to-action to initialize data",
        errorState: "Contextual recovery banner with retry action and error explanation",
        successState: "Toast notification and visual checkmark confirming saved state",
        mobileLayout: "Single-column fluid stack with persistent header and thumb-friendly controls",
        tabletLayout: "Balanced two-column split with responsive sidebar and generous margins",
        desktopLayout: `Full-width ${topology} layout utilizing 1440px grid and asymmetric focal stages`,
        accessibility: "WCAG 2.1 AA compliant, full keyboard navigation, ARIA live regions, 4.5:1 minimum contrast",
        acceptanceCriteria: [
          `Page renders ${topology} composition without layout clipping`,
          `Primary interactions (${primaryInteractions.slice(0, 2).join("; ")}) execute successfully`,
          "Zero console errors or undefined state variables",
          "Responsive layouts pass desktop (1440px), tablet (768px), and mobile (375px)"
        ],
      };
    });

    // 7. Build Section F: Cross-Page Differentiation Matrix
    const differentiationMatrix: PageDifferentiationRow[] = pageBlueprints.map((b) => {
      const plan = pagePlans.find((p) => p.route === b.route || p.route === b.route.replace(/^\//, ""));
      return {
        route: b.route,
        pageName: b.pageName,
        mainComposition: b.overallComposition,
        mainInteraction: (plan?.interaction?.primary || b.controlsAndActions).slice(0, 2).join("; "),
        primaryVisualElement: b.mainVisualElement,
        uniqueSignatureKey: `${b.overallComposition}::${b.mainVisualElement.slice(0, 24)}`,
      };
    });

    const uniqueTopologies = new Set(differentiationMatrix.map((d) => d.mainComposition));
    const uniqueInteractions = new Set(differentiationMatrix.map((d) => d.mainInteraction));
    const convergenceDetected = uniqueTopologies.size < Math.min(3, routes.length);

    const differentiationAudit = {
      totalRoutes: routes.length,
      distinctTopologies: uniqueTopologies.size,
      distinctInteractions: uniqueInteractions.size,
      convergenceDetected,
      auditSummary: convergenceDetected
        ? `⚠️ CONVERGENCE WARNING: Only ${uniqueTopologies.size} distinct topologies across ${routes.length} routes.`
        : `✓ DIFFERENTIATION PASSED: ${uniqueTopologies.size} distinct topologies and ${uniqueInteractions.size} unique interaction patterns across ${routes.length} routes.`,
    };

    // 8. Build Section G: Quality Criteria
    const qualityCriteria = {
      visualQuality: [
        "100% original visual identity derived from project requirements",
        "Harmonious color palette with verified WCAG 2.1 AA contrast",
        "Authoritative typography pairing with disciplined scale and rhythm",
        "Asymmetric, purposeful layouts tailored to each page's function",
        "Zero generic card grids or cookie-cutter templates"
      ],
      experienceQuality: [
        "Every page provides a unique, purposeful workflow",
        "Calculators calculate, galleries browse, bookings schedule, reviews evaluate",
        "Effortless responsive usability across desktop, tablet, and mobile",
        "Full keyboard accessibility and logical tab order"
      ],
      functionalQuality: [
        "Zero TypeScript compilation errors or build warnings",
        "Application server starts cleanly and serves all declared routes",
        "Browser runtime renders without JavaScript errors",
        "All API routes and data mutations execute correctly"
      ]
    };

    // 8. Build Section H: Authoritative Visual Asset Plan via AssetDirector
    const assetManifest = AssetDirector.planAssets({
      prompt,
      brandName,
      domain: domainHint || "general",
      routes,
      pageBlueprints,
      visualThesis: research.visualThesis,
      artDirection: research.sharedDesignLanguage.imageryTreatment,
    });

    return {
      version: "1.0",
      documentId: `ddd_${brandName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      projectIdentity,
      referenceResearch,
      visualSystem,
      sitemap,
      pageBlueprints,
      differentiationMatrix,
      differentiationAudit,
      qualityCriteria,
      assetManifest,
    };
  }

  /**
   * Persists the Design Decision Document to disk as JSON and Markdown.
   */
  public static save(doc: DesignDecisionDocument, outputDirectory: string): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    // 1. Write JSON specification
    const jsonPath = join(aegisDir, "design-decision-document.json");
    writeFileSync(jsonPath, JSON.stringify(doc, null, 2), "utf8");

    // 2. Write Markdown human-readable document
    const mdPath = join(aegisDir, "design-decision-document.md");
    const mdContent = this.formatMarkdown(doc);
    writeFileSync(mdPath, mdContent, "utf8");

    // 3. Persist authoritative visual asset manifest via AssetDirector
    if (doc.assetManifest) {
      AssetDirector.saveManifest(outputDirectory, doc.assetManifest);
    }

    console.log(`[DesignDecisionDocument] ✓ Authoritative design specification locked: ${jsonPath}`);
  }

  private static formatMarkdown(doc: DesignDecisionDocument): string {
    const { projectIdentity: pi, referenceResearch: rr, visualSystem: vs, sitemap, differentiationMatrix: dm, differentiationAudit: da } = doc;

    return `# DESIGN DECISION DOCUMENT (DDD)
**Project:** ${pi.productName}
**Generated:** ${doc.generatedAt}
**Document ID:** \`${doc.documentId}\`

---

## SECTION A: PROJECT IDENTITY
- **Product Name:** ${pi.productName}
- **Purpose:** ${pi.productPurpose}
- **Target Users:** ${pi.targetUsers}
- **Brand Personality:** ${pi.brandPersonality}
- **Visual Thesis:** *"${pi.visualThesis}"*

---

## SECTION B: REFERENCE RESEARCH & ORIGINALITY
### Studied Design References:
${rr.selectedReferences
  .map(
    (r) => `
#### [${r.name}](${r.url})
- **Pages Studied:** ${r.pagesStudied.join(" • ")}
- **Principles Extracted:** ${r.principlesExtracted.join("; ")}
- **Rejected Anti-Patterns:** ${r.patternsRejected.join("; ")}
`
  )
  .join("\n")}

### Originality Decisions:
${rr.originalityDecisions.map((o) => `- ${o}`).join("\n")}

---

## SECTION C: VISUAL SYSTEM SPECIFICATION
- **Color Palette:**
  - Background: \`${vs.colorPalette.background}\`
  - Surface: \`${vs.colorPalette.surface}\`
  - Primary Accent: \`${vs.colorPalette.primaryAccent}\`
  - Secondary Accent: \`${vs.colorPalette.secondaryAccent}\`
  - Text: \`${vs.colorPalette.primaryText}\`
  - Border: \`${vs.colorPalette.border}\`
  - *Rationale:* ${vs.colorPalette.rationale}
- **Typography:**
  - Display Font: \`${vs.typography.displayFont}\`
  - Body Font: \`${vs.typography.bodyFont}\`
  - Mono Font: \`${vs.typography.monoFont}\`
- **Spatial System:**
  - Density: **${vs.spatialSystem.density}**
  - Max Width: \`${vs.spatialSystem.contentWidthMax}\`
  - Border Radius: \`${vs.spatialSystem.borderRadius}\`
  - Shadow Treatment: ${vs.spatialSystem.shadowTreatment}

---

## SECTION D: COMPLETE SITEMAP
| Route | Page Name | Role | Primary Landing |
|---|---|---|:---:|
${sitemap.map((s) => `| \`${s.route}\` | **${s.pageName}** | ${s.role} | ${s.isPrimaryLanding ? "✓" : ""} |`).join("\n")}

---

## SECTION E: PAGE-BY-PAGE BLUEPRINTS (24 ATTRIBUTES)
${doc.pageBlueprints
  .map(
    (b, idx) => `
### ${idx + 1}. ${b.pageName} (\`${b.route}\`)
- **Primary Purpose:** ${b.primaryPurpose}
- **Overall Composition:** \`${b.overallComposition}\`
- **Main Visual Element:** ${b.mainVisualElement}
- **Section Order:** ${b.sectionOrder.join(" → ")}
- **Controls & Actions:** ${b.controlsAndActions.join("; ")}
- **Desktop Layout:** ${b.desktopLayout}
- **Mobile Layout:** ${b.mobileLayout}
- **Acceptance Criteria:**
${b.acceptanceCriteria.map((c) => `  - ${c}`).join("\n")}
`
  )
  .join("\n")}

---

## SECTION F: PAGE DIFFERENTIATION MATRIX
| Route | Main Composition | Main Interaction | Primary Visual Element |
|---|---|---|---|
${dm.map((row) => `| \`${row.route}\` | **${row.mainComposition}** | ${row.mainInteraction} | ${row.primaryVisualElement} |`).join("\n")}

**Differentiation Audit:** ${da.auditSummary}

---

## SECTION G: QUALITY CRITERIA
- **Visual Quality:** ${doc.qualityCriteria.visualQuality.join("; ")}
- **Experience Quality:** ${doc.qualityCriteria.experienceQuality.join("; ")}
- **Functional Quality:** ${doc.qualityCriteria.functionalQuality.join("; ")}

---

## SECTION H: AUTHORITATIVE VISUAL ASSET PLAN
| Asset ID | Route | Section | Category | Aspect Ratio | Alt Description |
|---|---|---|---|---|---|
${(doc.assetManifest?.assets || [])
  .map(
    (a) =>
      `| \`${a.id}\` | \`${a.page}\` | \`<${a.section}>\` | \`${a.category}\` | \`${a.aspectRatio}\` | *${a.altText}* |`
  )
  .join("\n")}
`;
  }
}
