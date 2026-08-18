/**
 * DomainContaminationDetector
 *
 * Scans generated source code and schemas to detect domain leakage from foreign templates,
 * obsolete models, or unrelated domain vocabularies.
 *
 * Rules:
 * - A project of domain X must NOT contain entities or terminology exclusive to domain Y.
 * - Flags foreign models (e.g. Vulnerability in a Gym app, WorkoutPlan in a Security app).
 * - Generates a structured contamination report with severity and offending file paths.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface ContaminationViolation {
  file: string;
  foreignDomain: string;
  detectedTerms: string[];
  snippet: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface DomainContaminationReport {
  clean: boolean;
  contaminationScore: number; // 0 (completely clean) to 100 (heavily contaminated)
  projectDomain: string;
  violations: ContaminationViolation[];
}

export class DomainContaminationDetector {
  private static readonly DOMAIN_SIGNATURES: Record<string, { name: string; terms: string[]; forbiddenInOtherDomains: string[] }> = {
    security: {
      name: "Code Security / Vulnerability Scanner",
      terms: ["vulnerability", "cve", "owasp", "scan", "remediation", "security audit", "risk score", "ast rule"],
      forbiddenInOtherDomains: ["cve-", "owasp", "vulnerability", "remediation", "code security scanner", "static analysis rule"],
    },
    resume: {
      name: "Resume / ATS Matcher",
      terms: ["resume", "job description", "match score", "applicant", "ats", "extracted text", "keyword match"],
      forbiddenInOtherDomains: ["jobdescription", "resumeparser", "keywordmatch", "resume analyzer", "match score analysis"],
    },
    telemedicine: {
      name: "Telemedicine / Health",
      terms: ["doctor", "patient", "prescription", "consultation", "medical record", "telehealth"],
      forbiddenInOtherDomains: ["prescription", "telemedicine", "patient health portal", "doctor consultation"],
    },
    gym: {
      name: "Gym / Fitness Management",
      terms: ["workout", "membership", "trainer", "attendance", "exercise", "routine"],
      forbiddenInOtherDomains: ["workoutplan", "active streak", "gym membership"],
    },
  };

  /**
   * Scans a project directory for domain contamination.
   */
  public static scanProject(projectRoot: string, contract?: ArchitectureContractV1): DomainContaminationReport {
    const violations: ContaminationViolation[] = [];
    const prompt = (contract?.prompt || "").toLowerCase();
    const appType = (contract?.applicationType || "").toLowerCase();

    // Determine current project's primary domain
    let activeDomainKey = "generic";
    for (const [key, sig] of Object.entries(this.DOMAIN_SIGNATURES)) {
      if (prompt.includes(key) || appType.includes(key)) {
        activeDomainKey = key;
        break;
      }
    }

    const allFiles = this.getAllSourceFiles(projectRoot);

    for (const relFile of allFiles) {
      const fullPath = join(projectRoot, relFile);
      let content = "";
      try {
        content = readFileSync(fullPath, "utf8");
      } catch {
        continue;
      }

      const contentLower = content.toLowerCase();

      // Check against forbidden signatures of OTHER domains
      for (const [domainKey, sig] of Object.entries(this.DOMAIN_SIGNATURES)) {
        if (domainKey === activeDomainKey) continue;

        const matchedTerms: string[] = [];
        for (const term of sig.forbiddenInOtherDomains) {
          if (contentLower.includes(term)) {
            matchedTerms.push(term);
          }
        }

        if (matchedTerms.length > 0) {
          // Extract snippet
          const firstTerm = matchedTerms[0];
          const idx = contentLower.indexOf(firstTerm);
          const start = Math.max(0, idx - 40);
          const snippet = content.slice(start, start + 120).replace(/\s+/g, " ");

          violations.push({
            file: relFile,
            foreignDomain: sig.name,
            detectedTerms: matchedTerms,
            snippet,
            severity: matchedTerms.length > 2 ? "CRITICAL" : "HIGH",
          });
        }
      }
    }

    const contaminationScore = Math.min(100, violations.length * 20);

    return {
      clean: violations.length === 0,
      contaminationScore,
      projectDomain: activeDomainKey,
      violations,
    };
  }

  private static getAllSourceFiles(dir: string, prefix = ""): string[] {
    const results: string[] = [];
    const srcDirs = ["src", "server", "prisma"];

    for (const d of srcDirs) {
      const full = join(dir, d);
      if (existsSync(full)) {
        results.push(...this.walkDir(full, d));
      }
    }

    return results;
  }

  private static walkDir(dir: string, currentRel: string): string[] {
    const files: string[] = [];
    try {
      const list = readdirSync(dir);
      for (const item of list) {
        if (item === "node_modules" || item === ".git" || item === "dist") continue;
        const full = join(dir, item);
        const rel = join(currentRel, item);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          files.push(...this.walkDir(full, rel));
        } else if (/\.(ts|tsx|js|jsx|prisma)$/.test(item)) {
          files.push(rel.replace(/\\/g, "/"));
        }
      }
    } catch {}
    return files;
  }
}
