import { createHash } from "node:crypto";

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
    const pLower = userRequest.toLowerCase();
    const isSecurity = pLower.includes("code") || pLower.includes("vulnerability") || pLower.includes("reviewer") || pLower.includes("security") || pLower.includes("scanner");

    const productName = isSecurity
      ? "AI Code Reviewer & Security Vulnerability Scanner"
      : "AI Resume Keyword Scanner";

    const productDescription = isSecurity
      ? "Static analysis and vulnerability scanner web application with risk score calculation and code breakdown."
      : "Resume ATS keyword analysis and compatibility scoring platform.";

    const allowedDomainTerms = isSecurity
      ? ["Code", "Repository", "Source", "File", "Scan", "Scanner", "Vulnerability", "Security", "Risk", "Remediation", "Patch", "Snippet", "Analysis"]
      : ["Resume", "JobDescription", "KeywordMatch", "MatchScore", "MissingSkills"];

    const forbiddenDomainTerms = isSecurity
      ? ["Resume", "JobDescription", "KeywordMatch", "KeywordCloud", "MatchDashboard", "MatchScore", "ResumeUpload", "useResumeUpload", "MissingSkills", "Candidate"]
      : ["Repository", "Vulnerability", "Remediation", "CVE", "CodeSnippet", "StaticAnalysis"];

    const models = requiredModels.length > 0
      ? requiredModels
      : (isSecurity ? ["User", "Repository", "Scan", "Vulnerability", "Remediation", "AnalysisResult"] : ["User", "Resume", "JobDescription", "AnalysisResult", "KeywordMatch"]);

    const archObj = { frontend, backend, database, orm, auth, language };
    const architectureHash = createHash("sha256").update(JSON.stringify(archObj)).digest("hex").slice(0, 12);
    const contractHash = createHash("sha256").update(JSON.stringify({ userRequest, archObj, models })).digest("hex").slice(0, 12);

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
      forbiddenTechnologies: ["Next.js", "NextAuth", "NestJS", "MongoDB", "Mongoose", "Drizzle", "Drizzle ORM"],
      features: isSecurity
        ? ["Repository Connection", "Static Security Scanner", "Risk Score Calculation", "Interactive Code Explorer", "Remediation Guide"]
        : ["PDF Resume Upload", "Job Description Parser", "ATS Keyword Matcher", "Skill Gap Analysis", "Export PDF Report"],
      routes: ["/", "/login", "/register", "/dashboard"],
      requiredModels: models,
      allowedDomainTerms,
      forbiddenDomainTerms,
      architectureHash,
      contractHash
    };
  }
}
