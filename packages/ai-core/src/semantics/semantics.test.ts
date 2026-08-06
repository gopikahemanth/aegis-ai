import { SpecificationNormalizer } from "../spec/canonical-spec.js";
import { DomainAwareFallbackGenerator } from "./domain-fallback-generator.js";
import { ValidationStateManager } from "../validation/validation-state.js";

export function runSemanticsTests() {
  console.log("[Test Suite] Running Aegis Semantics Regression Tests...");

  // Test 1: Expense Tracker Prompt Normalization
  const spec1 = SpecificationNormalizer.normalize(
    "Build a fullstack Personal Expense Tracker web application with React, Express, Prisma SQLite, transactions and budgets",
    { name: "expense-tracker", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }
  );

  if (spec1.domainCategory !== "expense-tracker") {
    throw new Error(`Test 1 Failed: Expected domainCategory 'expense-tracker', got '${spec1.domainCategory}'`);
  }
  if (!spec1.forbiddenPatterns.includes("Kanban")) {
    throw new Error("Test 1 Failed: Expected 'Kanban' in forbiddenPatterns");
  }
  console.log("✓ Test 1 Passed: Expense Tracker prompt correctly locks domain and forbidden patterns.");

  // Test 2: Domain-Aware Fallback Component Generation
  const fallback = DomainAwareFallbackGenerator.generateFallbackComponent(spec1, "DashboardPage", "src/pages/DashboardPage.tsx");
  if (fallback.includes("Kanban") || fallback.includes("To Do")) {
    throw new Error("Test 2 Failed: Fallback UI contained forbidden Kanban components");
  }
  if (!fallback.includes("Personal Expense Tracker") || !fallback.includes("Recent Transactions")) {
    throw new Error("Test 2 Failed: Fallback UI missing Expense Tracker features");
  }
  console.log("✓ Test 2 Passed: DomainAwareFallbackGenerator dynamically generates domain-correct UI.");

  // Test 3: Validation State Manager Stale Build Overwrite
  const manager = ValidationStateManager.getInstance();
  manager.recordBuild(false, "Stale build error");
  manager.recordBuild(true);

  if (!manager.getState().latestBuildSuccess) {
    throw new Error("Test 3 Failed: ValidationStateManager did not overwrite stale build failure");
  }
  console.log("✓ Test 3 Passed: ValidationStateManager clears stale build errors after successful rebuild.");

  console.log("[Test Suite] All Aegis Semantics Regression Tests PASSED successfully!");
}
