/**
 * DefectDiagnosisEngine
 *
 * Classifies failure logs and telemetry into structured root-cause defect categories with evidence.
 */

export type DefectCategory =
  | "TYPE_ERROR"
  | "BUILD_ERROR"
  | "DEPENDENCY_ERROR"
  | "API_ERROR"
  | "DATABASE_ERROR"
  | "RUNTIME_ERROR"
  | "BROWSER_ERROR"
  | "AUTHORIZATION_ERROR"
  | "REQUIREMENT_GAP"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN";

export interface DiagnosedDefect {
  defectId: string;
  category: DefectCategory;
  description: string;
  targetFiles: string[];
  rawErrorSnippet: string;
  isAutonomouslyRepairable: boolean;
  confidence: number; // 0 to 1
  evidence: Record<string, any>;
}

export class DefectDiagnosisEngine {
  public static diagnose(rawError: string, contextFiles: string[] = []): DiagnosedDefect {
    const err = rawError.toLowerCase();
    let category: DefectCategory = "UNKNOWN";
    let isRepairable = true;
    let confidence = 0.85;

    if (err.includes("ts") || err.includes("typeerror") || err.includes("cannot find name") || err.includes("type '")) {
      category = "TYPE_ERROR";
      confidence = 0.95;
    } else if (err.includes("prisma") || err.includes("schema") || err.includes("database") || err.includes("postgres")) {
      category = "DATABASE_ERROR";
      confidence = 0.92;
    } else if (err.includes("404") || err.includes("500") || err.includes("cannot get") || err.includes("cannot post")) {
      category = "API_ERROR";
      confidence = 0.9;
    } else if (err.includes("module not found") || err.includes("cannot find module") || err.includes("package")) {
      category = "DEPENDENCY_ERROR";
      confidence = 0.94;
    } else if (err.includes("click") || err.includes("element not found") || err.includes("dom") || err.includes("selector")) {
      category = "BROWSER_ERROR";
      confidence = 0.88;
    } else if (err.includes("jwt") || err.includes("401") || err.includes("403") || err.includes("unauthorized")) {
      category = "AUTHORIZATION_ERROR";
      confidence = 0.91;
    } else if (err.includes("build") || err.includes("vite") || err.includes("bundle")) {
      category = "BUILD_ERROR";
      confidence = 0.89;
    }

    return {
      defectId: `def_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      description: `Diagnosed ${category}: ${rawError.slice(0, 120)}`,
      targetFiles: contextFiles.length > 0 ? contextFiles : ["server/index.ts"],
      rawErrorSnippet: rawError,
      isAutonomouslyRepairable: isRepairable,
      confidence,
      evidence: {
        rawError,
        contextFiles,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
