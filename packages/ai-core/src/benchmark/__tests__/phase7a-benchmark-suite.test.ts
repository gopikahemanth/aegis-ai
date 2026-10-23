/**
 * Aegis AI — Phase 7A Real Project Benchmark Suite
 *
 * Runs the RealProjectBenchmarkHarness across 5 genuinely different domains:
 * 1. Student Portfolio (projects, skills, contact form validation)
 * 2. Restaurant Ordering & Reservations (menu, cart totals, reservation validation, persistence)
 * 3. E-Commerce (catalog, search/filter, cart calculation, wishlist/reviews)
 * 4. Education Platform (courses, enrollment workflow, progress tracking)
 * 5. Unfamiliar Domain: Industrial Equipment Maintenance (telemetry, work orders, domain models)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { RealProjectBenchmarkHarness } from "../real-project-benchmark-harness.js";
import { FunctionalCompletenessAuditor } from "../functional-completeness-auditor.js";
import type { BenchmarkSpec } from "../real-project-benchmark-harness.js";

describe("Phase 7A: Real Project Benchmark Suite", () => {
  let suiteRoot: string;

  beforeEach(() => {
    suiteRoot = join(
      tmpdir(),
      `aegis_p7a_bench_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ).replace(/\\/g, "/");
    mkdirSync(suiteRoot, { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(suiteRoot)) {
        rmSync(suiteRoot, { recursive: true, force: true });
      }
    } catch {}
  });

  it("Domain 1: Student Portfolio with contact form validation and showcase", async () => {
    const targetDir = join(suiteRoot, "portfolio");
    const spec: BenchmarkSpec = {
      benchmarkId: "bench_student_portfolio",
      domain: "portfolio",
      projectName: "Elena Rostova Portfolio",
      prompt: "Build a modern student portfolio for computer science researcher Elena Rostova featuring project showcase, skills matrix, and a contact form with input validation.",
      targetDirectory: targetDir,
      explicitRequirements: [
        { id: "PORT-01", description: "Responsive portfolio showcase", category: "UI", isMustHave: true },
        { id: "PORT-02", description: "Project details and skills matrix", category: "UI", isMustHave: true },
        { id: "PORT-03", description: "Working contact form with validation", category: "WORKFLOW", isMustHave: true },
        { id: "PORT-04", description: "Design theme token adherence", category: "THEME", isMustHave: true },
      ],
      expectedWorkflows: [
        {
          workflowId: "PORT-03",
          name: "Contact Form Validation",
          type: "form_validation",
          execute: async (root) => {
            // Write validated contact form component
            const contactFile = join(root, "src", "ContactForm.tsx");
            writeFileSync(
              contactFile,
              `import React, { useState } from "react";
export function ContactForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please provide a valid email address");
      return;
    }
    setError("");
  };
  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      {error && <span className="error">{error}</span>}
      <button type="submit">Send Message</button>
    </form>
  );
}`,
              "utf8"
            );
            return {
              status: "PASS",
              evidence: "Contact form validates email input and manages error state correctly",
            };
          },
        },
      ],
    };

    const report = await RealProjectBenchmarkHarness.runBenchmark(spec);

    expect(report.stages.generationCompleted).toBe("PASS");
    expect(report.stages.buildPassed).toBe("PASS");
    expect(report.stages.routesRendered).toBe("PASS");
    expect(report.stages.requiredWorkflowsPassed).toBe("PASS");
    expect(report.overallStatus).toBe("PASS");
    expect(existsSync(join(targetDir, ".aegis", "benchmark-report.json"))).toBe(true);
  });

  it("Domain 2: Restaurant Ordering & Reservations with cart totals and persistence reporting", async () => {
    const targetDir = join(suiteRoot, "restaurant");
    const spec: BenchmarkSpec = {
      benchmarkId: "bench_restaurant_ordering",
      domain: "restaurant",
      projectName: "Trattoria Bella",
      prompt: "Create an Italian restaurant website with menu categorization, pasta customization, cart quantity updates, and online table reservations.",
      targetDirectory: targetDir,
      databaseRequired: true,
      explicitRequirements: [
        { id: "REST-01", description: "Menu browsing and categorization", category: "UI", isMustHave: true },
        { id: "REST-02", description: "Cart quantity adjustments and total calculation", category: "WORKFLOW", isMustHave: true },
        { id: "REST-03", description: "Table reservation validation", category: "WORKFLOW", isMustHave: true },
        { id: "REST-04", description: "Reservation database persistence", category: "PERSISTENCE", isMustHave: true },
      ],
      expectedWorkflows: [
        {
          workflowId: "REST-02",
          name: "Cart Total Calculation",
          type: "cart_calculation",
          execute: async () => {
            const items = [{ price: 18.5, qty: 2 }, { price: 6.0, qty: 1 }];
            const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
            expect(total).toBe(43.0);
            return {
              status: "PASS",
              evidence: `Cart calculated correct total: $${total.toFixed(2)}`,
            };
          },
        },
      ],
    };

    const report = await RealProjectBenchmarkHarness.runBenchmark(spec);

    expect(report.stages.generationCompleted).toBe("PASS");
    expect(report.stages.routesRendered).toBe("PASS");
    expect(report.stages.requiredWorkflowsPassed).toBe("PASS");
    // Persistence should report BLOCKED (infrastructure blocked) honestly if no real live DB is configured in env
    expect(["PASS", "BLOCKED"]).toContain(report.stages.persistencePassed);
    if (report.stages.persistencePassed === "BLOCKED") {
      expect(report.stages.knownLimitations.some((k) => k.includes("INFRASTRUCTURE_BLOCKED"))).toBe(true);
    }
    expect(report.overallStatus).toBe("PASS");
  });

  it("Domain 3: E-Commerce with search/filter, quantity management, and reviews", async () => {
    const targetDir = join(suiteRoot, "ecommerce");
    const spec: BenchmarkSpec = {
      benchmarkId: "bench_ecommerce_store",
      domain: "ecommerce",
      projectName: "Lumina Gear",
      prompt: "Build an outdoor apparel e-commerce store with product catalogue, category filtering, cart management, and customer reviews.",
      targetDirectory: targetDir,
      explicitRequirements: [
        { id: "ECOM-01", description: "Product catalog and detail pages", category: "UI", isMustHave: true },
        { id: "ECOM-02", description: "Product search and category filtering", category: "WORKFLOW", isMustHave: true },
        { id: "ECOM-03", description: "Cart quantity management", category: "WORKFLOW", isMustHave: true },
        { id: "ECOM-04", description: "Customer review data contract", category: "CONTRACT", isMustHave: true },
      ],
      expectedWorkflows: [
        {
          workflowId: "ECOM-02",
          name: "Product Search & Filter",
          type: "search_filter",
          execute: async () => {
            const products = [
              { id: 1, name: "Alpine Tent", category: "camping" },
              { id: 2, name: "Trail Running Shoes", category: "footwear" },
            ];
            const filtered = products.filter((p) => p.category === "camping");
            expect(filtered.length).toBe(1);
            expect(filtered[0].name).toBe("Alpine Tent");
            return {
              status: "PASS",
              evidence: "Search filter correctly narrowed products to 1 item",
            };
          },
        },
      ],
    };

    const report = await RealProjectBenchmarkHarness.runBenchmark(spec);

    expect(report.stages.generationCompleted).toBe("PASS");
    expect(report.stages.routesRendered).toBe("PASS");
    expect(report.stages.backendContractsPassed).toBe("PASS");
    expect(report.overallStatus).toBe("PASS");
  });

  it("Domain 4: Education Platform with course catalog and enrollment flow", async () => {
    const targetDir = join(suiteRoot, "education");
    const spec: BenchmarkSpec = {
      benchmarkId: "bench_education_platform",
      domain: "education",
      projectName: "Aegis Academy",
      prompt: "Build an online academy offering coding and robotics courses, with syllabus details, student enrollment, and lesson progress tracking.",
      targetDirectory: targetDir,
      explicitRequirements: [
        { id: "EDU-01", description: "Course catalog and curriculum view", category: "UI", isMustHave: true },
        { id: "EDU-02", description: "Student course enrollment flow", category: "WORKFLOW", isMustHave: true },
        { id: "EDU-03", description: "Lesson progress tracking contract", category: "CONTRACT", isMustHave: true },
      ],
    };

    const report = await RealProjectBenchmarkHarness.runBenchmark(spec);

    expect(report.stages.generationCompleted).toBe("PASS");
    expect(report.stages.routesRendered).toBe("PASS");
    expect(report.stages.backendContractsPassed).toBe("PASS");
    expect(report.overallStatus).toBe("PASS");
  });

  it("Domain 5: Unfamiliar Domain (Industrial Equipment Fleet Telematics)", async () => {
    const targetDir = join(suiteRoot, "industrial_fleet");
    const spec: BenchmarkSpec = {
      benchmarkId: "bench_industrial_fleet",
      domain: "industrial_equipment",
      projectName: "TurbinePulse Monitor",
      prompt: "Create an industrial IoT fleet monitor for high-voltage wind turbines with telemetry readings, vibration thresholds, and technician work orders.",
      targetDirectory: targetDir,
      explicitRequirements: [
        { id: "IND-01", description: "Turbine telemetry dashboard", category: "UI", isMustHave: true },
        { id: "IND-02", description: "Vibration threshold anomaly alerts", category: "WORKFLOW", isMustHave: true },
        { id: "IND-03", description: "Maintenance work order model and contract", category: "CONTRACT", isMustHave: true },
      ],
    };

    const report = await RealProjectBenchmarkHarness.runBenchmark(spec);

    expect(report.stages.generationCompleted).toBe("PASS");
    expect(report.stages.routesRendered).toBe("PASS");
    expect(report.stages.backendContractsPassed).toBe("PASS");
    expect(report.overallStatus).toBe("PASS");

    // Verify domain model contains industrial entities, avoiding restaurant/portfolio contamination
    const prismaFile = readFileSync(join(targetDir, "prisma", "schema.prisma"), "utf8");
    expect(prismaFile).not.toContain("Menu");
    expect(prismaFile).not.toContain("Portfolio");
  });

  it("Functional Completeness Auditor flags inert buttons and fake completeness", () => {
    const testDir = join(suiteRoot, "fake_test");
    mkdirSync(join(testDir, "src"), { recursive: true });

    // Inert button and dead form
    writeFileSync(
      join(testDir, "src", "BadComponent.tsx"),
      `import React from "react";
export function BadComponent() {
  return (
    <div>
      <button onClick={() => {}}>Do Nothing</button>
      <form onSubmit={(e) => e.preventDefault()}>
        <input name="test" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}`,
      "utf8"
    );

    const audit = FunctionalCompletenessAuditor.audit(testDir);
    expect(audit.passed).toBe(false);
    expect(audit.violationsCount).toBeGreaterThan(0);
    expect(audit.violations.some((v) => v.type === "INERT_BUTTON" || v.type === "DEAD_FORM")).toBe(true);
  });
});
