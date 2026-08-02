/**
 * ErrorRootCauseMapper
 *
 * TypeScript reports errors at the CALL SITE, not the declaration site.
 * This mapper classifies each error and identifies which file actually
 * needs to be fixed (often a different file than the one in the error line).
 *
 * Example:
 *   Error in: App.tsx(63,9) — 'onRegister' does not exist on IntrinsicAttributes
 *   Real fix: RegisterPage.tsx — missing props interface
 */

export type ErrorClass =
  | "missing-props-interface"   // Component has no props but caller passes props
  | "signature-mismatch"        // Function signature doesn't match usage
  | "missing-export"            // Symbol not exported from the declaring module
  | "type-mismatch"             // Wrong type passed (e.g. sync vs async)
  | "missing-module"            // Cannot find module / missing package
  | "missing-property"          // Property doesn't exist on type
  | "generic-ts-error";         // Fallback

export interface ClassifiedError {
  raw: string;
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
  errorClass: ErrorClass;
  /** The file that should actually be fixed (may differ from `file`) */
  trueSourceFile: string | null;
  /** Human-readable repair hint for the repair agent */
  repairHint: string;
}

export interface RootCauseReport {
  errors: ClassifiedError[];
  /** Deduplicated list of files that need actual changes */
  filesToFix: string[];
  summary: string;
}

export class ErrorRootCauseMapper {

  /**
   * Parse raw tsc/vite stderr and classify each error.
   */
  analyze(stderr: string, projectFileList: string[] = []): RootCauseReport {
    const lines = stderr.split(/\r?\n/);
    const errorPattern = /^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/;

    const errors: ClassifiedError[] = [];

    for (const line of lines) {
      const match = line.match(errorPattern);
      if (!match) continue;

      const [, file, lineStr, colStr, code, message] = match;
      const classified = this.classify(
        file.trim(),
        parseInt(lineStr),
        parseInt(colStr),
        code,
        message.trim(),
        projectFileList,
        line,
      );
      errors.push(classified);
    }

    // Deduplicate files to fix
    const filesToFix = [...new Set(errors.map(e => e.trueSourceFile ?? e.file))];

    return {
      errors,
      filesToFix,
      summary: this.buildSummary(errors),
    };
  }

  private classify(
    file: string,
    line: number,
    col: number,
    code: string,
    message: string,
    projectFiles: string[],
    raw: string,
  ): ClassifiedError {

    // ── TS2322 + IntrinsicAttributes = missing props interface ────────────────
    // Error: Property 'onX' does not exist on type 'IntrinsicAttributes'
    // Means: The component was declared as React.FC (no props) but caller passes props
    // Fix:   Add props interface to the COMPONENT file, not the caller
    if (code === "TS2322" && message.includes("IntrinsicAttributes")) {
      const propName = message.match(/Property '(\w+)' does not exist/)?.[1];
      // Try to find the component file from the JSX tag in context
      const componentName = this.extractComponentName(message, file, projectFiles);
      return {
        raw, file, line, col, code, message,
        errorClass: "missing-props-interface",
        trueSourceFile: componentName,
        repairHint: `The component used at ${file}:${line} is missing a props interface. ` +
          `Add an interface with property '${propName ?? "..."}' to the component's source file, not to ${file}. ` +
          `Do NOT modify ${file} — fix the component declaration file.`,
      };
    }

    // ── TS2322 + signature mismatch ───────────────────────────────────────────
    // Error: Type '(a, b) => void' is not assignable to type '(x, y, z) => void'
    if (code === "TS2322" && message.includes("not assignable to type")) {
      // Could be wrong file or caller — for props, fix the component; for callbacks, fix the caller
      const isPropsLike = message.includes("Promise<") || message.includes("=> void") || message.includes("=> Promise");
      return {
        raw, file, line, col, code, message,
        errorClass: "signature-mismatch",
        trueSourceFile: file, // Usually the caller is wrong here, fix in place
        repairHint: `Function or prop signature mismatch at ${file}:${line}. ` +
          `${isPropsLike
            ? "Align the callback signature: if the component expects async, wrap the call in async. " +
              "If the component expects (userId, data), do not pass individual fields."
            : "Check the type definitions and align the usage."} ` +
          `Change ONLY this specific assignment, not the whole file.`,
      };
    }

    // ── TS2304 / TS2305 — missing export ─────────────────────────────────────
    if (code === "TS2304" || code === "TS2305") {
      const symbolName = message.match(/Cannot find name '(\w+)'|Module .+ has no exported member '(\w+)'/)?.[1];
      return {
        raw, file, line, col, code, message,
        errorClass: "missing-export",
        trueSourceFile: null, // Need to find the declaring module
        repairHint: `Symbol '${symbolName ?? "unknown"}' is not exported. ` +
          `Either add the export to the declaring module, or fix the import path in ${file}.`,
      };
    }

    // ── TS2307 — cannot find module ───────────────────────────────────────────
    if (code === "TS2307") {
      const modName = message.match(/Cannot find module '([^']+)'/)?.[1];
      return {
        raw, file, line, col, code, message,
        errorClass: "missing-module",
        trueSourceFile: file,
        repairHint: `Module '${modName}' not found. ` +
          `If it is an npm package, add it to package.json dependencies. ` +
          `If it is a local file, fix the import path in ${file}.`,
      };
    }

    // ── TS7006 — implicit any ────────────────────────────────────────────────
    if (code === "TS7006") {
      const paramName = message.match(/Parameter '(\w+)' implicitly has an 'any' type/)?.[1];
      return {
        raw, file, line, col, code, message,
        errorClass: "type-mismatch",
        trueSourceFile: file,
        repairHint: `Add explicit type annotation to parameter '${paramName}' in ${file}:${line}. ` +
          `Import and use the correct type from entities/. Do NOT change function logic.`,
      };
    }

    // ── Default ───────────────────────────────────────────────────────────────
    return {
      raw, file, line, col, code, message,
      errorClass: "generic-ts-error",
      trueSourceFile: file,
      repairHint: `Fix error ${code} at ${file}:${line}. Change only the minimum lines required.`,
    };
  }

  /**
   * Try to figure out the component file that needs the props fix.
   * When App.tsx:63 says <RegisterPage onRegister=... /> is wrong,
   * the real file to fix is RegisterPage.tsx.
   */
  private extractComponentName(
    message: string,
    _callerFile: string,
    projectFiles: string[],
  ): string | null {
    // The component name is typically the JSX element name in the error context
    // TS2322 with IntrinsicAttributes usually happens on the opening tag line
    // We try to find a file matching the component name pattern
    const propMatch = message.match(/type 'IntrinsicAttributes & (.+?)'/) ??
                      message.match(/type '{ (.+?) }'.*'IntrinsicAttributes'/);

    if (!propMatch) return null;

    const rawName = propMatch[1].trim(); // e.g. "RegisterPageProps" or "LoginPage"
    const componentName = rawName.replace(/Props$/, "").toLowerCase(); // e.g. "registerpage" or "loginpage"

    // Look in project files for a component file whose name could match
    const candidates = projectFiles.filter(f =>
      f.endsWith(".tsx") && !f.includes("App.tsx")
    );

    const match = candidates.find(f => {
      const baseName = f.split("/").pop()?.replace(/\.tsx$/, "").toLowerCase() ?? "";
      return baseName.includes(componentName) || componentName.includes(baseName);
    });

    return match || (candidates.length > 0 ? candidates[0] : null);
  }

  private buildSummary(errors: ClassifiedError[]): string {
    const byClass = errors.reduce((acc, e) => {
      acc[e.errorClass] = (acc[e.errorClass] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parts = Object.entries(byClass).map(([k, v]) => `${v}× ${k}`);
    return `${errors.length} error(s): ${parts.join(", ")}`;
  }
}
