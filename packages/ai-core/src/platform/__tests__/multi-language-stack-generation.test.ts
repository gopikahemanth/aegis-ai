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
} from "../index.js";
import { FrontendDesignSpec } from "../../design/frontend-design-spec-schema.js";

const mockDesignSpec: FrontendDesignSpec = {
  specVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  identity: {
    productName: "OmniMetrics Pro",
    tagline: "Ultra-low latency cluster telemetry",
    domain: "devops",
    targetAudience: "Site Reliability Engineers",
    brandPersonality: ["technical", "crisp", "authoritative"],
  },
  visualDirection: {
    themeMode: "dark",
    colorMood: "cool-technical",
    typographyScale: "compact",
    componentStyle: "sharp",
    density: "compact",
    visualRichness: "charts-and-telemetry",
    layoutArchetype: "dashboard-split",
  },
  tokens: {
    palette: {
      background: "#090d16",
      surface: "#111827",
      surfaceSubtle: "#1e293b",
      primary: "#38bdf8",
      primaryHover: "#0ea5e9",
      secondary: "#818cf8",
      accent: "#f43f5e",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      border: "#1e293b",
      borderFocus: "#38bdf8",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#38bdf8",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono",
      scale: {
        h1: "clamp(2rem, 4vw, 3rem)",
        h2: "clamp(1.5rem, 3vw, 2.25rem)",
        h3: "clamp(1.25rem, 2vw, 1.75rem)",
        body: "1rem",
        small: "0.875rem",
      },
    },
    spacing: {
      sectionPadding: "3rem",
      containerMaxWidth: "1280px",
      gridGap: "1.5rem",
    },
    surfaces: {
      cardRadius: "0.5rem",
      elevation: "flat",
      glassEffect: false,
    },
  },
  pages: [
    {
      route: "/",
      name: "Dashboard",
      title: "Real-time Telemetry Dashboard",
      purpose: "Live infrastructure monitoring",
      primaryLayout: "dashboard-split",
      sections: [
        {
          id: "hero",
          role: "hero",
          title: "System Status",
          componentType: "HeroTelemetry",
          visualTreatment: "minimal-contrast",
          density: "compact",
          responsiveRules: {
            mobileLayout: "stacked",
            minItemWidth: "280px",
            hideOnMobile: false,
            overflowBehavior: "wrap",
          },
        },
      ],
      keyMetrics: [
        {
          label: "P99 Latency",
          value: "9ms",
          change: "-2ms",
          trend: "positive",
        },
      ],
    },
  ],
  responsiveRules: {
    mobileBreakpoint: 640,
    tabletBreakpoint: 1024,
    desktopBreakpoint: 1280,
    preventHorizontalOverflow: true,
    dynamicFontSizeClamp: true,
  },
};

describe("Multi-Language & Multi-Stack Architecture", () => {
  describe("Technology Capability Registry", () => {
    it("registers core frontend languages and frameworks", () => {
      const ts = TechnologyCapabilityRegistry.get("typescript");
      const react = TechnologyCapabilityRegistry.get("react");
      const vue = TechnologyCapabilityRegistry.get("vue");
      const svelte = TechnologyCapabilityRegistry.get("svelte");
      const html5 = TechnologyCapabilityRegistry.get("html5");

      expect(ts?.category).toBe("frontend_language");
      expect(react?.category).toBe("frontend_framework");
      expect(vue?.category).toBe("frontend_framework");
      expect(svelte?.category).toBe("frontend_framework");
      expect(html5?.category).toBe("frontend_language");
    });

    it("registers backend frameworks and languages", () => {
      const django = TechnologyCapabilityRegistry.get("django");
      const spring = TechnologyCapabilityRegistry.get("spring_boot");
      const laravel = TechnologyCapabilityRegistry.get("laravel");
      const dotnet = TechnologyCapabilityRegistry.get("aspnet_core");
      const fastapi = TechnologyCapabilityRegistry.get("fastapi");

      expect(django?.category).toBe("backend_framework");
      expect(spring?.category).toBe("backend_framework");
      expect(laravel?.category).toBe("backend_framework");
      expect(dotnet?.category).toBe("backend_framework");
      expect(fastapi?.category).toBe("backend_framework");
    });

    it("registers databases and ORMs", () => {
      const postgres = TechnologyCapabilityRegistry.get("postgresql");
      const mongo = TechnologyCapabilityRegistry.get("mongodb");
      const prisma = TechnologyCapabilityRegistry.get("prisma");
      const hibernate = TechnologyCapabilityRegistry.get("hibernate");

      expect(postgres?.category).toBe("database_engine");
      expect(mongo?.category).toBe("database_engine");
      expect(prisma?.category).toBe("orm_data_layer");
      expect(hibernate?.category).toBe("orm_data_layer");
    });
  });

  describe("Named Stack Registry", () => {
    it("contains at least 20 canonical named stacks", () => {
      const allStacks = NamedStackRegistry.getAll();
      expect(allStacks.length).toBeGreaterThanOrEqual(20);
    });

    it("resolves canonical stacks correctly", () => {
      const mern = NamedStackRegistry.get("mern");
      const mean = NamedStackRegistry.get("mean");
      const mevn = NamedStackRegistry.get("mevn");
      const django = NamedStackRegistry.get("django");
      const spring = NamedStackRegistry.get("spring boot");
      const goHtmx = NamedStackRegistry.get("go-htmx");

      expect(mern?.frontend.framework).toBe("react");
      expect(mern?.database.engine).toBe("mongodb");

      expect(mean?.frontend.framework).toBe("angular");
      expect(mevn?.frontend.framework).toBe("vue");

      expect(django?.backend.framework).toBe("django");
      expect(spring?.backend.framework).toBe("spring-boot");
      expect(goHtmx?.frontend.framework).toBe("htmx");
      expect(goHtmx?.backend.language).toBe("go");
    });
  });

  describe("Stack Selection Intelligence", () => {
    it("resolves Situation A: Explicit Named Stack (e.g. MEAN)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Build an enterprise incident management app using the MEAN stack"
      );

      expect(resolution.selectionMode).toBe("USER_NAMED_STACK");
      expect(resolution.frontend.framework).toBe("angular");
      expect(resolution.backend.framework).toBe("express");
      expect(resolution.database.engine).toBe("mongodb");
      expect(resolution.buildLevel).toBe("full_stack");
    });

    it("resolves Situation A: Explicit Named Stack Django", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Create a medical records platform using Django"
      );

      expect(resolution.selectionMode).toBe("USER_NAMED_STACK");
      expect(resolution.backend.framework).toBe("django");
      expect(resolution.backend.language.toLowerCase()).toContain("python");
      expect(resolution.database.engine).toBe("postgresql");
    });

    it("resolves Situation B: Explicit Individual Technologies (e.g. Vue + FastAPI + SQLite)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Build a research paper viewer with Vue, FastAPI, and SQLite"
      );

      expect(resolution.selectionMode).toBe("USER_EXPLICIT_TECH");
      expect(resolution.frontend.framework).toBe("vue");
      expect(resolution.backend.framework).toBe("fastapi");
      expect(resolution.database.engine).toBe("sqlite");
      expect(resolution.buildLevel).toBe("full_stack");
    });

    it("resolves Situation B: Explicit Pure Frontend (e.g. Vanilla HTML/CSS)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "I want a clean landing page written purely in HTML and CSS with no backend"
      );

      expect(resolution.frontend.framework).toBe("vanilla");
      expect(resolution.backend.framework).toBe("none");
      expect(resolution.database.engine).toBe("none");
      expect(resolution.buildLevel).toBe("pure_frontend");
    });

    it("resolves Situation C: Autonomous Level 1 Pure Frontend (Portfolio/Brochure)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Design an artisan bakery showcase website with photo gallery, menu, and opening hours"
      );

      expect(resolution.selectionMode).toBe("AUTONOMOUS_REQUIREMENT_DRIVEN");
      expect(resolution.buildLevel).toBe("pure_frontend");
      expect(resolution.backend.framework).toBe("none");
      expect(resolution.database.engine).toBe("none");
    });

    it("resolves Situation C: Autonomous Level 2 API Integration (Supabase / Headless)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Create a storefront connecting to an existing Shopify API and headless CMS"
      );

      expect(resolution.buildLevel).toBe("frontend_api_integration");
      expect(resolution.database.engine).toBe("none");
    });

    it("resolves Situation C: Autonomous Level 3 Full-Stack (SaaS / Auth / Dashboard)", () => {
      const resolution = StackSelectionIntelligence.resolveStack(
        "Build a multi-tenant SaaS accounting tool with user authentication and database"
      );

      expect(resolution.buildLevel).toBe("full_stack");
      expect(resolution.backend.framework).not.toBe("none");
      expect(resolution.database.engine).not.toBe("none");
    });
  });

  describe("Technology Generation Adapters & Registry", () => {
    it("registers React, Vue, Svelte, Next.js, and Vanilla adapters", () => {
      const adapters = adapterRegistry.getAll();
      expect(adapters.length).toBeGreaterThanOrEqual(5);

      expect(adapterRegistry.getAdapter("react-vite-adapter")).toBeInstanceOf(ReactViteAdapter);
      expect(adapterRegistry.getAdapter("vue-vite-adapter")).toBeInstanceOf(VueAdapter);
      expect(adapterRegistry.getAdapter("svelte-vite-adapter")).toBeInstanceOf(SvelteAdapter);
      expect(adapterRegistry.getAdapter("nextjs-adapter")).toBeInstanceOf(NextJsAdapter);
      expect(adapterRegistry.getAdapter("vanilla-html-adapter")).toBeInstanceOf(VanillaHtmlAdapter);
    });

    it("dispatches Vue adapter when Vue architecture is resolved", () => {
      const arch = StackSelectionIntelligence.resolveStack("A customer feedback form with Vue");
      const adapter = adapterRegistry.resolveAdapter(arch);
      expect(adapter.id).toBe("vue-vite-adapter");
      expect(adapter.frameworkFamily).toBe("vue");
    });

    it("dispatches Svelte adapter when Svelte architecture is resolved", () => {
      const arch = StackSelectionIntelligence.resolveStack("An ultra lightweight calculator in Svelte");
      const adapter = adapterRegistry.resolveAdapter(arch);
      expect(adapter.id).toBe("svelte-vite-adapter");
      expect(adapter.frameworkFamily).toBe("svelte");
    });

    it("dispatches Next.js adapter when Next.js architecture is resolved", () => {
      const arch = StackSelectionIntelligence.resolveStack("A Next.js 14 SSR portal");
      const adapter = adapterRegistry.resolveAdapter(arch);
      expect(adapter.id).toBe("nextjs-adapter");
      expect(adapter.frameworkFamily).toBe("nextjs");
    });

    it("dispatches Vanilla adapter when pure HTML/CSS is requested", () => {
      const arch = StackSelectionIntelligence.resolveStack("A pure HTML and CSS landing page");
      const adapter = adapterRegistry.resolveAdapter(arch);
      expect(adapter.id).toBe("vanilla-html-adapter");
      expect(adapter.frameworkFamily).toBe("vanilla");
    });

    it("generates framework-native components and project scaffolds", async () => {
      const vueAdapter = new VueAdapter();
      const files = await vueAdapter.scaffoldProject({
        projectName: "vue-test",
        architecture: StackSelectionIntelligence.resolveStack("Vue project"),
        designSpec: mockDesignSpec,
      });

      expect(files.some((f) => f.path === "package.json")).toBe(true);
      expect(files.some((f) => f.path === "src/main.ts" || f.path === "src/style.css")).toBe(true);

      const component = await vueAdapter.generateComponent({
        componentName: "MetricCard",
        role: "metric",
        designTokens: mockDesignSpec.tokens,
      });

      expect(component.path).toBe("src/components/MetricCard.vue");
      expect(component.content).toContain("<script setup lang=\"ts\">");
      expect(component.content).toContain("<template>");
    });
  });
});
