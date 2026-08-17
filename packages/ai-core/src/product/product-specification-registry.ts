/**
 * ProductSpecificationRegistry
 *
 * Persists and versions .aegis/product-specification.json with deterministic hashes.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ProductSpecification } from "./product-requirement-analyzer.js";

export class ProductSpecificationRegistry {
  public static getSpecPath(projectPath: string): string {
    return join(projectPath, ".aegis", "product-specification.json");
  }

  public static save(projectPath: string, spec: ProductSpecification): void {
    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(this.getSpecPath(projectPath), JSON.stringify(spec, null, 2), "utf8");
  }

  public static load(projectPath: string): ProductSpecification | null {
    const specPath = this.getSpecPath(projectPath);
    if (existsSync(specPath)) {
      try {
        return JSON.parse(readFileSync(specPath, "utf8"));
      } catch {
        return null;
      }
    }
    return null;
  }
}
