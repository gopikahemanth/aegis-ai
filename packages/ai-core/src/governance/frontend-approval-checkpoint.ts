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

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type ApprovalStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface FrontendReviewSummary {
  appName: string;
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

  static approve(outputDirectory: string): void {
    const review = this.loadReview(outputDirectory);
    if (review) {
      review.status = "APPROVED";
      review.reviewedAt = new Date().toISOString();
      this.saveReview(outputDirectory, review);
    } else {
      const aegisDir = join(outputDirectory, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
      const checkpoint: StageCheckpoint = {
        currentStage: "FRONTEND_APPROVED",
        approvalStatus: "APPROVED",
        lastUpdated: new Date().toISOString(),
        changeHistory: [],
      };
      writeFileSync(this.getCheckpointPath(outputDirectory), JSON.stringify(checkpoint, null, 2), "utf8");
    }
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
