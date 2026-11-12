import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AssetDirector } from "../asset-director.js";
import {
  CompositeAssetProvider,
  CuratedDomainAssetProvider,
  GoogleGeminiImageProvider,
  OpenAiImageProvider,
} from "../asset-provider.js";
import { AssetAcceptanceGate } from "../../validation/asset-acceptance-gate.js";

describe("Aegis AI — Autonomous Visual Asset, Photography & Image Generation Engine", () => {
  const testOutputDir = join(process.cwd(), "scratch", "test-asset-director-sandbox");

  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
    mkdirSync(join(testOutputDir, ".aegis"), { recursive: true });
    mkdirSync(join(testOutputDir, "src", "content"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  // ── 1. ARCHITECTURE STUDIO VISUAL ASSET PLANNING ──────────────────────────
  describe("1. Architecture Studio Visual Asset Planning", () => {
    const prompt =
      "Create a premium interior architecture studio website with a portfolio, room estimator, material collection, consultation booking and client portal.";

    it("1.1 Plans authentic architectural elevation, interior, texture, and diagram assets", () => {
      const manifest = AssetDirector.planAssets({
        prompt,
        brandName: "Komorebi Architecture Studio",
        domain: "architecture",
        routes: ["/", "/portfolio", "/material-swatchboard", "/room-estimator", "/consultation"],
        visualThesis: "Quiet luxury, architectural gravitas, and spatial mastery through light",
        artDirection: "ARCHITECTURAL_EDITORIAL",
      });

      expect(manifest.assets.length).toBeGreaterThanOrEqual(4);
      expect(manifest.domain).toBe("architecture");

      // Verify Hero Architectural Photography
      const hero = manifest.assets.find((a) => a.id === "ast-home-hero");
      expect(hero).toBeDefined();
      expect(hero?.category).toBe("architecture-photography");
      expect(hero?.aspectRatio).toBe("16:9");
      expect(hero?.altText).toContain("Komorebi Architecture Studio signature modernist architecture");
      expect(hero?.prompt).toContain("Architectural photography");

      // Verify Material Swatch
      const swatch = manifest.assets.find((a) => a.id.includes("swatch"));
      expect(swatch).toBeDefined();
      expect(swatch?.category).toBe("texture");
      expect(swatch?.aspectRatio).toBe("1:1");
      expect(swatch?.cropping).toBe("cover");

      // Verify Spatial Room Estimator Diagram
      const diagram = manifest.assets.find((a) => a.id.includes("diagram"));
      expect(diagram).toBeDefined();
      expect(diagram?.category).toBe("diagram");
      expect(diagram?.altText).toContain("Architectural room dimension and spatial volume diagram");

      // Verify Lead Architect Portrait
      const portrait = manifest.assets.find((a) => a.id.includes("portrait"));
      expect(portrait).toBeDefined();
      expect(portrait?.category).toBe("team-portrait");
      expect(portrait?.aspectRatio).toBe("3:4");
    });
  });

  // ── 2. PET CARE BOUTIQUE VISUAL ASSET PLANNING ─────────────────────────────
  describe("2. Pet Care Boutique Visual Asset Planning", () => {
    const prompt =
      "Build a Luxury Pet Care Boutique and Animal Sanctuary platform with vibrant photo galleries of golden retriever puppies, british shorthair cats, organic pantry treats, and grooming spa.";

    it("2.1 Plans companion animal photography, treat pantry, and sanctuary moments", () => {
      const manifest = AssetDirector.planAssets({
        prompt,
        brandName: "Paw Sanctuary Boutique",
        domain: "pet-care",
        routes: ["/", "/gallery", "/pantry", "/team"],
        visualThesis: "Warmth, holistic compassion, and sanctuary companion care",
        artDirection: "PLAYFUL_APPROACHABLE",
      });

      const hero = manifest.assets.find((a) => a.id === "ast-home-hero");
      expect(hero).toBeDefined();
      expect(hero?.category).toBe("hero-photography");
      expect(hero?.subject).toContain("Golden retriever puppy and british shorthair cat");
      expect(hero?.altText).toContain("Playful golden retriever puppy and cat relaxing together");

      const pantry = manifest.assets.find((a) => a.page.includes("pantry"));
      expect(pantry).toBeDefined();
      expect(pantry?.category).toBe("product-photography");
      expect(pantry?.aspectRatio).toBe("1:1");
    });
  });

  // ── 3. SAAS & FINANCIAL APPLICATION ASSET PLANNING ─────────────────────────
  describe("3. SaaS & Financial Application Asset Planning", () => {
    const prompt =
      "Build an enterprise cloud infrastructure monitoring and financial cost telemetry console with live Kubernetes metrics and cost charts.";

    it("3.1 Plans platform UI screenshots and telemetry diagrams instead of decorative stock photos", () => {
      const manifest = AssetDirector.planAssets({
        prompt,
        brandName: "Aether Telemetry",
        domain: "saas",
        routes: ["/", "/metrics"],
        visualThesis: "Data density, precision metrics, and clean telemetry hierarchy",
        artDirection: "TECHNICAL_PRECISION",
      });

      const hero = manifest.assets.find((a) => a.id === "ast-home-hero");
      expect(hero).toBeDefined();
      expect(hero?.category).toBe("product-screenshot");
      expect(hero?.cropping).toBe("contain");
      expect(hero?.prompt).toContain("Modern SaaS UI screenshot");
    });
  });

  // ── 4. ASSET RESOLUTION & TYPESCRIPT CATALOG GENERATION ────────────────────
  describe("4. Asset Resolution & TypeScript Catalog Generation", () => {
    it("4.1 Resolves assets, saves manifest, and generates typed src/content/site-assets.ts", async () => {
      const prompt = "Artisan European bakery and stone hearth patisserie";
      const manifest = AssetDirector.planAssets({
        prompt,
        brandName: "Crumb & Hearth",
        domain: "bakery",
        routes: ["/", "/shop"],
      });

      const resolvedManifest = await AssetDirector.resolveAssets(manifest, testOutputDir);

      expect(resolvedManifest.status).toBe("COMPLETE");
      expect(resolvedManifest.assets.every((a) => a.resolvedUrl.startsWith("http"))).toBe(true);

      // Verify files created on disk
      const manifestJsonPath = join(testOutputDir, ".aegis", "asset-manifest.json");
      const manifestMdPath = join(testOutputDir, ".aegis", "asset-manifest.md");
      const siteAssetsTsPath = join(testOutputDir, "src", "content", "site-assets.ts");

      expect(existsSync(manifestJsonPath)).toBe(true);
      expect(existsSync(manifestMdPath)).toBe(true);
      expect(existsSync(siteAssetsTsPath)).toBe(true);

      const tsContent = readFileSync(siteAssetsTsPath, "utf8");
      expect(tsContent).toContain("export const siteAssets: Record<string, SiteAsset>");
      expect(tsContent).toContain("export function getAsset(id: string)");
      expect(tsContent).toContain("ast-home-hero");
    });
  });

  // ── 5. PROVIDER ABSTRACTION & HONEST REPORTING ────────────────────────────
  describe("5. Provider Abstraction & Honest Reporting", () => {
    it("5.1 GoogleGeminiImageProvider honestly reports when API is unconfigured", async () => {
      const provider = new GoogleGeminiImageProvider();
      const res = await provider.generate({
        prompt: "A beautiful mountain",
        category: "hero-photography",
        subject: "Mountain",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.sourceMethod).toBe("FAILED");
    });

    it("5.2 OpenAiImageProvider honestly reports when API is unconfigured", async () => {
      const provider = new OpenAiImageProvider();
      const res = await provider.generate({
        prompt: "A beautiful interior",
        category: "architecture-photography",
        subject: "Interior",
      });

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.sourceMethod).toBe("FAILED");
    });

    it("5.3 CompositeAssetProvider seamlessly fails over to curated licensed sourcing", async () => {
      const composite = new CompositeAssetProvider();
      const res = await composite.generate({
        prompt: "A golden retriever puppy in a sunny park",
        category: "hero-photography",
        subject: "Golden Retriever Puppy",
      });

      expect(res.success).toBe(true);
      expect(res.sourceMethod).toBe("SOURCED");
      expect(res.resolvedUrl).toContain("images.unsplash.com");
      expect(res.license).toContain("Unsplash Commercial License");
    });
  });

  // ── 6. ASSET ACCEPTANCE GATE ──────────────────────────────────────────────
  describe("6. Asset Acceptance Gate", () => {
    it("6.1 Rejects project when asset manifest is missing", () => {
      // Create empty src
      mkdirSync(join(testOutputDir, "src"), { recursive: true });
      rmSync(join(testOutputDir, ".aegis", "asset-manifest.json"), { force: true });

      const report = AssetAcceptanceGate.audit(testOutputDir);
      expect(report.passed).toBe(false);
      expect(report.violations[0]).toContain("ASSET_MANIFEST_MISSING");
    });

    it("6.2 Passes project when all assets are resolved with alt text and site-assets.ts", async () => {
      const manifest = AssetDirector.planAssets({
        prompt: "Luxury interior architecture studio with portfolio and material collection",
        brandName: "Atelier Form",
        domain: "architecture",
        routes: ["/", "/portfolio"],
      });

      await AssetDirector.resolveAssets(manifest, testOutputDir);

      // Create a valid JSX file using the asset
      writeFileSync(
        join(testOutputDir, "src", "Hero.tsx"),
        `<img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c" alt="Atelier Form signature architecture" />`,
        "utf8"
      );

      const report = AssetAcceptanceGate.audit(testOutputDir);
      expect(report.passed).toBe(true);
      expect(report.status).toBe("PASS");
      expect(report.totalAssets).toBeGreaterThan(0);
      expect(report.resolvedAssets).toBe(report.totalAssets);
      expect(report.violations.length).toBe(0);
    });

    it("6.3 Catches broken empty image tags in JSX", async () => {
      const manifest = AssetDirector.planAssets({
        prompt: "Boutique café",
        brandName: "Aura Roast",
        domain: "coffee",
        routes: ["/"],
      });

      await AssetDirector.resolveAssets(manifest, testOutputDir);

      // Add a file with broken empty image tag
      writeFileSync(
        join(testOutputDir, "src", "BrokenBanner.tsx"),
        `export const Broken = () => <img src="" alt="empty" />;`,
        "utf8"
      );

      const report = AssetAcceptanceGate.audit(testOutputDir);
      expect(report.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("BROKEN_IMAGE_TAG"))).toBe(true);
    });
  });

  // ── 7. CODER AGENT PROMPT CONTEXT ─────────────────────────────────────────
  describe("7. Coder Agent Prompt Context", () => {
    it("7.1 Formats mandatory asset binding directives for downstream coders", () => {
      const manifest = AssetDirector.planAssets({
        prompt: "Contemporary residential architecture studio",
        brandName: "ArchForm",
        domain: "architecture",
        routes: ["/"],
      });

      const coderContext = AssetDirector.buildCoderContext(manifest);
      expect(coderContext).toContain("AEGIS AUTHORITATIVE VISUAL ASSET PLAN");
      expect(coderContext).toContain("Import them directly from '@/content/site-assets'");
      expect(coderContext).toContain("ast-home-hero");
      expect(coderContext).toContain("CRITICAL RULE: Always bind these intentional domain assets");
    });
  });
});
