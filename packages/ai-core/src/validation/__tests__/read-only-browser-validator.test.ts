import { describe, it, expect } from "vitest";
import { ReadOnlyBrowserValidator } from "../read-only-browser-validator.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("ReadOnlyBrowserValidator.reviewFrontend", () => {
  it("fails cleanly when the dev server is unreachable, recording connection refusal", async () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-browser-val-test-"));
    try {
      const review = await ReadOnlyBrowserValidator.reviewFrontend("http://localhost:59999", tempDir);
      expect(review.passed).toBe(false);
      expect(review.serverReady).toBe(false);
      expect(review.failureReason).toContain("ERR_CONNECTION_REFUSED");
      expect(review.screenshots.desktop).toBeUndefined();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
