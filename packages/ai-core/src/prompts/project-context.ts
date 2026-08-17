import { computeContractHash, computeArchitectureHash } from "./hash.js";
import type { ProjectContext, ProjectArchitecture, ProjectDomainVocabulary, ApiContract } from "./types.js";

export class ProjectContextFactory {
  public static create(params: {
    projectId?: string;
    generationId?: string;
    originalRequest: string;
    requirements?: string[];
    features?: string[];
    workflows?: string[];
    architecture?: Partial<ProjectArchitecture>;
    dataModels?: string[];
    apiContracts?: ApiContract[];
    routes?: string[];
    domainVocabulary?: Partial<ProjectDomainVocabulary>;
    canonicalFiles?: string[];
    acceptanceCriteria?: string[];
  }): ProjectContext {
    const pId = params.projectId || `proj_${Date.now()}`;
    const gId = params.generationId || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const reqLower = params.originalRequest.toLowerCase();
    const isResume = reqLower.includes("resume") || reqLower.includes("ats") || reqLower.includes("keyword");
    const isConference = reqLower.includes("conference") || reqLower.includes("event") || reqLower.includes("ticket") || reqLower.includes("speaker") || reqLower.includes("seat") || reqLower.includes("badge");
    const isCodeReview = reqLower.includes("code review") || reqLower.includes("vulnerability") || reqLower.includes("security scanner") || reqLower.includes("static analysis");

    // Inferred Architecture Defaults
    const arch: ProjectArchitecture = {
      frontend: params.architecture?.frontend || (reqLower.includes("next") ? "Next.js" : "React-Vite"),
      backend: params.architecture?.backend || (reqLower.includes("next") ? "Next.js API Routes" : "Express"),
      database: params.architecture?.database || "PostgreSQL",
      orm: params.architecture?.orm || "Prisma",
      auth: params.architecture?.auth || "JWT",
      language: params.architecture?.language || "TypeScript",
      styling: params.architecture?.styling || "TailwindCSS",
    };

    // Allowed / Forbidden technologies based on selected architecture
    const allowedTechnologies = [arch.frontend, arch.backend, arch.database, arch.orm, arch.auth, arch.language, arch.styling];
    const forbiddenTechnologies: string[] = [];
    if (arch.frontend.includes("React") || arch.frontend.includes("Vite")) {
      forbiddenTechnologies.push("Next.js", "Nuxt", "SvelteKit", "Vue");
    }
    if (arch.backend.includes("Express")) {
      forbiddenTechnologies.push("NestJS", "Koa", "Fastify", "Django");
    }
    if (arch.database.includes("PostgreSQL")) {
      forbiddenTechnologies.push("MongoDB", "Mongoose", "Cassandra", "DynamoDB");
    }

    // Inferred Domain Vocabulary
    let domainVocab: ProjectDomainVocabulary;
    if (isResume) {
      domainVocab = {
        entityName: "ResumeScan",
        entityPlural: "ResumeScans",
        primaryMetrics: ["Match Compatibility Score", "Matched Skill Keywords", "Missing Critical Skills", "ATS Compliance Level"],
        actionVerbs: ["Upload Resume", "Scan Job Description", "Analyze Skill Gap", "Export ATS Report"],
        domainPrefix: "resume",
      };
    } else if (isConference) {
      domainVocab = {
        entityName: "ConferenceTicket",
        entityPlural: "ConferenceTickets",
        primaryMetrics: ["Available Ticket Capacity", "Confirmed Keynotes", "Reserved Venue Seats", "Attendee Registrations"],
        actionVerbs: ["Select Pass Tier", "Book Venue Seat", "Generate Badge Pass", "View Speaker Agenda"],
        domainPrefix: "conference",
      };
    } else if (isCodeReview) {
      domainVocab = {
        entityName: "VulnerabilityScan",
        entityPlural: "VulnerabilityScans",
        primaryMetrics: ["Security Risk Score", "Critical Vulnerabilities", "Code Quality Index", "Passed Security Checks"],
        actionVerbs: ["Scan Code Snippet", "Analyze AST Findings", "Generate Remediation", "Export Security Audit"],
        domainPrefix: "security",
      };
    } else {
      domainVocab = {
        entityName: params.domainVocabulary?.entityName || "Item",
        entityPlural: params.domainVocabulary?.entityPlural || "Items",
        primaryMetrics: params.domainVocabulary?.primaryMetrics || ["Total Overview Volume", "Active Processing Status", "Completed Verification Metrics"],
        actionVerbs: params.domainVocabulary?.actionVerbs || ["Add Item", "Process Analysis", "View Details", "Export Data"],
        domainPrefix: params.domainVocabulary?.domainPrefix || "item",
      };
    }

    const archHash = computeArchitectureHash(arch);
    const contractPayload = {
      pId,
      gId,
      originalRequest: params.originalRequest,
      arch,
      domainVocab,
    };
    const contractHash = computeContractHash(contractPayload);

    return {
      projectId: pId,
      generationId: gId,
      originalRequest: params.originalRequest,
      requirements: params.requirements || [params.originalRequest],
      features: params.features || ["dashboard", "auth", "settings"],
      workflows: params.workflows || ["overview-dashboard", "create-item", "view-details"],
      architecture: arch,
      dataModels: params.dataModels || [domainVocab.entityName, "User"],
      apiContracts: params.apiContracts || [
        { method: "GET", path: `/api/${domainVocab.domainPrefix}`, description: `Fetch list of ${domainVocab.entityPlural}` },
        { method: "POST", path: `/api/${domainVocab.domainPrefix}`, description: `Create new ${domainVocab.entityName}` },
      ],
      routes: params.routes || ["/", `/${domainVocab.domainPrefix}`, "/auth"],
      allowedTechnologies,
      forbiddenTechnologies,
      domainVocabulary: domainVocab,
      canonicalFiles: params.canonicalFiles || [
        "src/App.tsx",
        "src/routes.tsx",
        `src/features/${domainVocab.domainPrefix}/DashboardPage.tsx`,
        "server/index.ts",
        "prisma/schema.prisma",
      ],
      acceptanceCriteria: params.acceptanceCriteria || [
        "Application builds cleanly with TypeScript 0 errors",
        "Dev server starts on port 5173 without warnings",
        "All user workflows render interactively with non-hardcoded data",
      ],
      contractVersion: "1.0.0",
      contractHash,
      architectureHash: archHash,
    };
  }
}
