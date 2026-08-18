/**
 * FeatureCoverageValidator
 *
 * Validates that all features, models, endpoints, and routes specified in the
 * ArchitectureContractV1 are physically implemented in the generated codebase.
 *
 * Rules:
 * - Checks 100% coverage of requiredRoutes against client routes.tsx / page components.
 * - Checks 100% coverage of requiredEndpoints against backend route handlers.
 * - Checks 100% coverage of domainModels against Prisma schema / database entities.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";

export interface CoverageItem {
  type: "ROUTE" | "ENDPOINT" | "MODEL" | "FEATURE";
  name: string;
  found: boolean;
  implementedIn?: string;
  details?: string;
}

export interface FeatureCoverageReport {
  coveredPercentage: number;
  allSatisfied: boolean;
  totalRequired: number;
  totalFound: number;
  items: CoverageItem[];
  missingItems: CoverageItem[];
}

export class FeatureCoverageValidator {
  /**
   * Validates full contract coverage on a generated project directory.
   */
  public static validateCoverage(projectRoot: string, contract: ArchitectureContractV1): FeatureCoverageReport {
    const items: CoverageItem[] = [];

    const allSourceFiles = this.getAllFiles(projectRoot);
    const fileContents = new Map<string, string>();
    for (const f of allSourceFiles) {
      try {
        fileContents.set(f, readFileSync(join(projectRoot, f), "utf8"));
      } catch {}
    }

    // 1. Validate Required Routes
    for (const route of contract.requiredRoutes) {
      let found = false;
      let implementedIn: string | undefined;

      const slug = route.path === "/" ? "dashboard" : route.path.replace(/^\//, "").toLowerCase();

      for (const [file, content] of fileContents.entries()) {
        if (file.endsWith("routes.tsx") || file.endsWith("App.tsx") || file.endsWith("routes.ts")) {
          if (content.includes(`path="${route.path}"`) || content.includes(`path='${route.path}'`)) {
            found = true;
            implementedIn = file;
            break;
          }
        }
        if (file.toLowerCase().includes(slug) && (file.endsWith(".tsx") || file.endsWith(".ts"))) {
          found = true;
          implementedIn = file;
          break;
        }
      }

      items.push({
        type: "ROUTE",
        name: `${route.path} (${route.name})`,
        found,
        implementedIn,
        details: route.description,
      });
    }

    // 2. Validate Required Endpoints
    for (const ep of contract.requiredEndpoints) {
      let found = false;
      let implementedIn: string | undefined;

      const cleanPath = ep.path.replace(/:[a-zA-Z0-9_]+/g, "");

      for (const [file, content] of fileContents.entries()) {
        if (file.startsWith("server") || file.includes("api") || file.includes("routes")) {
          const methodLower = ep.method.toLowerCase();
          if (content.includes(cleanPath) || content.includes(ep.path)) {
            found = true;
            implementedIn = file;
            break;
          }
        }
      }

      items.push({
        type: "ENDPOINT",
        name: `${ep.method} ${ep.path}`,
        found,
        implementedIn,
        details: ep.description,
      });
    }

    // 3. Validate Domain Models in Prisma schema or TypeScript types
    const prismaSchema = fileContents.get("prisma/schema.prisma") || "";
    for (const model of contract.domainModels) {
      let found = false;
      let implementedIn: string | undefined;

      if (prismaSchema.includes(`model ${model.name}`)) {
        found = true;
        implementedIn = "prisma/schema.prisma";
      } else {
        // Look for TypeScript interface/type in types or models
        for (const [file, content] of fileContents.entries()) {
          if (content.includes(`interface ${model.name}`) || content.includes(`type ${model.name}`)) {
            found = true;
            implementedIn = file;
            break;
          }
        }
      }

      items.push({
        type: "MODEL",
        name: model.name,
        found,
        implementedIn,
        details: `Fields: ${model.fields.map(f => f.name).join(", ")}`,
      });
    }

    const totalRequired = items.length;
    const foundItems = items.filter(i => i.found);
    const missingItems = items.filter(i => !i.found);
    const coveredPercentage = totalRequired > 0 ? Math.round((foundItems.length / totalRequired) * 100) : 100;

    return {
      coveredPercentage,
      allSatisfied: missingItems.length === 0,
      totalRequired,
      totalFound: foundItems.length,
      items,
      missingItems,
    };
  }

  private static getAllFiles(dir: string, currentRel = ""): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    try {
      const list = readdirSync(dir);
      for (const item of list) {
        if (item === "node_modules" || item === ".git" || item === "dist" || item === "build") continue;
        const full = join(dir, item);
        const rel = currentRel ? `${currentRel}/${item}` : item;
        const stat = statSync(full);
        if (stat.isDirectory()) {
          results.push(...this.getAllFiles(full, rel));
        } else {
          results.push(rel.replace(/\\/g, "/"));
        }
      }
    } catch {}
    return results;
  }
}
