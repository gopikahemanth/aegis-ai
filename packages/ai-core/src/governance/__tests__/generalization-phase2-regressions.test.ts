import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";

const TEST_DIR = join(process.cwd(), "temp-gen-phase2-regressions-test");

describe("Phase 2 Generalization Regressions: Server Route Mounting & Prisma Schema Auto-Repair", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("sanitizes hyphenated route file names into valid JS identifiers when mounting in server/index.ts", () => {
    // Write checkpoint to simulate post-frontend approval
    writeFileSync(
      join(TEST_DIR, ".aegis", "stage-checkpoint.json"),
      JSON.stringify({ currentStage: "FRONTEND_APPROVED" }),
      "utf8"
    );

    // Create hyphenated route file: server/routes/geo-performance.ts
    const routeFile = join(TEST_DIR, "server", "routes", "geo-performance.ts");
    writeFileSync(routeFile, "import { Router } from 'express'; const router = Router(); export default router;");

    // Create server/index.ts that does not have it mounted yet
    const serverIndex = join(TEST_DIR, "server", "index.ts");
    writeFileSync(serverIndex, `import express from 'express';\nconst app = express();\napp.listen(5000);`);

    FastDeterministicSanitizer.sanitizeProject(TEST_DIR);

    const updatedIndex = readFileSync(serverIndex, "utf8");
    // Ensure import does NOT contain illegal hyphenated variable identifier
    expect(updatedIndex).not.toMatch(/import\s+[a-zA-Z0-9_$]+-[a-zA-Z0-9_$]+/);
    // Ensure it was sanitized to geo_performanceRouter_0
    expect(updatedIndex).toContain("geo_performanceRouter_0");
    expect(updatedIndex).toContain(`import geo_performanceRouter_0 from "./routes/geo-performance";`);
    expect(updatedIndex).toContain(`app.use("/api/geo-performance", geo_performanceRouter_0);`);
  });

  it("auto-repairs missing scalar foreign key fields in Prisma schema for P1012 compliance", () => {
    const absSchema = join(TEST_DIR, "prisma", "schema.prisma");
    const badSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  auditLogs AuditLog[]
}

model AuditLog {
  id           String   @id @default(uuid())
  action       String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;
    writeFileSync(absSchema, badSchema, "utf8");

    // Simulate startup agent schema repair logic
    let schemaContent = readFileSync(absSchema, "utf8");
    let schemaModified = false;
    const modelBlocks = schemaContent.split(/(?=model\s+\w+\s*\{)/);

    for (const block of modelBlocks) {
      const mMatch = block.match(/model\s+([A-Za-z0-9_$]+)\s*\{([\s\S]*?)\}/);
      if (mMatch) {
        const mName = mMatch[1];
        const mBody = mMatch[2];
        const relMatches = mBody.matchAll(/@relation\s*\([^)]*fields:\s*\[([^\]]+)\]/g);
        for (const rm of relMatches) {
          const fkFields = rm[1].split(",").map(f => f.trim()).filter(Boolean);
          for (const fkField of fkFields) {
            const hasField = new RegExp(`^\\s*${fkField}\\s+[A-Za-z0-9_$]+`, "m").test(mBody);
            if (!hasField) {
              const targetRegex = new RegExp(`(model\\s+${mName}\\s*\\{[^}]*)(\\})`, "s");
              schemaContent = schemaContent.replace(targetRegex, `$1  ${fkField} String\n$2`);
              schemaModified = true;
            }
          }
        }
      }
    }

    if (schemaModified) {
      writeFileSync(absSchema, schemaContent, "utf8");
    }

    const repaired = readFileSync(absSchema, "utf8");
    expect(repaired).toContain("userId String");
    expect(repaired).toMatch(/model\s+AuditLog\s*\{[\s\S]*userId\s+String[\s\S]*\}/);
  });

  it("injects canonical action callback and collection fallbacks into SafeRouteWrapper in routes.tsx", () => {
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    // Write a sample component expecting onAddToCart and onScheduleTour
    writeFileSync(
      join(TEST_DIR, "src", "pages", "CatalogPage.tsx"),
      `import React from "react";\nexport default function CatalogPage({ onAddToCart, onScheduleTour }: any) { return <button onClick={() => onAddToCart && onAddToCart({})}>Add</button>; }`
    );

    const routesCode = FastDeterministicSanitizer.generateRoutesFromExistingPages(TEST_DIR);
    expect(routesCode).toContain("onAddToCart: () => {}");
    expect(routesCode).toContain("onScheduleTour: () => {}");
    expect(routesCode).toContain("onSaveProperty: () => {}");
    expect(routesCode).toContain("properties: []");
    expect(routesCode).toContain("cart: []");
    expect(routesCode).toContain("function SafeRouteWrapper");
  });
});
