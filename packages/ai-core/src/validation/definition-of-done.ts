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
import { ValidationStateManager } from "./validation-state.js";

import { EmptyAppDetector } from "../governance/empty-app-detector.js";
import { ArchitectureContractManager } from "../governance/architecture-contract.js";
import { ArchitectureResolver } from "../governance/architecture-resolver.js";
import { ArchitectureAuditor } from "../governance/architecture-auditor.js";
import { ArchitectureDiff } from "../governance/architecture-diff.js";

export class DefinitionOfDone {
  private readonly sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]);

  validate(projectDirectory: string, inferredFeatures: string[] = [], buildSuccess?: boolean): DefinitionOfDoneResult {
    const valState = ValidationStateManager.getInstance().getState();
    const effectiveBuildSuccess = buildSuccess !== undefined ? buildSuccess : valState.latestBuildSuccess;

    const sourceFiles = this.collectSourceFiles(projectDirectory);
    const allSource = sourceFiles.map(f => {
      try { return readFileSync(f, "utf8"); } catch { return ""; }
    }).join("\n");

    const emptyAppCheck = EmptyAppDetector.inspectProjectSource(projectDirectory);
    const archContract = ArchitectureResolver.loadContract(projectDirectory);
    const actualArch = ArchitectureAuditor.audit(projectDirectory);
    const archDiff = ArchitectureDiff.compare(archContract, actualArch);

    const criteria: DodCriterion[] = [
      {
        id: "build-success",
        name: "Build Verification",
        passed: effectiveBuildSuccess,
        detail: effectiveBuildSuccess ? "Project compiled and built successfully" : "Project build is failing compilation errors",
      },
      {
        id: "non-empty-app",
        name: "Empty Application Detector",
        passed: !emptyAppCheck.isEmpty,
        detail: emptyAppCheck.isEmpty ? `Application is empty: ${emptyAppCheck.reasons.join(", ")}` : "Source application structure verified non-empty",
      },
      {
        id: "architecture-contract",
        name: "Architecture Contract Verification",
        passed: archContract !== null,
        detail: archContract !== null ? `Architecture Contract verified (Stack: ${archContract.frontend?.framework || "Unknown"}/${archContract.database?.provider || "Unknown"})` : "Architecture contract file missing",
      },
      {
        id: "architecture-consistency",
        name: "Architecture Consistency Verification",
        passed: archDiff.status === "PASS",
        detail: archDiff.status === "PASS" ? "Generated architecture is consistent with contract — 0 stack drift violations" : `Architecture drift detected: ${archDiff.violations.map(v => `${v.field} expected '${v.expected}', got '${v.actual}'`).join("; ")}`,
      },
      this.checkNoGenericPlaceholder(projectDirectory, allSource),
      this.checkRequiredRoutes(projectDirectory, archContract),
      this.checkFeatureImplementation(projectDirectory, archContract, allSource, sourceFiles),
      this.checkPrismaModels(projectDirectory, archContract),
      this.checkApiConnection(projectDirectory, archContract, allSource),
      this.checkBackendEndpoints(projectDirectory, archContract),
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
      if (!archContract?.requiredFeatures?.includes(feature)) {
        criteria.push(this.checkFeaturePresent(feature, allSource));
      }
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
      "non-empty-app",
      "architecture-contract",
      "architecture-consistency",
      "no-generic-placeholder",
      "required-routes",
      "feature-implementation",
      "prisma-models",
      "api-connection",
      "backend-endpoints",
      "no-hardcoded-data",
      "form-validation",
      "persistence",
      "error-states",
      "loading-states",
      "empty-states",
      "responsive-layouts",
      "accessibility",
      "documentation",
      "typescript-strictness",
      "security",
      "performance",
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

    // Inline expensive ops in JSX without memoization (flag deep/complex data transforms)
    if (/expensiveCalculation|heavyCompute|JSON\.parse\([^)]*map\(/i.test(source)) {
      const hasMemo = /useMemo|useCallback/i.test(source);
      if (!hasMemo) {
        issues.push("Heavy synchronous computation detected inside component render without useMemo — memoize the result");
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

  private checkNoGenericPlaceholder(projectDir: string, source: string): DodCriterion {
    // Strip code comments so comments like "{/* 3D Canvas Placeholder for @react-three/fiber */}" do not cause false positives
    const nonCommentSource = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    const placeholderPatterns = [
      /Welcome to the application platform/i,
      /<h1[^>]*>Dashboard<\/h1>\s*<p[^>]*>Welcome/i,
      /Placeholder for/i,
      /TODO:\s*Implement/i,
    ];
    const violation = placeholderPatterns.find(p => p.test(nonCommentSource));

    // Also check if src/routes.tsx has only a single inline route with dummy text
    const routesPath = join(projectDir, "src", "routes.tsx");
    let isDummyRoute = false;
    if (existsSync(routesPath)) {
      try {
        const routesContent = readFileSync(routesPath, "utf8");
        // Condition 1: literal placeholder string present
        const hasLiteralPlaceholder = routesContent.includes("Welcome to the application platform");
        // Condition 2: truly thin single-route file with no real component
        // (only 1 Route entry AND contains generic div-only inline content with no real component name)
        const routeMatches = (routesContent.match(/<Route\s/g) || []).length;
        const hasOnlyOneRoute = routeMatches <= 1;
        const hasNoRealComponent = !/<[A-Z][A-Za-z]+\s*(\/?>|\s)/.test(routesContent.replace(/<Route[^>]*>/g, ""));
        const isThinSingleRoute = hasOnlyOneRoute && hasNoRealComponent && routesContent.includes("<div className=\"p-8");
        if (hasLiteralPlaceholder || isThinSingleRoute) {
          isDummyRoute = true;
        }
      } catch {}
    }

    const failed = Boolean(violation || isDummyRoute);
    let detail = "No generic placeholder dashboard detected";
    if (violation) {
      detail = `Generic placeholder detected (${violation.toString()}) — real domain UI must be rendered`;
    } else if (isDummyRoute) {
      detail = "Generic dummy route detected in routes.tsx — real domain UI must be mounted";
    }

    return {
      id: "no-generic-placeholder",
      name: "No Generic Placeholder Dashboard",
      passed: !failed,
      detail,
    };
  }

  private checkRequiredRoutes(projectDir: string, contract?: any): DodCriterion {
    const rawRoutes: string[] = contract?.requiredRoutes || [];
    const requiredRoutes = rawRoutes
      .map(r => typeof r === "string" ? r : (r as any).path)
      .filter(Boolean)
      .map(r => r.startsWith("/") ? r : `/${r}`);

    if (requiredRoutes.length === 0) {
      return {
        id: "required-routes",
        name: "Required Routes Coverage",
        passed: true,
        detail: "No specific required routes configured in contract",
      };
    }

    const routesPath = join(projectDir, "src", "routes.tsx");
    const appPath = join(projectDir, "src", "App.tsx");
    const routesContent = [
      existsSync(routesPath) ? readFileSync(routesPath, "utf8") : "",
      existsSync(appPath) ? readFileSync(appPath, "utf8") : "",
    ].join("\n");

    const hasRouteElements = /<Route\s+path=/i.test(routesContent);
    if (!hasRouteElements) {
      return {
        id: "required-routes",
        name: "Required Routes Coverage",
        passed: false,
        detail: "No <Route> definitions found in src/routes.tsx or src/App.tsx",
      };
    }

    const missingRoutes: string[] = [];
    for (const r of requiredRoutes) {
      const escaped = r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pathRegex = new RegExp(`path\\s*=\\s*["']${escaped}["']`, "i");
      if (!pathRegex.test(routesContent)) {
        missingRoutes.push(r);
      }
    }

    const passed = missingRoutes.length === 0;
    return {
      id: "required-routes",
      name: "Required Routes Coverage",
      passed,
      detail: passed
        ? `All ${requiredRoutes.length} required exact route(s) registered in application router (${requiredRoutes.join(", ")})`
        : `Missing required exact route(s) in router: [${missingRoutes.join(", ")}]`,
    };
  }

  private checkFeatureImplementation(
    projectDir: string,
    contract: any,
    allSource: string,
    sourceFiles: string[]
  ): DodCriterion {
    const requiredFeatures: string[] = contract?.requiredFeatures || [];
    if (requiredFeatures.length === 0) {
      return {
        id: "feature-implementation",
        name: "Feature Implementation Verification",
        passed: true,
        detail: "No specific required features configured in contract",
      };
    }

    const missingFeatures: string[] = [];
    const lowerSource = allSource.toLowerCase();

    for (const feat of requiredFeatures) {
      const tokens = feat.toLowerCase().split(/[\s_-]+/).filter(t => t.length > 2);
      const searchTerms = new Set(tokens);
      for (const t of tokens) {
        if (t.startsWith("auth")) searchTerms.add("auth");
        if (t === "authentication" || t === "authorisation" || t === "authorization") {
          searchTerms.add("auth");
          searchTerms.add("login");
        }
        if (t === "recipe" || t === "recipes") {
          searchTerms.add("formula");
          searchTerms.add("formulation");
          searchTerms.add("glaze");
          searchTerms.add("calculation");
          searchTerms.add("ingredient");
        }
        if (t === "vault") {
          searchTerms.add("archive");
          searchTerms.add("library");
          searchTerms.add("collection");
          searchTerms.add("calculator");
          searchTerms.add("history");
        }
        if (t === "kiln") {
          searchTerms.add("thermal");
          searchTerms.add("firing");
          searchTerms.add("temperature");
        }
        if (t === "monitor" || t === "schedule") {
          searchTerms.add("profile");
          searchTerms.add("session");
          searchTerms.add("timer");
        }
      }
      // Check if any search term appears in source files or file paths
      const inContent = Array.from(searchTerms).some(t => lowerSource.includes(t));
      const inPath = sourceFiles.some(f => Array.from(searchTerms).some(t => f.toLowerCase().includes(t)));
      if (!inContent && !inPath) {
        missingFeatures.push(feat);
      }
    }

    const passed = missingFeatures.length === 0;
    return {
      id: "feature-implementation",
      name: "Feature Implementation Verification",
      passed,
      detail: passed
        ? `All ${requiredFeatures.length} required feature(s) implemented in application UI/code`
        : `Missing reachable implementation for required features: [${missingFeatures.join(", ")}]`,
    };
  }

  private checkPrismaModels(projectDir: string, contract?: any): DodCriterion {
    const requiredModels: string[] = contract?.requiredModels || [];
    const hasDb = contract?.database?.provider && !contract.database.provider.toLowerCase().includes("none");
    if (!hasDb || requiredModels.length === 0) {
      return {
        id: "prisma-models",
        name: "Prisma Models Verification",
        passed: true,
        detail: "No required database models configured",
      };
    }

    const schemaPath = join(projectDir, "prisma", "schema.prisma");
    if (!existsSync(schemaPath)) {
      return {
        id: "prisma-models",
        name: "Prisma Models Verification",
        passed: false,
        detail: "prisma/schema.prisma does not exist on disk",
      };
    }

    const schemaContent = readFileSync(schemaPath, "utf8");
    const declaredModels = Array.from(schemaContent.matchAll(/model\s+(\w+)\s*\{/g)).map(match => match[1]);

    const missingModels = requiredModels.filter(m => {
      const cleanM = m.toLowerCase().replace(/[-_\s]+/g, "");
      const singularM = cleanM.endsWith("ies") ? cleanM.slice(0, -3) + "y" : cleanM.replace(/s$/, "");

      return !declaredModels.some(dm => {
        const cleanDm = dm.toLowerCase().replace(/[-_\s]+/g, "");
        const singularDm = cleanDm.endsWith("ies") ? cleanDm.slice(0, -3) + "y" : cleanDm.replace(/s$/, "");

        // 1. Exact match (case insensitive)
        if (cleanDm === cleanM || singularDm === singularM) return true;
        // 2. Stem contains (e.g. ActivityLog matches Activity, TeamMember matches Team)
        if (cleanDm.includes(singularM) || cleanM.includes(singularDm)) return true;
        // 3. Known aliases
        if ((singularM === "team" && cleanDm.includes("member")) || (singularM === "member" && cleanDm.includes("team"))) return true;
        if ((singularM === "activity" && cleanDm.includes("log")) || (singularM === "log" && cleanDm.includes("activity"))) return true;
        return false;
      });
    });

    const passed = missingModels.length === 0;
    return {
      id: "prisma-models",
      name: "Prisma Models Verification",
      passed,
      detail: passed
        ? `All ${requiredModels.length} required Prisma models (or canonical aliases) defined in schema.prisma`
        : `Missing required Prisma models in schema.prisma: [${missingModels.join(", ")}]`,
    };
  }

  private checkApiConnection(projectDir: string, contract: any, source: string): DodCriterion {
    const hasBackend = contract?.backend?.framework && !contract.backend.framework.toLowerCase().includes("none");
    if (!hasBackend) {
      return {
        id: "api-connection",
        name: "Frontend-Backend API Connection",
        passed: true,
        detail: "Client-only project (no backend API required)",
      };
    }

    const apiPath = join(projectDir, "src", "services", "api.ts");
    const hasApiService = existsSync(apiPath);
    const hasApiCalls = /apiClient\.(get|post|put|patch|delete)|fetch\s*\(|axios\.(get|post|put|patch|delete)|useQuery|useMutation/i.test(source);

    const passed = hasApiService || hasApiCalls;
    return {
      id: "api-connection",
      name: "Frontend-Backend API Connection",
      passed,
      detail: passed
        ? "Frontend API client service / API calls verified"
        : "Missing frontend API client (src/services/api.ts) or API calls connecting to backend",
    };
  }

  private checkBackendEndpoints(projectDir: string, contract?: any): DodCriterion {
    const hasBackend = contract?.backend?.framework && !contract.backend.framework.toLowerCase().includes("none");
    if (!hasBackend) {
      return {
        id: "backend-endpoints",
        name: "Backend Endpoints Verification",
        passed: true,
        detail: "Client-only project (no backend required)",
      };
    }

    const serverDir = join(projectDir, "server");
    const serverIndex = join(serverDir, "index.ts");
    const routesDir = join(serverDir, "routes");
    const controllersDir = join(serverDir, "controllers");

    const hasServerEntry = existsSync(serverIndex) || existsSync(join(serverDir, "app.ts"));
    const hasRoutes = existsSync(routesDir) && readdirSync(routesDir).length > 0;
    const hasControllers = existsSync(controllersDir) && readdirSync(controllersDir).length > 0;

    const passed = hasServerEntry && (hasRoutes || hasControllers || (existsSync(serverIndex) && readFileSync(serverIndex, "utf8").includes("app.use")));
    return {
      id: "backend-endpoints",
      name: "Backend Endpoints Verification",
      passed,
      detail: passed
        ? "Backend Express server entry & route endpoints verified"
        : "Missing backend server entry (server/index.ts) or API route handlers",
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
