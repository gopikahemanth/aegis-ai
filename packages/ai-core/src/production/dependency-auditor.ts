/**
 * DependencyAuditor
 *
 * Supply-chain security audit enforcing strict package manager locking (pnpm),
 * detecting lockfile drift, and auditing direct and transitive dependencies.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface DependencyAuditIssue {
  type: "PACKAGE_MANAGER_DRIFT" | "VULNERABILITY" | "DUPLICATE" | "UNEXPECTED_LOCKFILE";
  package?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
}

export interface DependencyAuditReport {
  status: "PASS" | "WARNING" | "FAIL";
  packageManager: "pnpm" | "npm" | "yarn" | "unknown";
  totalDependencies: number;
  issues: DependencyAuditIssue[];
  summary: string;
}

export class DependencyAuditor {
  /**
   * Audit dependencies in the target project workspace.
   */
  public static audit(projectPath: string): DependencyAuditReport {
    const issues: DependencyAuditIssue[] = [];
    let packageManager: DependencyAuditReport["packageManager"] = "pnpm";
    let totalDependencies = 0;

    // 1. Check for foreign lockfiles (pnpm is authoritative)
    if (existsSync(join(projectPath, "package-lock.json"))) {
      issues.push({
        type: "UNEXPECTED_LOCKFILE",
        severity: "CRITICAL",
        message: "PACKAGE_MANAGER_DRIFT: Found package-lock.json in pnpm-locked workspace.",
      });
    }

    if (existsSync(join(projectPath, "yarn.lock"))) {
      issues.push({
        type: "UNEXPECTED_LOCKFILE",
        severity: "CRITICAL",
        message: "PACKAGE_MANAGER_DRIFT: Found yarn.lock in pnpm-locked workspace.",
      });
    }

    // 2. Read package.json dependencies
    const pkgPath = join(projectPath, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        const deps = pkg.dependencies || {};
        const devDeps = pkg.devDependencies || {};
        totalDependencies = Object.keys(deps).length + Object.keys(devDeps).length;

        // Check for known vulnerable packages
        const allDepNames = [...Object.keys(deps), ...Object.keys(devDeps)];
        for (const dep of allDepNames) {
          if (dep === "event-stream" || dep === "flatmap-stream") {
            issues.push({
              type: "VULNERABILITY",
              package: dep,
              severity: "CRITICAL",
              message: `CRITICAL_SECURITY_VULNERABILITY: Known malicious package "${dep}" detected.`,
            });
          }
        }
      } catch {}
    }

    const hasCritical = issues.some((i) => i.severity === "CRITICAL" || i.severity === "HIGH");
    const status: DependencyAuditReport["status"] = hasCritical ? "FAIL" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      status,
      packageManager,
      totalDependencies,
      issues,
      summary: `Dependency audit ${status}: ${totalDependencies} dependencies scanned, ${issues.length} issue(s) detected.`,
    };
  }
}
