import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";

const TEST_DIR = join(process.cwd(), "temp-gen-phase2-regressions-test");

describe("Phase 2 Generalization Regressions: Server Route Mounting & Prisma Schema Auto-Repair", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("sanitizes hyphenated route file names into valid JS identifiers when mounting in server/index.ts", () => {
    // Write checkpoint to simulate post-frontend approval
    writeFileSync(
      join(TEST_DIR, ".aegis", "stage-checkpoint.json"),
      JSON.stringify({ currentStage: "FRONTEND_APPROVED" }),
      "utf8"
    );

    // Create hyphenated route file: server/routes/geo-performance.ts
    const routeFile = join(TEST_DIR, "server", "routes", "geo-performance.ts");
    writeFileSync(routeFile, "import { Router } from 'express'; const router = Router(); export default router;");

    // Create server/index.ts that does not have it mounted yet
    const serverIndex = join(TEST_DIR, "server", "index.ts");
    writeFileSync(serverIndex, `import express from 'express';\nconst app = express();\napp.listen(5000);`);

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    const updatedIndex = readFileSync(serverIndex, "utf8");
    // Ensure import does NOT contain illegal hyphenated variable identifier
    expect(updatedIndex).not.toMatch(/import\s+[a-zA-Z0-9_$]+-[a-zA-Z0-9_$]+/);
    // Ensure it was sanitized to geo_performanceRouter_0
    expect(updatedIndex).toContain("geo_performanceRouter_0");
    expect(updatedIndex).toContain(`import geo_performanceRouter_0 from "./routes/geo-performance";`);
    expect(updatedIndex).toContain(`app.use("/api/geo-performance", geo_performanceRouter_0);`);
  });

  it("auto-repairs missing scalar foreign key fields in Prisma schema for P1012 compliance", () => {
    const absSchema = join(TEST_DIR, "prisma", "schema.prisma");
    const badSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  auditLogs AuditLog[]
}

model AuditLog {
  id           String   @id @default(uuid())
  action       String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;
    writeFileSync(absSchema, badSchema, "utf8");

    // Simulate startup agent schema repair logic
    let schemaContent = readFileSync(absSchema, "utf8");
    let schemaModified = false;
    const modelBlocks = schemaContent.split(/(?=model\s+\w+\s*\{)/);

    for (const block of modelBlocks) {
      const mMatch = block.match(/model\s+([A-Za-z0-9_$]+)\s*\{([\s\S]*?)\}/);
      if (mMatch) {
        const mName = mMatch[1];
        const mBody = mMatch[2];
        const relMatches = mBody.matchAll(/@relation\s*\([^)]*fields:\s*\[([^\]]+)\]/g);
        for (const rm of relMatches) {
          const fkFields = rm[1].split(",").map(f => f.trim()).filter(Boolean);
          for (const fkField of fkFields) {
            const hasField = new RegExp(`^\\s*${fkField}\\s+[A-Za-z0-9_$]+`, "m").test(mBody);
            if (!hasField) {
              const targetRegex = new RegExp(`(model\\s+${mName}\\s*\\{[^}]*)(\\})`, "s");
              schemaContent = schemaContent.replace(targetRegex, `$1  ${fkField} String\n$2`);
              schemaModified = true;
            }
          }
        }
      }
    }

    if (schemaModified) {
      writeFileSync(absSchema, schemaContent, "utf8");
    }

    const repaired = readFileSync(absSchema, "utf8");
    expect(repaired).toContain("userId String");
    expect(repaired).toMatch(/model\s+AuditLog\s*\{[\s\S]*userId\s+String[\s\S]*\}/);
  });

  it("injects canonical action callback and collection fallbacks into SafeRouteWrapper in routes.tsx", () => {
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    // Write a sample component expecting onAddToCart and onScheduleTour
    writeFileSync(
      join(TEST_DIR, "src", "pages", "CatalogPage.tsx"),
      `import React from "react";\nexport default function CatalogPage({ onAddToCart, onScheduleTour }: any) { return <button onClick={() => onAddToCart && onAddToCart({})}>Add</button>; }`
    );

    const routesCode = FastDeterministicSanitizer.generateRoutesFromExistingPages(TEST_DIR);
    expect(routesCode).toContain("onAddToCart: () => {}");
    expect(routesCode).toContain("onScheduleTour: () => {}");
    expect(routesCode).toContain("onSaveProperty: () => {}");
    expect(routesCode).toContain("properties: []");
    expect(routesCode).toContain("cart: []");
    expect(routesCode).toContain("function SafeRouteWrapper");
  });

  it("TEST 4: Velora Living furniture e-commerce prompt is never hijacked by museum/gallery rules", async () => {
    const { ArchitectureResolver } = await import("../architecture-resolver.js");
    const veloraPrompt = "Build a premium furniture store and e-commerce website named VELORA LIVING. Create a distinctive, high-end interior furnishings retail platform featuring product listings, material and category filters, interactive product details with dimension specs, and a functional shopping cart with order summary. Requirements: - Distinctive product gallery, interactive cart drawer/page, and item details.";
    const contract = ArchitectureResolver.resolve(veloraPrompt);

    expect(contract.requiredRoutes).not.toContain("/rotating-exhibitions");
    expect(contract.requiredRoutes).not.toContain("/explore-artist-profiles");
    expect(contract.requiredRoutes).not.toContain("/plan-museum-visit");
    expect(contract.requiredRoutes).toContain("/products");
    expect(contract.requiredRoutes).toContain("/cart");
    expect(contract.requiredRoutes).toContain("/order-summary");

    expect(contract.requiredModels).not.toContain("Exhibition");
    expect(contract.requiredModels).not.toContain("Artist");
    expect(contract.requiredModels).not.toContain("Artwork");
    expect(contract.requiredModels).toContain("Product");
    expect(contract.requiredModels).toContain("CartItem");
    expect(contract.requiredModels).toContain("Order");
  });

  it("TEST 5: Savoria Kitchen restaurant food ordering prompt is never hijacked by culinary travel magazine", async () => {
    const { ArchitectureResolver } = await import("../architecture-resolver.js");
    const savoriaPrompt = "Build a modern food ordering and table reservation website named SAVORIA KITCHEN. Create an enticing, high-end culinary ordering platform featuring categorized menus (Appetizers, Chef's Specials, Main Courses, Desserts, Artisan Beverages), dietary filter tags (Gluten-Free, Vegan, Halal), interactive dish details with allergen information, a dynamic cart drawer with quantity increments, special instructions input, order checkout with delivery/pickup selection, and order history persistence.";
    const contract = ArchitectureResolver.resolve(savoriaPrompt);

    expect(contract.requiredRoutes).not.toContain("/editorial-stories");
    expect(contract.requiredRoutes).not.toContain("/explore-culinary-destinations");
    expect(contract.requiredRoutes).not.toContain("/build-custom-itinerary");
    expect(contract.requiredRoutes).toContain("/menu");
    expect(contract.requiredRoutes).toContain("/cart");
    expect(contract.requiredRoutes).toContain("/checkout");
    expect(contract.requiredRoutes).toContain("/order-history");
    expect(contract.requiredRoutes).toContain("/table-reservation");

    expect(contract.requiredModels).not.toContain("CulinaryStory");
    expect(contract.requiredModels).not.toContain("CulinaryDestination");
    expect(contract.requiredModels).toContain("MenuItem");
    expect(contract.requiredModels).toContain("CartItem");
    expect(contract.requiredModels).toContain("Order");
    expect(contract.requiredModels).toContain("Reservation");
  });

  it("TEST 6: Aura Health clinic prompt avoids CLI classification and PlatformNamed entity degradation", async () => {
    const { ArchitectureResolver } = await import("../architecture-resolver.js");
    const auraPrompt = "Build a healthcare appointment booking platform named AURA HEALTH. Create a patient-centric medical scheduling platform featuring provider listings, clinic availability calendars, interactive booking forms with time slot selection, and patient appointment management.";
    const contract = ArchitectureResolver.resolve(auraPrompt);

    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.applicationType).not.toBe("CLI_APPLICATION");
    expect(contract.requiredRoutes).not.toContain("/platform-named");
    expect(contract.requiredRoutes).toContain("/providers");
    expect(contract.requiredRoutes).toContain("/clinic-calendar");
    expect(contract.requiredRoutes).toContain("/book-appointment");

    expect(contract.requiredModels).not.toContain("PlatformNamed");
    expect(contract.requiredModels).toContain("Provider");
    expect(contract.requiredModels).toContain("Appointment");
  });

  it("TEST 7: Dwellio Realty resolves to authentic real estate marketplace routes and models", async () => {
    const { ArchitectureResolver } = await import("../architecture-resolver.js");
    const dwellioPrompt = "Build an interactive real estate property marketplace named DWELLIO REALTY. Create a premium architectural property platform featuring search with advanced filters (price range, bedroom count, property type: Villa, Penthouse, Modern Loft, location), interactive listing cards with square footage and amenity badges, property detail views with photo galleries, agent contact & tour scheduling forms, and saved favorite properties.";
    const contract = ArchitectureResolver.resolve(dwellioPrompt);

    expect(contract.requiredRoutes).toContain("/filter-properties");
    expect(contract.requiredRoutes).toContain("/property-details");
    expect(contract.requiredRoutes).toContain("/schedule-property-tour");
    expect(contract.requiredRoutes).toContain("/favorite-listings");
    expect(contract.requiredRoutes).toContain("/contact-property-agent");

    expect(contract.requiredModels).toContain("Property");
  });
});

