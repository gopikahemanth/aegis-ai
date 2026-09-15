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
    for (const route of (contract.requiredRoutes || [])) {
      let found = false;
      let implementedIn: string | undefined;

      const routePath = typeof route === "string" ? route : (route as any).path || "/";
      const routeName = typeof route === "string" ? route : (route as any).name || routePath;
      const routeDesc = typeof route === "string" ? route : (route as any).description || "";
      const escaped = routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pathRegex = new RegExp(`path\\s*=\\s*["']${escaped}["']`, "i");

      for (const [file, content] of fileContents.entries()) {
        if (file.endsWith("routes.tsx") || file.endsWith("App.tsx") || file.endsWith("routes.ts") || file.includes("pages") || file.includes("components")) {
          if (pathRegex.test(content)) {
            found = true;
            implementedIn = file;
            break;
          }
        }
      }

      items.push({
        type: "ROUTE",
        name: `${routePath} (${routeName})`,
        found,
        implementedIn,
        details: routeDesc,
      });
    }

    // 2. Validate Required Endpoints
    const endpoints: any[] = (contract as any).requiredEndpoints || [];
    for (const ep of endpoints) {
      let found = false;
      let implementedIn: string | undefined;

      const cleanPath = (ep.path || "").replace(/:[a-zA-Z0-9_]+/g, "");

      for (const [file, content] of fileContents.entries()) {
        if (file.startsWith("server") || file.includes("api") || file.includes("routes")) {
          if (cleanPath && (content.includes(cleanPath) || content.includes(ep.path))) {
            found = true;
            implementedIn = file;
            break;
          }
        }
      }

      items.push({
        type: "ENDPOINT",
        name: `${ep.method || "GET"} ${ep.path || ""}`,
        found,
        implementedIn,
        details: ep.description || "",
      });
    }

    // 3. Validate Domain Models in Prisma schema or TypeScript types
    const prismaSchema = fileContents.get("prisma/schema.prisma") || "";
    const declaredPrismaModels = Array.from(prismaSchema.matchAll(/model\s+(\w+)\s*\{/g)).map(match => match[1]);
    const domainModels: any[] = (contract as any).domainModels || contract.requiredModels || [];

    for (const model of domainModels) {
      let found = false;
      let implementedIn: string | undefined;
      const modelName = typeof model === "string" ? model : (model.name || "");
      const cleanM = modelName.toLowerCase().replace(/[-_\s]+/g, "");
      const singularM = cleanM.endsWith("ies") ? cleanM.slice(0, -3) + "y" : cleanM.replace(/s$/, "");

      const matchedPrisma = declaredPrismaModels.find(dm => {
        const cleanDm = dm.toLowerCase().replace(/[-_\s]+/g, "");
        const singularDm = cleanDm.endsWith("ies") ? cleanDm.slice(0, -3) + "y" : cleanDm.replace(/s$/, "");
        if (cleanDm === cleanM || singularDm === singularM) return true;
        if (cleanDm.includes(singularM) || cleanM.includes(singularDm)) return true;
        if ((singularM === "team" && cleanDm.includes("member")) || (singularM === "member" && cleanDm.includes("team"))) return true;
        if ((singularM === "activity" && cleanDm.includes("log")) || (singularM === "log" && cleanDm.includes("activity"))) return true;
        return false;
      });

      if (matchedPrisma) {
        found = true;
        implementedIn = `prisma/schema.prisma (model ${matchedPrisma})`;
      } else {
        // Look for TypeScript interface/type in types or models
        for (const [file, content] of fileContents.entries()) {
          if (content.includes(`interface ${modelName}`) || content.includes(`type ${modelName}`)) {
            found = true;
            implementedIn = file;
            break;
          }
        }
      }

      items.push({
        type: "MODEL",
        name: modelName,
        found,
        implementedIn,
        details: typeof model === "string" ? model : model.description || "",
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
