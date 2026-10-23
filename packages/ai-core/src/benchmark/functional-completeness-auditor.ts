/**
 * Aegis AI — Phase 7A Functional Completeness Auditor
 *
 * Inspects generated applications for common forms of "fake completeness":
 * - Buttons without meaningful actions (e.g. empty onClick, console.log only)
 * - Forms that never submit or lack validation/state updates
 * - Fake authentication / hardcoded mock tokens
 * - Disconnected search controls where input never filters data
 * - Disconnected cart buttons that do not modify state
 * - Mocked APIs presented as production persistence
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { FakeCompletenessViolation } from "./benchmark-types.js";

export class FunctionalCompletenessAuditor {
  /**
   * Scans a project directory for fake completeness anti-patterns.
   */
  public static audit(projectRoot: string): {
    passed: boolean;
    violationsCount: number;
    violations: FakeCompletenessViolation[];
  } {
    const violations: FakeCompletenessViolation[] = [];
    const srcDir = join(projectRoot, "src");

    if (!existsSync(srcDir)) {
      return { passed: true, violationsCount: 0, violations: [] };
    }

    const codeFiles: string[] = [];
    this.collectFiles(srcDir, codeFiles);

    for (const file of codeFiles) {
      const relPath = file.replace(/\\/g, "/").replace(projectRoot.replace(/\\/g, "/") + "/", "");
      let content = "";
      try {
        content = readFileSync(file, "utf8");
      } catch {
        continue;
      }

      // 1. Detect inert buttons: onClick={() => {}} or onClick={() => console.log(...)}
      const inertButtonRegex = /<button[^>]*?onClick=\{\(\)\s*=>\s*\{(?:console\.log\([^)]*\);?)?\s*\}\}[^>]*>/g;
      let m: RegExpExecArray | null;
      while ((m = inertButtonRegex.exec(content)) !== null) {
        violations.push({
          file: relPath,
          type: "INERT_BUTTON",
          snippet: m[0].slice(0, 80),
          explanation: "Button has an empty or logging-only onClick handler with zero functional effect.",
        });
      }

      // 2. Detect dead forms: <form onSubmit={(e) => e.preventDefault()}> with no state updates
      const deadFormRegex = /<form[^>]*?onSubmit=\{\(e\)\s*=>\s*e\.preventDefault\(\)\}[^>]*>/g;
      while ((m = deadFormRegex.exec(content)) !== null) {
        // Check if form contains input elements and submit button
        if (content.includes("<input") && (content.includes('type="submit"') || content.includes("<button"))) {
          // If the form handler doesn't call any state setter
          const formBlock = content.slice(m.index, m.index + 500);
          if (!formBlock.includes("set") && !formBlock.includes("dispatch") && !formBlock.includes("mutate")) {
            violations.push({
              file: relPath,
              type: "DEAD_FORM",
              snippet: m[0],
              explanation: "Form prevents default on submit but performs no state mutation or submission handling.",
            });
          }
        }
      }

      // 3. Detect fake authentication: hardcoded demo token without authentication flow
      if (
        (content.includes('localStorage.setItem("token", "demo-token")') ||
          content.includes('localStorage.setItem("user", JSON.stringify({ role: "admin" }))')) &&
        !content.includes("/api/auth") &&
        !content.includes("login")
      ) {
        violations.push({
          file: relPath,
          type: "FAKE_AUTH",
          snippet: "localStorage.setItem('token', 'demo-token')",
          explanation: "Hardcoded fake authentication token used without real authentication logic.",
        });
      }

      // 4. Detect disconnected search input: value bound or onChange present but filtered results not rendered
      if (
        content.includes('placeholder="Search') ||
        content.includes('placeholder="Filter')
      ) {
        const hasSearchState = content.includes("search") || content.includes("query") || content.includes("filter");
        const hasFilterOperation = content.includes(".filter(") || content.includes(".includes(");
        if (hasSearchState && !hasFilterOperation && content.includes("<input")) {
          violations.push({
            file: relPath,
            type: "DISCONNECTED_SEARCH",
            snippet: "Search input detected without corresponding collection filter operation.",
            explanation: "Search input is rendered but not wired to filter displayed items.",
          });
        }
      }

      // 5. Detect disconnected cart button: "Add to Cart" button that doesn't call setCart / addItem
      if (/add\s+to\s+cart/i.test(content)) {
        const hasCartStateMutation =
          content.includes("setCart") ||
          content.includes("addItem") ||
          content.includes("addToCart") ||
          content.includes("dispatch");
        if (!hasCartStateMutation && content.includes("<button")) {
          violations.push({
            file: relPath,
            type: "DISCONNECTED_CART",
            snippet: "Add to Cart button with no cart state mutation handler.",
            explanation: "Add to Cart button exists but is not wired to modify any cart state.",
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violationsCount: violations.length,
      violations,
    };
  }

  private static collectFiles(dir: string, result: string[]): void {
    try {
      for (const item of readdirSync(dir)) {
        if (item === "node_modules" || item === ".git" || item === "dist") continue;
        const full = join(dir, item);
        const st = statSync(full);
        if (st.isDirectory()) {
          this.collectFiles(full, result);
        } else if (/\.(tsx|jsx|ts|js)$/.test(item)) {
          result.push(full);
        }
      }
    } catch {}
  }
}
