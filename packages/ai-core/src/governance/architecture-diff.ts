import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { DetectedArchitecture } from "./architecture-auditor.js";

export interface ArchitectureViolation {
  field: string;
  expected: string;
  actual: string;
  severity: "BLOCKER" | "WARNING";
}

export interface ArchitectureDiffResult {
  status: "PASS" | "FAILED";
  violations: ArchitectureViolation[];
}

export class ArchitectureDiff {
  public static compare(
    contract: ArchitectureContractV1 | null,
    actual: DetectedArchitecture
  ): ArchitectureDiffResult {
    const violations: ArchitectureViolation[] = [];

    if (!contract) {
      violations.push({
        field: "architectureContract",
        expected: "valid contract file",
        actual: "missing contract file",
        severity: "BLOCKER"
      });
      return { status: "FAILED", violations };
    }

    // 1. Compare Frontend Framework
    if (contract.frontend.framework && actual.frontendFramework !== "Unknown") {
      const exp = contract.frontend.framework.toLowerCase();
      const act = actual.frontendFramework.toLowerCase();
      if (exp.includes("next") && !act.includes("next")) {
        violations.push({ field: "frontend.framework", expected: contract.frontend.framework, actual: actual.frontendFramework, severity: "BLOCKER" });
      } else if (exp.includes("vite") && !act.includes("vite")) {
        violations.push({ field: "frontend.framework", expected: contract.frontend.framework, actual: actual.frontendFramework, severity: "BLOCKER" });
      }
    }

    // 2. Compare Backend Framework
    if (contract.backend.framework && contract.backend.framework.toLowerCase() !== "none") {
      const exp = contract.backend.framework.toLowerCase();
      const act = actual.backendFramework.toLowerCase();
      if (exp.includes("express") && act !== "unknown" && !act.includes("express")) {
        violations.push({ field: "backend.framework", expected: contract.backend.framework, actual: actual.backendFramework, severity: "BLOCKER" });
      } else if (exp.includes("next") && act !== "unknown" && !act.includes("next")) {
        violations.push({ field: "backend.framework", expected: contract.backend.framework, actual: actual.backendFramework, severity: "BLOCKER" });
      }
    }

    // 3. Compare Database Provider
    if (contract.database.provider && contract.database.provider.toLowerCase() !== "none") {
      const exp = contract.database.provider.toLowerCase();
      const act = actual.databaseProvider.toLowerCase();
      if (exp.includes("postgres") && act !== "unknown" && !act.includes("postgres")) {
        violations.push({ field: "database.provider", expected: contract.database.provider, actual: actual.databaseProvider, severity: "BLOCKER" });
      } else if (exp.includes("sqlite") && act !== "unknown" && !act.includes("sqlite")) {
        violations.push({ field: "database.provider", expected: contract.database.provider, actual: actual.databaseProvider, severity: "BLOCKER" });
      }
    }

    // 4. Compare ORM
    if (contract.database.orm && actual.orm !== "Unknown") {
      const exp = contract.database.orm.toLowerCase();
      const act = actual.orm.toLowerCase();
      if (exp.includes("drizzle") && !act.includes("drizzle")) {
        violations.push({ field: "database.orm", expected: contract.database.orm, actual: actual.orm, severity: "BLOCKER" });
      } else if (exp.includes("prisma") && !act.includes("prisma")) {
        violations.push({ field: "database.orm", expected: contract.database.orm, actual: actual.orm, severity: "BLOCKER" });
      }
    }

    const hasBlockers = violations.some(v => v.severity === "BLOCKER");
    return {
      status: hasBlockers ? "FAILED" : "PASS",
      violations
    };
  }

  public static writeDiffReport(outputDirectory: string, diff: ArchitectureDiffResult): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(join(aegisDir, "architecture-diff.json"), JSON.stringify(diff, null, 2), "utf8");

    if (diff.status === "FAILED") {
      console.error(`[ArchitectureDiff] 🔴 ARCHITECTURE DRIFT DETECTED (${diff.violations.length} blocker violation(s)):`);
      for (const v of diff.violations) {
        console.error(`  - ✗ [${v.severity}] ${v.field}: expected '${v.expected}', got '${v.actual}'`);
      }
    } else {
      console.log("[ArchitectureDiff] ✅ Architecture consistency verified — zero stack drift.");
    }
  }

  public static createProposal(
    outputDirectory: string,
    from: Record<string, string>,
    to: Record<string, string>,
    reason: string
  ): string {
    const proposalsDir = join(outputDirectory, ".aegis", "proposals");
    if (!existsSync(proposalsDir)) {
      mkdirSync(proposalsDir, { recursive: true });
    }

    const proposalId = `architecture-change-${Date.now()}`;
    const proposalPath = join(proposalsDir, `${proposalId}.json`);

    const proposalData = {
      type: "architecture-change",
      id: proposalId,
      createdAt: new Date().toISOString(),
      from,
      to,
      reason,
      affectedFiles: [],
      risk: "high",
      requiresUserApproval: true,
      approved: false
    };

    writeFileSync(proposalPath, JSON.stringify(proposalData, null, 2), "utf8");
    console.error(`[ArchitectureDiff] ⚠️ Architecture Change Proposal created at .aegis/proposals/${proposalId}.json (approved: false -> BLOCKED)`);
    return proposalPath;
  }
}
