/**
 * Generated Test Contract — Aegis V2.3 Project 2 Phase 5.3
 *
 * Defines deterministic, machine-neutral contracts for in-project automated test generation:
 * - TestCaseSpec: Behavior under test, target file, test type, preconditions, actions, assertions
 * - GeneratedTestPlan: Complete deterministic test execution plan and dependency requirements
 * - GeneratedTestManifest: Output manifest of synthesized test files and quality audit metrics
 * - TestValidationReport: Result of in-project test discovery, execution, and anti-cheating validation
 */

export type GeneratedTestType = "unit" | "component" | "integration" | "api" | "service";

export interface GeneratedTestCaseSpec {
  testId: string;
  target: string;
  testType: GeneratedTestType;
  sourceFile: string;
  behavior: string;
  expectedOutcome: string;
  testFile: string;
}

export interface GeneratedTestPlan {
  planHash: string;
  targetDomain: string;
  primaryEntity: string;
  testCases: GeneratedTestCaseSpec[];
  requiredDependencies: Record<string, string>;
  configurationFiles: string[];
}

export interface TestQualityAudit {
  totalAssertions: number;
  hasTrivialTests: boolean;
  trivialViolations: string[];
  realAssertionCount: number;
  passed: boolean;
}

export interface InProjectGeneratedTestManifest {
  status: "PASS" | "FAIL" | "NOT_APPLICABLE";
  framework: "vitest" | "none";
  planHash: string;
  generatedFiles: string[];
  testCases: GeneratedTestCaseSpec[];
  featureCoverage: Record<string, string[]>;
  qualityReport: TestQualityAudit;
}

export interface GeneratedTestValidationReport {
  status: "PASS" | "FAIL" | "NOT_APPLICABLE" | "SKIPPED";
  framework: string;
  totalTestFiles: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  durationMs: number;
  failedTestNames: string[];
  qualityAudit: TestQualityAudit;
  output: string;
}
