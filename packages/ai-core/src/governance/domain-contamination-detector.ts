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

import { readFileSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
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
   * Identifies the primary domain key for an active contract.
   */
  public static getActiveDomainKey(contract?: ArchitectureContractV1 | string): string {
    if (!contract) return "generic";
    if (typeof contract === "string") {
      const p = contract.toLowerCase();
      if (p.includes("resume") || p.includes("ats") || p.includes("cv") || p.includes("job description")) return "resume";
      if (p.includes("security") || p.includes("vulnerability") || p.includes("cve")) return "security";
      if (p.includes("telemedicine") || p.includes("patient") || p.includes("doctor") || p.includes("health")) return "telemedicine";
      if (p.includes("gym") || p.includes("fitness") || p.includes("workout")) return "gym";
      if (p.includes("task") || p.includes("kanban") || p.includes("todo")) return "task-manager";
      if (p.includes("ecommerce") || p.includes("shop") || p.includes("store") || p.includes("product")) return "ecommerce";
      return "generic";
    }

    const domainCat = (contract as any).domainCategory?.toLowerCase?.() || "";
    if (domainCat === "resume-scanner" || domainCat.includes("resume")) return "resume";
    if (domainCat === "code-reviewer" || domainCat.includes("security")) return "security";
    if (domainCat === "workout-fitness" || domainCat.includes("gym")) return "gym";
    if (domainCat === "task-manager" || domainCat.includes("task")) return "task-manager";
    if (domainCat === "ecommerce") return "ecommerce";

    const reqModels = (contract.requiredModels || []).map(m => m.toLowerCase());
    if (reqModels.includes("resume") || reqModels.includes("jobdescription") || reqModels.includes("matchanalysis")) return "resume";
    if (reqModels.includes("vulnerability") || reqModels.includes("cve")) return "security";

    const prompt = (contract.prompt || "").toLowerCase();
    const appType = (contract.applicationType || "").toLowerCase();
    for (const [key, sig] of Object.entries(this.DOMAIN_SIGNATURES)) {
      if (prompt.includes(key) || appType.includes(key)) {
        return key;
      }
    }

    return "generic";
  }

  /**
   * Scans a project directory for domain contamination.
   */
  public static scanProject(projectRoot: string, contract?: ArchitectureContractV1): DomainContaminationReport {
    const violations: ContaminationViolation[] = [];
    const activeDomainKey = this.getActiveDomainKey(contract);

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
      const relFileLower = relFile.toLowerCase();

      // Check against forbidden signatures of OTHER domains
      for (const [domainKey, sig] of Object.entries(this.DOMAIN_SIGNATURES)) {
        if (domainKey === activeDomainKey) continue;

        const matchedTerms: string[] = [];

        // Check file path contamination
        if (domainKey === "resume" && (
          relFileLower.includes("scan.controller") ||
          relFileLower.includes("scan.routes") ||
          relFileLower.includes("scan.service") ||
          relFileLower.includes("keyword.service") ||
          relFileLower.includes("matchdashboard")
        )) {
          matchedTerms.push(relFile);
        }

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

  /**
   * Cleans foreign-domain contamination files from a project directory.
   */
  public static cleanContamination(projectRoot: string, contract?: ArchitectureContractV1): string[] {
    const activeDomainKey = this.getActiveDomainKey(contract);
    const cleaned: string[] = [];

    // If active domain is NOT ATS/resume, remove known foreign ATS files
    if (activeDomainKey !== "resume") {
      const foreignAtsFiles = [
        "server/controllers/scan.controller.ts",
        "server/routes/scan.routes.ts",
        "server/middleware/upload.middleware.ts",
        "server/services/pdf.service.ts",
        "server/services/keyword.service.ts",
        "src/services/scan.service.ts",
        "src/features/history/services/historyService.ts",
        "src/features/dashboard/components/MatchDashboard.tsx",
      ];

      for (const rel of foreignAtsFiles) {
        const full = join(projectRoot, rel);
        if (existsSync(full)) {
          try {
            unlinkSync(full);
            cleaned.push(`Removed foreign ATS file: ${rel}`);
            console.log(`[DomainContamination] 🧹 Removed foreign ATS artifact: ${rel}`);
          } catch (e: any) {
            console.warn(`[DomainContamination] Failed to remove ${rel}: ${e.message}`);
          }
        }
      }
    }

    return cleaned;
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
