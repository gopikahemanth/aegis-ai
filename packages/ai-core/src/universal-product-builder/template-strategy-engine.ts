/**
 * TemplateStrategyEngine
 *
 * Chooses the optimal generation strategy based on domain complexity and novelty:
 * DOMAIN_TEMPLATE, COMPOSABLE_MODULES, CUSTOM_GENERATION, or HYBRID.
 * Prevents hardcoded monolith template lock-in.
 */

import { type UniversalProductSpecification } from "./universal-requirement-interpreter.js";

export type GenerationStrategy =
  | "DOMAIN_TEMPLATE"
  | "COMPOSABLE_MODULES"
  | "CUSTOM_GENERATION"
  | "HYBRID";

export interface StrategyDecision {
  strategy: GenerationStrategy;
  rationale: string;
  recommendedModules: string[];
}

export class TemplateStrategyEngine {
  public static selectStrategy(spec: UniversalProductSpecification): StrategyDecision {
    if (spec.domain === "CUSTOM" || spec.domainConfidence < 0.6) {
      return {
        strategy: "CUSTOM_GENERATION",
        rationale: "Novel or un-archetyped domain specification requires AST-driven custom generation.",
        recommendedModules: ["CustomEntityCRUDModule", "GenericDashboardModule", "UniversalAuthModule"],
      };
    }

    if (spec.domain === "ECOMMERCE" || spec.domain === "EDUCATION" || spec.domain === "CRM") {
      return {
        strategy: "COMPOSABLE_MODULES",
        rationale: `Standard domain archetype "${spec.domain}" assembled via composable specialized sub-modules.`,
        recommendedModules: [
          `${spec.domain}_CoreCatalog`,
          `${spec.domain}_Transactions`,
          "RBAC_AuthModule",
          "MetricAnalyticsModule",
        ],
      };
    }

    return {
      strategy: "HYBRID",
      rationale: `Domain "${spec.domain}" uses hybrid composable archetypes combined with custom entity generators.`,
      recommendedModules: ["BaseEntityScaffolding", "DynamicRoutingEngine", "JWTAuthGuard"],
    };
  }
}
