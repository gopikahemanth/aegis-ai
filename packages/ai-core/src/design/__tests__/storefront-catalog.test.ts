import { describe, it, expect } from "vitest";
import { NavigationDesignResolver } from "../navigation-design.js";
import { GenericExperienceGenerator } from "../experience-generators/generic-experience-generator.js";
import { DomainVisualDesignContractDeriver } from "../domain-visual-contract.js";

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

  it("3. Resolves STOREFRONT_CATALOG capability for bookstore prompts", () => {
    const capability = GenericExperienceGenerator.resolveCapability({
      route: "/",
      pageRole: "Curated Reading & Floral Salon",
      purpose: "Showcase literary catalog and floral pairings with purchasing",
      prompt: bookstorePrompt,
    });
    expect(capability).toBe("STOREFRONT_CATALOG");
  });

  it("4. Generates authentic bookstore experience with shopping bag, book covers, and botanical pairings", () => {
    const code = GenericExperienceGenerator.generate({
      componentName: "StorefrontPage",
      brandName: "PAGE & PETAL",
      route: "/",
      prompt: bookstorePrompt,
      seed: 42,
    });

    expect(code).toContain("STOREFRONT_CATALOG");
    expect(code).toContain("__AEGIS_EXPERIENCE__");
    // Verify book-specific editorial attributes
    expect(code).toMatch(/The Overstory|Braiding Sweetgrass|Piranesi|Anna Akhmatova/);
    expect(code).toMatch(/botanicalPairing/);
    expect(code).toMatch(/handleAddToCart/);
    expect(code).toMatch(/isCartOpen/);
    expect(code).toMatch(/Proceed to Checkout/);
    expect(code).toMatch(/cartTotal/);
    // Ensure warm editorial palette is used
    expect(code).toContain("#FAF7F2");
    expect(code).toContain("#1C3D2E");
    // Ensure avionics / spacecraft / cockpit artifacts are completely absent
    expect(code).not.toContain("Aircraft");
    expect(code).not.toContain("SYS-701");
    expect(code).not.toContain("telemetry");
  });

  it("5. DomainVisualDesignContractDeriver creates dedicated editorial bookstore contract", () => {
    const contract = DomainVisualDesignContractDeriver.derive(bookstorePrompt);

    expect(contract.domain).toContain("Independent Bookseller");
    expect(contract.colorSystem.background).toBe("bg-[#FAF7F2]");
    expect(contract.colorSystem.accent).toContain("#1C3D2E");
    expect(contract.composition?.primaryWorkspace?.title).toContain("Curated Book Catalog");
    expect(contract.composition?.secondaryWorkspace?.title).toContain("Shopping Bag");
  });

  it("6. FastDeterministicSanitizer synthesizes authentic literary inventory dashboard rather than avionics telemetry", async () => {
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
      expect(sanitizedDash).toContain("PAGE & PETAL");
      expect(sanitizedDash).toContain("Curated Inventory & Literary Vault");
      expect(sanitizedDash).toMatch(/The Overstory|Braiding Sweetgrass/);
      expect(sanitizedDash).toContain("BookOpen");
      expect(sanitizedDash).toContain("ISBN-978");
      // Verify complete absence of avionics/telemetry artifacts
      expect(sanitizedDash).not.toContain("Aircraft");
      expect(sanitizedDash).not.toContain("Plane");
      expect(sanitizedDash).not.toContain("SYS-701");
      expect(sanitizedDash).not.toContain("telemetry");
      expect(sanitizedDash).not.toContain("FleetRecord");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("7. Generates authentic automotive detailing catalog with dark palette and service packages", () => {
    const carwashPrompt = "Build a website for SparkleWash Auto Detailing offering ceramic coatings, foam exterior wash, and interior steam extraction.";
    const code = GenericExperienceGenerator.generate({
      componentName: "ServicesCatalogPage",
      brandName: "SparkleWash Detailing",
      route: "/services",
      prompt: carwashPrompt,
      seed: 42,
    });

    expect(code).toContain("STOREFRONT_CATALOG");
    expect(code).toContain("Ceramic Shield Detail");
    expect(code).toContain("Deluxe Foam Exterior");
    expect(code).toContain("Interior Steam Sanitization");
    expect(code).toContain("Selected Services");
    expect(code).toContain("Select Package");
    expect(code).toContain("#0B1120"); // Dark sleek theme
    // Ensure zero bookstore or avionics leakage
    expect(code).not.toContain("The Overstory");
    expect(code).not.toContain("botanicalPairing");
    expect(code).not.toContain("SYS-701");
    expect(code).not.toContain("Aircraft");
  });

  it("8. Generates authentic artisan bakery catalog with warm hearth palette and sourdough batches", () => {
    const bakeryPrompt = "Build a website for Hearth & Crumb, an artisan sourdough bakery offering organic wild fermented loaves and morning pastries.";
    const code = GenericExperienceGenerator.generate({
      componentName: "BakesCatalogPage",
      brandName: "Hearth & Crumb",
      route: "/catalog",
      prompt: bakeryPrompt,
      seed: 42,
    });

    expect(code).toContain("STOREFRONT_CATALOG");
    expect(code).toContain("Heritage Sourdough Batard");
    expect(code).toContain("Almond Frangipane Croissant");
    expect(code).toContain("Cardamom Morning Bun");
    expect(code).toContain("Oven Box");
    expect(code).toContain("Order Batch");
    expect(code).toContain("#FAF8F5"); // Warm hearth theme
    // Ensure zero bookstore or automotive leakage
    expect(code).not.toContain("The Overstory");
    expect(code).not.toContain("Ceramic Shield Detail");
    expect(code).not.toContain("SYS-701");
  });
});
