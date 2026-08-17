/**
 * GenerationOrchestrator
 *
 * Coordinates file tree synthesis, database schema creation, backend routing,
 * frontend component scaffolding, and dependency manifests according to the ArchitecturePlan.
 */

import { type ProductArchitecturePlan } from "./architecture-planner.js";

export interface GeneratedProjectPayload {
  projectId: string;
  projectName: string;
  filesGenerated: Record<string, string>;
  totalFiles: number;
  totalDirectories: number;
  packageDependencies: Record<string, string>;
  prismaSchemaModels: string[];
  apiEndpoints: string[];
  createdAt: string;
}

export class GenerationOrchestrator {
  public static generateFullStackProject(
    plan: ProductArchitecturePlan,
    targetDirectory: string
  ): GeneratedProjectPayload {
    const files: Record<string, string> = {};

    // 1. package.json
    files["package.json"] = JSON.stringify(
      {
        name: plan.projectName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          server: "tsx server/index.ts",
          test: "vitest run",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "react-router-dom": "^6.23.0",
          express: "^4.19.2",
          "@prisma/client": "^5.14.0",
          jsonwebtoken: "^9.0.2",
          "lucide-react": "^0.378.0",
        },
        devDependencies: {
          vite: "^5.2.11",
          typescript: "^5.4.5",
          vitest: "^1.6.0",
          prisma: "^5.14.0",
          tsx: "^4.10.5",
        },
      },
      null,
      2
    );

    // 2. tsconfig.json
    files["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["src", "server"],
      },
      null,
      2
    );

    // 3. Database Prisma Schema
    const prismaModelsString = plan.database.models
      .map(
        (m) => `model ${m} {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String?
  status    String   @default("ACTIVE")
}`
      )
      .join("\n\n");

    files["prisma/schema.prisma"] = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

${prismaModelsString}
`;

    // 4. Server entrypoint & routes
    files["server/index.ts"] = `import express from "express";
import { authMiddleware } from "./middleware/authMiddleware.js";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "HEALTHY", uptime: process.uptime() });
});

${plan.backend.controllers
  .map(
    (c) =>
      `app.use("/api/${c.replace(".controller.ts", "s")}", (req, res) => res.json({ message: "OK from ${c}" }));`
  )
  .join("\n")}

const PORT = process.env.PORT || 5173;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(\`Server listening on port \${PORT}\`));
}

export default app;
`;

    // 5. Frontend App entrypoint
    files["src/App.tsx"] = `import React, { useState } from "react";
import { Shield, Activity, Users, CreditCard, Calendar } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <h1 className="text-xl font-bold tracking-tight text-emerald-400">${plan.projectName}</h1>
        <div className="text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-mono">
          Live Full-Stack Application
        </div>
      </header>
      <main className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Total Members</div>
            <div className="text-2xl font-bold text-white mt-1">1,248</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Today's Check-ins</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">342</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Monthly Revenue</div>
            <div className="text-2xl font-bold text-white mt-1">$48,250</div>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Active Trainers</div>
            <div className="text-2xl font-bold text-white mt-1">18</div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;
`;

    const apiEndpoints = plan.backend.controllers.map(
      (c) => `/api/${c.replace(".controller.ts", "s")}`
    );

    return {
      projectId: `proj_${Date.now()}`,
      projectName: plan.projectName,
      filesGenerated: files,
      totalFiles: Object.keys(files).length,
      totalDirectories: 5,
      packageDependencies: {
        react: "^18.3.1",
        express: "^4.19.2",
        prisma: "^5.14.0",
      },
      prismaSchemaModels: plan.database.models,
      apiEndpoints,
      createdAt: new Date().toISOString(),
    };
  }
}
