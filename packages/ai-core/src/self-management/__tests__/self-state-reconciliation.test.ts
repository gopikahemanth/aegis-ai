import { describe, it, expect } from "vitest";
import { AegisStateReconciler } from "../aegis-state-reconciler.js";

describe("AEGIS Phase 20 — Self-State Discovery & Reconciliation", () => {
  it("discovers actual workspace structure and reconciles canonical packages", () => {
    const audit = AegisStateReconciler.reconcile(process.cwd());
    expect(audit.status).toBe("CONVERGED");
    expect(audit.packagesFound).toContain("ai-core");
    expect(audit.packagesFound).toContain("agent-runtime");
    expect(audit.packagesFound).toContain("workspace");
    expect(audit.packagesFound).toContain("project-builder");
  });
});
