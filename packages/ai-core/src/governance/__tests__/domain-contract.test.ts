/**
 * domain-contract.test.ts
 *
 * Tests that DomainContractDeriver correctly builds domain contracts from
 * different ArchitectureContractV1 inputs WITHOUT hardcoding domain names.
 *
 * Section 30 (Domain derivation tests) and Section 31-32 (Cross-domain contamination)
 */

import { describe, it, expect } from "vitest";
import { DomainContractDeriver, DomainContractManager } from "../domain-contract.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";

// ── Fixture builder ─────────────────────────────────────────────────────────

function makeContract(overrides: Partial<ArchitectureContractV1> = {}): ArchitectureContractV1 {
  return {
    version: 1,
    frontend: { framework: "React-Vite", provenance: "explicit" },
    backend: { framework: "Express", provenance: "explicit" },
    database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
    language: "TypeScript",
    styling: "TailwindCSS",
    authentication: "JWT",
    packageManager: "pnpm",
    requiredModels: [],
    requiredFeatures: [],
    requiredLibraries: [],
    requiredRoutes: [],
    prompt: "",
    ...overrides,
  };
}

// ── Test: Resume domain ──────────────────────────────────────────────────────

describe("DomainContractDeriver — Resume Scanner domain", () => {
  const resumeContract = makeContract({
    prompt: "Build an AI Resume Keyword Scanner with ATS score matching and job description analysis.",
    requiredModels: ["User", "Resume", "JobDescription", "AnalysisResult", "KeywordMatch"],
    requiredFeatures: [
      "Resume Upload",
      "Job Description Input",
      "ATS Score Analysis",
      "Keyword Match Dashboard",
      "Match History",
    ],
  });

  const domain = DomainContractDeriver.derive(resumeContract, "arch-hash-resume");

  it("includes all required entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).toContain("User");
    expect(names).toContain("Resume");
    expect(names).toContain("JobDescription");
    expect(names).toContain("AnalysisResult");
    expect(names).toContain("KeywordMatch");
  });

  it("has correct entity kinds", () => {
    const user = domain.entities.find(e => e.name === "User")!;
    expect(user.kind).toBe("infrastructure");
    const resume = domain.entities.find(e => e.name === "Resume")!;
    expect(resume.kind).toBe("domain");
  });

  it("allows resume-related terminology", () => {
    expect(domain.allowedTerminology).toContain("resume");
    expect(domain.allowedTerminology).toContain("ats");
  });

  it("does NOT mark resume terms as suspicious", () => {
    // Resume terms should NOT be in suspiciousTerminology for a resume project
    const suspiciousLower = domain.suspiciousTerminology.map(t => t.toLowerCase());
    expect(suspiciousLower).not.toContain("resume");
    expect(suspiciousLower).not.toContain("jobdescription");
  });

  it("marks unrelated-domain terms as suspicious", () => {
    // Gym terms should be suspicious in a Resume app
    const hasSomeSuspicious = domain.suspiciousTerminology.length > 0;
    expect(hasSomeSuspicious).toBe(true);
  });

  it("produces a stable hash", () => {
    const domain2 = DomainContractDeriver.derive(resumeContract, "arch-hash-resume");
    expect(domain.domainHash).toBe(domain2.domainHash);
  });

  it("hash changes when models change", () => {
    const different = makeContract({
      ...resumeContract,
      requiredModels: ["User", "Resume"], // fewer models
    });
    const domain3 = DomainContractDeriver.derive(different, "arch-hash-resume");
    expect(domain.domainHash).not.toBe(domain3.domainHash);
  });
});

// ── Test: Security Scanner domain ────────────────────────────────────────────

describe("DomainContractDeriver — Security Scanner domain", () => {
  const securityContract = makeContract({
    prompt: "Build an AI Code Reviewer and Security Vulnerability Scanner with repository scanning.",
    requiredModels: ["User", "Repository", "Scan", "Vulnerability", "Remediation"],
    requiredFeatures: [
      "Repository Connection",
      "Security Scan",
      "Vulnerability Report",
      "Remediation Suggestions",
      "Risk Dashboard",
    ],
  });

  const domain = DomainContractDeriver.derive(securityContract, "arch-hash-security");

  it("includes security-specific entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).toContain("Repository");
    expect(names).toContain("Scan");
    expect(names).toContain("Vulnerability");
    expect(names).toContain("Remediation");
  });

  it("does NOT include Resume-specific entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).not.toContain("Resume");
    expect(names).not.toContain("JobDescription");
    expect(names).not.toContain("KeywordMatch");
  });

  it("marks Resume-specific terms as suspicious", () => {
    const suspicious = domain.suspiciousTerminology;
    expect(suspicious).toContain("resume");
    expect(suspicious).toContain("jobdescription");
  });

  it("has different hash from Resume domain", () => {
    const resumeContract = makeContract({
      requiredModels: ["User", "Resume", "JobDescription", "AnalysisResult"],
      requiredFeatures: ["Resume Upload"],
    });
    const resumeDomain = DomainContractDeriver.derive(resumeContract, "arch-hash-resume");
    expect(domain.domainHash).not.toBe(resumeDomain.domainHash);
  });
});

// ── Test: Gym domain ─────────────────────────────────────────────────────────

describe("DomainContractDeriver — Gym Management domain", () => {
  const gymContract = makeContract({
    prompt: "Build a gym management application for members, memberships, and attendance tracking.",
    requiredModels: ["User", "Member", "Membership", "Attendance", "Payment"],
    requiredFeatures: [
      "Member Registration",
      "Membership Plans",
      "Attendance Tracking",
      "Payment Processing",
      "Member Dashboard",
    ],
  });

  const domain = DomainContractDeriver.derive(gymContract, "arch-hash-gym");

  it("includes gym-specific entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).toContain("Member");
    expect(names).toContain("Membership");
    expect(names).toContain("Attendance");
    expect(names).toContain("Payment");
  });

  it("does NOT include Resume or Security entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).not.toContain("Resume");
    expect(names).not.toContain("Vulnerability");
    expect(names).not.toContain("Repository");
  });

  it("marks Resume and Security terms as suspicious", () => {
    const suspicious = domain.suspiciousTerminology;
    expect(suspicious).toContain("resume");
    expect(suspicious).toContain("vulnerability");
  });
});

// ── Test: Recipe domain ──────────────────────────────────────────────────────

describe("DomainContractDeriver — Recipe Management domain", () => {
  const recipeContract = makeContract({
    prompt: "Build a recipe management application with ingredients, categories, and meal planning.",
    requiredModels: ["User", "Recipe", "Ingredient", "Category", "MealPlan"],
    requiredFeatures: [
      "Recipe Creation",
      "Ingredient Management",
      "Category Browse",
      "Meal Planning",
      "Recipe Search",
    ],
  });

  const domain = DomainContractDeriver.derive(recipeContract, "arch-hash-recipe");

  it("includes recipe-specific entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).toContain("Recipe");
    expect(names).toContain("Ingredient");
    expect(names).toContain("Category");
    expect(names).toContain("MealPlan");
  });

  it("does NOT include gym entities", () => {
    const names = domain.entities.map(e => e.name);
    expect(names).not.toContain("Member");
    expect(names).not.toContain("Membership");
    expect(names).not.toContain("Attendance");
  });

  it("marks gym terms as suspicious", () => {
    const suspicious = domain.suspiciousTerminology;
    expect(suspicious).toContain("member");
    expect(suspicious).toContain("membership");
  });

  it("does NOT mark recipe-related words as suspicious", () => {
    const suspicious = domain.suspiciousTerminology;
    expect(suspicious).not.toContain("recipe");
    expect(suspicious).not.toContain("ingredient");
  });
});

// ── Cross-domain contamination test (Section 31) ─────────────────────────────

describe("Cross-domain contamination: Project A then Project B", () => {
  it("Project B (Security) must have NO Resume entities after Project A (Resume)", () => {
    const projectA = makeContract({
      requiredModels: ["User", "Resume", "JobDescription", "AnalysisResult"],
      requiredFeatures: ["Resume Upload", "ATS Score"],
      prompt: "Build a Resume Scanner",
    });
    const domainA = DomainContractDeriver.derive(projectA, "hash-a");

    const projectB = makeContract({
      requiredModels: ["User", "Repository", "Scan", "Vulnerability"],
      requiredFeatures: ["Security Scan", "Vulnerability Report"],
      prompt: "Build a Security Scanner",
    });
    const domainB = DomainContractDeriver.derive(projectB, "hash-b");

    // Domain B must not contain Resume entities
    const entityNamesB = domainB.entities.map(e => e.name);
    expect(entityNamesB).not.toContain("Resume");
    expect(entityNamesB).not.toContain("JobDescription");
    expect(entityNamesB).not.toContain("AnalysisResult");

    // Domain B must mark Resume terms as suspicious
    expect(domainB.suspiciousTerminology).toContain("resume");
    expect(domainB.suspiciousTerminology).toContain("jobdescription");

    // Domain A must mark Security terms as suspicious
    expect(domainA.suspiciousTerminology).toContain("vulnerability");
  });
});

// ── Cross-domain contamination test (Section 32) ─────────────────────────────

describe("Cross-domain contamination: Gym then Recipe", () => {
  it("Recipe project must have NO gym entities", () => {
    const gymContract = makeContract({
      requiredModels: ["User", "Member", "Membership", "Attendance"],
      requiredFeatures: ["Member Registration", "Attendance Tracking"],
    });
    const gymDomain = DomainContractDeriver.derive(gymContract, "hash-gym");

    const recipeContract = makeContract({
      requiredModels: ["User", "Recipe", "Ingredient", "Category"],
      requiredFeatures: ["Recipe Creation", "Ingredient Management"],
    });
    const recipeDomain = DomainContractDeriver.derive(recipeContract, "hash-recipe");

    const recipeEntityNames = recipeDomain.entities.map(e => e.name);
    expect(recipeEntityNames).not.toContain("Member");
    expect(recipeEntityNames).not.toContain("Membership");
    expect(recipeEntityNames).not.toContain("Attendance");

    expect(recipeDomain.suspiciousTerminology).toContain("member");
    expect(recipeDomain.suspiciousTerminology).toContain("membership");

    expect(gymDomain.suspiciousTerminology).toContain("recipe");
    expect(gymDomain.suspiciousTerminology).toContain("ingredient");
  });
});
