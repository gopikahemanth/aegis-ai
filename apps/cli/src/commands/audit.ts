import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

interface SecurityFinding {
  file: string;
  line: number;
  severity: "HIGH" | "MEDIUM" | "LOW";
  ruleName: string;
  snippet: string;
  remediation: string;
}

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!existsSync(dir)) return fileList;
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== ".git" && file !== ".turbo") {
        scanDirectory(fullPath, fileList);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

export async function auditCommand() {
  const projectPath = "./generated/project";
  if (!existsSync(projectPath)) {
    console.log("\n❌ No generated project found to scan. Execute Aegis create first.\n");
    return;
  }

  console.log("\n🔒 Starting Aegis Security Audit SAST Scanner...");
  console.log("--------------------------------------------------");

  const files = scanDirectory(projectPath);
  const findings: SecurityFinding[] = [];

  const rules = [
    {
      regex: /eval\s*\(/g,
      severity: "HIGH" as const,
      ruleName: "Arbitrary Code Execution (eval)",
      remediation: "Replace eval() with structured parser calls or JSON.parse to prevent remote code execution vectors."
    },
    {
      regex: /dangerouslySetInnerHTML/g,
      severity: "MEDIUM" as const,
      ruleName: "Cross-Site Scripting (XSS)",
      remediation: "Ensure all variables interpolated in dangerouslySetInnerHTML are properly sanitized using dompurify."
    },
    {
      regex: /(password|secret|private_key|api_key|token)\s*[:=]\s*["'][a-zA-Z0-9_\-]{8,}["']/gi,
      severity: "HIGH" as const,
      ruleName: "Hardcoded Credential Leakage",
      remediation: "Move sensitive tokens or private keys to environment variables (.env files) and read them via process.env."
    }
  ];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      const relativePath = file.replace(resolve(projectPath), "").replace(/^[\\\/]/, "");

      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];
        for (const rule of rules) {
          // Reset RegExp index for global searches
          rule.regex.lastIndex = 0;
          if (rule.regex.test(lineContent)) {
            findings.push({
              file: relativePath,
              line: i + 1,
              severity: rule.severity,
              ruleName: rule.ruleName,
              snippet: lineContent.trim(),
              remediation: rule.remediation
            });
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Audit] Warning: Could not read file ${file}: ${err.message}`);
    }
  }

  console.log(`Scan finished. Evaluated ${files.length} codebase files.\n`);

  if (findings.length === 0) {
    console.log("✨ SUCCESS: Zero security vulnerabilities or hardcoded secrets detected!");
    console.log("✓ Codebase complies with OWASP Top 10 guidelines.\n");
    return;
  }

  console.log(`⚠️ WARNING: Detected ${findings.length} security alerts:\n`);

  for (const finding of findings) {
    const color = finding.severity === "HIGH" ? "🔴 [HIGH]" : "🟡 [MEDIUM]";
    console.log(`${color} ${finding.ruleName}`);
    console.log(`  File:  ${finding.file}:${finding.line}`);
    console.log(`  Code:  "${finding.snippet}"`);
    console.log(`  Fix:   ${finding.remediation}\n`);
  }

  console.log("--------------------------------------------------");
  console.log("👉 Recommendation: Resolve the issues above before building your production bundle.");
  console.log("==================================================\n");
}
