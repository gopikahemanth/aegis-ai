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
        "src/routes",
        "src/controllers",
        "src/models",
        "src/middleware"
      );
    }

    if (spec.database) {
      databaseSchema.push({
        name: "users",
        columns: [
          { name: "id", type: "SERIAL", constraints: "PRIMARY KEY" },
          { name: "email", type: "VARCHAR(255)", constraints: "UNIQUE NOT NULL" },
          { name: "password_hash", type: "VARCHAR(255)", constraints: "NOT NULL" },
          { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT CURRENT_TIMESTAMP" }
        ]
      });

      if (spec.type === "website" || spec.type === "fullstack") {
        databaseSchema.push({
          name: "tasks",
          columns: [
            { name: "id", type: "SERIAL", constraints: "PRIMARY KEY" },
            { name: "user_id", type: "INTEGER", constraints: "REFERENCES users(id)" },
            { name: "title", type: "VARCHAR(255)", constraints: "NOT NULL" },
            { name: "completed", type: "BOOLEAN", constraints: "DEFAULT FALSE" }
          ],
          relations: [
            { from: "user_id", to: "users.id", type: "many-to-one" }
          ]
        });
      }
    }

    if (spec.backend) {
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
