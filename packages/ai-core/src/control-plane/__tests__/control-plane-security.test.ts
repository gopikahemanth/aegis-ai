import { describe, it, expect } from "vitest";
import { JobStore } from "../job-store.js";
import { ProgressEventEmitter } from "../progress-events.js";
import { AuditLog } from "../audit-log.js";

describe("AEGIS Phase 12 — Control Plane Secret Sanitization & Security", () => {
  it("redacts DATABASE_URL, JWT_SECRET, and API keys across JobStore, Events, and AuditLogs", () => {
    const rawSecretStr = "DATABASE_URL=postgresql://user:secret123@localhost:5432/db JWT_SECRET=shhh_super_secret Bearer eyJhbGciOiJIUzI1NiJ9.test.sig";

    const sanitized = JobStore.sanitize(rawSecretStr);
    expect(sanitized).not.toContain("secret123");
    expect(sanitized).not.toContain("shhh_super_secret");
    expect(sanitized).not.toContain("eyJhbGciOiJIUzI1NiJ9.test.sig");

    const event = ProgressEventEmitter.emit("job_1", "proj_1", "gen_1", "STAGE_STARTED", "PLANNING", {
      config: "DATABASE_URL=postgresql://user:secret123@localhost:5432/db",
    });
    expect(event.payload.config).not.toContain("secret123");

    const record = AuditLog.record("", "proj_1", "TEST_ACTION", "SECURITY", {
      token: "Bearer eyJhbGciOiJIUzI1NiJ9.test.sig",
    });
    expect(record.details.token).not.toContain("eyJhbGciOiJIUzI1NiJ9");
  });
});
