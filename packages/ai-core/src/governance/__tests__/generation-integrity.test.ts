import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ASTSafeTransformer } from "../ast-safe-transformer.js";
import { DomainContaminationDetector } from "../domain-contamination-detector.js";
import { HardcodedValueDetector } from "../hardcoded-value-detector.js";
import { FeatureCoverageValidator } from "../../validation/feature-coverage-validator.js";
import { GenerationIntegrityValidator } from "../../validation/generation-integrity-validator.js";
import { ProductionReadinessGate } from "../../validation/production-readiness-gate.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Phase 62 — Generation Integrity & Non-Destructive Repair Test Suite", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-integrity-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "src", "pages"), { recursive: true });
    mkdirSync(join(testDir, "server", "routes"), { recursive: true });
    mkdirSync(join(testDir, "prisma"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe("ASTSafeTransformer", () => {
    it("should safely fix duplicate interface definitions without truncating file", () => {
      const codeWithDup = `
import React from 'react';

export interface CircularProgressProps {
  value: number;
  size?: number;
}

export interface CircularProgressProps {
  value: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ value }) => {
  return <div className="progress">{value}%</div>;
};
`;
      const result = ASTSafeTransformer.fixDuplicateInterfaces(codeWithDup);
      expect(result).not.toBe(codeWithDup);
      expect(result).toContain("export const CircularProgress");
      expect(result.match(/interface CircularProgressProps/g)?.length).toBe(1);
    });

    it("should safely fix empty or double routes without breaking valid routes", () => {
      const brokenRouter = `
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/test" element={<Routes><Route path="/inner" element={<div />} /></Routes>} />
    </Routes>
  );
}
`;
      const fixed = ASTSafeTransformer.fixBrokenRouterJSX(brokenRouter);
      expect(fixed).not.toContain("<Routes><Route");
      expect(fixed).toContain('path="/"');
    });

    it("should accurately validate valid TypeScript syntax", () => {
      const validCode = `
export interface User {
  id: string;
  name: string;
}
export function getUser(): User {
  return { id: "1", name: "Alice" };
}
`;
      const validation = ASTSafeTransformer.validateSyntax(validCode, "user.ts");
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });
  });

  describe("DomainContaminationDetector", () => {
    it("should detect foreign security scanner terms in a Gym application", () => {
      const gymContract: ArchitectureContractV1 = {
        applicationType: "gym",
        prompt: "Build a gym and workout management platform",
        primaryLanguage: "typescript",
        framework: "react-express",
        stylingSolution: "tailwind",
        stateManagement: "react-query",
        database: "postgresql",
        authStrategy: "jwt",
        uiPatterns: [],
        requiredRoutes: [],
        requiredEndpoints: [],
        domainModels: [],
        dependencies: {},
        devDependencies: {},
        directoryStructure: [],
      };

      // Create a gym file contaminated with security scanner models
      writeFileSync(
        join(testDir, "src", "pages", "ContaminatedPage.tsx"),
        `
export const ContaminatedPage = () => {
  const cveList = ["CVE-2024-1234"];
  const owaspRisk = "OWASP Top 10 Static Analysis Rule";
  return <div>{cveList} - {owaspRisk}</div>;
};
        `
      );

      const report = DomainContaminationDetector.scanProject(testDir, gymContract);
      expect(report.clean).toBe(false);
      expect(report.violations.length).toBeGreaterThan(0);
      expect(report.violations[0].foreignDomain).toContain("Security");
    });

    it("should pass a clean project with no foreign domain terms", () => {
      const gymContract: ArchitectureContractV1 = {
        applicationType: "gym",
        prompt: "Build a gym management platform",
        primaryLanguage: "typescript",
        framework: "react-express",
        stylingSolution: "tailwind",
        stateManagement: "react-query",
        database: "postgresql",
        authStrategy: "jwt",
        uiPatterns: [],
        requiredRoutes: [],
        requiredEndpoints: [],
        domainModels: [],
        dependencies: {},
        devDependencies: {},
        directoryStructure: [],
      };

      writeFileSync(
        join(testDir, "src", "pages", "WorkoutPage.tsx"),
        `
export const WorkoutPage = () => {
  return <div>Gym Workout Tracker and Member Attendance</div>;
};
        `
      );

      const report = DomainContaminationDetector.scanProject(testDir, gymContract);
      expect(report.clean).toBe(true);
      expect(report.violations.length).toBe(0);
    });
  });

  describe("HardcodedValueDetector", () => {
    it("should detect demo-user-id and Math.random scoring hacks", () => {
      writeFileSync(
        join(testDir, "src", "pages", "FakeAuth.tsx"),
        `
import { useState } from "react";
export const FakeAuth = () => {
  const [user] = useState({ id: "demo-user-id", email: "demo@aegis.dev" });
  const fakeScore = Math.random() * 100;
  return <div>{user.email} - {fakeScore}</div>;
};
        `
      );

      const report = HardcodedValueDetector.scanProject(testDir);
      expect(report.clean).toBe(false);
      expect(report.issues.length).toBeGreaterThanOrEqual(2);
      expect(report.issues.some((i) => i.category === "DEMO_CREDENTIALS")).toBe(true);
      expect(report.issues.some((i) => i.category === "RANDOM_SCORING_HACK")).toBe(true);
    });

    it("should pass clean production code without fake credentials", () => {
      writeFileSync(
        join(testDir, "src", "pages", "RealAuth.tsx"),
        `
export const RealAuth = ({ user }: { user: { id: string; email: string } }) => {
  return <div>{user.email}</div>;
};
        `
      );

      const report = HardcodedValueDetector.scanProject(testDir);
      expect(report.clean).toBe(true);
      expect(report.issues.length).toBe(0);
    });
  });

  describe("FeatureCoverageValidator & ProductionReadinessGate", () => {
    it("should validate full contract coverage and grant production readiness", () => {
      const contract: ArchitectureContractV1 = {
        applicationType: "gym",
        prompt: "Gym manager",
        primaryLanguage: "typescript",
        framework: "react-express",
        stylingSolution: "tailwind",
        stateManagement: "react-query",
        database: "postgresql",
        authStrategy: "jwt",
        uiPatterns: [],
        requiredRoutes: [
          { path: "/members", name: "Members", description: "Members page" },
          { path: "/workouts", name: "Workouts", description: "Workouts page" },
        ],
        requiredEndpoints: [
          { method: "GET", path: "/api/members", description: "Get members" },
          { method: "POST", path: "/api/workouts", description: "Create workout" },
        ],
        domainModels: [
          {
            name: "Member",
            fields: [
              { name: "id", type: "string", required: true },
              { name: "name", type: "string", required: true },
            ],
          },
        ],
        dependencies: { react: "^18.0.0" },
        devDependencies: {},
        directoryStructure: [],
      };

      // Create matching files
      writeFileSync(join(testDir, "src", "pages", "MembersPage.tsx"), 'export const MembersPage = () => <div path="/members">Members</div>;');
      writeFileSync(join(testDir, "src", "pages", "WorkoutsPage.tsx"), 'export const WorkoutsPage = () => <div path="/workouts">Workouts</div>;');
      writeFileSync(join(testDir, "server", "routes", "api.ts"), 'router.get("/api/members"); router.post("/api/workouts");');
      writeFileSync(join(testDir, "prisma", "schema.prisma"), "model Member { id String @id name String }");
      writeFileSync(join(testDir, "package.json"), JSON.stringify({ scripts: { build: "tsc", dev: "vite" } }));
      writeFileSync(join(testDir, ".env"), "DATABASE_URL=postgresql://postgres:secret@localhost:5432/gymdb");

      const coverageReport = FeatureCoverageValidator.validateCoverage(testDir, contract);
      expect(coverageReport.allSatisfied).toBe(true);
      expect(coverageReport.coveredPercentage).toBe(100);

      const readiness = ProductionReadinessGate.evaluate(testDir, contract);
      expect(readiness.isReady).toBe(true);
      expect(readiness.verdict).toBe("APPROVED_FOR_PRODUCTION");
    });
  });
});
