import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ReferenceResearchEngine } from "../reference-research-engine.js";
import { LiveWebSearchEngine } from "../live-web-search-engine.js";
import { ReferencePageInspector } from "../reference-page-inspector.js";
import { DesignDecisionDocumentEngine } from "../../design/design-decision-document.js";
import { PageDesignSpecificationEngine } from "../../design/page-design-specification-engine.js";
import type { PageInspectionResult } from "../reference-research-types.js";

describe("Phase 1 — Research-to-Design End-to-End Integration", () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis_res_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });
    ReferenceResearchEngine.clearCache();
  });

  afterEach(() => {
    LiveWebSearchEngine.clearMockProvider();
    if (existsSync(testProjectDir)) {
      rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  it("researches multiple distinct websites, handles inaccessible sources, and synthesizes an original design specification", async () => {
    const prompt = "Create a bespoke architectural ceramics and tableware studio website for 'Terra & Form' featuring handmade collection showcases, clay glaze specifications, custom hospitality commissions, and online studio booking.";
    const brandName = "Terra & Form";

    // 1. Configure Mock Search Provider with 4 candidate references
    LiveWebSearchEngine.setMockSearchProvider(async (query: string, maxResults: number) => {
      return [
        {
          title: "Hasami Porcelain — Minimal Tableware & Modular Living",
          url: "https://hasami-porcelain.mock/collections",
          snippet: "Japanese modular ceramics crafted from traditional porcelain and clay mixtures with tactile raw matte finish.",
          sourceEngine: "mock",
        },
        {
          title: "Astier de Villatte — Handcrafted Parisian Ceramics & Atelier",
          url: "https://astier-ceramics.mock/works",
          snippet: "Black terracotta finished with milky white glaze, artisanal lookbooks, and custom atelier commissions.",
          sourceEngine: "mock",
        },
        {
          title: "Mud Australia — Handmade Porcelain Design Studio & Tablescapes",
          url: "https://mud-porcelain.mock/studio",
          snippet: "Clean porcelain homeware available in 19 color finishes, restaurant hospitality collaborations, and studio tours.",
          sourceEngine: "mock",
        },
        {
          title: "Restricted Ceramics Archive — Member Only",
          url: "https://restricted-archive.mock/paywall",
          snippet: "Private trade collection behind membership gate.",
          sourceEngine: "mock",
        },
      ];
    });

    // 2. Mock Page Inspector for Accessible vs. Inaccessible Sites
    const mockInspector = async (url: string): Promise<PageInspectionResult> => {
      if (url.includes("hasami")) {
        return {
          url,
          status: "SUCCESS",
          statusCode: 200,
          title: "Hasami Porcelain | Modular Tableware",
          metaDescription: "Timeless modular tableware designed in Venice, CA and crafted in Hasami, Japan.",
          navLinks: [
            { text: "Collection", href: "/collection" },
            { text: "Glazes & Clay", href: "/materials" },
            { text: "Stockists", href: "/stockists" },
          ],
          headings: ["Modular Simplicity", "Natural Clay & Glaze Finishes", "Tablescape Catalog"],
          callToActions: ["Explore Modular Sets", "View Specifications"],
          hasSearch: true,
          filterControls: ["Diameter", "Matte vs Gloss", "Color Finish"],
          mainContentText: "Geometric stackable proportions, unglazed clay bases, and modular compatibility.",
          observedDesignTokens: {
            density: "spacious",
            paletteDominance: "neutral_earth",
            typographyStyle: "minimal_sans",
          },
        };
      } else if (url.includes("astier")) {
        return {
          url,
          status: "SUCCESS",
          statusCode: 200,
          title: "Astier de Villatte | Parisian Ceramics",
          metaDescription: "Artisanal handcrafted Parisian black terracotta ceramics with milky white glaze.",
          navLinks: [
            { text: "Atelier Works", href: "/works" },
            { text: "Artisan Heritage", href: "/heritage" },
            { text: "Bespoke Commissions", href: "/commissions" },
          ],
          headings: ["Handmade in Paris", "The Secret of Black Terracotta", "Private Commission Inquiries"],
          callToActions: ["Commission an Installation", "Read Artisan Monograph"],
          hasSearch: false,
          filterControls: ["Collection Year", "Vessel Category"],
          mainContentText: "Irregular handcrafted contours, signature stamping, and historical atelier craftsmanship.",
          observedDesignTokens: {
            density: "airy_editorial",
            paletteDominance: "monochrome_ivory",
            typographyStyle: "refined_serif",
          },
        };
      } else if (url.includes("mud")) {
        return {
          url,
          status: "SUCCESS",
          statusCode: 200,
          title: "Mud Australia | Porcelain Homewares",
          metaDescription: "Minimalist porcelain homewares made by hand in Sydney with clean pastel palettes.",
          navLinks: [
            { text: "Colors & Shapes", href: "/colors" },
            { text: "Hospitality Partners", href: "/hospitality" },
            { text: "Studio Workshops", href: "/workshops" },
          ],
          headings: ["19 Signature Pigments", "Custom Hospitality Tablescapes", "Hands-On Studio Workshops"],
          callToActions: ["Book Studio Session", "Download Trade Specification"],
          hasSearch: true,
          filterControls: ["Hue Palette", "Functional Category", "Hospitality Grade"],
          mainContentText: "Matte exterior with gloss interior glaze, food-safe pigments, and custom restaurant tableware.",
          observedDesignTokens: {
            density: "balanced_studio",
            paletteDominance: "pastel_terracotta",
            typographyStyle: "modern_grotesk",
          },
        };
      } else {
        // Restricted / Inaccessible URL
        return {
          url,
          status: "INACCESSIBLE",
          statusCode: 403,
          error: "HTTP 403 Forbidden: Client paywall requires private authentication.",
          navLinks: [],
          headings: [],
          callToActions: [],
          hasSearch: false,
          filterControls: [],
        };
      }
    };

    // Replace inspector method temporarily
    const originalInspect = ReferencePageInspector.inspectPage;
    (ReferencePageInspector as any).inspectPage = mockInspector;

    let researchResult;
    try {
      // 3. Execute Reference Research
      researchResult = await ReferenceResearchEngine.executeResearch({
        prompt,
        domain: "artisan-ceramics",
        projectName: brandName,
        projectRoot: testProjectDir,
        explicitRequirements: [
          { title: "Ceramic Collection Showcase", description: "Display handmade ceramic pieces with glaze specs." },
          { title: "Clay & Glaze Specifications", description: "Technical material breakdown and food-safe ratings." },
          { title: "Bespoke Hospitality Commissions", description: "Inquiry and consultation form for restaurants." },
          { title: "Studio Workshop Booking", description: "Calendar for reserving in-person pottery sessions." },
        ],
      });
    } finally {
      (ReferencePageInspector as any).inspectPage = originalInspect;
    }

    // 4. Verify Research Results
    expect(researchResult.research.overallStatus).toBe("SUCCESS");
    expect(researchResult.research.sources.length).toBe(4);

    const accessibleSources = researchResult.research.sources.filter((s) => s.status === "ACCESSIBLE");
    const inaccessibleSources = researchResult.research.sources.filter((s) => s.status === "INACCESSIBLE");

    expect(accessibleSources.length).toBe(3);
    expect(inaccessibleSources.length).toBe(1);
    expect(inaccessibleSources[0].failureReason).toContain("403");

    // Must have observed design patterns
    expect(researchResult.research.observedPatterns.length).toBeGreaterThanOrEqual(6);
    const navPatterns = researchResult.research.observedPatterns.filter((p) => p.category === "navigation");
    expect(navPatterns.length).toBeGreaterThanOrEqual(1);

    // Verify .aegis/reference-research.json was written
    const researchFilePath = join(testProjectDir, ".aegis", "reference-research.json");
    expect(existsSync(researchFilePath)).toBe(true);

    // 5. Synthesize Design Decision Document (DDD) consuming research
    const routes = ["/", "/glazes", "/commissions", "/workshops"];
    const ddd = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName,
      routes,
      pagePlans: [],
      domainHint: "artisan-ceramics",
      researchSynthesis: {
        productCategory: "Artisanal Studio & Ceramics",
        targetAudience: "Architects, interior designers, and discerning patrons seeking handmade tableware",
        primaryWorkflows: ["Inspect glaze finishes", "Submit custom commission inquiry", "Book studio session"],
        selectedReferences: [
          {
            reference: {
              id: "ref-hasami",
              name: "Hasami Porcelain",
              url: "https://hasami-porcelain.mock/collections",
              category: "Minimal Tableware",
              suitableDomains: ["ceramics", "tableware"],
              studiedPages: ["/collections"],
              compositionStrengths: "Clean modular grid and tactile material photography",
              typographyDecisions: "Minimal grotesque sans with generous letter-spacing",
              colorPhilosophy: "Warm earthen stone (#E8E4DD) with charcoal text (#2A2826)",
              spatialRules: "Generous whitespace and minimal borders",
              interactionPatterns: ["Modular product preview", "Glaze detail drawer"],
              innerPageTechniques: "Technical dimension tables with cross-sectional diagrams",
              applicablePrinciples: ["Tactile material realism", "Dimensional clarity"],
              rejectedAntiPatterns: ["Generic discount badges", "Flashy animations"],
            },
            relevanceScore: 92,
            relevanceRationale: "Exemplary standard for modular tableware display and glaze transparency.",
            extractedPrinciples: ["Tactile material realism", "Dimensional clarity"],
            rejectedAntiPatterns: ["Generic discount badges"],
          },
        ],
        visualThesis: "Terra & Form combines the refined architectural discipline of modular Hasami ceramics with the handcrafted soulful warmth of French artisanal terracotta.",
        originalityDecisions: [
          "Synthesizes tactile matte clay finishes with an interactive digital pigment wheel rather than a static catalog.",
          "Combines an editorial atelier lookbook with an instant hospitality commission calculator.",
        ],
        sharedDesignLanguage: {
          compositionFamily: "EDITORIAL_SHOWCASE",
          typographyPairing: {
            display: "Cormorant Garamond",
            body: "Plus Jakarta Sans",
            mono: "JetBrains Mono",
            rationale: "Balances classical pottery craftsmanship with contemporary typographic readability.",
          },
          colorPaletteDirection: {
            background: "#FAF7F2",
            surface: "#FFFFFF",
            primary: "#8B5E3C",
            accent: "#4A6B5D",
            text: "#1E1C1A",
            rationale: "Warm clay bisque background with deep umber and celadon green accents.",
          },
          spatialDensity: "spacious",
          imageryTreatment: "Warm macro photography of wet clay, wheel turning, and kiln firing.",
          motionPhilosophy: "Subtle organic ease transitions mimicking pottery wheel rotation.",
        },
      },
    });

    // 6. Verify Design Decision Document incorporates research
    expect(ddd.projectIdentity.visualThesis).toContain("Terra & Form combines");
    expect(ddd.referenceResearch.selectedReferences.length).toBeGreaterThanOrEqual(1);
    expect(ddd.visualSystem.colorPalette.background).toBe("#FAF7F2");
    expect(ddd.visualSystem.typography.displayFont).toContain("Cormorant");

    // 7. Plan Individual Page Specifications grounded in research
    const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
      routes,
      prompt,
      brandName,
      discoveredFeatures: [
        "Modular Ceramic Set Configurator",
        "Interactive Glaze Swatchboard",
        "Hospitality Commission Request Form",
        "Studio Workshop Calendar & Booking",
      ],
    });

    expect(pageSpecs.length).toBe(4);
    for (const spec of pageSpecs) {
      expect(spec.status).toBe("SPECIFIED");
      expect(spec.sections.length).toBeGreaterThanOrEqual(1);
      expect(spec.layout.desktop).toBeDefined();
      expect(spec.layout.mobile).toBeDefined();
      // Ensure zero generic fallback names
      expect(spec.pageName).not.toContain("Generic");
      expect(spec.purpose).not.toContain("Incomplete");
    }

    // Verify Glazes route has bespoke material specification
    const glazesSpec = pageSpecs.find((p) => p.route === "/glazes");
    expect(glazesSpec).toBeDefined();
    expect(glazesSpec?.topology).toBeDefined();

    // Verify Commissions route has form/inquiry topology
    const commissionsSpec = pageSpecs.find((p) => p.route === "/commissions");
    expect(commissionsSpec).toBeDefined();
  });
});
