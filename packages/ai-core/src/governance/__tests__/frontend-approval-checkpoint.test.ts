import { describe, it, expect } from "vitest";
import { FrontendApprovalCheckpoint } from "../frontend-approval-checkpoint.js";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("FrontendApprovalCheckpoint", () => {
  it("enforces strict eligibility and manages pending, changes requested, and approved states cleanly", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-approval-test-"));
    const screenshotDir = join(tempDir, ".aegis", "screenshots");
    mkdirSync(screenshotDir, { recursive: true });

    const desktopPath = join(screenshotDir, "desktop.png");
    const tabletPath = join(screenshotDir, "tablet.png");
    const mobilePath = join(screenshotDir, "mobile.png");

    try {
      // 1. Initial save: pending (screenshots not on disk yet)
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
          desktop: desktopPath,
          tablet: tabletPath,
          mobile: mobilePath,
        },
        status: "PENDING",
      });

      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(false);

      // Invariant: Trying to approve when screenshots don't exist on disk throws FRONTEND_APPROVAL_BLOCKED
      const ineligible = FrontendApprovalCheckpoint.checkEligibility(tempDir);
      expect(ineligible.eligible).toBe(false);
      expect(ineligible.blockers.length).toBeGreaterThanOrEqual(3);
      expect(() => FrontendApprovalCheckpoint.approve(tempDir)).toThrow("FRONTEND_APPROVAL_BLOCKED");

      // 2. User requests changes
      FrontendApprovalCheckpoint.requestChanges(
        tempDir,
        "Make the glaze calculator inputs larger and increase card contrast"
      );
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(false);
      const reviewAfterChanges = FrontendApprovalCheckpoint.loadReview(tempDir);
      expect(reviewAfterChanges?.status).toBe("CHANGES_REQUESTED");
      expect(reviewAfterChanges?.userFeedback).toContain("increase card contrast");

      // 3. Create valid screenshots (> 1KB) and mock browser review
      const dummyPngData = Buffer.alloc(2048, 0xff);
      writeFileSync(desktopPath, dummyPngData);
      writeFileSync(tabletPath, dummyPngData);
      writeFileSync(mobilePath, dummyPngData);

      const validBrowserReview = {
        passed: true,
        serverReady: true,
        url: "http://localhost:5173",
        screenshots: { desktop: desktopPath, tablet: tabletPath, mobile: mobilePath },
        fatalConsoleErrors: [],
        uncaughtExceptions: [],
        renderedElementsCount: 25,
      };

      const eligible = FrontendApprovalCheckpoint.checkEligibility(tempDir, validBrowserReview);
      expect(eligible.eligible).toBe(true);
      expect(eligible.blockers).toHaveLength(0);

      // 4. User approves
      FrontendApprovalCheckpoint.approve(tempDir, validBrowserReview);
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(true);
      const reviewApproved = FrontendApprovalCheckpoint.loadReview(tempDir);
      expect(reviewApproved?.status).toBe("APPROVED");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
