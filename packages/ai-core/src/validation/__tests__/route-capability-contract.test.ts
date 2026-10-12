import { describe, it, expect } from "vitest";
import { ReadOnlyBrowserValidator } from "../read-only-browser-validator.js";
import type { PrimaryRouteCapabilityContract } from "../../governance/architecture-contract.js";

describe("PrimaryRouteCapabilityContract & Strict Behavioral Verification", () => {
  // Helper to create a mock Puppeteer page with customizable state before and after click
  function createMockPage(config: {
    candidates: Array<{ text: string; role?: string; tag?: string }>;
    initialDomText: string;
    initialSelected?: string;
    initialBadgeText?: string;
    onCandidateClicked?: (candidateText: string) => {
      postDomText: string;
      postSelected?: string;
      postBadgeText?: string;
    };
  }) {
    let clickedCandidate: string | null = null;
    let evalNoArgCount = 0;

    return {
      evaluate: async (fn: any, arg?: any) => {
        // 1. Click action (has candidate.text as argument)
        if (arg !== undefined) {
          clickedCandidate = String(arg);
          return true;
        }

        evalNoArgCount++;
        // 2. Initial discovery (first call with no argument)
        if (evalNoArgCount === 1) {
          return {
            candidates: config.candidates.map((c, idx) => ({
              index: idx,
              text: c.text,
              tag: c.tag || "button",
              role: c.role || "",
            })),
            initialDomText: config.initialDomText,
            initialSelected: config.initialSelected || "",
            initialBadgeText: config.initialBadgeText || "",
          };
        }

        // 3. Post-click inspection (subsequent call with no argument)
        if (clickedCandidate && config.onCandidateClicked) {
          const res = config.onCandidateClicked(clickedCandidate);
          return {
            domText: res.postDomText,
            selected: res.postSelected || "",
            badgeText: res.postBadgeText || "",
          };
        }

        return {
          domText: config.initialDomText,
          selected: config.initialSelected || "",
          badgeText: config.initialBadgeText || "",
        };
      },
    };
  }

  const validContract: PrimaryRouteCapabilityContract = {
    route: "/telescope-instruments",
    capabilityId: "telescope_calibration",
    capabilityName: "Sensor Array Recalibration",
    trigger: {
      labelPattern: "Calibrate Sensor Array|Recalibrate Optics",
      actionType: "click",
    },
    expectedStateChange: "Phase-locked wavefront error recalculated and badge updated to CALIBRATED",
    observableResult: {
      badgeStatusPattern: "CALIBRATED|LOCKED",
      domTextPattern: "RMS Error: 0.038λ|Phase Locked",
      stateChangeType: "BADGE_STATUS_TRANSITION",
    },
    requiresPersistence: false,
  };

  // ── Scenario 1: Correct trigger produces expected state change -> PASS ──────
  it("Scenario 1: PASS when correct trigger produces expected state change and satisfies contract", async () => {
    const page = createMockPage({
      candidates: [
        { text: "Overview Tab" },
        { text: "Calibrate Sensor Array" },
      ],
      initialDomText: "Telescope status: Idle",
      initialBadgeText: "UNLOCKED",
      onCandidateClicked: (cand) => {
        if (cand === "Calibrate Sensor Array") {
          return {
            postDomText: "Telescope status: Phase Locked (RMS Error: 0.038λ)",
            postBadgeText: "CALIBRATED",
          };
        }
        return {
          postDomText: "Overview details displayed",
          postBadgeText: "UNLOCKED",
        };
      },
    });

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/telescope-instruments",
      validContract,
      { strictMode: true }
    );

    expect(result.passed).toBe(true);
    expect(result.contractVerified).toBe(true);
    expect(result.contractCapability).toBe("Sensor Array Recalibration");
    expect(result.trigger).toBe("Calibrate Sensor Array");
  });

  // ── Scenario 2: Generic tab changes, but primary capability does not -> FAIL ──
  it("Scenario 2: FAIL when generic tab changes but primary capability contract is not exercised", async () => {
    const page = createMockPage({
      candidates: [
        { text: "Secondary Tab Alpha" },
        { text: "Generic Settings" },
      ],
      initialDomText: "Initial Page Body",
      initialSelected: "Tab1",
      onCandidateClicked: (cand) => {
        return {
          postDomText: "Tab Alpha Content Rendered",
          postSelected: "Tab2",
        };
      },
    });

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/telescope-instruments",
      validContract,
      { strictMode: true }
    );

    expect(result.passed).toBe(false);
    expect(result.contractVerified).toBe(false);
    expect(result.error).toContain("trigger pattern");
  });

  // ── Scenario 3: Trigger exists, but expected result is absent -> FAIL ────────
  it("Scenario 3: FAIL when contract trigger is clicked but expected state change is absent in DOM", async () => {
    const page = createMockPage({
      candidates: [
        { text: "Calibrate Sensor Array" },
      ],
      initialDomText: "Telescope status: Idle",
      initialBadgeText: "UNLOCKED",
      onCandidateClicked: () => {
        // Button clicked, but produced completely unrelated text or passive no-op
        return {
          postDomText: "Telescope status: Idle", // No change!
          postBadgeText: "UNLOCKED",
        };
      },
    });

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/telescope-instruments",
      validContract,
      { strictMode: true }
    );

    expect(result.passed).toBe(false);
    expect(result.contractVerified).toBe(false);
    expect(result.error).toContain("failed");
  });

  // ── Scenario 4: Primary route has no capability contract in strict mode -> FAIL ─
  it("Scenario 4: FAIL/NOT_VERIFIED when canonical route has no contract in strict certification mode", async () => {
    const page = createMockPage({
      candidates: [
        { text: "Random Button" },
      ],
      initialDomText: "Some Content",
      onCandidateClicked: () => ({ postDomText: "Changed Content" }),
    });

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/uncontracted-route",
      undefined, // Missing contract
      { strictMode: true } // Strict certification mode
    );

    expect(result.passed).toBe(false);
    expect(result.contractVerified).toBe(false);
    expect(result.error).toContain("STRICT_CERTIFICATION_FAILURE");
  });

  // ── Scenario 5: Persistence is required but database verification is missing -> FAIL ─
  it("Scenario 5: FAIL when capability requires persistence but database mutation verification is missing", async () => {
    const persistentContract: PrimaryRouteCapabilityContract = {
      route: "/observation-events",
      capabilityId: "reserve_pass",
      capabilityName: "Reserve Summit Pass",
      trigger: {
        labelPattern: "Reserve Summit Pass",
        actionType: "click",
      },
      expectedStateChange: "Pass reservation confirmed and persisted to Postgres",
      observableResult: {
        badgeStatusPattern: "CONFIRMED|RESERVED",
        domTextPattern: "Passcode: OBS-",
      },
      requiresPersistence: true,
      persistenceVerification: {
        endpoint: "/api/observation-events/reserve",
        method: "POST",
        expectedStatus: 201,
        expectedDbMutation: true,
      },
    };

    const page = createMockPage({
      candidates: [
        { text: "Reserve Summit Pass" },
      ],
      initialDomText: "Available: 50 seats",
      initialBadgeText: "OPEN",
      onCandidateClicked: () => ({
        postDomText: "Available: 49 seats. Passcode: OBS-9812 Issued",
        postBadgeText: "CONFIRMED",
      }),
    });

    // Mock API report where DB mutation was NOT confirmed (0 mutations verified)
    const mockUnpersistedApiReport = {
      passed: true,
      mutationsVerified: 0,
      results: [
        {
          step: { path: "/api/observation-events/reserve", method: "POST" },
          passed: true,
          dbMutationConfirmed: false, // Mutation not confirmed in DB!
        },
      ],
    };

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/observation-events",
      persistentContract,
      {
        strictMode: true,
        apiReport: mockUnpersistedApiReport,
      }
    );

    expect(result.passed).toBe(false);
    expect(result.contractVerified).toBe(false);
    expect(result.persistenceRequired).toBe(true);
    expect(result.error).toContain("PERSISTENCE_VERIFICATION_FAILURE");
  });

  // ── Scenario 6: API mutation succeeds and DB read-back confirms it -> PASS ───
  it("Scenario 6: PASS when API mutation succeeds, DB read-back confirms persistence, and DOM reflects change", async () => {
    const persistentContract: PrimaryRouteCapabilityContract = {
      route: "/observation-events",
      capabilityId: "reserve_pass",
      capabilityName: "Reserve Summit Pass",
      trigger: {
        labelPattern: "Reserve Summit Pass",
        actionType: "click",
      },
      expectedStateChange: "Pass reservation confirmed and persisted to Postgres",
      observableResult: {
        badgeStatusPattern: "CONFIRMED|RESERVED",
        domTextPattern: "Passcode: OBS-",
      },
      requiresPersistence: true,
      persistenceVerification: {
        endpoint: "/api/observation-events/reserve",
        method: "POST",
        expectedStatus: 201,
        expectedDbMutation: true,
      },
    };

    const page = createMockPage({
      candidates: [
        { text: "Reserve Summit Pass" },
      ],
      initialDomText: "Available: 50 seats",
      initialBadgeText: "OPEN",
      onCandidateClicked: () => ({
        postDomText: "Available: 49 seats. Passcode: OBS-9812 Issued",
        postBadgeText: "CONFIRMED",
      }),
    });

    // Mock API report where DB read-back mutation WAS confirmed
    const mockPersistedApiReport = {
      passed: true,
      mutationsVerified: 1,
      results: [
        {
          step: { path: "/api/observation-events/reserve", method: "POST" },
          passed: true,
          dbMutationConfirmed: true, // DB Read-back confirmed!
        },
      ],
    };

    const result = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
      page,
      "/observation-events",
      persistentContract,
      {
        strictMode: true,
        apiReport: mockPersistedApiReport,
      }
    );

    expect(result.passed).toBe(true);
    expect(result.contractVerified).toBe(true);
    expect(result.persistenceRequired).toBe(true);
    expect(result.contractCapability).toBe("Reserve Summit Pass");
  });
});
