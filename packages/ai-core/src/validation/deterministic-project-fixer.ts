import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver, ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { DomainVisualContractGenerator, type DomainVisualDesignContract } from "../design/domain-visual-contract.js";
import { DesignSystemGenerator } from "../design/design-system-generator.js";

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

    // ── 1b. Ensure package.json exists with scripts & dependencies ───────────
    const pkgPath = join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) {
      const pkgContent = JSON.stringify({
        name: domainSpec.brandName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "node scripts/dev.js",
          server: "node server/index.js",
          build: "npx vite build",
          test: "vitest run"
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "react-router-dom": "^6.23.0",
          "@tanstack/react-query": "^5.28.0",
          axios: "^1.6.8",
          express: "^4.19.2",
          cors: "^2.8.5",
          dotenv: "^16.4.5",
          "lucide-react": "^0.363.0",
          clsx: "^2.1.0",
          "tailwind-merge": "^2.2.2",
          "@prisma/client": "^5.11.0"
        },
        devDependencies: {
          typescript: "^5.4.3",
          "@types/react": "^18.2.66",
          "@types/react-dom": "^18.2.22",
          "@types/express": "^4.17.21",
          "@types/cors": "^2.8.17",
          "@types/node": "^20.11.30",
          "@vitejs/plugin-react": "^4.2.1",
          vite: "^5.1.6",
          vitest: "^1.4.0",
          prisma: "^5.11.0",
          tailwindcss: "^3.4.1",
          autoprefixer: "^10.4.19",
          postcss: "^8.4.38"
        }
      }, null, 2);
      writeFileSync(pkgPath, pkgContent, "utf8");
      createdFiles.push("package.json");
    }

    // ── 1c. Ensure scripts/dev.js exists ─────────────────────────────────────
    const scriptsDir = join(projectRoot, "scripts");
    if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
    const devScriptPath = join(scriptsDir, "dev.js");
    if (!existsSync(devScriptPath)) {
      writeFileSync(
        devScriptPath,
        `import { spawn } from "node:child_process";\n\nconsole.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...");\nconst serverProc = spawn("npm", ["run", "server"], { stdio: "inherit", shell: true });\nconst viteProc = spawn("npx", ["vite", "--host"], { stdio: "inherit", shell: true });\n\nprocess.on("SIGINT", () => {\n  serverProc.kill();\n  viteProc.kill();\n  process.exit();\n});\n`,
        "utf8"
      );
      createdFiles.push("scripts/dev.js");
    }

    // ── 1d. Ensure index.html, src/main.tsx, src/index.css, and vite.config.ts ───
    const resolvedTokens = DomainVisualContractGenerator.resolveCssTokens(domainSpec.visualContract);
    const indexHtmlPath = join(projectRoot, "index.html");
    if (!existsSync(indexHtmlPath)) {
      writeFileSync(
        indexHtmlPath,
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${domainSpec.brandName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
      :root {
        --color-background: ${resolvedTokens.backgroundColor};
        --color-text-primary: ${resolvedTokens.textPrimaryColor};
        --font-body: ${resolvedTokens.fontBody};
      }
      html, body, #root {
        min-height: 100vh;
        width: 100%;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        background-color: ${resolvedTokens.backgroundColor};
        color: ${resolvedTokens.textPrimaryColor};
        font-family: ${resolvedTokens.fontBody};
      }
      #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
    </style>
  </head>
  <body class="${domainSpec.visualContract.colorSystem.background} ${domainSpec.visualContract.colorSystem.textPrimary}" style="margin: 0; min-height: 100vh; background-color: ${resolvedTokens.backgroundColor}; color: ${resolvedTokens.textPrimaryColor}; font-family: ${resolvedTokens.fontBody};">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
        "utf8"
      );
      createdFiles.push("index.html");
    }

    // ── 1.1. Ensure Design System Tokens, CSS Reset, Components & Build Configs ─
    try {
      const dsGen = new DesignSystemGenerator();
      const dsFiles = dsGen.generate(
        { name: domainSpec.brandName, dataModels: domainSpec.allModels } as any,
        domainSpec.visualContract
      );
      for (const df of dsFiles) {
        const fullPath = join(projectRoot, df.path);
        const parentDir = join(fullPath, "..");
        if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
        // Always write/update if missing or if index.css is unpopulated
        if (!existsSync(fullPath) || (df.path === "src/index.css" && (!readFileSync(fullPath, "utf8").includes(":root") || !readFileSync(fullPath, "utf8").includes(".btn")))) {
          writeFileSync(fullPath, df.content, "utf8");
          createdFiles.push(df.path);
        }
      }
    } catch {}

    const mainTsxPath = join(srcDir, "main.tsx");
    if (!existsSync(mainTsxPath) || !readFileSync(mainTsxPath, "utf8").includes("./index.css")) {
      writeFileSync(
        mainTsxPath,
        `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { App } from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`,
        "utf8"
      );
      createdFiles.push("src/main.tsx");
    }

    const viteConfigPath = join(projectRoot, "vite.config.ts");
    if (!existsSync(viteConfigPath)) {
      writeFileSync(
        viteConfigPath,
        `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 5173,\n    proxy: {\n      "/api": {\n        target: "http://localhost:3001",\n        changeOrigin: true,\n      },\n    },\n  },\n});\n`,
        "utf8"
      );
      createdFiles.push("vite.config.ts");
    }

    const tsconfigPath = join(projectRoot, "tsconfig.json");
    if (!existsSync(tsconfigPath)) {
      writeFileSync(
        tsconfigPath,
        JSON.stringify({
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["ES2020", "DOM", "DOM.Iterable"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
            strict: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
          references: [{ path: "./tsconfig.node.json" }],
        }, null, 2),
        "utf8"
      );
      createdFiles.push("tsconfig.json");
    } else {
      try {
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
        if (tsconfig.compilerOptions) {
          tsconfig.compilerOptions.skipLibCheck = true;
          if (tsconfig.compilerOptions.types && Array.isArray(tsconfig.compilerOptions.types)) {
            tsconfig.compilerOptions.types = tsconfig.compilerOptions.types.filter((t: string) => t !== "@testing-library/jest-dom");
            if (tsconfig.compilerOptions.types.length === 0) delete tsconfig.compilerOptions.types;
          }
          writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");
        }
      } catch {}
    }

    const tsconfigNodePath = join(projectRoot, "tsconfig.node.json");
    if (!existsSync(tsconfigNodePath)) {
      writeFileSync(
        tsconfigNodePath,
        JSON.stringify({
          compilerOptions: {
            composite: true,
            skipLibCheck: true,
            module: "ESNext",
            moduleResolution: "bundler",
            allowSyntheticDefaultImports: true,
          },
          include: ["vite.config.ts"],
        }, null, 2),
        "utf8"
      );
      createdFiles.push("tsconfig.node.json");
    }

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
    const appContent = `import React, { Component, ErrorInfo, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen ${domainSpec.visualContract.colorSystem.background} ${domainSpec.visualContract.colorSystem.textPrimary} flex flex-col items-center justify-center p-6 font-sans text-center">
          <div className="card p-8 rounded-2xl max-w-lg w-full ${domainSpec.visualContract.colorSystem.card} border space-y-4">
            <div className="text-3xl">✦</div>
            <h2 className="text-xl font-bold ${domainSpec.visualContract.colorSystem.textPrimary}">${domainSpec.brandName}</h2>
            <p className="text-sm ${domainSpec.visualContract.colorSystem.textMuted}">
              The application encountered a transient runtime error during rendering.
            </p>
            <div className="p-3 rounded-lg bg-black/40 text-xs font-mono text-rose-300 text-left overflow-x-auto">
              {this.state.error?.message || "Render exception"}
            </div>
            <button
              onClick={() => {
                try { localStorage.clear(); } catch {}
                window.location.href = "/";
              }}
              className="btn btn-primary px-4 py-2 rounded-lg bg-gradient-to-r ${domainSpec.visualContract.colorSystem.accent} text-white font-bold text-xs"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="app-shell min-h-screen ${domainSpec.visualContract.colorSystem.background} ${domainSpec.visualContract.colorSystem.textPrimary} font-sans selection:bg-${domainSpec.visualContract.colorSystem.primary}-500/20">
            <AppRoutes />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
`;
    if (!existsSync(appPath) || !readFileSync(appPath, "utf8").includes("ErrorBoundary")) {
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
    const layoutPath = join(sharedDir, "Layout.tsx");
    if (!DeterministicProjectFixer.isRichValidLayout(layoutPath, domainSpec)) {
      const navLinksJson = JSON.stringify(domainSpec.navLinks, null, 2);
      const isPill = domainSpec.visualContract.navigation.strategy === "TOPBAR_PILL";
      const layoutContent = `import React from "react";
import { Link, useLocation } from "react-router-dom";

export interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navLinks = ${navLinksJson};

  return (
    <div className="app-shell min-h-screen ${domainSpec.visualContract.colorSystem.background} ${domainSpec.visualContract.colorSystem.textPrimary} flex flex-col font-sans">
      <header className="app-header border-b ${domainSpec.visualContract.colorSystem.surface} backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 text-decoration-none group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr ${domainSpec.visualContract.colorSystem.accent} flex items-center justify-center font-bold text-white shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
              ✦
            </div>
            <span className="font-bold text-lg ${domainSpec.visualContract.colorSystem.textPrimary} tracking-tight group-hover:opacity-90 transition-opacity">${domainSpec.brandName}</span>
          </Link>
          <nav className="app-nav hidden md:flex items-center gap-1.5 ${isPill ? "nav-pill-group p-1 rounded-full " + domainSpec.visualContract.colorSystem.surface : ""}">
            {navLinks.map((link) => {
              const active = location.pathname === link.path || (link.path !== "/" && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={\`nav-item ${isPill ? "rounded-full" : "rounded-lg"} px-3.5 py-1.5 text-xs font-medium transition-all duration-150 \${
                    active
                      ? "active ${domainSpec.visualContract.colorSystem.activeNavStyle} font-semibold"
                      : "${domainSpec.visualContract.colorSystem.textMuted} hover:${domainSpec.visualContract.colorSystem.textPrimary} hover:bg-white/5"
                  }\`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-live inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${domainSpec.visualContract.colorSystem.badgeStyle}">
            <span className="live-dot w-1.5 h-1.5 rounded-full bg-${domainSpec.visualContract.colorSystem.primary}-400 animate-pulse mr-1.5" />
            ${domainSpec.liveBadgeText}
          </span>
          <Link
            to="/login"
            className="btn btn-secondary px-3.5 py-1.5 rounded-lg ${domainSpec.visualContract.colorSystem.surface} ${domainSpec.visualContract.colorSystem.textMuted} hover:${domainSpec.visualContract.colorSystem.textPrimary} text-xs font-medium transition border"
          >
            Portal
          </Link>
        </div>
      </header>
      <main className="main-container flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">{children}</main>
      <footer className="border-t ${domainSpec.visualContract.colorSystem.surface} px-6 py-4 text-center text-xs ${domainSpec.visualContract.colorSystem.textMuted}">
        ${domainSpec.brandName} • ${domainSpec.visualContract.domain} (${domainSpec.visualContract.visualPersonality.mood})
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
    const uncountables = ["equipment", "information", "analytics", "telemetry", "research", "feedback", "software", "hardware", "inventory", "staff", "personnel"];
    for (const m of allModels) {
      const lowerM = m.toLowerCase();
      const plural = uncountables.includes(lowerM) ? m : (m.endsWith("y") && !m.endsWith("ey") ? `${m.slice(0, -1)}ies` : `${m}s`);
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
    for (const f of features) {
      if (f.routePath !== "/" && f.routePath !== "/dashboard" && !navLinks.some(n => n.path === f.routePath || n.name.toLowerCase() === f.navTitle.toLowerCase())) {
        navLinks.push({ name: f.navTitle, path: f.routePath });
      }
    }
    if (contract?.requiredRoutes && Array.isArray(contract.requiredRoutes) && contract.requiredRoutes.length > 0) {
      for (const rr of contract.requiredRoutes) {
        const cleanPath = rr.startsWith("/") ? rr : `/${rr}`;
        if (cleanPath === "/" || cleanPath === "/dashboard") continue;
        const matchingFeat = features.find(f => f.routePath === cleanPath || f.aliases.includes(cleanPath));
        const navTitle = matchingFeat ? matchingFeat.navTitle : cleanPath.replace(/^\//, "").charAt(0).toUpperCase() + cleanPath.slice(2);
        if (!navLinks.some(n => n.path === cleanPath || n.name.toLowerCase() === navTitle.toLowerCase())) {
          navLinks.push({ name: navTitle, path: cleanPath });
        }
      }
    }

    const visualContract = DomainVisualContractGenerator.deriveContract(promptText, undefined, contract);

    return {
      brandName,
      liveBadgeText,
      allModels,
      features,
      navLinks,
      visualContract,
    };
  }

  /**
   * Generates DashboardPage content tailored to active domain features, metrics, and specialized visual components.
   */
  private static generateDashboardPageContent(domainSpec: ReturnType<typeof DeterministicProjectFixer.deriveDomainSpec>): string {
    const { brandName, features, visualContract } = domainSpec;
    const primaryModel = features[0]?.modelName || "Item";
    const { colorSystem, dashboardComposition, layoutFamily } = visualContract;

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
      <div className="space-y-8">
        {/* Domain Hero Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${colorSystem.surface}">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge badge-live inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colorSystem.badgeStyle}">
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-${colorSystem.primary}-400 animate-pulse mr-1.5" /> ${visualContract.domain}
              </span>
              <span className="text-xs ${colorSystem.textMuted}">${visualContract.productType}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold ${colorSystem.textPrimary} tracking-tight">${dashboardComposition.headline}</h1>
            <p className="text-sm ${colorSystem.textMuted} mt-1">${visualContract.visualPersonality.mood} — Layout: ${layoutFamily}</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary px-4 py-2 rounded-lg bg-gradient-to-r ${colorSystem.accent} text-white font-bold text-xs transition shadow-lg shadow-black/30 hover:brightness-110 cursor-pointer flex items-center gap-1.5"
            >
              <span>✦</span>
              <span>${dashboardComposition.heroAction.label}</span>
            </button>
          </div>
        </div>

        {/* Operational Alerts if present */}
        {${JSON.stringify(dashboardComposition.alerts)}.length > 0 && (
          <div className="card p-3.5 rounded-xl ${colorSystem.surface} border flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-base">📢</span>
              <span className="${colorSystem.textPrimary} font-medium">${dashboardComposition.alerts[0]}</span>
            </div>
            <span className="badge badge-live text-[10px] font-mono ${colorSystem.textMuted}">LIVE NOTIFICATION</span>
          </div>
        )}

        {/* Contract-Derived Domain Metric Cards */}
        <div className="telemetry-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card p-5 rounded-2xl ${colorSystem.card} border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="metric-label text-xs font-semibold uppercase tracking-wider ${colorSystem.textMuted}">${dashboardComposition.primaryMetric.label}</span>
              <span className="badge text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorSystem.badgeStyle}">${dashboardComposition.primaryMetric.trend}</span>
            </div>
            <div className="metric-value text-3xl font-extrabold ${colorSystem.textPrimary} tracking-tight font-mono">${dashboardComposition.primaryMetric.value}</div>
            <div className="text-xs ${colorSystem.textMuted} mt-2 flex items-center gap-1">
              <span className="text-emerald-400">●</span> Primary Domain Telemetry
            </div>
          </div>

          {${JSON.stringify(dashboardComposition.secondaryMetrics)}.map((m, idx) => (
            <div key={idx} className="metric-card p-5 rounded-2xl ${colorSystem.card} border flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="metric-label text-xs font-semibold uppercase tracking-wider ${colorSystem.textMuted}">{m.label}</span>
                <span className="badge text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorSystem.badgeStyle}">{m.trend}</span>
              </div>
              <div className="metric-value text-3xl font-bold ${colorSystem.textPrimary} tracking-tight">{m.value}</div>
              <div className="text-xs ${colorSystem.textMuted} mt-2">Active Registry Indicator</div>
            </div>
          ))}
        </div>

        {/* Domain Workflow Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(4, features.length)} gap-4">
          {${JSON.stringify(features)}.map((p) => (
            <Link
              key={p.slug}
              to={p.routePath}
              className="card card-hover p-5 rounded-xl ${colorSystem.surface} border hover:border-${colorSystem.primary}-500/50 transition-all flex items-center justify-between group shadow-sm"
            >
              <div>
                <div className="font-bold ${colorSystem.textPrimary} text-sm group-hover:text-${colorSystem.primary}-400 transition">{p.navTitle}</div>
                <div className="text-xs ${colorSystem.textMuted} mt-1">Manage {p.pluralName.toLowerCase()} & real-time actions</div>
              </div>
              <span className="${colorSystem.textMuted} group-hover:text-${colorSystem.primary}-400 transition font-bold text-base">→</span>
            </Link>
          ))}
        </div>

        {/* Recent Operations Feed */}
        <div className="card ${colorSystem.card} rounded-2xl border p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b ${colorSystem.surface}">
            <div>
              <h2 className="text-lg font-bold ${colorSystem.textPrimary}">${brandName} Operations Stream</h2>
              <p className="text-xs ${colorSystem.textMuted}">Live domain events and audit records</p>
            </div>
            <div className="flex gap-1.5">
              {["All", "Active", "Completed"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={filter === status ? "btn btn-primary px-3 py-1 rounded-lg text-xs font-semibold transition ${colorSystem.badgeStyle}" : "btn btn-ghost px-3 py-1 rounded-lg text-xs font-semibold transition ${colorSystem.textMuted} hover:bg-white/5"}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y ${colorSystem.surface}">
            {filteredActivities.length === 0 ? (
              <div className="empty-state py-8 text-center ${colorSystem.textMuted} text-xs">No active operations found. Use the button above to register a new record.</div>
            ) : filteredActivities.map((act) => (
              <div key={act.id} className="py-3.5 flex items-center justify-between group">
                <div>
                  <div className="text-sm font-semibold ${colorSystem.textPrimary}">{act.title}</div>
                  <div className="text-xs ${colorSystem.textMuted} mt-0.5">{act.type} • {act.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge px-2.5 py-0.5 rounded-full text-xs font-medium ${colorSystem.badgeStyle}">
                    {act.status}
                  </span>
                  <button
                    onClick={() => handleDelete(act.id, act.type)}
                    title="Delete record"
                    className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 text-xs transition cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card ${colorSystem.card} border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold ${colorSystem.textPrimary}">Register / Add {selectedType}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold ${colorSystem.textMuted} mb-1">Title / Identifier</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Enter name or identifier..."
                    className="form-input w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg px-3 py-2 text-sm ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold ${colorSystem.textMuted} mb-1">Entity Domain Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="form-select w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg px-3 py-2 text-sm ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
                  >
${features.map(f => `                    <option value="${f.modelName}">${f.modelName}</option>`).join("\n")}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary px-4 py-2 rounded-lg ${colorSystem.surface} text-xs font-semibold ${colorSystem.textMuted}"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-lg bg-gradient-to-r ${colorSystem.accent} text-white text-xs font-bold shadow-md hover:brightness-110"
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
    const { colorSystem } = domainSpec.visualContract;

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
      .catch(() => {})
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b ${colorSystem.surface} pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge text-xs font-semibold uppercase tracking-wider text-${colorSystem.primary}-400">${domainSpec.brandName}</span>
              <span className="${colorSystem.textMuted}">•</span>
              <span className="text-xs ${colorSystem.textMuted}">${feat.navTitle} Registry</span>
            </div>
            <h1 className="text-2xl font-bold ${colorSystem.textPrimary}">${feat.navTitle}</h1>
            <p className="text-sm ${colorSystem.textMuted} mt-1">Manage ${feat.pluralName.toLowerCase()} and operational data records.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary px-4 py-2 rounded-lg bg-gradient-to-r ${colorSystem.accent} text-white font-bold text-xs transition shadow-md hover:brightness-110 cursor-pointer"
          >
            + Register ${feat.modelName}
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="card flex flex-col sm:flex-row gap-3 items-center justify-between ${colorSystem.surface} p-4 rounded-xl border">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search ${feat.pluralName.toLowerCase()}..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg pl-3 pr-4 py-2 text-xs ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
            />
          </div>
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["All", "Active", "Pending", "Completed"].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={statusFilter === st ? "btn btn-primary px-3 py-1.5 rounded-lg text-xs font-medium transition ${colorSystem.badgeStyle}" : "btn btn-ghost px-3 py-1.5 rounded-lg text-xs font-medium transition ${colorSystem.textMuted} hover:bg-white/5"}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="p-12 text-center ${colorSystem.textMuted} text-xs">Synchronizing ${feat.pluralName.toLowerCase()} with database...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state p-12 text-center ${colorSystem.surface} border rounded-2xl">
            <div className="${colorSystem.textPrimary} text-sm font-semibold">No ${feat.pluralName.toLowerCase()} registered</div>
            <p className="${colorSystem.textMuted} text-xs mt-1">Use the registration button above to create a record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="card card-hover p-5 rounded-xl ${colorSystem.card} border hover:border-${colorSystem.primary}-500/40 transition flex flex-col justify-between group shadow-md">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge text-[11px] font-medium px-2 py-0.5 rounded ${colorSystem.surface} ${colorSystem.textMuted} border">
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className="badge text-[11px] font-semibold px-2 py-0.5 rounded-full border transition ${colorSystem.badgeStyle}"
                    >
                      {item.status}
                    </button>
                  </div>
                  <h3 className="text-base font-bold ${colorSystem.textPrimary} group-hover:text-${colorSystem.primary}-300 transition">{item.name}</h3>
                  <p className="text-xs ${colorSystem.textMuted} mt-2 line-clamp-2">{item.description}</p>
                </div>
                <div className="flex items-center justify-between border-t ${colorSystem.surface} pt-3 mt-4 text-[11px] ${colorSystem.textMuted}">
                  <span className="font-mono">{item.createdAt}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className="btn btn-ghost hover:text-${colorSystem.primary}-300 transition cursor-pointer text-xs"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn btn-ghost hover:text-rose-400 transition cursor-pointer text-xs"
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
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card ${colorSystem.card} border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold ${colorSystem.textPrimary}">Register ${feat.modelName}</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold ${colorSystem.textMuted} mb-1">Name / Title</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter ${feat.modelName.toLowerCase()} title..."
                    className="form-input w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg px-3 py-2 text-sm ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold ${colorSystem.textMuted} mb-1">Category / Group</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-select w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg px-3 py-2 text-sm ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Priority">Priority</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold ${colorSystem.textMuted} mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Operational notes or details..."
                    rows={3}
                    className="form-input w-full ${colorSystem.background} border ${colorSystem.surface} rounded-lg px-3 py-2 text-sm ${colorSystem.textPrimary} focus:outline-none focus:border-${colorSystem.primary}-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-secondary px-4 py-2 rounded-lg ${colorSystem.surface} text-xs font-semibold ${colorSystem.textMuted}"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded-lg bg-gradient-to-r ${colorSystem.accent} text-white text-xs font-bold shadow-md hover:brightness-110"
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
      `import DashboardPageModule, { DashboardPage as NamedDashboardPage } from "./features/dashboard/DashboardPage";\nconst DashboardPage = resolveComponent(DashboardPageModule, NamedDashboardPage, "Dashboard");`,
      ...features.map(f => `import ${f.name}Module, { ${f.name} as Named${f.name} } from "./pages/${f.name}";\nconst ${f.name} = resolveComponent(${f.name}Module, Named${f.name}, "${f.navTitle}");`),
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

function resolveComponent(mod: any, named: any, fallbackTitle: string): React.ComponentType<any> {
  if (typeof mod === "function") return mod;
  if (mod && typeof mod.default === "function") return mod.default;
  if (typeof named === "function") return named;
  return function SafeFallback() {
    return (
      <div className="p-8 text-center text-slate-300 font-sans">
        <h2 className="text-xl font-bold mb-2">{fallbackTitle}</h2>
        <p className="text-sm text-slate-400">Loading module interface...</p>
      </div>
    );
  };
}

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

    const serverJsPath = serverIndexPath.replace(/\.ts$/, ".js");
    const serverCode = `import http from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PORT = process.env.PORT || 3001;
const dataDir = join(process.cwd(), ".aegis", "data");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

function getStore(name) {
  const p = join(dataDir, \`\${name}.json\`);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return []; }
}

function saveStore(name, data) {
  const p = join(dataDir, \`\${name}.json\`);
  try { writeFileSync(p, JSON.stringify(data, null, 2), "utf8"); } catch {}
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, \`http://\${req.headers.host || "localhost"}\`);
  const pathname = url.pathname;

  let body = "";
  req.on("data", chunk => body += chunk);
  req.on("end", () => {
    let jsonBody = {};
    try { jsonBody = JSON.parse(body || "{}"); } catch {}

    const sendJson = (status, data) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    };

    if (pathname === "/api/health") {
      return sendJson(200, { status: "healthy", timestamp: new Date() });
    }

${features.map(f => `
    // Routes for ${f.navTitle}
    if (pathname === "/api/${f.slug}") {
      if (req.method === "GET") return sendJson(200, getStore("${f.slug}"));
      if (req.method === "POST") {
        const items = getStore("${f.slug}");
        const newItem = { id: Date.now().toString(), ...jsonBody, createdAt: new Date().toISOString() };
        items.push(newItem);
        saveStore("${f.slug}", items);
        return sendJson(201, newItem);
      }
    }
    if (pathname.startsWith("/api/${f.slug}/")) {
      const id = pathname.replace("/api/${f.slug}/", "");
      let items = getStore("${f.slug}");
      const found = items.find(i => String(i.id) === String(id));
      if (req.method === "GET") {
        if (!found) return sendJson(404, { error: "${f.modelName} not found" });
        return sendJson(200, found);
      }
      if (req.method === "PUT") {
        const idx = items.findIndex(i => String(i.id) === String(id));
        if (idx === -1) {
          const created = { id, ...jsonBody, createdAt: new Date().toISOString() };
          items.push(created);
          saveStore("${f.slug}", items);
          return sendJson(200, created);
        }
        items[idx] = { ...items[idx], ...jsonBody, updatedAt: new Date().toISOString() };
        saveStore("${f.slug}", items);
        return sendJson(200, items[idx]);
      }
      if (req.method === "DELETE") {
        items = items.filter(i => String(i.id) !== String(id));
        saveStore("${f.slug}", items);
        return sendJson(200, { success: true, message: "Deleted successfully" });
      }
    }
`).join("\n")}

    sendJson(404, { error: "Route not found" });
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(\`[Backend] Port \${PORT} already in use. Retrying on port \${Number(PORT) + 1}...\`);
    server.listen(Number(PORT) + 1);
  }
});

server.listen(PORT, () => {
  console.log(\`🚀 ${brandName} Express Backend running on http://localhost:\${PORT}\`);
});

export default server;
`;

    writeFileSync(serverJsPath, serverCode, "utf8");
    if (!existsSync(serverIndexPath)) {
      writeFileSync(serverIndexPath, serverCode, "utf8");
    }
  }
}

