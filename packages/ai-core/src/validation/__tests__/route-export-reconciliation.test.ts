import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ProjectGraphEngine } from "../project-graph-engine.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";

describe("Route Export & Import Reconciliation Invariants", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-reconcile-test-"));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("ProjectGraphEngine automatically reconciles named router import when target only has default export", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    // Target route file with only default export
    const routeFilePath = join(routesDir, "aircraft.routes.ts");
    writeFileSync(routeFilePath, `import { Router } from "express";
const router = Router();
router.get("/", (req, res) => res.json([]));
export default router;
`, "utf8");

    // Server index with named import
    const serverIndexPath = join(serverDir, "index.ts");
    writeFileSync(serverIndexPath, `import express from "express";
import { aircraftRouter } from "./routes/aircraft.routes";
const app = express();
app.use("/api/aircraft", aircraftRouter);
export default app;
`, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    // Mismatch should be healed, so 0 export mismatch warnings
    const exportIssues = result.issues.filter(i => i.type === "EXPORT_MISMATCH");
    expect(exportIssues.length).toBe(0);

    // Target route file must now contain the named export alias
    const updatedRouteCode = readFileSync(routeFilePath, "utf8");
    expect(updatedRouteCode).toContain("as aircraftRouter");
  });

  it("FastSanitizer.ensureServerIndexEntry synthesizes canonical named aliases for route files", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    const routeFilePath = join(routesDir, "telemetry.routes.ts");
    writeFileSync(routeFilePath, `import { Router } from "express";
const router = Router();
export default router;
`, "utf8");

    const serverIndexPath = join(serverDir, "index.ts");
    writeFileSync(serverIndexPath, `import express from "express";
import telemetryRouter from "./routes/telemetry.routes";
const app = express();
export default app;
`, "utf8");

    mkdirSync(join(tempDir, ".aegis"), { recursive: true });
    writeFileSync(join(tempDir, ".aegis", "frontend-review.json"), "{}", "utf8");

    FastDeterministicSanitizer.ensureServerIndexEntry(tempDir);

    const updatedRouteCode = readFileSync(routeFilePath, "utf8");
    expect(updatedRouteCode).toContain("as telemetryRouter");
    expect(updatedRouteCode).toContain("as telemetryRoutes");
    expect(updatedRouteCode).toContain("as router");
  });

  it("ProjectGraphEngine synthesizes Express middleware for server/middleware/auth.ts", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    // Maintenance route importing authenticateToken and AuthenticatedRequest from ../middleware/auth
    const maintenanceRoutePath = join(routesDir, "maintenance.ts");
    writeFileSync(maintenanceRoutePath, `import { Router } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
const router = Router();
router.get("/", authenticateToken, (req: AuthenticatedRequest, res) => res.json([]));
export default router;
`, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    const authMiddlewarePath = join(serverDir, "middleware", "auth.middleware.ts");
    expect(existsSync(authMiddlewarePath)).toBe(true);
    const authCode = readFileSync(authMiddlewarePath, "utf8");
    expect(authCode).toContain("authenticateToken");
    expect(authCode).toContain("AuthenticatedRequest");
    expect(authCode).toContain("export const authMiddleware");
    expect(authCode).not.toContain("localStorage");
  });

  it("FastSanitizer sanitizes kebab-case route stems into valid JavaScript identifiers without hyphens", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    // File with kebab-case name and existing illegal hyphenated export
    const routeFilePath = join(routesDir, "telemetry-frame.ts");
    writeFileSync(routeFilePath, `import { Router } from "express";
const router = Router();
export default router;
export { router as telemetry-frameRouter };
`, "utf8");

    const serverIndexPath = join(serverDir, "index.ts");
    writeFileSync(serverIndexPath, `import express from "express";
const app = express();
export default app;
`, "utf8");

    mkdirSync(join(tempDir, ".aegis"), { recursive: true });
    writeFileSync(join(tempDir, ".aegis", "frontend-review.json"), "{}", "utf8");

    FastDeterministicSanitizer.ensureServerIndexEntry(tempDir);

    const updatedRouteCode = readFileSync(routeFilePath, "utf8");
    expect(updatedRouteCode).not.toContain("telemetry-frameRouter");
    expect(updatedRouteCode).toContain("as telemetryFrameRouter");
    expect(updatedRouteCode).toContain("as telemetryFrameRoutes");
    expect(updatedRouteCode).toContain("as router");
  });

  it("ProjectGraphEngine reconciles stem mismatch between ./routes/auth and authRoutes.ts", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    // Target route file authored by CoderAgent with Routes suffix
    const routeFilePath = join(routesDir, "authRoutes.ts");
    writeFileSync(routeFilePath, `import { Router } from "express";
const router = Router();
router.post("/register", (req, res) => res.status(201).json({ success: true }));
router.post("/login", (req, res) => res.json({ success: true }));
export default router;
`, "utf8");

    // Server index importing ./routes/auth without Routes suffix
    const serverIndexPath = join(serverDir, "index.ts");
    writeFileSync(serverIndexPath, `import express from "express";
import authRouter from "./routes/auth";
const app = express();
app.use("/api/auth", authRouter);
export default app;
`, "utf8");

    const engine = new ProjectGraphEngine();
    const result = engine.validateGraph(tempDir);

    const issues = result.issues.filter(i => i.type === "MISSING_MODULE" && i.targetModule?.includes("auth"));
    expect(issues.length).toBe(0);

    // Import in server/index.ts should be updated to point to authRoutes
    const updatedServerIndex = readFileSync(serverIndexPath, "utf8");
    expect(updatedServerIndex).toContain("./routes/authRoutes");
  });

  it("ProjectGraphEngine structural route fallback re-exports sibling route if it exists", () => {
    const serverDir = join(tempDir, "server");
    const routesDir = join(serverDir, "routes");
    mkdirSync(routesDir, { recursive: true });

    // Sibling route
    const siblingPath = join(routesDir, "telemetryRoutes.ts");
    writeFileSync(siblingPath, `import { Router } from "express";
const router = Router();
router.get("/", (req, res) => res.json([]));
export default router;
`, "utf8");

    const engine = new ProjectGraphEngine();
    const created = engine.ensureCanonicalFileOnDisk("server/routes/telemetry.ts", tempDir);
    expect(created).not.toBeNull();

    const createdContent = readFileSync(created!, "utf8");
    expect(createdContent).toContain('export * from "./telemetryRoutes"');
    expect(createdContent).toContain('import targetRouter from "./telemetryRoutes"');
  });
});
