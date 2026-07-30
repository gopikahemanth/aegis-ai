import type { ProjectSpecification } from "../architect/specification.js";

export interface AgentSpecialist {
  role: string;
  description: string;
  enlisted: boolean;
}

export class TeamCoordinator {
  coordinate(specification: ProjectSpecification): AgentSpecialist[] {
    const team: AgentSpecialist[] = [
      {
        role: "CEO Agent",
        description: "Supervises overall progress, milestones alignment, and final review acceptance",
        enlisted: true
      },
      {
        role: "Project Manager",
        description: "Maintains the planning DAG execution tiers, scheduler mappings, and self-healing retries",
        enlisted: true
      },
      {
        role: "Architect",
        description: "Decides naming conventions, directory maps, framework templates, and style frameworks",
        enlisted: true
      },
      {
        role: "Reviewer",
        description: "Validates code quality, lint criteria, styling layouts, and patch accuracy",
        enlisted: true
      },
      {
        role: "DevOps Lead",
        description: "Builds Docker settings, Docker Compose service boundaries, and CI/CD actions",
        enlisted: true
      }
    ];

    // Dynamic enlisting based on parsed specifications
    if (specification.frontend || specification.type === "website" || specification.type === "frontend" || specification.type === "fullstack") {
      team.push({
        role: "Frontend Lead",
        description: "Implements components, hooks, styles, navigation, assets, and React context states",
        enlisted: true
      });
    }

    if (specification.backend || specification.type === "backend" || specification.type === "fullstack") {
      team.push({
        role: "Backend Lead",
        description: "Implements route endpoints, JSON payloads schema checkers, servers, and controllers",
        enlisted: true
      });
    }

    if (specification.database) {
      team.push({
        role: "Database Lead",
        description: `Orchestrates schema designs, configuration connections, and persistence managers for ${specification.database}`,
        enlisted: true
      });
    }

    // Security auditor enlisting
    const lowerName = (specification.name || "").toLowerCase();
    if (
      lowerName.includes("auth") ||
      lowerName.includes("login") ||
      lowerName.includes("security") ||
      lowerName.includes("credentials") ||
      lowerName.includes("finance") ||
      lowerName.includes("money")
    ) {
      team.push({
        role: "Security Lead",
        description: "Audits for dependency vulnerabilities, checks parameter bounds, and configures authorization tokens",
        enlisted: true
      });
    }

    return team;
  }
}
