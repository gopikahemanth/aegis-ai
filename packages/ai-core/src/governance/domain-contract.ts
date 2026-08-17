/**
 * DomainContract
 *
 * THE single source of truth for a project's business domain.
 *
 * Rules:
 * - ALWAYS derived from ArchitectureContractV1 (requiredModels, requiredFeatures, prompt).
 * - NEVER hardcoded for a specific application type.
 * - All downstream systems (CanonicalFileGraph, CanonicalDataModelContract,
 *   DomainContaminationValidator) read from this contract.
 *
 * The contract is generated once per project and locked in .aegis/domain-contract.json.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface DomainEntity {
  /** PascalCase model name e.g. "Repository", "ScanResult", "User" */
  name: string;
  /** Brief description of the entity's purpose */
  purpose: string;
  /** Whether this entity is a core domain entity or an infrastructure one (User, Session) */
  kind: "domain" | "infrastructure";
}

export interface DomainFeature {
  /** Unique identifier e.g. "upload-resume", "security-scan", "auth" */
  featureId: string;
  /** Human label */
  name: string;
  /** Brief description */
  description: string;
  /** Entities this feature operates on */
  entities: string[];
}

export interface DomainContract {
  /** Schema version — bump only on breaking changes */
  version: 1;
  /** Stable hash of this contract (excludes timestamps) */
  domainHash: string;
  /** The architecture hash this domain was derived from */
  architectureHash: string;
  /** Human label for the domain e.g. "AI Security Code Reviewer" */
  domainName: string;
  /** Short description of what the application does */
  domainDescription: string;
  /** All business entities in this domain */
  entities: DomainEntity[];
  /** All feature areas */
  features: DomainFeature[];
  /** Canonical terminology for this domain (used by contamination validator) */
  allowedTerminology: string[];
  /**
   * Terms that would be suspicious in this domain.
   * These are terms that belong to a DIFFERENT domain, not generic words.
   * Populated by deriving the DIFFERENCE between this domain's terminology
   * and known cross-domain vocabulary.
   */
  suspiciousTerminology: string[];
  /** ISO timestamp — NOT included in hash computation */
  lockedAt: string;
}

// ─── Known cross-domain term sets (for contamination detection) ─────────────
// These are NOT universal forbidden terms — they are domain-specific signals.
// They are only suspicious when found in a DIFFERENT domain.

const DOMAIN_VOCABULARIES: Record<string, string[]> = {
  resume: [
    "resume", "resumescanner", "jobdescription", "ats", "atsscore", "keywordmatch",
    "missingkeywords", "matchscore", "resumeupload", "candidate", "recruiter",
    "matchdashboard", "jobposting", "keywordgap",
  ],
  security: [
    "vulnerability", "cve", "remediation", "sast", "dast", "codereviewer",
    "securityscan", "riskrating", "severitylevel", "owasp", "securityaudit",
    "codescan", "finding",
  ],
  gym: [
    "member", "membership", "attendance", "gymfloor", "trainer", "workout",
    "fitnessplan", "gymmanagement", "checkin", "gymclass",
  ],
  recipe: [
    "recipe", "ingredient", "cuisinetype", "mealplan", "cookingtime", "servingsize",
    "dietaryrestriction", "recipecategory", "nutritioninfo",
  ],
  ecommerce: [
    "product", "cart", "checkout", "order", "shoppingcart", "sku", "inventory",
    "storefront", "wishlist", "discount", "coupon",
  ],
  blog: [
    "blogpost", "article", "author", "category", "tag", "comment", "cms",
    "publishdate", "slug", "excerpt",
  ],
};

// ─── DomainContractDeriver ──────────────────────────────────────────────────

export class DomainContractDeriver {
  /**
   * Derive a DomainContract from an ArchitectureContractV1.
   * This is the primary factory — never hardcode domain details.
   */
  public static derive(
    contract: ArchitectureContractV1,
    architectureHash: string,
  ): DomainContract {
    const entities = DomainContractDeriver.buildEntities(contract);
    const features = DomainContractDeriver.buildFeatures(contract, entities);
    const domainName = DomainContractDeriver.inferDomainName(contract);
    const domainDescription = DomainContractDeriver.inferDescription(contract);
    const allowedTerminology = DomainContractDeriver.buildAllowedTerminology(contract, entities, features);
    const suspiciousTerminology = DomainContractDeriver.buildSuspiciousTerminology(allowedTerminology);

    const stablePayload = {
      domainName,
      entities: entities.map(e => ({ name: e.name, kind: e.kind })),
      features: features.map(f => ({ featureId: f.featureId, entities: f.entities.sort() })),
      allowedTerminology: [...allowedTerminology].sort(),
    };
    const domainHash = createHash("sha256")
      .update(JSON.stringify(stablePayload))
      .digest("hex")
      .slice(0, 12);

    return {
      version: 1,
      domainHash,
      architectureHash,
      domainName,
      domainDescription,
      entities,
      features,
      allowedTerminology,
      suspiciousTerminology,
      lockedAt: new Date().toISOString(),
    };
  }

  // ── Entity derivation ───────────────────────────────────────────────────

  private static buildEntities(contract: ArchitectureContractV1): DomainEntity[] {
    const infrastructure = new Set(["User", "Session", "Token", "AuditLog", "RefreshToken"]);
    const entities: DomainEntity[] = [];

    // Always include User as infrastructure
    entities.push({ name: "User", purpose: "Application user account", kind: "infrastructure" });

    for (const modelName of (contract.requiredModels || [])) {
      if (modelName === "User") continue; // already added
      const kind: DomainEntity["kind"] = infrastructure.has(modelName) ? "infrastructure" : "domain";
      entities.push({
        name: modelName,
        purpose: DomainContractDeriver.inferEntityPurpose(modelName, contract),
        kind,
      });
    }

    return entities;
  }

  private static inferEntityPurpose(name: string, contract: ArchitectureContractV1): string {
    // Use the prompt to infer purpose
    const promptLower = (contract.prompt || "").toLowerCase();
    const nameLower = name.toLowerCase();

    // Try to find a sentence mentioning this entity in the prompt
    const sentences = promptLower.split(/[.!?]/);
    const relevant = sentences.find(s => s.includes(nameLower));
    if (relevant) {
      return `Represents ${name} in the context of: ${relevant.trim().slice(0, 80)}`;
    }

    return `${name} domain entity`;
  }

  // ── Feature derivation ──────────────────────────────────────────────────

  private static buildFeatures(
    contract: ArchitectureContractV1,
    entities: DomainEntity[],
  ): DomainFeature[] {
    const features: DomainFeature[] = [];
    const entityNames = entities.map(e => e.name);

    // Derive feature areas from requiredFeatures
    const rawFeatures = contract.requiredFeatures || [];
    const seenIds = new Set<string>();

    for (const feat of rawFeatures) {
      const featureId = feat.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (seenIds.has(featureId)) continue;
      seenIds.add(featureId);

      // Heuristically map feature to entities it operates on
      const featLower = feat.toLowerCase();
      const featureEntities = entityNames.filter(e =>
        featLower.includes(e.toLowerCase()) ||
        DomainContractDeriver.featureUsesEntity(featLower, e)
      );

      features.push({
        featureId,
        name: feat,
        description: feat,
        entities: featureEntities.length > 0 ? featureEntities : entityNames.slice(0, 2),
      });
    }

    // Always include auth feature
    if (!seenIds.has("auth")) {
      features.push({
        featureId: "auth",
        name: "Authentication",
        description: "User authentication and authorization",
        entities: ["User"],
      });
    }

    return features;
  }

  private static featureUsesEntity(featureLower: string, entityName: string): boolean {
    const entityLower = entityName.toLowerCase();
    // Simple heuristic: pluralization, verb+noun patterns
    return (
      featureLower.includes(entityLower + "s") ||
      featureLower.includes("manage " + entityLower) ||
      featureLower.includes("create " + entityLower) ||
      featureLower.includes("list " + entityLower) ||
      featureLower.includes("view " + entityLower)
    );
  }

  // ── Domain name inference ───────────────────────────────────────────────

  private static inferDomainName(contract: ArchitectureContractV1): string {
    const prompt = (contract.prompt || "").trim();
    if (!prompt) {
      // Fall back to features
      const features = contract.requiredFeatures || [];
      if (features.length > 0) return `${features[0]} Application`;
      return "Custom Application";
    }

    // Use the first ~60 chars of the prompt as domain name
    const cleaned = prompt.replace(/^(build|create|make|develop|implement)\s+(a|an)\s+/i, "").trim();
    return cleaned.length > 60 ? cleaned.slice(0, 60) + "..." : cleaned;
  }

  private static inferDescription(contract: ArchitectureContractV1): string {
    const prompt = (contract.prompt || "").trim();
    if (prompt) return prompt.slice(0, 200);
    return `${contract.requiredFeatures?.slice(0, 3).join(", ") || "Custom"} application`;
  }

  // ── Terminology building ────────────────────────────────────────────────

  private static buildAllowedTerminology(
    contract: ArchitectureContractV1,
    entities: DomainEntity[],
    features: DomainFeature[],
  ): string[] {
    const terms = new Set<string>();

    // Entity names and plurals
    for (const e of entities) {
      terms.add(e.name.toLowerCase());
      terms.add(e.name.toLowerCase() + "s");
    }

    // Feature IDs and names
    for (const f of features) {
      f.featureId.split("-").forEach(part => terms.add(part));
      f.name.toLowerCase().split(/\s+/).forEach(w => w.length > 3 && terms.add(w));
    }

    // Words from required models
    for (const model of (contract.requiredModels || [])) {
      // Split camelCase e.g. "JobDescription" -> ["job", "description"]
      const parts = model.replace(/([A-Z])/g, " $1").trim().toLowerCase().split(/\s+/);
      parts.forEach(p => p.length > 3 && terms.add(p));
    }

    // Words from prompt
    const promptWords = (contract.prompt || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 4);
    promptWords.slice(0, 50).forEach(w => terms.add(w));

    return Array.from(terms).sort();
  }

  private static buildSuspiciousTerminology(allowedTerms: Set<string> | string[]): string[] {
    const allowed = new Set(Array.isArray(allowedTerms) ? allowedTerms : Array.from(allowedTerms));
    const suspicious: string[] = [];

    for (const [, vocab] of Object.entries(DOMAIN_VOCABULARIES)) {
      for (const term of vocab) {
        // Only suspicious if it does NOT appear in this project's allowed vocabulary
        if (!allowed.has(term) && !allowed.has(term.replace(/s$/, ""))) {
          suspicious.push(term);
        }
      }
    }

    return [...new Set(suspicious)].sort();
  }
}

// ─── DomainContractManager ──────────────────────────────────────────────────

export class DomainContractManager {
  /**
   * Derive, lock, and persist a DomainContract.
   * Idempotent: if the same architectureHash is already stored, returns existing.
   */
  public static lock(
    contract: ArchitectureContractV1,
    architectureHash: string,
    outputDirectory: string,
  ): DomainContract {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const domainPath = join(aegisDir, "domain-contract.json");

    // Idempotency: reuse if architecture unchanged
    if (existsSync(domainPath)) {
      try {
        const existing = JSON.parse(readFileSync(domainPath, "utf8")) as DomainContract;
        if (existing.architectureHash === architectureHash) {
          console.log(`[DomainContract] 🔒 Reusing locked domain contract (hash: ${existing.domainHash}, domain: "${existing.domainName}")`);
          return existing;
        }
        console.log(`[DomainContract] ⚠️  Architecture changed — regenerating domain contract.`);
      } catch { /* recompute */ }
    }

    const domain = DomainContractDeriver.derive(contract, architectureHash);
    writeFileSync(domainPath, JSON.stringify(domain, null, 2), "utf8");

    console.log(`[DomainContract] 🔒 Locked domain contract:`);
    console.log(`  Domain:   "${domain.domainName}"`);
    console.log(`  Entities: [${domain.entities.map(e => e.name).join(", ")}]`);
    console.log(`  Features: [${domain.features.map(f => f.featureId).join(", ")}]`);
    console.log(`  Hash:     ${domain.domainHash}`);

    return domain;
  }

  public static load(outputDirectory: string): DomainContract | null {
    const domainPath = join(outputDirectory, ".aegis", "domain-contract.json");
    if (!existsSync(domainPath)) return null;
    try {
      return JSON.parse(readFileSync(domainPath, "utf8")) as DomainContract;
    } catch {
      return null;
    }
  }
}
