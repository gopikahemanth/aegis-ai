import { describe, it, expect, beforeEach } from "vitest";
import { AgentContractRegistry, type AgentContract } from "../agent-contract.js";

describe("AgentContractRegistry & AgentVerification", () => {
  beforeEach(() => {
    AgentContractRegistry.reset();
  });

  it("loads all default agent contracts on initialization", () => {
    const contracts = AgentContractRegistry.getAll();
    expect(contracts.length).toBeGreaterThanOrEqual(6);

    expect(AgentContractRegistry.has("REQUIREMENTS_ANALYST")).toBe(true);
    expect(AgentContractRegistry.has("ARCHITECT")).toBe(true);
    expect(AgentContractRegistry.has("TASK_PLANNER")).toBe(true);
    expect(AgentContractRegistry.has("FRONTEND_CODER")).toBe(true);
    expect(AgentContractRegistry.has("BACKEND_CODER")).toBe(true);
    expect(AgentContractRegistry.has("VERIFIER")).toBe(true);
  });

  describe("Requirements Analyst Contract Verification", () => {
    const reqContract = AgentContractRegistry.get("REQUIREMENTS_ANALYST")!;

    it("accepts valid requirements specification", () => {
      const output = {
        name: "test-app",
        type: "ecommerce",
        features: ["Cart", "Checkout"],
      };
      const res = reqContract.verifyOutput(output, {});
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.evidence.featureCount).toBe(2);
    });

    it("rejects specification without features or name", () => {
      const output = {
        type: "ecommerce",
        features: [],
      };
      const res = reqContract.verifyOutput(output, {});
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Missing project name.");
      expect(res.errors).toContain("Features array must contain at least one feature.");
    });
  });

  describe("Architecture Agent Contract Verification", () => {
    const archContract = AgentContractRegistry.get("ARCHITECT")!;

    it("accepts valid architecture declaration", () => {
      const output = {
        architectureHash: "arch_123",
        frontend: { framework: "react-vite" },
        backend: { framework: "express" },
      };
      const res = archContract.verifyOutput(output, {});
      expect(res.valid).toBe(true);
      expect(res.evidence.architectureHash).toBe("arch_123");
    });

    it("rejects empty or null architecture output", () => {
      const res = archContract.verifyOutput(null, {});
      expect(res.valid).toBe(false);
      expect(res.errors).toContain("Architecture plan cannot be null.");
    });
  });

  describe("Task Planner Contract Verification", () => {
    const planContract = AgentContractRegistry.get("TASK_PLANNER")!;

    it("accepts valid tasks array with unique IDs", () => {
      const tasks = [
        { id: 1, title: "DB Setup" },
        { id: 2, title: "API Router" },
      ];
      const res = planContract.verifyOutput(tasks, {});
      expect(res.valid).toBe(true);
      expect(res.evidence.totalTasks).toBe(2);
    });

    it("rejects duplicate task IDs", () => {
      const tasks = [
        { id: 1, title: "Task 1" },
        { id: 1, title: "Task 2 Duplicate" },
      ];
      const res = planContract.verifyOutput(tasks, {});
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes("Duplicate task ID"))).toBe(true);
    });
  });

  describe("Frontend & Backend Coder Boundaries", () => {
    const feContract = AgentContractRegistry.get("FRONTEND_CODER")!;
    const beContract = AgentContractRegistry.get("BACKEND_CODER")!;

    it("enforces frontend coder writing only under allowed directories", () => {
      const validFiles = [{ path: "src/App.tsx" }, { path: "public/favicon.ico" }];
      expect(feContract.verifyOutput(validFiles, {}).valid).toBe(true);

      const invalidFiles = [{ path: "server/routes/users.ts" }];
      const res = feContract.verifyOutput(invalidFiles, {});
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain("Frontend coder attempted to write outside allowed directories");
    });

    it("enforces backend coder not tampering with frontend components", () => {
      const validFiles = [{ path: "server/routes/api.ts" }, { path: "prisma/schema.prisma" }];
      expect(beContract.verifyOutput(validFiles, {}).valid).toBe(true);

      const invalidFiles = [{ path: "src/components/Header.tsx" }];
      const res = beContract.verifyOutput(invalidFiles, {});
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain("Backend coder attempted to modify frontend components");
    });
  });
});
