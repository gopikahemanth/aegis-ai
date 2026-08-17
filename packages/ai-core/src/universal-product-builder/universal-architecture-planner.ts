/**
 * UniversalArchitecturePlanner
 *
 * Synthesizes domain-agnostic full-stack architecture plans, respecting user-specified technology stack constraints.
 */

import { type UniversalProductSpecification } from "./universal-requirement-interpreter.js";

export interface UserStackPreference {
  frontendFramework?: "React-Vite" | "Next.js" | "Remix";
  backendFramework?: "Express" | "Fastify" | "NestJS";
  database?: "PostgreSQL" | "MySQL" | "SQLite";
  orm?: "Prisma" | "Drizzle";
}

export interface UniversalArchitectureBlueprint {
  blueprintId: string;
  productName: string;
  domain: string;
  stack: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    auth: string;
    testRunner: string;
  };
  controllers: string[];
  components: string[];
  dbModels: string[];
  plannedAt: string;
}

export class UniversalArchitecturePlanner {
  public static planArchitecture(
    spec: UniversalProductSpecification,
    userPreferences?: UserStackPreference
  ): UniversalArchitectureBlueprint {
    const frontend = userPreferences?.frontendFramework || "React-Vite";
    const backend = userPreferences?.backendFramework || "Express";
    const database = userPreferences?.database || "PostgreSQL";
    const orm = userPreferences?.orm || "Prisma";

    const controllers = spec.entities.map(
      (ent) => `${ent.name.toLowerCase()}.controller.ts`
    );

    const components = [
      "DashboardOverview.tsx",
      "SidebarNavigation.tsx",
      ...spec.entities.map((ent) => `${ent.name}Directory.tsx`),
      ...spec.entities.map((ent) => `Add${ent.name}Modal.tsx`),
    ];

    const dbModels = spec.entities.map((ent) => ent.name);

    return {
      blueprintId: `bp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productName: spec.productName,
      domain: spec.domain,
      stack: {
        frontend,
        backend,
        database,
        orm,
        auth: "JWT Bearer Authentication",
        testRunner: "Vitest",
      },
      controllers,
      components,
      dbModels,
      plannedAt: new Date().toISOString(),
    };
  }
}
