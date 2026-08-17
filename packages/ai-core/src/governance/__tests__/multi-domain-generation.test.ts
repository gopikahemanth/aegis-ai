import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { DomainContractDeriver, DomainContractManager } from "../domain-contract.js";
import { DynamicCanonicalFileGraphBuilder } from "../dynamic-file-graph.js";
import { DomainContaminationValidator } from "../domain-contamination-validator.js";

import { TaskDAG } from "../../planner/task-dag.js";
import type { Task } from "../../planner/task.js";
import { TaskFileLockManager } from "../file-ownership-registry.js";
import { TaskCacheManager } from "../../execution/task-cache.js";
import { FeatureCompletenessTracker } from "../feature-completeness-tracker.js";

const TEST_BASE_DIR = join(process.cwd(), ".tmp_test_phase8_multidomain");

describe("AEGIS Phase 8 — Multi-Domain Dynamic Generation & Domain Independence", () => {
  beforeEach(() => {
    if (existsSync(TEST_BASE_DIR)) rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    mkdirSync(TEST_BASE_DIR, { recursive: true });
    TaskFileLockManager.getInstance().reset();
    FeatureCompletenessTracker.reset();
  });

  afterEach(() => {
    if (existsSync(TEST_BASE_DIR)) rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    TaskFileLockManager.getInstance().reset();
  });

  const domainRequests = [
    {
      domainName: "AI Resume Scanner",
      request: "Build an AI Resume Scanner application that allows uploading candidate resumes, extracting skills, matching against job descriptions, and calculating ATS match scores.",
      expectedKeywordInFeatures: ["resume", "job", "match", "scan"],
      forbiddenCrossDomainTerm: "trainer",
    },
    {
      domainName: "Gym Management System",
      request: "Build a Gym Management System to manage member memberships, trainer assignments, workout routines, and check-in attendance.",
      expectedKeywordInFeatures: ["member", "trainer", "workout", "attendance"],
      forbiddenCrossDomainTerm: "candidate",
    },
    {
      domainName: "Recipe Management Application",
      request: "Build a Recipe Management Application to search recipes, manage ingredients, plan weekly meals, and view nutritional information.",
      expectedKeywordInFeatures: ["recipe", "ingredient", "meal", "nutrition"],
      forbiddenCrossDomainTerm: "vulnerability",
    },
    {
      domainName: "E-Commerce Application",
      request: "Build an E-Commerce store to browse products, manage shopping cart, process customer orders, and track product inventory.",
      expectedKeywordInFeatures: ["product", "cart", "order", "inventory"],
      forbiddenCrossDomainTerm: "trainer",
    },
    {
      domainName: "AI Security Code Scanner",
      request: "Build an AI Security Code Scanner that ingests source code repositories, runs static security rules, detects vulnerabilities, and outputs security findings.",
      expectedKeywordInFeatures: ["security", "scan", "finding", "vulnerability", "code"],
      forbiddenCrossDomainTerm: "ingredient",
    },
    {
      domainName: "Blog / CMS Application",
      request: "Build a Blog CMS platform where authors can write articles, categorize blog posts with tags, publish drafts, and moderate reader comments.",
      expectedKeywordInFeatures: ["blog", "article", "post", "comment", "author"],
      forbiddenCrossDomainTerm: "atsscore",
    },
    {
      domainName: "Static Marketing Landing Page",
      request: "Create a modern static marketing landing page showcasing product features, testimonials, FAQ, and a contact lead form.",
      expectedKeywordInFeatures: ["landing", "feature", "contact"],
      forbiddenCrossDomainTerm: "vulnerability",
    },
  ];

  for (const { domainName, request, expectedKeywordInFeatures, forbiddenCrossDomainTerm } of domainRequests) {
    it(`dynamically derives domain contracts, file graph, and task DAG for ${domainName}`, () => {
      const projectDir = join(TEST_BASE_DIR, domainName.toLowerCase().replace(/[^a-z0-9]/g, "_"));
      mkdirSync(projectDir, { recursive: true });

      // 1. Architecture Resolution from User Request
      const arch = ArchitectureResolver.resolve(request);
      expect(arch.prompt).toBe(request);
      expect(arch.architectureHash).toBeDefined();

      // 2. Dynamic Domain Contract Derivation (No hardcoded domain template)
      const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);
      DomainContractManager.lock(arch, arch.architectureHash!, projectDir);

      expect(domain.domainName).toBeDefined();
      expect(domain.entities.length).toBeGreaterThan(0);
      expect(domain.features.length).toBeGreaterThan(0);

      // Verify domain vocabulary is dynamically derived from request
      const combinedFeatureText = domain.features
        .map((f) => `${f.featureId} ${f.name} ${f.description}`)
        .join(" ")
        .toLowerCase();

      const hasRelevantKeyword = expectedKeywordInFeatures.some((kw) => combinedFeatureText.includes(kw) || domain.allowedTerminology.includes(kw));
      expect(hasRelevantKeyword).toBe(true);

      // 3. Dynamic File Graph Construction
      const fileGraph = DynamicCanonicalFileGraphBuilder.build(arch, domain, projectDir);
      expect(fileGraph.entries.length).toBeGreaterThan(0);


      // 4. Dynamic Task DAG Construction
      const tasks: Task[] = domain.features.map((feat, idx) => ({
        id: idx + 1,
        title: `Implement ${feat.name}`,
        description: feat.description,
        completed: false,
        dependencies: idx === 0 ? [] : [1],
        ownedFiles: [`src/features/${feat.featureId}/index.ts`],
        featureId: feat.featureId,
      }));

      const dag = new TaskDAG(tasks);
      const validation = dag.validate();
      expect(validation.valid).toBe(true);

      // 5. Domain Contamination Check
      // Suspicious terminology must flag foreign terms, but not legitimate terms
      expect(domain.suspiciousTerminology.map((s) => s.toLowerCase())).toContain(forbiddenCrossDomainTerm);

      const contaminationReport = DomainContaminationValidator.validate(projectDir, domain);
      expect(contaminationReport.passed).toBe(true);
      expect(contaminationReport.violationCount).toBe(0);
    });
  }
});
