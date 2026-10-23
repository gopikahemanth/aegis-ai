/**
 * Aegis AI — Phase 5 Natural-Language Edit Intent Parser
 *
 * Converts natural-language instructions into structured, classified EditIntentSpecifications.
 *
 * Classifies requests into:
 * - add_feature
 * - remove_feature
 * - modify_theme
 * - modify_feature
 * - evolve_model
 * - fix_workflow
 * - undo
 *
 * Enforces explicit scope boundaries:
 * e.g., "Only redesign the home page" prevents touching other routes/pages.
 */

import { createHash } from "node:crypto";
import type { EditIntentSpecification, EditOperationType } from "./edit-types.js";

export class NaturalLanguageIntentParser {
  /**
   * Parses natural-language instruction into structured intent specification.
   */
  public static parse(request: string): EditIntentSpecification {
    const trimmed = request.trim();
    const lower = trimmed.toLowerCase();
    const intentId = `intent_${createHash("sha256").update(trimmed + Date.now()).digest("hex").slice(0, 8)}`;

    // 1. Undo
    if (/^undo\b|^revert\b|undo my last change|revert my last edit/i.test(lower)) {
      return {
        intentId,
        rawRequest: trimmed,
        operationType: "undo",
        primaryTarget: "last_edit",
        scopeBoundaries: {
          strictlyTargeted: false,
          allowedRoutes: [],
          allowedFiles: [],
          forbiddenFiles: [],
        },
        isDestructive: false,
        rollbackStrategy: "atomic_checkpoint",
      };
    }

    // 2. Theme / Redesign Global
    if (
      /(change|update|redesign|switch).*?(theme|palette|colors?|styling|tokens?|visual appearance)/i.test(lower) ||
      /^(theme|dark mode|light mode)\b/i.test(lower)
    ) {
      const isGlobal = !/only\s+(redesign|change)\s+(the\s+)?(home|landing|[a-z0-9_-]+)\s+page/i.test(lower);
      if (isGlobal) {
        return {
          intentId,
          rawRequest: trimmed,
          operationType: "modify_theme",
          primaryTarget: "theme",
          scopeBoundaries: {
            strictlyTargeted: true,
            allowedRoutes: [],
            allowedFiles: ["src/index.css", ".aegis/theme.json", "src/tokens.ts"],
            forbiddenFiles: ["server/**", "prisma/**"],
          },
          isDestructive: false,
          rollbackStrategy: "atomic_checkpoint",
          notes: "Global visual theme modification; must preserve existing API and business contracts.",
        };
      }
    }

    // 3. Remove / Cleanup Feature
    if (/^(remove|delete|drop|decommission|purge|clean\s*up)\b/i.test(lower)) {
      const matchTarget = lower.match(/(?:remove|delete|drop|purge|clean\s*up)\s+(?:the\s+)?([a-z0-9_-]+(?:\s+[a-z0-9_-]+)*?)(?:\s+(?:page|feature|component|workflow))?$/i);
      const target = matchTarget ? matchTarget[1].trim() : "obsolete_feature";

      return {
        intentId,
        rawRequest: trimmed,
        operationType: "remove_feature",
        primaryTarget: target,
        scopeBoundaries: {
          strictlyTargeted: true,
          allowedRoutes: [`/${target}`, `/${target}s`],
          allowedFiles: [],
          forbiddenFiles: ["src/shared/components/Card.tsx", "src/shared/components/Button.tsx", "src/shared/components/Table.tsx"],
        },
        isDestructive: true,
        rollbackStrategy: "atomic_checkpoint",
        notes: `Removal of feature "${target}". Must prune obsolete imports without clobbering shared UI components.`,
      };
    }

    // 4. Strict Single-Page Redesign / Modification
    if (/only\s+(redesign|change|update)\s+(?:the\s+)?([a-z0-9_-]+)\s+page/i.test(lower) || /redesign\s+(?:the\s+)?home\s+page/i.test(lower)) {
      const target = /home/i.test(lower) ? "home" : lower.match(/only\s+(?:redesign|change)\s+(?:the\s+)?([a-z0-9_-]+)/i)?.[1] || "target_page";
      return {
        intentId,
        rawRequest: trimmed,
        operationType: "modify_feature",
        primaryTarget: target,
        scopeBoundaries: {
          strictlyTargeted: true,
          allowedRoutes: target === "home" ? ["/"] : [`/${target}`],
          allowedFiles: target === "home" ? ["src/pages/Home.tsx", "src/features/landing/**", "src/features/workspace/**"] : [],
          forbiddenFiles: ["src/pages/Catalog.tsx", "src/pages/Dashboard.tsx", "src/pages/Profile.tsx", "server/**"],
        },
        isDestructive: false,
        rollbackStrategy: "atomic_checkpoint",
        notes: `Targeted modification of "${target}" strictly isolated from other routes.`,
      };
    }

    // 5. Model / Database Evolution
    if (/(add|update|evolve)\s+(?:a\s+|an\s+)?(?:admin\s+)?(role|permission|model|table|field|schema|relation)/i.test(lower)) {
      const target = lower.includes("role") ? "Role" : lower.includes("admin") ? "Admin" : "Model";
      return {
        intentId,
        rawRequest: trimmed,
        operationType: "evolve_model",
        primaryTarget: target,
        scopeBoundaries: {
          strictlyTargeted: false,
          allowedRoutes: [],
          allowedFiles: ["prisma/schema.prisma", "server/routes/**", "server/models/**"],
          forbiddenFiles: [],
        },
        isDestructive: false,
        rollbackStrategy: "atomic_checkpoint",
        notes: `Data model evolution for "${target}". Must preserve existing domain model fields.`,
      };
    }

    // 6. Fix Workflow
    if (/^fix\b|resolve\s+issue|repair\s+workflow|debug/i.test(lower)) {
      const match = lower.match(/fix\s+(?:the\s+)?([a-z0-9_-]+)/i);
      const target = match ? match[1] : "workflow";
      return {
        intentId,
        rawRequest: trimmed,
        operationType: "fix_workflow",
        primaryTarget: target,
        scopeBoundaries: {
          strictlyTargeted: true,
          allowedRoutes: [`/${target}`],
          allowedFiles: [],
          forbiddenFiles: [],
        },
        isDestructive: false,
        rollbackStrategy: "atomic_checkpoint",
        notes: `Bug fix targeted at "${target}".`,
      };
    }

    // 7. Add Feature (Default additive)
    let target = "new_feature";
    const matchAdd = lower.match(
      /(?:add|create|implement|introduce)\s+(?:a\s+|an\s+)?([a-z0-9_-]+(?:\s+[a-z0-9_-]+)*?)(?=\s+(?:and|with|to|for|in|that|which|connected|by|from)\b|\s+feature\b|$)/i
    );
    if (matchAdd && matchAdd[1]) {
      target = matchAdd[1].trim();
    } else {
      const fallbackMatch = lower.match(/(?:add|create|implement|introduce)\s+(?:a\s+|an\s+)?([a-z0-9_-]+)/i);
      if (fallbackMatch && fallbackMatch[1]) {
        target = fallbackMatch[1].trim();
      }
    }
    target = target.replace(/\s+(feature|page|view|screen)$/i, "").trim();

    return {
      intentId,
      rawRequest: trimmed,
      operationType: "add_feature",
      primaryTarget: target,
      scopeBoundaries: {
        strictlyTargeted: false,
        allowedRoutes: [`/${target.replace(/\s+/g, "-")}`],
        allowedFiles: [],
        forbiddenFiles: [],
      },
      isDestructive: false,
      rollbackStrategy: "atomic_checkpoint",
      notes: `Add feature "${target}" with complete route, UI component, navigation link, and acceptance test.`,
    };
  }
}
