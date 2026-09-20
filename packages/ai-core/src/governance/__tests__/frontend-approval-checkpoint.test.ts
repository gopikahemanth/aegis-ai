import { describe, it, expect } from "vitest";
import { FrontendApprovalCheckpoint } from "../frontend-approval-checkpoint.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("FrontendApprovalCheckpoint", () => {
  it("manages pending, changes requested, and approved states cleanly", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-approval-test-"));

    try {
      // 1. Initial save: pending
      FrontendApprovalCheckpoint.saveReview(tempDir, {
        appName: "Lumina Terra",
        pages: ["Home", "Glaze Calculator", "Firing Monitor"],
        routes: ["/", "/glaze", "/firing"],
        colorPalette: {
          primary: "#c2410c",
          background: "#fafaf9",
          surface: "#ffffff",
          text: "#1c1917",
        },
        typography: {
          fontFamily: "Inter",
          scale: ["14px", "16px", "24px", "32px"],
        },
        interactionsVerified: [
          "Glaze oxide calculation update",
          "Firing graph interval selection",
        ],
        screenshots: {
          desktop: ".aegis/screenshots/desktop.png",
        },
        status: "PENDING",
      });

      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(false);
      const review = FrontendApprovalCheckpoint.loadReview(tempDir);
      expect(review?.status).toBe("PENDING");
      expect(review?.pages).toHaveLength(3);

      // 2. User requests changes
      FrontendApprovalCheckpoint.requestChanges(
        tempDir,
        "Make the glaze calculator inputs larger and increase card contrast"
      );
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(false);
      const reviewAfterChanges = FrontendApprovalCheckpoint.loadReview(tempDir);
      expect(reviewAfterChanges?.status).toBe("CHANGES_REQUESTED");
      expect(reviewAfterChanges?.userFeedback).toContain("increase card contrast");

      // 3. User approves
      FrontendApprovalCheckpoint.approve(tempDir);
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(true);
      const reviewApproved = FrontendApprovalCheckpoint.loadReview(tempDir);
      expect(reviewApproved?.status).toBe("APPROVED");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
