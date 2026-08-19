/**
 * Multi-domain test generation verification for Kanban, Expense Tracker, and ATS
 */

import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { DomainContractDeriver } from "../../governance/domain-contract.js";
import { TestGeneratorAgent } from "../test-generator-agent.js";

describe("Aegis V2.2 Project 1 — Multi-Domain Test Generation Suite", () => {
  it("generates domain-specific tests for Kanban, Expense Tracker, and ATS with zero leakage", async () => {
    const domains = [
      { name: "Kanban", prompt: "Build a modern Task Management Application with a Kanban board, Todo/In Progress/Done columns, task creation with priority and due date, task filtering by priority and status, responsive design, persistent data, and a clean production-ready UI." },
      { name: "Expense Tracker", prompt: "Build a production-ready expense tracking application with categories, transactions, monthly budgets, recurring expenses, filtering, dashboard analytics, and persistent storage." },
      { name: "ATS", prompt: "Build a production-ready resume ATS application that allows users to upload resumes, upload job descriptions, analyze keyword matches, view match results, and track analysis history." },
    ];

    for (const d of domains) {
      const tempDir = join(tmpdir(), `aegis-v22-p1-${d.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      mkdirSync(tempDir, { recursive: true });
      mkdirSync(join(tempDir, "src"), { recursive: true });
      mkdirSync(join(tempDir, "server"), { recursive: true });

      writeFileSync(join(tempDir, "package.json"), JSON.stringify({
        name: d.name.toLowerCase().replace(/\s+/g, "-"),
        dependencies: { react: "^18.2.0", "react-dom": "^18.2.0", express: "^4.19.0" }
      }, null, 2));

      writeFileSync(join(tempDir, "src", "App.tsx"), `import React from "react"; export default function App() { return <div><h1>${d.name} Dashboard</h1><button>Action</button></div>; }`);

      const arch = ArchitectureResolver.resolve(d.prompt);
      const domain = DomainContractDeriver.derive(arch);
      const manifest = await TestGeneratorAgent.generate({
        projectRoot: tempDir,
        domainContract: domain,
        planHash: `hash_${d.name.toLowerCase()}`,
      });

      const uiTest = readFileSync(join(tempDir, "src", "__tests__", "app-flow.test.tsx"), "utf8");
      const serverTest = readFileSync(join(tempDir, "server", "__tests__", "api-health.test.ts"), "utf8");

      expect(manifest.status).toBe("PASS");
      expect(manifest.qualityReport.hasTrivialTests).toBe(false);

      if (d.name !== "ATS") {
        expect(uiTest).not.toContain("Resume");
        expect(serverTest).not.toContain("Resume");
        expect(uiTest).not.toContain("JobDescription");
        expect(serverTest).not.toContain("JobDescription");
      }

      if (d.name === "Expense Tracker") {
        expect(uiTest).not.toContain("Kanban");
        expect(serverTest).not.toContain("Kanban");
      }

      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
