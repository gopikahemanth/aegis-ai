import { describe, it, expect } from "vitest";
import { PromptManager } from "../../prompts/prompt-manager.js";
import { FrontendApprovalCheckpoint } from "../frontend-approval-checkpoint.js";
import { FrontendFilePolicyGuard } from "../frontend-file-policy.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Frontend-First Architecture & Hard Boundary Gates", () => {
  it("TEST 1: Planner Prompt enforces Frontend-Only vs Post-Approval Backend", () => {
    const pm = new PromptManager();

    // Frontend stage
    const frontendPrompt = pm.getPlannerPrompt(undefined, "frontend");
    expect(frontendPrompt).toContain("AEGIS FRONTEND-FIRST TASK PLANNER");
    expect(frontendPrompt).toContain("ABSOLUTE PROHIBITIONS");
    expect(frontendPrompt).toContain("Do NOT generate any task involving: Prisma, database");
    expect(frontendPrompt).toContain("Do NOT generate any task involving: Express, server");

    // Backend stage
    const backendPrompt = pm.getPlannerPrompt(undefined, "backend");
    expect(backendPrompt).toContain("AEGIS POST-APPROVAL BACKEND TASK PLANNER");
    expect(backendPrompt).toContain("The frontend has been reviewed and APPROVED by the human user");
    expect(backendPrompt).toContain("Plan ONLY backend, database, and integration tasks");
  });

  it("TEST 2: FrontendFilePolicyGuard blocks server/prisma files during frontend tasks", () => {
    const frontendFiles = [
      { path: "src/App.tsx", content: "export default function App() { return <div>App</div>; }" },
      { path: "src/components/Navbar.tsx", content: "export function Navbar() { return <nav />; }" },
      { path: "server/index.ts", content: "import express from 'express';" },
      { path: "prisma/schema.prisma", content: "datasource db { provider = 'postgresql' }" },
    ];

    const result = FrontendFilePolicyGuard.enforce(frontendFiles as any, "Frontend Scaffold Task");
    expect(result.hadViolations).toBe(true);
    expect(result.allowed.map(f => f.path)).toEqual(["src/App.tsx", "src/components/Navbar.tsx"]);
    expect(result.rejected.map(f => f.path)).toContain("server/index.ts");
    expect(result.rejected.map(f => f.path)).toContain("prisma/schema.prisma");
  });

  it("TEST 3: Approval Manifest .aegis/frontend-approval.json is strictly gated", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-boundary-test-"));
    const aegisDir = join(tempDir, ".aegis");
    const screenshotDir = join(aegisDir, "screenshots");
    mkdirSync(screenshotDir, { recursive: true });

    try {
      // Before approval, approval manifest does not exist
      expect(FrontendApprovalCheckpoint.loadApprovalManifest(tempDir)).toBeNull();
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(false);

      const desktop = join(screenshotDir, "desktop.png");
      const tablet = join(screenshotDir, "tablet.png");
      const mobile = join(screenshotDir, "mobile.png");

      const dummyPng = Buffer.alloc(2048, 0xaa);
      writeFileSync(desktop, dummyPng);
      writeFileSync(tablet, dummyPng);
      writeFileSync(mobile, dummyPng);

      // Save initial review
      FrontendApprovalCheckpoint.saveReview(tempDir, {
        appName: "Kazzoo Playworld",
        pages: ["Home", "Explorer", "Soundboard"],
        routes: ["/", "/explorer", "/soundboard"],
        colorPalette: { primary: "#f59e0b", background: "#1c1917", surface: "#292524", text: "#fafaf9" },
        typography: { fontFamily: "Inter", scale: ["14px", "16px"] },
        interactionsVerified: ["Soundboard note toggle", "Explorer node drag"],
        screenshots: { desktop, tablet, mobile },
        status: "PENDING",
      });

      const browserReview = {
        passed: true,
        serverReady: true,
        url: "http://localhost:5173",
        screenshots: { desktop, tablet, mobile },
        fatalConsoleErrors: [],
        uncaughtExceptions: [],
        renderedElementsCount: 42,
      };

      // Invariant: Approve writes both stage-checkpoint and frontend-approval.json
      FrontendApprovalCheckpoint.approve(tempDir, browserReview);
      expect(FrontendApprovalCheckpoint.isApproved(tempDir)).toBe(true);

      const manifest = FrontendApprovalCheckpoint.loadApprovalManifest(tempDir);
      expect(manifest).not.toBeNull();
      expect(manifest?.approved).toBe(true);
      expect(manifest?.approvedBy).toBe("human");
      expect(manifest?.status).toBe("APPROVED");
      expect(manifest?.frontendVersionHash).toBeDefined();
      expect(manifest?.approvedRoutes).toEqual(["/", "/explorer", "/soundboard"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("TEST 4: FastDeterministicSanitizer idempotency (running twice produces identical files without duplicates)", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-sanitizer-idempotent-"));
    const srcDir = join(tempDir, "src");
    const sharedCompDir = join(srcDir, "shared", "components");
    mkdirSync(sharedCompDir, { recursive: true });

    try {
      const cardPath = join(sharedCompDir, "Card.tsx");
      writeFileSync(cardPath, `import React from "react";
export const Card: React.FC<any> = ({ children }: any) => <div>{children}</div>;
export default Card;
`, "utf8");

      // First sanitize
      FastDeterministicSanitizer.sanitizeProject(tempDir, {
        specification: { name: "test-app", frontend: "React-Vite" } as any,
      });
      const firstRunCard = readFileSync(cardPath, "utf8");

      // Verify no duplicate exports created
      const defaultExportMatches = firstRunCard.match(/\bexport\s+default\b/g) || [];
      expect(defaultExportMatches.length).toBe(1);

      // Second sanitize (idempotency check)
      FastDeterministicSanitizer.sanitizeProject(tempDir, {
        specification: { name: "test-app", frontend: "React-Vite" } as any,
      });
      const secondRunCard = readFileSync(cardPath, "utf8");

      // Output must be 100% identical
      expect(secondRunCard).toBe(firstRunCard);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
