import { createHash } from "node:crypto";
import { ArchitectureResolver } from "../governance/architecture-resolver.js";
import { DomainContractDeriver, DomainEntity, DomainFeature } from "../governance/domain-contract.js";

export interface ProjectContractData {
  contractVersion: number;
  projectId: string;
  generationId: string;
  originalUserRequest: string;
  productName: string;
  productDescription: string;
  frontend: {
    framework: string;
    provenance: string;
  };
  backend: {
    framework: string;
    provenance: string;
  };
  database: {
    provider: string;
    orm: string;
  };
  authentication: string;
  language: string;
  packageManager: "pnpm" | "npm" | "yarn";
  styling: string;
  allowedTechnologies: string[];
  forbiddenTechnologies: string[];
  features: string[];
  routes: string[];
  requiredModels: string[];
  allowedDomainTerms: string[];
  forbiddenDomainTerms: string[];
  architectureHash: string;
  contractHash: string;
}

export class ProjectContractManager {
  public static createContract(
    userRequest: string,
    frontend: string = "React-Vite",
    backend: string = "Express",
    database: string = "PostgreSQL",
    orm: string = "Prisma",
    auth: string = "JWT",
    language: string = "TypeScript",
    packageManager: "pnpm" | "npm" | "yarn" = "pnpm",
    requiredModels: string[] = []
  ): ProjectContractData {
    // Resolve architecture contract to feed domain contract deriver
    const archContract = ArchitectureResolver.resolve(userRequest);
    const archHash = archContract.architectureHash || createHash("sha256").update(JSON.stringify({ frontend, backend, database })).digest("hex").slice(0, 12);
    const domainContract = DomainContractDeriver.derive(archContract, archHash);

    const productName = domainContract.domainName || "Autonomous Application";
    const productDescription = domainContract.domainDescription || `Autonomous application implementing verified workflows.`;

    const allowedDomainTerms = domainContract.allowedTerminology || [];
    const forbiddenDomainTerms = domainContract.suspiciousTerminology || [];

    const entityNames = domainContract.entities.map((e: DomainEntity) => e.name);
    const models = requiredModels.length > 0
      ? requiredModels
      : (entityNames.length > 0 ? entityNames : ["User", "Item", "Record"]);

    const featureNames = domainContract.features.map((f: DomainFeature) => f.name);
    const features = featureNames.length > 0
      ? featureNames
      : ["Core Dashboard", "Data Explorer", "Workflow Processing", "Export Report"];

    const archObj = { frontend, backend, database, orm, auth, language };
    const architectureHash = createHash("sha256").update(JSON.stringify(archObj)).digest("hex").slice(0, 12);
    const contractHash = createHash("sha256").update(JSON.stringify({ userRequest, archObj, models })).digest("hex").slice(0, 12);

    const isNext = frontend.toLowerCase().includes("next");
    const forbiddenTech = isNext
      ? ["NestJS", "Fastify", "MongoDB", "Mongoose"]
      : ["Next.js", "NextAuth", "NestJS", "MongoDB", "Mongoose", "Drizzle", "Drizzle ORM"];

    return {
      contractVersion: 1,
      projectId: "project",
      generationId: `gen_${Date.now()}`,
      originalUserRequest: userRequest,
      productName,
      productDescription,
      frontend: { framework: frontend, provenance: "authoritative" },
      backend: { framework: backend, provenance: "authoritative" },
      database: { provider: database, orm },
      authentication: auth,
      language,
      packageManager,
      styling: "Vanilla CSS",
      allowedTechnologies: [frontend, backend, database, orm, auth, language, "React", "Express", "Prisma", "TypeScript"],
      forbiddenTechnologies: forbiddenTech,
      features,
      routes: ["/", "/login", "/register", "/dashboard"],
      requiredModels: models,
      allowedDomainTerms,
      forbiddenDomainTerms,
      architectureHash,
      contractHash,
    };
  }
}
