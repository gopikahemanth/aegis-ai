import type { GeneratedFile } from "../writer/writer.js";
import type { ReviewReport } from "./review-report.js";

export class Reviewer {
  review(
    files: GeneratedFile[],
  ): ReviewReport {

    const issues: ReviewReport["issues"] = [];

    for (const file of files) {

      if (!file.content.trim()) {
        issues.push({
          file: file.path,
          message: "Empty file.",
        });
      }

      if (
        file.content.includes(
          "ReactDOM.render",
        )
      ) {
        issues.push({
          file: file.path,
          message:
            "Outdated React API detected.",
        });
      }

      if (
        file.path.endsWith(".tsx") &&
        !file.content.includes("export")
      ) {
        issues.push({
          file: file.path,
          message:
            "Missing export.",
        });
      }

      if (
        file.path ===
        "src/index.tsx"
      ) {
        issues.push({
          file: file.path,
          message:
            "React Vite should not generate src/index.tsx.",
        });
      }
    }

    return {
      passed:
        issues.length === 0,
      issues,
    };
  }
}
