import type { ProjectSpecification } from "../architect/specification.js";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface AgentSpecialist {
  role: string;
  description: string;
  enlisted: boolean;
}

export class TeamCoordinator {
  async coordinate(specification: ProjectSpecification): Promise<AgentSpecialist[]> {
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
      lowerName.includes("secure") ||
      lowerName.includes("security") ||
      lowerName.includes("credentials") ||
      lowerName.includes("finance") ||
      lowerName.includes("money") ||
      lowerName.includes("banking")
    ) {
      team.push({
        role: "Security Lead",
        description: "Audits for dependency vulnerabilities, checks parameter bounds, and configures authorization tokens",
        enlisted: true
      });
    }

    // Load any custom specialists registered dynamically via extensions (Pillar 5)
    const pluginsDir = join(process.cwd(), ".aegis", "plugins");
    if (existsSync(pluginsDir)) {
      try {
        const entries = readdirSync(pluginsDir);
        for (const entry of entries) {
          if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
            const fullPath = resolve(pluginsDir, entry);
            const moduleUrl = pathToFileURL(fullPath).toString();
            const pluginModule = await import(moduleUrl);
            const plugin = pluginModule.default || pluginModule;
            
            if (plugin && Array.isArray(plugin.specialistAgents)) {
              for (const agent of plugin.specialistAgents) {
                if (agent.role && agent.description) {
                  team.push({
                    role: agent.role,
                    description: agent.description,
                    enlisted: agent.enlisted !== undefined ? agent.enlisted : true
                  });
                  console.log(`[Coordinator] Enlisted marketplace agent specialist [${agent.role}] via extension: ${plugin.name || entry}`);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Coordinator] Warning: Failed to load specialist extensions: ${err.message}`);
      }
    }

    return team;
  }
}
