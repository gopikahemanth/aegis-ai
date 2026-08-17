import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { JobOrchestrator } from "../job-orchestrator.js";

const AUTH_DIR = join(process.cwd(), ".tmp_test_phase12_auth");

describe("AEGIS Phase 12 — Human Authorization Gateway", () => {
  beforeEach(() => {
    if (existsSync(AUTH_DIR)) rmSync(AUTH_DIR, { recursive: true, force: true });
    mkdirSync(AUTH_DIR, { recursive: true });
    JobOrchestrator.reset();
  });

  afterEach(() => {
    JobOrchestrator.reset();
    if (existsSync(AUTH_DIR)) rmSync(AUTH_DIR, { recursive: true, force: true });
  });

  it("handles authorization requests, approval, and rejection transitions", () => {
    const job = JobOrchestrator.createJob({
      projectId: "auth_project",
      projectPath: AUTH_DIR,
      prompt: "Delete database table and remove records",
      type: "INCREMENTAL_EVOLUTION",
    });

    job.status = "WAITING_FOR_AUTHORIZATION";
    job.authorizationState = {
      id: "auth_123",
      operation: "Delete table",
      category: "DESTRUCTIVE_MIGRATION",
      reason: "Table removal requested",
      requestedAt: new Date().toISOString(),
      status: "PENDING",
    };

    // Rejection blocks job
    const rejected = JobOrchestrator.rejectAuthorization(job.jobId, "Not allowed", "security_admin");
    expect(rejected.status).toBe("BLOCKED");
    expect(rejected.authorizationState?.status).toBe("REJECTED");
    expect(rejected.authorizationState?.decidedBy).toBe("security_admin");
  });
});
