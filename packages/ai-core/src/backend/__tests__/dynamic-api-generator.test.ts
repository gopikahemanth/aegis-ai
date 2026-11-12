import { describe, it, expect } from "vitest";
import { DynamicApiGenerator } from "../dynamic-api-generator.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";

describe("Phase 5: DynamicApiGenerator", () => {
  it("should generate a complete backend suite for an e-commerce platform", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Build an online electronics store with products, orders, customers, and checkout"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const vocab = spec.domainVocabulary;

    const files = DynamicApiGenerator.generateAll(contract, vocab);

    expect(files.length).toBeGreaterThanOrEqual(6);

    const paths = files.map(f => f.path);
    expect(paths).toContain("prisma/schema.prisma");
    expect(paths).toContain("server/src/db.ts");
    expect(paths).toContain("prisma/seed.ts");
    expect(paths).toContain("server/src/validators/index.ts");
    expect(paths).toContain("server/src/routes/api.ts");
    expect(paths).toContain("server/src/index.ts");

    // Controllers for models
    expect(paths.some(p => p.includes("Controller.ts"))).toBe(true);

    // Verify Prisma schema content
    const schemaFile = files.find(f => f.path === "prisma/schema.prisma");
    expect(schemaFile?.content).toContain("datasource db");
    expect(schemaFile?.content).toContain("generator client");
    expect(schemaFile?.content).toContain("model ");
    expect(schemaFile?.content).toContain("createdAt");

    // Verify Routes content
    const routesFile = files.find(f => f.path === "server/src/routes/api.ts");
    expect(routesFile?.content).toContain("apiRouter.get('/health'");
    expect(routesFile?.content).toContain("apiRouter.get('/analytics/metrics'");
    expect(routesFile?.content).toContain("Controller.getAll");
    expect(routesFile?.content).toContain("Controller.create");

    // Verify Server entrypoint
    const serverFile = files.find(f => f.path === "server/src/index.ts");
    expect(serverFile?.content).toContain("app.use('/api', apiRouter);");
    expect(serverFile?.content).toContain("cors()");
  });

  it("generates correct Prisma schema datasource provider based on contract", () => {
    const spec = UniversalRequirementInterpreter.interpret("Simple blog engine");
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    // Default sqlite
    const sqliteFiles = DynamicApiGenerator.generateAll(contract);
    const sqliteSchema = sqliteFiles.find(f => f.path === "prisma/schema.prisma");
    expect(sqliteSchema?.content).toContain('provider = "sqlite"');

    // Postgres override
    const pgContract = {
      ...contract,
      database: { ...contract.database, engine: "postgresql" as const },
    };
    const pgFiles = DynamicApiGenerator.generateAll(pgContract);
    const pgSchema = pgFiles.find(f => f.path === "prisma/schema.prisma");
    expect(pgSchema?.content).toContain('provider = "postgresql"');
    expect(pgSchema?.content).toContain('env("DATABASE_URL")');
  });

  it("generates Zod validation schemas with type coercion and optional fields", () => {
    const spec = UniversalRequirementInterpreter.interpret("Task tracker with projects and tasks");
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    const files = DynamicApiGenerator.generateAll(contract);
    const validatorFile = files.find(f => f.path.includes("validators/index.ts"));

    expect(validatorFile).toBeDefined();
    expect(validatorFile?.content).toContain("import { z } from 'zod'");
    expect(validatorFile?.content).toContain("Schema = z.object({");
    expect(validatorFile?.content).toContain(".partial()");
  });
});
