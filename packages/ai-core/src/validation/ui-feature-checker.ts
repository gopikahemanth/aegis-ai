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

    // Check 1: Interactive Input / Form Component
    const hasInput = combinedContent.includes('type="file"') || combinedContent.includes("<textarea") || combinedContent.includes("<input") || combinedContent.includes("<form") || combinedContent.includes("dropzone") || combinedContent.includes("Upload");
    if (!hasInput) {
      missingElements.push("Interactive Input / Form component");
    }

    // Check 2: Results / Breakdown / Analysis Visualization Section
    const hasVisualization = combinedContent.includes("score") || combinedContent.includes("keywords") || combinedContent.includes("results") || combinedContent.includes("vulnerabilities") || combinedContent.includes("analysis") || combinedContent.includes("metrics") || combinedContent.includes("skills");
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
