import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FrontendApprovalCheckpoint } from "../frontend-approval-checkpoint.js";
import { StageStateMachine } from "../stage-state-machine.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { DeterministicProjectFixer } from "../../validation/deterministic-project-fixer.js";

describe("Fail-Closed Governance & Pipeline Integrity Scenarios", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-fail-closed-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
    mkdirSync(join(testDir, "src", "pages"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {}
    }
  });

  describe("Scenario A: Frontend Approval Fail-Closed Invariant", () => {
    it("strictly blocks approval eligibility when browserReview.passed is false", () => {
      const mockReview: any = {
        passed: false,
        failureReason: "Visual review mismatch: routes failed render check",
        serverReady: true,
        renderedElementsCount: 45,
        fatalConsoleErrors: [],
        uncaughtExceptions: [],
        screenshots: {
          desktop: join(testDir, ".aegis", "desktop.png"),
          tablet: join(testDir, ".aegis", "tablet.png"),
          mobile: join(testDir, ".aegis", "mobile.png"),
        },
      };

      // Write mock screenshots of valid size
      for (const vp of ["desktop", "tablet", "mobile"]) {
        writeFileSync(join(testDir, ".aegis", `${vp}.png`), Buffer.alloc(2048));
      }

      const eligibility = FrontendApprovalCheckpoint.checkEligibility(testDir, mockReview);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.blockers.some(b => b.includes("Mandatory frontend review failed"))).toBe(true);
    });

    it("strictly blocks approval eligibility when individual route reviews fail", () => {
      const mockReview: any = {
        passed: false,
        failureReason: "ROUTE_EXPERIENCE_FAILURE",
        routeReviews: [
          { route: "/editorial-sanctuary", passed: false, errors: ["State Mutation Absent"] },
          { route: "/pet-medical-records", passed: false, errors: ["Empty onClick handler"] },
          { route: "/purchase-artisanal-goods", passed: true, errors: [] },
        ],
        serverReady: true,
        renderedElementsCount: 50,
        fatalConsoleErrors: [],
        uncaughtExceptions: [],
        screenshots: {
          desktop: join(testDir, ".aegis", "desktop.png"),
          tablet: join(testDir, ".aegis", "tablet.png"),
          mobile: join(testDir, ".aegis", "mobile.png"),
        },
      };

      for (const vp of ["desktop", "tablet", "mobile"]) {
        writeFileSync(join(testDir, ".aegis", `${vp}.png`), Buffer.alloc(2048));
      }

      const eligibility = FrontendApprovalCheckpoint.checkEligibility(testDir, mockReview);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.blockers.some(b => b.includes("Mandatory route verification failed for 2 route(s)"))).toBe(true);
    });

    it("throws FRONTEND_APPROVAL_BLOCKED when approve() is called on failing review, even with force=true", () => {
      const mockReview: any = {
        passed: false,
        failureReason: "3 routes failed browser verification",
        serverReady: true,
        renderedElementsCount: 30,
        fatalConsoleErrors: [],
        uncaughtExceptions: [],
        screenshots: {},
      };

      expect(() => {
        FrontendApprovalCheckpoint.approve(testDir, mockReview, true);
      }).toThrow(/FRONTEND_APPROVAL_BLOCKED/);

      // Verify no approved checkpoint was written
      const checkpoint = FrontendApprovalCheckpoint.loadCheckpoint(testDir);
      expect(checkpoint?.approvalStatus).not.toBe("APPROVED");
    });
  });

  describe("Scenario B: Stage State Machine Authoritative Invariants", () => {
    it("prevents transition from BLOCKED to APPROVED without passing intermediate checks", () => {
      const sm = new StageStateMachine(testDir);
      sm.block("FRONTEND_VERIFICATION", "Repair budget exhausted with 3 route failures");

      expect(sm.getStageState("FRONTEND_VERIFICATION")).toBe("BLOCKED");

      expect(() => {
        sm.transition("FRONTEND_VERIFICATION", "APPROVED", "Attempted bypass");
      }).toThrow(/INVALID_STAGE_TRANSITION/);
    });

    it("prevents DATABASE_ARCHITECTURE from starting when FRONTEND_APPROVAL is not APPROVED or PASSED", () => {
      const sm = new StageStateMachine(testDir);
      sm.block("FRONTEND_APPROVAL", "Blockers present");

      expect(() => {
        sm.transition("DATABASE_ARCHITECTURE", "RUNNING", "Starting Stage 9");
      }).toThrow(/STAGE_PREREQUISITE_FAILED/);
    });

    it("allows DATABASE_ARCHITECTURE to run once FRONTEND_APPROVAL is validly APPROVED", () => {
      const sm = new StageStateMachine(testDir);
      sm.transition("FRONTEND_VERIFICATION", "PASSED");
      sm.transition("FRONTEND_APPROVAL", "APPROVED");

      expect(() => {
        sm.transition("DATABASE_ARCHITECTURE", "RUNNING");
      }).not.toThrow();

      expect(sm.getStageState("DATABASE_ARCHITECTURE")).toBe("RUNNING");
    });
  });

  describe("Scenario C: Homepage Role Alignment & Single Source of Truth", () => {
    it("assigns root '/' to authoritative primaryLandingFeature and does NOT let StaffDashboard take '/'", () => {
      writeFileSync(
        join(testDir, ".aegis", "product-experience-plan.json"),
        JSON.stringify({
          primaryLandingFeature: "Editorial Sanctuary Showcase",
          experiencePattern: "personal-tracker",
        }),
        "utf8"
      );

      writeFileSync(join(testDir, "src", "pages", "EditorialSanctuary.tsx"), `export default function EditorialSanctuary() { return <div>Sanctuary</div>; }`, "utf8");
      writeFileSync(join(testDir, "src", "pages", "StaffDashboard.tsx"), `export default function StaffDashboard() { return <div>Staff</div>; }`, "utf8");
      writeFileSync(join(testDir, "src", "pages", "PetMedicalRecords.tsx"), `export default function PetMedicalRecords() { return <div>Medical</div>; }`, "utf8");

      const contract: any = {
        primaryLandingFeature: "Editorial Sanctuary Showcase",
        requiredRoutes: ["/", "/editorial-sanctuary", "/staff-dashboard", "/pet-medical-records"],
      };

      const routesContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(testDir, contract);

      // Root route must point to EditorialSanctuary, NEVER StaffDashboard
      expect(routesContent).toMatch(/<Route\s+path="\/"\s+element={<EditorialSanctuary\s*\/>}\s*\/>/);
      expect(routesContent).not.toMatch(/<Route\s+path="\/"\s+element={<StaffDashboard\s*\/>}\s*\/>/);
    });

    it("DeterministicProjectFixer respects primaryLandingFeature and handles Page suffix variation", () => {
      writeFileSync(
        join(testDir, ".aegis", "domain-contract.json"),
        JSON.stringify({
          entities: ["Pet", "MedicalRecord"],
        }),
        "utf8"
      );

      writeFileSync(join(testDir, "src", "pages", "EditorialSanctuary.tsx"), `export default function EditorialSanctuary() { return <div>Sanctuary</div>; }`, "utf8");
      writeFileSync(join(testDir, "src", "pages", "StaffDashboard.tsx"), `export default function StaffDashboard() { return <div>Staff</div>; }`, "utf8");

      const contract: any = {
        prompt: "Build a luxury pet sanctuary and boutique",
        primaryLandingFeature: "Editorial Sanctuary Showcase",
        requiredFeatures: ["Editorial Sanctuary Showcase", "Staff Management"],
        requiredRoutes: ["/editorial-sanctuary", "/staff-dashboard"],
      };

      const domainSpec = DeterministicProjectFixer.deriveDomainSpec(testDir, contract);
      (domainSpec as any).primaryLandingFeature = "Editorial Sanctuary Showcase";

      const routes = (DeterministicProjectFixer as any).generateRoutesContent(domainSpec, testDir);

      expect(routes).toMatch(/<Route\s+path="\/"\s+element={<EditorialSanctuary\s*\/>}\s*\/>/);
      expect(routes).not.toMatch(/<Route\s+path="\/"\s+element={<StaffDashboard\s*\/>}\s*\/>/);
    });
  });

  describe("Scenario D: Auth Middleware Syntax Healing", () => {
    it("heals invalid 'const decoded = if (...)' pattern if found in middleware", () => {
      const middlewareDir = join(testDir, "server", "middleware");
      mkdirSync(middlewareDir, { recursive: true });

      const corruptedCode = `
import jwt from "jsonwebtoken";
export function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.split(" ")[1];
  try {
    const decoded = if (token === 'test_token' || process.env.NODE_ENV === 'test') { return { id: 1, role: 'admin' }; }
jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
      `;
      writeFileSync(join(middlewareDir, "auth.ts"), corruptedCode, "utf8");

      // Run sanitizer on project
      FastDeterministicSanitizer.sanitizeProject(testDir);

      const cleaned = readFileSync(join(middlewareDir, "auth.ts"), "utf8");
      expect(cleaned).not.toContain("const decoded = if (");
      expect(cleaned).toContain("jwt.verify(");
    });
  });
});
