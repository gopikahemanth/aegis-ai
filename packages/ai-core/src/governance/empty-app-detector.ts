import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface EmptyAppDetectionResult {
  isEmpty: boolean;
  reasons: string[];
}

export class EmptyAppDetector {
  public static inspectDOM(htmlContent: string): EmptyAppDetectionResult {
    const reasons: string[] = [];

    if (!htmlContent || htmlContent.trim().length === 0) {
      reasons.push("HTML document is completely empty");
      return { isEmpty: true, reasons };
    }

    // Check for empty body or unmounted root div
    const bodyContent = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
    const cleanBody = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").trim();

    if (cleanBody.length === 0 || cleanBody === '<div id="root"></div>' || cleanBody === '<div id="app"></div>') {
      reasons.push("DOM body is empty or contains unmounted root container");
    }

    if (htmlContent.includes("Uncaught ReferenceError") || htmlContent.includes("Uncaught TypeError")) {
      reasons.push("Runtime script evaluation error detected in HTML source");
    }

    return {
      isEmpty: reasons.length > 0,
      reasons
    };
  }

  public static inspectProjectSource(outputDirectory: string): EmptyAppDetectionResult {
    const reasons: string[] = [];
    const srcDir = join(outputDirectory, "src");

    if (!existsSync(srcDir)) {
      return { isEmpty: true, reasons: ["src/ directory does not exist"] };
    }

    const getAllSourceFiles = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === "dist") continue;
        const full = join(dir, entry);
        if (existsSync(full)) {
          if (/\.(tsx|ts|jsx|js)$/.test(entry)) {
            files.push(full);
          }
        }
      }
      return files;
    };

    const files = getAllSourceFiles(srcDir);
    if (files.length === 0) {
      reasons.push("No TypeScript/JavaScript source files found under src/");
    }

    return {
      isEmpty: reasons.length > 0,
      reasons
    };
  }
}
