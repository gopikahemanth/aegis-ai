/**
 * UniversalGenerationOrchestrator
 *
 * Synthesizes source files, Prisma database schemas, Express REST controllers,
 * and React components based strictly on the UniversalProductSpecification and ArchitectureBlueprint.
 */

import { type UniversalProductSpecification } from "./universal-requirement-interpreter.js";
import { type UniversalArchitectureBlueprint } from "./universal-architecture-planner.js";

export interface UniversalGeneratedProject {
  projectId: string;
  productName: string;
  domain: string;
  files: Record<string, string>;
  totalFiles: number;
  apiEndpoints: string[];
  dbModels: string[];
  createdAt: string;
}

export class UniversalGenerationOrchestrator {
  public static generateProject(
    spec: UniversalProductSpecification,
    blueprint: UniversalArchitectureBlueprint,
    targetDirectory: string = "./dist/universal-product"
  ): UniversalGeneratedProject {
    const files: Record<string, string> = {};

    // 1. package.json
    files["package.json"] = JSON.stringify(
      {
        name: spec.productName.toLowerCase().replace(/\s+/g, "-"),
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
          express: "^4.19.2",
          "@prisma/client": "^5.14.0",
          jsonwebtoken: "^9.0.2",
          "lucide-react": "^0.378.0",
        },
        devDependencies: {
          vite: "^5.2.11",
          typescript: "^5.4.5",
          prisma: "^5.14.0",
          tsx: "^4.10.5",
          vitest: "^1.6.0",
        },
      },
      null,
      2
    );

    // 2. Prisma Database Schema
    const prismaModels = spec.entities
      .map(
        (ent) => `model ${ent.name} {
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

${prismaModels}
`;

    // 3. Express Server & REST Controllers
    const endpointList: string[] = [];
    const routeRegistrations = spec.entities
      .map((ent) => {
        const ep = `/api/${ent.name.toLowerCase()}s`;
        endpointList.push(ep);
        return `app.use("${ep}", (req, res) => res.json({ entity: "${ent.name}", items: [], status: "OK" }));`;
      })
      .join("\n");

    files["server/index.ts"] = `import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "HEALTHY", domain: "${spec.domain}", uptime: process.uptime() });
});

${routeRegistrations}

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(\`[AEGIS-Universal] Server running on port \${PORT}\`));
}

export default app;
`;

    // 4. React Main App
    files["src/App.tsx"] = `import React, { useState } from "react";
import { Sparkles, Database, Layers, ShieldCheck } from "lucide-react";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">${spec.productName}</h1>
          <p className="text-xs text-slate-400">Domain: ${spec.domain}</p>
        </div>
        <div className="text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full">
          Live Generated Universal Product
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${spec.entities
          .map(
            (ent) => `<div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 font-mono">${ent.name} Module</div>
          <div className="text-sm font-bold text-white mt-1">${ent.description}</div>
        </div>`
          )
          .join("\n        ")}
      </main>
    </div>
  );
};
export default App;
`;

    return {
      projectId: `uproj_${Date.now()}`,
      productName: spec.productName,
      domain: spec.domain,
      files,
      totalFiles: Object.keys(files).length,
      apiEndpoints: endpointList,
      dbModels: spec.entities.map((e) => e.name),
      createdAt: new Date().toISOString(),
    };
  }
}
