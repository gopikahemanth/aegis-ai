import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";

export interface DomainValidationResult {
  passed: boolean;
  score: number;
  forbiddenMatches: string[];
  genericLabelMatches: string[];
  missingRequiredFeatures: string[];
  purgedFiles: string[];
}

// Generic AI-hallucinated labels that indicate domain vocabulary was lost
const GENERIC_UI_LABELS = [
  "Total Activity Volume",
  "Target Goal Metric",
  "Performance Compliance",
  "Activity Overview",
  "Goal Progress Metric",
  "Compliance Rate",
  "Generic Metric",
  "KPI Value",
  "Dashboard Stats",
  "System Performance",
  "Activity Score",
  "Efficiency Rating",
  "Operational Metrics",
  "Key Indicators",
  "Progress Units",
  "Metric Units",
];

export class DomainConsistencyValidator {
  public static validate(
    outputDirectory: string,
    spec: CanonicalProjectSpecification
  ): DomainValidationResult {
    const forbiddenMatches: string[] = [];
    const genericLabelMatches: string[] = [];
    const missingRequiredFeatures: string[] = [];
    const purgedFiles: string[] = [];

    if (!existsSync(outputDirectory)) {
      return { passed: false, score: 0, forbiddenMatches: [], genericLabelMatches: [], missingRequiredFeatures: ["outputDirectory"], purgedFiles: [] };
    }

    const getAllFiles = (dir: string): string[] => {
      const results: string[] = [];
      for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".git" || entry === "dist") continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          results.push(...getAllFiles(full));
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
          results.push(full);
        }
      }
      return results;
    };

    const files = getAllFiles(outputDirectory);
    const domain = spec.domainCategory;

    let contractPrompt = "";
    try {
      const contractPath = join(outputDirectory, ".aegis", "architecture-contract.json");
      if (existsSync(contractPath)) {
        const loaded = JSON.parse(readFileSync(contractPath, "utf8"));
        contractPrompt = (loaded.prompt || "").toLowerCase();
      }
    } catch { }
    const fullContext = `${contractPrompt} ${(spec as any)?.prompt || ""} ${spec.domainCategory || ""}`.toLowerCase();
    const allowsGallery = fullContext.includes("gallery") || fullContext.includes("galleries") || fullContext.includes("photo") || (spec.features || []).some((f: any) => String(f.name || f).toLowerCase().includes("gallery"));

    for (const file of files) {
      try {
        const content = readFileSync(file, "utf8");
        const rel = relative(outputDirectory, file).replace(/\\/g, "/");

        // Only check frontend source files for label quality
        const isFrontendFile = rel.startsWith("src/") && (rel.endsWith(".tsx") || rel.endsWith(".jsx"));

        // Check for forbidden domain patterns (structural)
        for (const pattern of spec.forbiddenPatterns) {
          if (allowsGallery && (pattern === "Gallery" || pattern === "Artwork" || pattern === "ArtworkCard" || pattern === "ArtworkDashboard")) {
            continue;
          }
          if (content.includes(pattern) || rel.includes(pattern)) {
            forbiddenMatches.push(`${rel}: contains forbidden pattern '${pattern}'`);
            // Read-Only Safety Invariant: Validators NEVER silently overwrite or purge source files during validation.
            // Diagnosis is reported to the repair engine or caller.
          }
        }

        // Check for generic AI-hallucinated labels in frontend files
        if (isFrontendFile) {
          for (const label of GENERIC_UI_LABELS) {
            if (content.includes(label)) {
              genericLabelMatches.push(`${rel}: contains generic placeholder label "${label}"`);
            }
          }
        }
      } catch { }
    }

    // Required domain feature checks
    if (domain === "expense-tracker") {
      const allText = files.map(f => { try { return readFileSync(f, "utf8") + " " + f; } catch { return ""; } }).join("\n").toLowerCase();
      if (!allText.includes("transaction") && !allText.includes("merchant") && !allText.includes("expense") && !allText.includes("spending")) {
        missingRequiredFeatures.push("Transactions Table / Management");
      }
      if (!allText.includes("budget") && !allText.includes("income") && !allText.includes("balance")) {
        missingRequiredFeatures.push("Category Budgets");
      }
    }

    if (genericLabelMatches.length > 0) {
      console.warn(`[DomainConsistencyValidator] ⚠️  ${genericLabelMatches.length} generic UI label(s) detected:`);
      for (const match of genericLabelMatches) {
        console.warn(`  [HIGH] ${match}`);
      }
    }

    const totalIssues = forbiddenMatches.length + missingRequiredFeatures.length + Math.floor(genericLabelMatches.length / 2);
    const score = Math.max(0, 100 - totalIssues * 15);
    const passed = score >= 90 && missingRequiredFeatures.length === 0;

    return {
      passed,
      score,
      forbiddenMatches,
      genericLabelMatches,
      missingRequiredFeatures,
      purgedFiles
    };
  }
}
