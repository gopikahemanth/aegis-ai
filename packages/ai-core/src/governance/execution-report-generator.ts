import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractData } from "./architecture-contract.js";

export interface ExecutionReportData {
  timestamp: string;
  userPrompt: string;
  architectureContract: ArchitectureContractData | null;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  dodScore: number;
  completedFeatures: string[];
  failedFeatures: string[];
  databaseStatus: {
    requested: string;
    configured: string;
    isSynced: boolean;
  };
  validationResults: {
    typeCheck: boolean;
    build: boolean;
    runtime: boolean;
    realityChecker: boolean;
    visualReviewer: boolean;
  };
  healingAttemptsCount: number;
  unresolvedIssues: string[];
}

export class ExecutionReportGenerator {
  public static generateReport(
    outputDirectory: string,
    prompt: string,
    archContract: ArchitectureContractData | null,
    status: "SUCCESS" | "FAILED" | "BLOCKED",
    dodScore: number,
    completedFeatures: string[],
    failedFeatures: string[],
    dbStatus: { requested: string; configured: string; isSynced: boolean },
    validationResults: { typeCheck: boolean; build: boolean; runtime: boolean; realityChecker: boolean; visualReviewer: boolean },
    healingAttemptsCount: number,
    unresolvedIssues: string[]
  ): ExecutionReportData {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    const report: ExecutionReportData = {
      timestamp: new Date().toISOString(),
      userPrompt: prompt,
      architectureContract: archContract,
      status,
      dodScore,
      completedFeatures,
      failedFeatures,
      databaseStatus: dbStatus,
      validationResults,
      healingAttemptsCount,
      unresolvedIssues
    };

    writeFileSync(join(aegisDir, "execution-report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(`[Governance] 📜 Execution Report saved to .aegis/execution-report.json (Status: ${status}, DoD Score: ${dodScore}/100)`);

    return report;
  }
}
