import { describe, it, expect } from "vitest";
import { LiveBrowserValidator } from "../live-browser-validator.js";

describe("AEGIS Phase 53 — Live Browser Validator", () => {
  it("verifies all routes at 1440px, 768px and 375px viewports", () => {
    const r = LiveBrowserValidator.validate("http://localhost:5173");
    expect(r.isAllVerified).toBe(true);
    expect(r.viewportsVerified).toEqual(["1440px", "768px", "375px"]);
    expect(r.results.every((rt) => rt.loadedAt1440px)).toBe(true);
    expect(r.results.every((rt) => rt.loadedAt768px)).toBe(true);
    expect(r.results.every((rt) => rt.loadedAt375px)).toBe(true);
  });

  it("fails when a route does not load in the browser — distinct from API pass", () => {
    const r = LiveBrowserValidator.validate("http://localhost:5173", "/dashboard");
    const failed = r.results.find((rt) => rt.route === "/dashboard");
    expect(failed?.state).toBe("FAILED");
    expect(r.isAllVerified).toBe(false);
    expect(r.criticalRoutesFailed).toContain("/dashboard");
  });
});
