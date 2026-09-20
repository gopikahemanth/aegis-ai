/**
 * FrontendApprovalCheckpoint
 *
 * Manages the interactive approval checkpoint between Frontend-only generation
 * and Database/Backend generation.
 *
 * Stores structured review artifacts in:
 * - `.aegis/frontend-review.json` (visual and interaction metadata, screenshot references)
 * - `.aegis/stage-checkpoint.json` (stage transition state and approval status)
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { FrontendBrowserReview } from "../validation/read-only-browser-validator.js";

export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface ApprovalEligibility {
  eligible: boolean;
  blockers: string[];
}

export interface FrontendReviewSummary {
  appName: string;
  serverUrl?: string;
  pages: string[];
  routes: string[];
  colorPalette: {
    primary: string;
    secondary?: string;
    background: string;
    surface: string;
    text: string;
  };
  typography: {
    fontFamily: string;
    scale: string[];
  };
  interactionsVerified: string[];
  screenshots: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
  };
  renderedElementsCount?: number;
  fatalConsoleErrors?: string[];
  uncaughtExceptions?: string[];
  reviewPassed?: boolean;
  productIdentity?: import("../validation/read-only-browser-validator.js").ProductIdentityResult;
  status: ApprovalStatus;
  userFeedback?: string;
  reviewedAt?: string;
}

export interface StageCheckpoint {
  currentStage:
    | "FRONTEND_COMPLETE"
    | "AWAITING_FRONTEND_APPROVAL"
    | "FRONTEND_APPROVED"
    | "DATABASE_VERIFIED"
    | "BACKEND_VERIFIED"
    | "INTEGRATION_COMPLETE"
    | "CERTIFIED";
  approvalStatus: ApprovalStatus;
  lastUpdated: string;
  changeHistory: Array<{
    timestamp: string;
    feedback: string;
  }>;
}

export class FrontendApprovalCheckpoint {
  private static getReviewPath(outputDirectory: string): string {
    return join(outputDirectory, ".aegis", "frontend-review.json");
  }

  private static getCheckpointPath(outputDirectory: string): string {
    return join(outputDirectory, ".aegis", "stage-checkpoint.json");
  }

  static saveReview(outputDirectory: string, summary: FrontendReviewSummary): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(this.getReviewPath(outputDirectory), JSON.stringify(summary, null, 2), "utf8");

    // Also sync stage checkpoint
    const existing = this.loadCheckpoint(outputDirectory);
    const checkpoint: StageCheckpoint = {
      currentStage: summary.status === "APPROVED" ? "FRONTEND_APPROVED" : "AWAITING_FRONTEND_APPROVAL",
      approvalStatus: summary.status,
      lastUpdated: new Date().toISOString(),
      changeHistory: existing ? existing.changeHistory : [],
    };
    if (summary.userFeedback) {
      checkpoint.changeHistory.push({
        timestamp: new Date().toISOString(),
        feedback: summary.userFeedback,
      });
    }
    writeFileSync(this.getCheckpointPath(outputDirectory), JSON.stringify(checkpoint, null, 2), "utf8");
  }

  static loadReview(outputDirectory: string): FrontendReviewSummary | null {
    const path = this.getReviewPath(outputDirectory);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as FrontendReviewSummary;
    } catch {
      return null;
    }
  }

  static loadCheckpoint(outputDirectory: string): StageCheckpoint | null {
    const path = this.getCheckpointPath(outputDirectory);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as StageCheckpoint;
    } catch {
      return null;
    }
  }

  static checkEligibility(
    outputDirectory: string,
    browserReview?: FrontendBrowserReview | null
  ): ApprovalEligibility {
    const blockers: string[] = [];
    const persisted = this.loadReview(outputDirectory);

    if (browserReview) {
      if (!browserReview.serverReady) blockers.push("Frontend dev server is not ready or unreachable");
      if (browserReview.renderedElementsCount < 10) blockers.push(`Page appears blank (DOM elements: ${browserReview.renderedElementsCount} < 10)`);
      if (browserReview.fatalConsoleErrors.length > 0) blockers.push(`Fatal console errors present: ${browserReview.fatalConsoleErrors.join("; ")}`);
      if (browserReview.uncaughtExceptions.length > 0) blockers.push(`Uncaught exceptions present: ${browserReview.uncaughtExceptions.join("; ")}`);
      if (!browserReview.passed) blockers.push(browserReview.failureReason || "Chromium visual review did not pass");
      if (browserReview.productIdentity && !browserReview.productIdentity.passed) {
        blockers.push(...browserReview.productIdentity.mismatchReasons);
      }
    }

    const screenshots = browserReview?.screenshots || persisted?.screenshots || {};
    const viewports = ["desktop", "tablet", "mobile"] as const;
    for (const vp of viewports) {
      const filePath = screenshots[vp];
      if (!filePath || !existsSync(filePath)) {
        blockers.push(`Required screenshot for ${vp} is missing on disk`);
      } else {
        try {
          if (statSync(filePath).size < 1000) {
            blockers.push(`Screenshot for ${vp} is invalid (file size < 1KB)`);
          }
        } catch {
          blockers.push(`Could not verify screenshot for ${vp}`);
        }
      }
    }

    return {
      eligible: blockers.length === 0,
      blockers,
    };
  }

  static approve(outputDirectory: string, browserReview?: FrontendBrowserReview | null): void {
    const eligibility = this.checkEligibility(outputDirectory, browserReview);
    if (!eligibility.eligible) {
      throw new Error(`FRONTEND_APPROVAL_BLOCKED: Cannot approve frontend. Approval criteria not satisfied:\n  - ${eligibility.blockers.join("\n  - ")}`);
    }

    // Compute a cryptographic hash of the current frontend source files.
    // This hash is stored in the approval record and verified at Stage 9 to detect
    // any mutation of the frontend after human approval.
    let frontendSourceHash = "unknown";
    try {
      const { createHash } = require("node:crypto");
      const { readdirSync, statSync, readFileSync: readFS } = require("node:fs");
      const { join: joinPath } = require("node:path");

      const srcDir = joinPath(outputDirectory, "src");
      if (existsSync(srcDir)) {
        const hash = createHash("sha256");
        const collectFiles = (dir: string): void => {
          for (const entry of readdirSync(dir)) {
            const fullPath = joinPath(dir, entry);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              collectFiles(fullPath);
            } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry)) {
              hash.update(entry);
              hash.update(readFS(fullPath, "utf8"));
            }
          }
        };
        collectFiles(srcDir);
        frontendSourceHash = hash.digest("hex").slice(0, 16);
      }
    } catch {
      // Non-fatal — hash computation failure doesn't block approval
    }

    const review = this.loadReview(outputDirectory);
    const approvalTimestamp = new Date().toISOString();

    if (review) {
      review.status = "APPROVED";
      review.reviewedAt = approvalTimestamp;
      this.saveReview(outputDirectory, review);
    }

    // Write the extended approval record to stage-checkpoint.json
    // This is the HUMAN_FRONTEND_APPROVED=true record that Stage 9 gates on.
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const existing = this.loadCheckpoint(outputDirectory);
    const extendedCheckpoint = {
      currentStage: "FRONTEND_APPROVED" as const,
      approvalStatus: "APPROVED" as const,
      lastUpdated: approvalTimestamp,
      changeHistory: existing?.changeHistory ?? [],
      // Human approval record — cryptographically tied to the approved frontend
      approvedBy: "human" as const,
      approvalTimestamp,
      frontendSourceHash,
      approvedRoutes: review?.routes ?? [],
      approvedFeatures: (review?.productIdentity as any)?.featureEvidence?.map((f: any) => f.name) ?? [],
    };
    writeFileSync(this.getCheckpointPath(outputDirectory), JSON.stringify(extendedCheckpoint, null, 2), "utf8");
    console.log(
      `[FrontendApproval] ✓ HUMAN_FRONTEND_APPROVED recorded.\n` +
      `  Approved by: human\n` +
      `  Frontend source hash: ${frontendSourceHash}\n` +
      `  Timestamp: ${approvalTimestamp}`
    );
  }

  static requestChanges(outputDirectory: string, feedback: string): void {
    const review = this.loadReview(outputDirectory) || {
      appName: "Generated Application",
      pages: [],
      routes: [],
      colorPalette: { primary: "#000", background: "#fff", surface: "#fff", text: "#000" },
      typography: { fontFamily: "Inter", scale: [] },
      interactionsVerified: [],
      screenshots: {},
      status: "CHANGES_REQUESTED",
      userFeedback: feedback,
      reviewedAt: new Date().toISOString(),
    };
    review.status = "CHANGES_REQUESTED";
    review.userFeedback = feedback;
    review.reviewedAt = new Date().toISOString();
    this.saveReview(outputDirectory, review);
  }

  static isApproved(outputDirectory: string): boolean {
    const checkpoint = this.loadCheckpoint(outputDirectory);
    if (checkpoint && checkpoint.approvalStatus === "APPROVED") return true;
    const review = this.loadReview(outputDirectory);
    return review?.status === "APPROVED";
  }
}
