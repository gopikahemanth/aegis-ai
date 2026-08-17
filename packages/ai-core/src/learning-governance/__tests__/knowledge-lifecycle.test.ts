import { describe, it, expect, beforeEach } from "vitest";
import { KnowledgeLifecycleEngine } from "../knowledge-lifecycle-engine.js";

describe("AEGIS Phase 44 — Knowledge Lifecycle Engine", () => {
  beforeEach(() => {
    KnowledgeLifecycleEngine.reset();
  });

  it("records all lifecycle transitions with full provenance without deleting history", () => {
    const record = KnowledgeLifecycleEngine.initializeRecord("k_doc_1", "admin");
    expect(record.currentStage).toBe("DISCOVERED");

    KnowledgeLifecycleEngine.transition(
      "k_doc_1",
      "VALIDATING",
      "Telemetry checks initiated",
      "ev_tel_1",
      "system"
    );

    KnowledgeLifecycleEngine.transition(
      "k_doc_1",
      "VERIFIED",
      "Multi-system verification passed",
      "ev_ver_1",
      "gate"
    );

    const updated = KnowledgeLifecycleEngine.getRecord("k_doc_1");
    expect(updated?.currentStage).toBe("VERIFIED");
    expect(updated?.transitions.length).toBe(3);
  });
});
