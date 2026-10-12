import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";

export interface RequirementContract {
  id: string;
  createdAt: string;
  prompt: string;
  immutableRequirements: {
    frontend: string;
    backend: string;
    database: string;
    language: string;
    styling: string;
    auth: string;
    packageManager: string;
    features: string[];
    userFlows: string[];
    dataModels: string[];
  };
}

export interface PrimaryRouteCapabilityContract {
  route: string;
  capabilityId: string;
  capabilityName: string;
  trigger: {
    labelPattern?: string;
    selector?: string;
    actionType: "click" | "input" | "select";
  };
  expectedStateChange: string;
  observableResult: {
    domTextPattern?: string;
    badgeStatusPattern?: string;
    selectedPattern?: string;
    stateChangeType?: "CONTENT_STATE_MUTATION" | "TAB_OR_SELECTION_TRANSITION" | "BADGE_STATUS_TRANSITION";
  };
  requiresPersistence: boolean;
  persistenceVerification?: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    expectedStatus: number;
    expectedDbMutation?: boolean;
  };
}

export interface ArchitectureContractData {
  contractId: string;
  lockedAt: string;
  stack: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    auth: string;
    language: string;
    styling: string;
    packageManager: string;
  };
  features: string[];
  userFlows: string[];
  dataModels: string[];
  allowedRoutePrefixes: string[];
  routeCapabilities?: PrimaryRouteCapabilityContract[];
}

export class ArchitectureContractManager {
  public static createContract(
    outputDirectory: string,
    prompt: string,
    spec: CanonicalProjectSpecification
  ): ArchitectureContractData {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    const requirementContract: RequirementContract = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      prompt,
      immutableRequirements: {
        frontend: spec.lockedStack?.frontend || spec.frontend || "React-Vite",
        backend: spec.lockedStack?.backend || spec.backend || "Express",
        database: spec.lockedStack?.database || spec.database || "PostgreSQL",
        language: spec.lockedStack?.language || spec.language || "TypeScript",
        styling: spec.lockedStack?.styling || spec.styling || "TailwindCSS",
        auth: spec.lockedStack?.auth || spec.auth || "JWT",
        packageManager: spec.lockedStack?.packageManager || spec.packageManager || "pnpm",
        features: spec.features || [],
        userFlows: spec.userFlows || [],
        dataModels: spec.dataModels || []
      }
    };

    const archContract: ArchitectureContractData = {
      contractId: requirementContract.id,
      lockedAt: new Date().toISOString(),
      stack: {
        frontend: requirementContract.immutableRequirements.frontend,
        backend: requirementContract.immutableRequirements.backend,
        database: requirementContract.immutableRequirements.database,
        orm: spec.lockedStack?.orm || "Prisma",
        auth: requirementContract.immutableRequirements.auth,
        language: requirementContract.immutableRequirements.language,
        styling: requirementContract.immutableRequirements.styling,
        packageManager: requirementContract.immutableRequirements.packageManager
      },
      features: requirementContract.immutableRequirements.features,
      userFlows: requirementContract.immutableRequirements.userFlows,
      dataModels: requirementContract.immutableRequirements.dataModels,
      allowedRoutePrefixes: ["/api", "/auth", "/dashboard", "/"]
    };

    const contractFile = join(aegisDir, "architecture-contract.json");
    if (existsSync(contractFile)) {
      try {
        const existing = JSON.parse(readFileSync(contractFile, "utf8"));
        console.log(`[ArchitectureContractManager] 🔒 Reusing existing locked contract (DB: ${existing.database?.provider || existing.stack?.database})`);
        return existing;
      } catch {}
    }

    console.log(`[CONTRACT WRITE] caller: ArchitectureContractManager, path: ${outputDirectory}, database: ${archContract.stack.database}, frontend: ${archContract.stack.frontend}, backend: ${archContract.stack.backend}`);
    writeFileSync(contractFile, JSON.stringify(archContract, null, 2), "utf8");
    writeFileSync(join(aegisDir, "requirement-contract.json"), JSON.stringify(requirementContract, null, 2), "utf8");

    console.log(`[Governance] 🔒 Architecture Contract locked in .aegis/architecture-contract.json (DB: ${archContract.stack.database}, Frontend: ${archContract.stack.frontend}, Backend: ${archContract.stack.backend})`);

    return archContract;
  }

  public static loadContract(outputDirectory: string): ArchitectureContractData | null {
    const contractPath = join(outputDirectory, ".aegis", "architecture-contract.json");
    if (!existsSync(contractPath)) return null;
    try {
      return JSON.parse(readFileSync(contractPath, "utf8"));
    } catch {
      return null;
    }
  }

  public static validateProposedChange(
    outputDirectory: string,
    changeType: "database" | "frontend" | "backend" | "auth",
    newValue: string
  ): { allowed: boolean; reason?: string } {
    const contract = this.loadContract(outputDirectory);
    if (!contract) return { allowed: true };

    const lockedVal = contract.stack[changeType];
    if (lockedVal && newValue && lockedVal.toLowerCase() !== newValue.toLowerCase()) {
      // Check if substitution is immutable violation (e.g. PostgreSQL -> SQLite)
      if (changeType === "database" && lockedVal.toLowerCase().includes("postgres") && newValue.toLowerCase().includes("sqlite")) {
        return {
          allowed: false,
          reason: `REJECTED Architecture Violation: User explicitly requested database '${lockedVal}'. Cannot silently substitute '${newValue}'.`
        };
      }
    }
    return { allowed: true };
  }

  public static ensureRouteCapabilities(
    outputDirectory: string,
    routes?: string[],
    prompt?: string
  ): PrimaryRouteCapabilityContract[] {
    const aegisDir = join(outputDirectory, ".aegis");
    const contractPath = join(aegisDir, "architecture-contract.json");
    let contract = this.loadContract(outputDirectory);
    if (!contract) return [];

    const existingMap = new Map<string, PrimaryRouteCapabilityContract>();
    if (Array.isArray(contract.routeCapabilities)) {
      for (const cap of contract.routeCapabilities) {
        if (cap.route) existingMap.set(cap.route, cap);
      }
    }

    const routeList = new Set<string>();
    if (routes) {
      for (const r of routes) {
        if (r && !r.includes(":") && !r.includes("*")) {
          routeList.add(r.startsWith("/") ? r : `/${r}`);
        }
      }
    }
    for (const r of existingMap.keys()) {
      routeList.add(r);
    }
    routeList.add("/");

    for (const r of routeList) {
      if (!existingMap.has(r)) {
        const cleanName = r === "/" ? "Primary Operational Console" : r.replace(/^\//, "").replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        const capId = r === "/" ? "primary_console" : r.replace(/^\//, "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
        const isPersistent = Boolean(r.match(/\b(maintenance|schedule|booking|reserve|order|request|service)\b/i));

        existingMap.set(r, {
          route: r,
          capabilityId: capId,
          capabilityName: cleanName,
          trigger: {
            actionType: "click",
          },
          expectedStateChange: `Update operational state and view for ${cleanName}`,
          observableResult: {
            stateChangeType: "CONTENT_STATE_MUTATION",
          },
          requiresPersistence: isPersistent,
        });
      }
    }

    contract.routeCapabilities = Array.from(existingMap.values());
    try {
      if (existsSync(aegisDir)) {
        writeFileSync(contractPath, JSON.stringify(contract, null, 2), "utf8");
      }
    } catch {}

    return contract.routeCapabilities;
  }

  public static syncRouteCapabilitiesFromBrief(
    outputDirectory: string,
    brief: any,
    prompt?: string
  ): PrimaryRouteCapabilityContract[] {
    const routes: string[] = [];
    if (brief?.pageCompositions) {
      for (const comp of brief.pageCompositions) {
        if (comp.route) routes.push(comp.route);
      }
    }
    return this.ensureRouteCapabilities(outputDirectory, routes, prompt);
  }
}
