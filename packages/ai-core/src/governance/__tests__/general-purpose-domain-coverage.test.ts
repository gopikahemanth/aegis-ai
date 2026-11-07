import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { ContractDrivenDataModelGenerator } from "../contract-driven-data-model-generator.js";
import { PromptManager } from "../../prompts/prompt-manager.js";
import { FastSanitizer } from "../fast-sanitizer.js";

const TEST_BASE_DIR = join(process.cwd(), ".tmp_test_domain_coverage");

describe("AEGIS General-Purpose Generation — 8 Archetypes Coverage Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_BASE_DIR)) rmSync(TEST_BASE_DIR, { recursive: true, force: true });
    mkdirSync(TEST_BASE_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_BASE_DIR)) rmSync(TEST_BASE_DIR, { recursive: true, force: true });
  });

  const archetypes = [
    {
      id: "portfolio",
      name: "Professional Portfolio",
      prompt: "Build a professional portfolio website for a creative software engineer featuring interactive project showcases, technical skills matrix, client testimonials, and a contact message form.",
      expectedModels: ["Project", "Skill", "ContactMessage"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "marketing",
      name: "Marketing & Landing Website",
      prompt: "Create a modern marketing landing website with product feature highlights, pricing plans comparison, customer testimonials, lead capture inquiry form, and interactive demo preview.",
      expectedModels: ["Lead", "Campaign", "Inquiry"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "ecommerce",
      name: "E-Commerce Application",
      prompt: "Build a full-stack e-commerce store to browse products with faceted category filtering, manage shopping cart, process customer orders with discount codes, and track inventory stock.",
      expectedModels: ["Product", "Order", "OrderItem"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "saas_telemetry",
      name: "SaaS Telemetry Dashboard",
      prompt: "Build a multi-tenant SaaS telemetry and observability dashboard to monitor real-time system metrics, configure threshold alert rules, stream log events, and track API response latency.",
      expectedModels: ["Metric", "Alert", "LogEvent"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "booking",
      name: "Appointment & Booking Platform",
      prompt: "Build an appointment booking platform to browse services, select professional providers, schedule time slots with double-booking prevention, and manage appointment cancellations.",
      expectedModels: ["Service", "Appointment", "ScheduleRule"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "healthcare",
      name: "Healthcare Management Application",
      prompt: "Build a healthcare clinic management portal to register patients, schedule doctor consultations, track medical records, and issue prescription summaries with strict role privacy.",
      expectedModels: ["Patient", "Doctor", "Appointment", "MedicalRecord"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "cms",
      name: "Content Management System (CMS)",
      prompt: "Build a content management system where editorial staff can author articles, manage multi-tier categories, assign tags, publish revisions, and moderate reader comments.",
      expectedModels: ["Article", "Category", "Author", "Comment"],
      expectedDb: "PostgreSQL",
    },
    {
      id: "community",
      name: "Social / Community Application",
      prompt: "Build a developer community platform to publish technical discussion posts, upvote community submissions, reply in threaded comments, and maintain user profiles.",
      expectedModels: ["Post", "Comment", "Discussion", "Profile"],
      expectedDb: "PostgreSQL",
    },
  ];

  for (const archetype of archetypes) {
    describe(`Archetype: ${archetype.name}`, () => {
      it("resolves domain-authentic architecture contract without collapsing to generic User", () => {
        const contract = ArchitectureResolver.resolve(archetype.prompt);
        expect(contract.prompt).toBe(archetype.prompt);
        expect(contract.frontend.framework).toBe("React-Vite");
        expect(contract.backend.framework).toBe("Express");
        expect(contract.language).toBe("TypeScript");
        expect(contract.styling).toBe("TailwindCSS");

        // Verify entities extracted match the domain
        const models = contract.requiredModels || [];
        const hasMatchingModel = archetype.expectedModels.some(expected =>
          models.some(m => m.toLowerCase().includes(expected.toLowerCase()))
        );
        expect(hasMatchingModel).toBe(true);

        // Verify models list is not just ["User"]
        expect(models.length).toBeGreaterThan(1);
      });

      it("generates valid Prisma schema with correct SQLite sanitization", () => {
        const contract = ArchitectureResolver.resolve(archetype.prompt);
        const schema = ContractDrivenDataModelGenerator.generatePrismaSchema(contract, "sqlite");

        // Schema must contain generator and sqlite datasource
        expect(schema).toContain('provider = "sqlite"');
        expect(schema).toContain('provider = "prisma-client-js"');

        // SQLite schemas must never contain @db.Text
        expect(schema).not.toContain("@db.Text");

        // Must define domain models
        const hasExpectedEntity = archetype.expectedModels.some(expected =>
          schema.includes(`model ${expected}`) || schema.toLowerCase().includes(`model ${expected.toLowerCase()}`)
        );
        expect(hasExpectedEntity).toBe(true);
      });

      it("extracts domain entities via ContractDrivenDataModelGenerator", () => {
        const derived = ContractDrivenDataModelGenerator.deriveFromPrompt(archetype.prompt, "sqlite");
        expect(derived.models.length).toBeGreaterThan(0);

        const entityNames = derived.models.map(m => m.name.toLowerCase());
        const matched = archetype.expectedModels.some(expected =>
          entityNames.some(name => name.includes(expected.toLowerCase()))
        );
        expect(matched).toBe(true);
      });
    });
  }

  describe("Aegis FastSanitizer Safe Fetch Lifecycle", () => {
    it("injects mock fetch for frontend review when no backend exists", () => {
      const frontendDir = join(TEST_BASE_DIR, "fe_only");
      const srcDir = join(frontendDir, "src");
      mkdirSync(srcDir, { recursive: true });

      const initialMain = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);\n`;
      writeFileSync(join(srcDir, "main.tsx"), initialMain, "utf8");

      FastSanitizer.sanitizeProject(frontendDir);
      const updated = readFileSync(join(srcDir, "main.tsx"), "utf8");
      expect(updated).toContain("__AEGIS_SAFE_FETCH__");
    });

    it("automatically cleans up mock fetch once backend/server exists", () => {
      const fullstackDir = join(TEST_BASE_DIR, "fullstack_app");
      const srcDir = join(fullstackDir, "src");
      const serverDir = join(fullstackDir, "server");
      mkdirSync(srcDir, { recursive: true });
      mkdirSync(serverDir, { recursive: true });

      const mainWithInterceptor = `// Aegis Safe Mock Fetch Interceptor (prevents unhandled 404/504 JSON crashes during frontend-only review)
if (typeof window !== "undefined" && !(window as any).__AEGIS_SAFE_FETCH__) {
  (window as any).__AEGIS_SAFE_FETCH__ = true;
  const _origFetch = window.fetch;
  window.fetch = async (...args: any[]) => {
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
`;
      writeFileSync(join(srcDir, "main.tsx"), mainWithInterceptor, "utf8");
      writeFileSync(join(serverDir, "index.ts"), "console.log('server');", "utf8");

      FastSanitizer.sanitizeProject(fullstackDir);
      const cleaned = readFileSync(join(srcDir, "main.tsx"), "utf8");
      expect(cleaned).not.toContain("__AEGIS_SAFE_FETCH__");
      expect(cleaned).toContain("ReactDOM.createRoot");
    });
  });

  describe("PromptManager Domain-Adaptive Planner Guidance", () => {
    it("generates adaptive frontend task ordering without appointment bias", () => {
      const pm = new PromptManager();
      const prompt = pm.getPlannerPrompt();

      // Must emphasize domain adaptive stages
      expect(prompt).toContain("TASK ORDERING & ADAPTIVE STAGES:");
      expect(prompt).toContain("Interactive transaction / Core domain workflow");
      expect(prompt).toContain("Domain catalog / Primary workspace explorer");

      // Must not constrain all applications to availability calendar / time slots
      expect(prompt).not.toContain("Availability calendar, time slot grid, multi-step booking form");
    });

    it("generates secure, integrated backend planner instructions", () => {
      const pm = new PromptManager();
      const backendPrompt = pm.getPlannerPrompt(undefined, "backend");

      expect(backendPrompt).toContain("MANDATORY AUTHENTICATION & ACCESS CONTROL");
      expect(backendPrompt).toContain("HTTP 401 Unauthorized or 403 Forbidden");
      expect(backendPrompt).toContain("bcrypt");
      expect(backendPrompt).toContain("MANDATORY CLIENT-SERVER INTEGRATION");
    });
  });
});
