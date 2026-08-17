import { describe, it, expect } from "vitest";
import { ExistingProductScanner } from "../existing-product-scanner.js";

describe("AEGIS Phase 56 — Existing Product Scanner", () => {
  it("scans existing repository and extracts complete product inventory", () => {
    const inventory = ExistingProductScanner.scan();
    expect(inventory.frontendFramework).toContain("React");
    expect(inventory.backendFramework).toContain("Express");
    expect(inventory.database).toBe("PostgreSQL");
    expect(inventory.orm).toBe("Prisma ORM");
    expect(inventory.totalRoutes).toBeGreaterThan(0);
    expect(inventory.totalComponents).toBeGreaterThan(0);
  });
});
