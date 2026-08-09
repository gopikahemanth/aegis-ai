import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface UIFeatureResult {
  passed: boolean;
  missingElements: string[];
}

export class UIFeatureChecker {
  public static validate(projectRoot: string): UIFeatureResult {
    const missingElements: string[] = [];
    const filesToScan = [
      join(projectRoot, "src", "features", "upload", "UploadPage.tsx"),
      join(projectRoot, "src", "features", "dashboard", "DashboardPage.tsx"),
      join(projectRoot, "src", "features", "analysis", "components", "MatchDashboard.tsx"),
      join(projectRoot, "src", "routes.tsx"),
      join(projectRoot, "src", "App.tsx")
    ];

    let combinedContent = "";
    for (const f of filesToScan) {
      if (existsSync(f)) {
        try { combinedContent += readFileSync(f, "utf8") + "\n"; } catch {}
      }
    }

    // Check 1: File Upload Input / Dropzone
    if (!combinedContent.includes('type="file"') && !combinedContent.includes("accept") && !combinedContent.includes("ResumeUploader")) {
      missingElements.push("File Upload Input / PDF dropzone component");
    }

    // Check 2: Job Description Input
    if (!combinedContent.includes("<textarea") && !combinedContent.includes("jobDescription")) {
      missingElements.push("Job Description textarea input");
    }

    // Check 3: Keyword Breakdown Rendering
    if (!combinedContent.includes("matchedKeywords") && !combinedContent.includes("Matched Keywords") && !combinedContent.includes("skills")) {
      missingElements.push("Matched / Missing Keyword Breakdown section");
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
}
