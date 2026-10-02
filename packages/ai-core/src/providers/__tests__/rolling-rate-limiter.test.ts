import { describe, it, expect } from "vitest";
import { RollingTokenRateLimiter } from "../rolling-rate-limiter.js";

describe("RollingTokenRateLimiter", () => {
  it("allows requests within TPM limit without delay", async () => {
    const limiter = new RollingTokenRateLimiter(6000);

    const start = Date.now();
    const resId = await limiter.reserveTokens(2000);
    const elapsed = Date.now() - start;

    expect(resId).toMatch(/^res_/);
    expect(elapsed).toBeLessThan(100);
    expect(limiter.getCurrentRollingTokens()).toBe(2000);

    // Reconcile with actual usage
    limiter.reconcileUsage(resId, 1850);
    expect(limiter.getCurrentRollingTokens()).toBe(1850);
  });

  it("accurately handles reservation release on failure", async () => {
    const limiter = new RollingTokenRateLimiter(6000);

    const resId = await limiter.reserveTokens(3000);
    expect(limiter.getCurrentRollingTokens()).toBe(3000);

    // On complete failure without consumed prompt
    limiter.releaseReservation(resId, 0);
    expect(limiter.getCurrentRollingTokens()).toBe(0);

    // If prompt was partially sent
    const resId2 = await limiter.reserveTokens(3000);
    limiter.releaseReservation(resId2, 1000);
    expect(limiter.getCurrentRollingTokens()).toBe(1000);
  });

  it("reconciles actual tokens exceeding the estimate without losing track", async () => {
    const limiter = new RollingTokenRateLimiter(6000);

    const resId = await limiter.reserveTokens(2000);
    // Response generated more completion tokens than estimated
    limiter.reconcileUsage(resId, 2800);

    expect(limiter.getCurrentRollingTokens()).toBe(2800);
  });
});
