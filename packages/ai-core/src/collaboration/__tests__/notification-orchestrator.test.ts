import { describe, it, expect, beforeEach } from "vitest";
import { SecretProvider } from "../../security/secret-provider.js";
import { NotificationOrchestrator } from "../notification-orchestrator.js";

describe("AEGIS Phase 22 — Notification Orchestrator", () => {
  beforeEach(() => {
    SecretProvider.clear();
    NotificationOrchestrator.reset();
  });

  it("redacts credentials from notification messages to prevent secret leaks", () => {
    SecretProvider.setSecret("API_KEY", "sk-live-secret-val-999");

    const notif = NotificationOrchestrator.sendNotification({
      organizationId: "org_alpha",
      category: "SECURITY_ALERT",
      recipientUserIds: ["u1"],
      channel: "EMAIL",
      title: "Security Token Rotated",
      rawMessage: "New token created: sk-live-secret-val-999",
    });

    expect(notif.message).not.toContain("sk-live-secret-val-999");
    expect(notif.message).toContain("[REDACTED_SECRET]");
  });
});
