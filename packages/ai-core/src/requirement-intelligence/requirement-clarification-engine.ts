/**
 * RequirementClarificationEngine
 *
 * Phase 3: Requirement & Architecture Intelligence
 *
 * Analyzes natural language project requests for:
 * - Underspecified requirements (e.g. database omitted, authentication omitted)
 * - Conflicting constraints (e.g. "static single-page site" with "server-side DB push")
 * - Scalability or regulatory ambiguities (e.g. multi-tenant vs single-tenant)
 *
 * For each issue, it formulates a targeted clarification question with options,
 * and when running autonomously, selects and documents a principled default assumption.
 */

import type { InterpretedSpecification } from "./universal-requirement-interpreter.js";

export type ClarificationSeverity = "CRITICAL_BLOCKER" | "RESOLVED_WITH_DEFAULT" | "INFORMATIONAL";

export interface ClarificationItem {
  id: string;
  field: string;
  severity: ClarificationSeverity;
  issueDescription: string;
  question: string;
  options: string[];
  resolvedValue: string;
  isAutonomouslyResolved: boolean;
  rationale: string;
}

export interface ClarificationAnalysisReport {
  hasBlockers: boolean;
  totalClarifications: number;
  items: ClarificationItem[];
  appliedAssumptions: Record<string, string>;
  isExecutionSafe: boolean;
}

export class RequirementClarificationEngine {
  /**
   * Analyzes an interpreted specification and user prompt for ambiguities.
   */
  public static analyze(spec: InterpretedSpecification): ClarificationAnalysisReport {
    const items: ClarificationItem[] = [];
    const prompt = spec.rawPrompt.toLowerCase();
    let idCounter = 1;

    // 1. Database Persistence Specification Check
    if (!spec.technicalConstraints.userSpecified.database) {
      items.push({
        id: `clarify-${idCounter++}`,
        field: "databaseEngine",
        severity: "RESOLVED_WITH_DEFAULT",
        issueDescription: "No specific database was requested in the prompt.",
        question: "Which database engine should be used for data persistence?",
        options: ["SQLite (Zero-config embedded, ideal for local and fast setup)", "PostgreSQL (Enterprise relational)", "MongoDB (Document store)"],
        resolvedValue: "sqlite",
        isAutonomouslyResolved: true,
        rationale: "Defaulted to SQLite with Prisma ORM for instant zero-configuration local execution and robust relational modeling.",
      });
    }

    // 2. Authentication Strategy Check
    if (!spec.technicalConstraints.userSpecified.auth && spec.technicalConstraints.backendFramework !== "none") {
      items.push({
        id: `clarify-${idCounter++}`,
        field: "authStrategy",
        severity: "RESOLVED_WITH_DEFAULT",
        issueDescription: "Backend API specified but authentication mechanism was not stated.",
        question: "What authentication mechanism should be configured for user accounts?",
        options: ["JWT with bcrypt password hashing (Standard stateless token auth)", "Cookie-based session", "None (Public API)"],
        resolvedValue: "jwt",
        isAutonomouslyResolved: true,
        rationale: "Defaulted to stateless JWT authorization with bcrypt password hashing for secure decoupled frontend/backend communication.",
      });
    }

    // 3. Frontend Framework Check
    if (!spec.technicalConstraints.userSpecified.frontend) {
      items.push({
        id: `clarify-${idCounter++}`,
        field: "frontendFramework",
        severity: "RESOLVED_WITH_DEFAULT",
        issueDescription: "Frontend UI library was not explicitly named.",
        question: "Which frontend stack should be used for UI components?",
        options: ["React + Vite (Modern, fast HMR)", "Next.js (Fullstack React)", "Vanilla HTML + Tailwind"],
        resolvedValue: "react-vite",
        isAutonomouslyResolved: true,
        rationale: "Defaulted to React 18 + Vite with Tailwind CSS for high component modularity and responsive UI design.",
      });
    }

    // 4. Conflicting Constraint Detection
    if (
      /(static|client[- ]only)/i.test(prompt) &&
      /(database|prisma|backend|server|postgresql|postgres|mysql|sqlite|mongo)/i.test(prompt)
    ) {
      items.push({
        id: `clarify-${idCounter++}`,
        field: "architectureConflict",
        severity: "RESOLVED_WITH_DEFAULT",
        issueDescription: "Prompt mentions both a static client-only site and backend/database persistence.",
        question: "Should the project be a standalone client SPA with mock storage, or a full-stack application with Express + Prisma?",
        options: ["Full-Stack Application (Express + Prisma + React)", "Client-Only SPA (LocalStorage)"],
        resolvedValue: "fullstack",
        isAutonomouslyResolved: true,
        rationale: "Resolved in favor of full-stack generation with Express backend to ensure real data persistence and avoid mock-data failure gates.",
      });
    }

    // 5. Check if user prompt is dangerously short / ambiguous (< 5 words)
    const wordCount = spec.rawPrompt.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 4) {
      items.push({
        id: `clarify-${idCounter++}`,
        field: "promptCompleteness",
        severity: "INFORMATIONAL",
        issueDescription: `Input prompt is concise (${wordCount} words). Aegis will synthesize a complete domain model and feature suite automatically.`,
        question: "Would you like to specify detailed business requirements or let Aegis autonomously design the complete application?",
        options: ["Proceed with autonomous end-to-end design", "Refine requirements manually"],
        resolvedValue: "autonomous_generation",
        isAutonomouslyResolved: true,
        rationale: "Aegis inferred comprehensive domain vocabulary, 5 core features, and data models automatically from the prompt.",
      });
    }

    const appliedAssumptions: Record<string, string> = {};
    for (const item of items) {
      appliedAssumptions[item.field] = item.resolvedValue;
    }

    const hasBlockers = items.some(i => i.severity === "CRITICAL_BLOCKER");

    return {
      hasBlockers,
      totalClarifications: items.length,
      items,
      appliedAssumptions,
      isExecutionSafe: !hasBlockers,
    };
  }
}
