import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

export interface ContractViolation {
  file: string;
  line: number;
  feature: string;
  violation: string;
  severity: "error" | "warning";
}

export interface FeatureContract {
  name: string;
  /** Keywords that indicate this feature was REQUESTED in the project */
  triggerKeywords: RegExp[];
  /** Patterns that must be PRESENT somewhere in the project if triggered */
  requiredPatterns: { label: string; pattern: RegExp }[];
  /** Patterns that are FORBIDDEN anywhere in the project if triggered */
  forbiddenPatterns: { label: string; pattern: RegExp }[];
}

/**
 * FeatureContractValidator
 *
 * Scans a generated project directory and enforces feature contracts.
 * Each contract defines what must / must not exist in source code for a given feature.
 * Runs after the CoderAgent and before the project is marked complete.
 */
export class FeatureContractValidator {
  private readonly sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte"]);

  private readonly contracts: FeatureContract[] = [
    {
      name: "File Upload",
      triggerKeywords: [/upload/i, /dropzone/i, /file\s*input/i],
      requiredPatterns: [
        { label: "real file input handler", pattern: /e\.target\.files|onChange.*file|onDrop.*files|FileReader|FormData/i }
      ],
      forbiddenPatterns: [
        { label: "fake upload alert", pattern: /alert\s*\(\s*['"].*upload/i }
      ]
    },
    {
      name: "ATS Score Calculation",
      triggerKeywords: [/ats\s*score/i, /resume\s*scan/i, /applicant\s*track/i],
      requiredPatterns: [
        { label: "real score derivation from text", pattern: /split\s*\(|toLowerCase\s*\(|filter\s*\(|reduce\s*\(|match\s*\(|keywords/i }
      ],
      forbiddenPatterns: [
        { label: "hardcoded ATS score", pattern: /const\s+\w*(ats|resume|match)\w*Score\s*=\s*\d+/i },
        { label: "Math.random score", pattern: /Math\.random\(\)\s*\*\s*\d+/i }
      ]
    },
    {
      name: "PDF / Document Parsing",
      triggerKeywords: [/pdf\s*parse|extract\s*text|read\s*resume|parse\s*document/i],
      requiredPatterns: [
        { label: "real parser or FileReader", pattern: /pdfjs|pdf-parse|mammoth|FileReader|arrayBuffer|getDocument/i }
      ],
      forbiddenPatterns: [
        { label: "hardcoded resume text", pattern: /const\s+resumeText\s*=\s*['"`][A-Za-z\s,]{20,}/i }
      ]
    },
    {
      name: "Chart / Graph Data",
      triggerKeywords: [/chart|graph|recharts|chart\.js|apexchart/i],
      requiredPatterns: [
        { label: "chart data from state or props", pattern: /useState|useSelector|props\.\w+|data:\s*\w+[^0-9]|series:\s*\w+[^0-9]/i }
      ],
      forbiddenPatterns: [
        { label: "hardcoded chart data array", pattern: /data\s*:\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+/i }
      ]
    },
    {
      name: "PDF Export",
      triggerKeywords: [/export.*pdf|download.*pdf|generate.*pdf|print.*report/i],
      requiredPatterns: [
        { label: "real PDF export library or print API", pattern: /jsPDF|html2canvas|window\.print\s*\(|printJS|pdfMake/i }
      ],
      forbiddenPatterns: [
        { label: "fake export alert or console.log", pattern: /alert\s*\(\s*['"].*export|console\.log\s*\(\s*['"].*export/i }
      ]
    },
    {
      name: "Data Persistence / History",
      triggerKeywords: [/history|save\s*result|persist|scan\s*history/i],
      requiredPatterns: [
        { label: "real persistence mechanism", pattern: /localStorage\.(setItem|getItem)|sessionStorage|indexedDB|fetch|axios|apiClient|useMutation|useQuery|supabase|prisma|mongoose|sqlite|db/i }
      ],
      forbiddenPatterns: [
        { label: "history only in React state", pattern: /setHistory\s*\(\s*\[\.\.\.\w+,/i }
      ]
    }
  ];

  /**
   * Validate a generated project directory against all feature contracts.
   */
  public validate(projectDirectory: string): ContractViolation[] {
    const allFiles = this.collectSourceFiles(projectDirectory);
    const fileContents = this.readFiles(allFiles);
    const allSource = fileContents.map(f => f.content).join("\n");

    const violations: ContractViolation[] = [];

    for (const contract of this.contracts) {
      const triggered = contract.triggerKeywords.some(kw => kw.test(allSource));
      if (!triggered) continue;

      // Check required patterns — must appear somewhere in project
      for (const required of contract.requiredPatterns) {
        const found = fileContents.some(f => required.pattern.test(f.content));
        if (!found) {
          violations.push({
            file: "(project-wide)",
            line: 0,
            feature: contract.name,
            violation: `Missing required implementation: ${required.label}`,
            severity: "error"
          });
        }
      }

      // Check forbidden patterns — must NOT appear anywhere
      for (const forbidden of contract.forbiddenPatterns) {
        for (const { path, content, lines } of fileContents) {
          for (let i = 0; i < lines.length; i++) {
            if (forbidden.pattern.test(lines[i])) {
              violations.push({
                file: path,
                line: i + 1,
                feature: contract.name,
                violation: `Forbidden pattern (${forbidden.label}): "${lines[i].trim()}"`,
                severity: "error"
              });
            }
          }
        }
      }
    }

    return violations;
  }

  /**
   * Format violations as a human-readable string for the healing loop.
   */
  public formatViolations(violations: ContractViolation[]): string {
    if (violations.length === 0) return "✓ All feature contracts satisfied — no mock data detected.";
    const errors = violations.filter(v => v.severity === "error");
    const warnings = violations.filter(v => v.severity === "warning");
    const lines: string[] = [
      `🔴 Reality Checker: ${errors.length} contract violation(s) detected`,
      ""
    ];
    for (const v of [...errors, ...warnings]) {
      const icon = v.severity === "error" ? "✗" : "⚠";
      lines.push(`${icon} [${v.feature}] ${v.file}${v.line > 0 ? `:${v.line}` : ""}`);
      lines.push(`  → ${v.violation}`);
    }
    lines.push("\nEach violation above represents a feature that appears implemented but is actually fake.");
    lines.push("Fix every violation by implementing the real logic described in the Feature Contracts.");
    return lines.join("\n");
  }

  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;
    const walk = (d: string) => {
      for (const entry of readdirSync(d)) {
        if (entry === "node_modules" || entry === "dist" || entry === "build" || entry.startsWith(".")) continue;
        const fullPath = join(d, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (this.sourceExtensions.has(extname(entry))) {
          results.push(fullPath);
        }
      }
    };
    walk(dir);
    return results;
  }

  private readFiles(paths: string[]): { path: string; content: string; lines: string[] }[] {
    return paths.map(p => {
      try {
        const content = readFileSync(p, "utf8");
        return { path: p, content, lines: content.split(/\r?\n/) };
      } catch {
        return { path: p, content: "", lines: [] };
      }
    });
  }
}
