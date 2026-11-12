/**
 * Real Multi-Technology Generation & Verification Suite
 *
 * Verifies real scaffolding, generated file contents, native framework idioms,
 * lack of framework contamination, build level accuracy, and technology locking
 * across React, Vue, Svelte, Next.js, Vanilla HTML, Angular, FastAPI, and Express.
 */

import { describe, it, expect } from "vitest";
import {
  TechnologyCapabilityRegistry,
  NamedStackRegistry,
  StackSelectionIntelligence,
  adapterRegistry,
  ReactViteAdapter,
  VueAdapter,
  SvelteAdapter,
  NextJsAdapter,
  VanillaHtmlAdapter,
  AngularAdapter,
  FastApiAdapter,
  NodeExpressAdapter,
} from "../index.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { FrontendDesignSpec } from "../../design/frontend-design-spec-schema.js";

const mockSpec: FrontendDesignSpec = {
  version: "1.0.0",
  specId: "spec_test_multi_tech",
  createdAt: new Date().toISOString(),
  projectIdentity: {
    productName: "Aetheria Studio",
    businessDomain: "creative-portfolio",
    productCategory: "digital-design",
    targetAudience: {
      primaryUser: "Art Director",
      techSavviness: "high",
      context: "professional",
    },
    brandPersonality: ["minimal", "editorial", "avant-garde"],
    primaryUserObjective: "Explore design projects",
    primaryConversionOrOperationalObjective: "Contact for commission",
    explicitUserRequirements: ["Responsive typography", "Dark mode aesthetic"],
    inferredRequirements: ["Fast image load"],
  },
  visualDirection: {
    artDirectionName: "Editorial Monochrome",
    artDirectionRationale: "High contrast gallery layout",
    emotionalResponse: "sophisticated",
    visualPersonality: {
      mood: "subdued",
      formality: "luxury",
      density: "spacious",
    },
    compositionStrategy: "asymmetric-grid",
    visualDifferentiators: ["Fluid typography", "Borders as structure"],
  },
  colorStrategy: {
    paletteMode: "dark",
    primaryBrandColor: "#f43f5e",
    primaryHover: "#e11d48",
    primaryActive: "#be123c",
    primarySubtle: "rgba(244, 63, 94, 0.1)",
    secondaryBrandColor: "#a855f7",
    secondaryHover: "#9333ea",
    accentColors: ["#06b6d4"],
    backgroundColor: "#09090b",
    surfaceColor: "#18181b",
    surfaceElevated: "#27272a",
    surfaceMuted: "#141416",
    textHeadingColor: "#fafafa",
    textPrimaryColor: "#f4f4f5",
    textSecondaryColor: "#a1a1aa",
    textMutedColor: "#71717a",
    textOnPrimary: "#ffffff",
    borderColor: "#27272a",
    borderSubtle: "#1c1c1f",
    focusRingColor: "#f43f5e",
    semanticColors: {
      success: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444",
      info: "#38bdf8",
    },
    chartPalette: ["#f43f5e", "#a855f7", "#06b6d4"],
    contrastAudit: {
      textOnBackground: { ratio: 16.5, passesAA: true },
      textOnSurface: { ratio: 14.2, passesAA: true },
      textSecondaryOnSurface: { ratio: 6.8, passesAA: true },
      textOnPrimaryButton: { ratio: 4.8, passesAA: true },
      focusOnBackground: { ratio: 5.2, passesAA: true },
      overallValid: true,
    },
    rationale: "Ultra deep neutral obsidian with rose accents",
  },
  typographyStrategy: {
    displayFont: "Playfair Display",
    headingFont: "Inter",
    bodyFont: "Inter",
    uiFont: "Inter",
    monoFont: "JetBrains Mono",
    fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    fluidScale: {
      h1: "clamp(2.5rem, 5vw, 4rem)",
      h2: "clamp(2rem, 4vw, 3rem)",
      h3: "clamp(1.5rem, 3vw, 2.25rem)",
      h4: "clamp(1.25rem, 2vw, 1.75rem)",
      body: "1rem",
      bodyLarge: "1.125rem",
      small: "0.875rem",
      caption: "0.75rem",
    },
    lineHeights: { heading: 1.2, body: 1.6 },
    letterSpacing: { heading: "-0.02em", body: "0em" },
    wordBreakRules: ["break-words", "hyphens: auto"],
    contrastGuarantees: ["All headings meet 4.5:1"],
    rationale: "Editorial balance of serif headings with clean sans UI",
  },
  surfaceStrategy: {
    layeringModel: "subtle-borders",
    cardElevation: "flat",
    borderWidth: "1px",
    borderRadius: { sm: "4px", md: "8px", lg: "12px", full: "9999px" },
    shadows: { sm: "none", md: "none", lg: "none" },
    translucency: { enabled: true, backdropBlur: "12px" },
  },
  navigationStrategy: {
    pattern: "top-navbar",
    sticky: true,
    mobilePattern: "drawer",
    desktopLayout: "spread",
    actionItemsCount: 1,
    breadcrumbsRequired: false,
    themeAdaptive: true,
  },
  pages: [
    {
      route: "/",
      name: "Gallery",
      title: "Design Showcase",
      purpose: "Hero and portfolio items",
      primaryLayout: "editorial-showcase",
      sections: [
        {
          id: "hero",
          role: "hero",
          title: "Selected Works",
          componentType: "HeroShowcase",
          visualTreatment: "minimal",
          density: "spacious",
          responsiveRules: {
            mobileLayout: "stacked",
            minItemWidth: "300px",
            hideOnMobile: false,
            overflowBehavior: "wrap",
          },
        },
      ],
      keyMetrics: [],
    },
  ],
  responsiveSystem: {
    breakpoints: {
      mobile: "360px - 640px",
      tablet: "768px - 1024px",
      desktop: "1024px - 1440px",
      wide: "1920px",
    },
    containerMaxWidth: "1400px",
    containerPadding: { mobile: "1rem", tablet: "2rem", desktop: "3rem" },
    columnGrids: { mobile: 4, tablet: 8, desktop: 12 },
    overflowProtectionRules: ["overflow-x: hidden", "max-width: 100vw"],
  },
  accessibility: {
    wcagTarget: "WCAG_2_2_AA",
    minimumContrastNormalText: 4.5,
    minimumContrastLargeText: 3.0,
    keyboardFocusRingStyle: "2px solid #f43f5e",
    reducedMotionFallback: true,
    screenReaderAnnouncements: true,
    ariaRequiredAttributes: ["aria-label", "role"],
  },
  assetStrategy: {
    imagesNeeded: true,
    artDirection: "Editorial monochrome photography",
    manifest: [],
    zeroBrokenImagesGuaranteed: true,
  },
  researchRationale: {
    domain: "portfolio",
    category: "creative",
    referencesResearched: [],
    conventionsObserved: ["Generous whitespace", "High-contrast photography"],
    principlesDerived: ["Zero layout shift", "Typography-first hierarchy"],
    researchMode: "AUTONOMOUS_GROUNDED_CATALOG",
  },
};

describe("Phase T: Real Multi-Technology Generation & Verification", () => {
  describe("1. User-Requested Technology Lock & Anti-Substitution", () => {
    it("locks pure HTML/CSS without substituting React or Node", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build a portfolio using pure HTML, CSS and JavaScript");
      expect(arch.frontend.framework).toBe("vanilla");
      expect(arch.buildLevel).toBe("pure_frontend");
      expect(arch.backend.framework).toBe("none");
      expect(arch.database.engine).toBe("none");

      const govContract = ArchitectureResolver.resolve("Build a portfolio using pure HTML, CSS and JavaScript");
      expect(govContract.frontend.framework).toBe("HTML5/Vanilla");
      expect(govContract.backend.framework).toBe("None");
      expect(govContract.database.provider).toBe("None");
    });

    it("locks React + TypeScript dashboard", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build a dashboard using React and TypeScript");
      expect(arch.frontend.framework).toBe("react");
      expect(arch.frontend.language).toBe("TypeScript");

      const govContract = ArchitectureResolver.resolve("Build a dashboard using React and TypeScript");
      expect(govContract.frontend.framework).toBe("React-Vite");
    });

    it("locks Vue 3 + FastAPI full-stack combination without React substitution", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build an application using Vue 3 and FastAPI");
      expect(arch.frontend.framework).toBe("vue");
      expect(arch.backend.framework).toBe("fastapi");
      expect(arch.backend.language).toBe("Python");
      expect(arch.buildLevel).toBe("full_stack");

      const govContract = ArchitectureResolver.resolve("Build an application using Vue 3 and FastAPI");
      expect(govContract.frontend.framework).toBe("Vue-Vite");
      expect(govContract.backend.framework).toBe("FastAPI");
    });

    it("locks SvelteKit without substituting React", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build an application using SvelteKit");
      expect(arch.frontend.framework).toBe("svelte");

      const govContract = ArchitectureResolver.resolve("Build an application using SvelteKit");
      expect(govContract.frontend.framework).toBe("SvelteKit");
    });

    it("locks Next.js without substituting React SPA or Express", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build a website using Next.js");
      expect(arch.frontend.framework).toBe("nextjs");

      const govContract = ArchitectureResolver.resolve("Build a website using Next.js");
      expect(govContract.frontend.framework).toBe("Next.js");
    });

    it("locks MERN stack to React, Node/Express, and MongoDB", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build an e-commerce application using MERN");
      expect(arch.frontend.framework).toBe("react");
      expect(arch.backend.framework).toBe("express");
      expect(arch.database.engine).toBe("mongodb");
      expect(arch.buildLevel).toBe("full_stack");
    });

    it("locks Angular + Spring Boot enterprise combination without substitution", () => {
      const arch = StackSelectionIntelligence.resolveStack("Build an Angular application with Spring Boot");
      expect(arch.frontend.framework).toBe("angular");
      expect(arch.backend.framework).toBe("spring-boot");
      expect(arch.backend.language).toBe("Java");

      const govContract = ArchitectureResolver.resolve("Build an Angular application with Spring Boot");
      expect(govContract.frontend.framework).toBe("Angular");
      expect(govContract.backend.framework).toBe("Spring Boot");
    });
  });

  describe("2. The 3 Application Build Levels Verification", () => {
    it("Level 1 (Pure Frontend): Generates no backend or database files", async () => {
      const arch = StackSelectionIntelligence.resolveStack("Pure frontend marketing site with no backend");
      expect(arch.buildLevel).toBe("pure_frontend");
      expect(arch.backend.framework).toBe("none");
      expect(arch.database.engine).toBe("none");

      const adapter = adapterRegistry.resolveAdapter(arch);
      const scaffold = await adapter.scaffoldProject({
        projectName: "marketing-site",
        architecture: arch,
        designSpec: mockSpec,
      });

      // Assert no server or db files exist in scaffold
      expect(scaffold.some((f) => f.path.startsWith("server/"))).toBe(false);
      expect(scaffold.some((f) => f.path.includes("prisma"))).toBe(false);
    });

    it("Level 2 (Frontend + External API): Integrates API without creating duplicate backend", () => {
      const arch = StackSelectionIntelligence.resolveStack("Storefront connecting to existing Shopify API and headless CMS");
      expect(arch.buildLevel).toBe("frontend_api_integration");
      expect(arch.database.engine).toBe("none");
      expect(arch.backend.framework).toBe("none");
    });

    it("Level 3 (Full Stack): Generates client, server, and persistence models", async () => {
      const arch = StackSelectionIntelligence.resolveStack("SaaS customer billing platform with database and auth");
      expect(arch.buildLevel).toBe("full_stack");
      expect(arch.backend.framework).not.toBe("none");
      expect(arch.database.engine).not.toBe("none");

      const expressAdapter = new NodeExpressAdapter();
      const files = await expressAdapter.scaffoldProject({
        projectName: "billing-platform",
        architecture: arch,
        designSpec: mockSpec,
      });

      expect(files.some((f) => f.path.includes("server/package.json"))).toBe(true);
      expect(files.some((f) => f.path.includes("server/src/index.ts"))).toBe(true);
    });
  });

  describe("3. Native Framework Generation & Zero Cross-Contamination", () => {
    it("Vue Adapter emits native Vue SFC (<script setup> & <template>) with zero React JSX", async () => {
      const vueAdapter = new VueAdapter();
      const comp = await vueAdapter.generateComponent({
        componentName: "ProjectHero",
        role: "hero",
        designTokens: {
          palette: {
            background: mockSpec.colorStrategy.backgroundColor,
            surface: mockSpec.colorStrategy.surfaceColor,
            text: mockSpec.colorStrategy.textPrimaryColor,
            border: mockSpec.colorStrategy.borderColor,
          },
        },
      });

      expect(comp.path).toBe("src/components/ProjectHero.vue");
      expect(comp.content).toContain("<script setup lang=\"ts\">");
      expect(comp.content).toContain("<template>");
      // Zero React imports
      expect(comp.content).not.toContain("import React");
      expect(comp.content).not.toContain("useState");
      expect(comp.content).not.toContain("className=");
    });

    it("Svelte Adapter emits native Svelte (<script> & slots) with zero React imports", async () => {
      const svelteAdapter = new SvelteAdapter();
      const comp = await svelteAdapter.generateComponent({
        componentName: "GalleryCard",
        role: "card",
        designTokens: {
          palette: {
            background: mockSpec.colorStrategy.backgroundColor,
            surface: mockSpec.colorStrategy.surfaceColor,
            text: mockSpec.colorStrategy.textPrimaryColor,
            border: mockSpec.colorStrategy.borderColor,
          },
        },
      });

      expect(comp.path).toBe("src/lib/components/GalleryCard.svelte");
      expect(comp.content).toContain("<script lang=\"ts\">");
      expect(comp.content).toContain("<slot>");
      expect(comp.content).not.toContain("import React");
      expect(comp.content).not.toContain("className=");
    });

    it("Angular Adapter emits standalone component with zero React hooks", async () => {
      const angularAdapter = new AngularAdapter();
      const comp = await angularAdapter.generateComponent({
        componentName: "TelemetryTile",
        role: "card",
        designTokens: {
          palette: {
            background: mockSpec.colorStrategy.backgroundColor,
            surface: mockSpec.colorStrategy.surfaceColor,
            text: mockSpec.colorStrategy.textPrimaryColor,
            border: mockSpec.colorStrategy.borderColor,
          },
        },
      });

      expect(comp.path).toBe("src/app/components/telemetrytile.component.ts");
      expect(comp.content).toContain("@Component({");
      expect(comp.content).toContain("standalone: true");
      expect(comp.content).toContain("export class TelemetryTileComponent");
      expect(comp.content).not.toContain("React.FC");
    });

    it("Vanilla HTML Adapter emits clean semantic HTML5 without virtual DOM artifacts", async () => {
      const vanillaAdapter = new VanillaHtmlAdapter();
      const comp = await vanillaAdapter.generateComponent({
        componentName: "PhotoSection",
        role: "hero",
        designTokens: {
          palette: {
            background: mockSpec.colorStrategy.backgroundColor,
            surface: mockSpec.colorStrategy.surfaceColor,
            text: mockSpec.colorStrategy.textPrimaryColor,
            border: mockSpec.colorStrategy.borderColor,
          },
        },
      });

      expect(comp.path).toBe("components/photosection.html");
      expect(comp.content).toContain("<div class=\"card hero\"");
      expect(comp.content).not.toContain("<script");
      expect(comp.content).not.toContain("React");
    });

    it("FastAPI Adapter emits valid Python Pydantic & APIRouter models", async () => {
      const fastApiAdapter = new FastApiAdapter();
      const router = await fastApiAdapter.generateComponent({
        componentName: "Projects",
        role: "page",
        designTokens: {
          palette: {
            background: "",
            surface: "",
            text: "",
            border: "",
          },
        },
      });

      expect(router.path).toBe("routers/projects.py");
      expect(router.content).toContain("from fastapi import APIRouter");
      expect(router.content).toContain("class ProjectsSchema(BaseModel):");
      expect(router.content).toContain("def list_projects():");
    });
  });

  describe("4. Cross-Framework Design Preservation", () => {
    it("preserves identical design tokens across React, Vue, Svelte, Angular, and HTML", async () => {
      const tokens = {
        palette: {
          background: mockSpec.colorStrategy.backgroundColor,
          surface: mockSpec.colorStrategy.surfaceColor,
          text: mockSpec.colorStrategy.textPrimaryColor,
          border: mockSpec.colorStrategy.borderColor,
        },
      };

      const reactComp = await new ReactViteAdapter().generateComponent({ componentName: "Card", role: "card", designTokens: tokens });
      const vueComp = await new VueAdapter().generateComponent({ componentName: "Card", role: "card", designTokens: tokens });
      const svelteComp = await new SvelteAdapter().generateComponent({ componentName: "Card", role: "card", designTokens: tokens });
      const angularComp = await new AngularAdapter().generateComponent({ componentName: "Card", role: "card", designTokens: tokens });
      const htmlComp = await new VanillaHtmlAdapter().generateComponent({ componentName: "Card", role: "card", designTokens: tokens });

      // Each framework preserves the exact surface color from designSpec
      expect(reactComp.content).toContain(mockSpec.colorStrategy.surfaceColor);
      expect(vueComp.content).toContain(mockSpec.colorStrategy.surfaceColor);
      expect(svelteComp.content).toContain(mockSpec.colorStrategy.surfaceColor);
      expect(angularComp.content).toContain(mockSpec.colorStrategy.surfaceColor);
      expect(htmlComp.content).toContain(mockSpec.colorStrategy.surfaceColor);

      // Each framework preserves the exact border color from designSpec
      expect(reactComp.content).toContain(mockSpec.colorStrategy.borderColor);
      expect(vueComp.content).toContain(mockSpec.colorStrategy.borderColor);
      expect(svelteComp.content).toContain(mockSpec.colorStrategy.borderColor);
      expect(angularComp.content).toContain(mockSpec.colorStrategy.borderColor);
      expect(htmlComp.content).toContain(mockSpec.colorStrategy.borderColor);
    });
  });

  describe("5. Rigorous Capability Status Classification Audit", () => {
    it("certifies FULLY_SUPPORTED only where complete build/runtime tooling exists", () => {
      const reactRec = TechnologyCapabilityRegistry.get("react");
      const vueRec = TechnologyCapabilityRegistry.get("vue");
      const svelteRec = TechnologyCapabilityRegistry.get("svelte");
      const nodeRec = TechnologyCapabilityRegistry.get("node_express");

      expect(reactRec?.status).toBe("FULLY_SUPPORTED");
      expect(vueRec?.status).toBe("FULLY_SUPPORTED");
      expect(svelteRec?.status).toBe("FULLY_SUPPORTED");
      expect(nodeRec?.status).toBe("FULLY_SUPPORTED");
    });

    it("certifies PARTIALLY_SUPPORTED or NOT_IMPLEMENTED for adapters without compiler toolchains", () => {
      const angularRec = TechnologyCapabilityRegistry.get("angular");
      const djangoRec = TechnologyCapabilityRegistry.get("django");
      const fastapiRec = TechnologyCapabilityRegistry.get("fastapi");
      const laravelRec = TechnologyCapabilityRegistry.get("laravel");
      const springRec = TechnologyCapabilityRegistry.get("spring_boot");
      const dotnetRec = TechnologyCapabilityRegistry.get("aspnet_core");
      const goRec = TechnologyCapabilityRegistry.get("go_standard");

      expect(angularRec?.status).toBe("PARTIALLY_SUPPORTED");
      expect(djangoRec?.status).toBe("PARTIALLY_SUPPORTED");
      expect(fastapiRec?.status).toBe("PARTIALLY_SUPPORTED");
      expect(laravelRec?.status).toBe("NOT_IMPLEMENTED");
      expect(springRec?.status).toBe("NOT_IMPLEMENTED");
      expect(dotnetRec?.status).toBe("NOT_IMPLEMENTED");
      expect(goRec?.status).toBe("NOT_IMPLEMENTED");
    });
  });
});
