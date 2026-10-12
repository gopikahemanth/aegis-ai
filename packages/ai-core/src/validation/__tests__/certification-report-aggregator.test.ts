import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { CertificationReportAggregator } from "../certification-report-aggregator.js";

describe("CertificationReportAggregator — Authoritative Cross-Domain Report Derivation", () => {
  const rootDir = join(process.cwd(), "..", "..");
  const testProjects = [
    join(rootDir, "projects", "velora-house-final-test"),
    join(rootDir, "projects", "orbitalis-research-center-test"),
    join(rootDir, "projects", "aquila-maritime-logistics-test"),
    join(rootDir, "projects", "forgecore-automation-test"),
  ].filter(existsSync);

  it("authoritatively audits cross-domain matrix: certifies FORGECORE with genuine evidence while keeping historical projects NOT_VERIFIED", () => {
    if (testProjects.length === 4) {
      const report = CertificationReportAggregator.auditAll(testProjects);

      expect(report.projectsAudited).toBe(4);
      // Historical projects lack genuine pre-sanitization provenance; report refuses to falsely mark allPassed
      expect(report.allPassed).toBe(false);

      // 1. FORGECORE AUTOMATION (Fully Certified with Genuine Evidence)
      const forgecore = report.summaries.find(s => s.projectId.includes("forgecore"));
      expect(forgecore).toBeDefined();
      expect(forgecore!.brandName).toBe("FORGECORE AUTOMATION");
      expect(forgecore!.domainCategory).toBe("Precision Industrial Robotics & Telemetry");
      expect(forgecore!.canonicalRouteCount).toBe(8);
      expect(forgecore!.modelCount).toBe(8);
      expect(forgecore!.schemaConsistent).toBe(true);
      expect(forgecore!.browserAuditStatus).toBe("PASS");
      expect(forgecore!.browserMutationCount).toBe(8);
      expect(forgecore!.passiveShellsCount).toBe(0);
      expect(forgecore!.apiWorkflowStatus).toBe("PASS");
      expect(forgecore!.http500Count).toBe(0);
      expect(forgecore!.postgresVerified).toBe(true);
      expect(forgecore!.nir).toBe(1.0);
      expect(forgecore!.provenanceStatus).toBe("UNASSISTED_NATIVE");
      expect(forgecore!.finalStatus).toBe("SUCCESS");

      // 2. VELORA HOUSE (Historical Run: Reconstructed artifacts quarantined; pre-sanitization provenance unrecoverable)
      const velora = report.summaries.find(s => s.projectId.includes("velora"));
      expect(velora).toBeDefined();
      expect(velora!.brandName).toBe("VELORA HOUSE");
      expect(velora!.domainCategory).toBe("Luxury Hospitality");
      expect(velora!.canonicalRouteCount).toBe(8);
      expect(velora!.modelCount).toBe(8);
      expect(velora!.schemaConsistent).toBe(true);
      expect(velora!.browserAuditStatus).toBe("PASS");
      expect(velora!.apiWorkflowStatus).toBe("PASS");
      expect(velora!.provenanceStatus).toBe("NOT_VERIFIED");
      expect(velora!.nir).toBeUndefined();
      expect(velora!.finalStatus).toBe("NOT_VERIFIED");

      // 3. ORBITALIS RESEARCH CENTER (Real execution: 9/9 browser transitions PASS; API PASS; Provenance NOT_VERIFIED)
      const orbitalis = report.summaries.find(s => s.projectId.includes("orbitalis"));
      expect(orbitalis).toBeDefined();
      expect(orbitalis!.brandName).toBe("ORBITALIS RESEARCH CENTER");
      expect(orbitalis!.domainCategory).toBe("Scientific Astrophysical Observatory");
      expect(orbitalis!.canonicalRouteCount).toBe(9);
      expect(orbitalis!.modelCount).toBe(8);
      expect(orbitalis!.schemaConsistent).toBe(true);
      expect(orbitalis!.browserAuditStatus).toBe("PASS");
      expect(orbitalis!.apiWorkflowStatus).toBe("PASS");
      expect(orbitalis!.provenanceStatus).toBe("NOT_VERIFIED");
      expect(orbitalis!.nir).toBeUndefined();
      expect(orbitalis!.finalStatus).toBe("NOT_VERIFIED");

      // 4. AQUILA MARITIME LOGISTICS (Real execution: 12/12 browser transitions PASS; API PASS; Provenance NOT_VERIFIED)
      const aquila = report.summaries.find(s => s.projectId.includes("aquila"));
      expect(aquila).toBeDefined();
      expect(aquila!.brandName).toBe("AQUILA MARITIME LOGISTICS");
      expect(aquila!.domainCategory).toBe("Commercial Maritime Logistics");
      expect(aquila!.canonicalRouteCount).toBe(12);
      expect(aquila!.modelCount).toBe(12);
      expect(aquila!.schemaConsistent).toBe(true);
      expect(aquila!.browserAuditStatus).toBe("PASS");
      expect(aquila!.apiWorkflowStatus).toBe("PASS");
      expect(aquila!.provenanceStatus).toBe("NOT_VERIFIED");
      expect(aquila!.nir).toBeUndefined();
      expect(aquila!.finalStatus).toBe("NOT_VERIFIED");

      // Verify Markdown Table Formatting
      expect(report.markdownTable).toContain("**FORGECORE AUTOMATION**");
      expect(report.markdownTable).toContain("1.00 (119 / 0)");
      expect(report.markdownTable).toContain("Verified (Read-Back)");
      expect(report.markdownTable).toContain("**SUCCESS**");

      expect(report.markdownTable).toContain("**VELORA HOUSE**");
      expect(report.markdownTable).toContain("**ORBITALIS RESEARCH CENTER**");
      expect(report.markdownTable).toContain("**AQUILA MARITIME LOGISTICS**");
      expect(report.markdownTable).toContain("**NOT_VERIFIED**");
    }
  });

  it("correctly derives domain categories from prompts and titles", () => {
    expect(CertificationReportAggregator.deriveDomainCategory(
      "Cargo vessels, live vessel positions, harbor telemetry, berth scheduling",
      "AQUILA"
    )).toBe("Commercial Maritime Logistics");

    expect(CertificationReportAggregator.deriveDomainCategory(
      "High-density robotic workcell control, Cartesian kinematics, joint torque telemetry",
      "FORGECORE"
    )).toBe("Precision Industrial Robotics & Telemetry");

    expect(CertificationReportAggregator.deriveDomainCategory(
      "Live sky observations, telescope instruments, celestial archives",
      "ORBITALIS"
    )).toBe("Scientific Astrophysical Observatory");

    expect(CertificationReportAggregator.deriveDomainCategory(
      "Boutique hotel, suites, amenities, dining, spa",
      "VELORA"
    )).toBe("Luxury Hospitality");
  });

  // ─── ADVERSARIAL REPORT-INTEGRITY TESTS ───

  describe("Adversarial Report-Integrity Invariants", () => {
    it("distinguishes uncalibrated legacy provenance from verified sanitizer injection, refusing to report numeric 0.00", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "aegis-legacy-provenance-"));
      try {
        mkdirSync(join(tempDir, ".aegis"), { recursive: true });
        mkdirSync(join(tempDir, "prisma"), { recursive: true });

        writeFileSync(join(tempDir, "prisma", "schema.prisma"), "model User { id String @id }", "utf8");
        writeFileSync(join(tempDir, ".aegis", "domain-contract.json"), JSON.stringify({
          brandName: "LEGACY CORP",
          entities: [{ name: "User" }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "architecture-contract.json"), JSON.stringify({
          requiredRoutes: ["/"],
          requiredModels: ["User"]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "browser-validation.json"), JSON.stringify({
          passed: true,
          semanticMutationResults: [{ route: "/", passed: true }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "api-workflow-report.json"), JSON.stringify({
          passed: true,
          http500Count: 0,
          postgresVerified: true
        }), "utf8");

        // UNCALIBRATED LEGACY PROVENANCE: 0 native, 81 injected, NO interaction-baseline.json
        writeFileSync(join(tempDir, ".aegis", "interaction-provenance.json"), JSON.stringify({
          nativeHandlers: 0,
          sanitizerInjectedHandlers: 81,
          nir: 0,
          summary: "Uncalibrated post-hoc artifact"
        }), "utf8");

        const summary = CertificationReportAggregator.auditProject(tempDir);

        // Strict Policy: Do not display numeric 0.00 when underlying evidence cannot substantiate it
        expect(summary.provenanceStatus).toBe("NOT_VERIFIED");
        expect(summary.nir).toBeUndefined();
        expect(summary.finalStatus).toBe("NOT_VERIFIED");

        // Markdown table rendering must show NOT VERIFIED for NIR
        const table = CertificationReportAggregator.generateMarkdownTable([summary]);
        expect(table).toContain("NOT VERIFIED");
        expect(table).not.toContain("0.00 (0 / 81)");

        // NOW VERIFIED INJECTION: has interaction-baseline.json with calibrated entries
        writeFileSync(join(tempDir, ".aegis", "interaction-baseline.json"), JSON.stringify([
          ["src/Button.tsx", { filePath: "src/Button.tsx", handlers: [] }]
        ]), "utf8");
        writeFileSync(join(tempDir, ".aegis", "interaction-provenance.json"), JSON.stringify({
          nativeHandlers: 10,
          sanitizerInjectedHandlers: 10,
          nir: 0.5,
          isBaselineCalibrated: true,
          summary: "Calibrated injection report"
        }), "utf8");

        const calibratedSummary = CertificationReportAggregator.auditProject(tempDir);
        expect(calibratedSummary.provenanceStatus).toBe("ASSISTED_INJECTED");
        expect(calibratedSummary.nir).toBe(0.5);
        expect(calibratedSummary.finalStatus).toBe("SUCCESS");

        const calibratedTable = CertificationReportAggregator.generateMarkdownTable([calibratedSummary]);
        expect(calibratedTable).toContain("0.50 (10 / 10)");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("marks missing browser and API evidence as NOT_VERIFIED rather than fabricating success", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "aegis-missing-evidence-"));
      try {
        mkdirSync(join(tempDir, ".aegis"), { recursive: true });
        mkdirSync(join(tempDir, "prisma"), { recursive: true });

        // Valid schema and architecture contract
        writeFileSync(join(tempDir, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Widget { id String @id }", "utf8");
        writeFileSync(join(tempDir, ".aegis", "domain-contract.json"), JSON.stringify({
          brandName: "TEST CORP",
          domainDescription: "Testing missing evidence policy",
          entities: [{ name: "User" }, { name: "Widget" }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "architecture-contract.json"), JSON.stringify({
          requiredRoutes: ["/", "/dashboard"],
          requiredModels: ["User", "Widget"]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "execution-report.json"), JSON.stringify({
          status: "SUCCESS"
        }), "utf8");

        // NO browser-validation.json or api-workflow-report.json or interaction-provenance.json
        const summary = CertificationReportAggregator.auditProject(tempDir);

        expect(summary.schemaConsistent).toBe(true);
        expect(summary.modelCount).toBe(2);

        // Strict Evidence Rule: Missing evidence -> NOT VERIFIED
        expect(summary.browserAuditStatus).toBe("NOT_VERIFIED");
        expect(summary.browserMutationCount).toBe(0);
        expect(summary.apiWorkflowStatus).toBe("NOT_VERIFIED");
        expect(summary.postgresVerified).toBe(false);
        expect(summary.provenanceStatus).toBe("NOT_VERIFIED");
        expect(summary.finalStatus).toBe("NOT_VERIFIED");

        // Markdown table rendering must show NOT VERIFIED
        const table = CertificationReportAggregator.generateMarkdownTable([summary]);
        expect(table).toContain("NOT VERIFIED");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("fails aggregator when Prisma schema and domain contract disagree on models", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "aegis-schema-mismatch-"));
      try {
        mkdirSync(join(tempDir, ".aegis"), { recursive: true });
        mkdirSync(join(tempDir, "prisma"), { recursive: true });

        // Schema only has User and Workcell (missing RobotJoint)
        writeFileSync(join(tempDir, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Workcell { id String @id }", "utf8");

        // Domain contract requires 3 entities
        writeFileSync(join(tempDir, ".aegis", "domain-contract.json"), JSON.stringify({
          brandName: "DISCREPANCY CORP",
          domainDescription: "Precision Industrial Robotics",
          entities: [{ name: "User" }, { name: "Workcell" }, { name: "RobotJoint" }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "architecture-contract.json"), JSON.stringify({
          requiredRoutes: ["/"],
          requiredModels: ["User", "Workcell", "RobotJoint"]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "browser-validation.json"), JSON.stringify({
          passed: true,
          semanticMutationResults: [{ route: "/", passed: true }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "api-workflow-report.json"), JSON.stringify({
          passed: true,
          http500Count: 0,
          postgresVerified: true
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "interaction-provenance.json"), JSON.stringify({
          nativeHandlers: 10,
          sanitizerInjectedHandlers: 0,
          nir: 1.0
        }), "utf8");

        const summary = CertificationReportAggregator.auditProject(tempDir);

        expect(summary.schemaConsistent).toBe(false);
        expect(summary.schemaDiscrepancies?.some(d => d.includes("RobotJoint"))).toBe(true);
        expect(summary.finalStatus).toBe("FAILED");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("rejects project when browser evidence reports passive shells or failing transitions", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "aegis-passive-shell-"));
      try {
        mkdirSync(join(tempDir, ".aegis"), { recursive: true });
        mkdirSync(join(tempDir, "prisma"), { recursive: true });

        writeFileSync(join(tempDir, "prisma", "schema.prisma"), "model User { id String @id }", "utf8");
        writeFileSync(join(tempDir, ".aegis", "domain-contract.json"), JSON.stringify({
          brandName: "SHELL CORP",
          entities: [{ name: "User" }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "architecture-contract.json"), JSON.stringify({
          requiredRoutes: ["/", "/admin"],
          requiredModels: ["User"]
        }), "utf8");

        // Route /admin lacks semantic state mutation (passive shell)
        writeFileSync(join(tempDir, ".aegis", "browser-validation.json"), JSON.stringify({
          passed: true,
          semanticMutationResults: [
            { route: "/", actionName: "test-action", passed: true }
            // /admin missing
          ]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "api-workflow-report.json"), JSON.stringify({
          passed: true,
          http500Count: 0,
          postgresVerified: true
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "interaction-provenance.json"), JSON.stringify({
          nativeHandlers: 10,
          sanitizerInjectedHandlers: 0,
          nir: 1.0
        }), "utf8");

        const summary = CertificationReportAggregator.auditProject(tempDir);

        expect(summary.browserAuditStatus).toBe("FAIL");
        expect(summary.passiveShellsCount).toBe(1);
        expect(summary.finalStatus).toBe("FAILED");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("rejects project when API workflow evidence contains HTTP 500 errors", () => {
      const tempDir = mkdtempSync(join(tmpdir(), "aegis-http500-"));
      try {
        mkdirSync(join(tempDir, ".aegis"), { recursive: true });
        mkdirSync(join(tempDir, "prisma"), { recursive: true });

        writeFileSync(join(tempDir, "prisma", "schema.prisma"), "model User { id String @id }", "utf8");
        writeFileSync(join(tempDir, ".aegis", "domain-contract.json"), JSON.stringify({
          brandName: "ERR CORP",
          entities: [{ name: "User" }]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "architecture-contract.json"), JSON.stringify({
          requiredRoutes: ["/"],
          requiredModels: ["User"]
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "browser-validation.json"), JSON.stringify({
          passed: true,
          semanticMutationResults: [{ route: "/", passed: true }]
        }), "utf8");

        // Failing API step with HTTP 500
        writeFileSync(join(tempDir, ".aegis", "api-workflow-report.json"), JSON.stringify({
          passed: false,
          totalSteps: 5,
          passedSteps: 4,
          failedSteps: 1,
          http500Count: 1,
          postgresVerified: true
        }), "utf8");
        writeFileSync(join(tempDir, ".aegis", "interaction-provenance.json"), JSON.stringify({
          nativeHandlers: 10,
          sanitizerInjectedHandlers: 0,
          nir: 1.0
        }), "utf8");

        const summary = CertificationReportAggregator.auditProject(tempDir);

        expect(summary.apiWorkflowStatus).toBe("FAIL");
        expect(summary.http500Count).toBe(1);
        expect(summary.finalStatus).toBe("FAILED");
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
