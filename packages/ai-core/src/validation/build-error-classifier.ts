/**
 * BuildErrorClassifier
 *
 * Classifies build failures into actionable error classes so that:
 * - SYNTAX/TYPE errors -> send to CoderAgent healer
 * - STRUCTURAL errors -> attempt dependency closure repair first
 * - ARCHITECTURE/ENVIRONMENT errors -> STOP, do not send to healer
 * - DEPENDENCY errors -> install missing package, retry build
 * - PROVIDER_QUOTA -> failover provider, do NOT count as healing attempt
 */

export type BuildErrorClass =
  | "SYNTAX"
  | "TYPE"
  | "STRUCTURAL"
  | "ARCHITECTURE"
  | "ENVIRONMENT"
  | "DEPENDENCY"
  | "PROVIDER_QUOTA"
  | "UNKNOWN";

export interface BuildErrorClassification {
  errorClass: BuildErrorClass;
  healable: boolean;
  reason: string;
  affectedFiles: string[];
}

export class BuildErrorClassifier {
  public static classify(diagnostics: string): BuildErrorClassification {
    const diag = diagnostics || "";
    const affectedFiles: string[] = [];

    const tsFileMatches = diag.matchAll(/([a-zA-Z0-9_\-\/\\\.]+\.(ts|tsx|js|jsx))\((\d+),(\d+)\)/g);
    for (const m of tsFileMatches) {
      if (!affectedFiles.includes(m[1])) affectedFiles.push(m[1]);
    }

    if (diag.includes("429") || diag.includes("RESOURCE_EXHAUSTED") || diag.includes("quota exceeded") || diag.includes("Too Many Requests")) {
      return { errorClass: "PROVIDER_QUOTA", healable: false, reason: "AI provider rate limit reached (429 RESOURCE_EXHAUSTED). Failover to next provider.", affectedFiles: [] };
    }

    if (diag.includes("ARCHITECTURE_CONFLICT") || diag.includes("CONTRACT_CONFLICT") || diag.includes("DATABASE_CONFIGURATION_CONFLICT") || diag.includes("ORM_INCOMPATIBILITY") || diag.includes("DUPLICATE_PROJECT_ROOT") || diag.includes("CONTRACT_GATE_FAILED")) {
      return { errorClass: "ARCHITECTURE", healable: false, reason: "Architecture/contract conflict detected. Fix the contract upstream; AI repair cannot resolve this.", affectedFiles };
    }

    if (diag.includes("P1000") || diag.includes("P1001") || diag.includes("P1002") || diag.includes("DATABASE_URL") || diag.includes("datasource provider") || diag.includes("Environment variable not found") || diag.includes("ECONNREFUSED")) {
      return { errorClass: "ENVIRONMENT", healable: false, reason: "Database/environment configuration error. Fix DATABASE_URL or Prisma schema provider.", affectedFiles };
    }

    if (diag.includes("Cannot find module") || diag.includes("MODULE_NOT_FOUND") || diag.includes("Could not resolve") || diag.includes("Package not found")) {
      const isLocal = diag.includes("./") || diag.includes("../");
      if (!isLocal) return { errorClass: "DEPENDENCY", healable: true, reason: "Missing npm package. Install the required dependency and retry build.", affectedFiles };
    }

    if (diag.includes("error TS2307") || diag.includes("error TS2305") || diag.includes("error TS2306") || (diag.includes("Cannot find module") && (diag.includes("./") || diag.includes("../")))) {
      return { errorClass: "STRUCTURAL", healable: true, reason: "Missing local module or broken local import. Attempt dependency closure repair before AI repair.", affectedFiles };
    }

    if (diag.includes("error TS1005") || diag.includes("error TS1009") || diag.includes("error TS1109") || diag.includes("error TS1161") || diag.includes("error TS1128") || diag.includes("Unexpected token") || diag.includes("SyntaxError")) {
      return { errorClass: "SYNTAX", healable: true, reason: "TypeScript/JavaScript syntax error. Send to CoderAgent healer with the specific file.", affectedFiles };
    }

    if (diag.includes("error TS")) {
      return { errorClass: "TYPE", healable: true, reason: "TypeScript type error. Send to CoderAgent healer with diagnostic and file context.", affectedFiles };
    }

    return { errorClass: "UNKNOWN", healable: true, reason: "Unclassified build error. Attempt AI repair as fallback.", affectedFiles };
  }

  public static shouldSkipHealing(errorClass: BuildErrorClass): boolean {
    return errorClass === "ARCHITECTURE" || errorClass === "ENVIRONMENT" || errorClass === "PROVIDER_QUOTA";
  }
}
