/**
 * Aegis AI — Phase 3 Structured Design Brief Generator
 *
 * Assembles a comprehensive, versioned Design Brief before UI generation.
 * Contains all 16 foundational pillars (Audience, Positioning, Palettes,
 * Typography, Geometry, Layout, Section Plan, Signature Interaction, Avoids, etc.).
 *
 * Persists `.aegis/design-brief.json` and enforces validation before UI code is synthesized.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { TypographyManager, type FontPairing } from "./typography-catalog.js";
import { ThemeGenerator, type ThemeSpecification } from "./theme-generator.js";

export interface PageSectionPlan {
  pageRoute: string;
  pageName: string;
  heroType: "split-media" | "metric-cluster" | "centered-cinematic" | "interactive-canvas" | "editorial-headline";
  sections: Array<{
    id: string;
    name: string;
    purpose: string;
    componentType: string;
  }>;
}

export interface SignatureInteraction {
  name: string;
  domain: string;
  description: string;
  trigger: string;
  workflow: string[];
}

export interface AegisDesignBriefV2 {
  version: "2.0";
  briefId: string;
  projectType: string;
  purpose: string;
  targetAudience: string;
  brandPersonality: string;
  visualPositioning: string;

  brand: {
    hue: number;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };

  palettes: {
    mode: "dark" | "light" | "warm_dark" | "obsidian";
    neutral: {
      background: string;
      surface: string;
      surfaceRaised: string;
      border: string;
      text: string;
      textSecondary: string;
      textMuted: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };

  typography: {
    fontPairingId: string;
    displayFont: string;
    bodyFont: string;
    monoFont: string;
    displayStack: string;
    bodyStack: string;
    scale: {
      h1: string;
      h2: string;
      h3: string;
      h4: string;
      body: string;
      small: string;
    };
    rationale: string;
  };

  geometry: {
    spacingUnit: string;
    gridColumns: number;
    density: "compact" | "comfortable" | "spacious";
    radii: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    borderWidth: string;
    shadowStyle: "flat" | "soft_floating" | "translucent_glow" | "elevated";
  };

  navigation: {
    strategy: "top-pill" | "sidebar-rail" | "bottom-tab" | "minimal-header" | "command-console";
    maxPrimaryItems: number;
    layoutMotif: string;
  };

  heroComposition: {
    type: "split-media" | "metric-cluster" | "centered-cinematic" | "interactive-canvas" | "editorial-headline";
    concept: string;
    ctaStyle: string;
  };

  pageSectionPlan: PageSectionPlan[];

  assetDirection: {
    imageIllustrationDirection: string;
    iconStyle: "rounded-lucide" | "sharp-geometric" | "technical-duotone";
    motionGuidelines: {
      easing: string;
      duration: string;
      pageTransition: string;
    };
  };

  responsive: {
    mobileNavigation: string;
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    horizontalScrollSafeguards: boolean;
  };

  accessibility: {
    targetStandard: "WCAG_2.1_AA";
    minimumContrastRatio: number;
    focusIndicatorStyle: string;
  };

  signatureInteraction: SignatureInteraction;

  choicesToAvoid: string[];

  designRationale: string;
}

export class DesignBriefGenerator {
  /**
   * Synthesizes a structured AegisDesignBriefV2 from prompt, domain, and optional theme.
   */
  public static generateBrief(options: {
    prompt: string;
    domain?: string;
    audience?: string;
    theme?: ThemeSpecification;
    seed?: number;
    avoidList?: string[];
    routes?: string[];
  }): AegisDesignBriefV2 {
    const {
      prompt,
      domain = "general",
      audience,
      seed = 42,
      avoidList = [],
      routes = ["/", "/dashboard", "/analytics"],
    } = options;

    const lower = `${domain} ${prompt}`.toLowerCase();

    // 1. Theme derivation
    const theme =
      options.theme ||
      ThemeGenerator.generateTheme({
        domain,
        prompt,
        seed,
      });

    // 2. Typography derivation
    const fontPairing: FontPairing = TypographyManager.selectPairing({
      domain,
      prompt,
      seed,
      avoidList,
    });

    // 3. Project Type, Purpose & Audience
    let projectType = "Web Application";
    let purpose = "Provide users with a focused, intuitive digital workflow.";
    let targetAudience = audience || "Professionals, operators, and everyday users";
    let brandPersonality = "Balanced, trustworthy, and modern";
    let visualPositioning = "Modern Digital Utility";

    if (/hypercar|atelier|luxury|bespoke|supercar|automotive/i.test(lower)) {
      projectType = "Bespoke Hypercar Atelier & Commissioning Experience";
      purpose = "Configure vehicle aerodynamics, bespoke liveries, composite materials, and reserve track commissioning.";
      targetAudience = "Discerning collectors, performance automotive connoisseurs, and VIP clients";
      brandPersonality = "Exquisite, aerodynamic, uncompromising, and handcrafted";
      visualPositioning = "Haute Horlogerie & Bespoke Coachbuilding Studio";
    } else if (/marine|underwater|habitat|ocean|subsea/i.test(lower)) {
      projectType = "Subsea Habitat & Marine Research Console";
      purpose = "Explore underwater architectural modules, environmental acoustics, and depth telemetry.";
      targetAudience = "Oceanographic researchers, habitat engineers, and subsea operations crew";
      brandPersonality = "Immersive, serene, scientific, and resilient";
      visualPositioning = "Submersible spatial architectural station";
    } else if (/satellite|orbit|aerospace|constellation|ground station/i.test(lower)) {
      projectType = "Autonomous Aerospace Operations Hub";
      purpose = "Monitor real-time satellite orbital passes, telemetry health, and downlink ground stations.";
      targetAudience = "Satellite flight controllers, mission directors, and orbital dynamicists";
      brandPersonality = "Technological, mission-critical, rigorous, and high-precision";
      visualPositioning = "Deep-space operational command cockpit";
    } else if (/student|education|school|learn|portfolio|academy/i.test(lower)) {
      projectType = "Student Academic Portfolio & Learning Console";
      purpose = "Track coursework, showcase student project portfolios, and review faculty evaluations.";
      targetAudience = "Students, academic advisors, and admissions evaluators";
      brandPersonality = "Enlightening, accessible, structured, and encouraging";
      visualPositioning = "Modern academic workspace";
    }

    // 4. Geometry and Density
    const density: AegisDesignBriefV2["geometry"]["density"] =
      /luxury|atelier|art|editorial|bespoke|hypercar/i.test(lower)
        ? "spacious"
        : /\baerospace\b|\bsatellite\b|\bconstellation\b|\btelemetry\b|\blogistics\b/i.test(lower)
        ? "compact"
        : "comfortable";

    const radii =
      density === "compact"
        ? { sm: "2px", md: "4px", lg: "8px", xl: "12px", full: "9999px" }
        : density === "spacious"
        ? { sm: "8px", md: "16px", lg: "24px", xl: "32px", full: "9999px" }
        : { sm: "4px", md: "8px", lg: "16px", xl: "20px", full: "9999px" };

    const shadowStyle: AegisDesignBriefV2["geometry"]["shadowStyle"] =
      theme.mode === "light" ? "soft_floating" : theme.mode === "obsidian" ? "elevated" : "translucent_glow";

    // 5. Navigation Strategy
    let navStrategy: AegisDesignBriefV2["navigation"]["strategy"] = "top-pill";
    if (/luxury|atelier|editorial|bespoke/i.test(lower)) {
      navStrategy = "minimal-header";
    } else if (/\baerospace\b|\bsatellite\b|\bconstellation\b/i.test(lower)) {
      navStrategy = "sidebar-rail";
    } else if (/student|tracker|mobile/i.test(lower)) {
      navStrategy = "bottom-tab";
    }

    // 6. Hero Composition
    let heroType: AegisDesignBriefV2["heroComposition"]["type"] = "split-media";
    let heroConcept = "Domain-focused introductory headline with actionable call-to-action";
    if (/hypercar|atelier|bespoke|luxury|automotive/i.test(lower)) {
      heroType = "centered-cinematic";
      heroConcept = "Full-bleed aerodynamic silhouette showcasing wind-tunnel vortex streamlines";
    } else if (/satellite|orbit|constellation/i.test(lower)) {
      heroType = "interactive-canvas";
      heroConcept = "Real-time 3D orbital trajectory sphere with active constellation pass indicators";
    } else if (/marine|underwater|habitat/i.test(lower)) {
      heroType = "interactive-canvas";
      heroConcept = "3D volumetric habitat cutaway with ambient depth-lighting illumination controls";
    } else if (/student|portfolio|education|academy/i.test(lower)) {
      heroType = "editorial-headline";
      heroConcept = "Clean typographic introduction highlighting academic focus, honors, and research projects";
    }

    // 7. Signature Interaction
    const signatureInteraction: SignatureInteraction = {
      name: "Domain Primary Action",
      domain,
      description: "A memorable domain-specific interaction that reinforces the product's identity.",
      trigger: "Primary workflow trigger",
      workflow: ["Initiate state", "Real-time feedback update", "Persistent outcome confirmation"],
    };

    if (/satellite|orbit/i.test(lower)) {
      signatureInteraction.name = "Pass Downlink Scheduler & Transponder Allocator";
      signatureInteraction.description = "Interactive orbital pass timeline allowing drag-to-reschedule downlink windows with live Doppler frequency shift calculation.";
      signatureInteraction.trigger = "Select satellite from constellation view";
      signatureInteraction.workflow = ["Click satellite orbit node", "Preview ground station azimuth cone", "Lock transponder allocation"];
    } else if (/marine|underwater|habitat/i.test(lower)) {
      signatureInteraction.name = "Hydrostatic Chamber Pressurization & Lighting Mode Controller";
      signatureInteraction.description = "Spatial cutaway mode switch transitioning between Observation Mode (low lumens, bioluminescence filter) and Deep Maintenance Mode.";
      signatureInteraction.trigger = "Lighting & Atmosphere HUD control";
      signatureInteraction.workflow = ["Toggle depth lighting", "Canvas surface reacts smoothly", "Chamber sensor telemetry adjusts"];
    } else if (/hypercar|atelier/i.test(lower)) {
      signatureInteraction.name = "Active Aerodynamics & Carbon Weave Visualizer";
      signatureInteraction.description = "Dynamic wind-tunnel angle slider that adjusts rear wing angle of attack and re-computes downforce-to-drag balance in real time.";
      signatureInteraction.trigger = "Aerodynamic trim control slider";
      signatureInteraction.workflow = ["Drag wing angle", "Vector streamlines compress", "Downforce numeric gauge updates"];
    } else if (/student|education/i.test(lower)) {
      signatureInteraction.name = "Curriculum Pathway & Mastery Graph Navigator";
      signatureInteraction.description = "Interactive prerequisite dependency tree linking completed courses to capstone research milestones.";
      signatureInteraction.trigger = "Click course node";
      signatureInteraction.workflow = ["Highlight prerequisite chain", "Expand syllabus deliverables", "Calculate graduation trajectory"];
    }

    // 8. Page Section Plan
    const pageSectionPlan: PageSectionPlan[] = routes.map((route, i) => {
      const cleanName = route === "/" ? "Home" : route.replace("/", "").replace(/-/g, " ");
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      return {
        pageRoute: route,
        pageName: capitalized,
        heroType: i === 0 ? heroType : "split-media",
        sections: [
          {
            id: `sec_${i}_1`,
            name: `${capitalized} Overview`,
            purpose: `Primary focus and controls for ${cleanName}`,
            componentType: i === 0 ? "Hero" : "OverviewSection",
          },
          {
            id: `sec_${i}_2`,
            name: `${capitalized} Data Grid`,
            purpose: `Detailed specifications and metrics for ${cleanName}`,
            componentType: "DataTableSection",
          },
        ],
      };
    });

    // 9. Choices to Avoid (Anti-sameness safeguard)
    const choicesToAvoid: string[] = [
      "Generic 3-column feature card walls with identical icons",
      "Vague purple-on-black gradient hero meshes without domain assets",
      "Lorem ipsum or generic 'Welcome to our platform' placeholder text",
      "Generic 'Range Slider' inputs unrelated to real feature telemetry",
      "Overused emoji icons in place of professional vector icons",
      "Dangling imports or orphaned route stubs",
    ];

    // 10. Design Rationale
    const designRationale =
      `Selected ${theme.palette.primary} brand hue and ${fontPairing.name} typography to reflect the ` +
      `${brandPersonality.toLowerCase()} nature of ${projectType}. Geometry density is set to '${density}' with ` +
      `'${navStrategy}' navigation to directly support the workflows of ${targetAudience}.`;

    const briefId = `brief_${domain.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}`;

    return {
      version: "2.0",
      briefId,
      projectType,
      purpose,
      targetAudience,
      brandPersonality,
      visualPositioning,
      brand: {
        hue: theme.brandHue,
        primaryColor: theme.palette.primary,
        secondaryColor: theme.palette.secondary,
        accentColor: theme.palette.accent,
      },
      palettes: {
        mode: theme.mode,
        neutral: {
          background: theme.palette.background,
          surface: theme.palette.surface,
          surfaceRaised: theme.palette.surfaceRaised,
          border: theme.palette.border,
          text: theme.palette.textPrimary,
          textSecondary: theme.palette.textSecondary,
          textMuted: theme.palette.textMuted,
        },
        semantic: theme.palette.semantic,
      },
      typography: {
        fontPairingId: fontPairing.id,
        displayFont: fontPairing.displayFont,
        bodyFont: fontPairing.bodyFont,
        monoFont: fontPairing.monoFont,
        displayStack: fontPairing.displayStack,
        bodyStack: fontPairing.bodyStack,
        scale: fontPairing.scale,
        rationale: fontPairing.rationale,
      },
      geometry: {
        spacingUnit: "0.25rem",
        gridColumns: 12,
        density,
        radii,
        borderWidth: "1px",
        shadowStyle,
      },
      navigation: {
        strategy: navStrategy,
        maxPrimaryItems: 5,
        layoutMotif: `${navStrategy}_responsive`,
      },
      heroComposition: {
        type: heroType,
        concept: heroConcept,
        ctaStyle: `rounded-[${radii.md}] font-medium px-5 py-2.5 bg-[${theme.palette.primary}] text-white`,
      },
      pageSectionPlan,
      assetDirection: {
        imageIllustrationDirection: `${brandPersonality} domain vector SVGs with clean geometric hierarchy`,
        iconStyle: "rounded-lucide",
        motionGuidelines: {
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          duration: "200ms",
          pageTransition: "fade",
        },
      },
      responsive: {
        mobileNavigation: "slide-sheet-or-bottom-nav",
        breakpoints: {
          mobile: "375px",
          tablet: "768px",
          desktop: "1440px",
        },
        horizontalScrollSafeguards: true,
      },
      accessibility: {
        targetStandard: "WCAG_2.1_AA",
        minimumContrastRatio: 4.5,
        focusIndicatorStyle: `2px solid ${theme.palette.focusRing}`,
      },
      signatureInteraction,
      choicesToAvoid,
      designRationale,
    };
  }

  /**
   * Validates an AegisDesignBriefV2 against all mandatory requirements.
   * Returns actionable error messages if any field is missing or invalid.
   */
  public static validateBrief(brief: AegisDesignBriefV2): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!brief.briefId) errors.push("Missing briefId");
    if (!brief.projectType) errors.push("Missing projectType");
    if (!brief.targetAudience) errors.push("Missing targetAudience");
    if (!brief.brandPersonality) errors.push("Missing brandPersonality");

    if (!brief.brand || typeof brief.brand.hue !== "number" || !brief.brand.primaryColor) {
      errors.push("Invalid or missing brand color configuration");
    }

    if (!brief.palettes || !brief.palettes.neutral || !brief.palettes.semantic) {
      errors.push("Missing palette declarations in design brief");
    } else {
      if (!brief.palettes.neutral.background || !brief.palettes.neutral.surface || !brief.palettes.neutral.text) {
        errors.push("Incomplete neutral palette (must contain background, surface, and text)");
      }
    }

    if (!brief.typography || !brief.typography.displayFont || !brief.typography.bodyFont) {
      errors.push("Missing typography specifications (displayFont, bodyFont required)");
    }

    if (!brief.geometry || !brief.geometry.density || !brief.geometry.radii) {
      errors.push("Missing geometry or density settings");
    }

    if (!brief.navigation || !brief.navigation.strategy || brief.navigation.maxPrimaryItems > 5) {
      errors.push("Invalid navigation configuration (maxPrimaryItems must be <= 5)");
    }

    if (!brief.heroComposition || !brief.heroComposition.type || !brief.heroComposition.concept) {
      errors.push("Missing heroComposition specification");
    }

    if (!brief.pageSectionPlan || brief.pageSectionPlan.length === 0) {
      errors.push("PageSectionPlan is empty; at least 1 page plan is required");
    }

    if (!brief.signatureInteraction || !brief.signatureInteraction.name || !brief.signatureInteraction.description) {
      errors.push("Missing signatureInteraction (a distinctive application interaction is required)");
    }

    if (!brief.choicesToAvoid || brief.choicesToAvoid.length === 0) {
      errors.push("Missing choicesToAvoid list");
    }

    if (!brief.designRationale || brief.designRationale.length < 20) {
      errors.push("Missing or overly brief designRationale");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Persists the design brief to `.aegis/design-brief.json`.
   */
  public static save(outputDirectory: string, brief: AegisDesignBriefV2): string {
    const validation = this.validateBrief(brief);
    if (!validation.valid) {
      throw new Error(`DESIGN_BRIEF_VALIDATION_FAILED: ${validation.errors.join("; ")}`);
    }

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    const briefPath = join(aegisDir, "design-brief.json");
    writeFileSync(briefPath, JSON.stringify(brief, null, 2), "utf8");
    return briefPath;
  }

  /**
   * Reads and verifies the design brief from `.aegis/design-brief.json`.
   */
  public static read(outputDirectory: string): AegisDesignBriefV2 {
    const briefPath = join(outputDirectory, ".aegis", "design-brief.json");
    if (!existsSync(briefPath)) {
      throw new Error(`DESIGN_BRIEF_NOT_FOUND: No design brief at ${briefPath}`);
    }
    const brief = JSON.parse(readFileSync(briefPath, "utf8")) as AegisDesignBriefV2;
    const validation = this.validateBrief(brief);
    if (!validation.valid) {
      throw new Error(`CORRUPTED_DESIGN_BRIEF: ${validation.errors.join("; ")}`);
    }
    return brief;
  }
}
