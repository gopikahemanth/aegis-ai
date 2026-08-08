import { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { ProjectSpecification } from "../architect/specification.js";
import { DetectedArchitecture } from "../governance/architecture-auditor.js";
import { ArchitectureDiffResult } from "../governance/architecture-diff.js";
import { DefinitionOfDoneResult } from "./definition-of-done.js";

export interface GenerationValidationContext {
  architecture: ArchitectureContractV1;
  specification: ProjectSpecification;
  projectPath: string;
  framework: string;
  database: string;
  orm: string;
  buildResult: {
    success: boolean;
    stderr?: string;
    stdout?: string;
  };
  runtimeResult: {
    success: boolean;
    error?: string;
  };
  browserResult: {
    success: boolean;
    screenshots: string[];
    logs: string[];
  };
  realityResult: {
    passed: boolean;
    missingFeatures: string[];
  };
  visualResult: {
    passed: boolean;
    highSeverityIssues: string[];
  };
  securityResult: {
    passed: boolean;
    vulnerabilities: string[];
  };
  architectureResult: ArchitectureDiffResult;
  dodResult: DefinitionOfDoneResult | null;
}

export class ValidationContextManager {
  public static createInitialContext(
    projectPath: string,
    architecture: ArchitectureContractV1,
    specification: ProjectSpecification
  ): GenerationValidationContext {
    if (!architecture || !architecture.frontend || !architecture.frontend.framework) {
      throw new Error(`[ValidationContext] Invalid Architecture Contract provided for projectPath: ${projectPath}`);
    }

    return {
      architecture,
      specification,
      projectPath,
      framework: architecture.frontend.framework,
      database: architecture.database.provider,
      orm: architecture.database.orm,
      buildResult: { success: false },
      runtimeResult: { success: false },
      browserResult: { success: false, screenshots: [], logs: [] },
      realityResult: { passed: false, missingFeatures: [] },
      visualResult: { passed: true, highSeverityIssues: [] },
      securityResult: { passed: true, vulnerabilities: [] },
      architectureResult: { status: "FAILED", violations: [] },
      dodResult: null
    };
  }
}
