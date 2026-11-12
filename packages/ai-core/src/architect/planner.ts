import type { ProjectSpecification, ArchitecturePlan, DbTable, ApiRoute } from "./specification.js";

export interface SystemArchitecture extends ProjectSpecification {
  plan: ArchitecturePlan;
}

export class ArchitecturePlanner {
  plan(spec: ProjectSpecification): SystemArchitecture {
    const directoryTree: string[] = [];
    const routing: string[] = [];
    const databaseSchema: DbTable[] = [];
    const apiContracts: ApiRoute[] = [];

    if (
      spec.frontend === "React" ||
      spec.frontend === "Next.js" ||
      spec.type === "website" ||
      spec.type === "frontend" ||
      spec.type === "fullstack"
    ) {
      directoryTree.push(
        "src",
        "src/components",
        "src/hooks",
        "src/styles",
        "public"
      );
      routing.push("/", "/about");
    }

    if (
      spec.backend === "Express" ||
      spec.type === "backend" ||
      spec.type === "fullstack"
    ) {
      directoryTree.push(
        "server",
        "server/routes",
        "server/controllers",
        "server/services",
        "server/middleware",
        "server/lib",
        "prisma"
      );
    }

    if (spec.database) {
      const needsAuth =
        (spec.dataModels || []).some(m => /^user/i.test(m)) ||
        (spec.features || []).some(f => /auth|login|account|user|signup|member|admin/i.test(f)) ||
        /auth|login|account|user|signup|member|admin/i.test(spec.name || "");

      if (needsAuth) {
        databaseSchema.push({
          name: "users",
          columns: [
            { name: "id", type: "SERIAL", constraints: "PRIMARY KEY" },
            { name: "email", type: "VARCHAR(255)", constraints: "UNIQUE NOT NULL" },
            { name: "password_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
            { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT CURRENT_TIMESTAMP" }
          ]
        });
      }

      if (spec.dataModels && spec.dataModels.length > 0) {
        for (const model of spec.dataModels) {
          const tableName = model.toLowerCase().endsWith("s") ? model.toLowerCase() : `${model.toLowerCase()}s`;
          if (tableName === "users") continue;

          const columns: DbTable["columns"] = [
            { name: "id", type: "SERIAL", constraints: "PRIMARY KEY" },
          ];

          if (needsAuth) {
            columns.push({ name: "user_id", type: "INTEGER", constraints: "REFERENCES users(id)" });
          }

          columns.push(
            { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL" },
            { name: "data", type: "JSONB", constraints: "DEFAULT '{}'" },
            { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT CURRENT_TIMESTAMP" }
          );

          databaseSchema.push({
            name: tableName,
            columns,
            relations: needsAuth ? [{ from: "user_id", to: "users.id", type: "many-to-one" }] : undefined
          });
        }
      }
    }

    if (spec.backend) {
      const needsAuth =
        (spec.dataModels || []).some(m => /^user/i.test(m)) ||
        (spec.features || []).some(f => /auth|login|account|user|signup|member|admin/i.test(f)) ||
        /auth|login|account|user|signup|member|admin/i.test(spec.name || "");

      if (needsAuth) {
        apiContracts.push(
          {
            path: "/api/auth/register",
            method: "POST",
            requestBody: "{ email, password }",
            responseBody: "{ success, user: { id, email } }",
            description: "Register a new user"
          },
          {
            path: "/api/auth/login",
            method: "POST",
            requestBody: "{ email, password }",
            responseBody: "{ success, token }",
            description: "Login user and return token"
          }
        );
      }

      if (spec.dataModels && spec.dataModels.length > 0) {
        for (const model of spec.dataModels) {
          const resource = model.toLowerCase();
          apiContracts.push({
            path: `/api/${resource}s`,
            method: "GET",
            responseBody: `{ data: ${model}[] }`,
            description: `List ${model} records`
          });
        }
      }
    }

    return {
      ...spec,
      plan: {
        directoryTree,
        databaseSchema: databaseSchema.length > 0 ? databaseSchema : undefined,
        apiContracts: apiContracts.length > 0 ? apiContracts : undefined,
        routing
      }
    };
  }
}
