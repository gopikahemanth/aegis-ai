import { describe, it, expect, beforeEach } from "vitest";
import { SecretProvider } from "../../security/secret-provider.js";

describe("AEGIS Phase 18 — Secret Isolation & Redaction", () => {
  beforeEach(() => {
    SecretProvider.clear();
  });

  it("masks secrets ensuring 0 secret leakage enters telemetry or audit logs", () => {
    SecretProvider.setSecret("DATABASE_PASSWORD", "super_secret_pwd_9981");

    const rawLog = "Connected to postgresql://user:super_secret_pwd_9981@db:5432/production";
    const masked = SecretProvider.maskSecrets(rawLog);

    expect(masked).not.toContain("super_secret_pwd_9981");
    expect(masked).toContain("[REDACTED_SECRET]");
  });
});
