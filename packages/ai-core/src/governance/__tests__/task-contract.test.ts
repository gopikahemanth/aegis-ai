/**
 * Task Contract & Generation Pipeline Regression Tests
 *
 * Tests every contract violation and acceptance scenario per the user's specification.
 * Run with: pnpm test (or npx vitest in packages/ai-core)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PlanContractGate } from "../plan-contract-gate.js";
import { TechnologyConstraintValidator } from "../technology-constraint-validator.js";
import { CanonicalArchitectureState } from "../canonical-architecture-state.js";
import { CanonicalDataModelContract } from "../canonical-data-model.js";
import { GeneratedFileValidator } from "../../validation/generated-file-validator.js";
import type { Task } from "../../planner/task.js";

// ── Test Fixtures ─────────────────────────────────────────────────────────────

const CANONICAL_CONTRACT: any = {
  version: 1,
  frontend: { framework: "react-vite", version: "latest" },
  backend: { framework: "express", version: "latest" },
  database: { provider: "postgresql", orm: "prisma" },
  authentication: "jwt",
  language: "TypeScript",
  styling: "TailwindCSS",
  packageManager: "pnpm",
  requiredModels: ["User", "Resume", "JobDescription", "MatchAnalysis"],
  requiredFeatures: [],
  requiredRoutes: ["/", "/upload", "/dashboard"],
  inferredLibraries: [],
};

function makeCanonicalTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1,
    title: "Setup React-Vite Frontend",
    description: "Initialize the React-Vite SPA with TailwindCSS and React Router.",
    completed: false,
    stage: "frontend" as any,
    priority: 1,
    dependencies: [],
    estimatedComplexity: 3,
    ...overrides,
  } as Task;
}

function initCanonicalState() {
  // Reset singleton for test isolation
  (CanonicalArchitectureState as any).instance = undefined;
  CanonicalArchitectureState.getInstance().initialize(CANONICAL_CONTRACT);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PlanContractGate — Task Contract Validation", () => {
  beforeEach(() => {
    initCanonicalState();
  });

  // A: Planner generates Next.js task → rejected
  it("A: Rejects task with Next.js in title", () => {
    const task = makeCanonicalTask({ title: "Setup Next.js with Tailwind CSS and TanStack Query" });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].violations.some(v => v.forbiddenTerm.toLowerCase().includes("next"))).toBe(true);
  });

  // B: Planner generates Mongoose → rejected
  it("B: Rejects task with Mongoose in description", () => {
    const task = makeCanonicalTask({
      title: "Database Setup",
      description: "Install mongoose and create mongoose schemas for data modeling.",
    });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
    expect(result.rejected.some(r => r.violations.some(v => v.forbiddenTerm.toLowerCase().includes("mongoose")))).toBe(true);
  });

  // C: Planner generates NextAuth → rejected
  it("C: Rejects task with NextAuth in description", () => {
    const task = makeCanonicalTask({
      title: "Authentication Setup",
      description: "Configure NextAuth.js with OAuth2 and JWT session handling.",
    });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
  });

  // D: Planner generates forbidden dependency in libraries array → rejected
  it("D: Rejects task with forbidden library in libraries field", () => {
    const task = makeCanonicalTask({
      title: "Install dependencies",
      description: "Set up project dependencies.",
    });
    (task as any).libraries = ["react", "express", "next-auth", "mongoose"];
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
  });

  // E: Planner generates invalid architectureHash → rejected
  it("E: Rejects task with mismatched architectureHash", () => {
    const task = makeCanonicalTask({ architectureHash: "stale-hash-abc123" });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
    expect(result.rejected[0].violations.some(v => v.field === "architectureHash")).toBe(true);
  });

  // F: Valid hash but forbidden description → rejected
  it("F: Rejects task with valid hash but forbidden description content", () => {
    const canonicalHash = CanonicalArchitectureState.getInstance().getState().architectureHash;
    const task = makeCanonicalTask({
      architectureHash: canonicalHash,
      description: "Build Next.js App Router pages with Server Actions.",
    });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(false);
  });

  // G: Valid task → accepted
  it("G: Accepts valid React-Vite + Express task", () => {
    const task = makeCanonicalTask({
      title: "Build Frontend Resume Upload Page",
      description: "Create the React-Vite PDF upload component with Express backend API.",
    });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    expect(result.valid).toBe(true);
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });

  // Verify canonical hash is injected after gate
  it("Always stamps canonical architectureHash regardless of LLM-supplied value", () => {
    const canonicalHash = CanonicalArchitectureState.getInstance().getState().architectureHash;
    const task = makeCanonicalTask({ architectureHash: undefined });
    const result = PlanContractGate.verify([task], CANONICAL_CONTRACT);
    const acceptedTask = result.accepted[0];
    expect(acceptedTask?.architectureHash).toBe(canonicalHash);
  });
});

describe("GeneratedFileValidator — File Integrity", () => {
  // H: Coder produces TODO comment → rejected
  it("H: Rejects file with TODO comment stub", () => {
    const content = `
export function analyzeKeywords(resumeText: string, jobText: string) {
  // TODO: Integrate NLP logic here
  return { matchScore: 0, matchedKeywords: [], missingKeywords: [] };
}
`;
    const result = GeneratedFileValidator.validateCompleteness(content, "server/services/matcher.service.ts");
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes("TODO"))).toBe(true);
  });

  // I: Coder produces truncated file → rejected
  it("I: Rejects truncated file with incomplete expression", () => {
    const content = `
import { Request, Response } from "express";

export async function analyzeScan(req: Request, res: Response) {
  const { resumeText } = req.body;
  const result = await analyzeKeywords(
`;
    const result = GeneratedFileValidator.validateCompleteness(content, "server/controllers/scan.controller.ts");
    expect(result.valid).toBe(false);
  });

  // J: Coder produces FIXME stub → rejected
  it("J: Rejects file with FIXME comment", () => {
    const content = `
export function calculateMatchScore(resume: string[], job: string[]): number {
  // FIXME: implement real scoring
  return 75;
}
`;
    const result = GeneratedFileValidator.validateCompleteness(content, "server/services/scorer.ts");
    expect(result.valid).toBe(false);
    expect(result.issues.some(i => i.message.includes("FIXME"))).toBe(true);
  });

  // K: Valid complete file → accepted
  it("K: Accepts complete valid TypeScript file", () => {
    const content = `
import { readFileSync } from "node:fs";

export function extractKeywords(text: string): string[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at"]);
  return text
    .toLowerCase()
    .split(/\\W+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function calculateMatchScore(resumeKeywords: string[], jobKeywords: string[]): number {
  if (!jobKeywords.length) return 0;
  const matched = resumeKeywords.filter(k => jobKeywords.includes(k));
  return Math.round((matched.length / jobKeywords.length) * 100);
}
`;
    const result = GeneratedFileValidator.validateCompleteness(content, "server/services/keyword-extractor.ts");
    expect(result.valid).toBe(true);
  });
});

describe("TechnologyConstraintValidator — Dependency Contract", () => {
  // L: Forbidden dependency in package.json → reported and removed
  it("L: Detects and removes forbidden next-auth from package.json", () => {
    const pkg = {
      dependencies: { "express": "^4.18.0", "next-auth": "^4.0.0", "react": "^18.0.0" },
      devDependencies: { "drizzle-orm": "^0.28.0" },
    };
    const result = TechnologyConstraintValidator.validatePackageJson(pkg);
    expect(result.valid).toBe(false);
    expect(result.forbiddenFound).toContain("next-auth");
    expect(result.forbiddenFound).toContain("drizzle-orm");
    expect(result.cleaned.dependencies["next-auth"]).toBeUndefined();
    expect(result.cleaned.devDependencies["drizzle-orm"]).toBeUndefined();
    // Allowed packages not removed
    expect(result.cleaned.dependencies["express"]).toBeDefined();
    expect(result.cleaned.dependencies["react"]).toBeDefined();
  });

  // M: Valid package.json → passes
  it("M: Accepts clean package.json with only allowed packages", () => {
    const pkg = {
      dependencies: {
        "express": "^4.18.0",
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "@prisma/client": "^6.0.0",
        "jsonwebtoken": "^9.0.0",
        "pdf-parse": "^1.1.1",
        "multer": "^1.4.5",
        "zod": "^3.0.0",
      },
      devDependencies: {
        "prisma": "^6.0.0",
        "typescript": "^5.0.0",
      },
    };
    const result = TechnologyConstraintValidator.validatePackageJson(pkg);
    expect(result.valid).toBe(true);
    expect(result.forbiddenFound).toHaveLength(0);
  });

  // N: openai inferred library → filtered out
  it("N: Filters openai from inferred libraries (deterministic app does not need LLM API)", () => {
    const result = TechnologyConstraintValidator.filterLibraries(
      ["react", "express", "openai", "langchain", "mongoose", "pdf-parse"],
      CANONICAL_CONTRACT,
    );
    expect(result.forbidden).toContain("openai");
    expect(result.forbidden).toContain("langchain");
    expect(result.forbidden).toContain("mongoose");
    expect(result.allowed).toContain("pdf-parse");
    expect(result.allowed).toContain("react");
    expect(result.allowed).toContain("express");
  });
});

describe("CanonicalDataModelContract — Prisma Schema", () => {
  // O: Valid canonical schema → passes
  it("O: Valid Prisma schema with all canonical models passes validation", () => {
    const schema = CanonicalDataModelContract.getPrismaSchema();
    const result = CanonicalDataModelContract.validateSchema(schema);
    expect(result.valid).toBe(true);
    expect(result.missingModels).toHaveLength(0);
  });

  // P: Missing User model → fails
  it("P: Schema missing User model fails validation", () => {
    const schema = `
model Resume { id String @id }
model JobDescription { id String @id }
model MatchAnalysis { id String @id }
`;
    const result = CanonicalDataModelContract.validateSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.missingModels).toContain("User");
  });

  // Q: Missing AnalysisResult → fails
  it("Q: Schema missing AnalysisResult model fails validation", () => {
    const schema = `
model User { id String @id }
model Resume { id String @id }
model JobDescription { id String @id }
`;
    const result = CanonicalDataModelContract.validateSchema(schema, "Build an AI Resume Analyzer");
    expect(result.valid).toBe(false);
    expect(result.missingModels).toContain("AnalysisResult");
  });
});

describe("SemanticDuplicateDetector & Task Governance Tests", () => {
  it("TEST 1 & 2: SemanticDuplicateDetector runs under ESM without require() crash", async () => {
    const { SemanticDuplicateDetector } = await import("../semantic-duplicate-detector.js");
    expect(() => {
      SemanticDuplicateDetector.detectOrphans(process.cwd());
    }).not.toThrow();
  });

  it("TEST 3: Duplicate scanController.ts is redirected/flagged for deletion", async () => {
    const { SemanticDuplicateDetector } = await import("../semantic-duplicate-detector.js");
    const check = SemanticDuplicateDetector.checkBeforeWrite("server/controllers/scanController.ts");
    expect(check.action).toBe("DELETE_ORPHAN");
  });

  it("TEST 4: File check returns ALLOW for custom feature components", async () => {
    const { SemanticDuplicateDetector } = await import("../semantic-duplicate-detector.js");
    const check = SemanticDuplicateDetector.checkBeforeWrite("src/features/random/UnknownWidget.tsx");
    expect(check.action).toBe("ALLOW");
  });

  it("TEST 5: UploadForm is canonical upload component", async () => {
    const { SemanticDuplicateDetector } = await import("../semantic-duplicate-detector.js");
    const check = SemanticDuplicateDetector.checkBeforeWrite("src/features/upload/components/UploadForm.tsx");
    expect(check.action).toBe("ALLOW");
  });


  it("TEST 6: Frontend cannot import Prisma (boundary violation check)", async () => {
    const { CanonicalFileGraph } = await import("../canonical-file-graph.js");
    const check = CanonicalFileGraph.checkBoundaryViolation("src/services/api.ts", "@prisma/client");
    expect(check.violated).toBe(true);
  });

  it("TEST 7 & 8: Duplicate semantic tasks are deduplicated and plan is capped at max 6 tasks", async () => {
    const { TaskNormalizer } = await import("../task-normalizer.js");
    const duplicateTasks: Task[] = [
      makeCanonicalTask({ id: 1, title: "Initialize Database Schema and Models" }),
      makeCanonicalTask({ id: 2, title: "Setup Database Models with Prisma" }),
      makeCanonicalTask({ id: 3, title: "Backend Infrastructure and Auth" }),
      makeCanonicalTask({ id: 4, title: "Express Server Setup" }),
      makeCanonicalTask({ id: 5, title: "Analysis Engine Implementation" }),
      makeCanonicalTask({ id: 6, title: "API Layer Routes and Controllers" }),
      makeCanonicalTask({ id: 7, title: "Frontend Application React Pages" }),
      makeCanonicalTask({ id: 8, title: "Integration and Validation" }),
    ];

    const deduplicated = TaskNormalizer.deduplicateAndCapTasks(duplicateTasks, 6);
    expect(deduplicated.length).toBeLessThanOrEqual(6);
    expect(deduplicated.map(t => t.id)).toEqual([1, 2, 3, 4]);
  });
});

