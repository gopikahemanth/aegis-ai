import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { BackendCompilationGate } from "../../build/backend-compilation-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { ASTSafeTransformer } from "../../governance/ast-safe-transformer.js";
import { RuntimeAcceptanceRunner } from "../../testing/runtime-acceptance-runner.js";

describe("Backend Compilation, Auth Middleware & Runtime Verification Suite", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-backend-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, "server", "middleware"), { recursive: true });
    mkdirSync(join(testDir, "server", "controllers"), { recursive: true });
    mkdirSync(join(testDir, "server", "routes"), { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });

    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "test-app",
      scripts: { build: "tsc && vite build" },
    }, null, 2), "utf8");

    writeFileSync(join(testDir, "tsconfig.json"), JSON.stringify({
      compilerOptions: { target: "ES2020", module: "ESNext" },
      include: ["src"],
    }, null, 2), "utf8");
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try { rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  // ─── 1. Authentication Middleware Runtime Semantics ──────────────────────────
  it("1. Auth middleware correctly validates tokens, handles errors, and populates user context", () => {
    // Helper creating Express-compatible mock req/res/next
    const createMocks = (authHeader?: string) => {
      let statusCode = 200;
      let jsonPayload: any = null;
      let nextCalled = false;

      const req: any = { headers: { authorization: authHeader } };
      const res: any = {
        status(code: number) { statusCode = code; return res; },
        json(data: any) { jsonPayload = data; return res; },
      };
      const next = () => { nextCalled = true; };

      return { req, res, next, getStatus: () => statusCode, getJson: () => jsonPayload, wasNextCalled: () => nextCalled };
    };

    const mockVerify = (token: string, _secret: string) => {
      if (token === "expired_token") {
        const err: any = new Error("jwt expired");
        err.name = "TokenExpiredError";
        throw err;
      }
      if (token === "invalid_token") {
        throw new Error("invalid signature");
      }
      if (token === "valid_user_token") {
        return { id: "usr_123", email: "client@luxury-pet.com", role: "CLIENT" };
      }
      throw new Error("unexpected token");
    };

    // Concrete execution of the canonical Aegis auth middleware pattern
    const requireAuth = (req: any, res: any, next: any) => {
      const authHeader = req.headers?.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access token required" });
      }

      const token = authHeader.split(" ")[1];
      if (token === "test_token" || (token && token.startsWith("mock-")) || token === "Bearer test_token") {
        req.user = { id: "00000000-0000-0000-0000-000000000001", userId: "00000000-0000-0000-0000-000000000001", email: "test@internal.aegis" };
        return next();
      }

      try {
        const decoded = mockVerify(token, "test-secret");
        const _decodedUser: any = (decoded as any);
        const _uid = _decodedUser?.id || _decodedUser?.userId || _decodedUser?.sub || "00000000-0000-0000-0000-000000000001";
        req.user = { ...(typeof _decodedUser === "object" ? _decodedUser : {}), id: _uid, userId: _uid };
        next();
      } catch (err: any) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Token expired" });
        }
        return res.status(403).json({ error: "Invalid or expired token" });
      }
    };

    // A. Missing token
    const mockA = createMocks(undefined);
    requireAuth(mockA.req, mockA.res, mockA.next);
    expect(mockA.getStatus()).toBe(401);
    expect(mockA.getJson().error).toBe("Access token required");
    expect(mockA.wasNextCalled()).toBe(false);

    // B. Malformed header (no Bearer)
    const mockB = createMocks("Basic xyz123");
    requireAuth(mockB.req, mockB.res, mockB.next);
    expect(mockB.getStatus()).toBe(401);
    expect(mockB.wasNextCalled()).toBe(false);

    // C. Invalid token
    const mockC = createMocks("Bearer invalid_token");
    requireAuth(mockC.req, mockC.res, mockC.next);
    expect(mockC.getStatus()).toBe(403);
    expect(mockC.getJson().error).toBe("Invalid or expired token");
    expect(mockC.wasNextCalled()).toBe(false);

    // D. Expired token
    const mockD = createMocks("Bearer expired_token");
    requireAuth(mockD.req, mockD.res, mockD.next);
    expect(mockD.getStatus()).toBe(401);
    expect(mockD.getJson().error).toBe("Token expired");
    expect(mockD.wasNextCalled()).toBe(false);

    // E. Test token bypass
    const mockE = createMocks("Bearer test_token");
    requireAuth(mockE.req, mockE.res, mockE.next);
    expect(mockE.wasNextCalled()).toBe(true);
    expect(mockE.req.user.id).toBe("00000000-0000-0000-0000-000000000001");
    expect(mockE.req.user.userId).toBe("00000000-0000-0000-0000-000000000001");

    // F. Valid token
    const mockF = createMocks("Bearer valid_user_token");
    requireAuth(mockF.req, mockF.res, mockF.next);
    expect(mockF.wasNextCalled()).toBe(true);
    expect(mockF.req.user.id).toBe("usr_123");
    expect(mockF.req.user.userId).toBe("usr_123");
    expect(mockF.req.user.email).toBe("client@luxury-pet.com");
  });

  // ─── 2. Backend Compilation Gate Catches Syntax Errors ───────────────────────
  it("2. BackendCompilationGate catches syntax errors in server files and reports exact details", () => {
    // Malformed auth middleware with unexpected "if"
    const malformedAuth = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const token = 'xyz';
  try {
    const decoded =
  if (token === 'test_token' || (token && token.startsWith('mock-'))) {
    req.user = { id: '00000000-0000-0000-0000-000000000001' };
    return next();
  }
jwt.verify(token, 'secret');
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
`;
    writeFileSync(join(testDir, "server", "middleware", "auth.ts"), malformedAuth, "utf8");

    const result = BackendCompilationGate.verify(testDir);
    expect(result.passed).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.some(d => d.file.includes("auth.ts"))).toBe(true);
    expect(result.summary).toContain("Backend compilation failed");
  });

  // ─── 3. Backend Compilation Gate Passes on Valid TypeScript ──────────────────
  it("3. BackendCompilationGate passes cleanly when server source files are valid TypeScript", () => {
    const validAuth = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'test_token' || (token && token.startsWith('mock-'))) {
    req.user = { id: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000001' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { id: decoded.id, userId: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
`;
    const validIndex = `import express from 'express';
import { requireAuth } from './middleware/auth';

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
export default app;
`;
    writeFileSync(join(testDir, "server", "middleware", "auth.ts"), validAuth, "utf8");
    writeFileSync(join(testDir, "server", "index.ts"), validIndex, "utf8");

    const result = BackendCompilationGate.verify(testDir);
    expect(result.passed).toBe(true);
    expect(result.diagnostics.length).toBe(0);
    expect(result.filesAudited).toBe(2);
  });

  // ─── 4. FastSanitizer Pre-Heals Corrupted Auth Middleware ────────────────────
  it("4. FastSanitizer heals corrupted 'const decoded = if (...)' assignment in auth middleware", () => {
    const corruptedAuth = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const token = 'xyz';
  try {
    const decoded =
  if (token === 'test_token' || (token && token.startsWith('mock-')) || token === 'Bearer test_token') {
    (req as any).user = { id: '00000000-0000-0000-0000-000000000001', userId: '00000000-0000-0000-0000-000000000001', email: 'test@internal.aegis' };
    return next();
  }
jwt.verify(token, 'secret') as { id: string; email: string };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}
`;
    const authPath = join(testDir, "server", "middleware", "auth.ts");
    writeFileSync(authPath, corruptedAuth, "utf8");

    // Execute sanitization pass
    FastDeterministicSanitizer.sanitizeProject(testDir);

    const healedContent = readFileSync(authPath, "utf8");
    expect(healedContent).not.toMatch(/const\s+decoded\s*=\s*\r?\n?\s*if\s*\(/);
    expect(healedContent).toContain("const decoded = jwt.verify");

    // Must now pass AST validation and BackendCompilationGate!
    const syntax = ASTSafeTransformer.validateSyntax(healedContent, "auth.ts");
    expect(syntax.valid).toBe(true);

    const compGate = BackendCompilationGate.verify(testDir);
    expect(compGate.passed).toBe(true);
  });

  // ─── 5. FastSanitizer Idempotence Across Multiple Runs ────────────────────────
  it("5. Repeated FastSanitizer execution on valid auth middleware is strictly idempotent", () => {
    const initialAuth = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
`;
    const authPath = join(testDir, "server", "middleware", "auth.ts");
    writeFileSync(authPath, initialAuth, "utf8");

    // Pass 1: Transforms safely
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass1Content = readFileSync(authPath, "utf8");
    expect(ASTSafeTransformer.validateSyntax(pass1Content, "auth.ts").valid).toBe(true);

    // Pass 2: Must be identical
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass2Content = readFileSync(authPath, "utf8");
    expect(pass2Content).toBe(pass1Content);

    // Pass 3: Must still be identical
    FastDeterministicSanitizer.sanitizeProject(testDir);
    const pass3Content = readFileSync(authPath, "utf8");
    expect(pass3Content).toBe(pass1Content);

    // Gate passes cleanly
    const compGate = BackendCompilationGate.verify(testDir);
    expect(compGate.passed).toBe(true);
  });

  // ─── 6. RuntimeAcceptanceRunner Reports FAILED When Backend Down ─────────────
  it("6. RuntimeAcceptanceRunner reports FAILED when backend server files fail compilation", async () => {
    // Malformed backend code
    writeFileSync(join(testDir, "server", "index.ts"), `const app = if (true) { return null; };`, "utf8");

    const runner = new RuntimeAcceptanceRunner(testDir);
    const result = await runner.execute({ timeoutMs: 1500 });

    expect(["FAILED", "STARTUP_FAILED"]).toContain(result.status);
    expect(result.passed).toBe(false);
    expect(result.health.backendHealthy).toBe(false);
    expect(result.qualityChecks.some(c => c.dimension === "BACKEND_RUNTIME" && !c.passed)).toBe(true);
  }, 35000);
});
