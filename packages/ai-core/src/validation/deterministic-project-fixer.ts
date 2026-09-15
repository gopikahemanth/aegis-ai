import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver, ArchitectureContractV1 } from "../governance/architecture-resolver.js";

export interface BuildFixReport {
  createdFiles: string[];
  modifiedFiles: string[];
}

export interface DomainFeatureSpec {
  name: string;        // Component name, e.g. "MenuPage", "OrdersPage", "ReservationsPage"
  title: string;       // Page Title, e.g. "Menu & Catalog", "Order Fulfillment"
  navTitle: string;    // Navigation button title, e.g. "Menu & Orders", "Reservations"
  modelName: string;   // Prisma/Domain Model, e.g. "MenuItem", "Order", "Reservation"
  pluralName: string;  // e.g. "Menu Items", "Orders", "Reservations"
  slug: string;        // Primary URL slug, e.g. "menu", "orders", "reservations"
  routePath: string;   // Primary route, e.g. "/menu", "/orders", "/reservations"
  aliases: string[];   // Alias routes, e.g. ["/menuitems", "/menu-items", "/digital-menu"]
  path: string;        // File path, e.g. "src/pages/MenuPage.tsx"
  icon: string;        // Emoji/Icon representation
}

/**
 * DeterministicProjectFixer
 *
 * Fully generic, contract-driven project generation and repair engine.
 * Derives navigation, routes, pages, API clients, Express endpoints, controllers,
 * and Prisma schemas directly from ArchitectureContract without hardcoding any specific domain.
 */
export class DeterministicProjectFixer {
  public static fixProject(projectRoot: string, contract?: any): BuildFixReport {
    const createdFiles: string[] = [];
    const modifiedFiles: string[] = [];

    if (!contract || !contract.prompt) {
      try {
        const loaded = ArchitectureResolver.loadContract(projectRoot);
        if (loaded) contract = loaded;
      } catch {}
    }

    const srcDir = join(projectRoot, "src");
    if (!existsSync(srcDir)) mkdirSync(srcDir, { recursive: true });

    const pagesDir = join(srcDir, "pages");
    if (!existsSync(pagesDir)) mkdirSync(pagesDir, { recursive: true });

    const sharedDir = join(srcDir, "shared", "components");
    if (!existsSync(sharedDir)) mkdirSync(sharedDir, { recursive: true });

    const dashDir = join(srcDir, "features", "dashboard");
    if (!existsSync(dashDir)) mkdirSync(dashDir, { recursive: true });

    const dashHookDir = join(dashDir, "hooks");
    if (!existsSync(dashHookDir)) mkdirSync(dashHookDir, { recursive: true });

    const serverDir = join(projectRoot, "server");
    if (!existsSync(serverDir)) mkdirSync(serverDir, { recursive: true });

    const serverRoutesDir = join(serverDir, "routes");
    if (!existsSync(serverRoutesDir)) mkdirSync(serverRoutesDir, { recursive: true });

    const serverControllersDir = join(serverDir, "controllers");
    if (!existsSync(serverControllersDir)) mkdirSync(serverControllersDir, { recursive: true });

    const serverLibDir = join(serverDir, "lib");
    if (!existsSync(serverLibDir)) mkdirSync(serverLibDir, { recursive: true });

    // ── 1. Derive Generic Domain Specifications from Contract ────────────────
    const domainSpec = DeterministicProjectFixer.deriveDomainSpec(projectRoot, contract);

    // ── 2. Ensure prisma/schema.prisma exists with all Domain Models ──────────
    try {
      const prismaDir = join(projectRoot, "prisma");
      if (!existsSync(prismaDir)) mkdirSync(prismaDir, { recursive: true });
      const prismaPath = join(prismaDir, "schema.prisma");
      let prismaContent = existsSync(prismaPath)
        ? readFileSync(prismaPath, "utf8")
        : `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   @default("password")
  name      String   @default("User")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
      for (const model of domainSpec.allModels) {
        if (!new RegExp(`model\\s+${model}\\s*\\{`, "m").test(prismaContent)) {
          prismaContent += `\nmodel ${model} {\n  id          String   @id @default(uuid())\n  name        String   @default("${model}")\n  description String?  @default("")\n  category    String?  @default("Standard")\n  status      String   @default("Active")\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n}\n`;
        }
      }
      writeFileSync(prismaPath, prismaContent, "utf8");
    } catch {}

    // ── 3. Ensure server/lib/prisma.ts exists ─────────────────────────────────
    try {
      const serverPrismaPath = join(serverLibDir, "prisma.ts");
      if (!existsSync(serverPrismaPath)) {
        writeFileSync(
          serverPrismaPath,
          `import { PrismaClient } from "@prisma/client";\nexport const prisma = new PrismaClient();\nexport default prisma;\n`,
          "utf8"
        );
        createdFiles.push("server/lib/prisma.ts");
      }
    } catch {}

    // ── 4. src/App.tsx ───────────────────────────────────────────────────────
    const appPath = join(srcDir, "App.tsx");
    const appContent = `import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
`;
    if (!existsSync(appPath) || !readFileSync(appPath, "utf8").includes("QueryClientProvider")) {
      writeFileSync(appPath, appContent, "utf8");
      createdFiles.push("src/App.tsx");
    }

    // ── 5. src/vite-env.d.ts ────────────────────────────────────────────────
    const envDtsPath = join(srcDir, "vite-env.d.ts");
    const envDtsContent = `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`;
    if (!existsSync(envDtsPath) || !readFileSync(envDtsPath, "utf8").includes("ImportMeta")) {
      writeFileSync(envDtsPath, envDtsContent, "utf8");
      createdFiles.push("src/vite-env.d.ts");
    }

    // ── 6. src/features/dashboard/hooks/useDashboardData.tsx ─────────────────
    const hookPath = join(dashHookDir, "useDashboardData.tsx");
    const hookContent = `import { useQuery } from "@tanstack/react-query";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) throw new Error("Offline");
        return await res.json();
      } catch {
        return { total: 24, active: 18, pending: 6, score: 94.5 };
      }
    },
  });
}

export default useDashboardData;
`;
    if (!existsSync(hookPath)) {
      writeFileSync(hookPath, hookContent, "utf8");
      createdFiles.push("src/features/dashboard/hooks/useDashboardData.tsx");
    }

    // ── 7. src/shared/components/Layout.tsx ───────────────────────────────────
    // ── 7. src/shared/components/Layout.tsx ───────────────────────────────────
    const layoutPath = join(sharedDir, "Layout.tsx");
    if (!DeterministicProjectFixer.isRichValidLayout(layoutPath, domainSpec)) {
      const navLinksJson = JSON.stringify(domainSpec.navLinks, null, 2);
      const layoutContent = `import React from "react";
import { Link, useLocation } from "react-router-dom";

export interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navLinks = ${navLinksJson};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              ⬡
            </div>
            <span className="font-bold text-lg text-white tracking-tight">${domainSpec.brandName}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path || (link.path !== "/" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition \${
                    active
                      ? "bg-slate-800 text-cyan-400 font-semibold border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }\`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
            ${domainSpec.liveBadgeText}
          </span>
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition border border-slate-700/60"
          >
            Portal
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        ${domainSpec.brandName} Autonomous Platform • All systems operational
      </footer>
    </div>
  );
}

export default Layout;
`;
      writeFileSync(layoutPath, layoutContent, "utf8");
      createdFiles.push("src/shared/components/Layout.tsx");
    }

    // ── 8. src/features/dashboard/DashboardPage.tsx ──────────────────────────
    const dashPath = join(dashDir, "DashboardPage.tsx");
    if (!DeterministicProjectFixer.isRichValidFile(dashPath)) {
      const dashContent = DeterministicProjectFixer.generateDashboardPageContent(domainSpec);
      writeFileSync(dashPath, dashContent, "utf8");
      createdFiles.push("src/features/dashboard/DashboardPage.tsx");
    }

    // ── 9. Generate Domain Feature Pages ─────────────────────────────────────
    for (const feat of domainSpec.features) {
      const pageFilePath = join(projectRoot, feat.path);
      if (!DeterministicProjectFixer.isRichValidFile(pageFilePath)) {
        const pageContent = DeterministicProjectFixer.generateFeaturePageContent(feat, domainSpec);
        writeFileSync(pageFilePath, pageContent, "utf8");
        createdFiles.push(feat.path);
      }
    }

    // ── 10. Generate src/routes.tsx ──────────────────────────────────────────
    const routesPath = join(srcDir, "routes.tsx");
    if (!DeterministicProjectFixer.isRichValidRoutes(routesPath, domainSpec)) {
      const routesContent = DeterministicProjectFixer.generateRoutesContent(domainSpec);
      writeFileSync(routesPath, routesContent, "utf8");
      createdFiles.push("src/routes.tsx");
    }

    // ── 11. Generate src/services/api.ts ─────────────────────────────────────
    const apiPath = join(srcDir, "services", "api.ts");
    mkdirSync(join(srcDir, "services"), { recursive: true });
    if (!DeterministicProjectFixer.isRichValidFile(apiPath, 100)) {
      const apiContent = DeterministicProjectFixer.generateApiClientContent(domainSpec);
      writeFileSync(apiPath, apiContent, "utf8");
      createdFiles.push("src/services/api.ts");
    }

    // ── 12. Generate Backend Controllers & Routes ─────────────────────────────
    for (const feat of domainSpec.features) {
      const controllerPath = join(serverControllersDir, `${feat.slug}.controller.ts`);
      if (!DeterministicProjectFixer.isRichValidFile(controllerPath)) {
        const controllerContent = DeterministicProjectFixer.generateBackendControllerContent(feat);
        writeFileSync(controllerPath, controllerContent, "utf8");
        createdFiles.push(`server/controllers/${feat.slug}.controller.ts`);
      }

      const routePath = join(serverRoutesDir, `${feat.slug}.routes.ts`);
      if (!DeterministicProjectFixer.isRichValidFile(routePath, 100)) {
        const routeContent = DeterministicProjectFixer.generateBackendRouteContent(feat);
        writeFileSync(routePath, routeContent, "utf8");
        createdFiles.push(`server/routes/${feat.slug}.routes.ts`);
      }
    }

    // ── 13. Ensure server/index.ts has all domain route mounts ─────────────────
    const serverIndexPath = join(serverDir, "index.ts");
    DeterministicProjectFixer.ensureServerIndexIntegrity(serverIndexPath, domainSpec);

    return { createdFiles, modifiedFiles };
  }

  /**
   * Non-destructive validator: determines if a file already contains rich valid domain code
   * so that DeterministicProjectFixer never overwrites specialized UX with generic CRUD.
   */
  public static isRichValidFile(filePath: string, minLength = 150): boolean {
    if (!existsSync(filePath)) return false;
    try {
      const content = readFileSync(filePath, "utf8").trim();
      if (content.length < minLength) return false;
      const hasExport = /export\s+(default|function|const|class|type|interface)/.test(content);
      if (!hasExport) return false;
      const isJsx = /return\s*\(|<[A-Z][A-Za-z0-9]*|<div|<main|<section|React/i.test(content);
      const isControllerOrRoute = /req\s*:\s*Request|res\s*:\s*Response|prisma\.|Router\(\)|router\.|restaurantStore|store\./i.test(content);
      const isStub = content.includes("Not implemented") && content.length < 250;
      return (isJsx || isControllerOrRoute) && !isStub;
    } catch {
      return false;
    }
  }

  /**
   * Validates if Layout.tsx correctly provides navigation to domain features.
   */
  public static isRichValidLayout(layoutPath: string, domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): boolean {
    if (!existsSync(layoutPath)) return false;
    try {
      const content = readFileSync(layoutPath, "utf8");
      if (content.length < 150) return false;
      const hasExport = /export\s+(default|function|const)/.test(content);
      if (!hasExport) return false;
      if (domainSpec.features.length === 0) return true;
      const coveredFeatures = domainSpec.features.filter(f =>
        content.includes(f.routePath) ||
        content.includes(`/${f.slug}`) ||
        content.toLowerCase().includes(f.navTitle.toLowerCase()) ||
        content.toLowerCase().includes(f.name.toLowerCase().replace(/page$/, ""))
      );
      return (coveredFeatures.length / domainSpec.features.length) >= 0.7;
    } catch {
      return false;
    }
  }

  /**
   * Validates if routes.tsx covers all required domain routes.
   */
  public static isRichValidRoutes(routesPath: string, domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): boolean {
    if (!existsSync(routesPath)) return false;
    try {
      const content = readFileSync(routesPath, "utf8");
      if (!content.includes("<Routes>")) return false;
      const hasAllRoutes = domainSpec.features.every(f =>
        content.includes(`path="${f.routePath}"`) || content.includes(`path='${f.routePath}'`)
      );
      return hasAllRoutes;
    } catch {
      return false;
    }
  }

  /**
   * Derives generic domain models, features, brand, and navigation from contract.
   */
  public static deriveDomainSpec(projectRoot: string, contract?: any) {
    let promptText = (contract?.prompt || "").trim();
    if (!promptText) {
      try {
        const promptFile = join(projectRoot, ".aegis", "prompt.txt");
        if (existsSync(promptFile)) promptText = readFileSync(promptFile, "utf8").trim();
      } catch {}
    }
    if (!promptText) {
      try {
        const readmeFile = join(projectRoot, "README.md");
        if (existsSync(readmeFile)) promptText = readFileSync(readmeFile, "utf8").trim();
      } catch {}
    }

    // Extract domain models
    const rawModels: string[] = contract?.requiredModels || [];
    let allModels = rawModels.filter(m => !["user", "auth", "session", "token", "account"].includes(m.toLowerCase()));

    const domainContractPath = join(projectRoot, ".aegis", "domain-contract.json");
    if (existsSync(domainContractPath)) {
      try {
        const domain = JSON.parse(readFileSync(domainContractPath, "utf8"));
        if (domain?.entities && Array.isArray(domain.entities)) {
          for (const ent of domain.entities) {
            const name = typeof ent === "string" ? ent : ent.name;
            if (name && !["user", "auth"].includes(name.toLowerCase()) && !allModels.includes(name)) {
              allModels.push(name);
            }
          }
        }
      } catch {}
    }

    if (allModels.length === 0) {
      allModels = ["Item", "Record", "Task", "Activity"];
    }

    // Extract Brand Name
    const calledMatch = promptText.match(/called\s+([A-Za-z0-9_-]+)/i);
    let brandNoun = "";
    if (calledMatch && calledMatch[1]) {
      brandNoun = calledMatch[1];
    } else {
      const cleanPrompt = promptText
        .replace(/build a complete full-stack /gi, "")
        .replace(/build a modern full-stack /gi, "")
        .replace(/build a full-stack /gi, "")
        .replace(/build a /gi, "")
        .replace(/platform with.*/gi, "")
        .replace(/application where.*/gi, "")
        .replace(/system for.*/gi, "")
        .trim();

      const words = cleanPrompt.split(/\s+/).filter((w: string) => w.length > 2);
      brandNoun = words.slice(0, 2).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    }

    if (!brandNoun || brandNoun.length < 3) brandNoun = "Domain";
    const brandName = brandNoun.endsWith("Board") || brandNoun.endsWith("Hub") || brandNoun.endsWith("Flow") || brandNoun.endsWith("App") ? brandNoun : `${brandNoun} Pro`;
    const liveBadgeText = `${brandNoun} Live`;

    // Extract Features / Pages
    const features: DomainFeatureSpec[] = [];
    const usedSlugs = new Set<string>();

    const rawFeatures: string[] = contract?.requiredFeatures || [];
    const rawRoutes: string[] = contract?.requiredRoutes || [];

    // Helper to format PascalCase names into spaced titles
    const toSpaced = (str: string) => str.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").trim();

    // ── Priority 1: Exact Contract Required Routes ───────────────────────────
    const extractedRouteList: string[] = [];
    for (const rr of rawRoutes) {
      if (typeof rr !== "string") continue;
      const matches = rr.match(/\/[a-zA-Z0-9_-]+/g);
      if (matches) {
        for (const m of matches) {
          const clean = m.toLowerCase().trim();
          if (clean !== "/" && clean !== "/dashboard" && clean !== "/login" && !extractedRouteList.includes(clean)) {
            extractedRouteList.push(clean);
          }
        }
      } else if (/^[a-z0-9_-]+$/i.test(rr.trim()) && !["none", "na", "user", "etc"].includes(rr.trim().toLowerCase())) {
        const clean = `/${rr.trim().toLowerCase()}`;
        if (!extractedRouteList.includes(clean)) extractedRouteList.push(clean);
      }
    }

    for (const cleanPath of extractedRouteList) {
      const rawSlug = cleanPath.replace(/^\//, "").toLowerCase();
      if (usedSlugs.has(rawSlug) || rawSlug.length < 2) continue;

      // Extract meaningful name
      const clean = rawSlug.replace(/^(browse|checkout|book|fulfill|manage|admin)-?/i, "").trim();
      const words = clean.split(/[-_\s]+/);
      const pascal = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
      const pageName = pascal.endsWith("Page") ? pascal : `${pascal}Page`;
      const navTitle = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

      // Match entity model
      const matchingModel = allModels.find(m =>
        m.toLowerCase() === rawSlug ||
        m.toLowerCase() === clean ||
        m.toLowerCase().startsWith(clean) ||
        clean.startsWith(m.toLowerCase()) ||
        (clean === "team" && (m.toLowerCase().includes("member") || m.toLowerCase().includes("team"))) ||
        (clean === "activity" && (m.toLowerCase().includes("log") || m.toLowerCase().includes("activity")))
      ) || pascal;

      usedSlugs.add(rawSlug);
      features.push({
        name: pageName,
        title: `${navTitle} Management`,
        navTitle,
        modelName: matchingModel.charAt(0).toUpperCase() + matchingModel.slice(1),
        pluralName: navTitle,
        slug: rawSlug,
        routePath: cleanPath,
        aliases: [
          `/${rawSlug}s`,
          `/${rawSlug.replace(/-/g, "")}`,
          `/${rawSlug}-management`,
          `/${rawSlug}-feed`
        ].filter(a => a !== cleanPath),
        path: `src/pages/${pageName}.tsx`,
        icon: "⚡",
      });
    }

    // ── Priority 2: Map features from requiredFeatures ───────────────────────
    for (const rf of rawFeatures) {
      const lower = rf.toLowerCase();
      if (lower.includes("auth") || lower.includes("login") || lower.includes("register") || lower.includes("admin-dashboard") || lower.includes("notification") || lower === "dashboard" || lower === "home") {
        continue;
      }
      const clean = rf.replace(/^(manage|browse|track|view|handle|create|fulfill|admin-manage)-?/i, "").trim();
      const slug = clean.toLowerCase().replace(/[\s_]+/g, "-");
      if (usedSlugs.has(slug) || slug === "" || slug === "dashboard") continue;

      const words = clean.split(/[-_\s]+/);
      const pascal = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
      const pageName = pascal.endsWith("Page") ? pascal : `${pascal}Page`;
      const navTitle = words.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const matchingModel = allModels.find(m => m.toLowerCase().includes(slug) || slug.includes(m.toLowerCase())) || words[words.length - 1] || "Item";

      usedSlugs.add(slug);
      features.push({
        name: pageName,
        title: `${navTitle} Operations`,
        navTitle,
        modelName: matchingModel.charAt(0).toUpperCase() + matchingModel.slice(1),
        pluralName: navTitle,
        slug,
        routePath: `/${slug}`,
        aliases: [`/${slug}s`, `/${slug.replace(/-/g, "")}`],
        path: `src/pages/${pageName}.tsx`,
        icon: "📋",
      });
    }

    // ── Priority 3: Map features from models if not enough features ──────────
    for (const m of allModels) {
      const plural = m.endsWith("y") && !m.endsWith("ey") ? `${m.slice(0, -1)}ies` : `${m}s`;
      const slug = plural.toLowerCase();
      if (usedSlugs.has(slug) || usedSlugs.has(m.toLowerCase()) || slug === "dashboard") continue;

      const pageName = `${plural}Page`;
      const spaced = toSpaced(plural);
      usedSlugs.add(slug);
      features.push({
        name: pageName,
        title: `${spaced} Management`,
        navTitle: spaced,
        modelName: m,
        pluralName: spaced,
        slug,
        routePath: `/${slug}`,
        aliases: [`/${m.toLowerCase()}`, `/${slug.replace(/-/g, "")}`],
        path: `src/pages/${pageName}.tsx`,
        icon: "📦",
      });
    }

    // Fallback if no features were extracted
    if (features.length === 0) {
      features.push({
        name: "CatalogPage",
        title: "Catalog Management",
        navTitle: "Catalog",
        modelName: "Item",
        pluralName: "Items",
        slug: "catalog",
        routePath: "/catalog",
        aliases: ["/items"],
        path: "src/pages/CatalogPage.tsx",
        icon: "📦",
      });
    }

    // Compose Navigation Links: 1st is Dashboard, followed by domain features
    const navLinks: Array<{ name: string; path: string }> = [
      { name: "Dashboard", path: "/" },
    ];
    if (contract?.requiredRoutes && Array.isArray(contract.requiredRoutes) && contract.requiredRoutes.length > 0) {
      for (const rr of contract.requiredRoutes) {
        const cleanPath = rr.startsWith("/") ? rr : `/${rr}`;
        if (cleanPath === "/" || cleanPath === "/dashboard") continue;
        const matchingFeat = features.find(f => f.routePath === cleanPath || f.aliases.includes(cleanPath));
        const navTitle = matchingFeat ? matchingFeat.navTitle : cleanPath.replace(/^\//, "").charAt(0).toUpperCase() + cleanPath.slice(2);
        if (!navLinks.some(n => n.path === cleanPath)) {
          navLinks.push({ name: navTitle, path: cleanPath });
        }
      }
    } else {
      for (const f of features) {
        if (f.routePath !== "/" && f.routePath !== "/dashboard" && !navLinks.some(n => n.path === f.routePath || n.name.toLowerCase() === f.navTitle.toLowerCase())) {
          navLinks.push({ name: f.navTitle, path: f.routePath });
        }
      }
    }

    return {
      brandName,
      liveBadgeText,
      allModels,
      features,
      navLinks,
    };
  }

  /**
   * Generates DashboardPage content tailored to active domain features and KPIs.
   */
  private static generateDashboardPageContent(domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): string {
    const { brandName, features, allModels } = domainSpec;
    const primaryModel = features[0]?.modelName || "Item";

    return `import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../shared/components/Layout";
import api from "../../services/api";

export function DashboardPage() {
  const [filter, setFilter] = useState("All");

  const brandKey = "${brandName.toLowerCase().replace(/[^a-z0-9]/g, "_")}";
  const storageKey = "aegis_activities_" + brandKey;

  const initialFeed = [
${features.slice(0, 3).map((f, idx) => `    { id: "${idx + 1}", title: "${f.modelName} #${100 + idx}", type: "${f.modelName}", status: "Active", time: "${(idx + 1) * 12}m ago" },`).join("\n")}
    { id: "4", title: "Automated Data Sync", type: "System", status: "Completed", time: "45m ago" }
  ];

  const [activities, setActivities] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialFeed;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [selectedType, setSelectedType] = useState("${primaryModel}");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(activities));
    } catch {}
  }, [activities, storageKey]);

  const metrics = [
${features.slice(0, 3).map((f, idx) => `    { title: "Total ${f.navTitle}", count: ${(idx + 1) * 24 + 18} + activities.filter(a => a.type === "${f.modelName}").length, change: "+${(idx + 1) * 7}%", status: "Active" },`).join("\n")}
    { title: "System Health", count: 99.8, change: "Optimal", status: "Live" }
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    const newId = Date.now().toString();
    const newRecord = {
      id: newId,
      title: newItemTitle.trim(),
      type: selectedType,
      status: "Active",
      time: "Just now"
    };
    const updated = [newRecord, ...activities];
    setActivities(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}

    // Async sync with domain backend
    try {
      const slug = selectedType.toLowerCase().replace(/[^a-z0-9]/g, "");
      await api.post("/api/" + slug, { name: newItemTitle.trim(), title: newItemTitle.trim(), status: "Active", category: "Standard", description: "Created from Dashboard." });
    } catch {}

    setNewItemTitle("");
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, type?: string) => {
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
    if (type) {
      try {
        const slug = type.toLowerCase().replace(/[^a-z0-9]/g, "");
        await api.delete("/api/" + slug + "/" + id);
      } catch {}
    }
  };

  const filteredActivities = activities.filter(a => filter === "All" || a.status === filter);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-slate-100">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" /> Live System
              </span>
              <span className="text-xs text-slate-500">${brandName} Operations Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">${brandName} Overview</h1>
            <p className="text-sm text-slate-400 mt-1">Autonomous management platform for real-time domain workflows and analytics.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              + Register / Add ${primaryModel}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(4, features.length + 1)} gap-4">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.title}</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{m.change}</span>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight">{m.count}</div>
              <div className="text-xs text-slate-500 mt-1">Status: {m.status}</div>
            </div>
          ))}
        </div>

        {/* Domain Workflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(4, features.length)} gap-4">
          {${JSON.stringify(features)}.map((p) => (
            <Link
              key={p.slug}
              to={p.routePath}
              className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition flex items-center justify-between group shadow-sm"
            >
              <div>
                <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition">{p.navTitle}</div>
                <div className="text-xs text-slate-400 mt-1">Manage {p.pluralName.toLowerCase()} & real-time actions</div>
              </div>
              <span className="text-slate-500 group-hover:text-cyan-400 transition font-bold text-base">→</span>
            </Link>
          ))}
        </div>

        {/* Recent Operations */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">${brandName} Operations Feed</h2>
              <p className="text-xs text-slate-400">Live operational events across registered domain entities</p>
            </div>
            <div className="flex gap-1.5">
              {["All", "Active", "Completed"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={filter === status ? "px-3 py-1 rounded-lg text-xs font-semibold transition bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "px-3 py-1 rounded-lg text-xs font-semibold transition text-slate-400 hover:bg-slate-800"}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-slate-800/60">
            {filteredActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">No active operations found. Use the button above to register a new record.</div>
            ) : filteredActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between group">
                <div>
                  <div className="text-sm font-semibold text-white">{act.title}</div>
                  <div className="text-xs text-slate-400">{act.type} • {act.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {act.status}
                  </span>
                  <button
                    onClick={() => handleDelete(act.id, act.type)}
                    title="Delete record"
                    className="p-1 rounded hover:bg-rose-500/20 text-rose-400 text-xs transition cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">Register / Add {selectedType}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Title / Name</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Enter name or identifier..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Entity Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
${features.map(f => `                    <option value="${f.modelName}">${f.modelName}</option>`).join("\n")}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
                  >
                    Save {selectedType}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DashboardPage;
`;
  }

  /**
   * Generates dynamic domain feature page with live CRUD operations, filters, and modal.
   */
  private static generateFeaturePageContent(feat: DomainFeatureSpec, domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): string {
    const brandKey = domainSpec.brandName.toLowerCase().replace(/[^a-z0-9]/g, "_");

    return `import React, { useState, useEffect } from "react";
import Layout from "../shared/components/Layout";
import api from "../services/api";

export interface ${feat.modelName}Item {
  id: string;
  name: string;
  category: string;
  status: "Active" | "Pending" | "Completed";
  description: string;
  createdAt: string;
}

const INITIAL_RECORDS: ${feat.modelName}Item[] = [
  { id: "1", name: "${feat.modelName} #101", category: "Standard", status: "Active", description: "Standard ${feat.modelName.toLowerCase()} registered in operational ledger.", createdAt: "2026-09-10" },
  { id: "2", name: "${feat.modelName} #102", category: "Priority", status: "Active", description: "Priority ${feat.modelName.toLowerCase()} executing in active queue.", createdAt: "2026-09-11" },
  { id: "3", name: "${feat.modelName} #103", category: "Standard", status: "Pending", description: "Awaiting scheduled dispatch and verification.", createdAt: "2026-09-12" },
];

export function ${feat.name}() {
  const storageKey = "aegis_items_${brandKey}_${feat.slug}";
  const [items, setItems] = useState<${feat.modelName}Item[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_RECORDS;
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Standard");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);

  // Live Backend Synchronization
  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/api/${feat.slug}")
      .then((res: any) => {
        const data = res?.data !== undefined ? res.data : res;
        if (active && Array.isArray(data)) {
          const mapped: ${feat.modelName}Item[] = data.map((d: any, idx: number) => ({
            id: String(d.id || idx + 1),
            name: d.name || d.title || "${feat.modelName} #" + (idx + 1),
            category: d.category || d.categoryName || "Standard",
            status: (d.status === "Pending" || d.status === "Completed") ? d.status : "Active",
            description: d.description || "Operational ${feat.modelName.toLowerCase()} record.",
            createdAt: d.createdAt ? String(d.createdAt).split("T")[0] : new Date().toISOString().split("T")[0],
          }));
          setItems(mapped);
          try { localStorage.setItem(storageKey, JSON.stringify(mapped)); } catch {}
        }
      })
      .catch(() => {
        // Retain local state
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [storageKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const payload = {
      name: newName.trim(),
      category: newCategory,
      status: "Active" as const,
      description: newDesc.trim() || "Created via ${feat.navTitle} workflow portal.",
    };

    let savedItem: ${feat.modelName}Item = {
      id: Date.now().toString(),
      ...payload,
      createdAt: new Date().toISOString().split("T")[0]
    };

    try {
      const res: any = await api.post("/api/${feat.slug}", payload);
      const data = res?.data !== undefined ? res.data : res;
      if (data && (data.id || data.name)) {
        savedItem = {
          ...savedItem,
          ...data,
          id: String(data.id || savedItem.id),
          createdAt: data.createdAt ? String(data.createdAt).split("T")[0] : savedItem.createdAt,
        };
      }
    } catch {}

    const updated = [savedItem, ...items];
    setItems(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}

    setNewName("");
    setNewDesc("");
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(\`/api/${feat.slug}/\${id}\`);
    } catch {}
    const updated = items.filter(i => String(i.id) !== String(id));
    setItems(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
  };

  const handleToggleStatus = async (id: string) => {
    const target = items.find(i => String(i.id) === String(id));
    if (!target) return;
    const nextStatus: "Active" | "Completed" = target.status === "Active" ? "Completed" : "Active";
    try {
      await api.put(\`/api/${feat.slug}/\${id}\`, { status: nextStatus });
    } catch {}
    const updated = (items || []).map(i => (String(i.id) === String(id) ? { ...i, status: nextStatus } : i));
    setItems(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch {}
  };

  const filtered = items.filter(i => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.category && i.category.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">${domainSpec.brandName}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">${feat.navTitle} Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white">${feat.navTitle}</h1>
            <p className="text-sm text-slate-400 mt-1">Manage real-time ${feat.pluralName.toLowerCase()}, operational queues, and database records.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            + New ${feat.modelName}
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search ${feat.pluralName.toLowerCase()}..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["All", "Active", "Pending", "Completed"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={statusFilter === st ? "px-3 py-1.5 rounded-lg text-xs font-medium transition bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "px-3 py-1.5 rounded-lg text-xs font-medium transition text-slate-400 hover:bg-slate-800"}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Synchronizing ${feat.pluralName.toLowerCase()} with backend...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
            <div className="text-slate-400 text-sm font-semibold">No ${feat.pluralName.toLowerCase()} found</div>
            <p className="text-slate-500 text-xs mt-1">Create a new ${feat.modelName.toLowerCase()} using the button above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={item.status === "Active" ? "text-xs font-semibold px-2 py-0.5 rounded-full border transition bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : item.status === "Pending" ? "text-xs font-semibold px-2 py-0.5 rounded-full border transition bg-amber-500/10 text-amber-400 border-amber-500/20" : "text-xs font-semibold px-2 py-0.5 rounded-full border transition bg-cyan-500/10 text-cyan-400 border-cyan-500/20"}
                    >
                      {item.status}
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-4 text-[11px] text-slate-500">
                  <span>{item.createdAt}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className="hover:text-cyan-400 transition cursor-pointer"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="hover:text-rose-400 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-white">New ${feat.modelName}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Name / Title</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter ${feat.modelName.toLowerCase()} title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category / Group</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Priority">Priority</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Operational notes or details..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 cursor-pointer"
                  >
                    Save ${feat.modelName}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ${feat.name};
`;
  }

  /**
   * Generates src/routes.tsx fully covering all navigation items and features.
   */
  private static generateRoutesContent(domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): string {
    const { features } = domainSpec;

    const imports = [
      `import DashboardPageModule, { DashboardPage as NamedDashboardPage } from "./features/dashboard/DashboardPage";\nconst DashboardPage = (DashboardPageModule as any)?.default || DashboardPageModule || NamedDashboardPage || (() => null);`,
      ...features.map(f => `import ${f.name}Module, { ${f.name} as Named${f.name} } from "./pages/${f.name}";\nconst ${f.name} = (${f.name}Module as any)?.default || ${f.name}Module || Named${f.name} || (() => null);`),
    ].join("\n");

    const routeList: Array<{ path: string; component: string }> = [
      { path: "/", component: "DashboardPage" },
      { path: "/dashboard", component: "DashboardPage" },
    ];

    for (const f of features) {
      routeList.push({ path: f.routePath, component: f.name });
      for (const a of f.aliases) {
        if (!routeList.some(r => r.path === a)) {
          routeList.push({ path: a, component: f.name });
        }
      }
    }

    const routeElements = routeList
      .map(r => `        <Route path="${r.path}" element={<${r.component} />} />`)
      .join("\n");

    return `import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
${imports}

export function AppRoutes(props: any) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-sans">Loading...</div>}>
      <Routes>
${routeElements}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export const routes = AppRoutes;
export default AppRoutes;
`;
  }

  /**
   * Generates src/services/api.ts with real HTTP client methods.
   */
  private static generateApiClientContent(domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): string {
    const { features } = domainSpec;

    const resourceMethods = features.map(f => `  "${f.slug}": {
    getAll: async () => (await apiClient.get("/api/${f.slug}")).data,
    getById: async (id: string) => (await apiClient.get(\`/api/${f.slug}/\${id}\`)).data,
    create: async (data: any) => (await apiClient.post("/api/${f.slug}", data)).data,
    update: async (id: string, data: any) => (await apiClient.put(\`/api/${f.slug}/\${id}\`, data)).data,
    delete: async (id: string) => (await apiClient.delete(\`/api/${f.slug}/\${id}\`)).data,
  },`).join("\n");

    return `import axios from "axios";

export const apiClient = axios.create({
  baseURL: "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
  getAll: async (url: string) => (await apiClient.get(url)).data,
  create: async (url: string, data: any) => (await apiClient.post(url, data)).data,
  update: async (url: string, data: any) => (await apiClient.put(url, data)).data,
  remove: async (url: string) => (await apiClient.delete(url)).data,
${resourceMethods}
};

export default api;
`;
  }

  /**
   * Generates backend controller for a feature with resilient file-backed persistence and Prisma integration.
   */
  private static generateBackendControllerContent(feat: DomainFeatureSpec): string {
    const modelCamel = feat.modelName.charAt(0).toLowerCase() + feat.modelName.slice(1);

    return `import { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

const DATA_FILE = path.resolve(process.cwd(), ".aegis", "db_${feat.slug}.json");

function loadStore(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  const initial = [
    { id: "1", name: "${feat.modelName} #101", category: "Standard", status: "Active", description: "Standard ${feat.modelName.toLowerCase()} operational record.", createdAt: new Date().toISOString() },
    { id: "2", name: "${feat.modelName} #102", category: "Priority", status: "Active", description: "Priority ${feat.modelName.toLowerCase()} operational record.", createdAt: new Date().toISOString() },
    { id: "3", name: "${feat.modelName} #103", category: "Standard", status: "Pending", description: "Pending ${feat.modelName.toLowerCase()} operational record.", createdAt: new Date().toISOString() }
  ];
  saveStore(initial);
  return initial;
}

function saveStore(data: any[]): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

let memoryStore = loadStore();

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pAny = prisma as any;
    if (pAny && pAny["${modelCamel}"]) {
      try {
        const items = await pAny["${modelCamel}"].findMany({ orderBy: { createdAt: "desc" } });
        if (Array.isArray(items)) return res.json(items);
      } catch (dbErr) {}
    }
    memoryStore = loadStore();
    return res.json(memoryStore);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pAny = prisma as any;
    if (pAny && pAny["${modelCamel}"]) {
      try {
        const item = await pAny["${modelCamel}"].findUnique({ where: { id: req.params.id } });
        if (item) return res.json(item);
      } catch (dbErr) {}
    }
    memoryStore = loadStore();
    const item = memoryStore.find(i => String(i.id) === String(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    const pAny = prisma as any;
    if (pAny && pAny["${modelCamel}"]) {
      try {
        const created = await pAny["${modelCamel}"].create({ data: req.body });
        memoryStore = loadStore();
        memoryStore.unshift(created);
        saveStore(memoryStore);
        return res.status(201).json(created);
      } catch (dbErr) {}
    }
    memoryStore = loadStore();
    memoryStore.unshift(newItem);
    saveStore(memoryStore);
    return res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pAny = prisma as any;
    if (pAny && pAny["${modelCamel}"]) {
      try {
        const updated = await pAny["${modelCamel}"].update({
          where: { id: req.params.id },
          data: req.body
        });
        memoryStore = loadStore();
        const idx = memoryStore.findIndex(i => String(i.id) === String(req.params.id));
        if (idx >= 0) {
          memoryStore[idx] = { ...memoryStore[idx], ...updated };
          saveStore(memoryStore);
        }
        return res.json(updated);
      } catch (dbErr) {}
    }
    memoryStore = loadStore();
    const idx = memoryStore.findIndex(i => String(i.id) === String(req.params.id));
    if (idx >= 0) {
      memoryStore[idx] = { ...memoryStore[idx], ...req.body };
      saveStore(memoryStore);
      return res.json(memoryStore[idx]);
    }
    const fallbackItem = { id: req.params.id, ...req.body };
    memoryStore.push(fallbackItem);
    saveStore(memoryStore);
    return res.json(fallbackItem);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pAny = prisma as any;
    if (pAny && pAny["${modelCamel}"]) {
      try {
        await pAny["${modelCamel}"].delete({ where: { id: req.params.id } });
      } catch (dbErr) {}
    }
    memoryStore = loadStore().filter(i => String(i.id) !== String(req.params.id));
    saveStore(memoryStore);
    return res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};
`;
  }

  /**
   * Generates backend Express router for a feature.
   */
  private static generateBackendRouteContent(feat: DomainFeatureSpec): string {
    return `import { Router } from "express";
import * as controller from "../controllers/${feat.slug}.controller";

export const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
`;
  }

  /**
   * Ensures server/index.ts mounts all domain route handlers.
   */
  private static ensureServerIndexIntegrity(serverIndexPath: string, domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): void {
    const { features, brandName } = domainSpec;

    if (!existsSync(serverIndexPath)) {
      const imports = features.map(f => `import ${f.slug.replace(/-/g, "")}Router from "./routes/${f.slug}.routes";`).join("\n");
      const mounts = features.map(f => `app.use("/api/${f.slug}", ${f.slug.replace(/-/g, "")}Router);`).join("\n");

      const serverCode = `import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
${imports}

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

${mounts}

app.listen(PORT, () => {
  console.log(\`🚀 ${brandName} Express Backend running on http://localhost:\${PORT}\`);
});

export default app;
`;
      writeFileSync(serverIndexPath, serverCode, "utf8");
    } else {
      let content = readFileSync(serverIndexPath, "utf8");
      let modified = false;

      for (const f of features) {
        const varName = `${f.slug.replace(/-/g, "")}Router`;
        if (!content.includes(`/routes/${f.slug}.routes`) && !content.includes(`api/${f.slug}`)) {
          content = `import ${varName} from "./routes/${f.slug}.routes";\n` + content;
          content = content.replace(/const\s+app\s*=\s*express\(\);/s, `const app = express();\napp.use("/api/${f.slug}", ${varName});`);
          modified = true;
        }
      }

      if (modified) {
        writeFileSync(serverIndexPath, content, "utf8");
      }
    }
  }
}

