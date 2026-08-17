import { describe, it, expect } from "vitest";
import {
  ProjectContextFactory,
  PromptBuilder,
  PromptValidator,
  PromptLogger,
  computeContractHash,
  computeArchitectureHash,
  PROMPT_VERSIONS,
  type ProjectContext,
  type TaskContext,
  type RepairContext,
  type FeatureChangeContext,
  type FinalAuditContext,
} from "../../prompts/index.js";

describe("AEGIS Prompt Architecture & Contract Governance Suite", () => {
  it("TEST 1: New project isolation - does not inherit previous project domain", () => {
    const proj1 = ProjectContextFactory.create({
      originalRequest: "Build an AI Resume Analyzer and ATS Keyword Scanner",
    });
    const proj2 = ProjectContextFactory.create({
      originalRequest: "Build an AI Code Reviewer & Security Vulnerability Scanner",
    });

    expect(proj1.domainVocabulary.domainPrefix).toBe("resume");
    expect(proj2.domainVocabulary.domainPrefix).toBe("security");
    expect(proj1.generationId).not.toBe(proj2.generationId);
    expect(proj1.contractHash).not.toBe(proj2.contractHash);

    // Stale domain validation check
    const staleResponse = "export const ResumeUpload = () => <div />;";
    const check2 = PromptValidator.validateAgentResponse(staleResponse, proj2);
    expect(check2.isValid).toBe(false);
    expect(check2.staleDomainDetected).toBe(true);
    expect(check2.staleTerms).toContain("ResumeUpload");
  });

  it("TEST 2: Planner cannot output forbidden architecture (Architecture Immutability)", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a React-Vite app with Express and PostgreSQL",
    });

    expect(proj.forbiddenTechnologies).toContain("Next.js");

    const forbiddenLlmOutput = `
      import { useRouter } from "next/navigation";
      export default function ServerAction() {
        // Next.js App Router server action
      }
    `;

    const validation = PromptValidator.validateAgentResponse(forbiddenLlmOutput, proj);
    expect(validation.isValid).toBe(false);
    expect(validation.forbiddenStackDetected).toBe(true);
    expect(validation.forbiddenTerms).toContain("Next.js");
  });

  it("TEST 3: DataArchitecture cannot output stale models", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a Tech Conference Ticket & Seat Booking Portal",
    });

    const staleModelOutput = `
      model Resume {
        id String @id @default(uuid())
        candidateName String
        jobDescription String
      }
    `;

    const validation = PromptValidator.validateAgentResponse(staleModelOutput, proj);
    expect(validation.isValid).toBe(false);
    expect(validation.staleDomainDetected).toBe(true);
  });

  it("TEST 4: Coder cannot create unauthorized files (Task ownership validation)", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a fullstack app",
    });

    const invalidTaskContext: TaskContext = {
      taskId: "task_1",
      title: "UI Implementation",
      description: "Build UI",
      dependencies: [],
      ownedFiles: [], // Empty owned files!
      allowedFiles: ["src/App.tsx"],
      requiredExports: [],
      requiredImports: [],
      acceptanceCriteria: ["UI works"],
      verificationCommands: [],
      projectContractHash: proj.contractHash,
      architectureHash: proj.architectureHash,
    };

    expect(() => {
      PromptBuilder.buildTaskPrompt(proj, invalidTaskContext);
    }).toThrow("Missing ownedFiles for task 'task_1'");
  });

  it("TEST 5: Healer cannot create unknown files / missing evidence validation", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a fullstack app",
    });

    const repairContext: RepairContext = {
      failureId: "fail_99",
      failureType: "BUILD_ERROR",
      errorMessage: "SyntaxError: Unexpected token",
      stackTrace: "at src/App.tsx:10:5",
      affectedFiles: ["src/App.tsx"],
      currentProjectContract: proj,
      previousAttempts: 1,
      checkpoint: "chk_001",
      expectedBehavior: "App should compile without syntax errors",
    };

    const repairPrompt = PromptBuilder.buildRepairPrompt(repairContext);
    expect(repairPrompt).toContain("EMPIRICAL FAILURE EVIDENCE");
    expect(repairPrompt).toContain("SyntaxError: Unexpected token");
    expect(repairPrompt).toContain("src/App.tsx");
  });

  it("TEST 6: ProjectContext hash remains consistent", () => {
    const proj = ProjectContextFactory.create({
      projectId: "proj_fixed",
      generationId: "gen_fixed",
      originalRequest: "Build an AI Resume Analyzer",
    });

    const hash1 = proj.contractHash;
    const hash2 = computeContractHash({
      pId: proj.projectId,
      gId: proj.generationId,
      originalRequest: proj.originalRequest,
      arch: proj.architecture,
      domainVocab: proj.domainVocabulary,
    });

    expect(hash1).toBe(hash2);
    expect(proj.architectureHash).toBe(computeArchitectureHash(proj.architecture));
  });

  it("TEST 7: TaskContext uses the same architecture hash and contract hash", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a SaaS project manager",
    });

    const taskCtx: TaskContext = {
      taskId: "task_01",
      title: "Setup Auth Controller",
      description: "Create Express auth routes",
      dependencies: [],
      ownedFiles: ["server/controllers/auth.controller.ts"],
      allowedFiles: ["server/index.ts"],
      requiredExports: ["authController"],
      requiredImports: ["express"],
      acceptanceCriteria: ["Auth routes return JWT token"],
      verificationCommands: ["pnpm test"],
      projectContractHash: proj.contractHash,
      architectureHash: proj.architectureHash,
    };

    const prompt = PromptBuilder.buildTaskPrompt(proj, taskCtx);
    expect(prompt).toContain(proj.contractHash);
    expect(prompt).toContain(proj.architectureHash);
  });

  it("TEST 8: Invalid LLM output is rejected before writing files (Structured JSON Output)", () => {
    const rawProseOutput = "Here is the code you requested:\n```typescript\nconst x = 1;\n```";
    const check1 = PromptValidator.validateStructuredOutput(rawProseOutput);
    expect(check1.isValid).toBe(false);

    const validJsonOutput = JSON.stringify({
      files: [
        { path: "src/App.tsx", content: "export default function App() { return <div />; }" }
      ]
    });
    const check2 = PromptValidator.validateStructuredOutput(validJsonOutput);
    expect(check2.isValid).toBe(true);
    expect(check2.files).toHaveLength(1);
    expect(check2.files![0].path).toBe("src/App.tsx");
  });

  it("TEST 9: Feature additions update contracts correctly (FeatureChangeContext)", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a Tech Conference Ticketing Portal",
    });

    const changeCtx: FeatureChangeContext = {
      currentProject: proj,
      newFeatureRequest: "Add QR code verification to attendee badge pass",
      impactAnalysis: {
        affectedFiles: ["src/features/conference/BadgePass.tsx"],
        affectedApis: ["/api/conference/verify-qr"],
        affectedModels: ["AttendeeBadge"],
        affectedRoutes: ["/badge/verify"],
        securityImpact: "Low - QR token signature verification",
      },
      acceptanceCriteria: ["Scanning QR code verifies attendee badge"],
    };

    const prompt = PromptBuilder.buildFeatureChangePrompt(changeCtx);
    expect(prompt).toContain("INCREMENTAL FEATURE CHANGE CONTRACT");
    expect(prompt).toContain("Add QR code verification to attendee badge pass");
    expect(prompt).toContain("/api/conference/verify-qr");
  });

  it("TEST 10: Final auditor cannot report PASS when browser verification fails (Gate Integrity)", () => {
    const proj = ProjectContextFactory.create({
      originalRequest: "Build a SaaS app",
    });

    const auditCtx: FinalAuditContext = {
      originalRequest: proj.originalRequest,
      projectContext: proj,
      implementedFeatures: ["dashboard"],
      actualFilesystem: ["src/App.tsx"],
      buildOutput: { status: "PASS", output: "Build succeeded" },
      testOutput: { status: "PASS", output: "Tests passed" },
      runtimeOutput: { status: "PASS", output: "Server live" },
      browserOutput: { status: "FAIL", consoleLogs: ["Uncaught ReferenceError: x is not defined"] },
      realityCheckerOutput: { status: "PASS", missingFeatures: [] },
      visualReviewerOutput: { status: "PASS", observations: [] },
      securityOutput: { status: "PASS", vulnerabilities: [] },
      knownEnvironmentBlockers: [],
    };

    const auditPrompt = PromptBuilder.buildFinalAuditPrompt(auditCtx);
    expect(auditPrompt).toContain("INDEPENDENT FINAL AUDIT EVIDENCE");
    expect(auditPrompt).toContain("[FAIL] (1 console errors)");
    expect(auditPrompt).toContain("BUILD SUCCESS ≠ PROJECT SUCCESS");
  });
});
