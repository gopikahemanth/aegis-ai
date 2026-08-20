import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { BrownfieldProjectContract, ImpactSet } from "./brownfield-contract.js";

export class ImpactAnalyzer {
  /**
   * Computes the minimal impact set of files that must or may change for an additive feature request.
   */
  public static analyze(contract: BrownfieldProjectContract, request: string): ImpactSet {
    const projectRoot = contract.repository.rootPath;
    const cleanRequest = request.toLowerCase();

    const mustChange = new Set<string>();
    const mayChange = new Set<string>();
    const readOnly = new Set<string>();
    const protectedFiles = new Set<string>(["package.json", "tsconfig.json", ".git", ".env", "pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);

    // Extract domain entity keywords from request
    const candidateKeywords = ["task", "transaction", "expense", "budget", "product", "user", "order", "item", "category", "scan", "event", "recipe", "course"];
    const matchedKeywords = candidateKeywords.filter(kw => cleanRequest.includes(kw));

    // Recursively collect all existing source files
    const allFiles: string[] = [];
    const collectFiles = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const item of readdirSync(dir)) {
        const full = join(dir, item);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          if (item !== "node_modules" && item !== "dist" && item !== ".aegis" && item !== ".git") {
            collectFiles(full);
          }
        } else {
          const rel = full.substring(projectRoot.length).replace(/^[\\\/]+/, "").replace(/\\/g, "/");
          allFiles.push(rel);
        }
      }
    };

    collectFiles(projectRoot);

    // Identify Router file if present
    if (contract.architecture.routerFile) {
      mayChange.add(contract.architecture.routerFile);
    }

    // Match files by entity keywords
    for (const relPath of allFiles) {
      if (protectedFiles.has(relPath)) continue;

      const lower = relPath.toLowerCase();
      const isEntityMatch = matchedKeywords.some(kw => lower.includes(kw));

      if (isEntityMatch) {
        if (lower.includes("controller") || lower.includes("route") || lower.includes("service") || lower.includes("page") || lower.includes("table") || lower.includes("list")) {
          mayChange.add(relPath);
        } else {
          readOnly.add(relPath);
        }
      } else {
        readOnly.add(relPath);
      }
    }

    return {
      mustChange: Array.from(mustChange),
      mayChange: Array.from(mayChange),
      readOnly: Array.from(readOnly),
      protected: Array.from(protectedFiles),
    };
  }
}
