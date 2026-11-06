import { describe, it, expect, beforeEach } from "vitest";
import {
  GenerationBudgetGuard,
  BudgetExceededError,
} from "../generation-budget-guard.js";

describe("GenerationBudgetGuard Unit & Integration Tests", () => {
  let guard: GenerationBudgetGuard;

  beforeEach(() => {
    guard = GenerationBudgetGuard.getInstance();
    guard.reset();
    guard.configure({
      maxRequests: 12,
      maxPromptTokens: 75000,
      maxCompletionTokens: 20000,
      maxGenerations: 1,
      maxRepairsPerStage: 2,
    });
  });

  it("allows requests within the 12-call budget and tracks count correctly", () => {
    for (let i = 0; i < 12; i++) {
      expect(() => guard.assertRequestAllowed("test-agent")).not.toThrow();
      guard.recordRequest();
    }
    const status = guard.getStatus();
    expect(status.requestCount).toBe(12);
    expect(status.remainingRequests).toBe(0);
  });

  it("throws BudgetExceededError when request count exceeds the 12-call limit", () => {
    for (let i = 0; i < 12; i++) {
      guard.assertRequestAllowed();
      guard.recordRequest();
    }

    expect(() => guard.assertRequestAllowed("13th-request")).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed()).toThrow("Maximum provider requests limit (12) reached");
  });

  it("throws BudgetExceededError when prompt tokens exceed 75,000", () => {
    guard.recordUsage(70000, 5000);
    expect(() => guard.assertRequestAllowed()).not.toThrow();

    guard.recordUsage(5001, 100); // Exceeds 75,000 prompt tokens
    expect(() => guard.assertRequestAllowed()).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed()).toThrow("Maximum input token budget (75,000) reached");
  });

  it("throws BudgetExceededError when completion tokens exceed 20,000", () => {
    guard.recordUsage(10000, 19500);
    expect(() => guard.assertRequestAllowed()).not.toThrow();

    guard.recordUsage(500, 600); // Exceeds 20,000 completion tokens
    expect(() => guard.assertRequestAllowed()).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed()).toThrow("Maximum output token budget (20,000) reached");
  });

  it("enforces maximum 2 targeted repairs per stage and blocks the 3rd attempt", () => {
    const stage = "BackendApiRepair";

    // Attempt 1
    expect(() => guard.assertRepairAllowed(stage)).not.toThrow();
    guard.recordRepairAttempt(stage);

    // Attempt 2
    expect(() => guard.assertRepairAllowed(stage)).not.toThrow();
    guard.recordRepairAttempt(stage);

    // Attempt 3 must be blocked
    expect(() => guard.assertRepairAllowed(stage)).toThrow(BudgetExceededError);
    expect(() => guard.assertRepairAllowed(stage)).toThrow(
      'Targeted repair budget exhausted: Stage "BackendApiRepair" reached maximum 2 repair attempts.'
    );
  });

  it("enforces maximum 1 complete generation attempt and blocks second run", () => {
    expect(() => guard.assertGenerationAllowed()).not.toThrow();
    guard.recordGenerationStart();

    expect(() => guard.assertGenerationAllowed()).toThrow(BudgetExceededError);
    expect(() => guard.assertGenerationAllowed()).toThrow("Maximum generation attempts (1) reached");
  });

  it("halts immediately on provider outage and stops subsequent requests", () => {
    guard.haltOnProviderOutage("429 Rate limit exhausted on all available providers");

    expect(() => guard.assertRequestAllowed()).toThrow(BudgetExceededError);
    expect(() => guard.assertRequestAllowed()).toThrow("Provider outage / rate limit halt");
  });

  it("provides accurate telemetry status separating consumed vs remaining budgets", () => {
    guard.recordRequest();
    guard.recordRequest();
    guard.recordUsage(15000, 3000);
    guard.recordRepairAttempt("FrontendVisualReview");

    const status = guard.getStatus();
    expect(status.requestCount).toBe(2);
    expect(status.remainingRequests).toBe(10);
    expect(status.promptTokens).toBe(15000);
    expect(status.remainingPromptTokens).toBe(60000);
    expect(status.completionTokens).toBe(3000);
    expect(status.remainingCompletionTokens).toBe(17000);
    expect(status.totalTokens).toBe(18000);
    expect(status.repairCountsByStage["FrontendVisualReview"]).toBe(1);
    expect(status.isHalted).toBe(false);
  });
});
