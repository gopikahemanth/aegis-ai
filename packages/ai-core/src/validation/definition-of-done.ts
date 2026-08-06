import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

export interface DodCriterion {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface DefinitionOfDoneResult {
  passed: boolean;
  score: number; // 0-100
  criteria: DodCriterion[];
  blockers: DodCriterion[];   // Failed required criteria
  warnings: DodCriterion[];   // Failed optional criteria
  summary: string;
}

/**
 * DefinitionOfDone
 *
 * Validates a generated project against 11 completeness criteria before
 * Aegis is allowed to print "Project generated successfully."
 *
 * A project is COMPLETE only when:
 *  ✅ Every advertised feature is implemented end-to-end
 *  ✅ No placeholder or hardcoded business data
 *  ✅ Application builds without errors (checked by BuildOrchestrator)
 *  ✅ Forms validate input correctly
 *  ✅ Data persists correctly
 *  ✅ Error states are implemented
 *  ✅ Loading states are implemented
 *  ✅ Empty states are implemented
 *  ✅ Responsive layouts work across screen sizes
 *  ✅ Accessibility basics are met
 *  ✅ Documentation is generated (README.md)
 */
export class DefinitionOfDone {
  private readonly sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]);

  validate(projectDirectory: string, inferredFeatures: string[] = [], buildSuccess = true): DefinitionOfDoneResult {
    const sourceFiles = this.collectSourceFiles(projectDirectory);
    const allSource = sourceFiles.map(f => {
      try { return readFileSync(f, "utf8"); } catch { return ""; }
    }).join("\n");

    const criteria: DodCriterion[] = [
      {
        id: "build-success",
        name: "Build Verification",
        passed: buildSuccess,
        detail: buildSuccess ? "Project compiled and built successfully" : "Project build is failing compilation errors",
      },
      this.checkNoHardcodedData(allSource),
      this.checkFormValidation(allSource),
      this.checkPersistence(allSource),
      this.checkErrorStates(allSource),
      this.checkLoadingStates(allSource),
      this.checkEmptyStates(allSource),
      this.checkResponsiveLayouts(allSource),
      this.checkAccessibility(allSource),
      this.checkDocumentation(projectDirectory),
      this.checkNoConsoleLogs(allSource),
      this.checkTypeScriptStrictness(allSource),
      this.checkSecurity(allSource),
      this.checkPerformance(allSource),
      this.checkLazyLoading(allSource),
    ];

    // If we have a list of inferred features, verify each is addressed
    for (const feature of inferredFeatures) {
      criteria.push(this.checkFeaturePresent(feature, allSource));
    }

    const blockers = criteria.filter(c => !c.passed && this.isRequired(c.id));
    const warnings = criteria.filter(c => !c.passed && !this.isRequired(c.id));
    const passed = blockers.length === 0;
    const score = Math.round((criteria.filter(c => c.passed).length / criteria.length) * 100);

    return {
      passed,
      score,
      criteria,
      blockers,
      warnings,
      summary: this.buildSummary(passed, score, blockers, warnings),
    };
  }

  formatForHealing(result: DefinitionOfDoneResult, originalRequest: string): string {
    return `Definition of Done validation FAILED (score: ${result.score}/100).
The following required criteria are not satisfied:

${result.blockers.map(b => `✗ [${b.name}] ${b.detail}`).join("\n")}

${result.warnings.length > 0 ? `Warnings (non-blocking):\n${result.warnings.map(w => `⚠ [${w.name}] ${w.detail}`).join("\n")}` : ""}

Original User Request: ${originalRequest}

Fix every REQUIRED criterion listed above. Implement the missing patterns in the appropriate files.`;
  }

  private isRequired(criterionId: string): boolean {
    const required = new Set([
      "build-success",
      "no-hardcoded-data",
      "error-states",
      "loading-states",
      "responsive-layouts",
      "accessibility",
      "documentation",
      "security",
    ]);
    return required.has(criterionId);
  }

  // ── Individual Checks ──────────────────────────────────────────────────────

  private checkNoHardcodedData(source: string): DodCriterion {
    const patterns = [
      /const\s+(hardcodedScore|staticUsers|dummyScores)\s*=\s*\[[\s\S]{1,200}\]/,
      /const\s+(atsScore|dummyRating)\s*=\s*\d{2,3}\s*[;,]/i,
    ];
    const violation = patterns.find(p => p.test(source));
    return {
      id: "no-hardcoded-data",
      name: "No Hardcoded Business Data",
      passed: !violation,
      detail: violation
        ? "Found hardcoded data array or score value — all business data must come from real operations"
        : "No hardcoded business data detected",
    };
  }

  private checkFormValidation(source: string): DodCriterion {
    const hasForm = /\<form|onSubmit|handleSubmit/i.test(source);
    const hasValidation = /required|minLength|maxLength|pattern|validate|setError|formState|zod|yup/i.test(source);
    return {
      id: "form-validation",
      name: "Form Input Validation",
      passed: !hasForm || hasValidation,
      detail: hasForm && !hasValidation
        ? "Forms exist but no input validation detected (use required attributes, zod, or react-hook-form)"
        : "Form validation satisfied",
    };
  }

  private checkPersistence(source: string): DodCriterion {
    const hasMutation = /onClick|onSubmit|handleDelete|handleSave|handleCreate/i.test(source);
    const hasPersistence = /localStorage\.(setItem|getItem)|fetch.*POST|axios\.post|supabase|prisma|indexedDB/i.test(source);
    return {
      id: "persistence",
      name: "Data Persistence",
      passed: !hasMutation || hasPersistence,
      detail: hasMutation && !hasPersistence
        ? "User actions found but no persistence mechanism detected (localStorage, API call, or DB)"
        : "Persistence mechanism found",
    };
  }

  private checkErrorStates(source: string): DodCriterion {
    const hasAsyncOp = /await|\.then\(|useQuery|useMutation|fetch\(/i.test(source);
    const hasErrorUI = /error|isError|catch|toast|console|status|try/i.test(source);
    return {
      id: "error-states",
      name: "Error States in UI",
      passed: !hasAsyncOp || hasErrorUI,
      detail: hasAsyncOp && !hasErrorUI
        ? "Async operations exist but no error state UI found — add error display JSX for failed operations"
        : "Error states handled",
    };
  }

  private checkLoadingStates(source: string): DodCriterion {
    const hasAsyncOp = /await|useQuery|useMutation|fetch\(/i.test(source);
    const hasLoadingUI = /isLoading|loading\s*&&|Skeleton|animate-pulse|spinner|Loader/i.test(source);
    return {
      id: "loading-states",
      name: "Loading States in UI",
      passed: !hasAsyncOp || hasLoadingUI,
      detail: hasAsyncOp && !hasLoadingUI
        ? "Async operations exist but no loading state UI — add Skeleton or loading spinner components"
        : "Loading states handled",
    };
  }

  private checkEmptyStates(source: string): DodCriterion {
    const hasDataList = /\.map\s*\(|\.length|items\.|results\./i.test(source);
    const hasEmptyUI = /\.length\s*===\s*0|\.length\s*==\s*0|EmptyState|empty.*state|no\s+(results|items|data)/i.test(source);
    return {
      id: "empty-states",
      name: "Empty States in UI",
      passed: !hasDataList || hasEmptyUI,
      detail: hasDataList && !hasEmptyUI
        ? "Data lists found but no empty state handling — add EmptyState component when collections are empty"
        : "Empty states handled",
    };
  }

  private checkResponsiveLayouts(source: string): DodCriterion {
    const hasSmBreakpoint = /\bsm:/i.test(source);
    const hasMdBreakpoint = /\bmd:/i.test(source);
    const hasLgBreakpoint = /\blg:/i.test(source);
    const responsiveCount = [hasSmBreakpoint, hasMdBreakpoint, hasLgBreakpoint].filter(Boolean).length;
    return {
      id: "responsive-layouts",
      name: "Responsive Layouts",
      passed: responsiveCount >= 2,
      detail: responsiveCount < 2
        ? "Missing responsive Tailwind breakpoints (sm:/md:/lg:) — layouts must adapt across screen sizes"
        : `Responsive breakpoints found (${[hasSmBreakpoint && "sm", hasMdBreakpoint && "md", hasLgBreakpoint && "lg"].filter(Boolean).join(", ")})`,
    };
  }

  private checkAccessibility(source: string): DodCriterion {
    const hasInteractiveElements = /\<button|\<input|\<select|\<textarea/i.test(source);
    const hasAriaLabels = /aria-label|aria-describedby|aria-labelledby|role=/i.test(source);
    const hasFocusVisible = /focus-visible|focus:ring|focus:outline/i.test(source);
    const accessibilityScore = [hasAriaLabels, hasFocusVisible].filter(Boolean).length;
    return {
      id: "accessibility",
      name: "Accessibility (ARIA + Focus)",
      passed: !hasInteractiveElements || accessibilityScore >= 1,
      detail: hasInteractiveElements && accessibilityScore === 0
        ? "Interactive elements found but no ARIA labels or focus-visible styles detected"
        : "Basic accessibility requirements met",
    };
  }

  private checkDocumentation(projectDir: string): DodCriterion {
    const readmePath = join(projectDir, "README.md");
    const exists = existsSync(readmePath);
    if (!exists) {
      return { id: "documentation", name: "README.md Documentation", passed: false, detail: "README.md not found — generate project documentation" };
    }
    const content = readFileSync(readmePath, "utf8");
    const hasSetup = /install|npm|pnpm|yarn/i.test(content);
    return {
      id: "documentation",
      name: "README.md Documentation",
      passed: hasSetup,
      detail: hasSetup ? "README.md present with setup instructions" : "README.md exists but missing setup/install instructions",
    };
  }

  private checkNoConsoleLogs(source: string): DodCriterion {
    const matches = (source.match(/console\.log\s*\(/g) || []).length;
    return {
      id: "no-console-logs",
      name: "No Bare console.log",
      passed: matches === 0,
      detail: matches > 0
        ? `Found ${matches} console.log statement(s) — use structured logging or remove debug output`
        : "No bare console.log statements",
    };
  }

  private checkTypeScriptStrictness(source: string): DodCriterion {
    const anyCount = (source.match(/:\s*any\b/g) || []).length;
    return {
      id: "typescript-strict",
      name: "TypeScript — No 'any'",
      passed: anyCount === 0,
      detail: anyCount > 0
        ? `Found ${anyCount} use(s) of 'any' type — use 'unknown' with type guards instead`
        : "No 'any' types found",
    };
  }

  private checkSecurity(source: string): DodCriterion {
    const violations: string[] = [];

    // Hardcoded API keys / secrets
    if (/['"`]sk-[a-zA-Z0-9]{20,}['"`]|['"`]AKIA[A-Z0-9]{16}['"`]|API_KEY\s*=\s*['"`][^'"\n]{8,}/i.test(source)) {
      violations.push("Possible hardcoded secret/API key detected — move to .env");
    }

    // XSS: dangerouslySetInnerHTML without DOMPurify — check both this file and full source
    const hasDangerousHtml = /dangerouslySetInnerHTML/i.test(source);
    const hasDomPurify = /DOMPurify|dompurify|import.*purify|sanitize\s*\(/i.test(source);
    if (hasDangerousHtml && !hasDomPurify) {
      violations.push("dangerouslySetInnerHTML used without DOMPurify sanitization — XSS risk");
    }

    // eval with dynamic input
    if (/\beval\s*\(|new\s+Function\s*\(/i.test(source)) {
      violations.push("eval() or new Function() detected — potential code injection");
    }

    // Plain http:// API calls
    if (/fetch\s*\(\s*['"]http:\/\//i.test(source)) {
      violations.push("Insecure http:// fetch call found — use https://");
    }

    return {
      id: "security",
      name: "Security (XSS / Secrets / Injection)",
      passed: violations.length === 0,
      detail: violations.length > 0
        ? violations.join("; ")
        : "No common security violations detected",
    };
  }

  private checkPerformance(source: string): DodCriterion {
    const issues: string[] = [];

    // Long list render without virtualization
    const hasBigList = /\.map\s*\(/i.test(source);
    const hasVirtualization = /react-window|react-virtual|FixedSizeList|VirtualList|useVirtual/i.test(source);
    const hasExplicitLargeData = /\.length\s*[>]=?\s*[5-9]\d|\b[1-9]\d{2,}\s*items/i.test(source);
    if (hasBigList && hasExplicitLargeData && !hasVirtualization) {
      issues.push("Large list detected without virtualization — use react-window for 50+ items");
    }

    // Inline expensive ops in JSX without memoization
    if (/return\s*\([^)]*\.filter\(|return\s*\([^)]*\.sort\(/i.test(source)) {
      const hasMemo = /useMemo|useCallback/i.test(source);
      if (!hasMemo) {
        issues.push("filter()/sort() called inside JSX render without useMemo — memoize the result");
      }
    }

    return {
      id: "performance",
      name: "Performance (Memoization / Virtualization)",
      passed: issues.length === 0,
      detail: issues.length > 0
        ? issues.join("; ")
        : "No obvious performance anti-patterns detected",
    };
  }

  private checkLazyLoading(source: string): DodCriterion {
    // Only flag if there are multiple routes/pages but no lazy loading
    const hasRoutes = /Route\s+path=|createBrowserRouter|useRoutes/i.test(source);
    const hasLazyLoad = /React\.lazy\s*\(|lazy\s*\(\s*\(\s*\)\s*=>/i.test(source);
    const hasSuspense = /Suspense/i.test(source);
    return {
      id: "lazy-loading",
      name: "Lazy Loading (Routes)",
      passed: !hasRoutes || (hasLazyLoad && hasSuspense),
      detail: hasRoutes && (!hasLazyLoad || !hasSuspense)
        ? "Multi-page app detected but routes are not lazy-loaded — wrap with React.lazy() + Suspense"
        : "Route lazy loading satisfied",
    };
  }

  private checkFeaturePresent(featureName: string, source: string): DodCriterion {
    // Simple heuristic: feature name keywords should appear in source
    const keywords = featureName.toLowerCase().split(/[\s_-]+/);
    const meaningfulKeywords = keywords.filter(k => k.length > 3);
    const found = meaningfulKeywords.some(kw => source.toLowerCase().includes(kw));
    return {
      id: `feature-${featureName.toLowerCase().replace(/\s+/g, "-")}`,
      name: `Feature: ${featureName}`,
      passed: found,
      detail: found
        ? `Feature "${featureName}" appears to be implemented`
        : `Feature "${featureName}" may be missing — no matching code found`,
    };
  }

  private buildSummary(passed: boolean, score: number, blockers: DodCriterion[], warnings: DodCriterion[]): string {
    if (passed) {
      return `✅ Definition of Done: PASSED (${score}/100). All required criteria satisfied.${warnings.length > 0 ? ` ${warnings.length} warning(s) noted.` : ""}`;
    }
    return `🔴 Definition of Done: FAILED (${score}/100). ${blockers.length} required criterion/criteria not met:\n${blockers.map(b => `  ✗ ${b.name}: ${b.detail}`).join("\n")}`;
  }

  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;
    const walk = (d: string) => {
      for (const entry of readdirSync(d)) {
        if (entry === "node_modules" || entry === "dist" || entry === "build" || entry === "out" || entry === "coverage" || entry.startsWith(".")) continue;
        const fullPath = join(d, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) walk(fullPath);
        else if (this.sourceExtensions.has(extname(entry))) results.push(fullPath);
      }
    };
    walk(dir);
    return results;
  }
}
