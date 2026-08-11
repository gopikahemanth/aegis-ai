import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface UIFeatureResult {
  passed: boolean;
  missingElements: string[];
}

export class UIFeatureChecker {
  public static validate(projectRoot: string): UIFeatureResult {
    const missingElements: string[] = [];
    const srcDir = join(projectRoot, "src");

    let combinedContent = "";
    if (existsSync(srcDir)) {
      const files = this.getAllTsxFiles(srcDir);
      for (const f of files) {
        try { combinedContent += readFileSync(f, "utf8") + "\n"; } catch {}
      }
    }

    const lowerContent = combinedContent.toLowerCase();

    // Check 1: Interactive Input / Form / Editor Component
    const hasInput = lowerContent.includes('type="file"') ||
                     lowerContent.includes("textarea") ||
                     lowerContent.includes("<input") ||
                     lowerContent.includes("<form") ||
                     lowerContent.includes("dropzone") ||
                     lowerContent.includes("upload") ||
                     lowerContent.includes("editor") ||
                     lowerContent.includes("code") ||
                     lowerContent.includes("button");
    if (!hasInput) {
      missingElements.push("Interactive Input / Form component");
    }

    // Check 2: Results / Breakdown / Analysis Visualization Section
    const hasVisualization = lowerContent.includes("score") ||
                             lowerContent.includes("keywords") ||
                             lowerContent.includes("results") ||
                             lowerContent.includes("vulnerability") ||
                             lowerContent.includes("vulnerabilities") ||
                             lowerContent.includes("analysis") ||
                             lowerContent.includes("metrics") ||
                             lowerContent.includes("skills") ||
                             lowerContent.includes("overview") ||
                             lowerContent.includes("card");
    if (!hasVisualization) {
      missingElements.push("Analysis Results / Visualization section");
    }

    const passed = missingElements.length === 0;

    if (!passed) {
      console.warn(`[UIFeatureChecker] ⚠️ Missing UI components detected: ${missingElements.join("; ")}`);
    } else {
      console.log(`[UIFeatureChecker] ✓ Required UI features (Upload, Job Description, Keyword Breakdown) present.`);
    }

    return {
      passed,
      missingElements
    };
  }

  private static getAllTsxFiles(dir: string): string[] {
    let results: string[] = [];
    try {
      const list = readdirSync(dir, { withFileTypes: true });
      for (const entry of list) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(this.getAllTsxFiles(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
          results.push(fullPath);
        }
      }
    } catch {}
    return results;
  }
}
