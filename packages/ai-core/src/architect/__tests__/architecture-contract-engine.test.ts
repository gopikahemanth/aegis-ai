import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../architecture-contract-engine.js";

describe("ArchitectureContractEngine — Contract Synthesis & Invariant Locking", () => {
  it("synthesizes a complete locked architecture contract from interpreted specification", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build a real estate marketplace with property listings and buyer tours");
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    expect(contract.version).toBe(2);
    expect(contract.contractHash).toBeDefined();
    expect(contract.contractHash).toHaveLength(64); // SHA-256 hex string

    // Frontend & Backend config
    expect(contract.frontend.framework).toBe("react-vite");
    expect(contract.frontend.port).toBe(5173);
    expect(contract.backend.framework).toBe("express");
    expect(contract.backend.port).toBe(3001);

    // Routes
    expect(contract.routes.frontendRoutes.length).toBeGreaterThanOrEqual(4);
    expect(contract.routes.backendEndpoints.length).toBeGreaterThanOrEqual(4);

    // Data models
    expect(contract.dataModels.models.length).toBeGreaterThan(0);
    expect(contract.directories).toContain("src/components");
  });

  it("produces deterministic contract hashes for identical inputs", () => {
    const specA = UniversalRequirementInterpreter.interpret("Build a sports club membership system");
    const specB = UniversalRequirementInterpreter.interpret("Build a sports club membership system");

    const contractA = ArchitectureContractEngine.synthesizeContract(specA);
    const contractB = ArchitectureContractEngine.synthesizeContract(specB);

    expect(contractA.contractHash).toBe(contractB.contractHash);
  });

  it("validates contract invariants and catches port collisions", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an agricultural sensor dashboard");
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    // Baseline validation should pass
    const validRes = ArchitectureContractEngine.validateContractInvariants(contract);
    expect(validRes.valid).toBe(true);
    expect(validRes.errors).toHaveLength(0);

    // Simulate invalid port collision
    const invalidContract = {
      ...contract,
      frontend: { ...contract.frontend, port: 3001 },
      backend: { ...contract.backend, port: 3001 },
    };

    const invalidRes = ArchitectureContractEngine.validateContractInvariants(invalidContract);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors[0]).toContain("Port conflict");
  });

  it("ensures every domain entity has corresponding backend endpoints", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build a dental clinic appointment scheduling system");
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    for (const entity of spec.entities) {
      if (entity.name === "User") continue;
      const endpoints = contract.routes.backendEndpoints.filter(e => e.entity.toLowerCase() === entity.name.toLowerCase());
      expect(endpoints.length).toBeGreaterThanOrEqual(1);
    }
  });
});
