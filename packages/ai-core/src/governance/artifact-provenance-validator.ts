/**
 * ArtifactProvenanceValidator
 *
 * Generic, contract-driven artifact provenance engine.
 *
 * Core Invariant:
 * Every generated file, component, feature directory, entity, page, and backend route
 * must trace its provenance directly to the active ArchitectureContractV1:
 *   Artifact -> Can I trace it to the active contract?
 *      YES -> allowed
 *      NO  -> orphan -> reject and purge before build
 *
 * Guarantees:
 * - Completely domain-agnostic (zero hardcoded keyword blacklists).
 * - Fails closed if foreign domain artifacts with no contract provenance exist.
 * - Cleans stray import and route bindings in entrypoints when unprovenanced artifacts are purged.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync, rmSync, mkdirSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { ArchitectureResolver, type ArchitectureContractV1 } from "./architecture-resolver.js";

export interface ArtifactProvenanceRecord {
  path: string;
  type: "feature_directory" | "entity" | "page" | "server_route" | "server_controller" | "orphan_file";
  identifier: string;
  hasProvenance: boolean;
  matchedContractNode?: string;
}

export interface ProvenancePurgeAuditEntry {
  path: string;
  classification: "FOREIGN_ARTIFACT";
  reason: string;
  action: "PURGED";
}

export interface ProvenanceAuditReport {
  valid: boolean;
  totalArtifacts: number;
  provenancedCount: number;
  unprovenancedArtifacts: ArtifactProvenanceRecord[];
  purgedCount: number;
  auditTrail?: ProvenancePurgeAuditEntry[];
  foreignArtifactsRemaining: number;
}

export class ArtifactProvenanceValidator {
  /**
   * Universally permitted technical and infrastructure tokens present in any modern full-stack web application.
   */
  private static readonly INFRASTRUCTURE_TOKENS = new Set([
    // Auth & Identity
    "auth", "user", "users", "login", "register", "session", "sessions", "profile", "profiles", "account", "accounts", "token", "tokens",
    // Shell & Navigation
    "layout", "nav", "navbar", "sidebar", "header", "footer", "routes", "route", "app", "main", "home", "index", "notfound", "root",
    // Generic Dashboard & Metrics
    "dashboard", "overview", "stats", "metrics", "analytics", "reports", "report", "audit", "audits", "activity", "activities", "logs", "log", "status", "health",
    // Generic UI & Design System
    "shared", "components", "component", "common", "ui", "design-system", "designsystem", "button", "card", "cards", "table", "tables", "modal", "dialog", "badge", "input", "form", "forms", "chart", "charts", "loader", "spinner", "toast", "drawer", "tabs", "icons", "icon", "view", "panel", "screen",
    // File & Media Transfer (primitives only)
    "file", "files", "download", "downloads", "export", "exports", "import", "imports", "media", "storage",
    // Architecture & Utilities
    "api", "services", "service", "types", "type", "utils", "util", "lib", "context", "hooks", "hook", "store", "client", "prisma", "db", "database", "server", "controllers", "controller", "middleware", "dev", "config"
  ]);


  /**
   * Common prompt stop-words to exclude when extracting substantive domain tokens.
   */
  private static readonly PROMPT_STOP_WORDS = new Set([
    "build", "a", "an", "the", "and", "or", "of", "to", "in", "for", "with", "on", "at", "by",
    "from", "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "can", "could", "should", "would", "must",
    "modern", "full", "stack", "full-stack", "fullstack", "platform", "system", "application", "app",
    "management", "manager", "solution", "tool", "portal", "console", "dashboard", "responsive",
    "ui", "ux", "web", "api", "apis", "frontend", "backend", "database", "create", "read", "update",
    "delete", "crud", "interface", "users", "user", "allow", "allows", "should", "key", "capabilities",
    "features", "feature", "zero", "placeholder", "content", "called", "complete", "comprehensive"
  ]);

  /**
   * Derives all authorized contract tokens from the active architecture contract.
   */
  public static deriveAuthorizedTokens(contract?: ArchitectureContractV1 | any): Set<string> {
    const tokens = new Set<string>();

    // 1. Always include infrastructure tokens
    for (const t of ArtifactProvenanceValidator.INFRASTRUCTURE_TOKENS) {
      tokens.add(t);
    }

    if (!contract) return tokens;

    const addStemmedToken = (rawWord: string) => {
      const word = rawWord.toLowerCase();
      if (word.length <= 2) return;
      tokens.add(word);
      tokens.add(word + "s");
      if (word.endsWith("y")) {
        tokens.add(word.slice(0, -1) + "ies");
      }
      if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
        tokens.add(word.slice(0, -1));
      }
      if (word.endsWith("ies") && word.length > 4) {
        tokens.add(word.slice(0, -3) + "y");
      }
      if (word.endsWith("ing") && word.length > 5) {
        let base = word.slice(0, -3);
        if (base.length > 3 && base[base.length - 1] === base[base.length - 2]) {
          base = base.slice(0, -1);
        }
        tokens.add(base);
        tokens.add(base + "s");
      }
      if (word.endsWith("er") && word.length > 4) {
        let base = word.slice(0, -2);
        if (base.length > 3 && base[base.length - 1] === base[base.length - 2]) {
          base = base.slice(0, -1);
        }
        tokens.add(base);
        tokens.add(base + "s");
      }
    };

    // 2. Contract domainCategory tokens (e.g. resume-scanner -> resume, scanner, scan)
    if (contract.domainCategory) {
      const parts = String(contract.domainCategory).toLowerCase().split(/[-_\s]+/);
      for (const p of parts) {
        addStemmedToken(p);
      }
    }

    // 3. Contract required models (singular, plural, lowercase)
    const models: string[] = contract.requiredModels || [];
    for (const m of models) {
      addStemmedToken(m);
      if (m.toLowerCase().endsWith("y")) tokens.add(m.toLowerCase().slice(0, -1) + "ies");
      // Split compound words (e.g. TelemetryPoint -> telemetry, point)
      const parts = m.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/\s+/);
      for (const p of parts) {
        addStemmedToken(p);
      }
    }

    // 4. Contract required features
    const features: string[] = contract.requiredFeatures || [];
    for (const f of features) {
      const parts = f.toLowerCase().split(/[-_\s]+/);
      for (const p of parts) {
        addStemmedToken(p);
      }
    }

    // 5. Contract required routes
    const routes: string[] = (contract.requiredRoutes || []).map((r: any) => typeof r === "string" ? r : r?.path).filter(Boolean);
    for (const r of routes) {
      const slug = r.replace(/^\//, "").toLowerCase();
      const parts = slug.split(/[-_\s/]+/);
      for (const p of parts) {
        addStemmedToken(p);
      }
    }

    // 6. Prompt domain tokens
    const promptText = (contract.prompt || "").toLowerCase();
    if (promptText) {
      const rawWords = promptText.match(/[a-z0-9_-]+/g) || [];
      for (const w of rawWords) {
        if (w.length > 2 && !ArtifactProvenanceValidator.PROMPT_STOP_WORDS.has(w)) {
          addStemmedToken(w);
        }
      }
    }

    return tokens;
  }

  /**
   * Checks whether an artifact identifier has provenance in the active contract.
   */
  public static hasProvenance(identifier: string, authorizedTokens: Set<string>): boolean {
    const cleanId = identifier.toLowerCase().replace(/[-_\s]+/g, "");
    if (authorizedTokens.has(cleanId)) return true;

    // Direct plural/singular check
    if (cleanId.endsWith("s") && authorizedTokens.has(cleanId.slice(0, -1))) return true;
    if (cleanId.endsWith("ies") && authorizedTokens.has(cleanId.slice(0, -3) + "y")) return true;

    // Check individual token components (e.g., InverterTable -> inverter, table)
    const tokens = identifier
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .split(/[-_\s]+/);

    // If at least one non-generic word traces directly to the contract models or prompt nouns, it's justified
    if (tokens.some(t => t.length > 2 && (authorizedTokens.has(t) || (t.endsWith("s") && authorizedTokens.has(t.slice(0, -1)))))) {
      return true;
    }

    // Substring match for non-camelcased compound identifiers (e.g., operationalevents -> operational, event)
    for (const t of authorizedTokens) {
      if (t.length >= 4 && cleanId.includes(t)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Audits all project artifacts and returns a report of provenanced vs unprovenanced items.
   */
  public static auditArtifacts(projectRoot: string, contract?: ArchitectureContractV1 | any): ProvenanceAuditReport {
    const activeContract = contract || ArchitectureResolver.loadContract(projectRoot);
    if (!activeContract) {
      return {
        valid: true,
        totalArtifacts: 0,
        provenancedCount: 0,
        unprovenancedArtifacts: [],
        purgedCount: 0,
        foreignArtifactsRemaining: 0,
      };
    }
    const authorizedTokens = ArtifactProvenanceValidator.deriveAuthorizedTokens(activeContract);
    const records: ArtifactProvenanceRecord[] = [];

    const srcDir = join(projectRoot, "src");
    const serverDir = join(projectRoot, "server");

    // 1. Audit src/features/*
    const featuresDir = join(srcDir, "features");
    if (existsSync(featuresDir)) {
      try {
        for (const entry of readdirSync(featuresDir)) {
          const full = join(featuresDir, entry);
          if (statSync(full).isDirectory()) {
            const isUniversal = entry.toLowerCase() === "auth" || entry.toLowerCase() === "dashboard";
            const hasProv = isUniversal || ArtifactProvenanceValidator.hasDomainProvenance(entry, activeContract);
            records.push({
              path: `src/features/${entry}`,
              type: "feature_directory",
              identifier: entry,
              hasProvenance: hasProv,
              matchedContractNode: hasProv ? entry : undefined,
            });
          }
        }
      } catch {}
    }

    // 2. Audit src/entities/*
    const entitiesDir = join(srcDir, "entities");
    if (existsSync(entitiesDir)) {
      try {
        for (const entry of readdirSync(entitiesDir)) {
          if (/\.(ts|tsx)$/.test(entry)) {
            const id = entry.replace(/\.(ts|tsx)$/, "");
            const hasProv = ArtifactProvenanceValidator.hasProvenance(id, authorizedTokens);
            records.push({
              path: `src/entities/${entry}`,
              type: "entity",
              identifier: id,
              hasProvenance: hasProv,
              matchedContractNode: hasProv ? id : undefined,
            });
          }
        }
      } catch {}
    }

    // 3. Audit src/pages/*
    const pagesDir = join(srcDir, "pages");
    if (existsSync(pagesDir)) {
      try {
        for (const entry of readdirSync(pagesDir)) {
          if (/\.(ts|tsx)$/.test(entry)) {
            const id = entry.replace(/\.(ts|tsx)$/, "").replace(/(Page|View|Screen|Board|Dashboard)$/, "");
            const hasProv = id === "" || ArtifactProvenanceValidator.hasProvenance(id, authorizedTokens);
            records.push({
              path: `src/pages/${entry}`,
              type: "page",
              identifier: id,
              hasProvenance: hasProv,
              matchedContractNode: hasProv ? id : undefined,
            });
          }
        }
      } catch {}
    }

    // 4. Audit server/routes/*
    const routesDir = join(serverDir, "routes");
    if (existsSync(routesDir)) {
      try {
        for (const entry of readdirSync(routesDir)) {
          if (/\.(ts|js)$/.test(entry)) {
            const id = entry.replace(/\.(routes|route)\.(ts|js)$/, "").replace(/\.(ts|js)$/, "");
            const hasProv = id === "index" || ArtifactProvenanceValidator.hasProvenance(id, authorizedTokens);
            records.push({
              path: `server/routes/${entry}`,
              type: "server_route",
              identifier: id,
              hasProvenance: hasProv,
              matchedContractNode: hasProv ? id : undefined,
            });
          }
        }
      } catch {}
    }

    // 5. Audit server/controllers/*
    const controllersDir = join(serverDir, "controllers");
    if (existsSync(controllersDir)) {
      try {
        for (const entry of readdirSync(controllersDir)) {
          if (/\.(ts|js)$/.test(entry)) {
            const id = entry.replace(/\.(controller|controllers)\.(ts|js)$/, "").replace(/\.(ts|js)$/, "");
            const hasProv = ArtifactProvenanceValidator.hasProvenance(id, authorizedTokens);
            records.push({
              path: `server/controllers/${entry}`,
              type: "server_controller",
              identifier: id,
              hasProvenance: hasProv,
              matchedContractNode: hasProv ? id : undefined,
            });
          }
        }
      } catch {}
    }

    // 6. Audit unauthorized stray typo directories (e.g. src/eentities, src/featuress)
    if (existsSync(srcDir)) {
      try {
        for (const entry of readdirSync(srcDir)) {
          const full = join(srcDir, entry);
          if (statSync(full).isDirectory()) {
            const authorizedLayers = [
              "pages", "components", "features", "services", "utils", "types",
              "hooks", "lib", "context", "shared", "design-system", "assets", "styles", "entities",
              "__tests__", "tests"
            ];
            if (!authorizedLayers.includes(entry.toLowerCase())) {
              records.push({
                path: `src/${entry}`,
                type: "orphan_file",
                identifier: entry,
                hasProvenance: false,
              });
            }
          }
        }
      } catch {}
    }

    const unprovenanced = records.filter(r => !r.hasProvenance);
    return {
      valid: unprovenanced.length === 0,
      totalArtifacts: records.length,
      provenancedCount: records.length - unprovenanced.length,
      unprovenancedArtifacts: unprovenanced,
      purgedCount: 0,
      foreignArtifactsRemaining: unprovenanced.length,
    };
  }

  public static hasDomainProvenance(identifier: string, contract?: ArchitectureContractV1 | any): boolean {
    if (!contract) return true;
    const domainTokens = ArtifactProvenanceValidator.deriveDomainSpecificTokens(contract);
    return ArtifactProvenanceValidator.hasProvenance(identifier, domainTokens);
  }

  public static deriveDomainSpecificTokens(contract: ArchitectureContractV1 | any): Set<string> {
    const tokens = new Set<string>();
    const addStemmedToken = (rawWord: string) => {
      const word = rawWord.toLowerCase();
      if (word.length <= 2) return;
      tokens.add(word);
      tokens.add(word + "s");
      if (word.endsWith("y")) tokens.add(word.slice(0, -1) + "ies");
      if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) tokens.add(word.slice(0, -1));
    };

    if (contract.domainCategory) {
      for (const p of String(contract.domainCategory).toLowerCase().split(/[-_\s]+/)) addStemmedToken(p);
    }
    for (const m of (contract.requiredModels || [])) {
      addStemmedToken(m);
      for (const p of m.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/\s+/)) addStemmedToken(p);
    }
    for (const f of (contract.requiredFeatures || [])) {
      for (const p of f.toLowerCase().split(/[-_\s]+/)) addStemmedToken(p);
    }
    for (const r of (contract.requiredRoutes || [])) {
      const slug = (typeof r === "string" ? r : r?.path || "").replace(/^\//, "").toLowerCase();
      for (const p of slug.split(/[-_\s/]+/)) {
        if (p && p !== "dashboard" && p !== "login" && p !== "register" && p !== "auth") addStemmedToken(p);
      }
    }
    return tokens;
  }

  /**
   * Purges all unprovenanced foreign artifacts and cleans broken references in project entrypoints.
   * HARD FAIL-CLOSED: Re-scans after purge and asserts foreignArtifactsRemaining === 0.
   */
  public static purgeUnjustifiedArtifacts(projectRoot: string, contract?: ArchitectureContractV1 | any): ProvenanceAuditReport {
    const audit = ArtifactProvenanceValidator.auditArtifacts(projectRoot, contract);
    const auditTrail: ProvenancePurgeAuditEntry[] = [];

    let purgedCount = 0;
    const purgedIdentifiers = new Set<string>();

    for (const artifact of audit.unprovenancedArtifacts) {
      const fullPath = join(projectRoot, artifact.path);
      if (existsSync(fullPath)) {
        try {
          if (statSync(fullPath).isDirectory()) {
            rmSync(fullPath, { recursive: true, force: true });
          } else {
            unlinkSync(fullPath);
          }
          purgedCount++;
          purgedIdentifiers.add(artifact.identifier.toLowerCase());
          auditTrail.push({
            path: artifact.path,
            classification: "FOREIGN_ARTIFACT",
            reason: `No provenance in active contract (identifier: "${artifact.identifier}")`,
            action: "PURGED",
          });
          console.log(`[ProvenanceValidator] 🛡️ Purged unprovenanced foreign artifact: ${artifact.path} (zero contract provenance)`);
        } catch (err: any) {
          console.warn(`[ProvenanceValidator] Warning: Could not purge ${artifact.path}: ${err.message}`);
        }
      }
    }

    // Clean broken references to purged artifacts in entrypoints
    ArtifactProvenanceValidator.cleanReferencesInEntrypoints(projectRoot, Array.from(purgedIdentifiers));

    // Hard fail-closed invariant: Re-scan to ensure 0 foreign artifacts remain
    const recheckAudit = ArtifactProvenanceValidator.auditArtifacts(projectRoot, contract);
    const remainingForeign = recheckAudit.unprovenancedArtifacts.length;

    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      try { mkdirSync(aegisDir, { recursive: true }); } catch {}
    }
    try {
      writeFileSync(join(aegisDir, "provenance-audit.json"), JSON.stringify({
        auditTrail,
        purgedEntries: auditTrail,
        purgedCount,
        foreignArtifactsRemaining: remainingForeign,
        timestamp: new Date().toISOString(),
      }, null, 2), "utf8");
    } catch {}

    if (remainingForeign > 0) {
      const remainingPaths = recheckAudit.unprovenancedArtifacts.map(a => a.path).join(", ");
      throw new Error(`GENERATION_REJECTED_FOREIGN_ARTIFACTS: Foreign artifacts remaining after purge: [${remainingPaths}]. All artifacts must have provenance in the active contract.`);
    }

    return {
      ...recheckAudit,
      valid: true,
      purgedCount,
      auditTrail,
      foreignArtifactsRemaining: 0,
    };
  }

  /**
   * Cleans stray import and route bindings for purged artifacts in server/index.ts, src/routes.tsx, etc.
   */
  private static cleanReferencesInEntrypoints(projectRoot: string, purgedIdentifiers: string[]): void {
    if (purgedIdentifiers.length === 0) return;

    // 1. Sanitize server/index.ts
    const serverIndexPath = join(projectRoot, "server", "index.ts");
    if (existsSync(serverIndexPath)) {
      try {
        let content = readFileSync(serverIndexPath, "utf8");
        let modified = false;
        for (const id of purgedIdentifiers) {
          const importRegex = new RegExp(`^.*import\\s+[^;]*${id}[^;]*;?\\n?`, "gim");
          const routeRegex = new RegExp(`^.*app\\.use\\([^;]*${id}[^;]*\\);?\\n?`, "gim");
          if (importRegex.test(content) || routeRegex.test(content)) {
            content = content.replace(importRegex, "").replace(routeRegex, "");
            modified = true;
          }
        }
        if (modified) {
          writeFileSync(serverIndexPath, content, "utf8");
          console.log(`[ProvenanceValidator] 🧹 Cleaned references to purged foreign artifacts in server/index.ts`);
        }
      } catch {}
    }

    // 2. Sanitize src/routes.tsx
    const routesPath = join(projectRoot, "src", "routes.tsx");
    if (existsSync(routesPath)) {
      try {
        let content = readFileSync(routesPath, "utf8");
        let modified = false;
        for (const id of purgedIdentifiers) {
          const importRegex = new RegExp(`^.*import\\s+[^;]*${id}[^;]*;?\\n?`, "gim");
          const routeRegex = new RegExp(`^.*<Route[^>]*${id}[^>]*/>\\n?`, "gim");
          if (importRegex.test(content) || routeRegex.test(content)) {
            content = content.replace(importRegex, "").replace(routeRegex, "");
            modified = true;
          }
        }
        if (modified) {
          writeFileSync(routesPath, content, "utf8");
          console.log(`[ProvenanceValidator] 🧹 Cleaned references to purged foreign artifacts in src/routes.tsx`);
        }
      } catch {}
    }
  }
}
