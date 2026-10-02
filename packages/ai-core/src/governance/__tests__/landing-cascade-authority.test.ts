import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";

describe("Landing Route Three-Tier Cascade Authority", () => {
  let testDir: string;
  let srcDir: string;
  let pagesDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-landing-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    srcDir = join(testDir, "src");
    pagesDir = join(srcDir, "pages");
    mkdirSync(pagesDir, { recursive: true });

    // Dummy pages: CertificatePage (sorts alphabetically first: "c-e-r-t"),
    // CourseCatalogPage ("c-o-u-r-s-e"), and DataExportPage ("d-a-t-a")
    writeFileSync(
      join(pagesDir, "CertificatePage.tsx"),
      `export default function CertificatePage() { return <div>Certificates</div>; }`,
      "utf8"
    );
    writeFileSync(
      join(pagesDir, "CourseCatalogPage.tsx"),
      `export default function CourseCatalogPage() { return <div>Courses</div>; }`,
      "utf8"
    );
    writeFileSync(
      join(pagesDir, "DataExportPage.tsx"),
      `export default function DataExportPage() { return <div>Export</div>; }`,
      "utf8"
    );
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Tier 1: Prioritizes authoritative primaryLandingFeature over alphabetical order", () => {
    const routeContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(testDir, {
      prompt: "an online learning platform where students can browse courses, take interactive quizzes, track progress, and download certificates",
      primaryLandingFeature: "CourseCatalogPage",
    } as any);

    const rootMatch = routeContent.match(/path="\/" element=\{<([A-Za-z0-9]+)/);
    expect(rootMatch).not.toBeNull();
    // Must be CourseCatalogPage, NEVER CertificatePage (which sorts alphabetically first)
    expect(rootMatch![1]).toBe("CourseCatalogPage");
  });

  it("Tier 1 (Disk Provenance): Reads primaryLandingFeature from .aegis/product-experience-plan.json when contract lacks it", () => {
    const aegisDir = join(testDir, ".aegis");
    mkdirSync(aegisDir, { recursive: true });
    writeFileSync(
      join(aegisDir, "product-experience-plan.json"),
      JSON.stringify({
        primaryLandingFeature: "CourseCatalogPage",
        experiencePattern: "catalog-browser",
      }),
      "utf8"
    );

    // Contract has NO primaryLandingFeature set
    const routeContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(testDir, {
      prompt: "an online learning platform",
    } as any);

    const rootMatch = routeContent.match(/path="\/" element=\{<([A-Za-z0-9]+)/);
    expect(rootMatch).not.toBeNull();
    expect(rootMatch![1]).toBe("CourseCatalogPage");
  });

  it("Tier 2: Resolves preferredHomeSlug from experiencePattern when Tier 1 is absent", () => {
    // Neither contract nor disk has primaryLandingFeature
    // But .aegis/product-experience-plan.json specifies experiencePattern "catalog-browser"
    const aegisDir = join(testDir, ".aegis");
    mkdirSync(aegisDir, { recursive: true });
    writeFileSync(
      join(aegisDir, "product-experience-plan.json"),
      JSON.stringify({
        experiencePattern: "catalog-browser",
      }),
      "utf8"
    );

    const routeContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(testDir, {
      prompt: "a resource directory with courses and certificates",
    } as any);

    const rootMatch = routeContent.match(/path="\/" element=\{<([A-Za-z0-9]+)/);
    expect(rootMatch).not.toBeNull();
    // Tier 2 preferredHomeSlug for catalog-browser is "catalog" -> matches CourseCatalogPage
    expect(rootMatch![1]).toBe("CourseCatalogPage");
  });

  it("Tier 3: Exercises conservative semantic ranker when Tiers 1 and 2 are absent, never alphabetical fallback", () => {
    // DispatchLogPage vs DataExportPage (DataExport sorts earlier alphabetically)
    const freightPagesDir = join(testDir, "src", "pages");
    writeFileSync(
      join(freightPagesDir, "DispatchLogPage.tsx"),
      `export default function DispatchLogPage() { return <div>Dispatch Log</div>; }`,
      "utf8"
    );

    const routeContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(testDir, {
      prompt: "freight logistics dispatch and tracking app",
      // No primaryLandingFeature (Tier 1 skipped)
      // No experiencePattern (Tier 2 skipped)
      requiredModels: ["Dispatch", "Shipment"],
    } as any);

    const rootMatch = routeContent.match(/path="\/" element=\{<([A-Za-z0-9]+)/);
    expect(rootMatch).not.toBeNull();

    // Semantic scoring gives DispatchLogPage (+90 archetype + 60 model match) > DataExportPage (-200 penalty)
    // and > CertificatePage (-150 penalty)
    expect(rootMatch![1]).toBe("DispatchLogPage");
    expect(rootMatch![1]).not.toBe("CertificatePage");
    expect(rootMatch![1]).not.toBe("DataExportPage");
  });
});
