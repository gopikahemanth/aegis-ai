import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface CanonicalArchitecture {
  contractVersion: number;
  architectureHash: string;
  frontend: string;
  backend: string;
  database: string;
  orm: string;
  authentication: string;
  language: string;
  styling: string;
  packageManager: string;
  requiredLibraries: string[];
  requiredFeatures: string[];
  requiredRoutes: string[];
  requiredModels: string[];
  forbiddenTechnologies: string[];
}

export class CanonicalArchitectureState {
  private static instance: CanonicalArchitectureState;
  private state: CanonicalArchitecture | null = null;

  public static getInstance(): CanonicalArchitectureState {
    if (!CanonicalArchitectureState.instance) {
      CanonicalArchitectureState.instance = new CanonicalArchitectureState();
    }
    return CanonicalArchitectureState.instance;
  }

  public initialize(contract: ArchitectureContractV1, outputDirectory?: string): CanonicalArchitecture {
    const hash = createHash("sha256").update(JSON.stringify({
      frontend: contract.frontend.framework,
      backend: contract.backend.framework,
      database: contract.database.provider,
      orm: contract.database.orm,
      auth: contract.authentication,
      lang: contract.language
    })).digest("hex").slice(0, 12);

    const forbidden: string[] = [];
    if (!contract.frontend.framework.toLowerCase().includes("next")) {
      forbidden.push("Next.js", "App Router", "NextAuth", "Server Actions");
    }
    if (!contract.backend.framework.toLowerCase().includes("next")) {
      forbidden.push("Next.js API Routes");
    }
    if (!contract.database.provider.toLowerCase().includes("mongo")) {
      forbidden.push("MongoDB", "Mongoose");
    }
    if (!contract.database.orm.toLowerCase().includes("drizzle")) {
      forbidden.push("Drizzle", "Drizzle ORM");
    }

    this.state = Object.freeze({
      contractVersion: contract.version || 1,
      architectureHash: hash,
      frontend: contract.frontend.framework,
      backend: contract.backend.framework,
      database: contract.database.provider,
      orm: contract.database.orm,
      authentication: contract.authentication,
      language: contract.language,
      styling: contract.styling || "TailwindCSS",
      packageManager: contract.packageManager || "pnpm",
      requiredLibraries: contract.requiredLibraries || [],
      requiredFeatures: contract.requiredFeatures || [],
      requiredRoutes: contract.requiredRoutes || ["/", "/upload", "/login", "/dashboard"],
      requiredModels: contract.requiredModels || ["User", "Resume", "JobDescription", "AnalysisResult"],
      forbiddenTechnologies: forbidden,
    });

    console.log(`\n[CANONICAL ARCHITECTURE]`);
    console.log(`  Frontend:              ${this.state.frontend}`);
    console.log(`  Backend:               ${this.state.backend}`);
    console.log(`  Database:              ${this.state.database}`);
    console.log(`  ORM:                   ${this.state.orm}`);
    console.log(`  Auth:                  ${this.state.authentication}`);
    console.log(`  Language:              ${this.state.language}`);
    console.log(`  Models:                [${this.state.requiredModels.join(", ")}]`);
    console.log(`  Routes:                [${this.state.requiredRoutes.join(", ")}]`);
    console.log(`  Forbidden Technologies: [${this.state.forbiddenTechnologies.join(", ")}]`);
    console.log(`  Architecture Hash:     ${this.state.architectureHash}\n`);

    if (outputDirectory) {
      const aegisDir = join(outputDirectory, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
      writeFileSync(join(aegisDir, "canonical-architecture.json"), JSON.stringify(this.state, null, 2), "utf8");
    }

    return this.state;
  }

  public getState(): CanonicalArchitecture {
    if (!this.state) {
      throw new Error(`CANONICAL_ARCHITECTURE_UNINITIALIZED: Attempted to access CanonicalArchitectureState before initialization.`);
    }
    return this.state;
  }

  public validateTaskContract(taskArchHash?: string): boolean {
    if (!this.state) return true;
    if (!taskArchHash) return true;
    return taskArchHash === this.state.architectureHash;
  }
}
