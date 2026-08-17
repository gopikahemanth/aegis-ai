import { describe, it, expect } from "vitest";
import { BackupReadinessEngine } from "../backup-readiness-engine.js";

describe("AEGIS Phase 54 — Backup Readiness Engine", () => {
  it("verifies backup snapshot creation and restore test validation", () => {
    const res = BackupReadinessEngine.verifyBackupReadiness();
    expect(res.isBackupReady).toBe(true);
    expect(res.isRestoreVerified).toBe(true);
    expect(res.state).toBe("BACKUP_VERIFIED");
    expect(res.latestSnapshot).toBeDefined();
  });

  it("enforces RESTORE_TEST_REQUIRED if restore drill has not been verified", () => {
    const res = BackupReadinessEngine.verifyBackupReadiness({ simulateRestoreVerified: false });
    expect(res.isBackupReady).toBe(true);
    expect(res.isRestoreVerified).toBe(false);
    expect(res.state).toBe("RESTORE_TEST_REQUIRED");
  });

  it("reports NOT_CONFIGURED when no backup strategy is in place", () => {
    const res = BackupReadinessEngine.verifyBackupReadiness({ hasBackup: false });
    expect(res.isBackupReady).toBe(false);
    expect(res.state).toBe("NOT_CONFIGURED");
  });
});
