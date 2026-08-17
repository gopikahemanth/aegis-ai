/**
 * ErrorClassifier
 *
 * Deterministic error classifier supporting the 23 standard failure types required by AEGIS:
 * - IMPORT_ERROR
 * - EXPORT_ERROR
 * - TYPE_ERROR
 * - SYNTAX_ERROR
 * - MODULE_ERROR
 * - DEPENDENCY_ERROR
 * - BUILD_ERROR
 * - RUNTIME_ERROR
 * - API_ERROR
 * - DATABASE_ERROR
 * - AUTH_ERROR
 * - ENVIRONMENT_ERROR
 * - BROWSER_ERROR
 * - VISUAL_ERROR
 * - SECURITY_ERROR
 * - CONTRACT_ERROR
 * - FILE_GRAPH_ERROR
 * - STALE_ARTIFACT
 * - DOMAIN_CONTAMINATION
 * - MISSING_FEATURE
 * - FAKE_FEATURE
 * - REGRESSION
 * - UNKNOWN_FAILURE
 *
 * Includes deep classification between Environment and Code failures.
 */

export type FailureCategory =
  | "IMPORT_ERROR"
  | "EXPORT_ERROR"
  | "TYPE_ERROR"
  | "SYNTAX_ERROR"
  | "MODULE_ERROR"
  | "DEPENDENCY_ERROR"
  | "BUILD_ERROR"
  | "RUNTIME_ERROR"
  | "API_ERROR"
  | "DATABASE_ERROR"
  | "AUTH_ERROR"
  | "ENVIRONMENT_ERROR"
  | "BROWSER_ERROR"
  | "VISUAL_ERROR"
  | "SECURITY_ERROR"
  | "CONTRACT_ERROR"
  | "FILE_GRAPH_ERROR"
  | "STALE_ARTIFACT"
  | "DOMAIN_CONTAMINATION"
  | "MISSING_FEATURE"
  | "FAKE_FEATURE"
  | "REGRESSION"
  | "UNKNOWN_FAILURE";

export interface ErrorClassification {
  category: FailureCategory;
  isEnvironment: boolean;
  isCodeFailure: boolean;
  confidence: number;
  reason: string;
  suggestedAction: string;
  affectedFiles: string[];
  errorCode?: string;
}

export class ErrorClassifier {
  /**
   * Classify an error string or structured error report deterministically.
   */
  public static classify(
    errorText: string,
    context?: {
      stage?: string;
      exitCode?: number;
      filePath?: string;
    }
  ): ErrorClassification {
    const text = (errorText || "").trim();
    if (!text) {
      return {
        category: "UNKNOWN_FAILURE",
        isEnvironment: false,
        isCodeFailure: false,
        confidence: 0.1,
        reason: "Empty error text provided",
        suggestedAction: "Collect diagnostic logs",
        affectedFiles: [],
      };
    }

    const lower = text.toLowerCase();
    const affectedFiles = this.extractValidFilePaths(text);

    // 1. ENVIRONMENT_ERROR vs DATABASE_ERROR (Disambiguation)
    if (
      lower.includes("p1000") ||
      lower.includes("authentication failed against database server") ||
      lower.includes("econnrefused 127.0.0.1:5432") ||
      lower.includes("econnrefused localhost:5432") ||
      lower.includes("server is not running on host") ||
      lower.includes("enotfound") ||
      lower.includes("system limit for number of file watchers reached") ||
      lower.includes("eacces: permission denied")
    ) {
      return {
        category: "ENVIRONMENT_ERROR",
        isEnvironment: true,
        isCodeFailure: false,
        confidence: 0.95,
        reason: "External environment, database server connection, or OS resource issue",
        suggestedAction: "Check database server availability, connection strings, or system permissions",
        affectedFiles,
      };
    }

    // Database Code/Schema Error
    if (
      lower.includes("p2002") || // Unique constraint violation
      lower.includes("p2025") || // Record not found
      lower.includes("p2003") || // Foreign key constraint violation
      lower.includes("prisma-client-js") ||
      lower.includes("invalid `prisma.") ||
      lower.includes("column does not exist") ||
      lower.includes("table does not exist") ||
      lower.includes("relation does not exist") ||
      (lower.includes("schema.prisma") && (lower.includes("error:") || lower.includes("syntax error")))
    ) {
      return {
        category: "DATABASE_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "Prisma schema, query syntax, or database constraint mismatch",
        suggestedAction: "Align Prisma schema models with application queries or run migrations",
        affectedFiles: affectedFiles.length > 0 ? affectedFiles : ["prisma/schema.prisma"],
      };
    }

    // 2. DOMAIN_CONTAMINATION / STALE_ARTIFACT / CONTRACT_ERROR / FILE_GRAPH_ERROR
    if (lower.includes("domain_contamination") || lower.includes("cross-domain contamination")) {
      return {
        category: "DOMAIN_CONTAMINATION",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.95,
        reason: "Source code or file names contain vocabulary from an alien project domain",
        suggestedAction: "Purge contaminated files and align terminology with DomainContract",
        affectedFiles,
      };
    }

    if (lower.includes("stale_artifact") || lower.includes("contract hash mismatch") || lower.includes("stale_architecture")) {
      return {
        category: "STALE_ARTIFACT",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.95,
        reason: "Artifact was generated against an older contract hash",
        suggestedAction: "Regenerate artifact from the latest locked contract",
        affectedFiles,
      };
    }

    if (
      lower.includes("architecture_violation") ||
      lower.includes("contract_gate_failed") ||
      lower.includes("immutable requirement violation")
    ) {
      return {
        category: "CONTRACT_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "Task or code conflicts with the locked Architecture Contract",
        suggestedAction: "Refactor code to satisfy the locked Architecture Contract",
        affectedFiles,
      };
    }

    if (lower.includes("unauthorized_file") || lower.includes("duplicate_path") || lower.includes("boundary_rule_violation")) {
      return {
        category: "FILE_GRAPH_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "File path is not in the DynamicFileGraph or violates layer boundaries",
        suggestedAction: "Move code to a canonical path or update file graph",
        affectedFiles,
      };
    }

    // 3. FAKE_FEATURE / MISSING_FEATURE
    if (lower.includes("no mock data") || lower.includes("fake_feature") || lower.includes("placeholder detected")) {
      return {
        category: "FAKE_FEATURE",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "Code contains fake mock values, setTimeout simulation, or unimplemented placeholders",
        suggestedAction: "Implement real business logic and persistence",
        affectedFiles,
      };
    }

    if (lower.includes("missing_feature") || lower.includes("required feature not found")) {
      return {
        category: "MISSING_FEATURE",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "A required feature specified in the contract was not implemented",
        suggestedAction: "Implement missing feature components and endpoints",
        affectedFiles,
      };
    }

    // 4. AUTH_ERROR
    if (
      lower.includes("jwt malformed") ||
      lower.includes("invalid token") ||
      lower.includes("token expired") ||
      lower.includes("authenticatetoken") ||
      lower.includes("unauthorized access") ||
      lower.includes("missing authorization header")
    ) {
      return {
        category: "AUTH_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "Authentication or JWT verification failed",
        suggestedAction: "Check JWT secret configuration and token signing/verification logic",
        affectedFiles,
      };
    }

    // 5. IMPORT_ERROR / EXPORT_ERROR / MODULE_ERROR / DEPENDENCY_ERROR
    if (
      lower.includes("cannot find module") ||
      lower.includes("module not found") ||
      lower.includes("failed to resolve import") ||
      lower.includes("ts2307")
    ) {
      const isPkg = lower.includes("node_modules") || /cannot find module ['"](@?[a-z0-9_.-]+)['"]/.test(lower);
      if (isPkg && !lower.includes("./") && !lower.includes("@/")) {
        return {
          category: "DEPENDENCY_ERROR",
          isEnvironment: false,
          isCodeFailure: true,
          confidence: 0.9,
          reason: "Third-party npm package is not installed",
          suggestedAction: "Add missing package to package.json and run package manager install",
          affectedFiles,
        };
      }
      return {
        category: "MODULE_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "Cannot resolve local module path",
        suggestedAction: "Fix relative import path according to DynamicFileGraph",
        affectedFiles,
      };
    }

    if (
      lower.includes("has no exported member") ||
      lower.includes("ts2305") ||
      lower.includes("does not provide an export named") ||
      lower.includes("missing export")
    ) {
      return {
        category: "EXPORT_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.95,
        reason: "Target module does not export the requested symbol",
        suggestedAction: "Export the requested symbol from the target module",
        affectedFiles,
      };
    }

    if (lower.includes("ts2306") || lower.includes("is not a module")) {
      return {
        category: "IMPORT_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "File imported as a module does not have valid exports",
        suggestedAction: "Add export statements to the target module",
        affectedFiles,
      };
    }

    // 6. SYNTAX_ERROR / TYPE_ERROR
    if (
      lower.includes("syntaxerror") ||
      lower.includes("unexpected token") ||
      lower.includes("ts1005") ||
      lower.includes("ts1109") ||
      lower.includes("expression expected")
    ) {
      return {
        category: "SYNTAX_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.95,
        reason: "Invalid JavaScript/TypeScript syntax or unclosed JSX tag",
        suggestedAction: "Fix syntax error or unclosed brackets/tags",
        affectedFiles,
      };
    }

    if (
      lower.includes("type '") ||
      lower.includes("is not assignable to type") ||
      lower.includes("ts2322") ||
      lower.includes("ts2339") || // Property does not exist
      lower.includes("ts2345") || // Argument of type
      lower.includes("ts2554") || // Expected N arguments
      lower.includes("ts7006")    // Parameter implicitly has 'any' type
    ) {
      return {
        category: "TYPE_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "TypeScript type incompatibility or missing interface property",
        suggestedAction: "Align interface definition, function arguments, or component props",
        affectedFiles,
      };
    }

    // 7. BROWSER_ERROR / VISUAL_ERROR / RUNTIME_ERROR / API_ERROR
    if (
      lower.includes("react_runtime_error") ||
      lower.includes("uncaught error") ||
      lower.includes("minified react error") ||
      lower.includes("cannot read properties of undefined") ||
      lower.includes("cannot read properties of null") ||
      lower.includes("hooks can only be called inside the body")
    ) {
      return {
        category: "BROWSER_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "Browser-side React runtime crash or null pointer exception",
        suggestedAction: "Add null-checks or fix React hook usage",
        affectedFiles,
      };
    }

    if (
      lower.includes("visual layout review failed") ||
      lower.includes("text overflow") ||
      lower.includes("overlapping element") ||
      lower.includes("layout clipping")
    ) {
      return {
        category: "VISUAL_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "CSS layout clipping, text overflow, or contrast failure",
        suggestedAction: "Adjust CSS container flex/grid spacing and overflow rules",
        affectedFiles,
      };
    }

    if (lower.includes("http 500") || lower.includes("internal server error") || lower.includes("api endpoint failure")) {
      return {
        category: "API_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.85,
        reason: "API endpoint returned 500 Internal Server Error",
        suggestedAction: "Check controller exception handling and service logic",
        affectedFiles,
      };
    }

    if (lower.includes("regression") || lower.includes("previously passing test failed")) {
      return {
        category: "REGRESSION",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.9,
        reason: "Recent patch broke previously passing functionality",
        suggestedAction: "Roll back patch and choose alternate repair strategy",
        affectedFiles,
      };
    }

    // Generic Build Failure
    if (context?.stage === "build" || lower.includes("vite build failed") || lower.includes("tsc exited with code")) {
      return {
        category: "BUILD_ERROR",
        isEnvironment: false,
        isCodeFailure: true,
        confidence: 0.7,
        reason: "Project compilation or build command failed",
        suggestedAction: "Inspect build output logs and compiler errors",
        affectedFiles,
      };
    }

    return {
      category: "UNKNOWN_FAILURE",
      isEnvironment: false,
      isCodeFailure: true,
      confidence: 0.4,
      reason: text.slice(0, 150),
      suggestedAction: "Inspect full diagnostic trace",
      affectedFiles,
    };
  }

  private static extractValidFilePaths(text: string): string[] {
    const files = new Set<string>();
    // Match standard TypeScript error paths: src/App.tsx(10,5): error ...
    const matches = text.matchAll(/(?:^|[\s("'])((?:src|server|prisma|app)\/[A-Za-z0-9_/-]+\.(?:tsx|ts|jsx|js|css|prisma|json))(?=[():"'\s]|$)/gm);
    for (const m of matches) {
      const candidate = m[1].trim();
      // Filter out rogue short strings like "s", ".ts"
      if (candidate.length >= 5 && candidate.includes("/")) {
        files.add(candidate);
      }
    }
    return Array.from(files);
  }

}
