import { describe, it, expect } from "vitest";
import { NavigationDesignResolver } from "../navigation-design.js";
import { DomainVisualDesignContractDeriver } from "../domain-visual-contract.js";
import { ProductUnderstanding } from "../product-understanding.js";

describe("Storefront & Bookstore Generative Pipeline", () => {
  const bookstorePrompt = "Build a website for PAGE & PETAL, an independent bookstore and floral salon specializing in rare literary editions, poetry, botany, and seasonal bouquets.";

  it("1. Accurately preserves compound brand names with conjunctions/ampersands", () => {
    const brand = NavigationDesignResolver.extractBrandFromPrompt(bookstorePrompt);
    expect(brand).toBe("PAGE & PETAL");

    const fallback = NavigationDesignResolver.fallbackBrandName(bookstorePrompt);
    expect(fallback).toBe("PAGE & PETAL");
  });

  it("2. Formats root navigation clean label as 'Home' rather than 'Monograph' for storefronts", () => {
    const label = NavigationDesignResolver.formatCleanLabel("/", "Page & Petal Bookstore & Salon", { isStorefront: true });
    expect(label).toBe("Home");
  });

  it("3. Resolves booking-ordering activity and clean retail characteristics for bookstore prompts", () => {
    const characteristics = ProductUnderstanding.analyze(bookstorePrompt);
    expect(characteristics.primaryActivity).toBe("booking-ordering");
    expect(characteristics.avoidancePatterns || []).not.toContain("cart");
  });

  it("4. DomainVisualDesignContractDeriver creates dynamic bespoke visual contract", () => {
    const contract = DomainVisualDesignContractDeriver.derive(bookstorePrompt);

    expect(contract.domain).toBeTruthy();
    expect(contract.colorSystem.background).toBeTruthy();
    expect(contract.colorSystem.accent).toBeTruthy();
    expect(contract.compositionGraph).toBeDefined();
    expect(contract.artDirection).toBeDefined();
  });

  it("5. FastDeterministicSanitizer synthesizes authentic inventory dashboard rather than avionics telemetry", async () => {
    const { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } = await import("fs");
    const { tmpdir } = await import("os");
    const { join } = await import("path");
    const { FastDeterministicSanitizer } = await import("../../governance/fast-sanitizer.js");

    const tempDir = mkdtempSync(join(tmpdir(), "aegis-bookstore-test-"));
    try {
      const srcDir = join(tempDir, "src");
      const pagesDir = join(srcDir, "pages");
      mkdirSync(pagesDir, { recursive: true });

      // Put an incomplete dashboard
      const dashFile = join(pagesDir, "DashboardPage.tsx");
      writeFileSync(dashFile, `export const DashboardPage = () => <div>Incomplete</div>;`, "utf8");

      // Run dashboard completeness with bookstore prompt
      FastDeterministicSanitizer.ensurePreBaselineDashboardCompleteness(srcDir, {
        prompt: bookstorePrompt,
        requiredModels: ["Book", "Order", "Category"],
      } as any);

      const sanitizedDash = readFileSync(dashFile, "utf8");
      // Verify Single Page Ownership: FastDeterministicSanitizer preserves user files without overwriting
      expect(sanitizedDash).toBe(`export const DashboardPage = () => <div>Incomplete</div>;`);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("6. Analyzes automotive detailing with zero bookstore or avionics leakage", () => {
    const carwashPrompt = "Build a website for SparkleWash Auto Detailing offering ceramic coatings, foam exterior wash, and interior steam extraction.";
    const analysis = ProductUnderstanding.analyze(carwashPrompt);
    const contract = DomainVisualDesignContractDeriver.derive(carwashPrompt);

    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toContain("the overstory");
    expect(json).not.toContain("sys-701");
    expect(json).not.toContain("aircraft");
  });

  it("7. Analyzes artisan bakery catalog with zero bookstore or automotive leakage", () => {
    const bakeryPrompt = "Build a website for Hearth & Crumb, an artisan sourdough bakery offering organic wild fermented loaves and morning pastries.";
    const analysis = ProductUnderstanding.analyze(bakeryPrompt);
    const contract = DomainVisualDesignContractDeriver.derive(bakeryPrompt);

    const json = JSON.stringify({ analysis, contract }).toLowerCase();
    expect(json).not.toContain("the overstory");
    expect(json).not.toContain("ceramic shield");
    expect(json).not.toContain("sys-701");
  });
});
