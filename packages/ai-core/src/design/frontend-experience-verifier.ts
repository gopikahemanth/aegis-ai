/**
 * FrontendExperienceVerifier
 *
 * Phase 4: Design System and Frontend Generation Engine
 *
 * Deterministic quality gate for generated frontend applications:
 * 1. Native Interaction Ratio (NIR): Verifies >= 0.95 of clickable/interactive elements
 *    have real, non-placeholder event handlers (no empty callbacks, no dead buttons).
 * 2. Route Coverage: Ensures every declared frontend route in the LockedArchitectureContract
 *    is mounted and rendered in the React router / App tree.
 * 3. Controlled State & Forms: Checks that forms have onSubmit handlers and inputs have state bindings.
 */

import type { LockedArchitectureContract } from "../architect/architecture-contract-engine.js";

export interface InertElementFinding {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

export interface RouteCoverageAudit {
  declaredRoutes: string[];
  mountedRoutes: string[];
  missingRoutes: string[];
  coverageRatio: number;
}

export interface ExperienceAuditReport {
  passed: boolean;
  nirScore: number;
  totalCandidateElements: number;
  interactiveElements: number;
  inertElementsCount: number;
  findings: InertElementFinding[];
  routeCoverage: RouteCoverageAudit;
  recommendations: string[];
}

export interface FileSourceInput {
  path: string;
  content: string;
}

export class FrontendExperienceVerifier {
  public static readonly NIR_THRESHOLD = 0.95;

  /**
   * Audits generated or existing frontend files against the architecture contract.
   */
  public static audit(
    files: FileSourceInput[],
    contract?: LockedArchitectureContract
  ): ExperienceAuditReport {
    let totalCandidateElements = 0;
    let interactiveElements = 0;
    const findings: InertElementFinding[] = [];
    const mountedRoutes = new Set<string>();

    const componentFiles = files.filter(f =>
      f.path.endsWith(".tsx") || f.path.endsWith(".jsx") || f.path.endsWith(".vue") || f.path.endsWith(".svelte")
    );

    for (const file of componentFiles) {
      const fileAudit = this.auditSingleFile(file);
      totalCandidateElements += fileAudit.totalCandidates;
      interactiveElements += fileAudit.interactiveCount;
      findings.push(...fileAudit.inertFindings);

      for (const route of fileAudit.extractedRoutes) {
        mountedRoutes.add(route);
      }
    }

    const nirScore = totalCandidateElements === 0
      ? 1.0
      : Math.round((interactiveElements / totalCandidateElements) * 1000) / 1000;

    // Route Coverage Audit
    const rawRoutes = contract?.routes?.frontendRoutes || ["/", "/admin"];
    const declaredRoutes: string[] = rawRoutes
      .map((r: any) => (typeof r === "string" ? r : r?.path))
      .filter((r): r is string => typeof r === "string");
    const mountedList = Array.from(mountedRoutes);
    const missingRoutes = declaredRoutes.filter(dr => {
      const normDr = this.normalizeRoute(dr);
      return !mountedList.some(mr => this.normalizeRoute(mr) === normDr);
    });

    const routeCoverageRatio = declaredRoutes.length === 0
      ? 1.0
      : Math.round(((declaredRoutes.length - missingRoutes.length) / declaredRoutes.length) * 1000) / 1000;

    const recommendations: string[] = [];
    if (nirScore < this.NIR_THRESHOLD) {
      recommendations.push(
        `Native Interaction Ratio (${(nirScore * 100).toFixed(1)}%) is below required threshold (${(this.NIR_THRESHOLD * 100).toFixed(1)}%). Replace placeholder event handlers with active state mutations or API hooks.`
      );
    }
    if (missingRoutes.length > 0) {
      recommendations.push(
        `Missing routes in frontend router: ${missingRoutes.join(", ")}. Ensure these are routed in App.tsx.`
      );
    }
    if (findings.length > 0) {
      recommendations.push(
        `Identified ${findings.length} inert UI candidate(s). Attach onClick/onChange/onSubmit or convert to non-interactive display elements.`
      );
    }

    const passed = nirScore >= this.NIR_THRESHOLD && missingRoutes.length === 0;

    return {
      passed,
      nirScore,
      totalCandidateElements,
      interactiveElements,
      inertElementsCount: findings.length,
      findings,
      routeCoverage: {
        declaredRoutes,
        mountedRoutes: mountedList,
        missingRoutes,
        coverageRatio: routeCoverageRatio,
      },
      recommendations,
    };
  }

  private static auditSingleFile(file: FileSourceInput): {
    totalCandidates: number;
    interactiveCount: number;
    inertFindings: InertElementFinding[];
    extractedRoutes: string[];
  } {
    const lines = file.content.split("\n");
    let totalCandidates = 0;
    let interactiveCount = 0;
    const inertFindings: InertElementFinding[] = [];
    const extractedRoutes: string[] = [];

    // Extract mounted routes from Router / Route elements
    // Examples: <Route path="/products" ... />, path: '/admin', { path: '/' }
    const routeRegex = /(?:<Route[^>]*path=["']([^"']+)["']|<Link[^>]*to=["']([^"']+)["']|path:\s*["']([^"']+)["'])/g;
    let routeMatch: RegExpExecArray | null;
    while ((routeMatch = routeRegex.exec(file.content)) !== null) {
      const route = routeMatch[1] || routeMatch[2] || routeMatch[3];
      if (route && route.startsWith("/")) {
        extractedRoutes.push(route);
      }
    }

    // Inspect lines for interactive tags: <button, <input, <select, <textarea, <form
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // 1. Buttons
      if (/<button\b/i.test(line)) {
        totalCandidates++;
        // Check surrounding context (current line + next 3 lines) for handlers
        const snippetContext = lines.slice(i, Math.min(lines.length, i + 12)).join(" ");
        const hasHandler = /onClick\s*=\s*\{/i.test(snippetContext) || /type\s*=\s*["']submit["']/i.test(snippetContext);
        const isEmptyHandler = /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/i.test(snippetContext) ||
                               /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*void\s*0\s*\}/i.test(snippetContext);

        if (hasHandler && !isEmptyHandler) {
          interactiveCount++;
        } else {
          inertFindings.push({
            file: file.path,
            line: lineNum,
            snippet: line.trim().slice(0, 100),
            reason: isEmptyHandler ? "Button has empty or no-op onClick handler" : "Button lacks active onClick or submit handler",
          });
        }
      }

      // 2. Inputs
      if (/<input\b/i.test(line) && !/type\s*=\s*["']hidden["']/i.test(line)) {
        totalCandidates++;
        const snippetContext = lines.slice(i, Math.min(lines.length, i + 12)).join(" ");
        const hasBinding = /onChange\s*=\s*\{/i.test(snippetContext) ||
                           /readOnly/i.test(snippetContext) ||
                           /disabled/i.test(snippetContext) ||
                           /type\s*=\s*["']checkbox["']/i.test(snippetContext) && /checked\s*=\s*\{/i.test(snippetContext);

        if (hasBinding) {
          interactiveCount++;
        } else {
          inertFindings.push({
            file: file.path,
            line: lineNum,
            snippet: line.trim().slice(0, 100),
            reason: "Input lacks onChange handler or controlled state binding",
          });
        }
      }

      // 3. Forms
      if (/<form\b/i.test(line)) {
        totalCandidates++;
        const snippetContext = lines.slice(i, Math.min(lines.length, i + 12)).join(" ");
        const hasSubmit = /onSubmit\s*=\s*\{/i.test(snippetContext);
        if (hasSubmit) {
          interactiveCount++;
        } else {
          inertFindings.push({
            file: file.path,
            line: lineNum,
            snippet: line.trim().slice(0, 100),
            reason: "Form lacks onSubmit handler",
          });
        }
      }

      // 4. Selects
      if (/<select\b/i.test(line)) {
        totalCandidates++;
        const snippetContext = lines.slice(i, Math.min(lines.length, i + 12)).join(" ");
        const hasChange = /onChange\s*=\s*\{/i.test(snippetContext);
        if (hasChange) {
          interactiveCount++;
        } else {
          inertFindings.push({
            file: file.path,
            line: lineNum,
            snippet: line.trim().slice(0, 100),
            reason: "Select element lacks onChange handler",
          });
        }
      }
    }

    return {
      totalCandidates,
      interactiveCount,
      inertFindings,
      extractedRoutes,
    };
  }

  private static normalizeRoute(r: any): string {
    if (typeof r !== "string") {
      if (r && typeof r.path === "string") return this.normalizeRoute(r.path);
      return "/";
    }
    return r.replace(/\/+$/, "") || "/";
  }
}
