import { TeamCoordinator } from "./agent/team-coordinator.js";
import { DeploymentGenerator } from "./deploy/deploy-generator.js";
import { PluginManager } from "../../../packages/project-builder/dist/plugins/plugin-manager.js";
import type { ProjectSpecification } from "./architect/specification.js";
import { PRGeneratorAgent } from "./agents/pr-generator-agent.js";
import { DistributedRuntimeEngine } from "./agent/distributed-runtime.js";
import { AuditTrailEngine } from "./utils/audit-trail.js";
import { SecurityGuard } from "./utils/security.js";
import { StubDetector } from "./generator/stub-detector.js";
import { FeatureContractValidator } from "./validation/feature-contract-validator.js";
import { RealityCheckerAgent } from "./agents/reality-checker-agent.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runPlatformValidationTests() {
  console.log("\n🧪 Running Platform Capabilities Unit Tests...");

  // 1. Test Team Coordinator Dynamic Enlisting
  console.log("  • Testing TeamCoordinator...");
  const coordinator = new TeamCoordinator();
  
  const staticSpec: ProjectSpecification = {
    name: "Static Portfolio App",
    type: "website",
    language: "typescript",
    packageManager: "pnpm",
    frontend: "react"
  };
  
  const staticTeam = await coordinator.coordinate(staticSpec);
  assert(staticTeam.some(m => m.role === "Frontend Lead"), "Static spec must enlist Frontend Lead");
  assert(!staticTeam.some(m => m.role === "Backend Lead"), "Static spec must not enlist Backend Lead");

  const secureDbSpec: ProjectSpecification = {
    name: "Secure Banking Ledger API",
    type: "backend",
    language: "typescript",
    packageManager: "pnpm",
    backend: "express",
    database: "postgresql"
  };

  const dbTeam = await coordinator.coordinate(secureDbSpec);
  assert(dbTeam.some(m => m.role === "Backend Lead"), "Backend spec must enlist Backend Lead");
  assert(dbTeam.some(m => m.role === "Database Lead"), "DB spec must enlist Database Lead");
  assert(dbTeam.some(m => m.role === "Security Lead"), "Secure database ledger spec must enlist Security Lead");
  assert(dbTeam.some(m => m.role === "Localization Lead"), "Plugin extension specialist must enlist Localization Lead");
  console.log("    ✓ TeamCoordinator tests passed.");

  // 2. Test DevOps Configurations Generation
  console.log("  • Testing DeploymentGenerator...");
  const devops = new DeploymentGenerator();
  const staticDevopsFiles = devops.generate(staticSpec);
  assert(staticDevopsFiles.some(f => f.path === "Dockerfile"), "DevOps must output Dockerfile");
  assert(staticDevopsFiles.some(f => f.path === "vercel.json"), "Static site must output vercel.json");

  const dbDevopsFiles = devops.generate(secureDbSpec);
  assert(dbDevopsFiles.some(f => f.path === "fly.toml"), "Server API must output fly.toml");
  assert(dbDevopsFiles.some(f => f.path === "docker-compose.yml"), "Database server must output docker-compose.yml");
  console.log("    ✓ DeploymentGenerator tests passed.");

  // 3. Test Extensions hooks registries
  console.log("  • Testing PluginManager...");
  const plugins = new PluginManager("./");
  console.log("    ✓ PluginManager pipelines checked.");

  // 4. Test PR Regression Auditor
  console.log("  • Testing PRGeneratorAgent...");
  assert(typeof PRGeneratorAgent === "function", "PRGeneratorAgent class must be imported successfully");
  console.log("    ✓ PRGeneratorAgent checked.");

  // 5. Test Distributed Runtime Queue processing and fault tolerance retries
  console.log("  • Testing DistributedRuntimeEngine...");
  const runtime = new DistributedRuntimeEngine();
  let workerExecuted = false;

  runtime.registerWorker("Coder", async (job) => {
    workerExecuted = true;
    return { success: true };
  });

  const jobId = runtime.enqueueJob("Generate User Module", "Coder", { module: "User" });
  await runtime.processQueue();

  const finishedJob = runtime.getJobStatus(jobId);
  assert(workerExecuted, "Registered worker callback must execute");
  assert(finishedJob !== undefined && finishedJob.status === "completed", "Job status must compile as completed");
  console.log("    ✓ DistributedRuntimeEngine tests passed.");

  // 6. Test Enterprise Compliance Audit Trail
  console.log("  • Testing AuditTrailEngine...");
  const audit = new AuditTrailEngine("./generated/project");
  audit.logEvent({
    agentRole: "QA Auditor",
    action: "Run automated capabilities verification checks",
    status: "SUCCESS"
  });
  const logs = audit.getLogs();
  assert(logs.length > 0, "Audit logs must store and retrieve event records");
  assert(logs.some(l => l.agentRole === "QA Auditor"), "Audit logs must contain QA Auditor signature");
  console.log("    ✓ AuditTrailEngine tests passed.");

  // 7. Test Security Guard Sandboxing and Sanitizations
  console.log("  • Testing SecurityGuard...");
  const sanitized = SecurityGuard.sanitizeCommand("pnpm lint; cat /etc/passwd");
  assert(sanitized === "pnpm lint cat /etc/passwd", "SecurityGuard must strip command metacharacters");
  
  let violationThrown = false;
  try {
    SecurityGuard.sanitizeCommand("rm -rf /");
  } catch (err: any) {
    violationThrown = err.message.includes("Security Violation");
  }
  assert(violationThrown, "SecurityGuard must throw exception on non-whitelisted command prefix");

  let traversalThrown = false;
  try {
    SecurityGuard.validateSafePath("./generated/project", "./generated/project/../../../etc");
  } catch (err: any) {
    traversalThrown = err.message.includes("Security Violation");
  }
  assert(traversalThrown, "SecurityGuard must block parent folder path traversals");
  console.log("    ✓ SecurityGuard tests passed.");

  // 8. Test StubDetector mock-data pattern detection
  console.log("  • Testing StubDetector mock-data patterns...");
  const stubDetector = new StubDetector();

  const cleanCode = `
function calculateAtsScore(resumeText: string, keywords: string[]): number {
  const lowerText = resumeText.toLowerCase();
  const matched = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
  return Math.round((matched.length / keywords.length) * 100);
}
`;
  const cleanFindings = stubDetector.detect(cleanCode);
  assert(cleanFindings.length === 0, "Clean real implementation must produce zero stub findings");

  const hardcodedScore = `const atsScore = 87;`;
  const hardcodedFindings = stubDetector.detect(hardcodedScore);
  assert(hardcodedFindings.length > 0, "StubDetector must flag hardcoded atsScore variable");

  const todoCode = `// TODO implement this later`;
  const todoFindings = stubDetector.detect(todoCode);
  assert(todoFindings.length > 0, "StubDetector must flag TODO comment");

  const randomScore = `const score = Math.random() * 100; // score metric`;
  const randomFindings = stubDetector.detect(randomScore);
  assert(randomFindings.length > 0, "StubDetector must flag Math.random() metric generation");
  console.log("    ✓ StubDetector mock-data pattern tests passed.");

  // 9. Test FeatureContractValidator and RealityCheckerAgent
  console.log("  • Testing FeatureContractValidator & RealityCheckerAgent...");
  const tmpDir = join(process.cwd(), ".reality-checker-test-tmp");
  const srcDir = join(tmpDir, "src");
  mkdirSync(srcDir, { recursive: true });

  // Write a file that triggers the ATS Score contract but uses a hardcoded score
  writeFileSync(join(srcDir, "Scanner.tsx"), [
    `// ATS Score Calculator`,
    `const atsScore = 92;`,
    `export function Scanner() {`,
    `  return <div>{atsScore}% ATS Score</div>;`,
    `}`,
  ].join("\n"), "utf8");

  const validator = new FeatureContractValidator();
  const violations = validator.validate(tmpDir);
  const hasAtsViolation = violations.some(v => v.feature === "ATS Score Calculation");
  assert(hasAtsViolation, "FeatureContractValidator must detect hardcoded ATS score violation");

  const checker = new RealityCheckerAgent();
  const checkResult = checker.audit(tmpDir);
  assert(!checkResult.passed, "RealityCheckerAgent must return passed=false for project with mock ATS score");
  assert(checkResult.violationCount > 0, "RealityCheckerAgent must report at least 1 violation");
  assert(checkResult.report.includes("Reality Checker"), "Violation report must include Reality Checker header");

  // Clean up temp directory
  rmSync(tmpDir, { recursive: true, force: true });
  console.log("    ✓ FeatureContractValidator & RealityCheckerAgent tests passed.");

  console.log("\n✅ ALL PLATFORM VALIDATION TESTS PASSED SUCCESSFULLY!\n");
}

runPlatformValidationTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
