/**
 * error-classifier.test.ts
 *
 * Tests deterministic error classification and environment vs code disambiguation.
 */

import { describe, it, expect } from "vitest";
import { ErrorClassifier } from "../error-classifier.js";

describe("ErrorClassifier — Deterministic Classification", () => {
  it("classifies P1000 database server unreachable as ENVIRONMENT_ERROR", () => {
    const err = "PrismaClientInitializationError: Can't reach database server at `localhost:5432` (P1000)";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("ENVIRONMENT_ERROR");
    expect(res.isEnvironment).toBe(true);
    expect(res.isCodeFailure).toBe(false);
  });

  it("classifies Prisma unique constraint violation P2002 as DATABASE_ERROR", () => {
    const err = "Unique constraint failed on the fields: (`email`) (P2002)";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("DATABASE_ERROR");
    expect(res.isEnvironment).toBe(false);
    expect(res.isCodeFailure).toBe(true);
  });

  it("classifies missing module import as MODULE_ERROR or DEPENDENCY_ERROR", () => {
    const err = "src/App.tsx(3,25): error TS2307: Cannot find module './components/Header' or its corresponding type declarations.";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("MODULE_ERROR");
    expect(res.affectedFiles).toContain("src/App.tsx");
  });

  it("classifies missing third party package as DEPENDENCY_ERROR", () => {
    const err = "Error: Cannot find module 'axios' in node_modules";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("DEPENDENCY_ERROR");
  });

  it("classifies missing export as EXPORT_ERROR", () => {
    const err = "src/main.tsx(4,10): error TS2305: Module '\"./App\"' has no exported member 'App'.";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("EXPORT_ERROR");
    expect(res.affectedFiles).toContain("src/main.tsx");
  });

  it("classifies TypeScript type mismatch as TYPE_ERROR", () => {
    const err = "src/pages/Dashboard.tsx(42,9): error TS2322: Type 'number' is not assignable to type 'string'.";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("TYPE_ERROR");
    expect(res.affectedFiles).toContain("src/pages/Dashboard.tsx");
  });

  it("classifies syntax error as SYNTAX_ERROR", () => {
    const err = "src/components/Card.tsx(15,1): error TS1005: '}' expected.";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("SYNTAX_ERROR");
    expect(res.affectedFiles).toContain("src/components/Card.tsx");
  });

  it("classifies JWT/Auth error as AUTH_ERROR", () => {
    const err = "JsonWebTokenError: jwt malformed or invalid token signature";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("AUTH_ERROR");
  });

  it("classifies cross-domain vocabulary as DOMAIN_CONTAMINATION", () => {
    const err = "DOMAIN_CONTAMINATION: File contains resume scanner terminology in code reviewer project";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("DOMAIN_CONTAMINATION");
  });

  it("classifies fake/mock placeholder as FAKE_FEATURE", () => {
    const err = "NO MOCK DATA: Detected fake setTimeout simulation and mockResult array in src/Scanner.tsx";
    const res = ErrorClassifier.classify(err);
    expect(res.category).toBe("FAKE_FEATURE");
  });
});
