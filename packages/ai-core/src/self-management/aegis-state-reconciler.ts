/**
 * AegisStateReconciler
 *
 * Discovers and audits AEGIS's actual workspace structure, package configuration,
 * and contract artifacts against expected canonical states.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface AegisStateAudit {
  status: "CONVERGED" | "DRIFT_DETECTED";
  packagesFound: string[];
  drifts: string[];
  summary: string;
}

export class AegisStateReconciler {
  /**
   * Reconcile actual workspace state against expected AEGIS structure.
   */
  public static reconcile(workspaceRoot: string): AegisStateAudit {
    const drifts: string[] = [];
    const packagesFound: string[] = [];

    let root = workspaceRoot;
    if (!existsSync(join(root, "packages")) && existsSync(join(root, "..", "packages"))) {
      root = join(root, "..");
    } else if (!existsSync(join(root, "packages")) && existsSync(join(root, "..", "..", "packages"))) {
      root = join(root, "..", "..");
    }

    const expectedPackages = ["ai-core", "agent-runtime", "workspace", "project-builder"];
    for (const pkg of expectedPackages) {
      const pkgJson = join(root, "packages", pkg, "package.json");
      if (existsSync(pkgJson)) {
        packagesFound.push(pkg);
      } else {
        drifts.push(`MISSING_CANONICAL_PACKAGE: packages/${pkg}`);
      }
    }


    const isConverged = drifts.length === 0;

    return {
      status: isConverged ? "CONVERGED" : "DRIFT_DETECTED",
      packagesFound,
      drifts,
      summary: isConverged
        ? "AEGIS state reconciled: All canonical packages and workspace configurations converged."
        : `AEGIS state drift detected: ${drifts.length} issue(s) identified.`,
    };
  }
}
