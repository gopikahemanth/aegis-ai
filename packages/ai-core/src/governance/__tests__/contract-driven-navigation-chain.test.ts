import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DeterministicProjectFixer } from "../../validation/deterministic-project-fixer.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";

describe("Aegis Generic Contract-Driven Navigation, Routes, API and Prisma Pipeline", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-contract-chain-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Domain 1 (Restaurant Platform): Derives navigation, routes, page components, API client, controllers, and Prisma from contract", () => {
    const restaurantContract: Partial<ArchitectureContractV1> = {
      version: 1,
      status: "locked",
      prompt: "Build a modern full-stack restaurant online ordering and table reservation platform with interactive food menu, cart checkout, table booking, and chef order dashboard.",
      applicationType: "FULLSTACK_WEB_APPLICATION" as any,
      requiredFeatures: [
        "digital-menu",
        "shopping-cart",
        "reservations",
        "order-fulfillment",
        "inventory-management"
      ],
      requiredRoutes: [
        "browse-menu-and-customize-items",
        "checkout-and-secure-payment",
        "book-table-real-time-availability",
        "chef-fulfill-order-sequence",
        "admin-manage-inventory-stock"
      ],
      requiredModels: [
        "MenuCategory",
        "MenuItem",
        "Cart",
        "CartItem",
        "Order",
        "Reservation",
        "Table",
        "InventoryItem",
        "User"
      ],
      frontend: { framework: "React-Vite", provenance: "default" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      requiredLibraries: ["@tanstack/react-query", "react-router-dom", "axios", "@prisma/client"]
    };

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "restaurant-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0",
        axios: "^1.6.0",
        "@prisma/client": "^5.0.0"
      }
    }, null, 2), "utf8");

    // 1. Run generic DeterministicProjectFixer
    DeterministicProjectFixer.fixProject(testDir, restaurantContract);

    // 2. Run FastDeterministicSanitizer
    FastDeterministicSanitizer.sanitizeProject(testDir, restaurantContract as any);

    // ── Check 1: Feature appears in navigation (Layout.tsx) ──────────────────
    const layoutPath = join(testDir, "src", "shared", "components", "Layout.tsx");
    expect(existsSync(layoutPath)).toBe(true);
    const layoutContent = readFileSync(layoutPath, "utf8");
    expect(layoutContent).toContain("Dashboard");
    expect(layoutContent).toMatch(/Menu|Digital Menu|Items/i);
    expect(layoutContent).toMatch(/Reservations/i);
    expect(layoutContent).toMatch(/Orders|Cart|Fulfillment/i);

    // ── Check 2: Correct React route in routes.tsx ──────────────────────────
    const routesPath = join(testDir, "src", "routes.tsx");
    expect(existsSync(routesPath)).toBe(true);
    const routesContent = readFileSync(routesPath, "utf8");
    expect(routesContent).toContain('path="/"');
    expect(routesContent).toMatch(/path="\/digital-menu"|path="\/menu"/);
    expect(routesContent).toMatch(/path="\/reservations"/);
    expect(routesContent).toMatch(/path="\/orders"|path="\/shopping-cart"/);

    // ── Check 3: Route renders real feature page component ──────────────────
    expect(routesContent).toMatch(/<Route\s+path="[^"]*menu[^"]*"\s+element={<(DigitalMenuPage|MenuPage|MenuItemsPage)/i);
    const pagesDir = join(testDir, "src", "pages");
    const pageFiles = existsSync(pagesDir) ? [
      existsSync(join(pagesDir, "DigitalMenuPage.tsx")),
      existsSync(join(pagesDir, "MenuPage.tsx")),
      existsSync(join(pagesDir, "MenuItemsPage.tsx")),
      existsSync(join(pagesDir, "ReservationsPage.tsx")),
    ] : [];
    expect(pageFiles.some(f => f)).toBe(true);

    // ── Check 4: Page contains real backend API connection ──────────────────
    const menuPageFile = existsSync(join(pagesDir, "DigitalMenuPage.tsx"))
      ? join(pagesDir, "DigitalMenuPage.tsx")
      : existsSync(join(pagesDir, "MenuPage.tsx"))
      ? join(pagesDir, "MenuPage.tsx")
      : join(pagesDir, "MenuItemsPage.tsx");
    
    expect(existsSync(menuPageFile)).toBe(true);
    const menuPageContent = readFileSync(menuPageFile, "utf8");
    expect(menuPageContent).toContain('import api from "../services/api"');
    expect(menuPageContent).toContain('api.get(');
    expect(menuPageContent).toContain('api.post(');

    // ── Check 5: API client reaches backend endpoints ───────────────────────
    const apiPath = join(testDir, "src", "services", "api.ts");
    expect(existsSync(apiPath)).toBe(true);
    const apiContent = readFileSync(apiPath, "utf8");
    expect(apiContent).toContain("apiClient.get");
    expect(apiContent).toContain("apiClient.post");

    // ── Check 6: Backend controller uses Prisma ─────────────────────────────
    const controllerDir = join(testDir, "server", "controllers");
    expect(existsSync(controllerDir)).toBe(true);
    const controllers = [
      existsSync(join(controllerDir, "digital-menu.controller.ts")),
      existsSync(join(controllerDir, "menu.controller.ts")),
      existsSync(join(controllerDir, "menuitems.controller.ts")),
      existsSync(join(controllerDir, "reservations.controller.ts")),
    ];
    expect(controllers.some(c => c)).toBe(true);

    const controllerSample = existsSync(join(controllerDir, "digital-menu.controller.ts"))
      ? join(controllerDir, "digital-menu.controller.ts")
      : existsSync(join(controllerDir, "menu.controller.ts"))
      ? join(controllerDir, "menu.controller.ts")
      : existsSync(join(controllerDir, "reservations.controller.ts"))
      ? join(controllerDir, "reservations.controller.ts")
      : join(controllerDir, "menuitems.controller.ts");
    
    const ctrlContent = readFileSync(controllerSample, "utf8");
    expect(ctrlContent).toContain('import { prisma } from "../lib/prisma"');
    expect(ctrlContent).toContain('prisma');

    // ── Check 7: Operation can persist data (POST handler with Prisma) ──────
    expect(ctrlContent).toContain('export const create =');
    expect(ctrlContent).toContain('.create(');

    // ── Check 8: No wildcard fallback intercepts legitimate routes ───────────
    expect(routesContent).toContain('Route path="*" element={<Navigate to="/" replace />}');
    // Ensure wildcard is after all feature routes
    const wildcardPos = routesContent.indexOf('Route path="*"');
    const menuRoutePos = routesContent.search(/Route path="[^"]*menu/);
    expect(menuRoutePos).toBeGreaterThan(-1);
    expect(wildcardPos).toBeGreaterThan(menuRoutePos);

    // ── Check 9: Prisma schema has all required domain models ───────────────
    const prismaPath = join(testDir, "prisma", "schema.prisma");
    expect(existsSync(prismaPath)).toBe(true);
    const prismaContent = readFileSync(prismaPath, "utf8");
    expect(prismaContent).toContain("model MenuItem");
    expect(prismaContent).toContain("model Order");
    expect(prismaContent).toContain("model Reservation");
  });

  it("Domain 2 (Bicycle Fleet & Rentals): Arbitrary second domain derives distinct routes, pages and models from its contract", () => {
    const bikeContract: Partial<ArchitectureContractV1> = {
      version: 1,
      status: "locked",
      prompt: "Build a tourist bicycle fleet rental and maintenance tracking system with real-time station availability, reservations, and mechanic service dispatch.",
      applicationType: "FULLSTACK_WEB_APPLICATION" as any,
      requiredFeatures: [
        "fleet-tracking",
        "station-availability",
        "bike-rentals",
        "mechanic-maintenance"
      ],
      requiredRoutes: [
        "browse-available-bicycles",
        "reserve-bike-at-station",
        "active-rental-checkout",
        "dispatch-mechanic-repair"
      ],
      requiredModels: [
        "Bicycle",
        "Station",
        "Rental",
        "MaintenanceLog",
        "User"
      ],
      frontend: { framework: "React-Vite", provenance: "default" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      requiredLibraries: ["@tanstack/react-query", "react-router-dom", "axios", "@prisma/client"]
    };

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "velo-fleet-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0",
        axios: "^1.6.0",
        "@prisma/client": "^5.0.0"
      }
    }, null, 2), "utf8");

    DeterministicProjectFixer.fixProject(testDir, bikeContract);
    FastDeterministicSanitizer.sanitizeProject(testDir, bikeContract as any);

    // 1. Navigation items must be bicycle specific, NOT restaurant specific
    const layoutContent = readFileSync(join(testDir, "src", "shared", "components", "Layout.tsx"), "utf8");
    expect(layoutContent).not.toMatch(/Menu|MenuItem|Dining|Chef|Bistro/i);
    expect(layoutContent).toMatch(/Fleet|Station|Bicycle|Rental|Maintenance/i);

    // 2. Routes must be bicycle specific
    const routesContent = readFileSync(join(testDir, "src", "routes.tsx"), "utf8");
    expect(routesContent).toMatch(/fleet|station|rental|bicycle|maintenance/i);
    expect(routesContent).not.toContain("MenuPage");

    // 3. Prisma schema must contain Bicycle and Station models
    const prismaContent = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");
    expect(prismaContent).toContain("model Bicycle");
    expect(prismaContent).toContain("model Station");
    expect(prismaContent).toContain("model Rental");
    expect(prismaContent).not.toContain("model MenuItem");
  });
});
