import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { ASTSafeTransformer } from "../ast-safe-transformer.js";
import { ProjectStartupAgent } from "../../startup/project-startup-agent.js";
import { ProjectGraphEngine } from "../../validation/project-graph-engine.js";
import { DeterministicProjectFixer } from "../../validation/deterministic-project-fixer.js";

describe("Aegis V2.1 Fix 1 — Canonical React Router and Entry-Point Ownership", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-router-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 (Non-Router Apps): Does not force BrowserRouter or generate routes.tsx for non-router apps", () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "simple-landing",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0"
      }
    }, null, 2), "utf8");

    const originalApp = `import React from "react";

export function App() {
  return <div>Simple Landing Page</div>;
}

export default App;
`;
    writeFileSync(join(srcDir, "App.tsx"), originalApp, "utf8");

    FastDeterministicSanitizer.sanitizeProject(testDir);

    const appAfter = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(appAfter).not.toContain("BrowserRouter");
    expect(appAfter).not.toContain("react-router-dom");
    expect(existsSync(join(srcDir, "routes.tsx"))).toBe(false);
  });

  it("Test 2 (Router App without Boundary): Establishes canonical BrowserRouter in App.tsx under QueryClientProvider", () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "router-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0"
      }
    }, null, 2), "utf8");

    const appWithoutRouter = `import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <AppRoutes />
      </div>
    </QueryClientProvider>
  );
}

export default App;
`;
    writeFileSync(join(srcDir, "App.tsx"), appWithoutRouter, "utf8");

    const routesContent = `import React from "react";
import { Routes, Route } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
    </Routes>
  );
}

export default AppRoutes;
`;
    writeFileSync(join(srcDir, "routes.tsx"), routesContent, "utf8");

    FastDeterministicSanitizer.sanitizeProject(testDir);

    const appAfter = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(appAfter).toContain("import { BrowserRouter } from \"react-router-dom\"");
    expect(appAfter).toContain("<BrowserRouter>");
    expect(appAfter).toContain("</BrowserRouter>");

    // Invariant: QueryClientProvider > BrowserRouter > AppRoutes
    const qcpIndex = appAfter.indexOf("<QueryClientProvider");
    const routerIndex = appAfter.indexOf("<BrowserRouter>");
    const appRoutesIndex = appAfter.indexOf("<AppRoutes");
    expect(qcpIndex).toBeLessThan(routerIndex);
    expect(routerIndex).toBeLessThan(appRoutesIndex);
  });

  it("Test 3 (Existing Boundary): Preserves single canonical BrowserRouter without duplicate nesting", () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "router-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0"
      }
    }, null, 2), "utf8");

    const appWithRouter = `import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
`;
    writeFileSync(join(srcDir, "App.tsx"), appWithRouter, "utf8");

    FastDeterministicSanitizer.sanitizeProject(testDir);

    const appAfter = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const matches = (appAfter.match(/<BrowserRouter>/g) || []).length;
    expect(matches).toBe(1);
  });

  it("Test 4 (AST-Safe Nested Router Cleanup): AST-safely unwraps nested BrowserRouter from routes.tsx", () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    const routesWithNestedRouter = `import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/test" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
`;
    const cleaned = ASTSafeTransformer.stripRouterWrappersFromJsx(routesWithNestedRouter, "routes.tsx");
    expect(cleaned).not.toContain("<BrowserRouter>");
    expect(cleaned).not.toContain("</BrowserRouter>");
    expect(cleaned).toContain("<Routes>");
    expect(cleaned).toContain("</Routes>");
    expect(cleaned).toContain("import { Routes, Route, Navigate } from \"react-router-dom\"");
    expect(cleaned).not.toContain("BrowserRouter");
  });

  it("Test 5 (Idempotency): T(T(project)) == T(project) over 3 consecutive sanitizer passes", () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "idempotency-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0"
      }
    }, null, 2), "utf8");

    writeFileSync(join(srcDir, "App.tsx"), `import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./routes";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
export default App;
`, "utf8");

    writeFileSync(join(srcDir, "routes.tsx"), `import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRoutes;
`, "utf8");

    // Pass 1
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass1App = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const pass1Routes = readFileSync(join(srcDir, "routes.tsx"), "utf8");

    // Pass 2
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass2App = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const pass2Routes = readFileSync(join(srcDir, "routes.tsx"), "utf8");

    // Pass 3
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass3App = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const pass3Routes = readFileSync(join(srcDir, "routes.tsx"), "utf8");

    expect(pass2App).toBe(pass1App);
    expect(pass3App).toBe(pass1App);
    expect(pass2Routes).toBe(pass1Routes);
    expect(pass3Routes).toBe(pass1Routes);

    expect((pass1App.match(/<BrowserRouter>/g) || []).length).toBe(1);
    expect((pass1Routes.match(/<BrowserRouter>/g) || []).length).toBe(0);
  });

  it("Test 6 (Cross-Stage Harmony): ProjectStartupAgent does not strip BrowserRouter from App.tsx", async () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "harmony-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0"
      }
    }, null, 2), "utf8");

    // Populate using DeterministicProjectFixer
    DeterministicProjectFixer.fixProject(testDir);

    const appInitial = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(appInitial).toContain("<BrowserRouter>");

    // Run ProjectStartupAgent TS fixes
    const startupAgent = new ProjectStartupAgent(null as any);
    (startupAgent as any).applyDeterministicTsFixes(testDir);

    const appAfterStartup = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(appAfterStartup).toContain("<BrowserRouter>");
    expect((appAfterStartup.match(/<BrowserRouter>/g) || []).length).toBe(1);

    // Run FastDeterministicSanitizer
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const appFinal = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(appFinal).toContain("<BrowserRouter>");
    expect((appFinal.match(/<BrowserRouter>/g) || []).length).toBe(1);
  });

  it("Test 7 (Full Lifecycle Order Invariant): ProjectStartupAgent -> FastSanitizer -> ProjectGraphEngine -> DeterministicProjectFixer", async () => {
    const srcDir = join(testDir, "src");
    mkdirSync(srcDir, { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "lifecycle-app",
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        "react-router-dom": "^6.22.0",
        "@tanstack/react-query": "^5.0.0"
      }
    }, null, 2), "utf8");

    // 1. Initial creation with mis-nested routes and un-routed App
    writeFileSync(join(srcDir, "App.tsx"), `import React from "react";
import AppRoutes from "./routes";
export function App() { return <AppRoutes />; }
export default App;
`, "utf8");

    writeFileSync(join(srcDir, "routes.tsx"), `import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
export function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </Router>
  );
}
export default AppRoutes;
`, "utf8");

    // Stage 1: ProjectStartupAgent
    const startupAgent = new ProjectStartupAgent(null as any);
    (startupAgent as any).applyDeterministicTsFixes(testDir);

    // Stage 2: FastDeterministicSanitizer
    FastDeterministicSanitizer.sanitizeProject(testDir);

    // Stage 3: ProjectGraphEngine (create canonical module if needed)
    const graphEngine = new ProjectGraphEngine(null as any);
    (graphEngine as any).ensureCanonicalFileOnDisk("src/routes.tsx", testDir);

    // Stage 4: DeterministicProjectFixer
    DeterministicProjectFixer.fixProject(testDir);

    // Final Assertion across the entire application:
    const appFinal = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const routesFinal = readFileSync(join(srcDir, "routes.tsx"), "utf8");

    // App.tsx contains canonical Provider/Router structure
    expect(appFinal).toContain("QueryClientProvider");
    expect(appFinal).toContain("BrowserRouter");
    expect((appFinal.match(/<BrowserRouter>/g) || []).length).toBe(1);

    // Invariant: QueryClientProvider > BrowserRouter > AppRoutes
    expect(appFinal.indexOf("<QueryClientProvider")).toBeLessThan(appFinal.indexOf("<BrowserRouter>"));
    expect(appFinal.indexOf("<BrowserRouter>")).toBeLessThan(appFinal.indexOf("<AppRoutes"));

    // routes.tsx contains pure Routes, zero BrowserRouter / Router wrappers
    expect(routesFinal).not.toContain("BrowserRouter");
    expect(routesFinal).not.toContain("<Router>");
    expect(routesFinal).not.toContain("</Router>");
    expect(routesFinal).toContain("<Routes>");
    expect(routesFinal).toContain("</Routes>");
  });
});
