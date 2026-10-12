import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NavigationDesignResolver, NavigationDesign } from "../../design/navigation-design.js";
import { CopyQualityGate } from "../copy-quality-gate.js";
import { TemplateConvergenceGate } from "../template-convergence-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("NavigationDesign and CopyQualityGate Anti-Convergence Invariants", () => {
  let testProjectDir: string;

  beforeEach(() => {
    testProjectDir = join(tmpdir(), `aegis-nav-test-${Date.now()}`);
    mkdirSync(join(testProjectDir, "src", "components"), { recursive: true });
    mkdirSync(join(testProjectDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testProjectDir, "src", "content"), { recursive: true });
    mkdirSync(join(testProjectDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(testProjectDir)) {
        rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it("1. Two unrelated prompts generate completely different NavigationDesign objects", () => {
    const kazzooPrompt = "Create a whimsical 3D claymation fantasy adventure world called Kazzoo with floating islands and soundboard.";
    const editorialPrompt = "Create an independent fashion magazine and monograph publication with photographer profiles and photo essays.";
    const luxuryPerfumePrompt = "Create a luxury bespoke perfume maison website showcasing crystal flacons and olfactory notes.";

    const kazzooDesign = NavigationDesignResolver.resolve(
      kazzooPrompt,
      "immersive-3d",
      "KAZZOO",
      "Whimsical World",
      [{ path: "/", title: "WorldStage" }, { path: "/characters", title: "Characters" }]
    );

    const editorialDesign = NavigationDesignResolver.resolve(
      editorialPrompt,
      "craft-editorial",
      "REVUE NOIR",
      "Monograph Edition",
      [{ path: "/", title: "Monograph" }, { path: "/essays", title: "Essays" }]
    );

    const perfumeDesign = NavigationDesignResolver.resolve(
      luxuryPerfumePrompt,
      "bespoke-luxury",
      "MAISON ÉTHER",
      "Haute Parfumerie",
      [{ path: "/", title: "The Flacon" }, { path: "/notes", title: "Notes" }]
    );

    expect(kazzooDesign.model).toBe("immersive_hud");
    expect(editorialDesign.model).toBe("top_masthead");
    expect(perfumeDesign.model).toBe("minimal_wordmark");

    expect(kazzooDesign.brandTreatment.name).toBe("KAZZOO");
    expect(editorialDesign.brandTreatment.name).toBe("REVUE NOIR");
    expect(perfumeDesign.brandTreatment.name).toBe("MAISON ÉTHER");

    const kazzooFingerprint = NavigationDesignResolver.computeFingerprint(kazzooDesign);
    const editorialFingerprint = NavigationDesignResolver.computeFingerprint(editorialDesign);
    const perfumeFingerprint = NavigationDesignResolver.computeFingerprint(perfumeDesign);

    expect(kazzooFingerprint.fingerprintHash).not.toBe(editorialFingerprint.fingerprintHash);
    expect(editorialFingerprint.fingerprintHash).not.toBe(perfumeFingerprint.fingerprintHash);
  });

  it("2. Brand name sanitization prevents raw user prompt or truncated instructions from leaking", () => {
    const rawPrompt = "Create an independent fashion magazine publication with archival photo essays.";
    const truncatedCandidate = "Create an independent fa...";

    const sanitized = NavigationDesignResolver.sanitizeBrandName(truncatedCandidate, rawPrompt);
    expect(sanitized).toBe("REVUE NOIR");
    expect(sanitized).not.toContain("Create an independent fa");
    expect(sanitized).not.toContain("...");
  });

  it("3. TemplateConvergenceGate detects generic canned shell reuse (stone-900 / amber-pulse / navbar-more-btn)", () => {
    writeFileSync(
      join(testProjectDir, "src", "components", "Navbar.tsx"),
      `import React from "react";
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-6 py-3.5">
      <div className="flex items-center">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <span>Create an independent fa...</span>
      </div>
      <button id="navbar-more-btn">More</button>
    </header>
  );
}`
    );

    const report = TemplateConvergenceGate.audit(testProjectDir, null);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("NAVBAR_REUSE_DETECTED"))).toBe(true);
    expect(report.websiteIdentity.navigation).toBe("FAIL");
  });

  it("4. CopyQualityGate detects spelling errors and typos in component copy", () => {
    writeFileSync(
      join(testProjectDir, "src", "pages", "PhotographerPage.tsx"),
      `import React from "react";
export default function PhotographerPage() {
  return (
    <div>
      <h1>Renowned photgrapher Profiles</h1>
      <p>Join us on an unforgettable adventuree through the visual archives.</p>
    </div>
  );
}`
    );

    const report = CopyQualityGate.audit(testProjectDir);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.type === "SPELLING" && v.text === "photgrapher")).toBe(true);
    expect(report.violations.some(v => v.type === "SPELLING" && v.text === "adventuree")).toBe(true);
  });

  it("5. CopyQualityGate detects artificial ellipsis truncation in user-visible strings", () => {
    writeFileSync(
      join(testProjectDir, "src", "components", "Navbar.tsx"),
      `import React from "react";
export default function Navbar() {
  return (
    <nav>
      <span>Create an independent fa...</span>
    </nav>
  );
}`
    );

    const report = CopyQualityGate.audit(testProjectDir);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.type === "TRUNCATION")).toBe(true);
  });

  it("6. CopyQualityGate detects raw PascalCase component names leaked into navigation labels", () => {
    writeFileSync(
      join(testProjectDir, "src", "components", "Navbar.tsx"),
      `import React from "react";
export default function Navbar() {
  return (
    <nav>
      <a href="/folio">CuratedArchivalFolio</a>
      <a href="/workspace">PrimaryWorkspace</a>
    </nav>
  );
}`
    );

    const report = CopyQualityGate.audit(testProjectDir);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.type === "RAW_COMPONENT_NAME")).toBe(true);
  });

  it("7. FastDeterministicSanitizer preserves custom navigation and does NOT overwrite with generic templates", () => {
    const bespokeNavbar = `import React from "react";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl">
      <div className="bg-stone-950/75 backdrop-blur-xl border border-amber-500/20 rounded-full px-8 py-3.5">
        <Link to="/" className="font-serif tracking-[0.25em] text-amber-100">MAISON ÉTHER</Link>
        <nav className="flex gap-6">
          <Link to="/flacon">The Flacon</Link>
          <Link to="/notes">Fragrance Notes</Link>
        </nav>
      </div>
    </header>
  );
}
export default Navbar;
`;

    const navPath = join(testProjectDir, "src", "components", "Navbar.tsx");
    writeFileSync(navPath, bespokeNavbar, "utf8");

    // Run sanitizer on project
    FastDeterministicSanitizer.sanitizeProject(testProjectDir, {
      id: "contract-1",
      name: "MaisonEther",
      type: "react",
      routes: [],
      dependencies: {},
      prompt: "Create a luxury perfume website"
    } as any);

    const resultingNav = readFileSync(navPath, "utf8");
    expect(resultingNav).toContain("MAISON ÉTHER");
    expect(resultingNav).toContain("The Flacon");
    expect(resultingNav).not.toContain("bg-stone-900/95");
    expect(resultingNav).not.toContain("navbar-more-btn");
  });

  it("8. Multi-dimensional WEBSITE_IDENTITY report correctly validates distinct dimensions", () => {
    // Write valid editorial masthead and diverse sections
    writeFileSync(
      join(testProjectDir, "src", "components", "Navbar.tsx"),
      `import React from "react";
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-stone-950/95 border-b border-stone-800 px-12 py-4">
      <span className="font-serif text-2xl font-bold tracking-widest text-stone-100">REVUE NOIR</span>
      <nav className="flex gap-8 font-serif text-sm">
        <a href="/">Monograph</a>
        <a href="/photographers">Photographers</a>
        <a href="/essays">Essays</a>
      </nav>
    </header>
  );
}`
    );

    writeFileSync(
      join(testProjectDir, "src", "pages", "HomePage.tsx"),
      `import React from "react";
export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-serif text-5xl">The Visual Monograph</h1>
      <p className="font-serif italic text-stone-400">Autumn / Winter Issue No. 14</p>
      <div className="grid grid-cols-2 gap-12 mt-8">
        <article className="prose">Essay content with pullquote</article>
        <figure><img src="/photo.jpg" alt="Editorial Spread" /></figure>
      </div>
    </main>
  );
}`
    );

    const plan = {
      productTitle: "Revue Noir",
      experiencePattern: "craft-editorial",
      experienceCapability: {
        experienceType: "EDITORIAL",
        renderingMode: "standard-dom",
        real3dRequired: false,
      },
      navigationDesign: {
        model: "top_masthead",
        position: "top",
        brandTreatment: { name: "REVUE NOIR", typography: "font-serif", logoType: "editorial_header", style: "" },
        primaryItems: [{ path: "/", label: "Monograph" }],
        mobileModel: "drawer",
        visualTreatment: { typography: "font-serif", geometry: "", surface: "", activeState: "", motion: "" },
        interactionModel: "serif-underline",
        provenance: "plan"
      }
    };

    const report = TemplateConvergenceGate.audit(testProjectDir, plan as any);
    expect(report.passed).toBe(true);
    expect(report.websiteIdentity.navigation).toBe("PASS");
    expect(report.websiteIdentity.composition).toBe("PASS");
    expect(report.websiteIdentity.visualLanguage).toBe("PASS");
    expect(report.websiteIdentity.interactionModel).toBe("PASS");
    expect(report.websiteIdentity.content).toBe("PASS");
    expect(report.websiteIdentity.responsive).toBe("PASS");
  });
});
