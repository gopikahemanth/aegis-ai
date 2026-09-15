/**
 * GeneratedTestPlanner — Aegis V2.3 Project 2 Phase 5.3
 *
 * Deterministically plans executable application test requirements based on:
 * - Domain entities and schema definitions
 * - Discovered source components, feature modules, and services
 * - Computes canonical planHash with ZERO timestamps, random IDs, or machine paths.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { DomainContract } from "../governance/domain-contract.js";
import type { GeneratedTestCaseSpec, GeneratedTestPlan } from "./generated-test-contract.js";

export class GeneratedTestPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans test specifications deterministically from project metadata and source tree.
   */
  public plan(domainContract?: DomainContract): GeneratedTestPlan {
    const domainName = domainContract?.domainName || "Application";
    const primaryEntity =
      domainContract?.entities?.find((e) => e.kind === "domain")?.name ||
      domainContract?.entities?.[0]?.name ||
      "Expense";

    const testCases: GeneratedTestCaseSpec[] = [];

    // 1. Business Logic / Unit Tests
    testCases.push({
      testId: "tc_business_total_calc",
      target: "business-logic",
      testType: "unit",
      sourceFile: "src/utils/calculations.ts",
      behavior: `calculates aggregate totals and category summaries for ${primaryEntity} collection`,
      expectedOutcome: "Sum of amounts matches arithmetic total and category buckets are populated",
      testFile: "src/__tests__/business-logic.test.ts",
    });

    testCases.push({
      testId: "tc_business_filtering",
      target: "business-logic",
      testType: "unit",
      sourceFile: "src/utils/filter.ts",
      behavior: `filters ${primaryEntity} collection by search keyword and category`,
      expectedOutcome: "Returns exact subset matching query without side effects",
      testFile: "src/__tests__/business-logic.test.ts",
    });

    testCases.push({
      testId: "tc_business_validation",
      target: "business-logic",
      testType: "unit",
      sourceFile: "src/utils/validation.ts",
      behavior: `validates required ${primaryEntity} fields, positive amounts, and date strings`,
      expectedOutcome: "Rejects invalid inputs and passes conforming objects",
      testFile: "src/__tests__/business-logic.test.ts",
    });

    // 2. Component / UI Tests
    testCases.push({
      testId: "tc_app_main_render",
      target: "App",
      testType: "component",
      sourceFile: "src/App.tsx",
      behavior: "renders main dashboard layout, navigation, and summary containers",
      expectedOutcome: "Container mounts with interactive controls and non-empty DOM elements",
      testFile: "src/__tests__/app-flow.test.tsx",
    });

    testCases.push({
      testId: "tc_button_interaction",
      target: "Button",
      testType: "component",
      sourceFile: "src/design-system/components/Button.tsx",
      behavior: "handles click events and respects disabled attribute",
      expectedOutcome: "Fires onClick callback when active; blocks execution when disabled",
      testFile: "src/__tests__/component-interaction.test.tsx",
    });

    // 3. Service / API Tests
    testCases.push({
      testId: "tc_service_crud_methods",
      target: "apiClient",
      testType: "service",
      sourceFile: "src/services/api.ts",
      behavior: "exposes CRUD methods (getAll, get, create, update, remove) conforming to API contract",
      expectedOutcome: "All service methods return promises and resolve expected data structures",
      testFile: "src/__tests__/service-contract.test.ts",
    });

    const hasServer = existsSync(join(this.projectRoot, "server"));
    if (hasServer) {
      testCases.push({
        testId: "tc_api_health_schema",
        target: "server",
        testType: "api",
        sourceFile: "server/index.ts",
        behavior: `validates ${primaryEntity} backend schema integrity and query parameter parsing`,
        expectedOutcome: "Schema model contains expected fields and query parsers safely handle edge cases",
        testFile: "server/__tests__/api-health.test.ts",
      });
    }

    // Sort test cases deterministically by testId
    testCases.sort((a, b) => a.testId.localeCompare(b.testId));

    const requiredDependencies: Record<string, string> = {
      vitest: "^1.6.0",
      "@testing-library/react": "^15.0.0",
      "@testing-library/jest-dom": "^6.4.0",
      "@testing-library/user-event": "^14.5.0",
      jsdom: "^24.0.0",
    };

    const configurationFiles = ["vitest.config.ts", "test/setup.ts"];

    // Compute canonical planHash
    const canonicalPayload = JSON.stringify({
      domainName,
      primaryEntity,
      testCases: testCases.map((tc) => ({
        id: tc.testId,
        type: tc.testType,
        behavior: tc.behavior,
        testFile: tc.testFile,
      })),
      dependencies: Object.keys(requiredDependencies).sort(),
      config: configurationFiles.sort(),
    });

    const planHash = createHash("sha256").update(canonicalPayload).digest("hex");

    return {
      planHash,
      targetDomain: domainName,
      primaryEntity,
      testCases,
      requiredDependencies,
      configurationFiles,
    };
  }
}
